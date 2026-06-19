(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initParallax(targets){
    if(reduced || window.matchMedia('(max-width:820px)').matches) return;
    let raf = null;
    document.addEventListener('mousemove', (e)=>{
      if(raf) return;
      raf = requestAnimationFrame(()=>{
        raf = null;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        targets.forEach(({el, depth, base})=>{
          if(!el) return;
          const tx = dx * depth;
          const ty = dy * depth * 0.55;
          const baseTransform = typeof base === 'function' ? base() : (base || '');
          el.style.transform = baseTransform
            ? `${baseTransform} translate(${tx}px, ${ty}px)`
            : `translate(${tx}px, ${ty}px)`;
        });
      });
    });
  }

  function ensureFlash(container){
    let el = container.querySelector('.flash-overlay');
    if(!el){
      el = document.createElement('div');
      el.className = 'flash-overlay';
      el.setAttribute('aria-hidden', 'true');
      container.appendChild(el);
    }
    return el;
  }

  function playFlash(container){
    const el = ensureFlash(container);
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');
    setTimeout(()=> el.classList.remove('active'), 420);
  }

  function playShutterShake(...elements){
    if(reduced) return;
    elements.forEach((el)=>{
      if(!el) return;
      el.classList.remove('shutter-shake');
      void el.offsetWidth;
      el.classList.add('shutter-shake');
      setTimeout(()=> el.classList.remove('shutter-shake'), 320);
    });
  }

  function curtainSequence(previewWrap, onOpen){
    if(!previewWrap) return onOpen && onOpen();
    previewWrap.classList.remove('curtains-open');
    previewWrap.classList.add('curtains-closed');
    const delay = reduced ? 50 : 820;
    setTimeout(()=>{
      previewWrap.classList.remove('curtains-closed');
      previewWrap.classList.add('curtains-open');
      if(onOpen) onOpen();
    }, delay);
  }

  function setIdleGlow(previewWrap, on){
    if(!previewWrap) return;
    previewWrap.classList.toggle('idle-glow', !!on);
    previewWrap.classList.toggle('curtains-open', !!on);
  }

  function mountSlotGlow(dispenser){
    if(!dispenser || dispenser.querySelector('#slot-glow')) return null;
    const glow = document.createElement('div');
    glow.id = 'slot-glow';
    glow.setAttribute('aria-hidden', 'true');
    dispenser.appendChild(glow);
    return {
      start(){ glow.classList.remove('printing'); void glow.offsetWidth; glow.classList.add('printing'); },
      stop(){ glow.classList.remove('printing'); }
    };
  }

  function mountAmbient(){
    if(document.getElementById('ambient-layer')) return;
    const layer = document.createElement('div');
    layer.id = 'ambient-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div id="ambient-vignette"></div><div id="ambient-warmth"></div><div id="ambient-flicker"></div>';
    document.body.appendChild(layer);
  }

  window.BoothImmersive = {
    initParallax,
    playFlash,
    playShutterShake,
    curtainSequence,
    setIdleGlow,
    mountSlotGlow,
    mountAmbient
  };
})();
