(function () {
  var button = document.querySelector('.theme-toggle');
  if (!button) return;

  var icon = button.querySelector('i');
  var saved = localStorage.getItem('theme');

  function setTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    if (icon) {
      icon.classList.toggle('fa-sun', theme === 'dark');
      icon.classList.toggle('fa-moon', theme !== 'dark');
    }
    localStorage.setItem('theme', theme);
  }

  if (saved === 'dark' || saved === 'light') {
    setTheme(saved);
  }

  button.addEventListener('click', function () {
    setTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
  });
}());
