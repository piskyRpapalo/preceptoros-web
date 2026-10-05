/* preceptoros.org · theGame · el MAPA GLOBAL: un mundo que se arrastra hasta chocar con la niebla.

   «El mapa principal debe ser LA CASA del usuario. El mapa global tiene que ser MOVIBLE: que el user
   pueda moverse hasta chocarse con la niebla» (Soberano, 2026-10-05).
   - Al abrir, la camara se centra en TU CASA (su sitio sale de tu clave publica). Sin clave, en
     Hexelion, y se dice por que.
   - Se mueve con el dedo o el raton (pointer events), con las flechas y con botones grandes; tiene
     inercia (`world_camera.js`) y, con movimiento reducido, salta sin inercia.
   - LA NIEBLA ES EL LIMITE (`fog_of_war.js`): lo despejado sale de lo MEDIDO y de lo ya jugado; la
     camara no entra en lo demas: rebota y lo dice en texto.
   - El terreno es ruido entero con tramado Atkinson, generado por TESELAS y solo las visibles (cache
     acotada). Cero imagenes y cero peticiones.
   EL ORIGEN SE VE: Hexelion MEDIDO, nitido; un nodo sin medidas, en niebla y con su anillo NO_DATA.
   PINTA; NO DECIDE: los lugares, la seleccion y los textos se los da `ui-arena.js`; el mando de verdad
   sigue siendo la lista de botones del DOM. */
(function () {
  'use strict';

  var E = window.AtlasEscena, K = window.AtlasCanon, N = window.AtlasNiebla, C = window.AtlasCamara;
  var TIERRA = [[5, 8, 18], [8, 16, 34], [12, 28, 52], [16, 42, 68], [22, 62, 84], [40, 92, 100], [96, 118, 104]];
  var NIEBLA = [null, [64, 72, 96]], TESELA = 240, RES = 4, VE = 820, PASO = 90;
  var ANILLO = N.ANILLO;

  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = texto; } return n; }

  /* Las casas de las cedulas, con el estado de cada medida tal cual. */
  function casas() {
    var Ce = window.AtlasNodosCedulas, Q = window.AtlasCuenta, G = window.AtlasGacha;
    if (!Ce || !G) { return []; }
    return Ce.nodos.map(function (c) {
      var m = c.aparato.medidas, s = N.sitioNodo(c.nodo);
      return { nodo: c.nodo, x: s.x, y: s.y, ram: m.ram_mib || {}, gen: m.gen_cps || {},
               estado: Q ? Q.estadoNodo(c) : { activo: 'NO_DATA' }, t: G.tirada(K.sha('atlas.emblema/1:' + c.nodo), 'tc3') };
    });
  }

  /* `f`: { lugares(), sel(), emblema(), pub(), nombre(l), texto(k), colores(), elige(l), luchados() }. */
  function crea(c, f) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), raf = 0, col = null, H0 = casas(), circ = [], huella = '';
    var tierra = {}, nt = 0, nieblas = {}, nn = 0, cam = null, arrastre = null, ultimo = null, avisado = 0, centro = null;
    var Ce = window.AtlasNodosCedulas, cuadros = 0, movido = false;

    /* --- los mandos: flechas grandes, volver a casa y el aviso ------------------------------------ */
    var mandos = el('div', 'mapa-mandos'), aviso = el('p', 'mapa-aviso');
    aviso.setAttribute('role', 'status');
    [['mapa_izq', '◀', -1, 0], ['mapa_arr', '▲', 0, -1], ['mapa_aba', '▼', 0, 1], ['mapa_der', '▶', 1, 0], ['mapa_casa', '⌂', 0, 0]]
      .forEach(function (b) {
        var x = el('button', 'boton-sec mapa-mando', b[1]); x.type = 'button'; x.setAttribute('aria-label', f.texto(b[0]));
        x.addEventListener('click', function () { if (b[0] === 'mapa_casa') { aCasa(true); } else { mueve(b[2] * PASO * 2.2, b[3] * PASO * 2.2); } });
        mandos.appendChild(x);
      });
    c.parentNode.insertBefore(mandos, c.nextSibling); c.parentNode.insertBefore(aviso, mandos.nextSibling);
    c.tabIndex = 0;

    function despeja() {
      var luchados = {}, r = f.luchados ? f.luchados() : {};
      Object.keys(r || {}).forEach(function (k) { if (r[k].g + r[k].p) { luchados[k] = true; } });
      circ = N.despejado({ pub: f.pub(), sha: K.sha, nodos: Ce ? Ce.nodos : [], lugares: f.lugares(), luchados: luchados });
      var h = N.huella(circ);
      if (h !== huella) { huella = h; nieblas = {}; nn = 0; }
    }
    function aCasa(dilo) {
      despeja();
      var casa = N.sitioCasa(f.pub(), K.sha);
      centro = casa || N.HEX;
      if (!cam) { cam = C.crea(centro); } else { cam.x = centro.x; cam.y = centro.y; cam.vx = 0; cam.vy = 0; }
      if (dilo || !casa) { aviso.textContent = f.texto(casa ? 'mapa_en_casa' : 'mapa_sin_casa'); }
    }
    function choca() {
      var t = performance.now();
      if (t - avisado > 1500) { avisado = t; aviso.textContent = f.texto('mapa_niebla'); }
    }
    function mueve(dx, dy) { movido = true; if (C.empuja(cam, dx, dy, circ, quieto())) { choca(); } }

    /* --- el terreno y la niebla, por teselas ------------------------------------------------------ */
    function tesela(i, j) {
      var k = i + ',' + j;
      if (tierra[k]) { return tierra[k]; }
      if (nt > 90) { tierra = {}; nt = 0; }
      var n = TESELA / RES;
      tierra[k] = E.textura(n, n, function (x, y) {
        var wx = i * TESELA + x * RES, wy = j * TESELA + y * RES;
        return Math.max(0, Math.min(1, E.fbm(wx / 210, wy / 210, 11) * 1.15 - 0.12 + E.fbm(wx / 60, wy / 60, 4) * 0.12));
      }, TIERRA);
      nt++;
      return tierra[k];
    }
    function bruma(i, j) {
      var k = i + ',' + j;
      if (nieblas[k] !== undefined) { return nieblas[k]; }
      if (nn > 90) { nieblas = {}; nn = 0; }
      var n = TESELA / RES, algo = false;
      var t = E.textura(n, n, function (x, y) {
        var v = N.niebla(i * TESELA + x * RES, j * TESELA + y * RES, circ) * 0.78;
        if (v > 0.05) { algo = true; }
        return v;
      }, NIEBLA);
      nieblas[k] = algo ? t : null; nn++;
      return nieblas[k];
    }
    function capas(g, W, H, z, que) {
      var v = C.vista(cam, W, H, z), lado = TESELA * z;
      for (var i = Math.floor(v.x0 / TESELA); i <= Math.floor(v.x1 / TESELA); i++) {
        for (var j = Math.floor(v.y0 / TESELA); j <= Math.floor(v.y1 / TESELA); j++) {
          var p = C.aPantalla(cam, W, H, z, i * TESELA, j * TESELA), t = que(i, j);
          if (t) { g.drawImage(t, Math.floor(p[0]), Math.floor(p[1]), Math.ceil(lado) + 1, Math.ceil(lado) + 1); }
        }
      }
    }

    /* --- dibujo ------------------------------------------------------------------------------------ */
    function curva(a, b, s) {
      var mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.18, u = 1 - s;
      return [u * u * a[0] + 2 * u * s * mx + s * s * b[0], u * u * a[1] + 2 * u * s * my + s * s * b[1]];
    }
    function enlace(g, a, b, punteado) {
      g.setLineDash(punteado ? [2 * dpr, 6 * dpr] : []); g.beginPath();
      for (var i = 0; i <= 24; i++) { var p = curva(a, b, i / 24); g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }
      g.stroke(); g.setLineDash([]);
    }
    function pulso(g, a, b, s, cl, rr) {
      var p = curva(a, b, s); g.strokeStyle = cl; g.beginPath();
      for (var i = 0; i <= 32; i++) { var u = i / 32 * 2 * Math.PI; g[i ? 'lineTo' : 'moveTo'](p[0] + Math.sin(3 * u + s * 9) * rr, p[1] + Math.sin(2 * u) * rr); }
      g.stroke();
    }
    function rotulo(g, txt, x, y) {
      var an = g.measureText(txt).width + 10 * dpr;
      g.fillStyle = 'rgb(6,10,22)'; g.fillRect(x - an / 2, y - 12 * dpr, an, 16 * dpr);
      g.fillStyle = col.texto; g.fillText(txt, x, y);
    }
    function sitio(l) { return N.sitioLugar(l, K.sha, f.pub()); }

    function pinta(ts) {
      raf = requestAnimationFrame(pinta);
      if (c.offsetParent === null || document.hidden) { ultimo = null; return; }
      var w = Math.max(240, c.clientWidth), h = Math.round(Math.max(260, Math.min(w * 1.05, (window.innerHeight || 800) * 0.6)));
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); }
      if (c.height !== Math.round(h * dpr)) { c.height = Math.round(h * dpr); c.style.height = h + 'px'; }
      var g = c.getContext('2d'), W = c.width, H = c.height, q = quieto(), t = q ? 0 : ts, z = W / VE * (w < 600 ? 1.15 : 1);
      col = col || f.colores();
      /* La clave llega despues (promesa): si aun no te has movido, la camara va a tu casa en cuanto se sabe. */
      if (!cam || (!movido && centro === N.HEX && f.pub())) { aCasa(!!cam); }
      if (!(cuadros++ % 30)) { despeja(); }
      var k = ultimo === null ? 1 : Math.min(6, (ts - ultimo) / 16); ultimo = ts;
      if (!arrastre && !q && C.paso(cam, k, circ)) { choca(); }
      g.imageSmoothingEnabled = false;
      g.fillStyle = 'rgb(5,8,18)'; g.fillRect(0, 0, W, H);
      capas(g, W, H, z, tesela);
      g.font = '600 ' + Math.round(11 * dpr) + 'px ui-monospace, monospace'; g.textAlign = 'center'; g.lineWidth = dpr;
      var P = function (x, y) { return C.aPantalla(cam, W, H, z, x, y); }, hx = null;
      H0.forEach(function (n) { if (n.gen.estado === 'MEDIDO' && !hx) { hx = n; } });
      var cen = P(N.HEX.x, N.HEX.y), casa = N.sitioCasa(f.pub(), K.sha), yo = casa ? P(casa.x, casa.y) : null;
      var destinos = f.lugares().map(function (l) { var s = sitio(l); return { p: P(s.x, s.y) }; });
      if (yo) { destinos.push({ p: yo }); }
      H0.forEach(function (n) { if (n !== hx) { destinos.push({ p: P(n.x, n.y), nd: n.gen.estado === 'NO_DATA' }); } });
      destinos.forEach(function (d, i) {
        g.strokeStyle = 'rgba(160,200,230,.3)'; enlace(g, cen, d.p, d.nd || !hx);
        if (!hx || d.nd || q) { return; }
        var s = ((t * hx.gen.valor / 1e7) + i * 0.37) % 1;
        g.lineWidth = 1.6 * dpr; pulso(g, cen, d.p, s, E.rapidez(3 + Math.min(10, hx.gen.valor / 800)), 5 * dpr); g.lineWidth = dpr;
      });
      var sel = f.sel();
      f.lugares().forEach(function (l, i) {
        var s = sitio(l), p = P(s.x, s.y), t0 = l.lider, r = 18 * dpr;
        if (sel === l) {
          if (yo) { g.strokeStyle = col.tuya; g.lineWidth = 2 * dpr; enlace(g, yo, p, false); }
          g.lineWidth = 2 * dpr; g.strokeStyle = col.tuya; g.globalAlpha = q ? 1 : 0.6 + 0.4 * Math.sin(t * 0.005);
          g.beginPath(); g.arc(p[0], p[1], r * 1.7, 0, 2 * Math.PI); g.stroke(); g.globalAlpha = 1; g.lineWidth = dpr;
        }
        var dx = q ? 0 : Math.sin(t * 0.0006 + i) * 3 * dpr;
        E.figura(g, t0.armonicos, p[0] + dx, p[1], r, { color: l.npc ? E.tono(t0) : col.suya, giro: t * 0.0004 * (l.npc ? -1 : 1),
                                                       grosor: 1.5 * dpr, brillo: (E.BRILLO[t0.rareza] + (l.npc ? 0 : 8)) * dpr });
        rotulo(g, f.nombre(l), p[0], p[1] + r + 15 * dpr);
      });
      H0.forEach(function (n) {
        var p = P(n.x, n.y), r = 26 * dpr, med = n.gen.estado === 'MEDIDO';
        if (med) {
          g.strokeStyle = col.tuya; g.lineWidth = 2 * dpr;
          [1.35, 1.6].forEach(function (k2) { g.beginPath(); g.arc(p[0], p[1], r * k2, 0, 2 * Math.PI); g.stroke(); });
          E.figura(g, n.t.armonicos, p[0], p[1], r, { color: '#f4d29c', giro: t * 0.0003, grosor: 2.2 * dpr, brillo: 14 * dpr });
        } else {
          E.figura(g, n.t.armonicos, p[0], p[1], r, { color: 'rgb(150,160,180)', giro: t * 0.0002, grosor: 1.2 * dpr, desafina: 0.5, t: t });
        }
        g.lineWidth = dpr;
      });
      if (yo) {
        var em = f.emblema(), er = 22 * dpr;
        if (em) { E.figura(g, em.armonicos, yo[0], yo[1], er, { color: col.tuya, giro: t * 0.0003, grosor: 2.2 * dpr, brillo: 14 * dpr }); }
      }
      capas(g, W, H, z, bruma);
      /* Lo que esta en la niebla tambien se DECLARA: su anillo vacio y su rotulo, por encima. */
      H0.forEach(function (n) {
        var p = P(n.x, n.y), med = n.gen.estado === 'MEDIDO';
        if (!med) { g.strokeStyle = col.texto; g.lineWidth = 1.5 * dpr; g.setLineDash([3 * dpr, 4 * dpr]); g.beginPath(); g.arc(p[0], p[1], 39 * dpr, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]); }
        rotulo(g, n.nodo.split('.').pop() + ' · ' + (med ? f.texto('mapa_medido') : 'NO_DATA'), p[0], p[1] + 58 * dpr);
      });
      /* La postura de tu casa (home_buildings.js) se VE en el mapa: lema y alianzas cerradas. Solo aspecto. */
      var ca = window.AtlasCasa && window.AtlasCasa.casa ? window.AtlasCasa.casa() : null;
      if (yo) { rotulo(g, f.texto('arena_tu') + (ca && ca.lema ? ' \u00B7 \u201C' + ca.lema + '\u201D' : '') + (ca && ca.alianzas === 'cerradas' ? ' \u00B7 \u26E8' : ''), yo[0], yo[1] + 40 * dpr); }
    }

    /* --- arrastrar, tocar y teclas ------------------------------------------------------------------ */
    c.addEventListener('pointerdown', function (ev) {
      movido = true; arrastre = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY };
      c.setPointerCapture(ev.pointerId);
    });
    c.addEventListener('pointermove', function (ev) {
      if (!arrastre || ev.pointerId !== arrastre.id) { return; }
      var z = c.width / VE * (c.clientWidth < 600 ? 1.15 : 1) / dpr;
      if (C.arrastra(cam, (ev.clientX - arrastre.x) / z, (ev.clientY - arrastre.y) / z, circ, quieto())) { choca(); }
      arrastre.x = ev.clientX; arrastre.y = ev.clientY;
    });
    function suelta(ev) {
      if (!arrastre) { return; }
      var corto = Math.abs(ev.clientX - arrastre.x0) + Math.abs(ev.clientY - arrastre.y0) < 8;
      arrastre = null;
      if (!corto) { return; }
      cam.vx = 0; cam.vy = 0;
      var r = c.getBoundingClientRect(), x = (ev.clientX - r.left) * dpr, y = (ev.clientY - r.top) * dpr, z = c.width / VE * (c.clientWidth < 600 ? 1.15 : 1);
      var mejor = null, dist = 44 * dpr;
      f.lugares().forEach(function (l) {
        var s = sitio(l), p = C.aPantalla(cam, c.width, c.height, z, s.x, s.y), d = Math.hypot(p[0] - x, p[1] - y);
        if (d < dist) { dist = d; mejor = l; }
      });
      if (mejor) { f.elige(mejor); }
    }
    c.addEventListener('pointerup', suelta);
    c.addEventListener('pointercancel', function () { arrastre = null; });
    c.addEventListener('keydown', function (ev) {
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
      if (!d) { return; }
      ev.preventDefault(); mueve(d[0] * PASO, d[1] * PASO);
    });
    raf = requestAnimationFrame(pinta);
    return { para: function () { cancelAnimationFrame(raf); }, camara: function () { return cam; }, despejado: function () { return circ; } };
  }

  window.AtlasMar = { ANILLO: ANILLO, crea: crea, casas: casas };
})();
