/* preceptoros.org · theGame · EL MAR DE FONDO (J6, plan de ronda «el refresco», 2026-10-11).

   «J6 PRIMERO: el mar de fondo en la portada» (Soberano). Antes de que pulses nada, la portada ya es el
   mar: el mismo lecho y la misma niebla que el mapa global, quietos en tu casa (o en Hexelion), detras
   de todo. SENSACION (el mar como placer de los sentidos) y DESCUBRIMIENTO (la niebla es lo que aun no
   se ha medido: se ve desde el primer segundo).

   UNA SOLA FUENTE DE TESELAS. Esto NO es un gemelo de `mar.js`: es su pintor de teselas, sacado de el
   (T0-D, sin torres paralelas). El mapa y el fondo piden aqui el mismo terreno y la misma niebla.

   LA RESPIRACION, ARREGLADA. La deriva M4 se horneaba DENTRO de cada tesela con el instante en que se
   generaba: dos teselas hechas en momentos distintos quedaban desplazadas (costuras) y nada respiraba.
   Ahora la deriva es UN desplazamiento global del terreno por cuadro: las teselas no cambian, el mar si.

   Puro de azar y de red: ruido entero (escena.js), niebla de lo MEDIDO (fog_of_war.js). El reloj de la
   pantalla solo mueve la deriva (proyeccion, no decision). Movimiento reducido: un cuadro quieto. */
(function (raiz) {
  'use strict';

  var TIERRA = [[5, 8, 18], [8, 16, 34], [12, 28, 52], [16, 42, 68], [22, 62, 84], [40, 92, 100], [96, 118, 104]];
  var NIEBLA = [null, [64, 72, 96]], TESELA = 240, RES = 4;

  function quieto() { return raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches; }

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
    /* Pega las teselas visibles; (dx, dy) desplaza el terreno en unidades de mundo (la deriva). */
    function capas(g, cam, W, H, z, que, dx, dy) {
      var v = C.vista(cam, W, H, z), lado = TESELA * z;
      for (var i = Math.floor((v.x0 - dx) / TESELA); i <= Math.floor((v.x1 - dx) / TESELA); i++) {
        for (var j = Math.floor((v.y0 - dy) / TESELA); j <= Math.floor((v.y1 - dy) / TESELA); j++) {
          var p = C.aPantalla(cam, W, H, z, i * TESELA + dx, j * TESELA + dy), t = que(i, j);
          if (t) { g.drawImage(t, Math.floor(p[0]), Math.floor(p[1]), Math.ceil(lado) + 1, Math.ceil(lado) + 1); }
        }
      }
    }
    return {
      /* Lo despejado manda en la niebla: si cambia su huella, la cache de niebla se vacia. */
      despejado: function (c) { var h = N.huella(c); if (h !== huella) { huella = h; nieblas = {}; nn = 0; } circ = c; },
      tierra: function (g, cam, W, H, z, d) { capas(g, cam, W, H, z, tesela, d ? d[0] : 0, d ? d[1] : 0); },
      niebla: function (g, cam, W, H, z) { capas(g, cam, W, H, z, bruma, 0, 0); }
    };
  }

  /* EL FONDO DE LA PORTADA. `f`: { pub() -> clave publica o null }. Pinta a 1x (es fondo: el pixel gordo
     es el estilo y ahorra GPU), a ~20 cuadros por segundo, y se para si la pestana no se ve. */
  function monta(lienzo, f) {
    var K = raiz.AtlasCanon, N = raiz.AtlasNiebla, C = raiz.AtlasCamara, Ce = raiz.AtlasNodosCedulas;
    var P = pintor(), raf = 0, ultimo = -1e9, cam = null, centro = null, hecho = false;
    function enfoca() {
      var pub = f && f.pub ? f.pub() : null, casa = N.sitioCasa(pub, K.sha);
      P.despejado(N.despejado({ pub: pub, sha: K.sha, nodos: Ce ? Ce.nodos : [], lugares: [] }));
      centro = casa || N.HEX;
      cam = C.crea(centro);
    }
    function cuadro(ts) {
      raf = raiz.requestAnimationFrame(cuadro);
      var q = quieto();
      if (raiz.document.hidden || (q && hecho) || ts - ultimo < 48) { return; }
      ultimo = ts;
      var w = lienzo.clientWidth || raiz.innerWidth, h = lienzo.clientHeight || raiz.innerHeight;
      if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; hecho = false; }
      var g = lienzo.getContext('2d'), z = w / 820 * (w < 600 ? 1.15 : 1);
      if (!cam || (centro === N.HEX && f && f.pub && f.pub())) { enfoca(); }
      g.imageSmoothingEnabled = false;
      g.fillStyle = 'rgb(5,8,18)'; g.fillRect(0, 0, w, h);
      P.tierra(g, cam, w, h, z, q ? null : deriva(ts));
      P.niebla(g, cam, w, h, z);
      hecho = true;
    }
    raiz.addEventListener('resize', function () { hecho = false; });
    raf = raiz.requestAnimationFrame(cuadro);
    return { para: function () { raiz.cancelAnimationFrame(raf); }, camara: function () { return cam; } };
  }

  /* En la portada (`#juego-panel`), una vez: el lienzo va el PRIMERO del body, detras de todo; es
     decorado (aria-hidden, sin puntero). La camara va a tu casa en cuanto se sabe tu clave. */
  function portada() {
    var d = raiz.document, I = raiz.Identity, pub = null;
    if (!d.getElementById('juego-panel') || d.querySelector('.mar-fondo')) { return null; }
    var c = d.createElement('canvas'); c.className = 'mar-fondo'; c.setAttribute('aria-hidden', 'true');
    d.body.insertBefore(c, d.body.firstChild);
    if (I && I.quien && I.quien()) { I.publica().then(function (k) { pub = k; }, function () {}); }
    return monta(c, { pub: function () { return pub; } });
  }

  var AtlasMarFondo = { TESELA: TESELA, RES: RES, deriva: deriva, pintor: pintor, monta: monta, portada: portada };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMarFondo; }
  else { raiz.AtlasMarFondo = AtlasMarFondo; }
})(this);
