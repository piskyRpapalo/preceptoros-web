(function () {
  if (!('serviceWorker' in navigator)) return;

  if (!self.isSecureContext) return;
  addEventListener('load', function () {

    navigator.serviceWorker.register('/sw.js')
      .then(function (r) { if (r && r.update) { return r.update(); } })
      .catch(function () {});
  });
})();

(function () {

  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); });

  function textos() {
    var b = document.getElementById('i18n');
    if (!b) return null;
    try { return JSON.parse(b.textContent); } catch (_) { return null; }
  }

  function instalada() {

    return (matchMedia && matchMedia('(display-mode: standalone)').matches) ||
           navigator.standalone === true;
  }

  function esIos() {

    return navigator.standalone === false;
  }

})();
