import { supabase } from './supabaseClient.js';
import { resolvePhotoForStorage } from './imageUpload.js';

export function getPostcardIdFromUrl(url = window.location.href){
  return new URL(url).searchParams.get('id');
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
  const { data: row, error } = await supabase
    .from('postcards')
    .insert({ content: payload })
    .select('id')
    .single();
  if(error) throw error;
  return row.id;
}

export async function loadPostcard(id){
  const { data, error } = await supabase
    .from('postcards')
    .select('content')
    .eq('id', id)
    .maybeSingle();
  if(error) throw error;
  return data?.content ?? null;
}
