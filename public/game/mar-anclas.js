/* preceptoros.org · theGame · LAS ANCLAS DEL MAPA, dibujadas (R7; salen de `mar.js` en P10 porque `mar.js`
   estaba a 3 B de su techo: una pieza que crece se parte ANTES de crecer).

   Solo vocabulario visual: lo que anclan se construye con su propio FIRMO. El tubo de cada nodo al rack es
   una linea DOBLE teal; las anclas futuras, un rombo hueco en trazos (PROPUESTA, ideas6oct:1748:
   discontinuidad = lo que aun no es) con su nombre corto. EXCEPCION, desde P10: el PRISMA DE BANDERA ya
   existe; si la persona eligio bandera, su rombo va LLENO del color de SU bandera (lo eligio ella: nada
   decide color por otro) y se rotula como bandera. Puro de red: los datos salen de `fog_of_war.anclas`. */
(function (raiz) {
  'use strict';
  /* g: contexto; P(x, y) -> pixeles; o: { pub, sha, nodos, dpr, bandera (tono hsl o null), texto(k) }. */
  function pinta(g, P, o) {
    var N = raiz.AtlasNiebla, dpr = o.dpr || 1, pon = o.pon || function (x, y, d) { d(); };
    N.anclas({ pub: o.pub, sha: o.sha, nodos: o.nodos || [] }).forEach(function (a) { pon(a.x, a.y, function () {
      var p = P(a.x, a.y), r = 7 * dpr, lleno = a.clase === 'prisma' && o.bandera != null;
      g.strokeStyle = 'rgba(46,230,200,.55)';
      if (a.a) { var q = P(a.a.x, a.a.y); [-3, 3].forEach(function (d) { g.beginPath(); g.moveTo(p[0] + d * dpr, p[1] + d * dpr); g.lineTo(q[0] + d * dpr, q[1] + d * dpr); g.stroke(); }); return; }
      g.setLineDash(lleno ? [] : [2 * dpr, 2 * dpr]); g.beginPath();
      g.moveTo(p[0], p[1] - r); g.lineTo(p[0] + r, p[1]); g.lineTo(p[0], p[1] + r); g.lineTo(p[0] - r, p[1]); g.closePath();
      if (lleno) { g.fillStyle = 'hsl(' + o.bandera + ' 85% 60%)'; g.fill(); }
      g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(155,227,255,.75)'; g.fillText(lleno && o.texto ? o.texto('bandera_mapa') : a.clase, p[0], p[1] - r - 3 * dpr);
    }); });
  }
  raiz.AtlasMarAnclas = { pinta: pinta };
})(this);
