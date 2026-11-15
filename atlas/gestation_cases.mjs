// gestation_cases.mjs · eggs gestate by time, shown at the top of the map (public/game/gestation_toast.js, 2026-11-15).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const G = createRequire(import.meta.url)('../public/game/gestation_toast.js');
test('clock: m:ss, rounded up, never negative', () => {
  assert.equal(G.clock(20), '0:20'); assert.equal(G.clock(90), '1:30'); assert.equal(G.clock(0.2), '0:01'); assert.equal(G.clock(-3), '0:00');
});
test('share: the traced outline grows monotonically from 0 to 100 as time passes', () => {
  let last = -1; for (let left = 20; left >= -1; left -= 0.5) { const s = G.share(left, 20); assert.ok(s >= last && s <= 100); last = s; }
  assert.equal(G.share(20, 20), 0); assert.equal(G.share(10, 20), 50); assert.equal(G.share(0, 20), 100); assert.equal(G.share(5, 0), 100);
});
test('line: the time first while gestating, then hatching; never steps', () => {
  assert.equal(G.line({ seq: 1, tc: 'tc1' }, 14), '0:14 · tc1'); assert.equal(G.line({ seq: 1, tc: 'tc4' }, 0), 'tc4 · hatching…');
  assert.doesNotMatch(G.line({ seq: 1, tc: 'tc1' }, 14), /step/i);
});
