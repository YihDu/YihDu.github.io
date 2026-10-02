(function () {
  var home = document.querySelector('.photo-home');
  if (!home || !window.matchMedia || !window.IntersectionObserver) return;
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cards = Array.from(home.querySelectorAll('.photo-story'));
  var animations = new Map();

  function reveal(card, delay) {
    if (preference.matches || card.hidden || !card.animate) return;
    if (animations.has(card)) animations.get(card).cancel();
    var animation = card.animate([
      { opacity: 0, transform: 'translateY(14px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 620, delay: delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    animations.set(card, animation);
    animation.onfinish = function () {
      if (animations.get(card) === animation) animations.delete(card);
    };
  }

  // Content stays visible if JavaScript or the observer is unavailable.
  var observer = new window.IntersectionObserver(function (entries) {
    entries.filter(function (entry) { return entry.isIntersecting; }).forEach(function (entry, index) {
      reveal(entry.target, Math.min(index, 3) * 65);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  cards.forEach(function (card) { observer.observe(card); });

  home.addEventListener('photo:filter', function () {
    animations.forEach(function (animation) { animation.cancel(); });
    animations.clear();
    // Re-observe the new layout; only visible cards animate, without delaying filtering.
    cards.forEach(function (card) {
      observer.unobserve(card);
      if (!card.hidden) observer.observe(card);
    });
  });
  if (preference.addEventListener) {
    preference.addEventListener('change', function () {
      if (preference.matches) {
        animations.forEach(function (animation) { animation.cancel(); });
        animations.clear();
      }
    });
  }
}());
