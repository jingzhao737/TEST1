;// ═══════════ HASH ROUTER ═══════════
const ROUTE_PREFIX = '#/work/';
let detailOpenedFromHash = false;
let savedScrollY = 0;

function buildGalleryHTML(gallery) {
  if (!gallery || !gallery.length) return '';
  // Determine layout class based on count
  let layoutClass = '';
  if (gallery.length === 1) layoutClass = 'layout-1';
  else if (gallery.length === 2) layoutClass = 'layout-2';
  else if (gallery.length === 3) layoutClass = 'layout-3';
  else if (gallery.length === 4) layoutClass = 'layout-4';
  else if (gallery.length === 5) layoutClass = 'layout-5';
  else layoutClass = 'layout-masonry';

  let html = '<div class="detail-gallery ' + layoutClass + '">';
  for (let i = 0; i < gallery.length; i++) {
    const item = gallery[i];
    const src = typeof item === 'string' ? item : item.src;
    const caption = typeof item === 'string' ? '' : (item.caption || '');
    const desc = typeof item === 'string' ? '' : (item.desc || '');
    html += '<div class="gal-item" data-index="' + i + '">';
    html += '<div class="skeleton"></div>';
    html += '<img src="' + src + '" alt="' + (caption || 'gallery image') + '" loading="lazy" onload="this.classList.add(\'loaded\');this.previousElementSibling.style.display=\'none\'">';
    if (caption) html += '<div class="gal-caption"><div class="gal-caption-title">' + caption + '</div>' + (desc ? '<div class="gal-caption-desc">' + desc + '</div>' : '') + '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderDetailContent(data, heroImg) {
  document.getElementById('detailTag').textContent = data.tag;
  document.getElementById('detailTitle').textContent = data.name;
  document.getElementById('detailSubtitle').textContent = data.subtitle;
  // Hero with skeleton
  const heroEl = document.getElementById('detailHeroImg');
  const heroSkeleton = document.getElementById('detailHeroSkeleton');
  if (heroSkeleton) { heroSkeleton.classList.remove('hidden'); }
  heroEl.onload = function() {
    if (heroSkeleton) { heroSkeleton.classList.add('hidden'); }
  };
  heroEl.src = heroImg;
  document.getElementById('detailMeta').innerHTML = Object.keys(data.meta).map(function(k) {
    return '<div class="detail-meta-item"><span class="detail-meta-label">' + k + '</span><span class="detail-meta-value">' + data.meta[k] + '</span></div>';
  }).join('');
  document.getElementById('detailContent').innerHTML = data.content.map(function(s) {
    return '<h2>' + s.h2 + '</h2><p>' + s.p + '</p>';
  }).join('');
  document.getElementById('detailGallery').innerHTML = buildGalleryHTML(data.gallery);
}

function openDetail(data, heroImg, pushState) {
  if (pushState === undefined) pushState = true;
  savedScrollY = window.scrollY;
  if (pushState && data.slug) {
    history.pushState({ work: data.slug }, '', ROUTE_PREFIX + data.slug);
  }
  renderDetailContent(data, heroImg);
  pageTransition.classList.add('active'); setTimeout(function() { pageTransition.classList.remove('active'); }, 1000);
  document.body.style.overflow = 'hidden'; workDetail.style.display = 'block'; workDetail.scrollTop = 0;
  requestAnimationFrame(function() {
    workDetail.classList.add('open');
    // Init lightbox click handlers
    initGalleryLightbox();
  });
}

function closeDetail(popState) {
  workDetail.classList.remove('open');
  if (popState) {
    history.replaceState(null, '', ' ' + window.location.pathname + location.hash.replace(ROUTE_PREFIX, '#work'));
  }
  setTimeout(function() {
    workDetail.style.display = 'none'; document.body.style.overflow = '';
    window.scrollTo({ top: savedScrollY, behavior: 'instant' });
  }, 700);
}

// Lightbox
let lightboxIndex = 0, lightboxItems = [];

function initGalleryLightbox() {
  const items = workDetail.querySelectorAll('.gal-item');
  items.forEach(function(item, idx) {
    item.onclick = function() { openLightbox(idx); };
  });
}

function openLightbox(index) {
  const items = workDetail.querySelectorAll('.gal-item img');
  lightboxItems = Array.from(items).map(img => img.src);
  lightboxIndex = index;
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  lb.querySelector('.lightbox-img').src = lightboxItems[index];
  lb.querySelector('.lightbox-counter').textContent = (index + 1) + ' / ' + lightboxItems.length;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  lb.classList.remove('open');
  if (!workDetail.classList.contains('open')) document.body.style.overflow = '';
}

function lightboxPrev() {
  if (lightboxItems.length === 0) return;
  lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
  const lb = document.getElementById('galleryLightbox');
  lb.querySelector('.lightbox-img').src = lightboxItems[lightboxIndex];
  lb.querySelector('.lightbox-counter').textContent = (lightboxIndex + 1) + ' / ' + lightboxItems.length;
}

function lightboxNext() {
  if (lightboxItems.length === 0) return;
  lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
  const lb = document.getElementById('galleryLightbox');
  lb.querySelector('.lightbox-img').src = lightboxItems[lightboxIndex];
  lb.querySelector('.lightbox-counter').textContent = (lightboxIndex + 1) + ' / ' + lightboxItems.length;
}

// Hash router event listeners
window.addEventListener('popstate', function(e) {
  const hash = window.location.hash;
  if (hash.startsWith(ROUTE_PREFIX) && e.state && e.state.work) {
    const slug = e.state.work;
    const data = workData[slug];
    if (data) {
      const dataWithSlug = Object.assign({ slug: slug }, data);
      const heroImg = workHeroMap[slug] || (data.gallery && data.gallery.length ? (typeof data.gallery[0] === 'string' ? data.gallery[0] : data.gallery[0].src) : '');
      openDetail(dataWithSlug, heroImg, false);
    }
  } else if (workDetail.classList.contains('open')) {
    closeDetail(false);
  }
});

// Check URL on page load
window.addEventListener('load', function() {
  const hash = window.location.hash;
  if (hash.startsWith(ROUTE_PREFIX)) {
    const slug = hash.slice(ROUTE_PREFIX.length);
    const data = workData[slug];
    if (data) {
      const dataWithSlug = Object.assign({ slug: slug }, data);
      const heroImg = workHeroMap[slug] || (data.gallery && data.gallery.length ? (typeof data.gallery[0] === 'string' ? data.gallery[0] : data.gallery[0].src) : '');
      setTimeout(function() { openDetail(dataWithSlug, heroImg, false); }, 500);
    }
  }
});

document.getElementById('detailClose').addEventListener('click', function() { closeDetail(true); });

// Lightbox bindings — run after DOM ready
document.addEventListener('DOMContentLoaded', function() {
  const lbClose = document.querySelector('.lightbox-close');
  const lbPrev = document.querySelector('.lightbox-nav-prev');
  const lbNext = document.querySelector('.lightbox-nav-next');
  const lb = document.querySelector('.gallery-lightbox');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', lightboxPrev);
  if (lbNext) lbNext.addEventListener('click', lightboxNext);
  if (lb) lb.addEventListener('click', function(e) { if (e.target === e.currentTarget) closeLightbox(); });
});

document.addEventListener('keydown', function(e) {
  const lb = document.getElementById('galleryLightbox');
  if (lb && lb.classList.contains('open')) {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowLeft') { lightboxPrev(); return; }
    if (e.key === 'ArrowRight') { lightboxNext(); return; }
    return;
  }
  if (e.key === 'Escape' && workDetail.classList.contains('open')) { closeDetail(true); return; }
  if (workDetail.classList.contains('open')) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' }); }
  if (e.key === 'ArrowUp') { e.preventDefault(); window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' }); }
});
workDetail.addEventListener('wheel', function(e) {
  e.stopPropagation();
  let atTop = workDetail.scrollTop <= 0, atBottom = workDetail.scrollTop + workDetail.clientHeight >= workDetail.scrollHeight - 2;
  if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) e.preventDefault();
}, { passive: false });
