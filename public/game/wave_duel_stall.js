// W3 · stalled-duel watcher (pure core, not served yet). A duel that waits for a reveal and gets none for
// ABANDON game cycles is abandoned and says so. Time is counted in game cycles of the one who waits
// (the duels canon, abandonment rule), never in wall-clock time. No random source, no clock, no network.
// No combat numbers appear here: balance stays NO_DATA (G5-D3).
(function (root) {
  'use strict';

  // Same value as ABANDON in atlas/puros/wave_duel.js (that core is not served in the browser, so the number is
  // declared here and atlas/wave_duel_stall_cases.mjs fails if the two ever differ).
  var ABANDON = 900;

  function isCycle(n) { return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0; }

  function noData(cause) {
    return { state: 'NO_DATA', cyclesLeft: null, sentence: 'No duel verdict: ' + cause + '.', cause: cause };
  }

  // status(pending, cycleNow) → { state: 'OPEN'|'REVEALED'|'ABANDON'|'NO_DATA', cyclesLeft, sentence [, cause] }
  // pending = { duelId, committedAtCycle, revealed }.
  function status(pending, cycleNow) {
    if (!pending || typeof pending !== 'object') { return noData('no pending duel was given'); }
    if (typeof pending.duelId !== 'string' || !pending.duelId) { return noData('the duel has no id'); }
    if (typeof pending.revealed !== 'boolean') { return noData('revealed must be true or false'); }
    if (!isCycle(pending.committedAtCycle)) { return noData('the commit cycle is not a non-negative integer'); }
    if (!isCycle(cycleNow)) { return noData('the current cycle is not a non-negative integer'); }
    if (cycleNow < pending.committedAtCycle) { return noData('the current cycle is before the commit cycle'); }
    if (pending.revealed) {
      return { state: 'REVEALED', cyclesLeft: null, sentence: 'The reveal arrived; the duel goes on.' };
    }
    var waited = cycleNow - pending.committedAtCycle;
    if (waited >= ABANDON) {
      return { state: 'ABANDON', cyclesLeft: 0,
        sentence: 'No reveal for ' + ABANDON + ' cycles: the duel is abandoned.' };
    }
    var left = ABANDON - waited;
    return { state: 'OPEN', cyclesLeft: left,
      sentence: 'Waiting for the reveal: ' + left + ' cycles left before the duel is abandoned.' };
  }

  // frame(result) → acho/1 frame (< 1,024 B). The sentence is the atom's `r`; the sound is NO_DATA with its cause
  // because this state declares no waves and nothing is invented.
  function frame(result) {
    var r = result && typeof result === 'object' ? result : noData('no status result was given');
    var sentence = typeof r.sentence === 'string' && r.sentence ? r.sentence : 'No duel verdict.';
    var state = typeof r.state === 'string' ? r.state : 'NO_DATA';
    var id = 'duel-stall-' + state.toLowerCase();
    return {
      v: 'preceptoros.acho/1', id: id, t: 0, cv: [320, 96],
      atoms: [{ k: id, r: sentence, i: [{ o: 'ribbon', pts: [[58, 66], [36, 94], [92, 72]], closed: true, f: 'paper', s: 'ink', lw: 3 }] }],
      bands: ['paper', 'ink', 'cyan'],
      change: [sentence],
      sound: 'NO_DATA: no waves declared for a stalled duel',
      soundCause: 'a duel state declares no harmonic table; nothing is invented'
    };
  }

  var API = { ABANDON: ABANDON, status: status, frame: frame };
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  else { root.AtlasWaveDuelStall = API; }
})(typeof globalThis === 'object' ? globalThis : this);
