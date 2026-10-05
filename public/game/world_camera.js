/* preceptoros.org · theGame · LA CAMARA del mapa global: se arrastra, tiene inercia y CHOCA con la niebla.

   La camara es un punto del mundo (su centro) y una velocidad. Moverla es sumar; soltarla deja que la
   inercia la lleve y la frene. Su centro solo puede estar en lo DESPEJADO (`fog_of_war.js`): si un
   paso la saca, vuelve al borde mas cercano, su velocidad rebota hacia dentro y se avisa del choque.
   Con movimiento reducido no hay inercia: saltos. Puro y determinista: mismo estado y mismos pasos,
   misma vista (`atlas/camara_casos.mjs`). Sin DOM, sin reloj; el `dt` lo pone quien llama. */
(function (raiz) {
  'use strict';

  var MARGEN = 70, FRENO = 0.9, REBOTE = 0.35;

  function crea(inicio) { return { x: inicio.x, y: inicio.y, vx: 0, vy: 0, choco: 0 }; }
  /* El punto despejado mas cercano a (x, y): dentro de algun circulo (menos el margen). */
  function dentro(x, y, circ) {
    var mejor = null, md = Infinity;
    for (var i = 0; i < circ.length; i++) {
      var c = circ[i], R = Math.max(1, c.r - MARGEN), dx = x - c.x, dy = y - c.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d <= R) { return { x: x, y: y, fuera: false }; }
      if (d - R < md) { md = d - R; mejor = { x: c.x + dx / d * R, y: c.y + dy / d * R, fuera: true, nx: dx / d, ny: dy / d }; }
    }
    return mejor || { x: x, y: y, fuera: false };
  }
  function limita(cam, circ) {
    var p = dentro(cam.x, cam.y, circ);
    if (!p.fuera) { return false; }
    cam.x = p.x; cam.y = p.y;
    var vn = cam.vx * p.nx + cam.vy * p.ny;
    if (vn > 0) { cam.vx -= (1 + REBOTE) * vn * p.nx; cam.vy -= (1 + REBOTE) * vn * p.ny; }
    cam.choco++;
    return true;
  }
  /* Arrastre: el dedo mueve la camara en sentido contrario (se arrastra el mundo). */
  function arrastra(cam, dx, dy, circ, quieto) {
    cam.x -= dx; cam.y -= dy;
    if (quieto) { cam.vx = 0; cam.vy = 0; } else { cam.vx = -dx; cam.vy = -dy; }
    return limita(cam, circ);
  }
  /* Un salto (flechas o botones): con inercia, empuja; sin ella, se mueve de golpe. */
  function empuja(cam, dx, dy, circ, quieto) {
    if (quieto) { cam.x += dx; cam.y += dy; return limita(cam, circ); }
    cam.vx += dx * (1 - FRENO); cam.vy += dy * (1 - FRENO);
    return false;
  }
  /* Un paso de tiempo: la inercia lleva y frena. `k` = dt / 16. */
  function paso(cam, k, circ) {
    if (Math.abs(cam.vx) < 0.01 && Math.abs(cam.vy) < 0.01) { cam.vx = 0; cam.vy = 0; return false; }
    cam.x += cam.vx * k; cam.y += cam.vy * k;
    var f = Math.pow(FRENO, k); cam.vx *= f; cam.vy *= f;
    return limita(cam, circ);
  }
  /* Lo que se ve: el rectangulo de mundo para un lienzo de W x H con `z` pixeles por unidad. */
  function vista(cam, W, H, z) { return { x0: cam.x - W / 2 / z, y0: cam.y - H / 2 / z, x1: cam.x + W / 2 / z, y1: cam.y + H / 2 / z, z: z }; }
  function aPantalla(cam, W, H, z, x, y) { return [(x - cam.x) * z + W / 2, (y - cam.y) * z + H / 2]; }
  function aMundo(cam, W, H, z, sx, sy) { return [(sx - W / 2) / z + cam.x, (sy - H / 2) / z + cam.y]; }

  var AtlasCamara = { crea: crea, arrastra: arrastra, empuja: empuja, paso: paso, limita: limita, dentro: dentro,
                      vista: vista, aPantalla: aPantalla, aMundo: aMundo, MARGEN: MARGEN };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCamara; } else { raiz.AtlasCamara = AtlasCamara; }
})(this);
