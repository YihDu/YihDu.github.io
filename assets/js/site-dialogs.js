(function () {
  document.querySelectorAll('[data-dialog-open]').forEach(function (trigger) {
    var dialog = document.getElementById(trigger.dataset.dialogOpen);
    if (!dialog || typeof dialog.showModal !== 'function') return;

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      dialog.showModal();
      document.documentElement.classList.add('has-open-dialog');
    });
    dialog.querySelector('[data-dialog-close]').addEventListener('click', function () {
      dialog.close();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('has-open-dialog');
    });
  });
}());
