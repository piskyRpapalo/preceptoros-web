// Cases of the H1 port (public/game/map_stick.js). Parity with public/face/face_world.js, and the joystick aim properties.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const M = require('../public/game/map_stick.js');
const W = require('../public/face/face_world.js');

test('the three preconfigured places are the face places, in the same order', () => {
  assert.deepEqual(M.places.map((p) => p.id), ['beacon', 'reef', 'rift']);
  assert.deepEqual(M.places.map((p) => p.at), W.places.map((p) => p.at));
});

test('each route and walk equals the face original (parity)', () => {
  for (const p of M.places) {
    const orig = W.places.find((x) => x.id === p.id);
    assert.deepEqual(M.route(M.homeAt, p), W.route(W.homeAt, orig));
    assert.deepEqual(M.walk(M.route(M.homeAt, p)), W.walk(W.route(W.homeAt, orig)));
  }
});

test('the joystick knob never leaves its ring of radius R', () => {
  for (const [x, y] of [[300, 0], [0, -500], [25, 25], [1, 1]]) {
    const a = M.aim(x, y);
    assert.ok(Math.hypot(a.knob[0], a.knob[1]) <= M.R + 1e-9);
  }
});

test('inside the dead zone there is no direction; past it the direction is unit length', () => {
  assert.deepEqual(M.aim(5, 5).dir, [0, 0]);
  const d = M.aim(30, 40).dir;
  assert.ok(Math.abs(Math.hypot(d[0], d[1]) - 1) < 1e-9);
});

test('sabotage: a walk that stops short of its place is caught (it must end on the place)', () => {
  for (const p of M.places) {
    const r = M.route(M.homeAt, p);
    const w = M.walk(r).at;
    assert.deepEqual(w[w.length - 1], p.at, 'the walk ends on the place');
    assert.notDeepEqual(w[0], p.at, 'the walk starts at home, not on the place');
  }
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('../public/game/map_stick.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});

test('the stick direction picks the nearest of the six neighbours; inside the dead zone it picks none', () => {
  assert.equal(M.direction(40, 0), 'east');
  assert.equal(M.direction(-40, 0), 'west');
  assert.equal(M.direction(20, -35), 'north-east');
  assert.equal(M.direction(-20, -35), 'north-west');
  assert.equal(M.direction(20, 35), 'south-east');
  assert.equal(M.direction(-20, 35), 'south-west');
  assert.equal(M.direction(3, 3), null);
});
