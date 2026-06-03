;// ═══════════ COUNTER ANIMATION ═══════════
let counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      let el = entry.target; if (el._counted) return; el._counted = true;
      let target = parseInt(el.dataset.count, 10);
      let suffixEl = el.querySelector('span'), suffix = suffixEl ? suffixEl.textContent : '';
      let duration = 1600, start = null;
      (function step(ts) {
        if (!start) start = ts;
        let progress = Math.min((ts - start) / duration, 1), eased = 1 - Math.pow(1 - progress, 4);
        el.innerHTML = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      })(0);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.stat-num[data-count]').forEach(function(el) { counterObserver.observe(el); });
