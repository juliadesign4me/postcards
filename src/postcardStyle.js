export const POSTCARD_STYLES = ['modern', 'retro70', 'vintage'];

/** Canonical style id used by PostcardCard (modern | retro70 | vintage). */
export function normalizePostcardStyle(raw){
  if(!raw) return null;
  if(raw === 'modern') return 'modern';
  if(raw === 'retro' || raw === 'retro70') return 'retro70';
  if(raw === 'vintage') return 'vintage';
  return null;
}

/** Style from saved content first; ?style= is fallback for older records only. */
export function resolvePostcardStyle(content, url = window.location.href){
  const fromContent = normalizePostcardStyle(content?.style)
    ?? normalizePostcardStyle(content?.data?.style)
    ?? normalizePostcardStyle(content?.theme);
  if(fromContent) return fromContent;

  const fromUrl = new URL(url).searchParams.get('style');
  return normalizePostcardStyle(fromUrl) ?? 'modern';
}
