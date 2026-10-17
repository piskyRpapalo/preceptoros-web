(function (raiz) {
  'use strict';

    function casas(projection) {
    var Ce = raiz.AtlasNodosCedulas, Q = raiz.AtlasCuenta, G = raiz.AtlasGacha, N = raiz.AtlasNiebla, K = raiz.AtlasCanon;
    if (!G || !N || !K || (projection === undefined && !Ce)) { return []; }
    var view = raiz.AtlasNodeProjection;
    var nodes = projection === undefined ? Ce.nodos : view ? view.select(projection, []) : [];
    return nodes.filter(function (c) { return N.sitioNodo(c.nodo); }).map(function (c) {
      var m = c.aparato.medidas, s = N.sitioNodo(c.nodo);
      return { nodo: c.nodo, x: s.x, y: s.y, ram: m.ram_mib || {}, gen: m.gen_cps || {},
               estado: Q ? Q.estadoNodo(c) : { activo: 'NO_DATA' }, t: G.tirada(K.sha('atlas.emblema/1:' + c.nodo), 'tc3') };
    });
  }

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
