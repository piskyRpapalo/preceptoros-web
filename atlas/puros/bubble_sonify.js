// NORTE 8 · MANDATO 3 · núcleo puro de la sonificación de burbujas (rebanada 1 de 2).
// Un fotograma de burbuja (preceptoros.bubble/1) se convierte en una lista de notas deterministas. La escala es
// la de public/game/core.js (PENTA_V y el portador de 110 Hz, líneas 55-61): este módulo NO la inventa, y el test
// de deriva comprueba que sigue siendo la misma. Sin Math.random, sin Date, sin red. Vive fuera de public/ hasta
// que la rebanada 2 lo cablee en la página (con su sello SW): así no aparece como huérfano en el árbol servido.
(function (raiz) {
  'use strict';

  // Mismas constantes que core.js: PENTA_V = [0, 2, 4, 7, 9] y el portador 110 Hz.
  var PORTADOR_HZ = 110;
  var PENTA_V = [0, 2, 4, 7, 9];

  // Un grado de la escala: 0 es el portador; 5 es la misma nota una octava arriba (12 semitonos).
  function hzDeGrado(g) {
    return Math.round(PORTADOR_HZ * Math.pow(2, (PENTA_V[g % 5] + 12 * Math.floor(g / 5)) / 12));
  }

  // Cada clase de átomo tiene un grado fijo: el cuerpo grave, la ola en medio, el título agudo.
  var GRADO_POR_CLASE = { bubble: 0, sea: 2, title: 4 };
  var PASO_MS = 180;   // separación entre átomos consecutivos
  var DUR_MS = 150;    // duración de cada nota

  // sonifica(fotograma) → { ok: true, notas: [{ at_ms, dur_ms, hz, clase }], total_ms }
  //                     | { ok: false, causa } (fallo cerrado: nada de sonido inventado)
  function sonifica(marco) {
    var atomos = marco && Array.isArray(marco.atoms) ? marco.atoms : null;
    if (!atomos || !atomos.length) { return { ok: false, causa: 'sin átomos: el fotograma no tiene nada que sonar' }; }
    var notas = [];
    for (var i = 0; i < atomos.length; i++) {
      var k = atomos[i] && atomos[i].k;
      if (!Object.prototype.hasOwnProperty.call(GRADO_POR_CLASE, k)) {
        return { ok: false, causa: 'átomo sin voz: clase "' + k + '" no tiene grado' };
      }
      notas.push({ at_ms: i * PASO_MS, dur_ms: DUR_MS, hz: hzDeGrado(GRADO_POR_CLASE[k]), clase: k });
    }
    return { ok: true, notas: notas, total_ms: (atomos.length - 1) * PASO_MS + DUR_MS };
  }

  var AtlasSonificaBurbuja = {
    PORTADOR_HZ: PORTADOR_HZ, PENTA_V: PENTA_V, GRADO_POR_CLASE: GRADO_POR_CLASE,
    PASO_MS: PASO_MS, DUR_MS: DUR_MS, hzDeGrado: hzDeGrado, sonifica: sonifica
  };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSonificaBurbuja; }
  else { raiz.AtlasSonificaBurbuja = AtlasSonificaBurbuja; }
})(this);
