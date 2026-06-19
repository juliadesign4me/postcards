/* Postcard card component — template slots, real-time text later */
import { CARD_ASSETS } from './postcard-card-assets.js';

const PostcardCard = (() => {
  const W = 826;
  const H = 572;
  const PHOTO = { x: 32, y: 32, w: 762, h: 508, ratio: 762 / 508, radius: 12 };
  const VINTAGE_PHOTO = { x: 35, y: 32, w: 758, h: 506, ratio: 758 / 506, radius: 0 };

  const SLOTS = {
    stampFront: { x: 627, y: 62, w: 137, h: 140 },
    stampBack: { x: 550, y: 405, w: 83, h: 85 },
    postage: { x: 692, y: 70, w: 64, h: 98 },
    stickers: [
      { x: 80, y: 248, w: 96, h: 96 },
      { x: 196, y: 248, w: 96, h: 96 },
      { x: 80, y: 364, w: 96, h: 96 },
      { x: 196, y: 364, w: 96, h: 96 },
    ],
  };

  const ASSET_VERSION = '20250626';

  function withCacheBust(path){
    if(!path || path.startsWith('data:')) return path;
    return path + (path.includes('?') ? '&' : '?') + 'v=' + ASSET_VERSION;
  }

  function styleAssets(id) {
    const style = CARD_ASSETS.style[id] || CARD_ASSETS.style.modern;
    const assets = {
      frontFrame: style.frontFrame,
      frontFrameEmpty: style.frontFrameEmpty,
      backFrame: style.backFrame,
      uploadIcon: style.uploadIcon,
      uploadIconSm: CARD_ASSETS.uploadIconSm,
      postageFrame: style.postageFrame,
    };
    if (id === 'vintage') {
      assets.bgPaper = style.bgPaper;
      assets.innerFrame = style.innerFrame;
    }
    return assets;
  }

  function photoForStyle(styleId) {
    return styleId === 'vintage' ? VINTAGE_PHOTO : PHOTO;
  }

  const MODERN_ASSETS = styleAssets('modern');

  const POSTAGE_OPTIONS = CARD_ASSETS.postage;

  function postageOptionsForStyle(styleId) {
    return (POSTAGE_OPTIONS[styleId] || POSTAGE_OPTIONS.modern).map(withCacheBust);
  }

  const FRONT_STAMP_OPTIONS = CARD_ASSETS.frontStamps;

  const BACK_STAMP_OPTIONS = CARD_ASSETS.backStamps;

  function stampNeedsPlate(src) {
    if (!src) return false;
    const path = src.split('?')[0];
    const name = path.split('/').pop().toLowerCase();
    if (name === 'stamp-2.png' || name === 'stamp-back-2.png') return true;
    if (name === 'stamp-back-ghost.png' || name === 'stamp-front-ref.png') return true;
    if (name === 'stamp-back.png' && path.includes('/modern/')) return true;
    return false;
  }

  function mountStampInSlot(slot, src, opacity) {
    if (!src) return;
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.style.opacity = String(opacity != null ? opacity : 1);
    slot.appendChild(img);
  }

  function drawStampImage(ctx, img, slot, k, opacity) {
    const x = slot.x * k;
    const y = slot.y * k;
    const w = slot.w * k;
    const h = slot.h * k;
    ctx.save();
    ctx.globalAlpha = opacity != null ? opacity : 1;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  function frontStampOptionsForStyle(styleId) {
    return (FRONT_STAMP_OPTIONS[styleId] || FRONT_STAMP_OPTIONS.modern).map(withCacheBust);
  }

  function backStampOptionsForStyle(styleId) {
    return (BACK_STAMP_OPTIONS[styleId] || BACK_STAMP_OPTIONS.modern).map(withCacheBust);
  }

  function ghostStampForStyle(styleId, side) {
    const opts = side === 'front'
      ? frontStampOptionsForStyle(styleId)
      : backStampOptionsForStyle(styleId);
    if (opts.length) return opts[0];
    return side === 'front'
      ? CARD_ASSETS.ghostStampFront
      : CARD_ASSETS.ghostStampBack;
  }

  const STICKER_OPTIONS = CARD_ASSETS.stickers;

  function stickerOptionsForStyle(styleId) {
    return (STICKER_OPTIONS[styleId] || STICKER_OPTIONS.modern).map((option)=>({
      src: withCacheBust(option.src),
      label: option.label,
    }));
  }

  const STYLES = {
    modern: { id: 'modern', label: 'Modern', assets: MODERN_ASSETS },
    retro70: { id: 'retro70', label: 'Retro 70s', assets: styleAssets('retro70') },
    vintage: { id: 'vintage', label: 'Vintage', assets: styleAssets('vintage') },
  };

  const DEFAULT_DATA = {
    titleLine1: '',
    titleLine2: '',
    from: '',
    to: '',
    message: '',
    photo: null,
    stickers: [null, null, null, null],
    stampFront: null,
    stampFrontOpacity: 1,
    stampBack: null,
    stampBackOpacity: 1,
    postageArt: null,
    titleColor: '#0c0c0c',
  };

  const TITLE_HINT_LINE1 = 'Postcard';
  const TITLE_HINT_LINE2 = 'from Vacation';

  const MESSAGE_MAX_LINES = 4;
  const ADDRESS_LINE_WIDTH = 236;
  const MESSAGE_LINE_WIDTH = 346;
  const MESSAGE_FONT = '20px "Homemade Apple", cursive';

  let messageMeasurer;
  function getMessageMeasurer() {
    if (!messageMeasurer && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = MESSAGE_FONT;
      messageMeasurer = (text) => ctx.measureText(text).width;
    }
    return messageMeasurer || ((text) => text.length * 11);
  }

  function normalizeParagraph(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function wrapMessageParagraph(paragraph, measure) {
    const src = normalizeParagraph(paragraph);
    if (!src) return [];

    const lines = [];
    let current = '';

    for (const word of src.split(' ')) {
      const parts = measure(word) > MESSAGE_LINE_WIDTH
        ? breakLongWord(word, measure, MESSAGE_LINE_WIDTH)
        : [word];
      for (const part of parts) {
        const test = current ? current + ' ' + part : part;
        if (measure(test) <= MESSAGE_LINE_WIDTH) {
          current = test;
        } else {
          if (current) lines.push(current);
          current = part;
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function wrapMessageFull(text) {
    const raw = String(text || '');
    if (!raw) return [];

    const measure = getMessageMeasurer();
    const lines = [];
    const paragraphs = raw.split(/\r?\n/);

    for (let pi = 0; pi < paragraphs.length; pi++) {
      const para = paragraphs[pi];
      if (para === '' && pi > 0) {
        lines.push('');
        continue;
      }
      lines.push(...wrapMessageParagraph(para, measure));
    }
    return lines;
  }

  function wrapMessage(text) {
    const lines = wrapMessageFull(text).slice(0, MESSAGE_MAX_LINES);
    while (lines.length < MESSAGE_MAX_LINES) lines.push('');
    return lines;
  }

  function fitMessage(text) {
    const raw = String(text || '');
    if (!raw) return '';

    let lo = 0;
    let hi = raw.length;
    let best = '';

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const slice = raw.slice(0, mid);
      if (wrapMessageFull(slice).length <= MESSAGE_MAX_LINES) {
        best = slice;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return best;
  }

  function breakLongWord(word, measure, lineWidth) {
    const parts = [];
    let chunk = '';
    for (const ch of word) {
      const test = chunk + ch;
      if (measure(test) <= lineWidth) chunk = test;
      else {
        if (chunk) parts.push(chunk);
        chunk = ch;
      }
    }
    if (chunk) parts.push(chunk);
    return parts.length ? parts : [word];
  }

  function getTitleLines(data) {
    const line1 = (data.titleLine1 || '').trim();
    const line2 = (data.titleLine2 || '').trim();
    const hasCustom = Boolean(line1 || line2);
    if (!hasCustom) {
      return {
        line1: TITLE_HINT_LINE1,
        line2: TITLE_HINT_LINE2,
        isHint1: true,
        isHint2: true,
      };
    }
    return {
      line1: line1,
      line2: line2,
      isHint1: false,
      isHint2: false,
    };
  }

  function titleHtml(line1, line2, isHint1, isHint2) {
    const h1 = isHint1 ? ' pc-line-hint' : '';
    const h2 = isHint2 ? ' pc-line-hint' : '';
    let html = '<span class="pc-title-line1' + h1 + '">' + escapeHtml(line1) + '</span>';
    if (line2 || isHint2) {
      html += '<br><span class="pc-underline pc-title-line2' + h2 + '">' + escapeHtml(line2) + '</span>';
    }
    return html;
  }

  const TITLE_FONT = '"Cabin Sketch", cursive';
  const RETRO_TITLE_FONT = '"Great Vibes", cursive';
  const VINTAGE_TITLE_FONT = '"Rye", serif';

  function titleFontFamily(styleId) {
    if (styleId === 'retro70') return RETRO_TITLE_FONT;
    if (styleId === 'vintage') return VINTAGE_TITLE_FONT;
    return TITLE_FONT;
  }

  function resolveFrontTitleColor(styleId, data) {
    const picked = data.titleColor;
    if (styleId === 'retro70') return picked || '#ffe0eb';
    if (styleId === 'vintage') return picked || '#f6eed8';
    return picked || '#0c0c0c';
  }

  const RETRO_DEFAULT_TITLE_COLOR = '#ffe0eb';
  const VINTAGE_DEFAULT_TITLE_COLOR = '#f6eed8';

  let titleFontsReady;
  function ensureTitleFonts(styleId) {
    if (!titleFontsReady && document.fonts && document.fonts.load) {
      const loads = [
        document.fonts.load('400 66px "Cabin Sketch"'),
        document.fonts.load('400 36px "Cabin Sketch"'),
        document.fonts.load('400 80px "Great Vibes"'),
        document.fonts.load('400 40px "Great Vibes"'),
        document.fonts.load('400 50px "Rye"'),
        document.fonts.load('400 28px "Rye"'),
        document.fonts.load('400 16px "Rye"'),
      ];
      titleFontsReady = Promise.all(loads);
    }
    return titleFontsReady || Promise.resolve();
  }

  const _cache = new Map();

  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (_cache.has(src)) return _cache.get(src);
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    _cache.set(src, p);
    return p;
  }

  function mergeData(data) {
    return Object.assign({}, DEFAULT_DATA, data || {});
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function warmFilterAvailable() {
    return typeof RetroFilter !== 'undefined' && RetroFilter.applyWarmToDataUrl;
  }

  function vintageFilterAvailable() {
    return typeof RetroFilter !== 'undefined' && RetroFilter.applyVintageToDataUrl;
  }

  async function resolvePhotoSrc(styleId, photoSrc) {
    if (!photoSrc) return photoSrc;
    const ratio = photoForStyle(styleId).ratio;
    if (styleId === 'retro70' && warmFilterAvailable()) {
      return RetroFilter.applyWarmToDataUrl(photoSrc, ratio);
    }
    if (styleId === 'vintage' && vintageFilterAvailable()) {
      return RetroFilter.applyVintageToDataUrl(photoSrc, ratio);
    }
    return photoSrc;
  }

  function mountFilteredPhoto(img, styleId, photoSrc) {
    if (!photoSrc) return;
    const ratio = photoForStyle(styleId).ratio;
    if (styleId === 'retro70' && warmFilterAvailable()) {
      RetroFilter.applyWarmToDataUrl(photoSrc, ratio)
        .then((url) => {
          if (img.isConnected) img.src = url;
        })
        .catch((err) => {
          console.error('[PostcardCard] warm filter failed', err);
          if (img.isConnected) img.src = photoSrc;
        });
      return;
    }
    if (styleId === 'vintage' && vintageFilterAvailable()) {
      RetroFilter.applyVintageToDataUrl(photoSrc, ratio)
        .then((url) => {
          if (img.isConnected) img.src = url;
        })
        .catch((err) => {
          console.error('[PostcardCard] vintage filter failed', err);
          if (img.isConnected) img.src = photoSrc;
        });
      return;
    }
    img.src = photoSrc;
  }

  function appendVintageBg(root, assets) {
    if (!assets.bgPaper) return;
    const bg = document.createElement('img');
    bg.className = 'pc-vintage-bg';
    bg.src = assets.bgPaper;
    bg.alt = '';
    root.appendChild(bg);
  }

  function appendVintageInnerFrame(root, assets) {
    if (!assets.innerFrame) return;
    const innerFrame = document.createElement('img');
    innerFrame.className = 'pc-vintage-inner-frame';
    innerFrame.src = assets.innerFrame;
    innerFrame.alt = '';
    root.appendChild(innerFrame);
  }

  function buildFrontModern(style, data) {
    const a = style.assets;
    const hasPhoto = Boolean(data.photo);
    const root = document.createElement('div');
    root.className = 'postcard-card postcard-card--modern postcard-card--' + style.id + ' postcard-card--front';
    root.style.width = W + 'px';
    root.style.height = H + 'px';

    if (style.id === 'vintage') appendVintageBg(root, a);

    const photo = document.createElement('div');
    photo.className = 'pc-photo' + (hasPhoto ? '' : ' pc-photo--empty');
    photo.dataset.slot = 'photo';
    if (hasPhoto) {
      const img = document.createElement('img');
      img.alt = '';
      photo.appendChild(img);
      mountFilteredPhoto(img, style.id, data.photo);
      if (style.id === 'retro70') {
        photo.appendChild(Object.assign(document.createElement('div'), {
          className: 'pc-photo-gradient',
        }));
      }
    } else {
      const cta = document.createElement('div');
      cta.className = 'pc-upload-cta';
      cta.innerHTML =
        '<img src="' + a.uploadIcon + '" alt=""><span>upload image</span>';
      photo.appendChild(cta);
    }
    root.appendChild(photo);

    const title = document.createElement('div');
    title.className = 'pc-front-title';
    title.dataset.slot = 'title';
    const t = getTitleLines(data);
    title.innerHTML = titleHtml(t.line1, t.line2, t.isHint1, t.isHint2);
    title.style.fontFamily = titleFontFamily(style.id);
    title.style.fontWeight = (style.id === 'retro70' || style.id === 'vintage') ? '400' : '';
    const frontTitleColor = resolveFrontTitleColor(style.id, data);
    title.style.color = frontTitleColor;
    if (style.id === 'retro70' || style.id === 'vintage') {
      title.style.setProperty('--pc-front-title-color', frontTitleColor);
    }
    root.appendChild(title);

    const stampSlot = document.createElement('div');
    stampSlot.className = 'pc-stamp-slot--front';
    stampSlot.dataset.slot = 'stampFront';
    if (data.stampFront) {
      mountStampInSlot(
        stampSlot,
        data.stampFront,
        data.stampFrontOpacity != null ? data.stampFrontOpacity : 1
      );
    }
    root.appendChild(stampSlot);

    if (style.id === 'vintage') appendVintageInnerFrame(root, a);

    if (style.id !== 'vintage') {
      const frame = document.createElement('img');
      frame.className = 'pc-frame';
      frame.src = hasPhoto ? a.frontFrame : a.frontFrameEmpty;
      frame.alt = '';
      root.appendChild(frame);
    }

    return root;
  }

  function buildBackModern(style, data) {
    const a = style.assets;
    const root = document.createElement('div');
    root.className = 'postcard-card postcard-card--modern postcard-card--' + style.id + ' postcard-card--back';
    root.style.width = W + 'px';
    root.style.height = H + 'px';

    if (style.id === 'vintage') appendVintageBg(root, a);

    const inner = document.createElement('div');
    inner.className = 'pc-back-inner';

    inner.appendChild(Object.assign(document.createElement('div'), {
      className: 'pc-back-divider',
    }));

    const title = document.createElement('div');
    title.className = 'pc-back-title';
    title.dataset.slot = 'title';
    const t = getTitleLines(data);
    title.innerHTML = titleHtml(t.line1, t.line2, t.isHint1, t.isHint2);
    title.style.fontFamily = titleFontFamily(style.id);
    title.style.fontWeight = (style.id === 'retro70' || style.id === 'vintage') ? '400' : '';
    if (style.id === 'retro70') title.style.color = '#0c0c0c';
    if (style.id === 'vintage') title.style.color = '#000';
    inner.appendChild(title);

    const stickers = document.createElement('div');
    stickers.className = 'pc-stickers';
    (data.stickers || [null, null, null, null]).forEach((src, i) => {
      const slot = document.createElement('div');
      slot.className = 'pc-sticker-slot' + (src ? '' : ' pc-sticker-slot--empty');
      slot.dataset.slot = 'sticker-' + i;
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        slot.appendChild(img);
      } else {
        const up = document.createElement('img');
        up.className = 'pc-slot-upload';
        up.src = a.uploadIconSm;
        up.alt = '';
        slot.appendChild(up);
      }
      stickers.appendChild(slot);
    });
    inner.appendChild(stickers);

    const address = document.createElement('div');
    address.className = 'pc-address';
    address.innerHTML = fieldHtml('From:', data.from, 'from') + fieldHtml('To:', data.to, 'to');
    inner.appendChild(address);

    const lines = document.createElement('div');
    lines.className = 'pc-message-lines';
    lines.dataset.slot = 'message-lines';
    lines.innerHTML =
      '<span class="pc-line"></span><span class="pc-line"></span>' +
      '<span class="pc-line"></span><span class="pc-line"></span>';
    inner.appendChild(lines);

    const msgLines = wrapMessage(data.message);
    const message = document.createElement('div');
    message.className = 'pc-message';
    message.dataset.slot = 'message';
    msgLines.forEach((line) => {
      const row = document.createElement('div');
      row.className = 'pc-message-row';
      if (line) {
        const text = document.createElement('span');
        text.className = 'pc-message-text';
        text.textContent = line;
        row.appendChild(text);
      }
      message.appendChild(row);
    });
    inner.appendChild(message);

    const postage = document.createElement('div');
    postage.className = 'pc-postage-slot' + (data.postageArt ? '' : ' pc-postage-slot--empty');
    postage.dataset.slot = 'postageArt';

    const postageFrame = document.createElement('img');
    postageFrame.className = 'pc-postage-frame';
    postageFrame.src = a.postageFrame;
    postageFrame.alt = '';
    postage.appendChild(postageFrame);

    if (data.postageArt) {
      const art = document.createElement('img');
      art.className = 'pc-postage-art';
      art.src = data.postageArt;
      art.alt = '';
      postage.appendChild(art);
    } else {
      const innerPad = document.createElement('div');
      innerPad.className = 'pc-postage-inner';
      const up = document.createElement('img');
      up.className = 'pc-slot-upload';
      up.src = a.uploadIconSm;
      up.alt = '';
      innerPad.appendChild(up);
      postage.appendChild(innerPad);
    }
    inner.appendChild(postage);

    const stampSlot = document.createElement('div');
    stampSlot.className = 'pc-stamp-slot--back';
    stampSlot.dataset.slot = 'stampBack';
    if (data.stampBack) {
      mountStampInSlot(
        stampSlot,
        data.stampBack,
        data.stampBackOpacity != null ? data.stampBackOpacity : 1
      );
    }
    inner.appendChild(stampSlot);

    root.appendChild(inner);

    if (style.id !== 'vintage') {
      const frame = document.createElement('img');
      frame.className = 'pc-frame';
      frame.src = a.backFrame;
      frame.alt = '';
      root.appendChild(frame);
    }

    return root;
  }

  function fieldHtml(label, value, slot) {
    const val = value
      ? '<span class="pc-handwriting">' + escapeHtml(value) + '</span>'
      : '<span class="pc-handwriting" data-slot="' + slot + '"></span>';
    return (
      '<div class="pc-field">' +
      '<label>' + escapeHtml(label) + '</label>' +
      val +
      '<span class="pc-line"></span>' +
      '</div>'
    );
  }

  function createElement(styleId, side, data) {
    const style = STYLES[styleId];
    if (!style || !style.assets) throw new Error('Style not implemented: ' + styleId);
    const d = mergeData(data);
    if (side === 'front') return buildFrontModern(style, d);
    if (side === 'back') return buildBackModern(style, d);
    throw new Error('Unknown side: ' + side);
  }

  function drawCover(ctx, img, dx, dy, dw, dh) {
    const srcRatio = img.width / img.height;
    const dstRatio = dw / dh;
    let sw, sh, sx, sy;
    if (srcRatio > dstRatio) {
      sh = img.height;
      sw = sh * dstRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / dstRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTitle(ctx, k, side, data, styleId) {
    const t = getTitleLines(data);
    const hintOpacity = side === 'front' ? 0.3 : 0.2;
    const isRetro = styleId === 'retro70';
    const isVintage = styleId === 'vintage';
    ctx.save();
    if (isVintage) {
      const color = side === 'front'
        ? resolveFrontTitleColor(styleId, data)
        : '#000000';
      const size = side === 'front' ? 50 : 28;
      const lh = side === 'front' ? 56 : 36;
      const y = side === 'front' ? 380 : 80;
      ctx.font = Math.round(size * k) + 'px "Rye", serif';
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      const line1 = t.line1.toUpperCase();
      const line2Text = t.line2 || (t.isHint2 ? TITLE_HINT_LINE2 : '');
      ctx.globalAlpha = t.isHint1 ? hintOpacity : 1;
      ctx.fillText(line1, 80 * k, y * k);
      if (line2Text || t.isHint2) {
        const line2 = line2Text.toUpperCase();
        ctx.globalAlpha = t.isHint2 ? hintOpacity : 1;
        ctx.fillText(line2, 80 * k, (y + lh) * k);
        const destW = ctx.measureText(line2).width;
        ctx.beginPath();
        ctx.moveTo(80 * k, (y + lh * 2) * k);
        ctx.lineTo(80 * k + destW, (y + lh * 2) * k);
        ctx.lineWidth = (side === 'front' ? 2 : 1.4) * k;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (isRetro) {
      const color = side === 'front'
        ? resolveFrontTitleColor(styleId, data)
        : '#0c0c0c';
      const font = RETRO_TITLE_FONT;
      if (side === 'front') {
        const lineH = 80 * k;
        const anchorY = (H - 80) * k;
        const hasLine2 = t.line2 || t.isHint2;
        ctx.translate(80 * k, anchorY);
        ctx.rotate(-10 * Math.PI / 180);
        ctx.font = Math.round(80 * k) + 'px ' + font;
        ctx.fillStyle = color;
        ctx.textBaseline = 'bottom';
        ctx.globalAlpha = t.isHint1 ? hintOpacity : 1;
        ctx.fillText(t.line1, 0, hasLine2 ? -lineH : 0);
        if (hasLine2) {
          ctx.globalAlpha = t.isHint2 ? hintOpacity : 1;
          ctx.fillText(t.line2, 0, 0);
          const destW = ctx.measureText(t.line2).width;
          ctx.beginPath();
          ctx.moveTo(0, 4 * k);
          ctx.lineTo(destW, 4 * k);
          ctx.lineWidth = 2 * k;
          ctx.strokeStyle = color;
          ctx.globalAlpha = 1;
          ctx.stroke();
        }
      } else {
        ctx.translate(80 * k, 80 * k);
        ctx.rotate(-10 * Math.PI / 180);
        ctx.font = Math.round(40 * k) + 'px ' + font;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.globalAlpha = t.isHint1 ? hintOpacity : 1;
        ctx.fillText(t.line1, 0, 0);
        if (t.line2 || t.isHint2) {
          ctx.globalAlpha = t.isHint2 ? hintOpacity : 1;
          ctx.fillText(t.line2, 0, 40 * k);
          const destW = ctx.measureText(t.line2).width;
          ctx.beginPath();
          ctx.moveTo(0, 40 * k + 2 * k);
          ctx.lineTo(destW, 40 * k + 2 * k);
          ctx.lineWidth = 1.4 * k;
          ctx.strokeStyle = color;
          ctx.globalAlpha = 1;
          ctx.stroke();
        }
      }
      ctx.restore();
      return;
    }

    const color = data.titleColor || (side === 'front' ? '#0c0c0c' : '#fff');
    if (side === 'front') {
      const x = 80 * k;
      const y1 = 360 * k;
      const lh = 66 * k;
      ctx.font = Math.round(66 * k) + 'px ' + TITLE_FONT;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      ctx.globalAlpha = t.isHint1 ? hintOpacity : 1;
      ctx.fillText(t.line1, x, y1);
      if (t.line2 || t.isHint2) {
        ctx.globalAlpha = t.isHint2 ? hintOpacity : 1;
        ctx.fillText(t.line2, x, y1 + lh);
        const destW = ctx.measureText(t.line2).width;
        ctx.beginPath();
        ctx.moveTo(x, y1 + lh + 4 * k);
        ctx.lineTo(x + destW, y1 + lh + 4 * k);
        ctx.lineWidth = 2 * k;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
    } else {
      const x = 80 * k;
      const y1 = 80 * k;
      const lh = 38 * k;
      ctx.font = Math.round(36 * k) + 'px ' + TITLE_FONT;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      ctx.globalAlpha = t.isHint1 ? hintOpacity : 1;
      ctx.fillText(t.line1, x, y1);
      if (t.line2 || t.isHint2) {
        ctx.globalAlpha = t.isHint2 ? hintOpacity : 1;
        ctx.fillText(t.line2, x, y1 + lh);
        const destW = ctx.measureText(t.line2).width;
        ctx.beginPath();
        ctx.moveTo(x, y1 + lh + lh - 2 * k);
        ctx.lineTo(x + destW, y1 + lh + lh - 2 * k);
        ctx.lineWidth = 1.4 * k;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  async function renderFrontModern(style, data, scale) {
    const a = style.assets;
    const d = mergeData(data);
    const s = scale || 1;
    const cw = Math.round(W * s);
    const ch = Math.round(H * s);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const k = s;
    const slot = photoForStyle(style.id);

    if (style.id === 'vintage' && a.bgPaper) {
      const bg = await loadImage(a.bgPaper);
      ctx.drawImage(bg, 0, 0, cw, ch);
    }

    const px = slot.x * k;
    const py = slot.y * k;
    const pw = slot.w * k;
    const ph = slot.h * k;
    const pr = slot.radius * k;

    const frameSrc = d.photo ? a.frontFrame : a.frontFrameEmpty;
    const frame = style.id !== 'vintage' ? await loadImage(frameSrc) : null;

    if (frame) ctx.drawImage(frame, 0, 0, cw, ch);

    if (d.photo) {
      const photoSrc = await resolvePhotoSrc(style.id, d.photo);
      const photo = await loadImage(photoSrc);
      ctx.save();
      if (pr > 0) {
        drawRoundedRect(ctx, px, py, pw, ph, pr);
        ctx.clip();
      }
      drawCover(ctx, photo, px, py, pw, ph);
      if (style.id === 'retro70') {
        const g = ctx.createLinearGradient(px, py, px + pw * 0.9, py + ph * 0.55);
        g.addColorStop(0, 'rgba(0, 0, 0, 0.16)');
        g.addColorStop(0.535, 'rgba(6, 6, 6, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(px, py, pw, ph);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = '#d4d4d4';
      if (pr > 0) {
        drawRoundedRect(ctx, px, py, pw, ph, pr);
        ctx.fill();
      } else {
        ctx.fillRect(px, py, pw, ph);
      }
    }

    if (style.id === 'vintage' && a.innerFrame) {
      const innerFrame = await loadImage(a.innerFrame);
      ctx.drawImage(innerFrame, 34.67 * k, 31.69 * k, 758.62 * k, 506.739 * k);
    }

    await ensureTitleFonts(style.id);
    drawTitle(ctx, k, 'front', d, style.id);

    if (d.stampFront) {
      const stamp = await loadImage(d.stampFront);
      drawStampImage(
        ctx,
        stamp,
        SLOTS.stampFront,
        k,
        d.stampFrontOpacity != null ? d.stampFrontOpacity : 1
      );
    }

    return canvas;
  }

  async function renderBackModern(style, data, scale) {
    const d = mergeData(data);
    const a = style.assets;
    const isRetro = style.id === 'retro70';
    const isVintage = style.id === 'vintage';
    const isStyled = isRetro || isVintage;
    const s = scale || 1;
    const cw = Math.round(W * s);
    const ch = Math.round(H * s);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const k = s;

    if (isVintage && a.bgPaper) {
      const bg = await loadImage(a.bgPaper);
      ctx.drawImage(bg, 0, 0, cw, ch);
    } else if (!isVintage) {
      const frame = await loadImage(a.backFrame);
      ctx.drawImage(frame, 0, 0, cw, ch);
    }

    if (!isVintage) {
      ctx.strokeStyle = isRetro ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.4 * k;
      ctx.setLineDash([6 * k, 4 * k]);
      ctx.strokeRect(32 * k, 32 * k, 762 * k, 508 * k);
      ctx.setLineDash([]);
    }

    ctx.fillStyle = isStyled ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.35)';
    ctx.fillRect((32 + 326) * k, (32 + 73) * k, 1.4 * k, 362 * k);

    await ensureTitleFonts(style.id);
    drawTitle(ctx, k, 'back', d, style.id);

    SLOTS.stickers.forEach((pos, i) => {
      const src = (d.stickers || [])[i];
      if (src) return;
      ctx.strokeStyle = isStyled ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.4 * k;
      ctx.setLineDash([4 * k, 4 * k]);
      ctx.strokeRect(pos.x * k, pos.y * k, pos.w * k, pos.h * k);
      ctx.setLineDash([]);
    });
    for (let i = 0; i < (d.stickers || []).length; i++) {
      const src = d.stickers[i];
      if (!src) continue;
      const sticker = await loadImage(src);
      const pos = SLOTS.stickers[i];
      ctx.drawImage(sticker, pos.x * k, pos.y * k, pos.w * k, pos.h * k);
    }

    ctx.font = Math.round((isVintage ? 16 : 20) * k) + 'px ' + (isVintage ? '"Rye", serif' : 'Inter, sans-serif');
    ctx.fillStyle = isStyled ? '#282828' : '#fff';
    ctx.textBaseline = 'top';
    if (isVintage) {
      ctx.fillText('FROM:', 418 * k, 153 * k);
      ctx.fillText('TO:', 418 * k, 202 * k);
    } else {
      ctx.fillText('From:', 418 * k, 153 * k);
      ctx.fillText('To:', 418 * k, 202 * k);
    }

    if (d.from || d.to) {
      ctx.font = Math.round(20 * k) + 'px "Homemade Apple", cursive';
      ctx.fillStyle = isVintage ? '#141964' : (isRetro ? '#141ea9' : '#fff');
      if (d.from) ctx.fillText(d.from, 492 * k, 153 * k);
      if (d.to) ctx.fillText(d.to, 492 * k, 202 * k);
    }

    ctx.fillStyle = isStyled ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.35)';
    ctx.fillRect(418 * k, 186 * k, ADDRESS_LINE_WIDTH * k, 1.4 * k);
    ctx.fillRect(418 * k, 235 * k, ADDRESS_LINE_WIDTH * k, 1.4 * k);
    [300, 340, 380, 420].forEach((y) => {
      ctx.fillRect(418 * k, y * k, MESSAGE_LINE_WIDTH * k, 1.4 * k);
    });

    const messageLineH = isVintage ? 38 : 40;
    wrapMessage(d.message).forEach((line, i) => {
      if (!line) return;
      ctx.font = Math.round(20 * k) + 'px "Homemade Apple", cursive';
      ctx.fillStyle = isVintage ? '#141964' : (isRetro ? '#141ea9' : '#fff');
      ctx.fillText(line, 418 * k, (267 + i * messageLineH) * k);
    });

    const postageFrameRect = isRetro
      ? { x: 684, y: 62, w: 80, h: 112 }
      : isVintage
        ? { x: 686, y: 60, w: 80, h: 106 }
        : { x: SLOTS.postage.x, y: SLOTS.postage.y, w: SLOTS.postage.w, h: SLOTS.postage.h };
    const postageFrame = await loadImage(a.postageFrame);
    ctx.drawImage(
      postageFrame,
      postageFrameRect.x * k,
      postageFrameRect.y * k,
      postageFrameRect.w * k,
      postageFrameRect.h * k
    );
    const artX = (isRetro ? SLOTS.postage.x : isVintage ? 698 : SLOTS.postage.x + SLOTS.postage.w * 0.1) * k;
    const artY = (isRetro ? SLOTS.postage.y : isVintage ? 64 : SLOTS.postage.y + SLOTS.postage.h * 0.07) * k;
    const artW = (isRetro ? SLOTS.postage.w : isVintage ? 64 : SLOTS.postage.w * 0.8) * k;
    const artH = (isRetro ? SLOTS.postage.h : isVintage ? 98 : SLOTS.postage.h * 0.87) * k;
    if (d.postageArt) {
      const art = await loadImage(d.postageArt);
      ctx.drawImage(art, artX, artY, artW, artH);
    } else {
      ctx.fillStyle = '#d9d9d9';
      ctx.fillRect(artX, artY, artW, artH);
    }

    if (d.stampBack) {
      const stamp = await loadImage(d.stampBack);
      drawStampImage(
        ctx,
        stamp,
        SLOTS.stampBack,
        k,
        d.stampBackOpacity != null ? d.stampBackOpacity : 1
      );
    }

    return canvas;
  }

  async function render(styleId, side, data, scale) {
    const style = STYLES[styleId];
    if (!style || !style.assets) throw new Error('Style not implemented: ' + styleId);
    if (side === 'front') return renderFrontModern(style, data, scale);
    if (side === 'back') return renderBackModern(style, data, scale);
    throw new Error('Unknown side: ' + side);
  }

  async function toDataURL(styleId, side, data, scale, type) {
    const canvas = await render(styleId, side, data, scale);
    return canvas.toDataURL(type || 'image/png');
  }

  function postageFrameForStyle(styleId) {
    if(styleId === 'modern') return withCacheBust(CARD_ASSETS.postageFrameSmall);
    return withCacheBust(CARD_ASSETS.postageFrameByStyle[styleId] || CARD_ASSETS.postageFrameByStyle.modern);
  }

  return {
    W,
    H,
    PHOTO,
    SLOTS,
    STYLES,
    POSTAGE_OPTIONS,
    postageOptionsForStyle,
    FRONT_STAMP_OPTIONS,
    BACK_STAMP_OPTIONS,
    frontStampOptionsForStyle,
    backStampOptionsForStyle,
    ghostStampForStyle,
    stampNeedsPlate,
    postageFrameForStyle,
    withCacheBust,
    ASSET_VERSION,
    STICKER_OPTIONS,
    stickerOptionsForStyle,
    DEFAULT_DATA,
    TITLE_HINT_LINE1,
    TITLE_HINT_LINE2,
    MESSAGE_MAX_LINES,
    ADDRESS_LINE_WIDTH,
    MESSAGE_LINE_WIDTH,
    getTitleLines,
    wrapMessage,
    fitMessage,
    createElement,
    render,
    toDataURL,
    loadImage,
    resolveFrontTitleColor,
    RETRO_DEFAULT_TITLE_COLOR,
    VINTAGE_DEFAULT_TITLE_COLOR,
  };
})();

export default PostcardCard;

if(typeof window !== 'undefined'){
  window.PostcardCard = PostcardCard;
}
