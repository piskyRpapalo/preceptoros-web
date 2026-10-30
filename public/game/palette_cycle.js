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

  // The day fraction at tick t: 0 at midnight, 256 at noon. Integer arithmetic only.
  function fraccion(t) {
    var f = ((t % CYCLE) + CYCLE) % CYCLE;
    var tri = f < MEDIODIA ? f : CYCLE - f;
    return Math.round(tri * 256 / MEDIODIA);
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
      v: 'preceptoros.bubble/1', id: 'sky', t: p.t, cv: [320, 96],
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

  var AtlasPaletteCycle = { CYCLE: CYCLE, MEDIODIA: MEDIODIA, NOCHE: NOCHE, DIA: DIA, fraccion: fraccion, palette: palette, marcoCielo: marcoCielo, cambios: cambios };
  if (common) { module.exports = AtlasPaletteCycle; }
  else { root.AtlasPaletteCycle = AtlasPaletteCycle; }
})(this);
