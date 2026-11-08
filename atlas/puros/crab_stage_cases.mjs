// The crab's stage: the camera's easing and centring are pure.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../../public/game/crab_stage.js');
test('the zoom eases out and lands exactly, whatever the progress overshoot', () => {
  assert.equal(S.ease(1, 2.2, 0), 1);
  assert.equal(S.ease(1, 2.2, 1), 2.2);
  assert.equal(S.ease(1, 2.2, 7), 2.2);
  assert.ok(S.ease(1, 2.2, 0.5) > 1.6, 'ease-out: past the middle at half time');
});
test('centring puts the crab in the middle of the canvas', () => {
  assert.deepEqual(S.centre({ x: 10, y: -4 }, 300, 100, 400, 400), { x: -90, y: 96 });
  assert.deepEqual(S.centre({ x: 0, y: 0 }, 200, 200, 400, 400), { x: 0, y: 0 });
});
