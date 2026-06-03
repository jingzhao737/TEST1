;// ═══════════ WORK DETAIL ═══════════
document.querySelectorAll('.work-card').forEach(function(card) {
  // Keyboard accessibility
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  function openCard() {
    let key = card.dataset.work; if (!workData[key]) return;
    let data = Object.assign({ slug: key }, workData[key]);
    openDetail(data, card.dataset.hero);
  }

  card.addEventListener('click', openCard);
  card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCard();
    }
  });
});
