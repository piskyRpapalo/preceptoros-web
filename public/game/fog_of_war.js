/* preceptoros.org · theGame · LA NIEBLA DE GUERRA: lo que se ve es lo MEDIDO.

   El Soberano (2026-10-05): «el mapa global tiene que ser MOVIBLE: que el user pueda moverse hasta
   chocarse con la niebla». La niebla NO sale del azar: sale de lo que hay medido o aceptado.
   - Hexelion (o cualquier nodo de la casa con medidas MEDIDO) despeja un circulo que crece con
     cuantas medidas tiene. Un nodo sin medidas (Doogee hoy) NO despeja nada: se queda en la niebla.
   - Tu casa despeja su circulo, donde la pone tu clave publica (misma cuenta, mismo sitio).
   - Cada lugar donde ya luchaste, y cada persona cuya defensa firmada aceptaste, despeja el suyo.
   Mismas entradas, misma niebla. Puro: sin DOM, sin red, sin reloj. En node, `module.exports`. */
(function (raiz) {
  'use strict';

  /* La geometria del mundo, en unidades de mundo. Hexelion en el origen. */
  var HEX = { x: 0, y: 0 }, DOOGEE = { x: 980, y: -760 };
  var ANILLO = { tc1: 330, tc2: 400, tc3: 460, tc4: 520 };
  function h32(hex) { return parseInt(String(hex).slice(0, 8), 16) >>> 0; }

  /* Donde esta cada cosa. `sha` es la sha256 hex de `canon.js` (se pasa para que esto siga puro). */
  function sitioLugar(l, sha, pub) {
    if (l.npc) {
      var a = (l.orden * 48 + 95) * Math.PI / 180, r = ANILLO[l.tc] || 400;
      return { x: Math.round(Math.cos(a) * r), y: Math.round(Math.sin(a) * r) };
    }
    var ang = (h32(sha(l.de)) % 360) * Math.PI / 180;
    var d = pub ? ((h32(sha(pub)) ^ h32(sha(l.de))) >>> 0) / 4294967296 : 0.5;
    return { x: Math.round(Math.cos(ang) * (300 + 700 * d)), y: Math.round(Math.sin(ang) * (300 + 700 * d)) };
  }
  function sitioCasa(pub, sha) {
    if (!pub) { return null; }
    var h = h32(sha('atlas.casa-sitio/1:' + pub)), a = (h % 360) * Math.PI / 180, r = 560 + (h >>> 9) % 160;
    return { x: Math.round(Math.cos(a) * r), y: Math.round(Math.sin(a) * r) };
  }
  function sitioNodo(nodo) { return nodo === 'nodo.0.hexelion' ? HEX : nodo === 'nodo.1.doogee' ? DOOGEE : { x: -900, y: 700 }; }

  /* Los circulos despejados. `e`: { pub, sha, nodos (cedulas.nodos), lugares, luchados {clave: true},
     personas [lugar] }. Devuelve [{x, y, r, que}] en orden estable. */
  function despejado(e) {
    var c = [];
    (e.nodos || []).forEach(function (n) {
      var m = n.aparato.medidas, k = Object.keys(m).filter(function (x) { return m[x].estado === 'MEDIDO'; }).length;
      if (k) { var s = sitioNodo(n.nodo); c.push({ x: s.x, y: s.y, r: 380 + 160 * k, que: n.nodo }); }
    });
    var casa = sitioCasa(e.pub, e.sha);
    if (casa) { c.push({ x: casa.x, y: casa.y, r: 360, que: 'casa' }); }
    (e.lugares || []).forEach(function (l) {
      if ((e.luchados || {})[l.clave] || !l.npc) { var s = sitioLugar(l, e.sha, e.pub); c.push({ x: s.x, y: s.y, r: 200, que: l.clave }); }
    });
    return c;
  }
  /* Cuanta niebla hay en un punto: 0 despejado, 1 niebla cerrada, con un borde suave de 90. */
  function niebla(x, y, circ) {
    var m = 1;
    for (var i = 0; i < circ.length; i++) {
      var dx = x - circ[i].x, dy = y - circ[i].y, d = Math.sqrt(dx * dx + dy * dy) - circ[i].r;
      m = Math.min(m, Math.max(0, Math.min(1, (d + 90) / 90)));
    }
    return m;
  }
  function huella(circ) { return circ.map(function (c) { return c.x + ',' + c.y + ',' + c.r; }).join(';'); }

  var AtlasNiebla = { despejado: despejado, niebla: niebla, huella: huella, sitioLugar: sitioLugar, sitioCasa: sitioCasa,
                      sitioNodo: sitioNodo, HEX: HEX, DOOGEE: DOOGEE, ANILLO: ANILLO };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasNiebla; } else { raiz.AtlasNiebla = AtlasNiebla; }
})(this);
