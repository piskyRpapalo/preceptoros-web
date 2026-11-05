// W1 SHA-256 wave-duel cases. The suite runs twice in the web gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const crypto = require('node:crypto');
const D = require('./wave_duel.js');

test('same seeds produce byte-identical SHA-256 logs and outcomes twice', async () => {
  const first = await D.duel('a1', 'b1', 20);
  const second = await D.duel('a1', 'b1', 20);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.ok(first.log.every(event => /^[0-9a-f]{64}$/.test(event.commitA) && /^[0-9a-f]{64}$/.test(event.commitB)));
});

test('commit is standard SHA-256 over the versioned commitment bytes', async () => {
  const expected = crypto.createHash('sha256').update('preceptoros.wave-duel-commit/1|A|1|nonce').digest('hex');
  assert.equal(await D.commit('A', 1, 'nonce'), expected);
  assert.equal((await D.commit('A', 1, 'nonce')).length, 64);
});

test('every commitment and deterministic move in the replay verifies', async () => {
  const replay = await D.duel('a2', 'b2', 30);
  assert.equal(await D.verify(replay, 'a2', 'b2'), true);
});

test('wrong seed, altered reveal and altered commitment fail verification', async () => {
  const replay = await D.duel('a2', 'b2', 30);
  assert.equal(await D.verify(replay, 'a2', 'other'), false);
  const changedMove = structuredClone(replay);
  changedMove.log[0].moveA = (changedMove.log[0].moveA + 1) % 3;
  assert.equal(await D.verify(changedMove, 'a2', 'b2'), false);
  const changedCommit = structuredClone(replay);
  changedCommit.log[0].commitA = '0'.repeat(64);
  assert.equal(await D.verify(changedCommit, 'a2', 'b2'), false);
});

test('a duel without two seeds or with invalid rounds is refused', async () => {
  await assert.rejects(D.duel('', 'b', 5), /two seeds/);
  await assert.rejects(D.duel('a', undefined, 5), /two seeds/);
  await assert.rejects(D.duel('a', 'b', -1), /rounds/);
  await assert.rejects(D.duel('a', 'b', 1.5), /rounds/);
});

test('abandonment at 900 cycles is recorded, not hidden', async () => {
  const replay = await D.duel('a4', 'b4', 950);
  assert.equal(replay.log.length, 900);
  assert.equal(replay.outcome.abandoned, true);
  assert.equal(replay.outcome.abandonedAt, 900);
});

test('balance stays caused NO_DATA, never a value invented by the core', async () => {
  assert.match((await D.duel('a5', 'b5', 3)).outcome.balance, /^NO_DATA/);
});

test('the core uses no non-cryptographic hash, random source, clock or network', () => {
  const source = readFileSync(new URL('./wave_duel.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /FNV|fnv|Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
