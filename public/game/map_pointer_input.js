/* preceptoros.org · theGame · EL DEDO EN EL MAPA: arrastrar, tocar un lugar y las teclas (sacado de `mar.js`, 2026-10-12).

   Se separa ANTES de migrar el mapa a la LEY DEL SUELO (isometrico 2:1): `mar.js` estaba a 198 B de su techo, y el
   dedo es justo lo que cambia con el rombo. Arrastrar convierte el movimiento de PANTALLA en movimiento de MUNDO con
   la inversa de la proyeccion (`AtlasCamara.aMundoDelta`); tocar elige el lugar mas cercano EN PANTALLA (lo que ve
   el dedo). Nada teletransporta: arrastrar mueve la camara con su inercia, y soltar deja que planee.

   `monta(ctx)`: ctx = { c (lienzo), C (AtlasCamara), dpr, z() (pixeles por unidad), cam(), circ(), quieto(), choca(),
   marca() (el mapa ya se movio), lugares(), sitio(l), elige(l), flecha(d) }. Sin red, sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  function monta(x) {
    var c = x.c, C = x.C, arrastre = null;
    c.addEventListener('pointerdown', function (ev) {
      x.marca(); arrastre = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY };
      c.setPointerCapture(ev.pointerId);
    });
    c.addEventListener('pointermove', function (ev) {
      if (!arrastre || ev.pointerId !== arrastre.id) { return; }
      var z = x.z() / x.dpr, d = C.aMundoDelta(ev.clientX - arrastre.x, ev.clientY - arrastre.y, z);
      if (C.arrastra(x.cam(), d[0], d[1], x.circ(), x.quieto())) { x.choca(); }
      arrastre.x = ev.clientX; arrastre.y = ev.clientY;
    });
    function suelta(ev) {
      if (!arrastre) { return; }
      var corto = Math.abs(ev.clientX - arrastre.x0) + Math.abs(ev.clientY - arrastre.y0) < 8;
      arrastre = null;
      if (!corto) { return; }
      var cam = x.cam(); cam.vx = 0; cam.vy = 0;
      var r = c.getBoundingClientRect(), px = (ev.clientX - r.left) * x.dpr, py = (ev.clientY - r.top) * x.dpr, z = x.z();
      var mejor = null, dist = 44 * x.dpr;
      x.lugares().forEach(function (l) {
        var s = x.sitio(l), p = C.aPantalla(cam, c.width, c.height, z, s.x, s.y), d = Math.hypot(p[0] - px, p[1] - py);
        if (d < dist) { dist = d; mejor = l; }
      });
      if (mejor) { x.elige(mejor); }
    }
    c.addEventListener('pointerup', suelta);
    c.addEventListener('pointercancel', function () { arrastre = null; });
    c.addEventListener('keydown', function (ev) {
      var d = { ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'arr', ArrowDown: 'aba', Home: 'casa' }[ev.key];
      if (!d) { return; }
      ev.preventDefault(); x.flecha(d);
    });
  }
  raiz.AtlasMapaDedo = { monta: monta };
})(this);
