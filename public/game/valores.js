/* preceptoros.org · theGame · los VALORES, separados de la logica.

   ESTADO: PROVISIONAL. Todo numero de aqui es provisional y se dice en pantalla
   (Soberano, 2026-09-27: «no te preocupes por recursos, habilidades ni
   niveles; haz la estructura; los valores y los LoRAs los adherimos
   despues»). La logica (`gacha.js`, `core.js`) no lleva ni una cifra de
   equilibrio: las lee de aqui. Cambiar el juego es cambiar ESTE fichero, y
   el dia que haya valores de verdad se cambia `estado` y se versiona.

   SOLO DATOS. Ni funciones ni efectos: un paquete de valores es JSON
   declarativo, nunca codigo (doctrina de workflows de terceros). Por eso el
   dia de los mods de la comunidad, un mod sera un objeto con esta forma. */
(function (raiz) {
  'use strict';

  var VALORES = {
    estado: 'provisional',
    version: 'provisional-2026-09-27.1',
    /* Treasure Classes. Coste en Cobre y Luz: medido con el piloto base, la
       Biomasa nunca pasa de 2. `incuba` en ciclos de juego; `calidad` por mil
       (unico, raro, magico). */
    tcs: {
      tc1: { coste: { cobre: 50, luz: 0 }, incuba: 20, calidad: [5, 40, 250], base: 'pez' },
      tc2: { coste: { cobre: 200, luz: 100 }, incuba: 40, calidad: [10, 70, 320], base: 'centinela' },
      tc3: { coste: { cobre: 600, luz: 300 }, incuba: 60, calidad: [20, 110, 380], base: 'leviatan' },
      tc4: { coste: { cobre: 1500, luz: 500 }, incuba: 90, calidad: [45, 160, 420], base: 'heraldo' }
    },
    prefijos: {
      atlante: { vida: [4, 9] }, cuprico: { armadura: [3, 7] },
      termico: { inercia: [3, 8] }, solar: { vida: [2, 4], armadura: [1, 3] }
    },
    sufijos: {
      abismo: { profundidad: [2, 6] }, sigilo: { sigilo: [3, 8] },
      velocidad: { velocidad: [3, 7] }, algoritmo: { aura: [2, 5] }
    },
    /* Base de una tropa por nivel de TC: vida = vida[0]*nivel + [0..vida[1]]. */
    base: { vida: [10, 4], armadura: [2, 2], velocidad: [3, 3] },
    simetria: { normal: 2, magico: 3, raro: 5, unico: 7 },
    terminos: { normal: 3, magico: 4, raro: 5, unico: 6 },
    /* Recetas de sonido FM: Hz, segundos, indice en Hz. */
    sonidos: {
      pop: { f: 660, m: 2, indice: 120, dur: 0.12, gan: 0.18 },
      huevo: { f: 220, m: 0.5, indice: 30, dur: 0.5, gan: 0.12 },
      eclosion: { f: 440, m: 3, indice: 260, dur: 0.6, gan: 0.2 },
      adopcion: { f: 523, m: 1.5, indice: 80, dur: 0.45, gan: 0.18 }
    },
    army_tope: 60
  };

  if (typeof module === 'object' && module.exports) { module.exports = VALORES; }
  else { raiz.AtlasValores = VALORES; }
})(this);
