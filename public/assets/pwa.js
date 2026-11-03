(function () {
  if (!('serviceWorker' in navigator)) return;

  if (!self.isSecureContext) return;
  // First load after a deploy (odd/tasks/sw-primera-carga.md, measured on the Doogee 2026-11-03): a returning visit
  // starts on the previous worker's cached code. When the new worker takes control, reload ONCE so the visit runs
  // today's code; never a first-ever visit, never after the visitor touched the page, never twice in 30 s.
  var antes = !!navigator.serviceWorker.controller, tocada = false;
  ['pointerdown', 'keydown'].forEach(function (t) { addEventListener(t, function () { tocada = true; }, { capture: true, once: true }); });
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!antes) { return; }
    if (tocada) { return; }
    try { if (Date.now() - Number(sessionStorage.getItem('sw-recarga') || 0) < 30000) { return; } sessionStorage.setItem('sw-recarga', String(Date.now())); } catch (_) { return; }
    location.reload();
  });
  addEventListener('load', function () {

    navigator.serviceWorker.register('/sw.js')
      .then(function (r) { if (r && r.update) { return r.update(); } })
      .catch(function () {});
  });
})();

(function () {

  // NORTE 5 (a1, 2026-10-27): the browser's offer to install is KEPT, not thrown away, so a button can make it in one click
  // (the launch gate's first lane on /get-the-app/). Nothing installs without that click.
  var oferta = null;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); oferta = e; dispatchEvent(new Event('pwa-oferta')); });
  addEventListener('appinstalled', function () { oferta = null; dispatchEvent(new Event('pwa-oferta')); });

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

  window.PreceptorPwa = {
    instalable: function () { return !!oferta; },
    instalada: instalada,
    instala: function () {
      if (!oferta) { return Promise.resolve(false); }
      var e = oferta; oferta = null; e.prompt();
      return (e.userChoice || Promise.resolve({})).then(function (c) { dispatchEvent(new Event('pwa-oferta')); return !!c && c.outcome === 'accepted'; });
    }
  };

})();
