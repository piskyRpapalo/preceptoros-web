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
// Sovereign 2026-11-25: before the one HITL signature the viewer is a classic sheet ghost (white sheet, two black
// eyes, two crab claws, no legs); signing turns it into the living crab. Counted on a recording 2D context.
test('unsigned: a sheet ghost with two eyes and two claws and no legs; signed: the living crab with its six legs', () => {
  const rec = () => { const n = { ellipse: 0, arc: 0, lineTo: 0, fill: 0 }; return { n, g: new Proxy({}, { get: (_, k) => (k in n ? () => { n[k]++; } : () => {}), set: () => true }) }; };
  const H = { T: { NEUTRAL: { ink: '#111', paper: '#fff' }, FRONT_DOOR: { cyan: '#0cf', 'FIRMADO.base': '#00f', 'PROPUESTA.base': '#fa0' } },
    rgbOf: () => [1, 2, 3], css: () => '#000', mix: (a) => a, shade: (a) => a };
  const P = { bob: 0, legs: [0, 0, 0, 0, 0, 0], raise: 0, open: 0, look: 0, sp: 0 }, oval = (g) => g.lineTo();
  globalThis.AtlasVisitorGhost = true; const a = rec(); B.draw(a.g, 100, 100, 1, P, H, 1, oval);
  globalThis.AtlasVisitorGhost = false; const b = rec(); B.draw(b.g, 100, 100, 1, P, H, 1, oval);
  delete globalThis.AtlasVisitorGhost;
  assert.equal(a.n.ellipse, 2, 'the ghost has exactly two eyes');
  assert.ok(a.n.arc === 3, 'a domed sheet and two open pincers: ' + a.n.arc);
  assert.ok(b.n.lineTo > a.n.lineTo, 'the signed crab draws its legs; the ghost has none');
});
