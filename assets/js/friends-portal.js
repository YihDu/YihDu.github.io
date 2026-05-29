(function () {
  var link = document.querySelector('.friends-random');
  if (!link) return;

  var friends = [];
  try {
    friends = JSON.parse(link.getAttribute('data-friends') || '[]');
  } catch (error) {
    friends = [];
  }

  link.addEventListener('click', function (event) {
    event.preventDefault();
    if (!friends.length) return;
    var friend = friends[Math.floor(Math.random() * friends.length)];
    window.open(friend.url, '_blank', 'noopener');
  });
}());
