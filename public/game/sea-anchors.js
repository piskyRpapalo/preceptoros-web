(function (raiz) {
  'use strict';
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
    }, function () { return { que: a.clase, estado: a.clase === 'prisma' && o.bandera != null ? 'your flag' : 'PROPOSAL · not built yet' }; }); });
  }
  raiz.AtlasMarAnclas = { pinta: pinta };
})(this);
