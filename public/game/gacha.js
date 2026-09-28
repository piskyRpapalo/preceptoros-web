/* preceptoros.org · theGame v1.5 · el GACHA ARMONICO: Treasure Classes,
   afijos al estilo Diablo I/II y tropas hechas de ondas.

   PURO como el motor: ni DOM, ni red, ni reloj, ni azar del sistema. Todo lo
   que cae sale de una SEMILLA (64 hex). En la pestana la semilla es el
   sha256 de la firma Ed25519 de la invocacion; aqui solo se recibe ya hecha.

   NO ES UN VRF, y se dice. Ed25519 firma igual el mismo mensaje con la misma
   clave cuando firma la pestana, pero un firmante que maneje su clave fuera
   del navegador puede fabricar otras firmas validas y quedarse con la tirada
   que le guste. Vale para tu partida; para competir entre personas hace falta
   un VRF de verdad (ECVRF), y eso es NO_DATA hasta que se firme.

   UNA TROPA SON SUS ARMONICOS: [k, ax, ay, fase] enteros pequenos. La figura
   es x(t) = sum ax*cos(k t + f), y(t) = sum ay*sin(k t + f): circulos que giran
   dentro de circulos (Fourier). Cabe en menos de 200 B y no hay imagen.
   La rareza pone la SIMETRIA: frecuencias k = 1 + s*j dan una figura con s
   ejes de giro. */
(function (raiz) {
  'use strict';

  /* LOS VALORES VIVEN EN `valores.js` (estado PROVISIONAL): aqui solo la logica.
     En node se piden con require; en la pestana los carga la puerta antes. */
  var V = (typeof module === 'object' && module.exports) ? require('./valores.js') : raiz.AtlasValores;
  var TCS = V.tcs, PREFIJOS = V.prefijos, SUFIJOS = V.sufijos;
  var RAREZAS = ['normal', 'magico', 'raro', 'unico'];
  var STATS = ['vida', 'armadura', 'velocidad', 'sigilo', 'inercia', 'profundidad', 'aura'];
  var SIMETRIA = V.simetria, TERMINOS = V.terminos;

  /* Una variante de sfc32 sembrada con los 128 primeros bits de la semilla. Enteros de 32
     bits y nada mas: da lo mismo en cualquier navegador y en node. */
  function generador(semilla) {
    if (!/^[0-9a-f]{64}$/.test(semilla || '')) { throw new Error('semilla'); }
    var s = [0, 8, 16, 24].map(function (i) { return parseInt(semilla.slice(i, i + 8), 16) >>> 0; });
    var a = s[0], b = s[1], c = s[2], d = s[3];
    function sig() {
      var t = (a + b >>> 0) + d >>> 0;
      d = d + 1 >>> 0; a = b ^ b >>> 9; b = c + (c << 3) >>> 0;
      c = (c << 21 | c >>> 11); c = c + t >>> 0;
      return t;
    }
    for (var i = 0; i < 12; i++) { sig(); }
    return {
      mil: function () { return sig() % 1000; },
      entre: function (r) { return r[0] + sig() % (r[1] - r[0] + 1); },
      uno: function (lista) { return lista[sig() % lista.length]; }
    };
  }

  function suma(stats, mods, g) {
    Object.keys(mods).forEach(function (k) { stats[k] += g.entre(mods[k]); });
  }

  function armonicos(rareza, g) {
    var s = SIMETRIA[rareza], n = TERMINOS[rareza], out = [[1, 24, 24, 0]];
    for (var j = 1; j < n; j++) {
      var amp = Math.max(1, Math.floor(18 / (j + 1)) + g.entre([0, 3]));
      out.push([1 + s * j * (j % 2 ? -1 : 1), amp, amp + g.entre([-1, 1]), g.entre([0, 63])]);
    }
    return out;
  }

  /* LA TIRADA: TC + semilla -> tropa. Rareza por umbrales por mil; magico
     lleva prefijo O sufijo (a veces los dos), raro los dos y una tirada mas,
     unico es el Atlante Legendario con los dos afijos fijos. */
  function tirada(semilla, tc) {
    var T = TCS[tc];
    if (!T) { throw new Error('tc'); }
    var g = generador(semilla), q = g.mil(), c = T.calidad;
    var rareza = q < c[0] ? 'unico' : q < c[0] + c[1] ? 'raro' : q < c[0] + c[1] + c[2] ? 'magico' : 'normal';
    var nivel = Number(tc.slice(2));
    var stats = {};
    STATS.forEach(function (k) { stats[k] = 0; });
    var B = V.base;
    stats.vida = B.vida[0] * nivel + g.entre([0, B.vida[1]]);
    stats.armadura = B.armadura[0] * nivel + g.entre([0, B.armadura[1]]);
    stats.velocidad = B.velocidad[0] + g.entre([0, B.velocidad[1]]);
    var pre = null, suf = null;
    if (rareza === 'unico') { pre = 'atlante'; suf = 'abismo'; }
    else if (rareza === 'raro') { pre = g.uno(Object.keys(PREFIJOS)); suf = g.uno(Object.keys(SUFIJOS)); }
    else if (rareza === 'magico') {
      var cual = g.entre([0, 2]);
      if (cual !== 1) { pre = g.uno(Object.keys(PREFIJOS)); }
      if (cual !== 0) { suf = g.uno(Object.keys(SUFIJOS)); }
    }
    if (pre) { suma(stats, PREFIJOS[pre], g); }
    if (suf) { suma(stats, SUFIJOS[suf], g); }
    if (rareza === 'raro' || rareza === 'unico') { suma(stats, PREFIJOS[g.uno(Object.keys(PREFIJOS))], g); }
    if (rareza === 'unico') { STATS.forEach(function (k) { stats[k] += nivel; }); }
    return {
      esquema: 'atlas.tropa/1', tc: tc, base: T.base, rareza: rareza,
      prefijo: pre, sufijo: suf, stats: stats, armonicos: armonicos(rareza, g), semilla: semilla
    };
  }

  /* El huevo tambien es una onda: un ovalo con un latido. */
  var HUEVO = [[1, 16, 22, 0], [2, 0, 3, 16]];

  /* MORFISMO: mezcla lineal de dos figuras, termino a termino. Las listas se
     igualan con terminos de amplitud cero, asi que el huevo se abre en la
     tropa sin saltos. `t` va de 0 a 1. */
  function mezcla(a, b, t) {
    var n = Math.max(a.length, b.length), out = [];
    for (var i = 0; i < n; i++) {
      var x = a[i] || [b[i][0], 0, 0, b[i][3]], y = b[i] || [a[i][0], 0, 0, a[i][3]];
      var k = t < 0.5 ? x[0] : y[0];
      out.push([k, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t, x[3] + (y[3] - x[3]) * t]);
    }
    return out;
  }

  /* Un punto de la figura en el angulo `u` (radianes). Unidades: las de los
     armonicos (el ovalo del huevo mide 16 x 22). */
  function punto(arm, u) {
    var x = 0, y = 0;
    arm.forEach(function (h) {
      var f = h[0] * u + h[3] * Math.PI / 32;
      x += h[1] * Math.cos(f); y += h[2] * Math.sin(f);
    });
    return [x, y];
  }

  /* La huella compacta de la tropa, para medir que cabe en 200 B. */
  function compacta(tropa) {
    return JSON.stringify([tropa.tc, tropa.rareza, tropa.prefijo, tropa.sufijo, tropa.armonicos]);
  }

  /* EL CARACTER DE UNA ONDA, leido de sus armonicos (que salen de la semilla firmada): color,
     pulso y una tendencia. Es un SESGO que se dice, no un destino que se programa: la onda no
     juega distinto por su caracter. Sin azar: misma tropa, mismo caracter en cada carga. */
  function caracter(t) {
    var a = (t && t.armonicos) || [], s = 0, amp = 0;
    a.forEach(function (h) { s += Math.abs(h[0]); amp += Math.abs(h[1]) + Math.abs(h[2]); });
    return { color: s % 4, pulso: a.length > 3 ? 1 : 0, tendencia: (s + amp) % 4 };
  }

  var AtlasGacha = {
    ESTADO: V.estado, VERSION_VALORES: V.version, TCS: TCS, RAREZAS: RAREZAS, PREFIJOS: PREFIJOS, SUFIJOS: SUFIJOS, STATS: STATS, HUEVO: HUEVO,
    generador: generador, tirada: tirada, mezcla: mezcla, punto: punto, compacta: compacta, caracter: caracter
  };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasGacha; }
  else { raiz.AtlasGacha = AtlasGacha; }
})(this);
