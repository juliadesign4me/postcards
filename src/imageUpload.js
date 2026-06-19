import { supabase } from './supabaseClient.js';

/** Max size after resize/compress — what we store and upload. */
export const MAX_COMPRESSED_FILE_SIZE_BYTES = 5 * 1024 * 1024;
/** Max raw upload size before compression — guard against absurd files only. */
export const MAX_INPUT_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
export const JPEG_COMPRESS_QUALITY = 0.8;
export const POSTCARD_IMAGES_BUCKET = 'postcard-images';

export function isDataUrl(value){
  return typeof value === 'string' && value.startsWith('data:image/');
}

export function isRemotePhotoUrl(value){
  return typeof value === 'string'
    && (value.startsWith('http://') || value.startsWith('https://'));
}

export function validateImageFile(file){
  if(!file){
    throw new Error('Файл не обрано.');
  }
  if(!file.type.startsWith('image/')){
    throw new Error('Оберіть файл зображення.');
  }
  if(file.size > MAX_INPUT_FILE_SIZE_BYTES){
    throw new Error('Файл завеликий. Максимальний розмір — 25 МБ.');
  }
}

export function validateCompressedImageSize(blob){
  if(blob.size > MAX_COMPRESSED_FILE_SIZE_BYTES){
    throw new Error('Після стиснення файл все ще завеликий. Спробуйте інше фото.');
  }
}

export async function compressImageFile(file, maxDim = MAX_IMAGE_DIMENSION){
  validateImageFile(file);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if(!ctx){
    bitmap.close();
    throw new Error('Не вдалося обробити зображення.');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const quality = outputType === 'image/jpeg' ? JPEG_COMPRESS_QUALITY : undefined;
  const blob = await new Promise((resolve, reject)=>{
    canvas.toBlob(
      (result)=> result ? resolve(result) : reject(new Error('Не вдалося стиснути зображення.')),
      outputType,
      quality,
    );
  });
  validateCompressedImageSize(blob);
  return blob;
}

function extensionForMime(type){
  if(type === 'image/png') return 'png';
  if(type === 'image/webp') return 'webp';
  if(type === 'image/gif') return 'gif';
  return 'jpg';
}

function dataUrlToBlob(dataUrl){
  const [header, base64] = dataUrl.split(',');
  if(!base64){
    throw new Error('Некоректне зображення.');
  }
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for(let i = 0; i < binary.length; i += 1){
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function uploadPhotoBlob(blob){
  const ext = extensionForMime(blob.type || 'image/jpeg');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(POSTCARD_IMAGES_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });
  if(error) throw error;
  const { data } = supabase.storage.from(POSTCARD_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function resolvePhotoForStorage(photoValue, photoBlob){
  if(photoBlob){
    return uploadPhotoBlob(photoBlob);
  }
  if(!photoValue){
    return null;
  }
  if(isRemotePhotoUrl(photoValue) || photoValue.startsWith('assets/')){
    return photoValue;
  }
  if(isDataUrl(photoValue)){
    return uploadPhotoBlob(dataUrlToBlob(photoValue));
  }
  if(photoValue.startsWith('blob:')){
    const response = await fetch(photoValue);
    if(!response.ok){
      throw new Error('Не вдалося прочитати попередній перегляд фото.');
    }
    return uploadPhotoBlob(await response.blob());
  }
  throw new Error('Фото потрібно завантажити перед збереженням.');
}
