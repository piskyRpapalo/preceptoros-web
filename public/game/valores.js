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
    /* M17-bis 3 (firma F-A, EN_CURSO_hasta_escucha del Soberano): ADSR + FM de tres senos (portadora y
       DOS moduladoras, ambas conectadas: la joya del mockup no las conectaba). `modo` decide; 'fm2' es el
       sonido de siempre y sigue por defecto hasta la escucha A/B. adsr = [ataque s, caida s, sostenido
       0-1, relajacion s]; m2 = moduladora2 / portadora; indice2 = fraccion del indice. PROVISIONALES:
       los fija el oido del Soberano, que es la medida que falta. */
    sintesis: { modo: 'fm2', adsr: [0.005, 0.03, 0.55, 0.06], m2: 0.5, indice2: 0.5,
      /* M17-bis 4 (firma F-A): VIBRATO POR URGENCIA DEL SELLO. Lo que espera firma vibra; lo firmado
         suena quieto. eclosion = la tropa nacida espera tu firma para adoptarla (ui.js:175);
         adopcion = ya firmada (ui.js:191). vibrato_hz y vibrato_prof (fraccion de la portadora) son
         PROVISIONALES: se fijan en la misma escucha que el movimiento 3. */
      sello: { eclosion: 'PROPUESTA_PENDIENTE_FIRMA', adopcion: 'FIRMADO' },
      urgencia: { PROPUESTA_PENDIENTE_FIRMA: 1, FIRMADO: 0 },
      vibrato_hz: 6, vibrato_prof: 0.02 },
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
      /* M17-bis 2: L va de min (sin escudo) a base (escudo_ref); escudo_ref = armadura maxima medida. */
      escudo_lightness_min: 40,
      escudo_ref: 24,
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
    },
    /* M17-bis 5 (firma F-A, 2026-10-10): LA TABLA DE DERIVADOS SEMANTICOS. Cada parametro visual y
       sonoro con [formula, de que sale, clase, quien lo lee]. Clases: ESTADO (sale del estado del
       juego), CALIDAD (proyeccion por el medidor de fps; jamas decide), CONSTANTE (declarada) y
       SIN_LECTOR (declarado y nadie lo lee: deuda visible, no decoracion escondida). La prueba exige
       una fila por cada clave de `fluidez` y de las recetas, y que el lector nombrado la lea de verdad. */
    semantica: {
      melt_alfa: ['cuadro previo * alfa', 'calidad', 'CALIDAD', 'wave_render.js'],
      melt_zoom: ['escala del cuadro previo', 'calidad', 'CALIDAD', 'wave_render.js'],
      melt_rotacion: ['giro del cuadro previo', 'calidad', 'CALIDAD', 'wave_render.js'],
      vida_hue_base: ['H = base + (cobre - base) * (1 - vida)', 'vida restante', 'ESTADO', 'wave_render.js'],
      vida_hue_cobre: ['H con vida 0', 'vida restante', 'ESTADO', 'wave_render.js'],
      escudo_lightness_base: ['L = min + (base - min) * escudo', 'armadura', 'ESTADO', 'wave_render.js'],
      escudo_lightness_min: ['L sin escudo', 'armadura', 'ESTADO', 'wave_render.js'],
      escudo_ref: ['escudo = armadura / ref (ref = maximo medido)', 'armadura', 'ESTADO', 'wave_render.js'],
      pulso_brillo_max: ['max * rampa de ganancia del pop', 'golpe que suena', 'ESTADO', 'wave_render.js'],
      pulso_grosor_max: ['-', '-', 'SIN_LECTOR', null],
      buffer_escala: ['-', '-', 'SIN_LECTOR', null],
      buffer_ancho_max: ['-', '-', 'SIN_LECTOR', null],
      dither_on: ['tramado 4x4', 'calidad', 'CALIDAD', 'wave_render.js'],
      dither_patron: ['umbral por pixel (patron)', 'calidad', 'CALIDAD', 'wave_render.js'],
      paso_grid: ['vertice redondeado a la rejilla', 'calidad', 'CALIDAD', 'wave_render.js'],
      niebla_alfa: ['-', '-', 'SIN_LECTOR', null],
      vignette_alfa: ['oscurecido de bordes', 'lo no explorado', 'ESTADO', 'mar.js'],
      npc_chunk: ['NPC a resolucion baja', 'calidad', 'CALIDAD', 'mar.js'],
      npc_escala: ['-', '-', 'SIN_LECTOR', null],
      estela_max: ['-', '-', 'SIN_LECTOR', null],
      burbujas_por_calidad: ['-', '-', 'SIN_LECTOR', null],
      f: ['portadora = f * (1 - 0,25 * calor)', 'evento (golpe/cae/gana/pierde) y calor del Nucleo', 'ESTADO', 'core.js'],
      m: ['moduladora = f * m', 'evento', 'ESTADO', 'core.js'],
      indice: ['indice * (1 + 2 * calor)', 'calor del Nucleo', 'ESTADO', 'core.js'],
      dur: ['duracion; tambien la del pulso visual', 'evento', 'ESTADO', 'core.js'],
      gan: ['ganancia inicial de la rampa (sonido y pulso)', 'evento', 'ESTADO', 'core.js'],
      modo: ['fm2 (siempre) o fm3_adsr (EN_CURSO_hasta_escucha)', 'decision del Soberano', 'CONSTANTE', 'core.js'],
      adsr: ['envolvente del sonido y del pulso', 'evento', 'ESTADO', 'core.js'],
      m2: ['moduladora2 = portadora * m2', 'evento', 'ESTADO', 'core.js'],
      indice2: ['indice2 = indice * indice2', 'calor del Nucleo', 'ESTADO', 'core.js'],
      sello: ['sello del evento sonoro', 'que espera firma / que esta firmado', 'ESTADO', 'core.js'],
      urgencia: ['urgencia del sello (0 quieto, 1 vibra)', 'sello', 'ESTADO', 'core.js'],
      vibrato_hz: ['frecuencia del vibrato', 'sello', 'ESTADO', 'core.js'],
      vibrato_prof: ['profundidad = portadora * prof * urgencia', 'sello', 'ESTADO', 'core.js']
    }
  };

  if (typeof module === 'object' && module.exports) { module.exports = VALORES; }
  else { raiz.AtlasValores = VALORES; }
})(this);
