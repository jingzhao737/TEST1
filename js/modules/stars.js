;// ═══════════ STARS BACKGROUND ═══════════
(function() {
  let canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  let ctx = canvas.getContext('2d');
  let stars = [];
  let TARGET_COUNT = window.innerWidth <= 768 ? 100 : 260;
  let frameCount = 0;
  let w, h, dpr;
  let isVisible = true;
  new IntersectionObserver(function(e) { isVisible = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnStar() {
    let depth = Math.pow(Math.random(), 3);
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.25 + depth * 1.6,
      peakOpacity: 0.08 + depth * 0.65,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.2,
      life: 0,
      maxLife: 800 + Math.random() * 1200,
      fadeOut: false
    };
  }

  function init() {
    stars.length = 0;
    for (let i = 0; i < TARGET_COUNT; i++) {
      stars.push(spawnStar());
    }
  }

  // Draw a diamond shape at (x, y)
  function drawDiamond(cx, cy, size) {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.55, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.55, cy);
    ctx.closePath();
  }

  function drawGlow(cx, cy, r, alpha) {
    let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
    grad.addColorStop(0.3, 'rgba(255,255,255,' + (alpha * 0.5) + ')');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  function draw(ts) {
    if (!isVisible) { requestAnimationFrame(draw); return; }
    frameCount++;
    ctx.clearRect(0, 0, w, h);

    // Subtle vignette overlay for depth (skip in light mode)
    if (!isLight) {
      let vignette = ctx.createRadialGradient(w * 0.5, h * 0.4, h * 0.15, w * 0.5, h * 0.4, w * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }

    let t = ts * 0.001;

    for (let i = stars.length - 1; i >= 0; i--) {
      let s = stars[i];
      s.life++;

      let lifeRatio = s.maxLife > 0 ? s.life / s.maxLife : 1;
      let fadeAlpha = 1;
      if (lifeRatio > 0.85) {
        fadeAlpha = 1 - (lifeRatio - 0.85) / 0.15;
      } else if (lifeRatio < 0.1) {
        fadeAlpha = lifeRatio / 0.1;
      }

      let twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      let alpha = s.peakOpacity * twinkle * fadeAlpha;

      if (alpha > 0.003) {
        // Draw glow first (behind diamond)
        if (s.r > 0.6) {
          drawGlow(s.x, s.y, s.r * 5, alpha * 0.15);
        }
        if (s.r > 1.0 && alpha > 0.2) {
          drawGlow(s.x, s.y, s.r * 10, alpha * 0.04);
        }

        // Draw diamond star
        ctx.beginPath();
        drawDiamond(s.x, s.y, s.r * 2.0);
        ctx.fillStyle = 'rgba(' + (isLight ? '0,0,0' : '255,255,255') + ',' + alpha + ')';
        ctx.fill();

        // Starburst cross on brighter stars
        if (s.r > 0.8 && alpha > 0.25) {
          ctx.save();
          ctx.globalAlpha = alpha * 0.35;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 0.3;
          let cross = s.r * 3.5;
          ctx.beginPath();
          ctx.moveTo(s.x - cross, s.y); ctx.lineTo(s.x + cross, s.y);
          ctx.moveTo(s.x, s.y - cross); ctx.lineTo(s.x, s.y + cross);
          ctx.moveTo(s.x - cross * 0.7, s.y - cross * 0.7); ctx.lineTo(s.x + cross * 0.7, s.y + cross * 0.7);
          ctx.moveTo(s.x + cross * 0.7, s.y - cross * 0.7); ctx.lineTo(s.x - cross * 0.7, s.y + cross * 0.7);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Respawn at end of life
      if (s.life >= s.maxLife) {
        let replacement = spawnStar();
        replacement.x = s.x;
        replacement.y = s.y;
        replacement.life = 0;
        stars[i] = replacement;
      }
    }

    while (stars.length < TARGET_COUNT) {
      stars.push(spawnStar());
    }

    requestAnimationFrame(draw);
  }

  resize();
  init();
  requestAnimationFrame(draw);

  window.addEventListener('resize', function() {
    resize();
    TARGET_COUNT = window.innerWidth <= 768 ? 100 : 260;
    init();
  });
})();
