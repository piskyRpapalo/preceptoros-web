// Cases of the wave duel (BM-2). Twice, with sabotages that must go red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const D = require('./wave_duel.js');

test('the same seeds give the same log and outcome, twice', () => {
  assert.equal(JSON.stringify(D.duel('a1', 'b1', 20)), JSON.stringify(D.duel('a1', 'b1', 20)));
});

test('every commitment in the log opens to its recorded move', () => {
  const r = D.duel('a2', 'b2', 30);
  assert.equal(D.verify(r, 'a2', 'b2'), true);
});

test('sabotage: a log verified with the wrong seed fails the commitments', () => {
  const r = D.duel('a2', 'b2', 30);
  assert.equal(D.verify(r, 'a2', 'other'), false);
});

test('sabotage: a changed move in the log no longer opens its commitment', () => {
  const r = D.duel('a3', 'b3', 10);
  r.log[0].moveA = (r.log[0].moveA + 1) % 3;
  assert.equal(D.verify(r, 'a3', 'b3'), false);
});

test('sabotage: a duel with no seed is refused', () => {
  assert.throws(() => D.duel('', 'b', 5), /two seeds/);
  assert.throws(() => D.duel('a', undefined, 5), /two seeds/);
});

test('an abandonment at 900 cycles is recorded, not hidden', () => {
  const r = D.duel('a4', 'b4', 950);
  assert.equal(r.log.length, 900);
  assert.equal(r.outcome.abandoned, true);
  assert.equal(r.outcome.abandonedAt, 900);
});

test('the balance is NO_DATA, never a value invented by the core', () => {
  assert.match(D.duel('a5', 'b5', 3).outcome.balance, /^NO_DATA/);
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./wave_duel.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
