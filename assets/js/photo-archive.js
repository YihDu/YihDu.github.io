(function () {
  var home = document.querySelector('.photo-home');
  if (!home) return;
  var cards = Array.from(document.querySelectorAll('.photo-story'));
  var years = Array.from(document.querySelectorAll('[data-year-filter]'));
  var categories = Array.from(document.querySelectorAll('[data-category-filter]'));
  var sections = Array.from(document.querySelectorAll('[data-year-section]'));
  var empty = document.querySelector('.photo-filter-empty');
  var status = document.querySelector('[data-filter-status]');
  var reset = document.querySelector('[data-filter-reset]');
  var emptyReset = document.querySelector('[data-empty-reset]');
  var query = new URLSearchParams(location.search);
  var activeYear = query.get('year') || 'All';
  var activeCategory = query.get('category') || 'All';

  function apply() {
    var visible = 0;
    cards.forEach(function (card) {
      var matchesYear = activeYear === 'All' || (card.dataset.years || '').split(/\s+/).indexOf(activeYear) >= 0;
      var matchesCategory = activeCategory === 'All' || card.dataset.category === activeCategory;
      card.hidden = !(matchesYear && matchesCategory);
      if (!card.hidden) visible++;
    });
    sections.forEach(function (section) {
      var count = Array.from(section.querySelectorAll('.photo-story')).filter(function (card) { return !card.hidden; }).length;
      section.hidden = count === 0;
      var countLabel = section.querySelector('[data-section-count]');
      if (countLabel) countLabel.textContent = count + ' 个相册';
    });
    years.forEach(function (item) {
      var selected = item.dataset.yearFilter === activeYear;
      item.classList.toggle('active', selected);
      if (selected) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    categories.forEach(function (item) {
      var selected = item.dataset.categoryFilter === activeCategory;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    if (status) status.textContent = visible + ' 个相册';
    if (empty) empty.hidden = visible !== 0;
    if (reset) reset.hidden = activeYear === 'All' && activeCategory === 'All';
  }

  function update() {
    var params = new URLSearchParams(location.search);
    params.delete('year');
    params.delete('category');
    params.delete('place');
    if (activeYear !== 'All') params.set('year', activeYear);
    if (activeCategory !== 'All') params.set('category', activeCategory);
    // Include the pathname so resetting also removes the old query string.
    history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params.toString() : '') + '#archive');
    apply();
    if (typeof Event === 'function') home.dispatchEvent(new Event('photo:filter'));
  }

  function modified(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  years.forEach(function (item) {
    item.addEventListener('click', function (event) {
      if (modified(event)) return;
      event.preventDefault();
      activeYear = item.dataset.yearFilter;
      update();
    });
  });
  categories.forEach(function (item) {
    item.addEventListener('click', function () {
      activeCategory = item.dataset.categoryFilter;
      update();
    });
  });
  function resetAll() {
    activeYear = 'All';
    activeCategory = 'All';
    update();
  }
  if (reset) reset.addEventListener('click', resetAll);
  if (emptyReset) emptyReset.addEventListener('click', resetAll);
  apply();
}());
