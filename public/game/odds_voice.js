// The odds that sound (Mesa #34, experiment E2 · BUILD 1B). One press of «See the odds before you roll» is ONE event
// with four readings that share one id: the words (eye and screen reader, the sheet's live line), the notes (ear) and
// the Acho frame (machine). Each tier's odds become one harmonic table in the format the waves already carry
// ([[k, ax, ay, ph], ...]), so acho_sonify.js sounds it with no new sound code: the second harmonic sets the degree of
// the scale from the tier's rare + unique odds (a luckier tier is a higher note), the first carries the common odds,
// the third the rare and unique ones. Loaded by town_actions.js on the first press. No clock, no randomness, no network.
(function (root) {
  'use strict';
  var STEP = 15, ctx = null; // per-thousand of rare + unique that raises the note one degree
  // Pure: wave(odds) → harmonic table for [normal, magic, rare, unique] per thousand; null unless they add to 1000.
  function wave(o) {
    if (!Array.isArray(o) || o.length !== 4 || o.reduce(function (a, b) { return a + b; }, 0) !== 1000) { return null; }
    return [[1, o[0] / 100, 0, 0], [4 + Math.round((o[2] + o[3]) / STEP), o[1] / 100, 0, 0], [2, o[2] / 100, o[3] / 100, 0]];
  }
  // Pure: waves(gacha) → one table per tier, in tier order; null when any tier has no honest table.
  function waves(G) {
    var out = Object.keys(G.TCS).map(function (tc) { return wave(G.odds(tc)); });
    return out.every(Boolean) ? out : null;
  }
  // Pure: event(G, F, A) → { ok, id, line, frame } from the table the roll itself uses (gacha.js), as one state frame
  // (state_frames.js) whose id is the house hash of its own bytes (acho_language.js). Anything missing is NO_DATA.
  function event(G, F, A) {
    if (!G || !G.TCS || !G.odds || !F || !A) { return { ok: false, cause: 'piece_not_loaded' }; }
    var w = waves(G);
    if (!w) { return { ok: false, cause: 'odds_do_not_add_to_1000' }; }
    var line = 'per thousand ' + G.RAREZAS.join('/') + ' · ' + Object.keys(G.TCS).map(function (t) { return t + ' ' + G.odds(t).join('/'); }).join(' · ');
    var frame = F.stateFrame({ id: 'lottery/odds', sentence: line, waves: w }), bad = F.valida(frame);
    if (bad.length) { return { ok: false, cause: 'frame_breaks_the_law' }; }
    return { ok: true, id: 'acho:' + ('0000000' + A.hash32(JSON.stringify(frame)).toString(16)).slice(-8), line: line, frame: frame };
  }
  // run(doc, done, c): the words first, always; then the same frame goes to machines (an «acho:event» on the document)
  // and to the ear. The press is the gesture that allows sound; without audio the line says why, the words stay.
  function run(doc, done, c) {
    var w = c.win || root, e = event(root.AtlasGacha, root.AtlasStateFrames, root.AtlasAcho);
    if (!e.ok) { done('NO_DATA · ' + e.cause); return; }
    done(e.line);
    api.last = { id: e.id, frame: e.frame };
    if (w.CustomEvent && doc.dispatchEvent) { doc.dispatchEvent(new w.CustomEvent('acho:event', { detail: api.last })); }
    c.load('/game/acho_sonify.js', 'AtlasSonifyAcho', function (S) {
      var Ctx = w.AudioContext || w.webkitAudioContext, r = S ? S.sonify(e.frame) : null;
      if (!r || !r.ok || !Ctx) { done(e.line + ' · sound NO_DATA · ' + (!S ? 'sound_piece_not_loaded' : !Ctx ? 'no_audio_output' : 'frame_is_silent')); return; }
      try { ctx = ctx || new Ctx(); if (ctx.resume) { ctx.resume(); } done(e.line + ' · ' + S.play(r, ctx) + ' notes, one per tier: higher is luckier'); }
      catch (x) { done(e.line + ' · sound NO_DATA · audio_refused'); }
    });
  }
  var api = { STEP: STEP, wave: wave, waves: waves, event: event, run: run, last: null };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasOddsVoice = api;
})(typeof window !== 'undefined' ? window : globalThis);
