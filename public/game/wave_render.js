/* preceptoros.org · theGame · EL TRAZO DE LAS ONDAS, a la maxima calidad que caben 16 KiB.

   «Lo unico que requiere atencion extra es la FORMA DE LAS ONDAS» (Soberano, 2026-10-05). Una tropa,
   un emblema o una casa son su serie de Fourier `[k, ax, ay, fase]` (de `gacha.js`), y aqui se
   dibujan FIELES a esos armonicos -- el mismo `punto` que usa la gacha, nada redondeado ni simplificado:
   - grosor VARIABLE: el trazo engorda donde la curva va lenta y adelgaza donde corre (como una pluma);
   - BRILLO ADITIVO (`lighter`) en tres pasadas sobre fondo oscuro;
   - ESTELA con persistencia: la figura en giros anteriores, cada vez mas tenue;
   - armonicos que RESPIRAN: cada uno late a su ritmo, sin cambiar la forma media;
   - NACIMIENTO armonico a armonico (`crece`, 0..1): la base de la revelacion de la gacha.
   SPRITES precompuestos: una figura quieta se pinta una vez en un lienzo aparte y se pega.
   `calidad` 0..2 lo baja con elegancia cuando los fps no llegan (lo decide quien llama).
   Sin azar y sin red: todo sale de los armonicos y del tiempo de pantalla. */
(function (raiz) {
  'use strict';

  var G = raiz.AtlasGacha, CACHE = {}, NCACHE = 0;
  var TAU = Math.PI * 2;

  function limite(arm) {
    var l = 0;
    arm.forEach(function (h) { l += Math.max(Math.abs(h[1]), Math.abs(h[2])); });
    return Math.max(1, l);
  }
  /* Los armonicos de este instante: respiran, crecen y se desafinan. */
  function vivos(arm, o) {
    var t = o.t || 0, n = arm.length, c = o.crece == null ? 1 : o.crece, d = o.desafina || 0;
    return arm.map(function (h, j) {
      var peso = Math.max(0, Math.min(1, c * n - j)), late = o.respira === false ? 1 : 1 + 0.05 * Math.sin(t * 0.0011 * (j + 1) + j * 1.7);
      var tuerce = d ? ((j * 7 + 3) % 11 - 5) / 5 * d * 14 : 0;
      return [h[0], h[1] * peso * late, h[2] * peso * late, h[3] + tuerce];
    });
  }
  function puntos(arm, n) {
    var p = [];
    for (var i = 0; i <= n; i++) { p.push(G.punto(arm, i / n * TAU)); }
    return p;
  }
  function color(c, a) {
    if (typeof c === 'string') { return c; }
    return 'hsla(' + c[0] + ' ' + c[1] + '% ' + c[2] + '% / ' + (a == null ? 1 : a) + ')';
  }
  /* Una pasada: el contorno entero con grosor por tramo. */
  function trazo(g, P, x, y, k, cs, sn, ancho, variable) {
    var n = P.length - 1, med = 0, L = [];
    for (var i = 1; i <= n; i++) { var dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1]; L.push(Math.sqrt(dx * dx + dy * dy)); med += L[i - 1]; }
    med = med / n || 1;
    function px(p) { return x + (p[0] * cs - p[1] * sn) * k; }
    function py(p) { return y - (p[0] * sn + p[1] * cs) * k; }
    if (!variable) {
      g.lineWidth = ancho; g.beginPath();
      for (var j = 0; j <= n; j++) { g[j ? 'lineTo' : 'moveTo'](px(P[j]), py(P[j])); }
      g.stroke(); return;
    }
    for (var s = 1; s <= n; s++) {
      g.lineWidth = ancho * Math.max(0.45, Math.min(1.7, 1.35 - (L[s - 1] / med - 1) * 0.5));
      g.beginPath(); g.moveTo(px(P[s - 1]), py(P[s - 1])); g.lineTo(px(P[s]), py(P[s])); g.stroke();
    }
  }
  /* LA FIGURA. `o`: { t, color ([h,s,l] o css), giro, escala, grosor, brillo 0..1, estela n, crece,
     desafina, alfa, calidad 0..2, respira }. */
  function dibuja(g, arm, x, y, r, o) {
    o = o || {};
    var q = o.calidad == null ? 2 : o.calidad, A = vivos(arm, o), k = r / limite(arm) * (o.escala == null ? 1 : o.escala);
    var n = q >= 2 ? 220 : q >= 1 ? 140 : 80, P = puntos(A, n), giro = o.giro || 0, gr = o.grosor || 2, alfa = o.alfa == null ? 1 : o.alfa;
    var c = o.color || [270, 70, 72], brillo = o.brillo == null ? 0.8 : o.brillo;
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    g.globalCompositeOperation = 'lighter';
    /* La estela: la misma figura en giros anteriores. */
    var est = q >= 1 ? (o.estela || 0) : 0;
    for (var e = est; e >= 1; e--) {
      var ge = giro - e * (o.pasoEstela || 0.06);
      g.strokeStyle = color(c, alfa * 0.18 * (1 - e / (est + 1)));
      trazo(g, P, x, y, k, Math.cos(ge), Math.sin(ge), gr * 0.8, false);
    }
    var cs = Math.cos(giro), sn = Math.sin(giro);
    if (brillo > 0 && q >= 1) {
      g.strokeStyle = color(c, alfa * 0.07 * brillo); trazo(g, P, x, y, k, cs, sn, gr * 7, false);
      g.strokeStyle = color(c, alfa * 0.16 * brillo); trazo(g, P, x, y, k, cs, sn, gr * 3.2, false);
    }
    g.strokeStyle = color(c, alfa); trazo(g, P, x, y, k, cs, sn, gr, q >= 2);
    if (q >= 1) {
      var blanco = typeof c === 'string' ? 'rgba(255,255,255,' + 0.35 * alfa + ')' : color([c[0], c[1] * 0.4, 92], 0.35 * alfa);
      g.strokeStyle = blanco; trazo(g, P, x, y, k, cs, sn, Math.max(0.6, gr * 0.35), false);
    }
    g.restore();
  }
  /* UN SPRITE: la figura quieta, con su brillo, pintada una vez. Se reutiliza por clave. */
  function sprite(arm, r, c, clave, dpr) {
    var key = clave + ':' + Math.round(r) + ':' + (dpr || 1);
    if (CACHE[key]) { return CACHE[key]; }
    if (NCACHE > 120) { CACHE = {}; NCACHE = 0; }
    var lado = Math.ceil(r * 2.6), cv = raiz.document.createElement('canvas');
    cv.width = cv.height = lado;
    dibuja(cv.getContext('2d'), arm, lado / 2, lado / 2, r, { color: c, grosor: Math.max(1.2, r / 14), brillo: 1, respira: false, calidad: 2 });
    CACHE[key] = cv; NCACHE++;
    return cv;
  }
  function pegaSprite(g, cv, x, y) { g.drawImage(cv, x - cv.width / 2, y - cv.height / 2); }
  /* El color de un caracter (gacha.caracter) en [h, s, l], para el trazo aditivo. */
  var TONOS = [[35, 80, 62], [140, 55, 58], [275, 65, 72], [205, 30, 74]];
  function tono(t) { return TONOS[G.caracter(t).color]; }
  /* Riqueza de una forma: cuantos armonicos con peso. La rareza se VE aqui, no en un numero. */
  function riqueza(arm) { return arm.filter(function (h) { return Math.abs(h[1]) + Math.abs(h[2]) > 0; }).length; }

  /* Medidor de fps: media movil; `nivel()` propone la calidad (2, 1 o 0) segun el umbral de 50. */
  function medidor() {
    var ult = null, media = 16.7, n = 0;
    return {
      cuadro: function (ts) { if (ult !== null) { var d = Math.min(200, ts - ult); media = media * 0.95 + d * 0.05; n++; } ult = ts; },
      fps: function () { return n > 30 ? Math.round(1000 / media) : null; },
      nivel: function (q) { var f = n > 60 ? 1000 / media : 60; return f < 40 ? 0 : f < 50 ? Math.min(q, 1) : q; }
    };
  }

  raiz.AtlasOnda = { dibuja: dibuja, sprite: sprite, pegaSprite: pegaSprite, tono: tono, riqueza: riqueza, medidor: medidor, limite: limite };
})(this);
