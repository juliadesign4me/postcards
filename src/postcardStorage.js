import { supabase } from './supabaseClient.js';
import { resolvePhotoForStorage } from './imageUpload.js';

export const POSTCARD_ID_SESSION_KEY = 'postcard:lastShareId';

export function getPostcardIdFromUrl(url = window.location.href){
  return new URL(url).searchParams.get('id');
}

export function rememberPostcardId(id){
  if(!id || id === 'undefined' || id === 'null') return;
  try {
    sessionStorage.setItem(POSTCARD_ID_SESSION_KEY, String(id));
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolvePostcardId(url = window.location.href){
  const fromUrl = getPostcardIdFromUrl(url);
  if(fromUrl && fromUrl !== 'undefined' && fromUrl !== 'null'){
    return fromUrl;
  }
  try {
    const stored = sessionStorage.getItem(POSTCARD_ID_SESSION_KEY);
    if(stored && stored !== 'undefined' && stored !== 'null'){
      return stored;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function syncPostcardIdInUrl(id, url = window.location.href){
  if(!id) return url;
  const next = new URL(url);
  if(next.searchParams.get('id') === String(id)) return next.href;
  next.searchParams.set('id', String(id));
  history.replaceState(null, '', next);
  return next.href;
}

export function buildPostcardViewUrl(id, { style } = {}){
  const url = new URL('/postcard-view.html', window.location.origin);
  url.searchParams.set('id', String(id));
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
  const { data: inserted, error } = await supabase
    .from('postcards')
    .insert({ content: payload })
    .select('id')
    .single();
  if(error) throw error;
  if(!inserted?.id){
    throw new Error('Postcard was saved but Supabase did not return an id.');
  }
  const id = String(inserted.id);
  rememberPostcardId(id);
  return id;
}

export async function loadPostcard(id){
  if(!id || id === 'undefined' || id === 'null'){
    return null;
  }
  const { data, error } = await supabase
    .from('postcards')
    .select('content')
    .eq('id', id)
    .maybeSingle();
  if(error) throw error;
  return data?.content ?? null;
}
