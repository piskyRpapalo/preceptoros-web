// G4-1 · the tutorial as a walk over the single map (odd/tasks/tutorial-walk.md). Pure: no random numbers,
// no clock reads, no network. Each step is a place; a place must be LIVE to be walked (D21). A skipped step is
// recorded as skipped, never as done (D19). Progress counts only what was played (D20).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;

  // Short route (Sovereign, 2026-10-31): cabin, then beelink, then the cabin again. The Doggee steps are out.
  var STEPS = [
    { id: 'key', place: 'cabin' },
    { id: 'beacon', place: 'beelink' },
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

  function resolvedIds(log) { return (log || []).map(function (e) { return e.step; }); }

  // nextStep(log) → the first step not yet played or skipped, or undefined when the walk is over.
  function nextStep(log) {
    var done = resolvedIds(log);
    return STEPS.filter(function (x) { return done.indexOf(x.id) < 0; })[0];
  }

  // advance(log, node, seals) → { log, said }. The walker stands on node. The next step is played when its place is
  // this node and alive. A next step whose place is not alive is recorded as skipped (NO_DATA) and never blocks the walk.
  function advance(log, node, seals) {
    var cur = log || [], said = '';
    for (var guard = 0; guard < STEPS.length; guard++) {
      var next = nextStep(cur);
      if (!next) { return { log: cur, said: 'tutorial: complete' }; }
      var ok = canWalk(next.id, seals);
      if (!ok.ok) { cur = record(cur, next.id, 'skipped'); said = 'tutorial: ' + next.id + ' skipped · ' + ok.cause; continue; }
      if (placeFor(next.id) === node) { return { log: record(cur, next.id, 'played'), said: (said ? said + '. ' : '') + 'tutorial: ' + next.id + ' played' }; }
      return { log: cur, said: said || 'tutorial: next step is at ' + placeFor(next.id) };
    }
    return { log: cur, said: said };
  }

  // close(log, seals) → a new log. The visit has ended: every step still open whose place is not alive is skipped.
  // A walkable step stays open, so the walk can still be finished.
  function close(log, seals) {
    var cur = log || [];
    STEPS.forEach(function (s) {
      if (resolvedIds(cur).indexOf(s.id) < 0 && !canWalk(s.id, seals).ok) { cur = record(cur, s.id, 'skipped'); }
    });
    return cur;
  }

  // progress(log) → the ids played, in the order of the steps. A skipped step is not in the list.
  function progress(log) {
    var played = (log || []).filter(function (e) { return e.outcome === 'played'; }).map(function (e) { return e.step; });
    return STEPS.map(function (s) { return s.id; }).filter(function (id) { return played.indexOf(id) >= 0; });
  }

  var AtlasTutorialWalk = { STEPS: STEPS, placeFor: placeFor, canWalk: canWalk, record: record, progress: progress, nextStep: nextStep, advance: advance, close: close };
  if (common) { module.exports = AtlasTutorialWalk; }
  else { root.AtlasTutorialWalk = AtlasTutorialWalk; }
})(typeof globalThis === 'object' ? globalThis : this);
