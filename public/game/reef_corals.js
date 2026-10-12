/* preceptoros.org · theGame · LOS CORALES DEL RACK (A, FIRMO 2026-10-12: el mapa manda).

   «Hexelion, el primer coral» (BIBLIA_THEGAME:14): cada nodo de las cedulas del rack es un CORAL al pie de su onda.
   Decoracion con canon y que PINTA ESTADO MEDIDO, jamas adorno: su altura sale de cuantas medidas del nodo estan en
   MEDIDO (lo EMULADO no cuenta); sin ninguna, cuerpo hueco y translucido (NO_DATA, Escala Viva).
   El dibujo es el metodo firmado: 3D forzado con pares claro/oscuro (palo + circulo oscuro + circulo claro), sombra =
   silueta inferior plana, paleta unica y constante, cero raster, cero azar: la forma sale del nombre del nodo.
   Se encola en la cola de pintor (profundidad por Z-ordering). Sin red, sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  var PAL = { palo: 'rgb(32,62,74)', oscuro: 'rgb(14,96,104)', claro: 'rgb(70,214,196)', sombra: 'rgba(0,0,0,.35)', nd: 'rgba(150,160,180,.45)' };
  var DX = 46, DY = 46;

  /* Puro: el coral de un nodo de las cedulas. medidas = cuantas en MEDIDO, de cuantas. */
  function coral(n) {
    var m = (n && n.aparato && n.aparato.medidas) || {}, ks = Object.keys(m);
    var med = ks.filter(function (k) { return m[k] && m[k].estado === 'MEDIDO'; }).length, emu = ks.filter(function (k) { return m[k] && m[k].estado === 'EMULADO'; }).length;
    var h = 0, c = String(n && n.nodo || '');
    for (var i = 0; i < c.length; i++) { h = (h * 31 + c.charCodeAt(i)) >>> 0; }
    return { nodo: c, medidas: med, emuladas: emu, total: ks.length, nd: med === 0, altura: 10 + 8 * med, ladeo: (h % 7) - 3, lobulos: 2 + (h % 3) };
  }
  /* FORMA INFANTIL (ronda 3): un manojo de burbujas redondas sobre un tallo corto. El numero de burbujas (2 a 4) y su
     altura salen del nombre del nodo: cada coral es distinto y siempre el mismo. Las burbujas van en bandas toon del
     hue del coral (AtlasBuildingsToon.disco). Con medidas, dos ojos; sin medidas (NO_DATA), contorno punteado y SIN cara:
     nada medido no sonrie. Sin rotulo dentro: el circulo-con-rotulo queda prohibido como pintado final. */
  var CORAL_C = { h: 12, s: 82, l: 62 };
  function pintaUno(g, p, k, dpr) {
    var a = k.altura * dpr, x = p[0], y = p[1], top = y - a, r = (5 + 2 * k.medidas) * dpr, cx = x + k.ladeo * dpr;
    var BT = raiz.AtlasBuildingsToon;
    g.save();
    g.fillStyle = PAL.sombra; g.beginPath(); g.ellipse(x, y + 1.5 * dpr, r * 1.2, r * 0.35, 0, 0, 2 * Math.PI); g.fill();
    if (k.nd) { g.globalAlpha = 0.45; g.setLineDash([2 * dpr, 2 * dpr]); }
    g.strokeStyle = k.nd ? PAL.nd : PAL.palo; g.lineWidth = 2.2 * dpr;
    g.beginPath(); g.moveTo(x, y); g.lineTo(cx, top); g.stroke();
    g.setLineDash([]);
    for (var i = 0; i < k.lobulos; i++) {
      var lx = cx + (i - (k.lobulos - 1) / 2) * r * 1.05, ly = top - (i % 2) * r * 0.55, lr = r * (0.95 - 0.1 * i);
      if (k.nd) { g.beginPath(); g.arc(lx, ly, lr, 0, 2 * Math.PI); g.stroke(); continue; }
      if (BT) { BT.disco(g, lx, ly, lr, CORAL_C, dpr, 1); }
      else { g.fillStyle = PAL.oscuro; g.beginPath(); g.arc(lx, ly, lr, 0, 2 * Math.PI); g.fill(); }
      if (i === 0) {   // cara solo con medidas: dos ojos
        g.fillStyle = '#f2f4f8'; g.beginPath(); g.arc(lx - lr * 0.35, ly - lr * 0.1, lr * 0.22, 0, 2 * Math.PI); g.fill();
        g.beginPath(); g.arc(lx + lr * 0.25, ly - lr * 0.1, lr * 0.22, 0, 2 * Math.PI); g.fill();
        g.fillStyle = PAL.palo; g.beginPath(); g.arc(lx - lr * 0.33, ly - lr * 0.08, lr * 0.09, 0, 2 * Math.PI); g.fill();
        g.beginPath(); g.arc(lx + lr * 0.27, ly - lr * 0.08, lr * 0.09, 0, 2 * Math.PI); g.fill();
      }
    }
    g.restore();
  }
  /* g, P como las demas capas; o: { dpr, pon }. */
  function pinta(g, P, o) {
    var Ce = raiz.AtlasNodosCedulas, N = raiz.AtlasNiebla, pon = o.pon || function (x, y, d) { d(); }, dpr = o.dpr || 1;
    if (!Ce || !N || !N.sitioNodo) { return; }
    Ce.nodos.forEach(function (n) {
      var s = N.sitioNodo(n.nodo);
      if (!s) { return; }   /* sin punto en el mapa, sin coral */
      var k = coral(n), x = s.x + DX, y = s.y + DY;
      pon(x, y, function () { pintaUno(g, P(x, y), k, dpr); }, function () {
        var f = { que: 'Coral · ' + k.nodo, estado: k.nd ? 'NO_DATA (no measure of this node is MEASURED' + (k.emuladas ? '; ' + k.emuladas + ' EMULATED do not count' : '') + ')'
                 : k.medidas + ' of ' + k.total + ' measures MEASURED', causas: [] };
        /* El payload de Hexelion (hexelion_bench.js): sus cifras medidas con su fuente. Cero fetch. */
        var HB = raiz.AtlasHexBench;
        if (n.nodo === 'nodo.0.hexelion' && HB) {
          var B = HB.BENCH, mm = B.modelos.filter(function (m) { return m.estado === 'MEDIDO'; })[0];
          f.causas.push('bench ' + B.fuente.fecha + ' · ' + B.fuente.archivo + ' · sha256 ' + B.fuente.sha256.slice(0, 16));
          f.causas.push(mm ? mm.modelo + ': pp512 ' + mm.pp512_tok_s + ' tok/s (' + mm.medido_en + ')' : 'NO_DATA (no model measured)');
          f.causas.push(HB.BENCH.modelos.length - HB.medidos() + ' models NO_DATA with their causes in the file');
          f.causas.push('lab: ' + B.fuente.enlace);
        }
        return f;
      });
    });
  }

  var AtlasCorales = { coral: coral, pinta: pinta, PAL: PAL };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCorales; } else { raiz.AtlasCorales = AtlasCorales; }
})(this);
