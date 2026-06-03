;/* CURSOR */
let cursorDot = document.getElementById('cursorDot');
let cursorRing = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, cX = 0, cY = 0, rX = 0, rY = 0;

document.addEventListener('mousemove', function(e) { mouseX = e.clientX; mouseY = e.clientY; });
document.addEventListener('mouseleave', function() { cursorDot.style.opacity = '0'; cursorRing.style.opacity = '0'; });
document.addEventListener('mouseenter', function() { cursorDot.style.opacity = ''; cursorRing.style.opacity = ''; });

(function loop() {
  cX += (mouseX - cX) * 0.2; cY += (mouseY - cY) * 0.2;
  rX += (mouseX - rX) * 0.06; rY += (mouseY - rY) * 0.06;
  cursorDot.style.left = (cX - 3.5) + 'px'; cursorDot.style.top = (cY - 3.5) + 'px';
  cursorRing.style.left = (rX - 16) + 'px'; cursorRing.style.top = (rY - 16) + 'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, .work-card, .footer-cta, .detail-close, button').forEach(function(el) {
  el.addEventListener('mouseenter', function() { cursorDot.classList.add('expanded'); });
  el.addEventListener('mouseleave', function() { cursorDot.classList.remove('expanded'); });
});
