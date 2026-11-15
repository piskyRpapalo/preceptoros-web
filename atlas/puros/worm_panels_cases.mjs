// worm_panels.js · the worm of worm_transition.js on OpenWorld: its frames from the pressed key to the opened panel.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), W = req('../../public/game/worm_panels.js'), A = req('../../public/game/acho_language.js');
const a = [40, 600], b = [180, 120];
test('segments = opens (1..9), alpha 1 − s/(n+1), the head leaves at a and lands at b', () => {
  assert.equal(W.plan(a, b, 3, 10, A.neck).length, 3);
  assert.equal(W.plan(a, b, 40, 10, A.neck).length, 9);
  assert.deepEqual(W.plan(a, b, 3, 10, A.neck).map((q) => +q.alpha.toFixed(2)), [1, 0.75, 0.5]);
  const s = W.plan(a, b, 1, 0, A.neck)[0], e = W.plan(a, b, 1, W.FRAMES, A.neck)[0];
  assert.deepEqual([Math.round(s.x), Math.round(s.y)], a); assert.deepEqual([Math.round(e.x), Math.round(e.y)], b);
});
test('the swell 4p(1−p): widest mid-flight, nothing after the last frame, the same twice', () => {
  const r = (f) => W.plan(a, b, 1, f, A.neck)[0].r;
  assert.ok(r(Math.round(W.FRAMES / 2)) > r(1) && r(Math.round(W.FRAMES / 2)) > r(W.FRAMES - 1));
  assert.deepEqual(W.plan(a, b, 1, W.FRAMES + 1, A.neck), []);
  assert.deepEqual(W.plan(a, b, 5, 13, A.neck), W.plan(a, b, 5, 13, A.neck));
});
test('sabotage: a worm that ignored the count would show one segment for a fifth open', () => {
  assert.notEqual(W.plan(a, b, 5, 13, A.neck).length, 1);
});
