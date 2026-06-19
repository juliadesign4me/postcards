import { supabase } from './supabaseClient.js';
import { resolvePhotoForStorage } from './imageUpload.js';

export const POSTCARD_SHARE_ID_SESSION_KEY = 'postcard:lastShareId';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isShareId(value){
  return typeof value === 'string' && UUID_RE.test(value);
}

/** Reads ?id= from URL (value is share_id UUID, not numeric id). */
export function getShareIdFromUrl(url = window.location.href){
  return new URL(url).searchParams.get('id');
}

export function rememberShareId(shareId){
  if(!isShareId(shareId)) return;
  try {
    sessionStorage.setItem(POSTCARD_SHARE_ID_SESSION_KEY, shareId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveShareId(url = window.location.href){
  const fromUrl = getShareIdFromUrl(url);
  if(isShareId(fromUrl)) return fromUrl;
  try {
    const stored = sessionStorage.getItem(POSTCARD_SHARE_ID_SESSION_KEY);
    if(isShareId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function syncShareIdInUrl(shareId, url = window.location.href){
  if(!isShareId(shareId)) return url;
  const next = new URL(url);
  if(next.searchParams.get('id') === shareId) return next.href;
  next.searchParams.set('id', shareId);
  history.replaceState(null, '', next);
  return next.href;
}

export function buildPostcardViewUrl(shareId, { style } = {}){
  const url = new URL('/postcard-view.html', window.location.origin);
  url.searchParams.set('id', shareId);
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
  const { data: shareId, error } = await supabase.rpc('create_postcard', {
    p_content: payload,
  });
  if(!error && isShareId(shareId)){
    rememberShareId(shareId);
    return shareId;
  }
  if(error?.code !== 'PGRST202'){
    throw error ?? new Error('Postcard was saved but Supabase did not return share_id.');
  }
  const { data: inserted, error: insertError } = await supabase
    .from('postcards')
    .insert({ content: payload })
    .select('share_id')
    .single();
  if(insertError) throw insertError;
  if(!isShareId(inserted?.share_id)){
    throw new Error('Postcard was saved but Supabase did not return share_id.');
  }
  rememberShareId(inserted.share_id);
  return inserted.share_id;
}

export async function loadPostcard(shareId){
  if(!isShareId(shareId)){
    return null;
  }
  const { data, error } = await supabase.rpc('get_postcard_by_share_id', {
    p_share_id: shareId,
  });
  if(!error) return data ?? null;
  if(error.code !== 'PGRST202') throw error;
  const { data: row, error: selectError } = await supabase
    .from('postcards')
    .select('content')
    .eq('share_id', shareId)
    .maybeSingle();
  if(selectError) throw selectError;
  return row?.content ?? null;
}

// Backward-compatible aliases (URL param is still ?id=, value is share_id).
export const POSTCARD_ID_SESSION_KEY = POSTCARD_SHARE_ID_SESSION_KEY;
export const getPostcardIdFromUrl = getShareIdFromUrl;
export const rememberPostcardId = rememberShareId;
export const resolvePostcardId = resolveShareId;
export const syncPostcardIdInUrl = syncShareIdInUrl;
