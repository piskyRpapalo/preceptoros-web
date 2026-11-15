(function (raiz) {
  'use strict';
  // Radio del Estado · fase 1 (Desk 2026-10-28): el sonido sale del MISMO frame que la forma y la tabla.
  // Ecuaciones:
  //   tick t = 1/60 s · muestras por tick = 150 (SR = 9000) · sin azar ni reloj.
  //   pulso(sello, t) = pulso_hz > 0 ? 0.5 + 0.5·sin(2π·pulso_hz·t) : 1   (pulso_hz fisico, en Hz; la MISMA f(t) para audio y pulso)
  //   NO_DATA (y todo sello sin visual) = silencio: ni muestras ni pulso. Un sello desconocido no suena.
  // The family of the seals (2026-11-16, the Sovereign's «each seal its own musical character»). The old melody read
  // the digits of round(|a|·1000): every seal began «1000» (the shared fundamental a₁ = 1), so the radio's two-note cue
  // sounded the same for all six. Now a seal sings its OWN form, the harmonics its contour is drawn from:
  //   notes   every term with k ≥ 2 is one note at k × 220 Hz — the harmonic series itself (2 octave, 3 fifth above,
  //           5 major third, 7 the sour seventh no scale owns). k = 1 is the ground all seals share: it is not sung.
  //   order   by phase φ, the moment in the cycle where that harmonic peaks (ties by k): the form says when each speaks.
  //   timbre  the note's own weight a_k adds its octave (sin x + a·sin 2x, peak kept at 1): a strong harmonic is richer.
  //   pulse   unchanged: the same f(t) as the seal's pulse, so ear and pulse stay in sync.
  // Measured: the two-note cue went from 1 distinct melody in 6 seals to 6 in 6. canto(seal) says the same tune in
  // words (eye, reader); huella(seal) gives its marks for a small drawn staff (eye). Same terms, three readers.
  var SR = 9000, TICK_HZ = 60, MUESTRAS_TICK = SR / TICK_HZ;     // 150
  var NOTA_TICKS = 15;                                           // 0.25 s por nota
  var BASE_HZ = 220;

  var SEM = (typeof module === 'object' && module.exports) ? require('./semantic_table.js') : raiz.AtlasSemantica;

  // Pulso: frecuencia FISICA (DERIVADOS.pulso_hz de semantic_table.js, en Hz). Sello sin fisica -> 0 (silencio).
  function pulso(sello, t) {
    var d = SEM.de(sello);
    if (!d) { return 0; }
    if (!(d.pulso_hz > 0)) { return 1; }
    return 0.5 + 0.5 * Math.sin(2 * Math.PI * d.pulso_hz * t);
  }

  // Pure: notas(terminos) → the seal's tune: one note per harmonic k ≥ 2, in the order of its phase.
  function notas(terminos) {
    return (terminos || []).filter(function (t) { return t[0] >= 2 && t[1] > 0; })
      .map(function (t) { return { k: t[0], idx: t[0], hz: BASE_HZ * t[0], a: Math.min(1, t[1]), phi: ((t[2] % TAU) + TAU) % TAU }; })
      .sort(function (x, y) { return x.phi - y.phi || x.k - y.k; });
  }
  var TAU = 2 * Math.PI;
  // peak of sin x + a·sin 2x over one cycle (fine grid, closed and deterministic)
  function pico(a) { var m = 0; for (var i = 0; i < 720; i++) { var x = i / 720 * TAU; m = Math.max(m, Math.abs(Math.sin(x) + a * Math.sin(2 * x))); } return m; }

  // PCM de un frame: Float32Array. Sello sin visual o frame sin notas -> silencio (longitud 0).
  function pcm(frame) {
    var v = SEM.visual(frame.sello);
    if (!v || frame.sello === 'NO_DATA') { return new Float32Array(0); }
    var lista = notas(frame.terminos);
    if (!lista.length) { return new Float32Array(0); }
    var total = lista.length * NOTA_TICKS * MUESTRAS_TICK, out = new Float32Array(total), picos = lista.map(function (x) { return pico(x.a); });
    for (var n = 0; n < total; n++) {
      var tick = Math.floor(n / MUESTRAS_TICK), t = tick / TICK_HZ, j = Math.floor(tick / NOTA_TICKS);
      var nota = lista[j], x = TAU * nota.hz * (n / SR);
      out[n] = 0.3 * pulso(frame.sello, t) * (Math.sin(x) + nota.a * Math.sin(2 * x)) / picos[j];
    }
    return out;
  }

  // Gemelo estatico (NO CUE IS MOTION-ONLY): cada estado tiene texto y forma sin movimiento.
  var GEMELO = {
    LIVE: { texto: 'LIVE', forma: 'solid' },
    PROPUESTA: { texto: 'PROPOSED · PENDING SIGNATURE', forma: 'dashed' },
    FIRMADO: { texto: 'SIGNED', forma: 'double' },
    ERROR: { texto: 'ERROR', forma: 'jagged' },
    NO_DATA: { texto: 'NO DATA', forma: 'empty' },
    SIMULATED: { texto: 'SIMULATED', forma: 'dotted' },
    STALE: { texto: 'STALE', forma: 'faded' }
  };
  function gemelo(sello) {
    if (!GEMELO.hasOwnProperty(sello)) { return null; }
    var g = GEMELO[sello];
    return { sello: sello, hue: SEM.hueDe(sello), texto: g.texto, forma: g.forma, canto: canto(sello), movimiento: !!(SEM.de(sello) && SEM.de(sello).pulso_hz > 0) };
  }

  function terminosDe(sello) { var v = SEM.visual(sello); return v ? v.fourierTerms.map(function (t) { return [t.k, t.a, t.phi]; }) : null; }
  // Pure: canto(sello) → the tune in words, from the same notes and pulse: where it starts, how it moves, its pace.
  // null for NO_DATA (silence is said by its own words) and for a seal outside the table.
  function canto(sello) {
    var tt = terminosDe(sello), d = SEM.de(sello); if (!tt || sello === 'NO_DATA') { return null; }
    var ns = notas(tt); if (!ns.length) { return null; }
    var reg = function (k) { return k <= 2 ? 'low' : k <= 4 ? 'middle' : 'high'; }, moves = [];
    for (var i = 1; i < ns.length; i++) { var m = ns[i].k > ns[i - 1].k ? 'rises' : 'falls'; if (moves[moves.length - 1] !== m) { moves.push(m); } }
    var hz = d ? d.pulso_hz : 0, pace = hz < 1 ? 'slow' : hz < 2.5 ? 'calm' : hz < 6 ? 'lively' : 'trembling';
    var sour = ns.some(function (x) { return x.k === 7; });
    return (ns.length === 1 ? 'One ' + reg(ns[0].k) + ' note' : 'From ' + reg(ns[0].k) + ', ' + moves.join(', then ')) + ' · ' + pace + (sour ? ' · ends sour' : '');
  }
  // Pure: huella(sello) → marks for a small staff: one dot per note, left to right in order, higher for a higher
  // harmonic, larger for a stronger one. The picture of the tune for someone who cannot hear it. [] when silent.
  function huella(sello) {
    var tt = terminosDe(sello); if (!tt || sello === 'NO_DATA') { return []; }
    return notas(tt).map(function (x, i) { return { i: i, k: x.k, y: 8 - x.k, r: Math.round((1.2 + x.a) * 10) / 10 }; });
  }

  var BBRadio = { pcm: pcm, canto: canto, huella: huella, pulso: pulso, notas: notas, gemelo: gemelo, SR: SR, TICK_HZ: TICK_HZ,
                  MUESTRAS_TICK: MUESTRAS_TICK, NOTA_TICKS: NOTA_TICKS };
  if (typeof module === 'object' && module.exports) { module.exports = BBRadio; }
  else { raiz.AtlasBBRadio = BBRadio; }
})(typeof module === 'object' && module.exports ? this : (this || window));
