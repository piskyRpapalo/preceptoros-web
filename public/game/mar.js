/* preceptoros.org · theGame · el MAPA GLOBAL: el mundo hundido, sus nodos y las ondas que lo cruzan.

   EL FONDO ES RUIDO TRAMADO. Un relieve de ruido (hash entero, sin azar) se reparte en seis tonos con
   tramado Atkinson, a un tercio de resolucion: pixel visible, cero ficheros de imagen, cero red. Se
   calcula una vez por tamano y se pega; lo que se mueve encima es poco y barato.

   EL ORIGEN SE VE (directiva del Soberano, 2026-10-04: «la estetica pinta lo medido»):
   - MEDIDO: la figura nitida, con su doble anillo. `nodo.0.hexelion` en el centro.
   - EMULADO: la figura bajo NIEBLA tramada (pixeles de un bit, sin alfas).
   - NO_DATA: un anillo discontinuo VACIO con su rotulo. Nunca un cero inventado.
   La misma informacion va en texto en el DOM (`ui-arena.js`): nada depende solo del lienzo.

   LAS ONDAS QUE VIAJAN. De Hexelion salen pulsos (curvas de Lissajous) hacia cada lugar; su rapidez
   y su color salen de la cifra MEDIDA de generacion del nodo (`gen_cps`). De un nodo cuya cifra es
   NO_DATA no sale ninguna onda: su enlace queda punteado.

   PINTA; NO DECIDE. Los lugares, la seleccion y los textos se los da `ui-arena.js`; el toque devuelve
   el lugar mas cercano, y el mando de verdad es la lista de botones del DOM. Con
   `prefers-reduced-motion`, todo quieto. */
(function () {
  'use strict';

  var E = window.AtlasEscena, K = window.AtlasCanon;
  var ANILLO = { tc1: 0.26, tc2: 0.32, tc3: 0.37, tc4: 0.41 };
  var TIERRA = [[5, 8, 18], [8, 16, 34], [12, 28, 52], [16, 42, 68], [22, 62, 84], [40, 92, 100], [96, 118, 104]];
  var NIEBLA = [null, [118, 128, 150]];
  /* Donde vive cada nodo de la casa en el mapa (fraccion del lado). El centro es Hexelion. */
  var SITIO = { 'nodo.0.hexelion': [0.5, 0.5], 'nodo.1.doogee': [0.84, 0.16] };

  function h32(hex) { return parseInt(hex.slice(0, 8), 16) >>> 0; }
  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* Las casas: cada nodo de las cedulas con el estado de cada medida tal cual. */
  function casas() {
    var C = window.AtlasNodosCedulas, Q = window.AtlasCuenta, G = window.AtlasGacha;
    if (!C || !G) { return []; }
    return C.nodos.map(function (c) {
      var m = c.aparato.medidas, s = SITIO[c.nodo] || [0.2, 0.8];
      return { nodo: c.nodo, x: s[0], y: s[1], ram: m.ram_mib || {}, gen: m.gen_cps || {},
               estado: Q ? Q.estadoNodo(c) : { activo: 'NO_DATA' }, t: G.tirada(K.sha('atlas.emblema/1:' + c.nodo), 'tc3') };
    });
  }

  /* `f`: { lugares(), sel(), emblema(), pub(), nombre(l), texto(k), colores(), elige(l) }. */
  function crea(c, f) {
    var dpr = window.devicePixelRatio || 1, raf = 0, col = null, fondo = null, niebla = null, fw = 0, fh = 0, H0 = casas();

    function posicion(l, W, H) {
      var ang, rad, pub = f.pub();
      if (l.npc) { ang = (l.orden * 48 + 95) * Math.PI / 180; rad = ANILLO[l.tc]; }
      else {
        ang = (h32(K.sha(l.de)) % 360) * Math.PI / 180;
        var d = pub ? ((h32(K.sha(pub)) ^ h32(K.sha(l.de))) >>> 0) / 4294967296 : 0.5;
        rad = 0.14 + 0.28 * d;
      }
      return [W / 2 + Math.cos(ang) * rad * W, H / 2 + Math.sin(ang) * rad * H];
    }
    function tuSitio(W, H) { return [W * 0.16, H * 0.86]; }

    /* El relieve: hondo en los bordes, arrecifes donde el ruido sube. La niebla: un bit por pixel
       alrededor de cada nodo con alguna medida EMULADA. */
    function fondos(W, H) {
      var w = Math.ceil(W / (3 * dpr)), h = Math.ceil(H / (3 * dpr));
      fondo = E.textura(w, h, function (x, y) {
        var dx = x / w - 0.5, dy = y / h - 0.5, n = E.fbm(x / 16, y / 16, 11);
        return Math.max(0, Math.min(1, n * 1.1 - Math.hypot(dx, dy) * 0.7 + 0.12));
      }, TIERRA);
      niebla = E.textura(w, h, function (x, y) {
        var v = 0;
        H0.forEach(function (n) {
          if (n.ram.estado !== 'EMULADO' && n.gen.estado !== 'EMULADO') { return; }
          var d = Math.hypot(x / w - n.x, (y / h - n.y) * h / w);
          v = Math.max(v, (1 - d / 0.2) * (0.55 + E.fbm(x / 6, y / 6, 3) * 0.6));
        });
        return Math.max(0, Math.min(1, v)) * 0.55;
      }, NIEBLA);
    }

    function curva(a, b, s) {
      var mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.18, u = 1 - s;
      return [u * u * a[0] + 2 * u * s * mx + s * s * b[0], u * u * a[1] + 2 * u * s * my + s * s * b[1]];
    }
    function enlace(g, a, b, punteado) {
      g.setLineDash(punteado ? [2 * dpr, 6 * dpr] : []);
      g.beginPath();
      for (var i = 0; i <= 24; i++) { var p = curva(a, b, i / 24); g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }
      g.stroke(); g.setLineDash([]);
    }
    /* Un pulso: una Lissajous pequena que viaja por el enlace. */
    function pulso(g, a, b, s, cl, rr) {
      var p = curva(a, b, s);
      g.strokeStyle = cl; g.beginPath();
      for (var i = 0; i <= 32; i++) {
        var u = i / 32 * 2 * Math.PI;
        g[i ? 'lineTo' : 'moveTo'](p[0] + Math.sin(3 * u + s * 9) * rr, p[1] + Math.sin(2 * u) * rr);
      }
      g.stroke();
    }
    function rotulo(g, txt, x, y, W) {
      var an = g.measureText(txt).width + 10 * dpr, lx = Math.min(W - an / 2, Math.max(an / 2, x));
      g.fillStyle = 'rgb(6,10,22)'; g.fillRect(lx - an / 2, y - 12 * dpr, an, 16 * dpr);
      g.fillStyle = col.texto; g.fillText(txt, lx, y);
    }

    function pinta(ts) {
      raf = requestAnimationFrame(pinta);
      if (c.offsetParent === null || document.hidden) { return; }
      var w = Math.max(240, c.clientWidth), h = Math.round(Math.min(560, w * 0.92, (window.innerHeight || 800) * 0.5));
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); }
      if (c.height !== Math.round(h * dpr)) { c.height = Math.round(h * dpr); c.style.height = h + 'px'; }
      var g = c.getContext('2d'), W = c.width, H = c.height, q = quieto(), t = q ? 0 : ts;
      col = col || f.colores();
      if (fw !== W || fh !== H) { fw = W; fh = H; fondos(W, H); }
      g.clearRect(0, 0, W, H);
      E.pega(g, fondo, W, H);
      g.font = '600 ' + Math.round(11 * dpr) + 'px ui-monospace, monospace'; g.textAlign = 'center';
      g.lineWidth = dpr;
      var sel = f.sel(), cen = [W / 2, H / 2], yo = tuSitio(W, H), hx = null;
      H0.forEach(function (n) { if (n.gen.estado === 'MEDIDO' && !hx) { hx = n; } });
      var ritmo = hx ? hx.gen.valor / 1e7 : 0;
      /* Enlaces y pulsos desde el nodo medido hacia cada lugar, hacia ti y hacia las otras casas. */
      var destinos = f.lugares().map(function (l) { return { p: posicion(l, W, H) }; }).concat([{ p: yo }]);
      H0.forEach(function (n) { if (n !== hx) { destinos.push({ p: [n.x * W, n.y * H], nd: n.gen.estado === 'NO_DATA' }); } });
      destinos.forEach(function (d, i) {
        var p = d.p;
        g.strokeStyle = 'rgba(160,200,230,.3)'; enlace(g, cen, p, d.nd || !hx);
        if (!hx || d.nd || q) { return; }
        var s = ((t * ritmo) + i * 0.37) % 1;
        g.lineWidth = 1.6 * dpr; pulso(g, cen, p, s, E.rapidez(3 + Math.min(10, hx.gen.valor / 800)), 5 * dpr); g.lineWidth = dpr;
      });
      if (sel) {
        var ps = posicion(sel, W, H);
        g.strokeStyle = col.tuya; g.lineWidth = 2 * dpr; enlace(g, yo, ps, false); g.lineWidth = dpr;
        g.globalAlpha = q ? 1 : 0.6 + 0.4 * Math.sin(t * 0.005); g.beginPath(); g.arc(ps[0], ps[1], 30 * dpr, 0, 2 * Math.PI); g.stroke();
        g.globalAlpha = 1;
      }
      /* Los lugares NPC y las personas: derivan un poco (vector de deriva), con su nombre debajo. */
      f.lugares().forEach(function (l, i) {
        var p = posicion(l, W, H), t0 = l.lider, r = 18 * dpr;
        var dx = q ? 0 : Math.sin(t * 0.0006 + i) * 3 * dpr, dy = q ? 0 : Math.cos(t * 0.0005 + i * 2) * 3 * dpr;
        E.figura(g, t0.armonicos, p[0] + dx, p[1] + dy, r, { color: l.npc ? E.tono(t0) : col.suya, giro: t * 0.0004 * (l.npc ? -1 : 1),
                                                             grosor: 1.5 * dpr, brillo: (E.BRILLO[t0.rareza] + (l.npc ? 0 : 8)) * dpr });
        rotulo(g, f.nombre(l), p[0], p[1] + r + 14 * dpr, W);
      });
      /* Las casas, cada una pintada segun el origen de su cifra. */
      H0.forEach(function (n) {
        var x = n.x * W, y = n.y * H, r = 24 * dpr, med = n.gen.estado === 'MEDIDO';
        if (med) {
          g.strokeStyle = col.tuya; g.lineWidth = 2 * dpr;
          [1.35, 1.6].forEach(function (k) { g.beginPath(); g.arc(x, y, r * k, 0, 2 * Math.PI); g.stroke(); });
          E.figura(g, n.t.armonicos, x, y, r, { color: '#f4d29c', giro: t * 0.0003, grosor: 2.2 * dpr, brillo: 14 * dpr });
        } else {
          E.figura(g, n.t.armonicos, x, y, r, { color: 'rgb(150,160,180)', giro: t * 0.0002, grosor: 1.2 * dpr, desafina: 0.5, t: t });
          if (n.gen.estado === 'NO_DATA') {
            g.strokeStyle = col.texto; g.lineWidth = 1.5 * dpr; g.setLineDash([3 * dpr, 4 * dpr]);
            g.beginPath(); g.arc(x, y, r * 1.5, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
          }
        }
        g.lineWidth = dpr;
        rotulo(g, n.nodo.split('.').pop() + ' · ' + (med ? f.texto('mapa_medido') : 'NO_DATA'), x, n.y < 0.3 ? y - r * 1.6 - 4 * dpr : y + r * 1.6 + 14 * dpr, W);
      });
      E.pega(g, niebla, W, H);
      var em = f.emblema(), er = 20 * dpr;
      if (em) { E.figura(g, em.armonicos, yo[0], yo[1], er, { color: col.tuya, giro: t * 0.0003, grosor: 2 * dpr, brillo: 12 * dpr }); }
      else { g.strokeStyle = col.tuya; g.setLineDash([3 * dpr, 4 * dpr]); g.beginPath(); g.arc(yo[0], yo[1], er * 0.7, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]); }
      rotulo(g, f.texto('arena_tu'), yo[0], yo[1] + er + 14 * dpr, W);
    }

    c.addEventListener('click', function (ev) {
      var r = c.getBoundingClientRect(), x = (ev.clientX - r.left) * dpr, y = (ev.clientY - r.top) * dpr;
      var mejor = null, dist = 40 * dpr;
      f.lugares().forEach(function (l) {
        var p = posicion(l, c.width, c.height), d = Math.hypot(p[0] - x, p[1] - y);
        if (d < dist) { dist = d; mejor = l; }
      });
      if (mejor) { f.elige(mejor); }
    });
    raf = requestAnimationFrame(pinta);
    return { para: function () { cancelAnimationFrame(raf); } };
  }

  window.AtlasMar = { ANILLO: ANILLO, crea: crea, casas: casas };
})();
