/* preceptoros.org · theGame · EL ZOOM DEL MAPA (comunicado 13-oct, punto 1; sale de `mar.js` para caber en su techo).

   Pellizco con dos dedos (tactil) y rueda sin Ctrl (puntero). Ctrl+rueda NO se toma: el navegador hace su zoom de
   pagina (PC). El factor va de 0,6 a 3 (1 = el zoom de siempre). Cada cambio se anota en `data-zoom` del lienzo, que
   es lo que leen el lab y el medidor. Sin red, sin azar, sin reloj: el gesto solo fija un numero. */
(function (raiz) {
  'use strict';
  var MIN = 0.6, MAX = 3;

  function crea(c) {
    var zm = 1, pts = {}, d0 = 0, zm0 = 1;
    c.dataset.zoom = '1.00';
    function dist() { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; }
    function fija(v) { zm = Math.max(MIN, Math.min(MAX, v)); c.dataset.zoom = zm.toFixed(2); }
    c.addEventListener('pointerdown', function (ev) { pts[ev.pointerId] = [ev.clientX, ev.clientY]; if (Object.keys(pts).length === 2) { d0 = dist(); zm0 = zm; } });
    c.addEventListener('pointermove', function (ev) {
      if (pts[ev.pointerId]) { pts[ev.pointerId] = [ev.clientX, ev.clientY]; }
      if (Object.keys(pts).length === 2) { fija(zm0 * dist() / d0); }
    });
    function suelta(ev) { delete pts[ev.pointerId]; }
    c.addEventListener('pointerup', suelta); c.addEventListener('pointercancel', suelta);
    c.addEventListener('wheel', function (ev) { if (ev.ctrlKey) { return; } ev.preventDefault(); fija(zm * Math.exp(-ev.deltaY * 0.0015)); }, { passive: false });
    return { factor: function () { return zm; } };
  }

  var AtlasMapZoom = { crea: crea, MIN: MIN, MAX: MAX };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMapZoom; } else { raiz.AtlasMapZoom = AtlasMapZoom; }
})(this);
