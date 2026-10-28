// NORTE 8 · MANDATO 3 · sonido NATIVO del fotograma de burbuja (rebanada 1 de 2, rehecha).
// El audio vive dentro del lenguaje: una onda (`wave`) o un `blob` lleva sus armónicos `h: [[k, ax, ay, ph], …]`,
// el mismo formato que `armonicos` de las tropas. La receta de sonido es la de public/game/core.js (`vozDe`):
// el 2.º armónico fija el grado de la escala (portador 110 Hz, PENTA_V) y el resto fija la modulación.
// El campo `sound` del fotograma dice si suena: `ok`, o `NO_DATA: causa` (lo que no suena, lo dice con su causa).
// Sin Math.random, sin reloj, sin red. Vive fuera de public/ hasta la rebanada 2 (página + sello SW).
(function (raiz) {
  'use strict';

  var PENTA_V = [0, 2, 4, 7, 9];  // la misma escala que core.js (línea 55)
  var PASO_MS = 180;              // separación entre voces consecutivas

  // Receta de sonido de una tabla de armónicos. Es vozDe de core.js, sin el objeto de estado del juego.
  function receta(armonicos) {
    var a = Array.isArray(armonicos) ? armonicos : [], det = 0;
    if (!a.length) { return null; }
    var n = a.length > 1 ? Math.max(2, Math.abs(a[1][0] - 1)) : 2;
    var a1 = a.length > 1 ? Math.abs(a[1][1]) : 0;
    var g = Math.max(0, n - 3);
    a.slice(2).forEach(function (h) { det += Math.abs(h[1]) + Math.abs(h[2]); });
    var f = Math.round(110 * Math.pow(2, (PENTA_V[g % 5] + 12 * Math.floor(g / 5)) / 12));
    var r = { tipo: 'onda', portadora: f, moduladora: Math.round(f * (8 + a1) / 8),
              indice: Math.min(400, 20 + a1 * 4 + det * 6), dur: 0.5, gan: 0.07 };
    if (n > 12) { r.moduladora2 = Math.round(f * 7 / 5); r.indice2 = Math.round(r.indice / 2); }
    return r;
  }

  // Primitivos que llevan armónicos propios.
  var CON_ARMONICOS = { wave: true, blob: true };

  // sonifica(fotograma) → { ok: true, voces: [{ at_ms, primitivo, receta }] }
  //                     | { ok: false, causa } (fallo cerrado: nada de sonido inventado)
  function sonifica(marco) {
    if (!marco || typeof marco !== 'object') { return { ok: false, causa: 'NO_DATA: el fotograma no existe' }; }
    if (typeof marco.sound === 'string' && marco.sound.indexOf('NO_DATA') === 0) {
      return { ok: false, causa: marco.sound.replace(/^NO_DATA:?\s*/, '') || marco.soundCause || 'NO_DATA sin causa' };
    }
    var voces = [], atomos = Array.isArray(marco.atoms) ? marco.atoms : [];
    atomos.forEach(function (at) {
      (at && Array.isArray(at.i) ? at.i : []).forEach(function (it) {
        if (it && CON_ARMONICOS[it.o] === true && Array.isArray(it.h) && it.h.length) {
          voces.push({ at_ms: voces.length * PASO_MS, primitivo: it.o, receta: receta(it.h) });
        }
      });
    });
    if (!voces.length) { return { ok: false, causa: 'NO_DATA: ninguna onda ni blob con armónicos en el fotograma' }; }
    return { ok: true, voces: voces };
  }

  var AtlasSonificaBurbuja = { PENTA_V: PENTA_V, PASO_MS: PASO_MS, receta: receta, sonifica: sonifica };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSonificaBurbuja; }
  else { raiz.AtlasSonificaBurbuja = AtlasSonificaBurbuja; }
})(this);
