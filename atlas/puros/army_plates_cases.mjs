// Army plates (public/game/army_plates.js): the visit's waves as a list. Only signed troops with a seed are listed;
// each row says its base, rarity, TC and life, or NO_DATA. Pure laws.   node --test atlas/puros/army_plates_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const A = createRequire(import.meta.url)('../../public/game/army_plates.js');
const troop = (semilla, extra = {}) => ({ adopcion: { tropa: { semilla, tc: 'tc1', base: 'pez', rareza: 'normal', stats: { vida: 11 }, armonicos: [], ...extra } }, firma: 'f' });

test('one row per signed troop, in the visit order', () => {
  const R = A.rows([troop('a'), troop('b', { rareza: 'raro', tc: 'tc2' })]);
  assert.deepEqual(R.map((r) => [r.seed, r.tc, r.rarity]), [['a', 'tc1', 'normal'], ['b', 'tc2', 'raro']]);
});
test('the row says its words: base, rarity, TC and life', () => {
  assert.equal(A.rows([troop('a')])[0].label, 'Wave pez · normal · tc1 · life 11');
});
test('no life measured → NO_DATA, never a made-up number', () => {
  const r = A.rows([troop('a', { stats: {} })])[0];
  assert.equal(r.life, null); assert.match(r.label, /life NO_DATA$/);
});
test('records without a seed, or not a troop at all, are not listed', () => {
  assert.deepEqual(A.rows([null, {}, { adopcion: {} }, troop(42)]), []);
  assert.deepEqual(A.rows(undefined), []);
});
