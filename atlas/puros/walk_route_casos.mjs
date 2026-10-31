// Cases of the route over visible nodes (W-2). Offline and synthetic: no network, no clock, no random numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const R = require('./walk_route.js');

// A straight row of four nodes, plus one far node.
const NODOS = [{ id: 'a', q: 0, r: 0 }, { id: 'b', q: 1, r: 0 }, { id: 'c', q: 2, r: 0 }, { id: 'd', q: 3, r: 0 }, { id: 'lejos', q: 9, r: 9 }];
const TODOS_VIVOS = { a: 'LIVE', b: 'STALE', c: 'LIVE', d: 'LIVE', lejos: 'LIVE' };

test('an adjacent visible node is one step away', () => {
  const r = R.route(NODOS, TODOS_VIVOS, 'a', 'b');
  assert.equal(r.ok, true);
  assert.deepEqual(r.path, ['a', 'b']);
});

test('a two-hop route follows the visible nodes in order', () => {
  const r = R.route(NODOS, TODOS_VIVOS, 'a', 'c');
  assert.deepEqual(r.path, ['a', 'b', 'c']);
  assert.equal(R.checkPath(NODOS, TODOS_VIVOS, r.path).ok, true);
});

test('a route to the node it stands on is that node alone', () => {
  assert.deepEqual(R.route(NODOS, TODOS_VIVOS, 'a', 'a').path, ['a']);
});

test('an unreachable target is refused with NO_DATA and a cause', () => {
  const r = R.route(NODOS, TODOS_VIVOS, 'a', 'lejos');
  assert.equal(r.ok, false);
  assert.match(r.cause, /^NO_DATA: lejos cannot be reached/);
  assert.deepEqual(r.path, []);
});

test('a node that is NO_DATA is never on a route: it blocks the way through', () => {
  const seals = { a: 'LIVE', b: 'NO_DATA', c: 'LIVE', d: 'LIVE' };
  const r = R.route(NODOS, seals, 'a', 'c');
  assert.equal(r.ok, false);
  assert.match(r.cause, /cannot be reached/);
});

test('a start or a target that is not alive is refused with NO_DATA', () => {
  assert.match(R.route(NODOS, { ...TODOS_VIVOS, a: 'NO_DATA' }, 'a', 'b').cause, /^NO_DATA: a is not alive/);
  assert.match(R.route(NODOS, { ...TODOS_VIVOS, b: 'NO_DATA' }, 'a', 'b').cause, /^NO_DATA: b is not alive/);
});

test('a target that is not a node at all is refused, never walked to', () => {
  const r = R.route(NODOS, TODOS_VIVOS, 'a', 'hueco');
  assert.equal(r.ok, false);
  assert.match(r.cause, /^unknown node/);
});

test('the same input gives the same route, every time', () => {
  const x = R.route(NODOS, TODOS_VIVOS, 'a', 'd');
  const y = R.route(NODOS, TODOS_VIVOS, 'a', 'd');
  assert.deepEqual(x, y);
});

test('sabotage: a route through a hex with no node is refused', () => {
  const r = R.checkPath(NODOS, TODOS_VIVOS, ['a', 'hueco', 'c']);
  assert.equal(r.ok, false);
  assert.match(r.cause, /hex without a node/);
});

test('sabotage: a route that jumps two hexes at once is refused', () => {
  const r = R.checkPath(NODOS, TODOS_VIVOS, ['a', 'c']);
  assert.equal(r.ok, false);
  assert.match(r.cause, /not adjacent/);
});

test('sabotage: a route that passes a node which is not alive is refused', () => {
  const r = R.checkPath(NODOS, { ...TODOS_VIVOS, b: 'NO_DATA' }, ['a', 'b']);
  assert.equal(r.ok, false);
  assert.match(r.cause, /^NO_DATA: b is not alive/);
});

test('a walk counts frames: each step takes FRAMES frames, and the walker ends on the last node', () => {
  let w = R.startWalk(['a', 'b', 'c'], false);
  let frames = 0;
  while (!R.doneWalk(w)) { w = R.advanceWalk(w); frames++; }
  assert.equal(frames, 2 * R.FRAMES);
  assert.equal(R.poseOf(w).node, 'c');
  assert.equal(R.poseOf(w).to, null);
});

test('mid-step the pose says where the walker is going and how far along it is', () => {
  let w = R.startWalk(['a', 'b'], false);
  for (let k = 0; k < R.FRAMES / 2; k++) { w = R.advanceWalk(w); }
  const p = R.poseOf(w);
  assert.equal(p.node, 'a');
  assert.equal(p.to, 'b');
  assert.equal(p.fraction, 0.5);
});

test('reduced motion arrives in one step: one frame is enough', () => {
  let w = R.startWalk(['a', 'b', 'c'], true);
  w = R.advanceWalk(w);
  assert.equal(R.doneWalk(w), true);
  assert.equal(R.poseOf(w).node, 'c');
});

test('a finished walk stays where it is', () => {
  const w = R.advanceWalk(R.startWalk(['a'], false));
  assert.equal(R.doneWalk(w), true);
  assert.deepEqual(R.advanceWalk(w), w);
});

test('sabotage: a walk that teleports (finishes in one frame without reduced motion) is caught by the frame count', () => {
  let w = R.startWalk(['a', 'b'], false);
  w = R.advanceWalk(w);
  assert.equal(R.doneWalk(w), false);
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./walk_route.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
