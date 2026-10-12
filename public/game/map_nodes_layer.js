/* preceptoros.org · theGame · LOS NODOS DEL RACK EN EL MAPA (chunk 1: split de mar.js, FIRMO 2026-10-13).

   Sale de `mar.js` para que el mapa tenga margen (su techo es 16 KiB). Mismo comportamiento: `casas()` da las casas
   de las cedulas que tienen punto en el mapa (hoy solo Hexelion, FIRMO 2026-10-12), y `pinta()` dibuja cada una con
   su emblema y su estado de medida (MEDIDO en dorado; el resto, en niebla y desafinado). Sin red, sin azar, sin reloj.
   `mar.js` la llama con su cola de pintor (`pon`), asi que el orden de profundidad no cambia. */
(function (raiz) {
  'use strict';

  /* Las casas de las cedulas, con el estado de cada medida tal cual. */
  function casas() {
    var Ce = raiz.AtlasNodosCedulas, Q = raiz.AtlasCuenta, G = raiz.AtlasGacha, N = raiz.AtlasNiebla, K = raiz.AtlasCanon;
    if (!Ce || !G) { return []; }
    return Ce.nodos.filter(function (c) { return N.sitioNodo(c.nodo); }).map(function (c) {
      var m = c.aparato.medidas, s = N.sitioNodo(c.nodo);
      return { nodo: c.nodo, x: s.x, y: s.y, ram: m.ram_mib || {}, gen: m.gen_cps || {},
               estado: Q ? Q.estadoNodo(c) : { activo: 'NO_DATA' }, t: G.tirada(K.sha('atlas.emblema/1:' + c.nodo), 'tc3') };
    });
  }

  /* o: { H0 (las casas), col (colores del mapa), t (tiempo), dpr, pon (cola de pintor de mar.js) }. */
  function pinta(g, P, o) {
    var E = raiz.AtlasEscena, H0 = o.H0, col = o.col, t = o.t, dpr = o.dpr, pon = o.pon;
    H0.forEach(function (n) { pon(n.x, n.y, function () {
      var p = P(n.x, n.y), r = 26 * dpr, med = n.gen.estado === 'MEDIDO';
      if (med) {
        g.strokeStyle = col.tuya; g.lineWidth = 2 * dpr;
        [1.35, 1.6].forEach(function (k2) { g.beginPath(); g.arc(p[0], p[1], r * k2, 0, 2 * Math.PI); g.stroke(); });
        E.figura(g, n.t.armonicos, p[0], p[1], r, { color: '#f4d29c', giro: t * 0.0003, grosor: 2.2 * dpr, brillo: 14 * dpr });
      } else {
        E.figura(g, n.t.armonicos, p[0], p[1], r, { color: 'rgb(150,160,180)', giro: t * 0.0002, grosor: 1.2 * dpr, desafina: 0.5, t: t });
      }
      g.lineWidth = dpr;
    }, function () { return { que: n.nodo, estado: n.gen.estado }; }); });
  }

  var AtlasMapNodes = { casas: casas, pinta: pinta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMapNodes; } else { raiz.AtlasMapNodes = AtlasMapNodes; }
})(this);
