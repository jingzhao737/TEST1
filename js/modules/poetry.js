;// ═══════════ POETRY MOSAIC ═══════════
(function() {
  const grid = document.getElementById('poetryGrid');
  if (!grid) return;
  const text = "Do not go gentle into that good night. Rage, rage against the dying of the light.";
  const chars = text.split('');
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === ' ') {
      // Render space as a subtle empty card
      const card = document.createElement('div');
      card.className = 'poetry-card poetry-space anim-up';
      card.innerHTML = '<span class="poetry-char">&nbsp;</span>';
      card.style.setProperty('--stagger-delay', (i * 0.015) + 's');
      grid.appendChild(card);
    } else {
      const card = document.createElement('div');
      card.className = 'poetry-card anim-up';
      card.innerHTML = '<span class="poetry-char">' + ch + '</span>';
      card.style.setProperty('--stagger-delay', (i * 0.015) + 's');
      grid.appendChild(card);
    }
  }
  // Trigger stagger animation via IntersectionObserver
  const obs = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      const cards = grid.querySelectorAll('.poetry-card');
      cards.forEach(function(c, i) {
        setTimeout(function() { c.classList.add('anim-done'); }, i * 15);
      });
      obs.disconnect();
    }
  }, { threshold: 0.2 });
  obs.observe(grid);

  // ── Proximity-based 3D tilt + color (exponential smooth, no jitter) ──
  const cards = Array.from(grid.querySelectorAll('.poetry-card'));
  if (!cards.length) return;

  const CARD_SIZE = 64;
  const THRESHOLD = CARD_SIZE * 1.8;

  // Per-card current rendered state (exponential moving average toward target)
  const state = cards.map(() => ({ e: 0, rx: 0, ry: 0 }));
  let targetE = cards.map(() => 0);
  let targetRX = cards.map(() => 0);
  let targetRY = cards.map(() => 0);

  const SPEED_COLOR = 0.06;   // color/shadow follow speed (slower → more delay)
  const SPEED_TILT = 0.12;    // tilt follow speed (slower → more delay)
  const SPEED_RESET = 0.04;   // reset speed when mouse leaves (slower → longer fade out)

  let running = false;

  grid.addEventListener('mousemove', function(e) {
    cards.forEach(function(card, i) {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.max(0, 1 - dist / THRESHOLD);
      targetE[i] = t * t;
      targetRX[i] = -(dy / (rect.height / 2)) * targetE[i] * 28;
      targetRY[i] = (dx / (rect.width / 2)) * targetE[i] * 22;
    });
    if (!running) { running = true; smoothLoop(); }
  });

  grid.addEventListener('mouseleave', function() {
    for (let i = 0; i < cards.length; i++) {
      targetE[i] = 0;
      targetRX[i] = 0;
      targetRY[i] = 0;
    }
    if (!running) { running = true; smoothLoop(); }
  });

  function smoothLoop() {
    let anyActive = false;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const s = state[i];

      // Exponential moving average toward target
      const spd = targetE[i] > 0.01 ? SPEED_COLOR : SPEED_RESET;
      s.e += (targetE[i] - s.e) * spd;
      s.rx += (targetRX[i] - s.rx) * SPEED_TILT;
      s.ry += (targetRY[i] - s.ry) * SPEED_TILT;

      const e = s.e;
      if (e < 0.0005 && targetE[i] === 0) { s.e = 0; s.rx = 0; s.ry = 0; }

      if (s.e < 0.0005) {
        card.style.background = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
        card.style.transform = '';
        card.style.zIndex = '';
        card.classList.remove('active');
        const ch = card.querySelector('.poetry-char');
        if (ch) { ch.style.color = ''; ch.style.transform = ''; ch.style.filter = ''; }
        continue;
      }

      anyActive = true;
      const re = s.e;

      // Color blend
      card.style.background = 'rgb(' + Math.round(16 + re * 239) + ',' + Math.round(20 + re * 121) + ',' + Math.round(25 + re * 65) + ')';
      card.style.borderColor = 'rgb(' + Math.round(38 + re * 217) + ',' + Math.round(38 + re * 134) + ',' + Math.round(42 + re * 78) + ')';
      card.style.boxShadow = '0 ' + (4 + re * 16).toFixed(1) + 'px ' + (10 + re * 30).toFixed(1) + 'px rgba(212,108,60,' + (re * 0.35).toFixed(2) + ')';
      card.style.transform = 'perspective(300px) rotateX(' + s.rx.toFixed(2) + 'deg) rotateY(' + s.ry.toFixed(2) + 'deg) translateZ(' + (re * 6).toFixed(1) + 'px) scale(' + (1 + re * 0.2).toFixed(2) + ')';
      card.style.zIndex = re > 0.3 ? '2' : '';
      card.classList.add('active');

      const ch = card.querySelector('.poetry-char');
      if (ch) {
        ch.style.color = re > 0.5 ? '#fff' : '';
        ch.style.transform = 'scale(' + (1 + re * 0.3).toFixed(2) + ')';
        ch.style.filter = re > 0.3 ? 'drop-shadow(0 0 ' + (re * 12).toFixed(0) + 'px rgba(255,255,255,' + (re * 0.5).toFixed(2) + '))' : 'none';
      }
    }
    // Only keep looping while cards are active (energy saving when idle)
    if (anyActive) requestAnimationFrame(smoothLoop);
    else running = false;
  }
})();
