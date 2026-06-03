// ═══════════ CRESCENT BREATHE (JS-driven, no CSS animation collision) ═══════════
(function() {
  const chars = document.querySelectorAll('.cr-char');
  if (chars.length === 0) return;

  const states = Array.from(chars).map(function(el, i) {
    return {
      el: el,
      baseY: 0,
      scale: 1,
      phase: i * 0.7,
      hovering: false
    };
  });

  let prevTime = 0;
  const breatheAmp = 10;
  const hoverY = -6;
  const hoverScale = 1;
  const breathSpeed = 0.0012;
  const lerpSpeed = 0.08; // per-frame lerp factor

  function tick(now) {
    if (!prevTime) prevTime = now;
    let dt = Math.min(now - prevTime, 50);
    prevTime = now;

    for (let s of states) {
      s.phase += breathSpeed * dt;
      if (s.phase > Math.PI * 2) s.phase -= Math.PI * 2;

      let breathe = Math.sin(s.phase) * breatheAmp;
      let targetY = breathe + (s.hovering ? hoverY : 0);
      let targetS = s.hovering ? hoverScale : 1;

      // EMA lerp
      s.baseY += (targetY - s.baseY) * lerpSpeed;
      s.scale += (targetS - s.scale) * lerpSpeed;

      s.el.style.transform = 'translateY(' + s.baseY.toFixed(2) + 'px) scale(' + s.scale.toFixed(3) + ')';
    }

    requestAnimationFrame(tick);
  }

  for (let s of states) {
    s.el.addEventListener('mouseenter', function() {
      s.hovering = true;
      s.el.classList.add('hovering');
    });
    s.el.addEventListener('mouseleave', function() {
      s.hovering = false;
      s.el.classList.remove('hovering');
    });
  }

  requestAnimationFrame(function(first) {
    prevTime = first;
    requestAnimationFrame(tick);
  });
})();
