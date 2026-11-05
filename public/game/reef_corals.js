(function (raiz) {
  'use strict';
  var PAL = { palo: 'rgb(32,62,74)', oscuro: 'rgb(14,96,104)', claro: 'rgb(70,214,196)', sombra: 'rgba(0,0,0,.35)', nd: 'rgba(150,160,180,.45)' };
  var DX = 46, DY = 46;

    function coral(n) {
    var m = (n && n.aparato && n.aparato.medidas) || {}, ks = Object.keys(m);
    var med = ks.filter(function (k) { return m[k] && m[k].estado === 'MEDIDO'; }).length, emu = ks.filter(function (k) { return m[k] && m[k].estado === 'EMULADO'; }).length;
    var h = 0, c = String(n && n.nodo || '');
    for (var i = 0; i < c.length; i++) { h = (h * 31 + c.charCodeAt(i)) >>> 0; }
    return { nodo: c, medidas: med, emuladas: emu, total: ks.length, nd: med === 0, altura: 10 + 8 * med, ladeo: (h % 7) - 3, lobulos: 2 + (h % 3) };
  }
    var CORAL_C = { h: 12, s: 82, l: 62 };
  function pintaUno(g, p, k, dpr) {
    var a = k.altura * dpr, x = p[0], y = p[1], top = y - a, r = (5 + 2 * k.medidas) * dpr, cx = x + k.ladeo * dpr;
    var BT = raiz.AtlasBuildingsToon;
    if (k.nd && raiz.AtlasZ && !raiz.AtlasZ.visible('NO_DATA')) { return; }
    g.save();
    g.fillStyle = PAL.sombra; g.beginPath(); g.ellipse(x, y + 1.5 * dpr, r * 1.2, r * 0.35, 0, 0, 2 * Math.PI); g.fill();
    if (k.nd) { g.globalAlpha = 0.45; g.setLineDash([2 * dpr, 2 * dpr]); }
    g.strokeStyle = k.nd ? PAL.nd : PAL.palo; g.lineWidth = 2.2 * dpr;
    g.beginPath(); g.moveTo(x, y); g.lineTo(cx, top); g.stroke();
    g.setLineDash([]);
    for (var i = 0; i < k.lobulos; i++) {
      var lx = cx + (i - (k.lobulos - 1) / 2) * r * 1.05, ly = top - (i % 2) * r * 0.55, lr = r * (0.95 - 0.1 * i);
      if (k.nd) { g.beginPath(); g.arc(lx, ly, lr, 0, 2 * Math.PI); g.stroke(); continue; }
      g.save(); if (k.nd) { g.globalAlpha = 0.45; }
      raiz.AtlasMapBubbleFigures.draw(g, 'star', lx, ly, lr, k.nd ? 'shut' : 'open');
      g.restore();
    }
    g.restore();
  }
    function pinta(g, P, o) {
    var Ce = raiz.AtlasNodosCedulas, N = raiz.AtlasNiebla, pon = o.pon || function (x, y, d) { d(); }, dpr = o.dpr || 1;
    if (!N || !N.sitioNodo || (o.projection === undefined && !Ce)) { return; }
    var view = raiz.AtlasNodeProjection;
    var nodes = o.projection === undefined ? Ce.nodos : view ? view.select(o.projection, []) : [];
    nodes.forEach(function (n) {
      var s = N.sitioNodo(n.nodo);
      if (!s) { return; }         var k = coral(n), x = s.x + DX, y = s.y + DY;
      pon(x, y, function () { pintaUno(g, P(x, y), k, dpr); }, function () {
        var f = { que: 'Coral · ' + k.nodo, hit: { dx: k.ladeo * dpr, dy: -k.altura * dpr, radius: (5 + 2 * k.medidas) * dpr * (k.lobulos + 1) / 2 }, estado: k.nd ? 'NO_DATA (no measure of this node is MEASURED' + (k.emuladas ? '; ' + k.emuladas + ' EMULATED do not count' : '') + ')'
                 : k.medidas + ' of ' + k.total + ' measures MEASURED', causas: [] };
                var HB = raiz.AtlasHexBench;
        if (o.projection === undefined && n.nodo === 'nodo.0.hexelion' && HB) {
          var B = HB.BENCH, mm = B.modelos.filter(function (m) { return m.estado === 'MEDIDO'; })[0];
          f.causas.push('bench ' + B.fuente.fecha + ' · ' + B.fuente.archivo + ' · sha256 ' + B.fuente.sha256.slice(0, 16));
          f.causas.push(mm ? mm.modelo + ': pp512 ' + mm.pp512_tok_s + ' tok/s (' + mm.medido_en + ')' : 'NO_DATA (no model measured)');
          f.causas.push(HB.BENCH.modelos.length - HB.medidos() + ' models NO_DATA with their causes in the file');
          f.causas.push('lab: ' + B.fuente.enlace);
          f.causas.push('raw figures published at the lab: ' + B.fuente.archivo + ' · sha256 ' + B.fuente.sha256.slice(0, 16));
        }
        return raiz.AtlasPlaceCards.ficha('coral', f, { enlace: o.projection === undefined && n.nodo === 'nodo.0.hexelion' && HB ? HB.BENCH.fuente.enlace : null });
      });
    });
  }

  var AtlasCorales = { coral: coral, pinta: pinta, PAL: PAL };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCorales; } else { raiz.AtlasCorales = AtlasCorales; }
})(this);
