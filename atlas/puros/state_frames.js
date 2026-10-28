// MVP slice 1 · every visible state becomes a bubble-language frame (pure core, not served yet).
// A state is a short sentence the reader can see. The frame says what changed (`r`), and its sound comes from the
// frame's own data (`sound`, and waves with `h`), so the sonify core decides whether it sounds or says NO_DATA.
// Reduced motion is honored: with it on, no transition lasts. No Math.random, no clock, no network.
(function (raiz) {
  'use strict';

  var LIMITE_BYTES = 1024;   // a frame is a syllable: under 1,024 UTF-8 bytes (docs/bubble-language.md §1)
  var RIM = [[58, 66], [36, 94], [92, 72]];

  // stateFrame({ id, sentence, waves }) → frame. `waves` is an optional list of harmonic tables; with none, the
  // frame says NO_DATA for its sound, with its cause, and nothing is invented.
  function stateFrame(estado) {
    var id = String(estado.id || '');
    var sentence = String(estado.sentence || '');
    var waves = Array.isArray(estado.waves) ? estado.waves : [];
    var items = [{ o: 'ribbon', pts: RIM, closed: true, f: 'paper', s: 'ink', lw: 3 }];
    waves.forEach(function (h, i) { items.push({ o: 'wave', x: 60 + i * 40, y: 60, sc: 12, h: h }); });
    return {
      v: 'preceptoros.bubble/1', id: id, t: 0, cv: [320, 96],
      atoms: [{ k: id, r: sentence, i: items }],
      bands: ['paper', 'ink', 'cyan'],
      change: [sentence],
      sound: waves.length ? 'ok' : 'NO_DATA: no waves declared for this state',
      soundCause: waves.length ? '' : 'no harmonic table in this state; nothing is invented'
    };
  }

  // Motion for a transition: 0 ms when the reader asked for reduced motion.
  function transitionMs(ms, reducido) {
    return reducido === true ? 0 : Math.max(0, Math.min(1000, Math.round(ms)));
  }

  // valida(frame) → list of problems; empty means the frame obeys the law (size, sentence on every atom, declared sound).
  function valida(frame) {
    var problemas = [];
    var texto = JSON.stringify(frame);
    var bytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(texto).length : texto.length;
    if (bytes >= LIMITE_BYTES) { problemas.push('frame of ' + bytes + ' bytes, limit ' + LIMITE_BYTES); }
    (frame.atoms || []).forEach(function (a, i) {
      if (!a || typeof a.r !== 'string' || !a.r.trim()) { problemas.push('atom ' + i + ' has no sentence (r)'); }
    });
    if (typeof frame.sound !== 'string' || !frame.sound) { problemas.push('sound not declared'); }
    return problemas;
  }

  var AtlasStateFrames = { LIMITE_BYTES: LIMITE_BYTES, stateFrame: stateFrame, transitionMs: transitionMs, valida: valida };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasStateFrames; }
  else { raiz.AtlasStateFrames = AtlasStateFrames; }
})(this);
