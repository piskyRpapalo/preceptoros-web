// worm_panels.js · a burst from the pressed key to the opened panel: one second by the clock, then gone.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), W = req('../../public/game/worm_panels.js'), A = req('../../public/game/acho_language.js');
const a = [40, 600], b = [180, 120];
test('segments = opens (1..9), the head leaves at a and reaches b when the travel ends (t = 0.8)', () => {
  assert.equal(W.plan(a, b, 3, 0.3, A.neck).length, 3);
  assert.equal(W.plan(a, b, 40, 0.3, A.neck).length, 9);
  assert.deepEqual(W.plan(a, b, 3, 0.3, A.neck).map((q) => +q.alpha.toFixed(2)), [1, 0.75, 0.5]);
  const s = W.plan(a, b, 1, 0, A.neck)[0], e = W.plan(a, b, 1, 0.8, A.neck)[0];
  assert.deepEqual([Math.round(s.x), Math.round(s.y)], a); assert.deepEqual([Math.round(e.x), Math.round(e.y)], b);
});
test('ephemeral: one second; it fades in the last fifth; nothing at or after t = 1', () => {
  assert.equal(W.DUR, 1000);
  assert.equal(W.fade(0.5), 1); assert.ok(W.fade(0.9) > 0 && W.fade(0.9) < 1); assert.equal(W.fade(1), 0);
  assert.ok(W.plan(a, b, 1, 0.99, A.neck)[0].alpha < 0.1);
  assert.deepEqual(W.plan(a, b, 1, 1.01, A.neck), []); assert.deepEqual(W.plan(a, b, 1, NaN, A.neck), []);
  assert.deepEqual(W.plan(a, b, 5, 0.4, A.neck), W.plan(a, b, 5, 0.4, A.neck));
});
test('sabotage: a burst that never faded would still be opaque at its end', () => {
  assert.notEqual(W.plan(a, b, 1, 0.999, A.neck)[0].alpha, 1);
});
