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
    army_tope: 60,
    /* Combate entre personas y patrullas (`arena.js`): rondas ENTERAS y todo PROVISIONAL. `ataque`
       pondera los stats de la tropa; `esquiva` va por mil por punto de sigilo, con tope; la armadura
       resta su mitad (`armadura_div`). El rating es un Elo entero LOCAL (no hay clasificacion
       central): `k` y `k_provisional` para las primeras `provisional_hasta` partidas. */
    combate: {
      rondas: 40, tropas_max: 6, armadura_div: 2,
      ataque: { base: 3, aura: 2, inercia: 1, profundidad: 1 },
      esquiva: { por_sigilo: 12, tope: 300 },
      rating_inicial: 1000, k: 32, k_provisional: 48, provisional_hasta: 10,
      /* Regla de ABANDONO (firmada por el Soberano, 2026-09-28): quien se compromete y no revela en
         estos ciclos de juego de quien espera, pierde el duelo por abandono y queda como deuda. */
      abandono_ciclos: 900
    },
    /* Los LUGARES NPC de la Arena: patrullas que salen de la semilla de su lugar, iguales en todos los
       aparatos, para probar el combate sin red. Mas hondo, mas duro. PROVISIONAL. */
    patrullas: [
      { id: 'arrecife', tc: 'tc1', n: 2 }, { id: 'algas', tc: 'tc1', n: 3 }, { id: 'ruinas', tc: 'tc2', n: 3 },
      { id: 'limo', tc: 'tc3', n: 3 }, { id: 'abismo', tc: 'tc4', n: 4 }, { id: 'nucleo', tc: 'tc4', n: 6 }
    ],
    /* MOVIMIENTO 5 - M17: FLUIDEZ PS1 - Tunables como datos (corpus ideas6oct-2:785)
       Todos los parametros de la capa PS1 en un solo objeto declarativo.
       Nivel 0 = calidad minima (PS1 puro), 1 = media, 2 = maxima (fluida).
       PROVISIONAL - ajustar segun bench en el Beelink. */
    fluidez: {
      /* Melt de batalla (MOVIMIENTO 1): persistencia canvas offscreen */
      melt_alfa: 0.93,
      melt_zoom: 1.0005,
      melt_rotacion: 0.0001,
      /* Color = Vida (MOVIMIENTO 2): Hue deriva a cobre, Lightness = escudo */
      vida_hue_base: 270,
      vida_hue_cobre: 30,
      escudo_lightness_base: 72,
      /* Respira al beat (MOVIMIENTO 3): pulso de brillo/grosor */
      pulso_brillo_max: 0.3,
      pulso_grosor_max: 1.5,
      /* Buffer PS1 (MOVIMIENTO 6): resoluciones por nivel */
      buffer_escala: [1.0, 0.5, 0.25],
      buffer_ancho_max: 320,
      /* Dither PS1 (MOVIMIENTO 6): patron 4x4 ordenado */
      dither_on: true,
      dither_patron: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 13, 5, 15, 7],
      /* Wobble PS1 (MOVIMIENTO 6): grid para temblor de vertices */
      paso_grid: [1.0, 2.0, 4.0],
      /* Niebla de Omen (MOVIMIENTO 7): vignette y niebla */
      niebla_alfa: 0.4,
      vignette_alfa: 0.3,
      /* Sprites chunky (MOVIMIENTO 8): NPCs a 1/4 escala */
      npc_chunk: true,
      npc_escala: 0.25,
      /* Estela (MOVIMIENTO 1-2): longitud maxima */
      estela_max: 8,
      /* Burbujas por calidad (MOVIMIENTO 4): mar respira */
      burbujas_por_calidad: [0, 2, 5]
    }
  };

  if (typeof module === 'object' && module.exports) { module.exports = VALORES; }
  else { raiz.AtlasValores = VALORES; }
})(this);
