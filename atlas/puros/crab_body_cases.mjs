// The living crab: its glide, gait, greeting and beat are pure projection, the same on every device.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const B = createRequire(import.meta.url)('../../public/game/crab_body.js');
test('the glide eases from 0 to 1 and lands exactly', () => {
  assert.equal(B.ease(0), 0); assert.equal(B.ease(1), 1); assert.equal(B.ease(3), 1); assert.equal(B.ease(0.5), 0.5);
});
test('tripod gait: while walking, the two leg sets lift in turn; standing, every leg rests', () => {
  const a = B.pose(0, 0.25, 1).legs, b = B.pose(1, 0.25, 1).legs;
  const setA = [0, 2, 4], setB = [1, 3, 5];
  assert.ok(setA.every((i) => a[i] > 0) && setB.every((i) => a[i] === 0), 'first step lifts L0, L2, R1');
  assert.ok(setB.every((i) => b[i] > 0) && setA.every((i) => b[i] === 0), 'next step lifts the other three');
  assert.deepEqual(B.pose(7, 1, 1).legs, [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(B.pose(3, 0.4, 1), B.pose(3, 0.4, 1), 'same step and progress → same pose');
});
test('the greeting raises the claws and opens them; without a greeting the claws rest', () => {
  assert.ok(B.pose(0, 1, 0.5).raise > 0.9 && B.pose(0, 1, 0.25).open > 0.9);
  assert.equal(B.pose(0, 1, 1).raise, 0);
});
test('no signal → the ring does not beat; a fresh signal beats', () => {
  assert.equal(B.beat(null, 0), B.beat(null, 5000));
  assert.notEqual(B.beat(1, 0), B.beat(1, 250));
});
test('no chance in the body', () => {
  assert.ok(!/Math\.random/.test(readFileSync(new URL('../../public/game/crab_body.js', import.meta.url), 'utf8')));
});
