// Cases of the tutorial walk core (G4-1). Twice, with sabotages that must go red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const W = require('./tutorial_walk.js');
const ALL = { cabin: 'LIVE', beelink: 'LIVE', 'doggee-a': 'LIVE', 'doggee-b': 'LIVE' };

test('each step is a place, and the six steps are in order', () => {
  assert.deepEqual(W.STEPS.map((s) => s.id), ['key', 'beacon', 'egg', 'hatch', 'fight', 'node']);
  assert.equal(W.placeFor('beacon'), 'beelink');
});

test('a place that is not alive is not walked; the refusal says NO_DATA', () => {
  const r = W.canWalk('egg', { cabin: 'LIVE', 'doggee-a': 'NO_DATA' });
  assert.equal(r.ok, false);
  assert.match(r.cause, /^NO_DATA: place doggee-a is not alive/);
  assert.equal(W.canWalk('egg', ALL).ok, true);
});

test('a skipped step is kept as skipped and is not progress', () => {
  const log = W.record(W.record([], 'key', 'skipped'), 'beacon', 'played');
  assert.deepEqual(W.progress(log), ['beacon']);
});

test('progress is only what was played, in the order of the steps', () => {
  let log = [];
  log = W.record(log, 'beacon', 'played');
  log = W.record(log, 'key', 'played');
  assert.deepEqual(W.progress(log), ['key', 'beacon']);
});

test('record never mutates the log it receives', () => {
  const base = W.record([], 'key', 'played');
  W.record(base, 'beacon', 'played');
  assert.equal(base.length, 1);
});

test('sabotage: a step with no place is refused', () => {
  assert.throws(() => W.placeFor('ghost'), /unknown step/);
});

test('sabotage: an outcome other than played or skipped is refused, never counted', () => {
  assert.throws(() => W.record([], 'key', 'done'), /outcome must be played or skipped/);
});

test('sabotage: a skip counted as progress would be caught by the progress test', () => {
  const log = W.record([], 'key', 'skipped');
  assert.deepEqual(W.progress(log), []);
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./tutorial_walk.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
