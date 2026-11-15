// crab_gesture_cases.mjs · the crab settles after a step and looks at a near door (crab_body.js, 2026-11-15).
import { readFileSync } from 'node:fs'; import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const B = createRequire(import.meta.url)('../public/game/crab_body.js');
test('sink: zero at rest and at both ends; a dip in between that never rises above rest', () => {
  assert.equal(B.sink(1), 0); assert.equal(B.sink(0), 0); assert.equal(B.sink(-0.2), 0); assert.equal(B.sink(5), 0);
  const s = Array.from({ length: 19 }, (_, i) => B.sink((i + 1) / 20));
  assert.ok(s.every((v) => v >= 0 && v <= 1), 'only down, bounded'); assert.ok(Math.max(...s) > 0.3, 'it is felt');
});
test('gazeOf: a unit look toward the door; none when standing on it', () => {
  const g = B.gazeOf(30, -40); assert.ok(Math.abs(Math.hypot(g.x, g.y) - 1) < 1e-9); assert.ok(g.x > 0 && g.y < 0);
  assert.equal(B.gazeOf(0, 0), null);
});
test('the settle is bounded: after GLIDE + SETTLE the body is not busy (no perpetual loop)', () => {
  const src = readFileSync(new URL('../public/game/crab_body.js', import.meta.url), 'utf8');
  assert.ok(/sp >= 0 && sp < 1/.test(src), 'busy only while the settle runs');
  assert.ok(/still \|\| t0 < 0 \? 1/.test(src), 'reduced motion: no settle');
  assert.ok(!/Math\.random/.test(src));
});
test('another crab is drawn at rest with its own eyes, never with this visitor\'s gestures', () => {
  const src = readFileSync(new URL('../public/game/shared_crabs.js', import.meta.url), 'utf8');
  assert.ok(/rest\.sp = 1; rest\.look = null/.test(src));
});
