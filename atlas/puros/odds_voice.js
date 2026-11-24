// Experiment E2 (Mesa #34, 2026-11-14) · the odds that sound. NOT served: a pure prototype for the Desk to judge.
// One tier of the honest summon odds becomes one harmonic table, in the format the waves already carry
// ([[k, ax, ay, ph], ...]), so acho_sonify.js sounds it with no new sound code: the second harmonic sets the degree of
// the scale from the tier's rare + unique odds (a luckier tier is a higher note), the first carries the common odds
// and the third the rare and unique ones as modulation. Same numbers for the eye, the ear and the machine.
// Pure: no clock, no randomness, no network.
(function (root) {
  'use strict';
  var STEP = 15; // per-thousand of rare + unique that raises the note one degree
  // wave(odds) → harmonic table for [normal, magic, rare, unique] per thousand; null when the odds are not a table of 1000.
  function wave(o) {
    if (!Array.isArray(o) || o.length !== 4 || o.reduce(function (a, b) { return a + b; }, 0) !== 1000) { return null; }
    return [[1, o[0] / 100, 0, 0], [4 + Math.round((o[2] + o[3]) / STEP), o[1] / 100, 0, 0], [2, o[2] / 100, o[3] / 100, 0]];
  }
  // waves(gacha) → one table per tier, in the order of the tiers; null when any tier has no honest table.
  function waves(G) {
    var out = Object.keys(G.TCS).map(function (tc) { return wave(G.odds(tc)); });
    return out.every(Boolean) ? out : null;
  }
  var api = { STEP: STEP, wave: wave, waves: waves };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasOddsVoice = api; }
})(this);
