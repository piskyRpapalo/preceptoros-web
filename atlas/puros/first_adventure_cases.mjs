// first_adventure.js · the steps come from what the visit really did; a loss never opens the town (Mission B, E).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), A = req('../../public/game/first_adventure.js'), C = req('../../public/game/ow_calm.js');
const full = { visit: 1, met: 1, claimed: 1, troops: 1, practised: 1, wins: 1, seen: 1 };
test('the order: play, meet, beacon, summon, practice, conquest, town, explore', () => {
  const keys = ['visit', 'met', 'claimed', 'troops', 'practised', 'wins', 'seen'], got = [];
  for (let i = 0; i <= keys.length; i++) { const v = {}; keys.slice(0, i).forEach((k) => { v[k] = 1; }); got.push(A.step(v)); }
  assert.deepEqual(got, A.IDS);
});
test('an egg is enough to leave the summon step; a practice wave is not a conquest', () => {
  assert.equal(A.step({ visit: 1, met: 1, claimed: 1, eggs: 1 }), 'practice');
  assert.equal(A.step({ visit: 1, met: 1, claimed: 1, troops: 1, practised: 1, wins: 0 }), 'conquest');
});
test('after a loss, Later goes to explore without the town step (nothing opened)', () => {
  assert.equal(A.step({ ...full, wins: 0, later: 1 }), 'explore');
  assert.equal(C.state({ town: true, id: 'workshop' }, 'visit', 0, []), 'locked');
});
test('the town opens 3 with the first win, one more each win; doctor never locked; no phase shortcut', () => {
  const open = (w) => C.ORDER.filter((id) => C.state({ town: true, id }, 'visit', w, []) === 'available');
  assert.deepEqual([0, 1, 2, 5].map((w) => open(w).length), [0, 3, 4, 6]);
  assert.equal(C.state({ town: true, id: 'doctor' }, 'arrive', 0, []), 'available');
  // No 'free' phase: even with 0 wins, phase never unlocks everything
  assert.ok(C.ORDER.every((id) => C.state({ town: true, id }, 'visit', 0, []) === 'locked'));
});
test('four states never mixed: built from this device, accredited only from a signed list, a win is not ownership', () => {
  assert.equal(C.state({ town: true, id: 'choir', own: true }, 'visit', 0, []), 'built');
  assert.equal(C.state({ town: true, id: 'choir' }, 'visit', 0, ['choir']), 'accredited');
  assert.equal(C.state({ id: 'choir', won: true }, 'visit', 1, []), 'available');
  assert.match(C.why('choir', 1), /opens after 1 more conquest/);
});
test('the «!» has one target list per step, and every step has words', () => {
  A.IDS.forEach((id) => { assert.ok(A.target(id, {}).length >= 1, id); assert.ok(A.say(id).length > 20, id); });
});
test('conquest walks only to a fair fight (2026-11-24: 2 reef troops win reef 53%, kelp 17%, ruins 7%)', () => {
  const t = (tc, n) => Array.from({ length: n }, () => ({ tc })), two = t('tc1', 2);
  assert.equal(A.fair(t('tc1', 2), two), true);   // reef: the tutorial's fight
  assert.equal(A.fair(t('tc1', 3), two), false);  // kelp outnumbers two
  assert.equal(A.fair(t('tc2', 2), two), false);  // a higher tier outranks
  assert.equal(A.fair(t('tc1', 3), t('tc1', 3)), true);  // a third troop makes kelp fair
  assert.equal(A.fair(t('tc2', 3), [...t('tc1', 2), { tc: 'tc2' }]), true);
});
