// NORTE 5 (a1, 2026-10-27) · the app in one or two clicks, on /get-the-app/. It draws the launch gate (VT6,
// public/game/launch_gate.js, signed 2026-10-19) that no page drew: lane 1 installs the web app in one click when the
// browser offers it (pwa.js keeps that offer); lane 2 installs the app only with a SIGNED receipt for this system in
// release.json; lane 3 lists the models with their measured size, and a download only with a sha256. Every lane that
// cannot act says why (NO_DATA with its cause). Its data is written into the page by local_first_surface_build.py:
// no request, no storage, no clock.
(function () {
  'use strict';
  var G = window.AtlasLaunchGate, caja = document.getElementById('gate-carriles'), fuente = document.getElementById('gate-datos');
  if (!G || !caja || !fuente) { return; }
  var datos = JSON.parse(fuente.textContent);
  var TITULO = { pwa: 'The web app', app: 'The app · your node' };
  var NOTA = {
    pwa: 'This site, installed: it opens without the browser bar and plays offline after the first visit.',
    app: 'Local memory and a local AI on your own machine (' + datos.version + ').'
  };

  function sistema() {
    var u = navigator.userAgent || '';
    return /Android/i.test(u) ? 'android' : /Windows/i.test(u) ? 'windows' : /Mac OS X|iPhone|iPad/i.test(u) ? 'mac' : 'linux';
  }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = texto; }
    return n;
  }
  function accion(c) {
    var P = window.PreceptorPwa, b = c.boton;
    if (!b.activo) {
      var off = el('button', 'gate-boton', b.etiqueta);
      off.type = 'button'; off.disabled = true; off.setAttribute('aria-describedby', 'gate-causa-' + c.id);
      return off;
    }
    if (c.id === 'pwa') {
      var on = el('button', 'gate-boton', b.etiqueta);
      on.type = 'button';
      on.addEventListener('click', function () { if (P) { P.instala().then(pinta); } });
      return on;
    }
    var a = el('a', 'gate-boton', b.etiqueta);
    a.href = c.id === 'app' ? datos.pagina : (datos.descargas[c.id] || '#steps');
    return a;
  }
  function pinta() {
    var P = window.PreceptorPwa, os = sistema();
    var v = G.vista({ os: os, pwa: { instalable: !!(P && P.instalable()) }, release: datos.release, cerebros: datos.cerebros, carga: [] });
    caja.textContent = '';
    v.carriles.forEach(function (c) {
      var li = el('li', 'gate-carril');
      li.dataset.carril = c.id;
      li.appendChild(el('b', null, TITULO[c.id] || 'Model · ' + c.id));
      li.appendChild(el('span', 'gate-clics', c.clics === 1 ? '1 click' : c.clics + ' clicks'));
      if (NOTA[c.id]) { li.appendChild(el('p', null, NOTA[c.id])); }
      if (c.cifra) { li.appendChild(el('p', 'gate-cifra', c.cifra)); }
      if (c.id === 'pwa' && P && P.instalada()) { li.appendChild(el('p', 'gate-hecho', 'Already installed on this device.')); }
      li.appendChild(accion(c));
      if (c.boton.causa) { var p = el('p', 'gate-causa', c.boton.causa); p.id = 'gate-causa-' + c.id; li.appendChild(p); }
      caja.appendChild(li);
    });
    caja.dataset.sistema = os;
    caja.dataset.fallos = String(G.valida(v).length);
  }
  addEventListener('pwa-oferta', pinta);
  pinta();
})();
