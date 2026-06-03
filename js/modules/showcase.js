import gsap from 'gsap';

// ═══════════ PREMIUM PARALLAX SHOWCASE + ORGANIC FLUID SHIMMER ═══════════

// Accent color pulled from CSS variable at runtime
function getAccent() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e87c50';
}

const items = document.querySelectorAll('.showcase-item[data-parallax]');

if (items.length > 0) {
  items.forEach(item => {
    const bg      = item.querySelector('.showcase-bg');
    const info    = item.querySelector('.showcase-info');
    const title   = item.querySelector('.showcase-title');

    // Create highly optimized GSAP quickTo functions for 60fps+ hardware-accelerated rendering
    const xTo      = gsap.quickTo(item, "rotationY", { duration: 0.8, ease: "power3.out" });
    const yTo      = gsap.quickTo(item, "rotationX", { duration: 0.8, ease: "power3.out" });
    const scaleTo  = gsap.quickTo(item, "scale",     { duration: 0.6, ease: "expo.out"   });
    const bgXTo    = gsap.quickTo(bg,   "x",         { duration: 0.9, ease: "power3.out" });
    const bgYTo    = gsap.quickTo(bg,   "y",         { duration: 0.9, ease: "power3.out" });
    const bgScTo   = gsap.quickTo(bg,   "scale",     { duration: 0.8, ease: "power3.out" });
    const infoXTo  = gsap.quickTo(info, "x",         { duration: 1.2, ease: "power3.out" });
    const infoYTo  = gsap.quickTo(info, "y",         { duration: 1.2, ease: "power3.out" });

    gsap.set(item, { transformPerspective: 1200, transformStyle: "preserve-3d" });
    gsap.set(info, { transformPerspective: 1200, transformStyle: "preserve-3d", z: 60 });

    // ─── Organic fluid shimmer state ─────────────────────
    let tickerId   = null;
    let startTime  = 0;

    // Each card gets its own unique set of wave parameters so no two cards look alike
    const w = [
      { freq: 0.28 + Math.random() * 0.12, amp: 55 + Math.random() * 25, phase: Math.random() * Math.PI * 2 },
      { freq: 0.13 + Math.random() * 0.08, amp: 30 + Math.random() * 15, phase: Math.random() * Math.PI * 2 },
      { freq: 0.52 + Math.random() * 0.18, amp: 12 + Math.random() * 8,  phase: Math.random() * Math.PI * 2 },
    ];
    // Base drift — how fast the "river" flows across the gradient
    const drift = 14 + Math.random() * 8; // px/s  (different per card)

    function startShimmer() {
      if (!title) return;
      startTime = performance.now();
      const accent = getAccent();
      
      // Initialize data-text for the pseudo-element bloom layer
      if (!title.dataset.text) title.dataset.text = title.textContent;
      title.classList.add('is-shimmering');

      // Enhanced ultra-bright gradient for a massive bloom effect
      const gradient = `linear-gradient(
        100deg,
        rgba(255,255,255,0.4) 0%,
        #ffffff 12%,
        #ffffff 18%,
        ${accent} 25%,
        rgba(255,255,255,0.7) 35%,
        #ffffff 45%,
        #ffffff 52%,
        ${accent} 62%,
        rgba(255,255,255,0.5) 75%,
        #ffffff 82%,
        #ffffff 88%,
        rgba(255,255,255,0.4) 100%
      )`;
      
      title.style.setProperty('--shimmer-gradient', gradient);
      let pos = Math.random() * 400;

      tickerId = gsap.ticker.add((time, deltaTime) => {
        const elapsed = (performance.now() - startTime) / 1000;
        const speedMod =
          1.0 +
          Math.sin(elapsed * w[0].freq * Math.PI * 2 + w[0].phase) * 0.5 +
          Math.sin(elapsed * w[1].freq * Math.PI * 2 + w[1].phase) * 0.25 +
          Math.sin(elapsed * w[2].freq * Math.PI * 2 + w[2].phase) * 0.1;

        pos = (pos + drift * Math.max(0.05, speedMod) * (deltaTime / 1000)) % 400;
        title.style.setProperty('--shimmer-pos', `${pos}%`);
      });
    }

    function stopShimmer() {
      if (tickerId !== null) {
        gsap.ticker.remove(tickerId);
        tickerId = null;
      }
      if (title) {
        title.classList.remove('is-shimmering');
        gsap.to({ pos: parseFloat(title.style.getPropertyValue('--shimmer-pos')) || 0 }, {
          pos: 0,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: function() {
            title.style.setProperty('--shimmer-gradient', 'linear-gradient(100deg,#fff,#fff)');
            title.style.setProperty('--shimmer-pos', '0%');
          }
        });
      }
    }

    // ─── Event listeners ─────────────────────────────────
    item.addEventListener("mouseenter", () => {
      scaleTo(1.02);
      bgScTo(1.08);
      item.style.zIndex = "10";
      startShimmer();
    });

    item.addEventListener("mousemove", e => {
      const rect = item.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top)  / rect.height;
      bgXTo((relX - 0.5) * -60);
      bgYTo((relY - 0.5) * -60);
      infoXTo((relX - 0.5) * 40);
      infoYTo((relY - 0.5) * 40);
    });

    item.addEventListener("mouseleave", () => {
      scaleTo(1);
      bgXTo(0); bgYTo(0); bgScTo(1);
      infoXTo(0); infoYTo(0);
      item.style.zIndex = "1";
      stopShimmer();
    });
  });
}
