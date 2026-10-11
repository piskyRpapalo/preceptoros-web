/* preceptoros.org · theGame · EL CANGREJO (C5/J1, firmado en el plan de ronda 2026-10-11).

   QUIEN ES. Todos juegan como cangrejos (sesion45:403): sin cuenta, CANGREJO DE MAR; con nodo, CORAL.
   Es tu presencia en el mundo, no tu identidad: no lleva nombre, ni huella del aparato, ni nada que
   salga de la pestana (GDPR art. 25, proteccion por defecto). Nace al abrir el juego, crece mientras
   juegas y muere al salir.

   UN PERSONAJE ES SU ONDA (escena.js). El cangrejo es una serie de Fourier [k, ax, ay, fase]: el
   caparazon es el armonico 1, el borde festoneado el 6 y las pinzas el 2; se rellena con el color de su
   clase (el sprite aditivo a 1/4 lo quemaba a blanco: medido en captura). Andar hacia el otro lado es el
   ESPEJO: la misma onda con la x negada, sin un byte nuevo (J10/J11).

   DATO, NO DECORACION (ideas6oct:1705):
   - TAMANO = tu army desplegada (cada tropa firmada lo agranda; tope medido para que quepa en la casa);
   - COLOR = cangrejo de mar (sin nodo) o coral (con nodo): una clase, no un adorno;
   - BRILLO = frescura del latido del nodo; sin nodo no hay latido y el brillo es NO_DATA (apagado).
   Los colores-senal del juego (sellos, vida) no se tocan: el cangrejo usa los suyos.

   PASEO DETERMINISTA. La posicion sale de (semilla, ciclo de juego) con el generador del canon: misma
   semilla, mismo paseo, en cualquier aparato. Lo unico que usa el reloj de la pantalla es el tramo
   ENTRE dos ciclos y el vaiven de las patas: proyeccion, no decision. NO toca el motor ni el combate:
   no conoce arena.js ni atlas-motor.js (un caso lo comprueba). Movimiento reducido: quieto. */
(function (raiz) {
  'use strict';
  var K = (typeof module === 'object' && module.exports) ? require('./canon.js') : raiz.AtlasCanon;
  var TRAMO = 12;                       // ciclos que tarda en ir de un punto al siguiente
  var BORDE = [0.06, 0.94];             // fraccion del ancho por la que anda
  var CLASES = { mar: [196, 62, 64], coral: [12, 82, 66] };

  /* El punto k del paseo: una fraccion del ancho, sacada del canon (RECHAZO: sin sesgo). */
  function punto(semilla, k) {
    var g = K.generador(K.sha('atlas.cangrejo/1:' + semilla + ':' + k));
    return BORDE[0] + (BORDE[1] - BORDE[0]) * g.uniforme(10000) / 10000;
  }
  /* Donde esta en el ciclo c (entero) mas una fraccion f de ciclo (0..1, proyeccion). */
  function paseo(semilla, ciclo, f) {
    var c = Math.max(0, Math.floor(ciclo || 0)), k = Math.floor(c / TRAMO);
    var a = punto(semilla, k), b = punto(semilla, k + 1);
    var u = ((c % TRAMO) + Math.max(0, Math.min(1, f || 0))) / TRAMO, s = u * u * (3 - 2 * u);
    return { x: a + (b - a) * s, dir: b >= a ? 1 : -1, tramo: k };
  }
  /* La forma: tamano por army, clase por nodo, brillo por latido (null = NO_DATA). */
  function forma(army, nodo, latido) {
    var n = Math.max(0, Math.floor(army || 0));
    return { escala: 1 + Math.min(1.2, n * 0.12), clase: nodo ? 'coral' : 'mar', tono: CLASES[nodo ? 'coral' : 'mar'],
             brillo: nodo && latido != null ? Math.max(0, Math.min(1, latido)) : null };
  }
  /* La onda del cangrejo: caparazon ancho (k=1) + seis patas (k=6) + pinzas (k=2, delante). */
  function onda(escala) {
    var e = Math.round(10 * escala);
    return [[1, 40 + e, 26 + e, 0], [6, 7, 7, 0], [2, 9, 4, 1]];
  }
  /* Huella de un paseo: lo que el oraculo compara entre aparatos (sha de las x redondeadas). */
  function huellaPaseo(semilla, ciclos) {
    var xs = [];
    for (var c = 0; c < ciclos; c++) { xs.push(Math.round(paseo(semilla, c, 0).x * 1e6)); }
    return K.sha(JSON.stringify(xs));
  }

  /* Dibujar (solo en la pestana). El contorno sale de SU onda (G.punto, el mismo trazo de la gacha),
     relleno con el color de su clase: legible a pleno sol, sin el brillo aditivo que lo quemaba a blanco.
     g: contexto; x, suelo: pixeles; r: radio base; o: { forma, t, dir, dpr, quieto }. */
  function pinta(g, x, suelo, r, o) {
    var G = raiz.AtlasGacha;
    if (!G || !G.punto) { return; }
    var fo = o.forma, rr = Math.max(6, r * fo.escala), dpr = o.dpr || 1, arm = onda(fo.escala), n = 72, lim = 0;
    arm.forEach(function (h) { lim += Math.max(Math.abs(h[1]), Math.abs(h[2])); });
    var k = rr / lim, paso = o.quieto ? 0 : Math.sin((o.t || 0) * 0.012) * rr * 0.05, c = fo.tono, cy = suelo - rr * 0.55 + paso;
    g.save();
    g.translate(x, cy);
    if (o.dir < 0) { g.scale(-1, 1); }   // EL ESPEJO: la misma onda, x negada
    if (fo.brillo) { g.shadowColor = 'hsla(' + c[0] + ' 90% 70% / ' + fo.brillo + ')'; g.shadowBlur = 16 * dpr * fo.brillo; }
    g.beginPath();
    /* solo la media onda de arriba, cerrada en la base: plegar la de abajo anulaba el relleno */
    for (var i = 0; i <= n; i++) { var p = G.punto(arm, i / n * Math.PI); g[i ? 'lineTo' : 'moveTo'](p[0] * k, -Math.abs(p[1]) * k * 0.9); }
    g.closePath();
    g.fillStyle = 'hsl(' + c[0] + ' ' + c[1] + '% ' + (c[2] - 8) + '%)'; g.fill();
    g.shadowBlur = 0;
    g.lineWidth = 2 * dpr; g.strokeStyle = 'hsl(' + c[0] + ' ' + c[1] + '% ' + Math.min(92, c[2] + 18) + '%)'; g.stroke();
    /* patas: seis, del armonico 6, que bajan al suelo y se alternan al andar */
    g.lineWidth = 1.6 * dpr;
    for (var l = 0; l < 6; l++) {
      var lx = (l - 2.5) / 2.5 * rr * 0.85, alt = o.quieto ? 0 : Math.sin((o.t || 0) * 0.02 + l * 1.7) * rr * 0.08;
      g.beginPath(); g.moveTo(lx * 0.8, 0); g.lineTo(lx, rr * 0.5 + alt); g.stroke();
    }
    /* ojos en antenas, delante */
    g.fillStyle = '#f2f4f8';
    [[0.32, -0.95], [0.58, -0.88]].forEach(function (e) {
      g.beginPath(); g.moveTo(e[0] * rr, -0.55 * rr); g.lineTo(e[0] * rr, e[1] * rr); g.stroke();
      g.beginPath(); g.arc(e[0] * rr, e[1] * rr, 2.6 * dpr, 0, 2 * Math.PI); g.fill();
    });
    g.restore();
  }

  var AtlasCangrejo = { TRAMO: TRAMO, paseo: paseo, forma: forma, onda: onda, huellaPaseo: huellaPaseo, pinta: pinta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCangrejo; }
  else { raiz.AtlasCangrejo = AtlasCangrejo; }
})(this);
