;// ═══════════ NAV WAVEFORM ═══════════
(function(){
  let waveCanvas = document.getElementById('navWaveform');
  if (!waveCanvas) return;
  let ctx = waveCanvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let waveW = 0, waveH = 0;
  let history = new Array(64).fill(0);

  function initSize() {
    waveW = waveCanvas.offsetWidth || waveCanvas.width || 140;
    waveH = waveCanvas.offsetHeight || waveCanvas.height || 32;
    waveCanvas.width = waveW * dpr;
    waveCanvas.height = waveH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  initSize();

  let isVisible = true;
  new IntersectionObserver(function(e) { isVisible = e[0].isIntersecting; }, { threshold: 0 }).observe(waveCanvas);

  let noisePhase = 0;
  function draw() {
    if (!isVisible) { requestAnimationFrame(draw); return; }
    initSize();
    if (waveW < 2 || waveH < 2) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, waveW, waveH);

    let playing = window.__audioPlaying === true;
    let mid = waveH / 2;

    // Build smooth bar-style waveform
    let segs = history.length - 1;
    let segW = waveW / segs;

    // Push new random bar height (or zero if not playing)
    noisePhase += 0.08;
    let active = playing;
    // When not playing, fade to flat
    let nextVal = active ? (Math.sin(noisePhase * 1.7) * 0.4 + Math.sin(noisePhase * 3.1) * 0.3 + Math.sin(noisePhase * 5.3) * 0.2) : 0;
    history.push(nextVal);
    if (history.length > segs + 1) history.shift();

    // Fade to flat when not playing
    let smooth = active ? 0.6 : 0.92;
    for (let i = 0; i < history.length; i++) {
      let target = active ? history[i] : 0;
      history[i] = history[i] * smooth + target * (1 - smooth);
    }

    // Use accent warm orange in both modes
    ctx.strokeStyle = '#E87C50';
    ctx.lineWidth = 2.2;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      let val = Math.max(-1, Math.min(1, history[i]));
      let y = mid + val * (waveH * 0.32);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * segW, y);
    }
    ctx.stroke();

    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', initSize);
})();
