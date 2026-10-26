(function (raiz) {
  'use strict';

  var GRUPOS = { history: ['pliego-estado', 'pliego-lapidas'], buildings: ['pliego-lugares', 'pliego-ficha'],
    nodes: ['pliego-nodos', 'terminal-cangrejo', 'radio-estado', 'pliego-skills', 'pliego-opinar'], start: ['pliego-entrada', 'pliego-tutorial'] };

  var vivo = null;
  // A transition interrupted by the next one is skipped and rejects `ready` (AbortError): expected, not a fault.
  function calla(t) { if (t && t.ready) { t.ready.catch(function () {}); } }
  function monta(x) {
    var capa = x.capa, T = x.T, el = x.el, cada = x.cada;
    function texto(k, d) { var t = T(k); return t && t !== k ? t : d; }
    var S = { PANEL: {}, HOJA: {} }, actual = null, destino = null, abierto = null, transicion = 0, R = { items: {} };
    var piso = capa.querySelector('#atlas-piso'), barra = capa.querySelector('.thegame-barra');
    if (!piso || !barra || capa.querySelector('#thegame-menu')) { return null; }

    function muestra(id, foco) {
      if (S.HOJA[id] ? id === destino : destino === null) { return; }
      var turno = ++transicion;
      destino = S.HOJA[id] ? id : null;
      var d = document, rm = raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (id !== actual && d.startViewTransition && !rm && capa.isConnected) { calla(d.startViewTransition(function () { if (turno === transicion) { muestraYa(id, foco); } })); }
      else { muestraYa(id, foco); }
    }
    function muestraYa(id, foco) {
      actual = destino = S.HOJA[id] ? id : null;
      Object.keys(S.HOJA).forEach(function (k) { S.HOJA[k].hidden = k !== actual; });
      if (actual) { cierraCajon(); }
      if (R.items.waves) { R.items.waves.setAttribute('aria-expanded', String(actual === 'ondas')); }
      document.documentElement.classList.toggle('con-hoja', !!actual);
      if (actual === 'ondas') { Promise.resolve(x.alTaller()).then(mueveArmy); }
      if (actual && foco !== false) { var c = S.HOJA[actual].querySelector('.thegame-hoja-cierra'); if (c) { c.focus(); } }
      else if (foco && R.items.taller) { R.items.taller.focus(); }
    }
    function hoja(id, titulo) {
      var d = el('section', 'thegame-hoja'), cab = el('div', 'thegame-hoja-cab'), cu = el('div', 'thegame-hoja-cuerpo');
      d.id = 'thegame-' + id; d.classList.add('surface-slot'); d.hidden = true; d.setAttribute('role', 'region'); d.setAttribute('aria-label', titulo);
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

    function cierraCajon() {
      abierto = null; cajon.hidden = true;
      cada(cajon.children, function (n) { if (n.tagName === 'DETAILS') { n.hidden = true; } });
      Object.keys(R.items).forEach(function (k) { if (k !== 'taller') { R.items[k].setAttribute('aria-expanded', 'false'); } });
      document.documentElement.classList.remove('con-cajon');
    }
    function cierraHoja() {
      if (!actual && !destino) { return; }
      transicion++; muestraYa(null, false);
    }

    x.PESTANAS.forEach(function (p) {
      var d = el('section'); p[2].split('|').forEach(function (q) { if (q) { cada(capa.querySelectorAll(q), function (n) { d.appendChild(n); }); } });
      x.tecnico(d); S.PANEL[p[0]] = d;
    });
    var cajon = el('aside', 'thegame-terminal'); cajon.id = 'thegame-terminal'; cajon.classList.add('surface-slot'); cajon.setAttribute('aria-label', T('terminal_aria')); cajon.hidden = true;
    var est = S.PANEL.casa; est.className = 'thegame-estado'; est.id = 'thegame-estado';
    S.ZM = el('div', 'thegame-mundo'); S.PARTIDA = el('div', 'thegame-partida');
    cada([].slice.call(S.PANEL.mapa.children), function (n) { S.PARTIDA.appendChild(n); });
    var ay = el('ol', 'thegame-ayuda');
    for (var nq = 1; nq < 8; nq++) { ay.appendChild(el('li', null, T('ayuda_' + nq))); }
    S.PARTIDA.insertBefore(ay, S.PARTIDA.firstChild);
    cajon.appendChild(pliego(T('pl_estado'), 'pliego-estado', true, [est]));
    cajon.appendChild(pliego(T('pl_lugares'), 'pliego-lugares', true, [S.ZM]));
    S.PANEL.casa = cajon; S.PANEL.mapa = cajon;

    S.MAPA = el('div', 'thegame-mapa'); S.MAPA.id = 'thegame-mapa';

    var ond = hoja('ondas', T('army_h'));
    function mueveArmy() {
      var ul = capa.querySelector('.atlas-army');
      if (!ul || ond.contains(ul)) { return; }
      var h = ul.previousElementSibling;
      if (h && h.tagName === 'H5') { ond.appendChild(h); }
      ond.appendChild(ul);
    }
    S.ARMYZ = el('div', 'casa-army'); ond.appendChild(S.ARMYZ);

    var tal = el('div', 'taller-unido'); tal.appendChild(S.PANEL.taller); ond.appendChild(tal); S.PANEL.taller = tal;
    S.ZB = hoja('batalla', T('hoja_batalla'));

    var menu = el('nav', 'thegame-menu'); menu.id = 'thegame-menu'; menu.setAttribute('aria-label', T('menu_aria'));
    var ancho = el('button', 'thegame-menu-ancho', '☰'); ancho.type = 'button'; ancho.id = 'thegame-menu-ancho';
    ancho.setAttribute('aria-label', T('menu_ancho')); ancho.setAttribute('aria-expanded', 'false');
    var ul = el('ul', 'thegame-menu-lista'); menu.appendChild(ancho); menu.appendChild(ul);
    function expande(si) {
      var a = si == null ? !menu.classList.contains('expandido') : si;
      menu.classList.toggle('expandido', a); ancho.setAttribute('aria-expanded', String(a));
    }
    ancho.addEventListener('click', function () { cierraHoja(); expande(); });
    if (raiz.matchMedia && raiz.matchMedia('(min-width: 64rem)').matches) { expande(true); }

    function abre(id, foco, fijo) {
      var siguiente = abierto === id ? null : id;
      if (fijo) { siguiente = id; }
      if (siguiente && (actual || destino)) { cierraHoja(); }
      var turno = ++transicion, rm = raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function cambia() {
        if (turno !== transicion) { return; }
        abierto = siguiente; cajon.hidden = !abierto;
        cada(cajon.children, function (n) { if (n.tagName === 'DETAILS') { n.hidden = !abierto || GRUPOS[abierto].indexOf(n.id) < 0; if (!n.hidden) { n.open = true; } } });
        Object.keys(R.items).forEach(function (k) { R.items[k].setAttribute('aria-expanded', String(k === abierto)); });
        document.documentElement.classList.toggle('con-cajon', !!abierto);
        if (abierto && foco !== false) { var s = cajon.querySelector('#' + GRUPOS[abierto][0] + ' > summary'); if (s) { s.focus(); } }
      }
      if (document.startViewTransition && !rm && capa.isConnected) { calla(document.startViewTransition(cambia)); } else { cambia(); }
    }
    function entrada(id, icono, rotulo, accion) {
      var li = el('li'), b = el('button', 'thegame-menu-item'); b.type = 'button'; b.id = 'menu-' + id; b.dataset.panel = id;
      var i = el('span', 'thegame-menu-ico', icono); i.setAttribute('aria-hidden', 'true');
      b.appendChild(i); b.appendChild(el('span', 'thegame-menu-rotulo', rotulo)); b.setAttribute('aria-label', rotulo); b.title = rotulo;
      b.setAttribute('aria-expanded', 'false'); b.addEventListener('click', accion);
      li.appendChild(b); ul.appendChild(li); R.items[id] = b;
      return b;
    }

    function sincroniza() {
      cada(cajon.children, function (d) {
        if (d.tagName !== 'DETAILS') { return; }
        if (!d.id) { d.id = (d.className.split(' ').filter(function (c) { return c !== 'thegame-pliego'; })[0] || 'panel') ; }
        var grupo = Object.keys(GRUPOS).filter(function (k) { return GRUPOS[k].indexOf(d.id) >= 0; })[0];
        d.hidden = !grupo || grupo !== abierto;
      });
    }
    entrada('history', '◷', texto('nav_history', 'History mode'), function () { abre('history'); }).setAttribute('aria-controls', 'thegame-terminal');
    entrada('waves', '\u223F', texto('nav_waves', 'Waves Army'), function () { muestra(actual === 'ondas' ? null : 'ondas'); }).setAttribute('aria-controls', 'thegame-ondas');
    entrada('buildings', '⌂', texto('nav_buildings', 'Buildings'), function () { abre('buildings'); }).setAttribute('aria-controls', 'thegame-terminal');
    entrada('nodes', '⌘', texto('nav_nodes', 'Nodes & Events'), function () { abre('nodes'); }).setAttribute('aria-controls', 'thegame-terminal');
    entrada('start', '?', texto('nav_start', 'How to start?'), function () { abre('start'); }).setAttribute('aria-controls', 'thegame-terminal');

    if (raiz.PageComment && raiz.PageComment.abre) {
      var pf = pliego(texto('menu_opinar', 'Feedback on this page'), 'pliego-opinar', false, []), fb = el('button', 'boton-sec', texto('menu_opinar', 'Feedback on this page'));
      fb.type = 'button'; fb.addEventListener('click', function () { cierraHoja(); raiz.PageComment.abre(); }); pf.appendChild(fb); cajon.appendChild(pf);
    }
    sincroniza();
    new MutationObserver(sincroniza).observe(cajon, { childList: true });

    [S.MAPA, menu, cajon, S.HOJA.ondas, S.HOJA.batalla].forEach(function (n) { piso.appendChild(n); });
    cada(piso.querySelectorAll(':scope > .atlas-rejilla'), function (n) { n.remove(); });
    document.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); expande(); ancho.focus(); return; }
      if (e.key !== 'Escape' || document.querySelector('.atlas-dlg-capa,dialog[open]')) { return; }
      if (actual) { muestra(null, true); } else if (abierto) { var b = R.items[abierto]; abre(abierto); if (b) { b.focus(); } }
    });

    document.addEventListener('pointerdown', function (e) {
      if (!(actual || abierto) || document.querySelector('.atlas-dlg-capa,dialog[open]')) { return; }
      var t = e.target;
      if (t.closest && t.closest('#thegame-terminal,.thegame-hoja,#thegame-menu,#identity-menu,.thegame-menu-item')) { return; }
      if (actual) { muestra(null, false); }
      if (abierto) { abre(abierto, false); }
    });

    var a = est.querySelector('.atlas-alerta');
    if (a) {
      var marca = function () { var b = R.items.history; if (b) { b.classList.toggle('con-aviso', !a.classList.contains('sellada')); b.setAttribute('aria-label', texto('nav_history', 'History mode') + (!a.classList.contains('sellada') ? ' · alert' : '')); } };
      new MutationObserver(marca).observe(a, { attributes: true, attributeFilter: ['class'] });
      marca();
    }

    if (raiz.AtlasRadioChat) {
      raiz.AtlasRadioChat.monta(capa, { T: T });
      var aviso = capa.querySelector('#atlas-juego > .no-data:first-child, .thegame-estado > .no-data:first-child');
      if (aviso) { raiz.AtlasRadioChat.dice({ quien: 'Radio', fuente: 'lengua', texto: aviso.textContent, sello: 'NO_DATA' }); }
    }
    var Z = raiz.AtlasZ;
    if (Z) {
      var ctl = el('div', 'crt-controls'); ctl.id = 'crt-controls'; ctl.setAttribute('role', 'group'); ctl.setAttribute('aria-label', texto('z_group', 'Control panel'));
      var lab = el('label', 'crt-z-label', texto('z_label', 'Depth')); lab.htmlFor = 'z-cutoff';
      var wheel = el('input', 'crt-z'); wheel.type = 'range'; wheel.id = 'z-cutoff'; wheel.min = String(Z.MIN); wheel.max = String(Z.MAX);
      wheel.step = String(Z.STEP); wheel.value = String(Z.value()); wheel.setAttribute('list', 'z-detents');
      var marks = el('datalist'); marks.id = 'z-detents';
      Z.DETENTS.forEach(function (v) { var o = el('option'); o.value = String(v); marks.appendChild(o); });
      var out = el('output', 'crt-z-out'); out.htmlFor = 'z-cutoff'; out.setAttribute('aria-live', 'polite');
      var apply = function (v) {
        var h = Z.hidden(v), d = document.documentElement;
        d.classList.toggle('z-hide-no-data', h.indexOf('no_data') >= 0); d.classList.toggle('z-hide-emulated', h.indexOf('emulated') >= 0);
        d.setAttribute('data-z-cutoff', String(v)); out.textContent = Z.label(v); wheel.setAttribute('aria-valuetext', Z.label(v));
      };
      wheel.addEventListener('input', function () { apply(Z.set(wheel.value)); });
      wheel.addEventListener('change', function () {
        var v = Z.value(), Si = raiz.AtlasSintesis, Ra = raiz.AtlasRadio, c = Si && typeof Si.contexto === 'function' ? Si.contexto() : null;
        if (c && c.state === 'running' && Ra && typeof Ra.tocaNota === 'function') { Ra.tocaNota(v >= 80 ? 4 : v >= 50 ? 2 : 0, 0); }
        if (raiz.AtlasRadioChat) { raiz.AtlasRadioChat.dice({ quien: 'Depth', fuente: 'z_cutoff', texto: Z.label(v), sello: 'LIVE' }); }
      });
      [lab, wheel, marks, out].forEach(function (n) { ctl.appendChild(n); }); apply(Z.value());
      piso.appendChild(ctl); S.CRT = ctl;
    }
    muestraYa(null);
    // Open the drawer group that holds a panel, by the panel's own id. Fixed, not a toggle: a tap on
    // the map closes the drawer on pointerdown, and the card must still open on the click after it.
    vivo = function (pid) { var g = Object.keys(GRUPOS).filter(function (k) { return GRUPOS[k].indexOf(pid) >= 0; })[0]; if (!g) { return false; } abre(g, false, true); return true; };
    S.muestra = muestra; S.pliego = pliego; S.abre = abre; S.actual = function () { return actual; };
    return S;
  }
  raiz.AtlasChatTerminal = { monta: monta, panel: function (pid) { return vivo ? vivo(pid) : false; } };
})(this);
