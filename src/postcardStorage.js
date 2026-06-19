import { supabase } from './supabaseClient.js';
import { resolvePhotoForStorage } from './imageUpload.js';

export const POSTCARD_SHARE_ID_SESSION_KEY = 'postcard:lastShareId';

const SHORT_CODE_RE = /^[A-Za-z0-9]{8}$/;

export function isShortCode(value){
  return typeof value === 'string' && SHORT_CODE_RE.test(value);
}

/** Reads ?id= from URL (value is short_code, 8 characters). */
export function getShareIdFromUrl(url = window.location.href){
  const raw = new URL(url).searchParams.get('id');
  return raw ? raw.trim() : null;
}

export function rememberShareId(shortCode){
  if(!isShortCode(shortCode)) return;
  try {
    sessionStorage.setItem(POSTCARD_SHARE_ID_SESSION_KEY, shortCode);
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveShareId(url = window.location.href){
  const fromUrl = getShareIdFromUrl(url);
  if(isShortCode(fromUrl)) return fromUrl;
  try {
    const stored = sessionStorage.getItem(POSTCARD_SHARE_ID_SESSION_KEY);
    if(isShortCode(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function syncShareIdInUrl(shortCode, url = window.location.href){
  if(!isShortCode(shortCode)) return url;
  const next = new URL(url);
  if(next.searchParams.get('id') === shortCode) return next.href;
  next.searchParams.set('id', shortCode);
  history.replaceState(null, '', next);
  return next.href;
}

export function buildPostcardViewUrl(shortCode, { style } = {}){
  const url = new URL('/postcard-view.html', window.location.origin);
  url.searchParams.set('id', shortCode);
  if(style && style !== 'modern'){
    url.searchParams.set('style', style);
  }
  return url.href;
}

export async function savePostcard(content, { photoBlob } = {}){
  const data = {
    ...content.data,
    photo: await resolvePhotoForStorage(content.data?.photo, photoBlob),
  };
  const payload = {
    ...content,
    data,
  };
  const { data: shortCode, error } = await supabase.rpc('create_postcard', {
    p_content: payload,
  });
  if(error) throw error;
  const code = String(shortCode ?? '').trim();
  if(!isShortCode(code)){
    throw new Error('Postcard was saved but Supabase did not return short_code.');
  }
  rememberShareId(code);
  return code;
}

export async function loadPostcard(shortCode){
  if(!isShortCode(shortCode)){
    return null;
  }
  const { data, error } = await supabase.rpc('get_postcard_by_share_id', {
    p_short_code: shortCode,
  });
  if(error) throw error;
  return data ?? null;
}

// Backward-compatible aliases (URL param is still ?id=, value is short_code).
export const POSTCARD_ID_SESSION_KEY = POSTCARD_SHARE_ID_SESSION_KEY;
export const isShareId = isShortCode;
export const getPostcardIdFromUrl = getShareIdFromUrl;
export const rememberPostcardId = rememberShareId;
export const resolvePostcardId = resolveShareId;
export const syncPostcardIdInUrl = syncShareIdInUrl;
