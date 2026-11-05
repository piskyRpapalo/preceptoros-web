// Day and night palette (ODD isometric-colony, IC5). Pure: the colours are a function of the cycle tick t alone.
// Never a wall clock: no Date, no performance clock, no random numbers. The constants are the ones measured on the
// global map (public/game/global_map.js, NODE-MAPA): CYCLE 240, the measured night sky at t=0, the measured day sky at noon.
// Reduced motion is no cycle: the palette stays fixed at noon, and no sky frame changes.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var F = common ? require('./state_frames.js') : root.AtlasStateFrames;

  var CYCLE = 240;                        // ticks in one full day and night
  var MEDIODIA = CYCLE / 2;               // the day sky: tick 120
  var NOCHE = { cielo: [23, 19, 31], tinta: [236, 228, 210] };
  var DIA = { cielo: [244, 235, 208], tinta: [23, 19, 31] };

  function hex(c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
  // Integer lerp: k is 0..256, so every channel stays a whole number.
  function mezcla(a, b, k) { return a.map(function (v, j) { return Math.round(v + (b[j] - v) * k / 256); }); }

  // J3 · the day without edges (odd/JOYAS.md). The light follows (1 − cos(2π f/240))/2, not a triangle: dawn and dusk
  // slow down by themselves, like a real day, and noon and midnight have no sharp peak. The law is this table of 121 whole
  // values (ticks 0..120, mirrored after noon), pinned by its sha256 in atlas/puros/palette_cycle_cases.mjs: no cosine runs
  // while the world draws, and every engine reads the same light.
  var DIA_COS = Object.freeze([0,0,0,0,1,1,2,2,3,4,4,5,6,7,9,10,11,12,14,16,17,19,21,23,24,26,29,31,33,35,37,40,42,45,47,50,53,56,58,61,64,67,70,73,76,79,82,85,88,92,95,98,101,105,108,111,115,118,121,125,128,131,135,138,141,145,148,151,155,158,161,164,168,171,174,177,180,183,186,189,192,195,198,200,203,206,209,211,214,216,219,221,223,225,227,230,232,233,235,237,239,240,242,244,245,246,247,249,250,251,252,252,253,254,254,255,255,256,256,256,256]);
  // The day fraction at tick t: 0 at midnight, 256 at noon. A table lookup: whole numbers only.
  function fraccion(t) {
    var f = ((t % CYCLE) + CYCLE) % CYCLE;
    return DIA_COS[f < MEDIODIA ? f : CYCLE - f];
  }

  // palette(t, reducido) → the colours at tick t. Refuses a tick that is not a whole number: a fraction would be a clock.
  function palette(t, reducido) {
    if (!Number.isInteger(t)) { throw new Error('palette_cycle: t must be a whole tick, not ' + String(t)); }
    var tick = reducido === true ? MEDIODIA : t;
    var k = fraccion(tick);
    return Object.freeze({ t: tick, dia: k, cielo: hex(mezcla(NOCHE.cielo, DIA.cielo, k)), tinta: hex(mezcla(NOCHE.tinta, DIA.tinta, k)) });
  }

  // marcoCielo(t, reducido) → the sky as a state frame, under 1,024 bytes. Its sentence says the palette, not a clock.
  function marcoCielo(t, reducido) {
    var p = palette(t, reducido);
    var frase = 'the sky at tick ' + p.t + ': ' + p.cielo + ' · day ' + p.dia + ' of 256' + (reducido === true ? ' · reduced motion, no cycle' : '');
    var frame = {
      v: 'preceptoros.acho/1', id: 'sky', t: p.t, cv: [320, 96],
      atoms: [{ k: 'sky', r: frase, i: [] }],
      bands: ['paper', 'ink', 'cyan'],
      change: [frase],
      sound: 'NO_DATA: the sky declares no waves; nothing is invented',
      soundCause: 'a palette has no measured value to sound'
    };
    if (F.valida(frame).length) { throw new Error('palette_cycle: sky frame breaks the frame law'); }
    return frame;
  }

  // cambios(desde, hasta, reducido) → the sky frames of the ticks where the palette changes between two ticks.
  // Reduced motion never changes: no frames.
  function cambios(desde, hasta, reducido) {
    if (reducido === true) { return []; }
    var a = palette(desde).dia, out = [];
    var paso = hasta >= desde ? 1 : -1;
    for (var t = desde + paso; paso > 0 ? t <= hasta : t >= hasta; t += paso) {
      if (palette(t).dia !== a) { out.push(marcoCielo(t)); a = palette(t).dia; }
    }
    return out;
  }

  var AtlasPaletteCycle = { CYCLE: CYCLE, MEDIODIA: MEDIODIA, DIA_COS: DIA_COS, NOCHE: NOCHE, DIA: DIA, fraccion: fraccion, palette: palette, marcoCielo: marcoCielo, cambios: cambios };
  if (common) { module.exports = AtlasPaletteCycle; }
  else { root.AtlasPaletteCycle = AtlasPaletteCycle; }
})(this);
