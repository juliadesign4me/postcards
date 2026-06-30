import {
  MAX_COMPRESSED_FILE_SIZE_BYTES,
  MAX_IMAGE_DIMENSION,
  validateCompressedImageSize,
} from './imageUpload.js';

const STYLE_ID = 'photo-crop-styles';

function ensureStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.photo-crop-modal{
  position:fixed;
  inset:0;
  z-index:10000;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:16px;
  box-sizing:border-box;
}
.photo-crop-modal__backdrop{
  position:absolute;
  inset:0;
  background:rgba(0,0,0,0.72);
}
.photo-crop-modal__panel{
  position:relative;
  z-index:1;
  width:min(100%,520px);
  max-height:min(92dvh,720px);
  display:flex;
  flex-direction:column;
  gap:12px;
  background:#fff;
  border-radius:16px;
  padding:16px;
  box-shadow:0 24px 64px rgba(0,0,0,0.28);
}
.photo-crop-modal__title{
  margin:0;
  font:500 16px/1.3 Inter,system-ui,sans-serif;
  color:#0c0c0c;
  text-align:center;
}
.photo-crop-modal__stage{
  position:relative;
  flex:1 1 auto;
  min-height:240px;
  height:min(52dvh,420px);
  overflow:hidden;
  border-radius:12px;
  background:#111;
  touch-action:none;
  user-select:none;
  -webkit-user-select:none;
  -webkit-touch-callout:none;
}
.photo-crop-modal__image{
  position:absolute;
  top:0;
  left:0;
  max-width:none;
  pointer-events:none;
  will-change:transform,width,height,left,top;
}
.photo-crop-modal__crop-box{
  position:absolute;
  box-sizing:border-box;
  border:2px solid #fff;
  box-shadow:0 0 0 9999px rgba(0,0,0,0.52);
  pointer-events:none;
  z-index:2;
}
.photo-crop-modal__hint{
  margin:0;
  font:400 13px/1.35 Inter,system-ui,sans-serif;
  color:#666;
  text-align:center;
}
.photo-crop-modal__actions{
  display:flex;
  gap:10px;
}
.photo-crop-modal__btn{
  flex:1;
  min-height:44px;
  border-radius:999px;
  border:1px solid rgba(0,0,0,0.12);
  background:#fff;
  color:#0c0c0c;
  font:500 15px/1 Inter,system-ui,sans-serif;
  cursor:pointer;
}
.photo-crop-modal__btn--primary{
  background:#0c0c0c;
  border-color:#0c0c0c;
  color:#fff;
}
.photo-crop-modal__btn:focus-visible{
  outline:2px solid #141ea9;
  outline-offset:2px;
}
@media (max-width:480px){
  .photo-crop-modal{padding:0;}
  .photo-crop-modal__panel{
    width:100%;
    max-height:100dvh;
    height:100dvh;
    border-radius:0;
    padding:12px 12px calc(12px + env(safe-area-inset-bottom));
  }
  .photo-crop-modal__stage{
    min-height:200px;
    height:calc(100dvh - 160px);
  }
}
`;
  document.head.appendChild(style);
}

function clamp(value, min, max){
  return Math.min(max, Math.max(min, value));
}

function loadImage(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=> resolve(img);
    img.onerror = ()=> reject(new Error('Could not load image for cropping.'));
    img.src = src;
  });
}

function canvasToBlob(canvas, type, quality){
  return new Promise((resolve, reject)=>{
    canvas.toBlob(
      (blob)=> blob ? resolve(blob) : reject(new Error('Could not export cropped image.')),
      type,
      quality,
    );
  });
}

function computeCropRect(stageRect, aspectRatio){
  const padding = 12;
  const maxW = Math.max(120, stageRect.width - padding * 2);
  const maxH = Math.max(120, stageRect.height - padding * 2);
  let width = maxW;
  let height = width / aspectRatio;
  if(height > maxH){
    height = maxH;
    width = height * aspectRatio;
  }
  return {
    left: (stageRect.width - width) / 2,
    top: (stageRect.height - height) / 2,
    width,
    height,
  };
}

function restrictPosition(position, zoom, naturalWidth, naturalHeight, cropRect, stageRect){
  const mediaW = naturalWidth * zoom;
  const mediaH = naturalHeight * zoom;
  const centerX = stageRect.width / 2;
  const centerY = stageRect.height / 2;
  const minX = cropRect.left + cropRect.width - centerX - mediaW / 2;
  const maxX = cropRect.left - centerX + mediaW / 2;
  const minY = cropRect.top + cropRect.height - centerY - mediaH / 2;
  const maxY = cropRect.top - centerY + mediaH / 2;
  return {
    x: clamp(position.x, minX, maxX),
    y: clamp(position.y, minY, maxY),
  };
}

function computeNaturalCrop(image, zoom, position, cropRect, stageRect){
  const mediaW = image.naturalWidth * zoom;
  const mediaH = image.naturalHeight * zoom;
  const centerX = stageRect.width / 2;
  const centerY = stageRect.height / 2;
  const mediaLeft = centerX + position.x - mediaW / 2;
  const mediaTop = centerY + position.y - mediaH / 2;
  const x = (cropRect.left - mediaLeft) / zoom;
  const y = (cropRect.top - mediaTop) / zoom;
  const width = cropRect.width / zoom;
  const height = cropRect.height / zoom;
  return {
    x: clamp(x, 0, Math.max(0, image.naturalWidth - 1)),
    y: clamp(y, 0, Math.max(0, image.naturalHeight - 1)),
    width: clamp(width, 1, image.naturalWidth),
    height: clamp(height, 1, image.naturalHeight),
  };
}

async function exportCroppedBlob(image, crop){
  const srcX = Math.round(crop.x);
  const srcY = Math.round(crop.y);
  const srcW = Math.min(Math.round(crop.width), image.naturalWidth - srcX);
  const srcH = Math.min(Math.round(crop.height), image.naturalHeight - srcY);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if(!ctx){
    throw new Error('Could not export cropped image.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  let quality = 0.92;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  while(blob.size > MAX_COMPRESSED_FILE_SIZE_BYTES && quality > 0.5){
    quality -= 0.08;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }
  validateCompressedImageSize(blob);
  return blob;
}

/**
 * Open a mobile-friendly crop dialog. Resolves cropped JPEG blob, or null if cancelled.
 */
export async function openPhotoCropper({ imageSrc, aspectRatio }){
  ensureStyles();
  const image = await loadImage(imageSrc);
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  if(!naturalWidth || !naturalHeight){
    throw new Error('Invalid image dimensions.');
  }

  const modal = document.createElement('div');
  modal.className = 'photo-crop-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'photoCropTitle');
  modal.innerHTML = `
    <div class="photo-crop-modal__backdrop" data-action="cancel"></div>
    <div class="photo-crop-modal__panel">
      <h2 class="photo-crop-modal__title" id="photoCropTitle">Crop your photo</h2>
      <div class="photo-crop-modal__stage">
        <img class="photo-crop-modal__image" alt="" draggable="false" />
        <div class="photo-crop-modal__crop-box" aria-hidden="true"></div>
      </div>
      <p class="photo-crop-modal__hint">Drag to reposition. Pinch or scroll to zoom.</p>
      <div class="photo-crop-modal__actions">
        <button type="button" class="photo-crop-modal__btn" data-action="cancel">Cancel</button>
        <button type="button" class="photo-crop-modal__btn photo-crop-modal__btn--primary" data-action="confirm">Use photo</button>
      </div>
    </div>
  `;

  const stage = modal.querySelector('.photo-crop-modal__stage');
  const imgEl = modal.querySelector('.photo-crop-modal__image');
  const cropBox = modal.querySelector('.photo-crop-modal__crop-box');
  imgEl.src = imageSrc;

  let cropRect = { left: 0, top: 0, width: 0, height: 0 };
  let stageRect = { width: 0, height: 0 };
  let zoom = 1;
  let minZoom = 1;
  const maxZoom = 4;
  let position = { x: 0, y: 0 };
  let dragging = false;
  let dragStart = null;
  let pinchStart = null;
  let rafId = 0;
  const activePointers = new Map();

  function layout(){
    const rect = stage.getBoundingClientRect();
    stageRect = { width: rect.width, height: rect.height };
    cropRect = computeCropRect(stageRect, aspectRatio);
    minZoom = Math.max(cropRect.width / naturalWidth, cropRect.height / naturalHeight);
    if(!Number.isFinite(minZoom) || minZoom <= 0){
      minZoom = 1;
    }
    zoom = clamp(zoom || minZoom, minZoom, maxZoom);
    position = restrictPosition(position, zoom, naturalWidth, naturalHeight, cropRect, stageRect);
    render();
  }

  function render(){
    const mediaW = naturalWidth * zoom;
    const mediaH = naturalHeight * zoom;
    const centerX = stageRect.width / 2;
    const centerY = stageRect.height / 2;
    const left = centerX + position.x - mediaW / 2;
    const top = centerY + position.y - mediaH / 2;
    imgEl.style.width = `${mediaW}px`;
    imgEl.style.height = `${mediaH}px`;
    imgEl.style.left = `${left}px`;
    imgEl.style.top = `${top}px`;
    cropBox.style.left = `${cropRect.left}px`;
    cropBox.style.top = `${cropRect.top}px`;
    cropBox.style.width = `${cropRect.width}px`;
    cropBox.style.height = `${cropRect.height}px`;
  }

  function scheduleRender(){
    if(rafId) return;
    rafId = requestAnimationFrame(()=>{
      rafId = 0;
      render();
    });
  }

  function setZoom(nextZoom, anchorX, anchorY){
    const prevZoom = zoom;
    zoom = clamp(nextZoom, minZoom, maxZoom);
    const centerX = stageRect.width / 2;
    const centerY = stageRect.height / 2;
    const dx = anchorX - centerX - position.x;
    const dy = anchorY - centerY - position.y;
    const scale = zoom / prevZoom;
    position.x -= dx * (scale - 1);
    position.y -= dy * (scale - 1);
    position = restrictPosition(position, zoom, naturalWidth, naturalHeight, cropRect, stageRect);
    scheduleRender();
  }

  function initPinchFromPointers(){
    const pts = [...activePointers.values()];
    if(pts.length < 2) return;
    const stageBox = stage.getBoundingClientRect();
    pinchStart = {
      distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
      zoom,
      anchorX: (pts[0].x + pts[1].x) / 2 - stageBox.left,
      anchorY: (pts[0].y + pts[1].y) / 2 - stageBox.top,
    };
  }

  function onPointerDown(event){
    if(event.pointerType === 'mouse' && event.button !== 0) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if(activePointers.size === 2){
      dragging = false;
      dragStart = null;
      initPinchFromPointers();
      stage.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }
    if(activePointers.size > 2) return;
    stage.setPointerCapture(event.pointerId);
    dragging = true;
    dragStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      posX: position.x,
      posY: position.y,
    };
    event.preventDefault();
  }

  function onPointerMove(event){
    if(!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if(activePointers.size >= 2){
      if(!pinchStart) initPinchFromPointers();
      if(pinchStart){
        const pts = [...activePointers.values()];
        const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        setZoom(
          pinchStart.zoom * (distance / pinchStart.distance),
          pinchStart.anchorX,
          pinchStart.anchorY,
        );
        pinchStart.zoom = zoom;
        pinchStart.distance = distance;
      }
      event.preventDefault();
      return;
    }

    if(!dragging || !dragStart || dragStart.pointerId !== event.pointerId) return;
    position = restrictPosition(
      {
        x: dragStart.posX + (event.clientX - dragStart.x),
        y: dragStart.posY + (event.clientY - dragStart.y),
      },
      zoom,
      naturalWidth,
      naturalHeight,
      cropRect,
      stageRect,
    );
    scheduleRender();
    event.preventDefault();
  }

  function onPointerUp(event){
    activePointers.delete(event.pointerId);
    if(activePointers.size < 2){
      pinchStart = null;
    }
    if(dragStart && dragStart.pointerId === event.pointerId){
      dragging = false;
      dragStart = null;
    }
    try {
      stage.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onWheel(event){
    event.preventDefault();
    const stageBox = stage.getBoundingClientRect();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom(zoom * (1 + delta), event.clientX - stageBox.left, event.clientY - stageBox.top);
  }

  return await new Promise((resolve)=>{
    let settled = false;
    const previousOverflow = document.body.style.overflow;

    function cleanup(){
      if(settled) return;
      settled = true;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      resizeObserver.disconnect();
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      stage.removeEventListener('wheel', onWheel);
      modal.remove();
    }

    function finish(value){
      cleanup();
      resolve(value);
    }

    async function confirm(){
      const crop = computeNaturalCrop(image, zoom, position, cropRect, stageRect);
      try {
        const blob = await exportCroppedBlob(image, crop);
        finish(blob);
      } catch (err) {
        alert(err.message || 'Could not crop image');
      }
    }

    function cancel(){
      finish(null);
    }

    function onKeyDown(event){
      if(event.key === 'Escape') cancel();
    }

    modal.addEventListener('click', (event)=>{
      const action = event.target.closest('[data-action]')?.dataset.action;
      if(action === 'cancel') cancel();
      if(action === 'confirm') confirm();
    });

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
    window.addEventListener('keydown', onKeyDown);

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('wheel', onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(()=> layout());
    resizeObserver.observe(stage);

    zoom = 0;
    position = { x: 0, y: 0 };
    layout();
    modal.querySelector('[data-action="confirm"]').focus();
  });
}

export function photoAspectRatioForStyle(styleId){
  if(styleId === 'vintage') return 758 / 506;
  return 762 / 508;
}
