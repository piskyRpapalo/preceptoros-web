/* preceptoros.org · LA APP, A UN CLIC. Se elige el sistema y se descarga.
 *
 * QUE PIDIO EL SOBERANO (2026-09-23): «poner la app en la web a 1 solo click
 * de descarga seleccionando el sistema operativo». Estaba en tres botones
 * iguales dentro de un plegable cerrado: habia que abrirlo, leer los tres y
 * saber cual era el tuyo.
 *
 * AHORA: el sistema se adivina del navegador y queda ELEGIDO en una fila de
 * cinco; si se adivino mal, se toca otro. Debajo, UN boton que descarga el
 * guion de ese sistema desde GitHub Releases. El marcado de siempre --los tres
 * enlaces-- se queda en la pagina para quien no ejecute JavaScript, y este
 * guion lo oculta cuando pinta el suyo: nunca dos puertas a lo mismo.
 *
 * LO QUE NO PROMETE. «Un clic» es la descarga, no la instalacion: el guion hay
 * que abrirlo, y la nota lo dice con el comando exacto. Android no tiene APK
 * --el boton lleva a la guia de Termux-- y en iPhone no hay app. Windows y
 * macOS van con su aviso de que en el rack no hay ninguna maquina de esos
 * sistemas para probarlos. Todo texto sale de `herramientas-<lengua>.json`.
 */
(function () {
  'use strict';
  var caja = document.getElementById('descargas');
  if (!caja || caja.dataset.unClic) return;
  caja.dataset.unClic = '1';
  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var REL = 'https://github.com/piskyRpapalo/PreceptorOS/releases/latest/download/';
  var SO = {
    windows: { nombre: 'Windows', url: REL + 'install.ps1', nota: 'herr_desc_win', sinProbar: true },
    macos:   { nombre: 'macOS',   url: REL + 'install.sh',  nota: 'herr_desc_nix', sinProbar: true },
    linux:   { nombre: 'Linux',   url: REL + 'install.sh',  nota: 'herr_desc_nix' },
    android: { nombre: 'Android', url: '#android',          nota: 'herr_desc_apk' },
    iphone:  { nombre: 'iPhone',  url: '#pwa-puerta',       nota: 'herr_desc_ios' }
  };

  function adivina() {
    var ua = navigator.userAgent || '';
    var pl = (navigator.userAgentData && navigator.userAgentData.platform) ||
             navigator.platform || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iphone';
    if (/Win/i.test(pl) || /Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(pl) || /Mac OS X/i.test(ua)) return 'macos';
    return 'linux';
  }

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }

  function estilo() {
    var e = document.createElement('style');
    e.textContent =
      '.un-clic{margin:.4rem 0 .8rem}' +
      '.un-clic-so{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.6rem}' +
      '.un-clic-chip{font:inherit;font-size:.82rem;padding:.3rem .7rem;' +
        'border-radius:var(--radio,14px);border:1px solid currentColor;' +
        'background:transparent;color:inherit;cursor:pointer}' +
      '.un-clic-chip[aria-checked="true"]{background:var(--oro,#E8C66A);' +
        'color:#17131F;border-color:transparent;font-weight:600}' +
      '.un-clic-boton{display:block;text-align:center;font-size:1.05rem;' +
        'padding:.75rem 1rem}' +
      '.un-clic-nota{margin:.5rem 0 0}';
    document.head.appendChild(e);
  }

  function pinta(u) {
    estilo();
    var bloque = el('div', 'un-clic');
    var fila = el('div', 'un-clic-so');
    fila.setAttribute('role', 'radiogroup');
    fila.setAttribute('aria-label', u.herr_desc_so || '');
    var boton = el('a', 'boton un-clic-boton');
    var nota = el('p', 'tenue un-clic-nota');
    var aviso = el('p', 'nodata un-clic-aviso');

    function elige(clave) {
      var s = SO[clave];
      Array.prototype.forEach.call(fila.children, function (b) {
        b.setAttribute('aria-checked', String(b.dataset.so === clave));
      });
      var guia = s.url.charAt(0) === '#';
      boton.textContent = ((guia ? u.herr_desc_guia : u.herr_desc_boton) || '{so}')
        .replace('{so}', s.nombre);
      boton.href = s.url;
      if (s.url.charAt(0) === '#') boton.removeAttribute('download');
      else boton.setAttribute('download', '');
      nota.textContent = u[s.nota] || '';
      aviso.textContent = s.sinProbar
        ? (u.herr_desc_sinprobar || '').replace('{so}', s.nombre) : '';
      aviso.hidden = !s.sinProbar;
    }

    Object.keys(SO).forEach(function (clave) {
      var b = el('button', 'un-clic-chip', SO[clave].nombre);
      b.type = 'button';
      b.dataset.so = clave;
      b.setAttribute('role', 'radio');
      b.addEventListener('click', function () { elige(clave); });
      fila.appendChild(b);
    });
    bloque.appendChild(fila);
    bloque.appendChild(boton);
    bloque.appendChild(nota);
    bloque.appendChild(aviso);

    // `hidden` no basta: `.fila` declara `display` y una regla de autor pisa al
    // atributo (la cicatriz de `[hidden]` del 2026-09-01). Se apaga en linea.
    var viejos = caja.querySelector('.ob-descargas');
    if (viejos) { viejos.hidden = true; viejos.style.display = 'none'; }
    /* DONDE SE VE PRIMERO. Si `instalar-descargas.js` ya pinto la tarjeta de
       la app (arriba del todo), el boton va ahi y sustituye al enlace a la
       pagina de versiones; si no --o la descarga esta en pausa--, va al
       plegable de siempre, que se abre. Una sola puerta en los dos casos. */
    var tarjeta = document.getElementById('app-un-clic');
    var respaldo = tarjeta && tarjeta.querySelector('.app-respaldo');
    var enPausa = respaldo && respaldo.querySelector('button[disabled]');
    if (tarjeta && respaldo && !enPausa) {
      respaldo.style.display = 'none';
      tarjeta.insertBefore(bloque, respaldo);
      // El plegable se queda sin nada que ofrecer: se apaga, y quien llegue
      // por un enlace viejo a `#descargas` (onboarding, Herramientas) aterriza
      // en la tarjeta en vez de en una caja vacia.
      caja.style.display = 'none';
      var alAncla = function () {
        if (location.hash === '#descargas') tarjeta.scrollIntoView({ block: 'start' });
      };
      window.addEventListener('hashchange', alAncla);
      alAncla();
    } else {
      caja.insertBefore(bloque, caja.querySelector('summary').nextSibling);
      caja.open = true;
    }
    elige(adivina());
  }

  var textos = fetch('/herramientas-' + lang + '.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; });
  /* Se espera a la tarjeta de la app (la pinta otro guion, tambien al vuelo),
     pero sin depender de ella: a los dos segundos se monta donde se pueda. */
  var tarjetaLista = new Promise(function (listo) {
    if (document.getElementById('app-un-clic')) return listo();
    document.addEventListener('preceptor:app-tarjeta', listo, { once: true });
    setTimeout(listo, 2000);
  });
  Promise.all([textos, tarjetaLista]).then(function (r) {
    var d = r[0];
    if (d && d.ui && d.ui.herr_desc_boton) pinta(d.ui);
  });
})();
