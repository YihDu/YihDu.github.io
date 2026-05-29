(function () {
  var lightbox = document.querySelector('.photo-lightbox');
  if (!lightbox) return;

  var image = lightbox.querySelector('img');
  var caption = lightbox.querySelector('.photo-lightbox-caption');
  var closeButton = lightbox.querySelector('.photo-lightbox-close');

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    image.setAttribute('src', '');
  }

  document.querySelectorAll('.photo-tile').forEach(function (tile) {
    tile.addEventListener('click', function () {
      image.setAttribute('src', tile.getAttribute('data-full'));
      image.setAttribute('alt', tile.getAttribute('data-caption') || '');
      caption.textContent = tile.getAttribute('data-caption') || '';
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLightbox();
  });
}());
