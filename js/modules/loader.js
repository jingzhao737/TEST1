;// ═══════════ LOADING ═══════════
(function() {
  let numEl = document.getElementById('loaderNumber');
  let bar = document.getElementById('loaderBar');
  let loaderEl = document.getElementById('loader');
  if (!numEl || !loaderEl) { revealCrescent(); if (loaderEl) loaderEl.style.display = 'none'; document.body.style.cursor = 'none'; return; }

  let total = 50, count = 0;
  let iv = setInterval(function() {
    count++;
    let raw = count / total;
    let eased = 1 - Math.pow(1 - raw, 3);
    let num = Math.floor(eased * 100);
    numEl.innerHTML = num + '<span class="pct">%</span>';
    if (bar) bar.style.width = (eased * 100) + '%';

    if (count >= total) {
      clearInterval(iv);
      numEl.innerHTML = '100<span class="pct">%</span>';
      if (bar) bar.style.width = '100%';
      setTimeout(function() {
        loaderEl.classList.add('hide');
        revealCrescent();
        setTimeout(function() { loaderEl.style.display = 'none'; document.body.style.cursor = 'none'; }, 800);
      }, 300);
    }
  }, 32);

  function revealCrescent() {
    document.querySelectorAll('.cr-char').forEach(function(el) {
      el.classList.add('revealed');
    });
  }
})();
