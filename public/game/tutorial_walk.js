// G4-1 · the tutorial as a walk over the single map (odd/tasks/tutorial-walk.md). Pure: no random numbers,
// no clock reads, no network. Each step is a place; a place must be LIVE to be walked (D21). A skipped step is
// recorded as skipped, never as done (D19). Progress counts only what was played (D20).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;

  var STEPS = [
    { id: 'key', place: 'cabin' },
    { id: 'beacon', place: 'beelink' },
    { id: 'egg', place: 'doggee-a' },
    { id: 'hatch', place: 'doggee-a' },
    { id: 'fight', place: 'doggee-b' },
    { id: 'node', place: 'cabin' }
  ];

  function fail(causa) { throw new Error('tutorial_walk: ' + causa); }

  // placeFor(stepId) → the place the step is walked on. A step with no place is refused.
  function placeFor(id) {
    var s = STEPS.filter(function (x) { return x.id === id; })[0];
    if (!s) { fail('unknown step ' + JSON.stringify(id)); }
    return s.place;
  }

  // canWalk(stepId, seals) → { ok, cause }. seals maps a node id to its seal. Only LIVE or STALE places are walked.
  function canWalk(id, seals) {
    var place = placeFor(id);
    var seal = (seals || {})[place];
    if (seal === 'LIVE' || seal === 'STALE') { return { ok: true, cause: '' }; }
    return { ok: false, cause: 'NO_DATA: place ' + place + ' is not alive (seal ' + (seal || 'absent') + ')' };
  }

  // record(log, stepId, outcome) → a new log (never mutates). outcome: 'played' | 'skipped'.
  // A skip is kept as skipped. Only 'played' counts as progress.
  function record(log, id, outcome) {
    placeFor(id);
    if (outcome !== 'played' && outcome !== 'skipped') { fail('outcome must be played or skipped'); }
    return (log || []).concat([{ step: id, outcome: outcome }]);
  }

  // progress(log) → the ids played, in the order of the steps. A skipped step is not in the list.
  function progress(log) {
    var played = (log || []).filter(function (e) { return e.outcome === 'played'; }).map(function (e) { return e.step; });
    return STEPS.map(function (s) { return s.id; }).filter(function (id) { return played.indexOf(id) >= 0; });
  }

  var AtlasTutorialWalk = { STEPS: STEPS, placeFor: placeFor, canWalk: canWalk, record: record, progress: progress };
  if (common) { module.exports = AtlasTutorialWalk; }
  else { root.AtlasTutorialWalk = AtlasTutorialWalk; }
})(typeof globalThis === 'object' ? globalThis : this);
