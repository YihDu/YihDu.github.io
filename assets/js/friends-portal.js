(function () {
  var button = document.querySelector('.friends-random');
  if (!button) return;

  var friends = [];
  try {
    friends = JSON.parse(button.getAttribute('data-friends') || '[]');
  } catch (error) {
    friends = [];
  }

  button.addEventListener('click', function () {
    if (!friends.length) return;
    var friend = friends[Math.floor(Math.random() * friends.length)];
    button.textContent = 'Connecting...';
    setTimeout(function () {
      window.open(friend.url, '_blank', 'noopener');
      button.textContent = 'Take a random visit';
    }, 220);
  });
}());
