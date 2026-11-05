// Cases of the tutorial walk core (G4-1). Twice, with sabotages that must go red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const W = require('./tutorial_walk.js');
const ALL = { cabin: 'LIVE', beelink: 'LIVE' };
const NO_BEELINK = { cabin: 'LIVE', beelink: 'NO_DATA' };

test('each step is a place, and the six steps are in order', () => {
  assert.deepEqual(W.STEPS.map((s) => s.id), ['key', 'beacon', 'node']);
  assert.equal(W.placeFor('beacon'), 'beelink');
});

test('a place that is not alive is not walked; the refusal says NO_DATA', () => {
  const r = W.canWalk('beacon', { cabin: 'LIVE', beelink: 'NO_DATA' });
  assert.equal(r.ok, false);
  assert.match(r.cause, /^NO_DATA: place beelink is not alive/);
  assert.equal(W.canWalk('beacon', ALL).ok, true);
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

test('advance: entering the cabin plays the key; a second entry skips the dead beacon and plays the node', () => {
  let r = W.advance([], 'cabin', NO_BEELINK);
  assert.deepEqual(W.progress(r.log), ['key']);
  r = W.advance(r.log, 'cabin', NO_BEELINK);
  assert.deepEqual(W.progress(r.log), ['key', 'node']);
  assert.deepEqual(r.log.filter((e) => e.outcome === 'skipped').map((e) => e.step), ['beacon']);
  assert.match(r.said, /beacon skipped · NO_DATA/);
  assert.equal(W.nextStep(r.log), undefined);
});

test('advance: a dead place never blocks the walk and is never played', () => {
  const r = W.advance(W.record([], 'key', 'played'), 'cabin', NO_BEELINK);
  assert.equal(W.progress(r.log).includes('beacon'), false);
  assert.equal(r.log.find((e) => e.step === 'beacon').outcome, 'skipped');
});

test('advance: a walkable step waits for its place and is not recorded before', () => {
  const r = W.advance(W.record([], 'key', 'played'), 'cabin', ALL);
  assert.equal(r.log.length, 1);
  assert.match(r.said, /next step is at beelink/);
});

test('sabotage: advance never plays a step on a place that is not alive', () => {
  const r = W.advance([], 'beelink', NO_BEELINK);
  assert.equal(W.progress(r.log).includes('beacon'), false);
  assert.equal(r.log.some((e) => e.step === 'beacon' && e.outcome === 'played'), false);
});

test('close: at the end of a visit, open dead steps are skipped and walkable ones stay open', () => {
  const log = W.close(W.record([], 'key', 'played'), NO_BEELINK);
  assert.deepEqual(log.map((e) => e.step + ':' + e.outcome), ['key:played', 'beacon:skipped']);
  assert.equal(W.nextStep(log).id, 'node');
});

test('close: a walkable open step is not closed, so the walk can still finish', () => {
  const log = W.close(W.record([], 'key', 'played'), ALL);
  assert.equal(W.nextStep(log).id, 'beacon');
  assert.equal(log.length, 1);
});

test('close: does not record an already resolved step twice', () => {
  const base = W.record(W.record([], 'key', 'played'), 'beacon', 'skipped');
  assert.equal(W.close(base, NO_BEELINK).length, 2);
});

test('sabotage: a skipped step counted as progress is caught by advance and close', () => {
  const log = W.close([], NO_BEELINK);
  assert.equal(W.progress(log).length, 0);
});

test('the module still reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./tutorial_walk.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
