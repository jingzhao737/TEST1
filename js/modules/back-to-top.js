;// ═══════════ BACK TO TOP ═══════════
(function() {
  let btn = document.getElementById('backToTop');
  if (!btn) return;

  // Show after scrolling past hero
  let hero = document.getElementById('home');
  new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      btn.classList.remove('visible');
    } else {
      btn.classList.add('visible');
    }
  }, { threshold: 0 }).observe(hero);

  btn.addEventListener('click', function() {
    // Smooth scroll with custom easing via requestAnimationFrame
    let start = window.scrollY;
    let startTime = null;
    let duration = 1000;

    function step(ts) {
      if (!startTime) startTime = ts;
      let elapsed = ts - startTime;
      let progress = Math.min(elapsed / duration, 1);
      // Ease out quint — fast start, gentle landing
      let eased = 1 - Math.pow(1 - progress, 5);
      window.scrollTo(0, start * (1 - eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  });
})();


// --- custom scroll bar ---
(function(){
  const bar = document.getElementById('scrollBar');
  const thumb = document.getElementById('scrollThumb');
  if (!bar || !thumb) return;

  // --- Generate tick marks between dot markers (based on section positions) ---
  let ticksContainer = document.getElementById('scrollTicks');
  function generateTicks() {
    if (!ticksContainer) return;
    ticksContainer.innerHTML = '';
    let h = document.documentElement;
    let totalH = h.scrollHeight - h.clientHeight;
    if (totalH <= 0) return;
    let dots = bar.querySelectorAll('.scroll-dot-marker');
    for (let d = 0; d < dots.length - 1; d++) {
      let elA = document.querySelector(dots[d].getAttribute('data-target'));
      let elB = document.querySelector(dots[d + 1].getAttribute('data-target'));
      if (!elA || !elB) continue;
      let topA = (elA.getBoundingClientRect().top + h.scrollTop) / totalH * 100;
      let topB = (elB.getBoundingClientRect().top + h.scrollTop) / totalH * 100;
      if (topA >= topB) continue;
      let step = (topB - topA) / 4;
      for (let t = 1; t <= 3; t++) {
        let pct = topA + step * t;
        let tick = document.createElement('div');
        tick.className = 'scroll-tick';
        tick.style.top = pct + '%';
        ticksContainer.appendChild(tick);
      }
    }
  }

  // --- Show/hide based on scroll position (hide on hero, show after) ---
  function updateVisibility() {
    let heroH = window.innerHeight;
    let scrolled = window.scrollY;
    if (scrolled < heroH * 0.5) {
      bar.style.opacity = '0';
      bar.style.pointerEvents = 'none';
    } else {
      bar.style.opacity = '1';
      bar.style.pointerEvents = 'auto';
    }
  }
  bar.style.transition = 'opacity .4s var(--ease-out-expo)';
  updateVisibility();

  // --- Add page bubbles to dot markers ---
  let dotLabels = { '#home': '00', '#work': '01', '#ice': '02', '#showcase': '03', '#motion': '04', '#about': '05' };
  let dots = bar.querySelectorAll('.scroll-dot-marker');

  // --- smooth wheel scroll (declared early for bubble click) ---
  let wheelTarget = document.documentElement.scrollTop;
  let wheelCurrent = wheelTarget;
  let wheelRaf = null;

  function startWheelLerp() {
    // Don't interfere with bubble-click lerpScroll
    if (lerpActive && bubbleLerpStartTime > 0) return;
    if (wheelRaf) return;
    wheelRaf = requestAnimationFrame(function tick() {
      // Yield to lerpScroll if it's handling a bubble click
      if (lerpActive && bubbleLerpStartTime > 0) { wheelRaf = null; return; }
      let diff = wheelTarget - wheelCurrent;
      if (Math.abs(diff) < 0.3) {
        wheelCurrent = wheelTarget;
        document.documentElement.scrollTop = wheelCurrent;
        updatePosition();
        positionDots();
        updateVisibility();
        wheelRaf = null;
        return;
      }
      wheelCurrent += diff * 0.065;
      document.documentElement.scrollTop = wheelCurrent;
      updatePosition();
      positionDots();
      updateVisibility();
      wheelRaf = requestAnimationFrame(tick);
    });
  }

  dots.forEach(function(dot){
    let targetId = dot.getAttribute('data-target');
    let label = dotLabels[targetId] || '';
    if (!label) return;
    let bubble = document.createElement('span');
    bubble.className = 'scroll-bubble';
    bubble.textContent = 'P' + label;
    dot.appendChild(bubble);
    // click bubble → smooth scroll with custom easing
    bubble.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      let el = document.querySelector(targetId);
      if (!el) return;
      let totalH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      let targetTop = el.getBoundingClientRect().top + document.documentElement.scrollTop - document.documentElement.clientHeight * 0.1;
      targetScroll = Math.max(0, Math.min(totalH, targetTop));
      bubbleLerpStartScroll = document.documentElement.scrollTop;
      // Duration based on distance: min 600ms, max 1800ms
      let scrollDist = Math.abs(targetScroll - bubbleLerpStartScroll);
      let viewH = document.documentElement.clientHeight;
      let screens = scrollDist / viewH;
      bubbleLerpDuration = Math.max(600, Math.min(1800, 400 + screens * 320));
      bubbleLerpStartTime = performance.now();
      currentScroll = bubbleLerpStartScroll;
      lerpActive = true;
      lerpScroll();
    });
  });

  let dragging = false, startY = 0, startPageY = 0;
  let trackH = 0;

  function getMetrics(){
    trackH = bar.getBoundingClientRect().height;
  }

  function updatePosition(){
    if (trackH <= 0) getMetrics();
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    const pct = h.scrollTop / max;
    const shiftPx = (pct * 100 - 50) / 100 * trackH;
    // Only translateY — left is fixed, no layout needed
    thumb.style.transform = 'translateY(calc(-50% + ' + shiftPx + 'px))';
  }

  function positionDots(){
    const h = document.documentElement;
    const totalH = h.scrollHeight - h.clientHeight;
    if (totalH <= 0) return;
    const dots = bar.querySelectorAll('.scroll-dot-marker');
    dots.forEach(function(dot){
      const targetId = dot.getAttribute('data-target');
      const el = document.querySelector(targetId);
      if (!el) return;
      const elTop = el.getBoundingClientRect().top + h.scrollTop + h.clientHeight * 0.05;
      const pct = elTop / totalH;
      dot.style.top = (pct * 100) + '%';
    });
  }

  getMetrics();
  updatePosition();
  positionDots();
  generateTicks();

  window.addEventListener('scroll', function(){ updatePosition(); positionDots(); generateTicks(); updateVisibility(); }, {passive: true});
  window.addEventListener('resize', function(){ getMetrics(); updatePosition(); positionDots(); generateTicks(); updateVisibility(); }, {passive: true});

  let activeTimer = null;

  thumb.addEventListener('mousedown', function(e){
    dragging = true;
    startY = e.clientY;
    startPageY = window.scrollY;
    getMetrics();
    clearTimeout(activeTimer);
    activeTimer = setTimeout(function() { thumb.classList.add('active'); }, 150);
    e.preventDefault();
  });
  thumb.addEventListener('touchstart', function(e){
    dragging = true;
    startY = e.touches[0].clientY;
    startPageY = window.scrollY;
    getMetrics();
    clearTimeout(activeTimer);
    activeTimer = setTimeout(function() { thumb.classList.add('active'); }, 150);
    e.preventDefault();
  }, {passive: false});

  let targetScroll = 0;
  let currentScroll = 0;
  let lerpActive = false;

  function getDotScrollPositions() {
    const h = document.documentElement;
    const totalH = h.scrollHeight - h.clientHeight;
    if (totalH <= 0) return [];
    const dots = bar.querySelectorAll('.scroll-dot-marker');
    let positions = [];
    dots.forEach(function(dot) {
      let targetId = dot.getAttribute('data-target');
      let el = document.querySelector(targetId);
      if (!el) return;
      let elTop = el.getBoundingClientRect().top + h.scrollTop + h.clientHeight * 0.05;
      positions.push(elTop);
    });
    return positions;
  }

  let bubbleLerpStartTime = 0;
  let bubbleLerpDuration = 0;
  let bubbleLerpStartScroll = 0;

  function lerpScroll() {
    if (!lerpActive) return;
    let diff = targetScroll - currentScroll;
    let speed = 0.2;
    // snap damping: magnetic pull near dot anchors (drag only)
    if (dragging) {
      let dots = getDotScrollPositions();
      let totalH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      let snapZone = totalH * 0.06;
      for (let i = 0; i < dots.length; i++) {
        let dist = Math.abs(currentScroll - dots[i]);
        if (dist < snapZone) {
          speed = 0.03 + (dist / snapZone) * 0.17;
          break;
        }
      }
    } else if (bubbleLerpStartTime > 0) {
      // easeInOutQuart: snappier acceleration, silky deceleration
      let elapsed = performance.now() - bubbleLerpStartTime;
      let progress = Math.min(elapsed / bubbleLerpDuration, 1);
      let eased = progress < 0.5
        ? 8 * progress * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 4) / 2;
      currentScroll = bubbleLerpStartScroll + (targetScroll - bubbleLerpStartScroll) * eased;
      if (progress >= 1) {
        currentScroll = targetScroll;
        lerpActive = false;
        bubbleLerpStartTime = 0;
      }
      document.documentElement.scrollTop = currentScroll;
      updatePosition();
      positionDots();
      updateVisibility();
      if (lerpActive) requestAnimationFrame(lerpScroll);
      return;
    }
    currentScroll += diff * speed;
    if (Math.abs(diff) < 0.5) {
      currentScroll = targetScroll;
      lerpActive = false;
    }
    document.documentElement.scrollTop = currentScroll;
    updatePosition();
    positionDots();
    updateVisibility();
    if (lerpActive) requestAnimationFrame(lerpScroll);
  }

  document.addEventListener('mousemove', function(e){
    if (!dragging) return;
    getMetrics();
    const dy = e.clientY - startY;
    const totalH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (totalH <= 0) return;
    targetScroll = startPageY + dy / trackH * totalH;
    targetScroll = Math.max(0, Math.min(totalH, targetScroll));
    if (!lerpActive) {
      currentScroll = document.documentElement.scrollTop;
      lerpActive = true;
      requestAnimationFrame(lerpScroll);
    }
  });
  document.addEventListener('touchmove', function(e){
    if (!dragging) return;
    getMetrics();
    const dy = e.touches[0].clientY - startY;
    const totalH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (totalH <= 0) return;
    targetScroll = startPageY + dy / trackH * totalH;
    targetScroll = Math.max(0, Math.min(totalH, targetScroll));
    if (!lerpActive) {
      currentScroll = document.documentElement.scrollTop;
      lerpActive = true;
      requestAnimationFrame(lerpScroll);
    }
  }, {passive: false});

  document.addEventListener('mouseup', function(){
    if (!dragging) return;
    dragging = false;
    clearTimeout(activeTimer);
    thumb.classList.remove('active');
  });
  document.addEventListener('touchend', function(){
    if (!dragging) return;
    dragging = false;
    clearTimeout(activeTimer);
    thumb.classList.remove('active');
  });

  bar.addEventListener('mousedown', function(e){
    // Skip if clicking thumb or bubble
    if (e.target === thumb || e.target.closest('.scroll-bubble') || e.target.closest('.scroll-dot-marker')) return;
    getMetrics();
    const rect = bar.getBoundingClientRect();
    const totalH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = (e.clientY - rect.top) / rect.height;
    document.documentElement.scrollTop = pct * totalH;
  });

  bar.addEventListener('click', function(e){
    // If bubble was clicked, the bubble handler already took care of it
    if (e.target.closest('.scroll-bubble')) return;
    const dot = e.target.closest('.scroll-dot-marker');
    if (!dot) return;
    const targetId = dot.getAttribute('data-target');
    let el = document.querySelector(targetId);
    if (!el) return;
    let totalH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let targetTop = el.getBoundingClientRect().top + document.documentElement.scrollTop - document.documentElement.clientHeight * 0.1;
    targetScroll = Math.max(0, Math.min(totalH, targetTop));
    bubbleLerpStartScroll = document.documentElement.scrollTop;
    let scrollDist = Math.abs(targetScroll - bubbleLerpStartScroll);
    let viewH = document.documentElement.clientHeight;
    let screens = scrollDist / viewH;
    bubbleLerpDuration = Math.max(600, Math.min(1800, 400 + screens * 320));
    bubbleLerpStartTime = performance.now();
    currentScroll = bubbleLerpStartScroll;
    lerpActive = true;
    lerpScroll();
  });

  // --- smooth wheel scroll ---

  document.addEventListener('wheel', function(e) {
    if (dragging) return;
    // Don't interfere with bubble-click lerp animation
    if (lerpActive && bubbleLerpStartTime > 0) return;
    e.preventDefault();
    let totalH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (!wheelRaf) {
      wheelCurrent = document.documentElement.scrollTop;
      wheelTarget = wheelCurrent;
    }
    wheelTarget += e.deltaY * 1.2;
    wheelTarget = Math.max(0, Math.min(totalH, wheelTarget));
    startWheelLerp();
  }, {passive: false});
})();
