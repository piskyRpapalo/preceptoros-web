// Guardian pressure · pure cases (public/game/guardian_pressure.js). node --test atlas/puros/guardian_pressure_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const G = createRequire(import.meta.url)('../../public/game/guardian_pressure.js');

test('the pace is a clock: the same angle at 15, 30 or 60 frames a second', () => {
  const a0 = G.pace(0, 3, -7);
  for (const fps of [15, 30, 60, 144]) {
    let t = 0; const dt = 1000 / fps; for (let i = 0; i < fps; i++) { t += dt; }
    assert.ok(Math.abs(G.pace(t, 3, -7) - a0 - 2.1) < 1e-9, fps + ' fps walked a different second');
  }
  assert.ok(Math.abs(2.1 / 60 - 0.035) < 1e-12, 'the Q-02 look at 60 frames is kept');
});

test('pressure: 0 far away, 1 at one hex, smoothstep between, never decreasing as the crab comes closer', () => {
  assert.deepEqual([6, 5, 4, 3, 2, 1, 0].map(G.pressure), [0, 0, 0, 0.2593, 0.7407, 1, 1]);
});

test('states: patrol → watching → alert, and the retreat ends gone', () => {
  assert.deepEqual([5, 3, 2, 1, 0].map((d) => G.state(d)), ['patrol', 'watching', 'watching', 'alert', 'alert']);
  const dir = [1, 0];
  assert.equal(G.pose(0, 2, dir, 40, 0.5, 0.5).state, 'retreating');
  assert.equal(G.pose(0, 2, dir, 40, 0.5, 1).state, 'gone');
});

test('at one hex it stops walking: the pose no longer depends on the patrol angle; it leans in and steps aside of the crab line', () => {
  const dir = [0.6, -0.8], a = G.pose(0.3, 1, dir, 50, 0.4, -1), b = G.pose(2.9, 1, dir, 50, 0.4, -1);
  assert.deepEqual([a.dx, a.dy], [b.dx, b.dy]);
  const along = a.dx * dir[0] + a.dy * dir[1], across = -a.dx * dir[1] + a.dy * dir[0];
  assert.ok(Math.abs(along - 0.1 * 50) < 1e-3 && Math.abs(across - 0.45 * 50) < 1e-3, 'not 0.1 hex in and 0.45 aside: ' + [along, across]);
  const c = G.pose(0.3, 1, dir, 50, 0.4, -1, -1); assert.ok(Math.abs(c.dx + a.dx - 2 * 0.1 * 50 * dir[0]) < 1e-3, 'side −1 is not the mirror of side +1');
  assert.deepEqual(a.look, dir, 'its eyes are on the crab');
  assert.equal(G.pose(0.3, 6, dir, 50, 0.4, -1).look, null, 'far away it does not look at you');
});

test('far away the loop is Q-02 unchanged: radius half a hex, flattened by the tilt', () => {
  const p = G.pose(Math.PI / 2, 9, [1, 0], 40, 0.5, -1);
  assert.ok(Math.abs(p.dx) < 1e-3 && Math.abs(p.dy - 0.5 * 40 * 0.5) < 1e-3);
});

test('the retreat: away from the crab, fading and shrinking, monotone, ending at 1.2 hexes', () => {
  let prev = { out: -1, alpha: 2, scale: 2 };
  for (let u = 0; u <= 1.0001; u += 0.1) {
    const r = G.retreat(u);
    assert.ok(r.out >= prev.out && r.alpha <= prev.alpha && r.scale <= prev.scale, 'not monotone at ' + u);
    prev = r;
  }
  assert.deepEqual(G.retreat(1), { out: 1.2, alpha: 0, scale: 0.6 });
  const p = G.pose(0, 1, [1, 0], 10, 0.5, 1);
  assert.ok(p.dx < 0, 'it walks away from the crab, not toward it');
});

test('deterministic: the same inputs give the same pose, and two keys get different phases', () => {
  assert.deepEqual(G.pose(G.pace(1234, 5, 2), 3, [0, 1], 30, 0.4, -1), G.pose(G.pace(1234, 5, 2), 3, [0, 1], 30, 0.4, -1));
  assert.notEqual(G.pace(0, 5, 2), G.pace(0, 2, 5));
});
