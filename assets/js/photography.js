(function () {
  var root = document.documentElement;
  var lightbox = document.querySelector('.photo-lightbox');
  var tiles = Array.from(document.querySelectorAll('[data-photo]'));
  if (!lightbox || !tiles.length || typeof lightbox.showModal !== 'function') return;
  var image = lightbox.querySelector('img'), caption = lightbox.querySelector('.photo-lightbox-caption');
  var counter = lightbox.querySelector('.photo-lightbox-counter'), error = lightbox.querySelector('.photo-lightbox-error');
  var previous = lightbox.querySelector('.photo-lightbox-prev'), next = lightbox.querySelector('.photo-lightbox-next'), current = 0, touchStart;
  function show(index) {
    current = (index + tiles.length) % tiles.length; var tile = tiles[current];
    image.hidden = false; error.hidden = true; image.src = tile.href; image.alt = tile.querySelector('img').alt;
    caption.textContent = tile.dataset.caption || ''; counter.textContent = (current + 1) + ' / ' + tiles.length;
    error.querySelector('a').href = tile.href; previous.hidden = next.hidden = tiles.length < 2;
  }
  tiles.forEach(function (tile, index) { tile.addEventListener('click', function (event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); show(index); lightbox.showModal(); root.classList.add('has-open-dialog');
  }); });
  image.addEventListener('error', function () { image.hidden = true; error.hidden = false; });
  previous.addEventListener('click', function () { show(current - 1); });
  next.addEventListener('click', function () { show(current + 1); });
  lightbox.querySelector('.photo-lightbox-close').addEventListener('click', function () { lightbox.close(); });
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('close', function () { root.classList.remove('has-open-dialog'); image.removeAttribute('src'); });
  lightbox.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  lightbox.addEventListener('touchstart', function (event) { touchStart = event.touches.length === 1 ? { x:event.touches[0].clientX, y:event.touches[0].clientY } : null; }, {passive:true});
  lightbox.addEventListener('touchend', function (event) {
    if (!touchStart || !event.changedTouches.length) return; var dx=event.changedTouches[0].clientX-touchStart.x, dy=event.changedTouches[0].clientY-touchStart.y;
    if (Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.5) show(current + (dx<0 ? 1 : -1)); touchStart=null;
  }, {passive:true});
}());
