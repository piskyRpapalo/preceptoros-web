// Native sound of a bubble frame (NORTE 8 · audio slice 2, wired on /openworld/).
// A wave (`wave`) or blob (`blob`) carries its own harmonics: h: [[k, ax, ay, ph], ...], the same format as the
// `armonicos` of the troops. The sound recipe is the one in game/core.js (`vozDe`): the second harmonic picks the
// degree of the scale (carrier 110 Hz, PENTA_V), the rest sets the modulation. The frame's `sound` says whether it
// sounds: `ok`, or `NO_DATA: cause`. No Math.random, no clock, no network.
(function (raiz) {
  'use strict';

  var PENTA_V = [0, 2, 4, 7, 9];  // the same scale as core.js
  var STEP_MS = 180;              // gap between consecutive voices
  var WITH_HARMONICS = { wave: true, blob: true };

  // The recipe of one harmonic table: vozDe from core.js, without the game state object.
  function recipe(harmonics) {
    var a = Array.isArray(harmonics) ? harmonics : [], detail = 0;
    if (!a.length) { return null; }
    var n = a.length > 1 ? Math.max(2, Math.abs(a[1][0] - 1)) : 2;
    var a1 = a.length > 1 ? Math.abs(a[1][1]) : 0;
    var degree = Math.max(0, n - 3);
    a.slice(2).forEach(function (h) { detail += Math.abs(h[1]) + Math.abs(h[2]); });
    var carrier = Math.round(110 * Math.pow(2, (PENTA_V[degree % 5] + 12 * Math.floor(degree / 5)) / 12));
    var r = { type: 'wave', carrier: carrier, modulator: Math.round(carrier * (8 + a1) / 8),
              index: Math.min(400, 20 + a1 * 4 + detail * 6), dur: 0.5, gain: 0.07 };
    if (n > 12) { r.modulator2 = Math.round(carrier * 7 / 5); r.index2 = Math.round(r.index / 2); }
    return r;
  }

  // sonify(frame) → { ok: true, voices: [{ at_ms, primitive, recipe }] }
  //               | { ok: false, cause } (closed failure: no invented sound)
  function sonify(frame) {
    if (!frame || typeof frame !== 'object') { return { ok: false, cause: 'NO_DATA: the frame does not exist' }; }
    if (typeof frame.sound === 'string' && frame.sound.indexOf('NO_DATA') === 0) {
      return { ok: false, cause: frame.sound.replace(/^NO_DATA:?\s*/, '') || frame.soundCause || 'NO_DATA without cause' };
    }
    var voices = [], atoms = Array.isArray(frame.atoms) ? frame.atoms : [];
    atoms.forEach(function (atom) {
      (atom && Array.isArray(atom.i) ? atom.i : []).forEach(function (item) {
        if (item && WITH_HARMONICS[item.o] === true && Array.isArray(item.h) && item.h.length) {
          voices.push({ at_ms: voices.length * STEP_MS, primitive: item.o, recipe: recipe(item.h) });
        }
      });
    });
    if (!voices.length) { return { ok: false, cause: 'NO_DATA: no wave or blob with harmonics in the frame' }; }
    return { ok: true, voices: voices };
  }

  // play(result, context): schedules the voices on a browser AudioContext. Only called after a user gesture
  // (the button on the page). Returns how many voices were scheduled; 0 when there is nothing to sound.
  function play(result, context) {
    if (!result || !result.ok || !context) { return 0; }
    var now = context.currentTime;
    result.voices.forEach(function (v) {
      var r = v.recipe, t = now + v.at_ms / 1000;
      var carrierOsc = context.createOscillator(), modulatorOsc = context.createOscillator();
      var depth = context.createGain(), out = context.createGain();
      carrierOsc.frequency.value = r.carrier; modulatorOsc.frequency.value = r.modulator;
      depth.gain.value = r.index;
      modulatorOsc.connect(depth); depth.connect(carrierOsc.frequency);
      out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(r.gain, t + 0.02);
      out.gain.linearRampToValueAtTime(0, t + r.dur);
      carrierOsc.connect(out); out.connect(context.destination);
      carrierOsc.start(t); modulatorOsc.start(t); carrierOsc.stop(t + r.dur); modulatorOsc.stop(t + r.dur);
    });
    return result.voices.length;
  }

  var AtlasSonifyBubble = { PENTA_V: PENTA_V, STEP_MS: STEP_MS, recipe: recipe, sonify: sonify, play: play };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSonifyBubble; }
  else { raiz.AtlasSonifyBubble = AtlasSonifyBubble; }
})(this);
