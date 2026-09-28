/* preceptoros.org · theGame · LA OBRA: los edificios grandes, hechos de curvas.

   De lejos, textura; de cerca, construccion (la leccion de la Sagrada Familia): arcos catenarios
   anidados, vetas parabolicas, pinaculos cuya altura sale de una serie de Fourier y una banda de
   luz que cruza la fachada, recortada a su silueta, para que respire volumen sin sombreado caro.
   Todo son lineas, arcos y gradientes: ni un raster.

   EL DETALLE SIGUE A LA ESCALA: con el edificio pequeno (Superficie, movil) se trazan pocas
   vetas; al acercarse, mas. EL ESTADO SE VE: el Nucleo brilla en proporcion a su integridad y
   sus pinaculos suben con su nivel, leidos de la instantanea; sin instantanea, al minimo, sin
   inventar. Lo que no es de un edificio grande (la grieta) lo sigue pintando `atlas-arte.js`. */
(function () {
  'use strict';

  var A = window.AtlasArte;
  if (!A) { return; }
  var P = A.P, al = A.alfa;

  /* Arco catenario de ancho 2w y alto h con la base en (x, y). */
  function arco(e, x, y, w, h) {
    var c = Math.cosh(1) - 1;
    e.moveTo(x - w, y);
    for (var i = -10; i <= 10; i++) {
      var u = i / 10;
      e.lineTo(x + u * w, y - h * (1 - (Math.cosh(u) - 1) / c));
    }
  }
  /* Pinaculo: tronco que se estrecha en tramos, con una perla en cada nudo. */
  function pinaculo(e, x, y, w, h, color) {
    e.fillStyle = color;
    e.beginPath(); e.moveTo(x - w, y); e.lineTo(x - w * 0.15, y - h); e.lineTo(x + w * 0.15, y - h); e.lineTo(x + w, y);
    e.fill();
    for (var k = 1; k < 4; k++) {
      e.beginPath(); e.arc(x, y - h * k / 4, w * (1 - k / 4) * 0.55, 0, 7); e.fill();
    }
  }
  function silueta(e, x, y, w, h) { e.beginPath(); arco(e, x, y, w, h); e.closePath(); }
  /* Vetas: arcos anidados finos. Muchas lineas a poca opacidad = materia a distancia. */
  function vetas(e, x, y, w, h, n, color) {
    e.strokeStyle = color; e.lineWidth = 0.7;
    for (var i = 1; i <= n; i++) {
      var f = i / (n + 1);
      e.beginPath(); arco(e, x, y, w * (1 - f * 0.85), h * (1 - f * 0.55)); e.stroke();
    }
  }
  /* La luz que baja cruza la fachada despacio, recortada a su silueta. */
  function luz(e, x, y, w, h, t) {
    e.save(); silueta(e, x, y, w, h); e.clip();
    var bx = x + Math.sin(t * 0.00035 + x * 0.01) * w;
    var g = e.createLinearGradient(bx - w * 0.3, 0, bx + w * 0.3, 0);
    g.addColorStop(0, al(P.superficie, 0)); g.addColorStop(0.5, al(P.superficie, 0.22)); g.addColorStop(1, al(P.superficie, 0));
    e.fillStyle = g; e.fillRect(x - w, y - h, w * 2, h);
    e.restore();
  }
  function cuerpo(e, x, y, w, h, c0, c1) {
    var g = e.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    silueta(e, x, y, w, h); e.fillStyle = g; e.fill();
  }

  var OBRA = {
    nucleo: function (e, x, y, s, t, ins, n) {
      var vida = ins && ins.integridad_max ? ins.integridad / ins.integridad_max : 0.2;
      var nivel = ins ? Math.min(5, ins.nivel_nucleo || 1) : 1, w = s * 0.9, h = s * 1.1;
      var halo = e.createRadialGradient(x, y - h * 0.6, 0, x, y - h * 0.6, s * 1.8);
      halo.addColorStop(0, al(P.violetaLuz, 0.35 * vida)); halo.addColorStop(1, al(P.violetaLuz, 0));
      e.fillStyle = halo; e.fillRect(x - s * 1.8, y - h * 0.6 - s * 1.8, s * 3.6, s * 3.6);
      cuerpo(e, x, y, w, h, P.piedraLuz, P.abismo);
      vetas(e, x, y, w, h, n, al(P.violetaLuz, 0.35));
      /* Pinaculos: 5 alturas de una serie de Fourier; suben con el nivel del Nucleo. */
      for (var i = -2; i <= 2; i++) {
        var f = 0.55 + 0.25 * Math.cos(i * 1.3) + 0.2 * Math.cos(i * 2.9);
        pinaculo(e, x + i * w * 0.34, y - h * (0.55 + 0.1 * (2 - Math.abs(i))), w * 0.09,
                 h * f * (0.6 + 0.12 * nivel), al(i ? P.violeta : P.violetaLuz, 0.85));
      }
      luz(e, x, y, w, h, t);
    },
    forja: function (e, x, y, s, t, ins, n) {
      var w = s * 0.8, h = s * 0.8, pulso = 0.5 + 0.5 * Math.sin(t * 0.003);
      cuerpo(e, x, y, w, h, P.cobre, P.piedra);
      vetas(e, x, y, w, h, n, al(P.oro, 0.3));
      pinaculo(e, x - w * 0.5, y - h * 0.6, w * 0.12, h * 0.8, al(P.piedraLuz, 0.95));
      pinaculo(e, x + w * 0.45, y - h * 0.55, w * 0.1, h * 0.6, al(P.piedraLuz, 0.95));
      e.fillStyle = al(P.ascua, 0.35 + 0.35 * pulso);
      e.beginPath(); arco(e, x, y, w * 0.28, h * 0.4); e.closePath(); e.fill();
      luz(e, x, y, w, h, t);
    },
    aguja: function (e, x, y, s, t, ins, n) {
      var h = s * 2.2;
      for (var i = -1; i <= 1; i++) {
        var hx = h * (i ? 0.62 : 1), bx = x + i * s * 0.32, w = s * (i ? 0.16 : 0.22);
        /* Silueta hiperbolica: ancho w / (1 + 3u), afila hacia la punta. */
        e.beginPath(); e.moveTo(bx - w, y);
        for (var k = 0; k <= 12; k++) { var u = k / 12; e.lineTo(bx - w / (1 + 3 * u), y - hx * u); }
        for (var j = 12; j >= 0; j--) { var v = j / 12; e.lineTo(bx + w / (1 + 3 * v), y - hx * v); }
        e.closePath();
        var g = e.createLinearGradient(0, y - hx, 0, y);
        g.addColorStop(0, P.kelpLuz); g.addColorStop(1, P.piedra);
        e.fillStyle = g; e.fill();
        e.strokeStyle = al(P.oro, 0.4); e.lineWidth = 0.7;
        for (var r = 1; r <= Math.min(n, 6); r++) {
          var ry = y - hx * r / 7, rw = w / (1 + 3 * r / 7);
          e.beginPath(); e.ellipse(bx, ry, rw * 1.6, rw * 0.5, 0, 0, 7); e.stroke();
        }
      }
    },
    ojo: function (e, x, y, s, t, ins, n) {
      var w = s * 0.75, h = s * 1.2;
      cuerpo(e, x, y, w, h, P.agua, P.piedra);
      vetas(e, x, y, w, h, n, al(P.vidrio, 0.25));
      var cx = x, cy = y - h * 0.62, r = s * 0.32, giro = t * 0.0005;
      for (var k = 0; k < 3; k++) {
        e.strokeStyle = al(k ? P.vidrio : P.superficie, 0.7 - k * 0.18); e.lineWidth = 1;
        e.beginPath(); e.ellipse(cx, cy, r * (1 - k * 0.25), r * (0.45 - k * 0.1), giro * (k + 1), 0, 7); e.stroke();
      }
      e.fillStyle = al(P.superficie, 0.9); e.beginPath(); e.arc(cx, cy, r * 0.16, 0, 7); e.fill();
      luz(e, x, y, w, h, t);
    }
  };

  /* Misma firma que `AtlasArte.estructura`, con la instantanea al final. (x, y) es el centro que
     usaba el arte; la obra apoya su base un poco mas abajo, en el lecho. */
  function pinta(e, k, x, y, s, t, ins) {
    if (!OBRA[k]) { A.estructura(e, k, x, y, s, t); return; }
    e.save();
    OBRA[k](e, x, y + s * 0.45, s, t, ins, s > 30 ? 9 : s > 18 ? 6 : 3);
    e.restore();
  }

  window.AtlasObra = { pinta: pinta };
})();
