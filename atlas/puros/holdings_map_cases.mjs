// holdings_map.js · the garrisons on the map: the bar's tone and percent, and what a ledger reading says changed.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const M = createRequire(import.meta.url)('../../public/game/holdings_map.js');
test('pct and tone follow the ledger\'s thousandths: 950 → 95 % green, 400 → gold, 200 → red', () => {
  assert.equal(M.pct(950), 95); assert.equal(M.pct(1200), 100); assert.equal(M.pct(-5), 0);
  assert.equal(M.tone(950), 'LIVE.base'); assert.equal(M.tone(400), 'PROPUESTA.base'); assert.equal(M.tone(200), 'FIRMADO.base');
});
test('diff: a raid is a loss of at least 100 (the C8 10 %), a missing id is a building lost', () => {
  assert.deepEqual(M.diff({ 1: 950, 2: 600 }, { 1: 850, 2: 600 }), { raided: ['1'], lost: [] });
  assert.deepEqual(M.diff({ 1: 950 }, {}), { raided: [], lost: ['1'] });
  assert.deepEqual(M.diff({ 1: 950 }, { 1: 949 }), { raided: [], lost: [] }); // oxygen wear is not a raid
});
test('sabotage: a raid of 99 points is not told as a raid', () => {
  assert.equal(M.diff({ 7: 900 }, { 7: 801 }).raided.length, 0);
});
