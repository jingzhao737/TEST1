import gsap from 'gsap';

// ═══════════ STACKED CARD DECK — zero-latency drag + spring snap ═══════════
(function() {
  const hero  = document.getElementById('motionHero');
  const track = document.getElementById('motionTrack');
  if (!track || !hero) return;

  const slides = Array.from(track.querySelectorAll('.motion-slide'));
  const videos = slides.map(s => s.querySelector('video'));
  const total  = slides.length;
  let current  = 0;
  let isAnimating = false;

  // ── Dots ───────────────────────────────────────────────────────────────────
  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'motion-dots';
  const dots = slides.map((_, i) => {
    const d = document.createElement('div');
    d.className = 'motion-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i, 0));
    dotsWrap.appendChild(d);
    return d;
  });
  hero.appendChild(dotsWrap);

  // ── Stack geometry ─────────────────────────────────────────────────────────
  function getState(offset) {
    const abs  = Math.abs(offset);
    const sign = offset < 0 ? -1 : 1;
    if (offset === 0) return { x: 0,       y: 0,  scale: 1,    rotZ: 0,         opacity: 1,    z: 10 };
    if (abs === 1)    return { x: sign*14,  y: 18, scale: 0.87, rotZ: sign*3.5,  opacity: 0.55, z: 5  };
    return                    { x: sign*24,  y: 32, scale: 0.75, rotZ: sign*6,    opacity: 0,    z: 1  };
  }

  function toProps(st) {
    return { x: st.x, y: st.y, scale: st.scale, rotationZ: st.rotZ, opacity: st.opacity, zIndex: st.z };
  }

  function getOffset(i) {
    let raw = (i - current + total) % total;
    return raw > total / 2 ? raw - total : raw;
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function initLayout() {
    slides.forEach((slide, i) => {
      const off = getOffset(i);
      slide.classList.toggle('is-active', off === 0);
      gsap.set(slide, toProps(getState(off)));
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  // ── Transition ─────────────────────────────────────────────────────────────
  function goTo(newIdx, dir) {
    newIdx = ((newIdx % total) + total) % total;
    if (newIdx === current || isAnimating) return;
    isAnimating = true;
    const exitIdx = current;
    current = newIdx;
    if (dir === 0) dir = newIdx > exitIdx ? 1 : -1;

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating = false;
        // Reset exit card to its new stack position
        const off = getOffset(exitIdx);
        gsap.set(slides[exitIdx], toProps(getState(off)));
        slides[exitIdx].classList.toggle('is-active', off === 0);
      }
    });

    // Exit card sweeps out
    tl.to(slides[exitIdx], {
      x: dir < 0 ? '105%' : '-105%',
      scale: 0.9,
      opacity: 0,
      duration: 0.38,
      ease: 'power2.in'
    }, 0);

    // Remaining cards spring into new positions
    slides.forEach((slide, i) => {
      if (i === exitIdx) return;
      const off = getOffset(i);
      const st  = getState(off);
      slide.classList.toggle('is-active', off === 0);

      if (off === 0) {
        // New active: elastic entrance
        tl.fromTo(slide,
          { x: dir > 0 ? 70 : -70, scale: 0.84, opacity: 0.3 },
          { ...toProps(st), duration: 0.65, ease: 'back.out(1.4)' },
          0.06
        );
      } else {
        tl.to(slide, { ...toProps(st), duration: 0.5, ease: 'power3.out' }, 0.04);
      }
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    playCurrent();
  }

  function next() { goTo((current + 1) % total, 1); }
  function prev() { goTo((current - 1 + total) % total, -1); }

  // ── Video ──────────────────────────────────────────────────────────────────
  function playCurrent() {
    videos.forEach((v, i) => {
      if (i === current) { v.currentTime = 0; v.play().catch(() => {}); }
      else { v.pause(); v.currentTime = 0; }
    });
  }
  videos.forEach(v => v.addEventListener('ended', next));

  // ── Drag — ZERO latency, raw gsap.set per frame ───────────────────────────
  let dragStart = null, dragX = 0, isDragging = false;
  let prevMx = 0, velX = 0;

  function onDown(e) {
    if (isAnimating) return;
    const mx = e.clientX ?? e.touches?.[0]?.clientX;
    if (mx == null) return;
    dragStart = mx; dragX = 0; prevMx = mx; velX = 0;
    isDragging = true;
    hero.classList.add('dragging');
    // Kill any running tweens on slides so drag is instant
    slides.forEach(s => gsap.killTweensOf(s));
  }

  function onMove(e) {
    if (!isDragging) return;
    const mx = e.clientX ?? e.touches?.[0]?.clientX;
    if (mx == null) return;
    velX  = mx - prevMx;
    prevMx = mx;
    dragX = mx - dragStart;

    // Direct set — zero delay, zero easing, pure 1:1 tracking
    slides.forEach((slide, i) => {
      const off   = getOffset(i);
      const baseX = getState(off).x;
      gsap.set(slide, { x: baseX + dragX * 0.6 });
    });
  }

  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    hero.classList.remove('dragging');

    if (dragX < -50 || velX < -6)       next();
    else if (dragX > 50 || velX > 6)    prev();
    else {
      // Spring snap-back
      slides.forEach((slide, i) => {
        const off = getOffset(i);
        gsap.to(slide, { x: getState(off).x, duration: 0.45, ease: 'back.out(2.2)' });
      });
    }
    dragStart = null; dragX = 0;
  }

  hero.addEventListener('mousedown',  onDown);
  hero.addEventListener('mousemove',  onMove);
  hero.addEventListener('mouseup',    onUp);
  hero.addEventListener('mouseleave', onUp);
  hero.addEventListener('touchstart', onDown, { passive: true });
  hero.addEventListener('touchmove',  onMove, { passive: true });
  hero.addEventListener('touchend',   onUp);

  document.addEventListener('keydown', e => {
    if (document.getElementById('workDetail')?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // ── Boot ───────────────────────────────────────────────────────────────────
  initLayout();

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) videos[current].play().catch(() => {});
    else videos.forEach(v => v.pause());
  }, { threshold: 0.3 }).observe(track);
})();


// ─── MENU PANEL ──────────────────────────────────────────────────────────────
(function() {
  const btn      = document.getElementById('navMenuBtn');
  const panel    = document.getElementById('menuPanel');
  const closeBtn = document.getElementById('menuPanelClose');
  const cursorDot  = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const pageTransition = document.getElementById('pageTransition');
  if (!btn || !panel) return;

  function openMenu() {
    btn.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (cursorDot)  cursorDot.style.opacity  = '0';
    if (cursorRing) cursorRing.style.opacity = '0';
    const sb = document.getElementById('scrollBar');
    if (sb) sb.style.display = 'none';
  }

  function closeMenu() {
    btn.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
    if (cursorDot)  cursorDot.style.opacity  = '0';
    if (cursorRing) cursorRing.style.opacity = '0';
    const sb = document.getElementById('scrollBar');
    if (sb) sb.style.display = '';
  }

  btn.addEventListener('click', () => {
    panel.classList.contains('open') ? closeMenu() : openMenu();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
  });

  document.addEventListener('mousemove', () => {
    if (!panel.classList.contains('open') &&
       (cursorDot?.style.opacity === '0' || cursorRing?.style.opacity === '0')) {
      if (cursorDot)  cursorDot.style.opacity  = '';
      if (cursorRing) cursorRing.style.opacity = '';
    }
  });

  panel.querySelectorAll('.menu-nav-link[data-link]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.link);
      if (!target) return;
      closeMenu();
      if (pageTransition) {
        pageTransition.classList.add('active');
        setTimeout(() => pageTransition.classList.remove('active'), 1000);
      }
      const top = link.dataset.link === 'home'
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      const wd = document.getElementById('workDetail');
      if (wd?.classList.contains('open')) document.getElementById('detailClose')?.click();
    });
  });
})();
