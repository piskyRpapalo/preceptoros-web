/* preceptoros.org · theGame · EL PINTOR DEL MAR: las teselas del lecho y de la niebla (J6, sacado de `mar.js`).

   Desde U1 («el mapa unico», 2026-10-11) el fondo de la portada ES el mapa global, interactivo y siempre detras:
   el lienzo de fondo propio de J6 (`monta`, `portada`) se RETIRA y queda lo que lo hacia posible, el pintor UNICO
   de teselas que pide el mapa (T0-D: sin gemelos). La deriva es UN desplazamiento global por cuadro (las teselas
   no cambian, el mar si: la respiracion que M4 horneaba mal). Ruido entero (escena.js), niebla de lo MEDIDO
   (fog_of_war.js); el reloj de pantalla solo mueve la deriva. */
(function (raiz) {
  'use strict';

  /* El lecho, de lo hondo a lo alto. R4: las crestas brillan en teal (la bioluminiscencia del fondo), sin
     tocar los colores-senal: esto es terreno, no dato. */
  var TIERRA = [[4, 7, 18], [7, 15, 34], [9, 28, 54], [11, 46, 74], [14, 74, 94], [26, 132, 134], [70, 214, 196]];
  var NIEBLA = [null, [64, 72, 96]], TESELA = 240, RES = 4;


  /* La deriva del mar en el instante t (ms de pantalla): dos senos lentos, en unidades de mundo. */
  function deriva(t) { return [Math.sin(t * 0.00011) * 10, Math.cos(t * 0.00009) * 10]; }

  /* Un pintor de teselas con sus caches acotadas (90 teselas de cada clase). */
  function pintor() {
    var E = raiz.AtlasEscena, N = raiz.AtlasNiebla, C = raiz.AtlasCamara;
    var tierra = {}, nt = 0, nieblas = {}, nn = 0, huella = '', circ = [];
    function tesela(i, j) {
      var k = i + ',' + j;
      if (tierra[k]) { return tierra[k]; }
      if (nt > 90) { tierra = {}; nt = 0; }
      var n = TESELA / RES;
      tierra[k] = E.textura(n, n, function (x, y) {
        var wx = i * TESELA + x * RES, wy = j * TESELA + y * RES;
        return Math.max(0, Math.min(1, E.fbm(wx / 210, wy / 210, 11) * 1.15 - 0.12 + E.fbm(wx / 60, wy / 60, 4) * 0.12));
      }, TIERRA);
      nt++;
      return tierra[k];
    }
    function bruma(i, j) {
      var k = i + ',' + j;
      if (nieblas[k] !== undefined) { return nieblas[k]; }
      if (nn > 90) { nieblas = {}; nn = 0; }
      var n = TESELA / RES, algo = false;
      var t = E.textura(n, n, function (x, y) {
        var v = N.niebla(i * TESELA + x * RES, j * TESELA + y * RES, circ) * 0.78;
        if (v > 0.05) { algo = true; }
        return v;
      }, NIEBLA);
      nieblas[k] = algo ? t : null; nn++;
      return nieblas[k];
    }
    /* Pega las teselas visibles; (dx, dy) desplaza el terreno en unidades de mundo (la deriva). LEY DEL SUELO (2026-10-12):
       cada tesela cuadrada se dibuja como ROMBO con la matriz de la camara (`AtlasCamara.matriz`, la misma proyeccion
       que todo lo demas): mismas teselas, misma cache, misma respiracion; un pelo de solape para que no se vean costuras. */
    function capas(g, cam, W, H, z, que, dx, dy) {
      var v = C.vista(cam, W, H, z), m = C.matriz(z), n = TESELA / RES;
      g.save();
      for (var i = Math.floor((v.x0 - dx) / TESELA); i <= Math.floor((v.x1 - dx) / TESELA); i++) {
        for (var j = Math.floor((v.y0 - dy) / TESELA); j <= Math.floor((v.y1 - dy) / TESELA); j++) {
          var p = C.aPantalla(cam, W, H, z, i * TESELA + dx, j * TESELA + dy), t = que(i, j);
          if (t) { g.setTransform(m[0] * RES, m[1] * RES, m[2] * RES, m[3] * RES, p[0], p[1]); g.drawImage(t, 0, 0, n + 0.6, n + 0.6); }
        }
      }
      g.restore();
    }
    return {
      /* Lo despejado manda en la niebla: si cambia su huella, la cache de niebla se vacia. */
      despejado: function (c) { var h = N.huella(c); if (h !== huella) { huella = h; nieblas = {}; nn = 0; } circ = c; },
      tierra: function (g, cam, W, H, z, d) { capas(g, cam, W, H, z, tesela, d ? d[0] : 0, d ? d[1] : 0); },
      niebla: function (g, cam, W, H, z) { capas(g, cam, W, H, z, bruma, 0, 0); }
    };
  }

  var AtlasMarFondo = { TESELA: TESELA, RES: RES, deriva: deriva, pintor: pintor };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMarFondo; }
  else { raiz.AtlasMarFondo = AtlasMarFondo; }
})(this);
