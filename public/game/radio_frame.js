// Radio layer 2 (mission C6, tray H9): the tone of a radio line comes from the SAME frame as the form of its seal.
// Before this piece bb_radio.js could turn a frame into sound, and the radio log held lines with a seal, but nothing
// joined them: a line had words and a colour, never a tone. Now one line gives four readings with one id:
//   eye     the static twin of the seal (text + shape, no motion needed)
//   reader  the sentence a screen reader gets
//   ear     PCM made by AtlasBBRadio.pcm from the seal's own harmonic terms, or NO_DATA with its cause
//   machine seal, source and game cycle
// Not loaded by any page yet: mounting it on /openworld/ is a later one-line slice (the page is in another open PR).
// Layer 3 (a global radio with fresh news) is not here and has no source. No clock, no random numbers, no network.
(function (root) {
  'use strict';
  var NODE = typeof module === 'object' && module.exports;
  var SEM = NODE ? require('./semantic_table.js') : root.AtlasSemantica;
  var RADIO = NODE ? require('./bb_radio.js') : root.AtlasBBRadio;

  // FNV-1a over UTF-16 code units, as 8 hex digits: the same line always gets the same id.
  function hex(text) {
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function cycleOf(line) { return Number.isSafeInteger(line.ciclo) && line.ciclo >= 0 ? line.ciclo : null; }
  function eventId(line) {
    var c = cycleOf(line);
    return 'radio.' + hex([line.fuente || '', line.sello || '', c === null ? 'NO_DATA' : c, line.texto || ''].join('|'));
  }

  // frameOf(seal) → { sello, terminos } with the terms the seal's visual form is drawn from; null for an unknown seal.
  function frameOf(seal) {
    var v = SEM.visual(seal);
    if (!v) { return null; }
    return { sello: seal, terminos: v.fourierTerms.map(function (t) { return [t.k, t.a, t.phi]; }) };
  }

  // sound(line, notes) → { id, seal, samples, sr, ms, cause }. `notes` (optional) keeps only the first notes of the
  // same tone, so a short cue is a prefix of the full one, never a different sound. An empty `samples` always has a
  // cause: silence is never passed off as a tone.
  function sound(line, notes) {
    var seal = String(line && line.sello || ''), id = eventId(line || {}), frame = frameOf(seal), cause = '';
    var samples = new Float32Array(0);
    if (!frame) { cause = 'NO_DATA: seal ' + (seal || '(none)') + ' is not in the semantic table; no tone is invented'; }
    else if (seal === 'NO_DATA') { cause = 'NO_DATA: this line is not measured, so it has no tone; its words say why'; }
    else {
      samples = RADIO.pcm(frame);
      var perNote = RADIO.NOTA_TICKS * RADIO.MUESTRAS_TICK;
      if (Number.isSafeInteger(notes) && notes > 0 && notes * perNote < samples.length) { samples = samples.slice(0, notes * perNote); }
      if (!samples.length) { cause = 'NO_DATA: the frame of ' + seal + ' has no notes'; }
    }
    return { id: id, seal: seal, samples: samples, sr: RADIO.SR, ms: Math.round(samples.length * 1000 / RADIO.SR), cause: cause };
  }

  // play(ctx, line, notes) → { id, seal, played, ms, cause }. `ctx` is a Web Audio context the page already woke
  // with a gesture. No context, or a browser that refuses, is said as NO_DATA with its cause.
  function play(ctx, line, notes) {
    var s = sound(line, notes), out = { id: s.id, seal: s.seal, played: false, ms: 0, cause: s.cause };
    if (!s.samples.length) { return out; }
    if (!ctx || typeof ctx.createBuffer !== 'function') { out.cause = 'NO_DATA: this browser gave no audio context'; return out; }
    try {
      var buffer = ctx.createBuffer(1, s.samples.length, s.sr);
      buffer.getChannelData(0).set(s.samples);
      var source = ctx.createBufferSource();
      source.buffer = buffer; source.connect(ctx.destination); source.start();
      out.played = true; out.ms = s.ms;
    } catch (e) { out.cause = 'NO_DATA: the audio output refused the tone'; }
    return out;
  }

  // readings(line, notes) → the four readings of one line under one id. A harness compares them; none may disagree
  // on the seal, and a missing reading carries its cause.
  function readings(line, notes) {
    var s = sound(line, notes), twin = RADIO.gemelo(s.seal), text = String(line && line.texto || '').trim();
    var c = cycleOf(line || {});
    return {
      id: s.id,
      seal: s.seal,
      eye: twin ? { text: twin.texto, shape: twin.forma, motion: twin.movimiento } : { cause: s.cause },
      reader: twin && text ? twin.texto + ' · ' + text : { cause: twin ? 'NO_DATA: the line has no words' : s.cause },
      ear: s.samples.length ? { samples: s.samples.length, sr: s.sr, ms: s.ms } : { cause: s.cause },
      machine: { seal: s.seal, source: String(line && line.fuente || ''), cycle: c === null ? 'NO_DATA' : c }
    };
  }

  var api = { eventId: eventId, frameOf: frameOf, sound: sound, play: play, readings: readings };
  if (NODE) { module.exports = api; } else { root.AtlasRadioFrame = api; }
})(typeof window !== 'undefined' ? window : globalThis);
