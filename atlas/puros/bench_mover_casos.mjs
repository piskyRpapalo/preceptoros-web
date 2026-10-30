// Cases of the seeded mover (BM-1). Twice, with sabotages that must go red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const M = require('./bench_mover.js');
const NODES = [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }, { id: 'ring-w', q: -1, r: 0 },
  { id: 'doggee-a', q: 2, r: 0 }, { id: 'ring-ne', q: 1, r: -1 }];
const SEALS = { cabin: 'LIVE', 'ring-e': 'LIVE', 'ring-w': 'STALE', 'doggee-a': 'NO_DATA', 'ring-ne': 'LIVE' };
const START = { id: 'cabin', q: 0, r: 0 };

test('the same seed gives the same path, twice', () => {
  const a = M.walk('seed-1', START, NODES, SEALS, 12);
  const b = M.walk('seed-1', START, NODES, SEALS, 12);
  assert.deepEqual(a, b);
});

test('the walk never enters a node that is not alive', () => {
  const r = M.walk('seed-2', START, NODES, SEALS, 30);
  assert.ok(r.path.every((id) => ['LIVE', 'STALE'].includes(SEALS[id])), JSON.stringify(r.path));
  assert.ok(!r.path.includes('doggee-a'));
});

test('different seeds can give different paths', () => {
  const paths = ['s1', 's2', 's3', 's4', 's5'].map((s) => M.walk(s, START, NODES, SEALS, 8).path.join('>'));
  assert.ok(new Set(paths).size > 1);
});

test('the walk stops, with its cause, when no neighbour is alive', () => {
  const r = M.walk('seed-3', START, [{ id: 'cabin', q: 0, r: 0 }], { cabin: 'LIVE' }, 5);
  assert.deepEqual(r.path, []);
  assert.equal(r.stopped, 'no live neighbour');
});

test('sabotage: a walk with no seed is refused', () => {
  assert.throws(() => M.walk('', START, NODES, SEALS, 3), /needs a seed/);
  assert.throws(() => M.walk(undefined, START, NODES, SEALS, 3), /needs a seed/);
});

test('sabotage: a number of steps that is not whole is refused', () => {
  assert.throws(() => M.walk('s', START, NODES, SEALS, 2.5), /whole number/);
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./bench_mover.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
