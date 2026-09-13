(function () {
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var preference = null;
  var button;

  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') preference = saved;
  } catch (_) {
    // The theme still works when storage is unavailable.
  }

  function applyTheme() {
    var theme = preference || (root.dataset.autoTheme === 'true' && media.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    if (!button) return;
    var label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    button.setAttribute('aria-label', label);
    button.title = label;
    var icon = button.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-sun', theme === 'dark');
      icon.classList.toggle('fa-moon', theme !== 'dark');
    }
  }

  // Apply the saved preference in the head, before the first paint.
  applyTheme();
  media.addEventListener('change', applyTheme);
  window.addEventListener('storage', function (event) {
    if (event.key !== 'theme' && event.key !== null) return;
    preference = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null;
    applyTheme();
  });

  document.addEventListener('DOMContentLoaded', function () {
    button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.hidden = false;
    applyTheme();
    button.addEventListener('click', function () {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      try { localStorage.setItem('theme', preference); } catch (_) {}
    });
  });
}());
