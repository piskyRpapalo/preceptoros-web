/* preceptoros.org · theGame · LA TERMINAL: la interfaz no-mapa como un chatbot estandar (FIRMO del Soberano, 2026-10-12).

   La regla 5 de la LEY DEL SUELO concretada: la interfaz vive en los BORDES y el centro queda limpio para el mundo.
   - MENU A LA IZQUIERDA, colapsable: solo iconos en el telefono (64 px), expandido en escritorio (220 px); Alt+M lo
     abre y cierra. Es el UNICO HOGAR de cada panel: Tu cangrejo, Lugares, Donde juegas, Terminal J7, la Radio... y el
     Taller (que deja la barra de arriba). Las entradas salen de los paneles que EXISTEN (no hay botones muertos).
   - CADA ENTRADA abre SU panel en un cajon junto al menu, de uno en uno; pulsar otra vez lo cierra. Panel vacio = panel
     cerrado: sin panel elegido, el mapa queda limpio. Escape cierra.
   - EL CHAT DE LA RADIO va abajo (`radio_message_log.js`), colapsado en el telefono.
   - Las HOJAS (Taller, Batalla) siguen como estaban: sobre el mapa, con su «← Map»; una funcion las abre y la misma las
     cierra (sacado tal cual de `thegame.js`, que estaba por encima de 16 KiB).

   `monta(x)`: x = { capa, T, el, cada, tecnico, PESTANAS, alTaller() }. Devuelve S = { PANEL, HOJA, ZM, ZB, PARTIDA, MAPA,
   ARMYZ, muestra(id, foco), pliego(titulo, id, abierto, hijos), actual() }. Sin red, sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  /* Icono por panel (texto, cero assets). Lo que no esta aqui lleva un punto. */
  var ICONO = { 'pliego-estado': '◉', 'pliego-lugares': '⌖', 'pliego-entrada': '⚑', 'terminal-cangrejo': '⌨', 'radio-estado': '♪' };

  function monta(x) {
    var capa = x.capa, T = x.T, el = x.el, cada = x.cada;
    var S = { PANEL: {}, HOJA: {} }, actual = null, destino = null, abierto = null, R = { items: {} };
    var piso = capa.querySelector('#atlas-piso'), barra = capa.querySelector('.thegame-barra');
    if (!piso || !barra || capa.querySelector('#thegame-menu')) { return null; }

    /* --- las hojas: una funcion las abre y la misma las cierra ----------------------------------------------- */
    function muestra(id, foco) {
      if (S.HOJA[id] ? id === destino : destino === null) { return; }  /* ya pedida: una segunda transicion abortaria la primera */
      destino = S.HOJA[id] ? id : null;
      var d = document, rm = raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (id !== actual && d.startViewTransition && !rm && capa.isConnected) { d.startViewTransition(function () { muestraYa(id, foco); }); }
      else { muestraYa(id, foco); }
    }
    function muestraYa(id, foco) {
      actual = destino = S.HOJA[id] ? id : null;
      Object.keys(S.HOJA).forEach(function (k) { S.HOJA[k].hidden = k !== actual; });
      if (R.items.taller) { R.items.taller.setAttribute('aria-expanded', String(actual === 'taller')); }
      document.documentElement.classList.toggle('con-hoja', !!actual);
      if (actual === 'taller') { x.alTaller(); }
      if (actual && foco !== false) { var c = S.HOJA[actual].querySelector('.thegame-hoja-cierra'); if (c) { c.focus(); } }
      else if (foco && R.items.taller) { R.items.taller.focus(); }
    }
    function hoja(id, titulo) {
      var d = el('section', 'thegame-hoja'), cab = el('div', 'thegame-hoja-cab'), cu = el('div', 'thegame-hoja-cuerpo');
      d.id = 'thegame-' + id; d.hidden = true; d.setAttribute('role', 'region'); d.setAttribute('aria-label', titulo);
      var c = el('button', 'boton-sec thegame-hoja-cierra', '← ' + T('hoja_mapa')); c.type = 'button'; c.id = 'thegame-' + id + '-cierra';
      c.addEventListener('click', function () { muestra(null, true); });
      cab.appendChild(c); cab.appendChild(el('h3', null, titulo)); d.appendChild(cab); d.appendChild(cu); S.HOJA[id] = d;
      return cu;
    }
    function pliego(titulo, id, abre, hijos) {
      var d = el('details', 'thegame-pliego'); d.id = id; d.open = !!abre;
      d.appendChild(el('summary', null, titulo)); hijos.forEach(function (n) { d.appendChild(n); });
      return d;
    }

    /* --- el cajon (los paneles) y el menu que los abre ------------------------------------------------------- */
    x.PESTANAS.forEach(function (p) {
      var d = el('section'); p[2].split('|').forEach(function (q) { if (q) { cada(capa.querySelectorAll(q), function (n) { d.appendChild(n); }); } });
      x.tecnico(d); S.PANEL[p[0]] = d;
    });
    var cajon = el('aside', 'thegame-terminal'); cajon.id = 'thegame-terminal'; cajon.setAttribute('aria-label', T('terminal_aria')); cajon.hidden = true;
    var est = S.PANEL.casa; est.className = 'thegame-estado'; est.id = 'thegame-estado';
    S.ZM = el('div', 'thegame-mundo'); S.PARTIDA = el('div', 'thegame-partida');
    cada([].slice.call(S.PANEL.mapa.children), function (n) { S.PARTIDA.appendChild(n); });
    var ay = el('ol', 'thegame-ayuda');
    for (var nq = 1; nq < 8; nq++) { ay.appendChild(el('li', null, T('ayuda_' + nq))); }
    S.PARTIDA.insertBefore(ay, S.PARTIDA.firstChild);
    cajon.appendChild(pliego(T('pl_estado'), 'pliego-estado', true, [est]));
    cajon.appendChild(pliego(T('pl_lugares'), 'pliego-lugares', true, [S.ZM]));
    S.PANEL.casa = cajon; S.PANEL.mapa = cajon;
    /* El MAPA: su lienzo vive en su capa fija, detras de todo. */
    S.MAPA = el('div', 'thegame-mapa'); S.MAPA.id = 'thegame-mapa';
    var tal = hoja('taller', T('pes_taller')); tal.appendChild(S.PANEL.taller); S.PANEL.taller = tal;
    S.ARMYZ = el('div', 'casa-army'); tal.appendChild(S.ARMYZ);
    S.ZB = hoja('batalla', T('hoja_batalla'));

    var menu = el('nav', 'thegame-menu'); menu.id = 'thegame-menu'; menu.setAttribute('aria-label', T('menu_aria'));
    var ancho = el('button', 'thegame-menu-ancho', '☰'); ancho.type = 'button'; ancho.id = 'thegame-menu-ancho';
    ancho.setAttribute('aria-label', T('menu_ancho')); ancho.setAttribute('aria-expanded', 'false');
    var ul = el('ul', 'thegame-menu-lista'); menu.appendChild(ancho); menu.appendChild(ul);
    function expande(si) {
      var a = si == null ? !menu.classList.contains('expandido') : si;
      menu.classList.toggle('expandido', a); ancho.setAttribute('aria-expanded', String(a));
    }
    ancho.addEventListener('click', function () { expande(); });
    if (raiz.matchMedia && raiz.matchMedia('(min-width: 64rem)').matches) { expande(true); }

    /* Abrir un panel: el cajon se ve con ESE panel; pulsarlo otra vez lo cierra (panel vacio = cerrado). */
    function abre(id, foco) {
      abierto = abierto === id ? null : id;
      cajon.hidden = !abierto;
      cada(cajon.children, function (n) { if (n.tagName === 'DETAILS') { n.hidden = n.id !== abierto; if (n.id === abierto) { n.open = true; } } });
      Object.keys(R.items).forEach(function (k) { if (k !== 'taller') { R.items[k].setAttribute('aria-expanded', String(k === abierto)); } });
      document.documentElement.classList.toggle('con-cajon', !!abierto);
      if (abierto && foco !== false) { var s = cajon.querySelector('#' + abierto + ' > summary'); if (s) { s.focus(); } }
    }
    function entrada(id, icono, rotulo, accion) {
      var li = el('li'), b = el('button', 'thegame-menu-item'); b.type = 'button'; b.id = 'menu-' + id; b.dataset.panel = id;
      var i = el('span', 'thegame-menu-ico', icono); i.setAttribute('aria-hidden', 'true');
      b.appendChild(i); b.appendChild(el('span', 'thegame-menu-rotulo', rotulo)); b.setAttribute('aria-label', rotulo); b.title = rotulo;
      b.setAttribute('aria-expanded', 'false'); b.addEventListener('click', accion);
      li.appendChild(b); ul.appendChild(li); R.items[id] = b;
      return b;
    }
    /* Las entradas salen de los paneles que EXISTEN en el cajon (y de los que se monten despues). */
    function sincroniza() {
      cada(cajon.children, function (d) {
        if (d.tagName !== 'DETAILS') { return; }
        if (!d.id) { d.id = (d.className.split(' ').filter(function (c) { return c !== 'thegame-pliego'; })[0] || 'panel') ; }
        if (R.items[d.id]) { return; }
        var s = d.querySelector('summary'), rot = s ? s.textContent.trim() : d.id;
        entrada(d.id, ICONO[d.id] || '•', rot, function () { abre(d.id); });
        d.hidden = d.id !== abierto;
      });
    }
    entrada('taller', '⚒︎', T('pes_taller'), function () { muestra(actual === 'taller' ? null : 'taller'); }).setAttribute('aria-controls', 'thegame-taller');
    /* Opinar sobre la pagina: su unico hogar es el menu (la pestana vertical lateral se oculta dentro del juego). */
    if (raiz.PageComment && raiz.PageComment.abre) { entrada('opinar', '\u270E', T('menu_opinar'), function () { raiz.PageComment.abre(); }); }
    sincroniza();
    new MutationObserver(sincroniza).observe(cajon, { childList: true });

    [S.MAPA, menu, cajon, S.HOJA.taller, S.HOJA.batalla].forEach(function (n) { piso.appendChild(n); });
    cada(piso.querySelectorAll(':scope > .atlas-rejilla'), function (n) { n.remove(); });
    document.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); expande(); ancho.focus(); return; }
      if (e.key !== 'Escape' || document.querySelector('.atlas-dlg-capa,dialog[open]')) { return; }
      if (actual) { muestra(null, true); } else if (abierto) { var b = R.items[abierto]; abre(abierto); if (b) { b.focus(); } }
    });
    /* Con la grieta abierta, «Tu cangrejo» lleva un punto: el aviso llega aunque el cajon este cerrado. */
    var a = est.querySelector('.atlas-alerta');
    if (a) {
      var marca = function () { var b = R.items['pliego-estado']; if (b) { b.classList.toggle('con-aviso', !a.classList.contains('sellada')); } };
      new MutationObserver(marca).observe(a, { attributes: true, attributeFilter: ['class'] });
      marca();
    }
    /* La Radio escrita, abajo; su primer mensaje es el aviso de lengua, si lo hay (antes lo garantizaba el Estado abierto). */
    if (raiz.AtlasRadioChat) {
      raiz.AtlasRadioChat.monta(capa, { T: T });
      var aviso = capa.querySelector('#atlas-juego > .no-data:first-child, .thegame-estado > .no-data:first-child');
      if (aviso) { raiz.AtlasRadioChat.dice({ quien: 'Radio', fuente: 'lengua', texto: aviso.textContent, sello: 'NO_DATA' }); }
    }
    muestraYa(null);
    S.muestra = muestra; S.pliego = pliego; S.abre = abre; S.actual = function () { return actual; };
    return S;
  }
  raiz.AtlasChatTerminal = { monta: monta };
})(this);
