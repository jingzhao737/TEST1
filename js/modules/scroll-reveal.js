;// ═══════════ SCROLL REVEAL ═══════════
let revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('anim-done'); });
}, { threshold: 0.04, rootMargin: '0px 0px -16px 0px' });
document.querySelectorAll('.anim-up').forEach(function(el) { revealObserver.observe(el); });

// ═══════════ FOOTER CTA REVEAL ═══════════
let footerCta = document.getElementById('footerCta');
if (footerCta) {
  new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) footerCta.classList.add('revealed');
  }, { threshold: 0.3 }).observe(footerCta);
}
