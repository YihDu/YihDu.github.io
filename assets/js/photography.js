(function () {
  var lightbox = document.querySelector('.photo-lightbox');

  if (lightbox) {
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
  }

  var filterButtons = document.querySelectorAll('.photo-filter button');
  var storyCards = document.querySelectorAll('.photo-story-card');
  var mapElement = document.getElementById('photo-map');
  var mapMarkers = {};
  var markerIcons = {};

  function markerIcon(active) {
    var key = active ? 'active' : 'default';
    if (!markerIcons[key]) {
      markerIcons[key] = window.L.divIcon({
        className: 'photo-map-marker' + (active ? ' is-active' : ''),
        html: '<span class="photo-map-marker-dot"></span>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -9],
        tooltipAnchor: [8, 0]
      });
    }
    return markerIcons[key];
  }

  function setLinkedState(albumId, active, openTooltip) {
    var marker = mapMarkers[albumId];
    var card = document.querySelector('.photo-story-card[data-album-id="' + albumId + '"]');
    if (marker) {
      marker.setIcon(markerIcon(active));
      if (active && openTooltip) marker.openTooltip();
      if (!active) marker.closeTooltip();
    }
    if (card) card.classList.toggle('map-active', active);
  }

  if (mapElement) {
    if (typeof window.L === 'undefined') {
      mapElement.textContent = 'The map could not be loaded.';
    } else {
      var map = window.L.map(mapElement, {
        scrollWheelZoom: false
      });
      var bounds = [];

      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      document.querySelectorAll('.photo-map-data [data-latitude]').forEach(function (item) {
        var latitude = Number(item.getAttribute('data-latitude'));
        var longitude = Number(item.getAttribute('data-longitude'));
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        var albumId = item.getAttribute('data-album-id');
        var popup = document.createElement('div');
        popup.className = 'photo-map-popup';

        var cover = document.createElement('img');
        cover.src = item.getAttribute('data-cover');
        cover.alt = '';
        cover.loading = 'lazy';

        var title = document.createElement('strong');
        title.textContent = item.getAttribute('data-title');

        var meta = document.createElement('span');
        meta.textContent = [
          item.getAttribute('data-date'),
          item.getAttribute('data-location')
        ].filter(Boolean).join(' · ');

        var link = document.createElement('a');
        link.href = item.getAttribute('data-url');
        link.textContent = 'Open album';

        popup.appendChild(cover);
        popup.appendChild(title);
        popup.appendChild(meta);
        popup.appendChild(link);

        var marker = window.L.marker([latitude, longitude], {
          icon: markerIcon(false),
          riseOnHover: true
        })
          .addTo(map)
          .bindPopup(popup)
          .bindTooltip(item.getAttribute('data-title'), {
            direction: 'right',
            offset: [5, 0]
          });
        mapMarkers[albumId] = marker;
        bounds.push([latitude, longitude]);

        marker.on('mouseover', function () {
          setLinkedState(albumId, true, false);
          marker.openTooltip();
        });
        marker.on('mouseout', function () {
          setLinkedState(albumId, false, false);
        });
        marker.on('click', function () {
          setLinkedState(albumId, true, false);
        });
        marker.on('popupclose', function () {
          setLinkedState(albumId, false, false);
        });
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 6 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 8);
      } else {
        map.setView([30, 110], 4);
      }
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.getAttribute('data-filter');
      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      storyCards.forEach(function (card) {
        card.hidden = filter !== 'All' && card.getAttribute('data-group') !== filter;
      });
      document.querySelectorAll('.photo-year-heading').forEach(function (heading) {
        var year = heading.getAttribute('data-year');
        var hasVisibleCard = Array.prototype.some.call(storyCards, function (card) {
          return card.getAttribute('data-year') === year && !card.hidden;
        });
        heading.hidden = !hasVisibleCard;
      });
    });
  });

  storyCards.forEach(function (card) {
    var albumId = card.getAttribute('data-album-id');
    var marker = mapMarkers[albumId];
    if (!marker) return;

    card.addEventListener('mouseenter', function () {
      setLinkedState(albumId, true, true);
    });
    card.addEventListener('mouseleave', function () {
      setLinkedState(albumId, false, false);
    });
    card.addEventListener('focusin', function () {
      setLinkedState(albumId, true, true);
    });
    card.addEventListener('focusout', function () {
      setLinkedState(albumId, false, false);
    });
  });

  var yearLinks = document.querySelectorAll('[data-year-link]');
  var yearHeadings = document.querySelectorAll('.photo-year-heading');
  if ('IntersectionObserver' in window && yearHeadings.length) {
    var yearObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        yearLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('data-year-link') === entry.target.getAttribute('data-year'));
        });
      });
    }, { rootMargin: '-15% 0px -75% 0px' });

    yearHeadings.forEach(function (heading) {
      yearObserver.observe(heading);
    });
  }
}());
