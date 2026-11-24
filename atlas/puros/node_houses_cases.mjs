// Every node its own house (public/game/node_houses.js): only what the gateway lists, only for LIVE nodes, S stays the
// only tower. Pure laws.   node --test atlas/puros/node_houses_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const H = createRequire(import.meta.url)('../../public/game/node_houses.js');
const TALKS = { 'primer-ancla': 'Node 0' };
const live = (id, q, r) => ({ id, q, r, alive: true, seal: 'LIVE', since: '2026-11-24' });
const D = { ok: true, nodes: [live('primer-ancla', 0, 0), live('doggee-s110', 2, 0), { id: 'tank-3', q: 3, r: 0, alive: false, seal: 'STALE' }],
  buildings: [{ id: 'observatorio-primer-ancla', node: 'primer-ancla' }, { id: 'casa-doggee-s110', node: 'doggee-s110' }, { id: 'casa-tank-3', node: 'tank-3' }] };

test('a LIVE node with a listed building gets one house on its own cell', () => {
  assert.deepEqual(H.pick(D, TALKS), [{ id: 'casa-doggee-s110', node: 'doggee-s110', q: 2, r: 0 }]);
});
test('S stays the only tower: the talking node and nodes with a principal building get no second house', () => {
  assert.ok(!H.pick(D, TALKS).some((h) => h.node === 'primer-ancla'));
  assert.deepEqual(H.pick({ ...D, principalBuildings: [{ id: 'x', node: 'doggee-s110' }] }, TALKS), []);
});
test('a node that is not LIVE has no house (Tank 3 asleep stays bare)', () => {
  assert.ok(!H.pick(D, TALKS).some((h) => h.node === 'tank-3'));
});
test('no measured data, no house: never a placeholder', () => {
  assert.deepEqual(H.pick({ ...D, ok: false }, TALKS), []);
  assert.deepEqual(H.pick(null, TALKS), []);
  assert.deepEqual(H.pick({ ok: true, nodes: D.nodes }, TALKS), []);
});
test('one house per node even if the list repeats it', () => {
  const two = { ...D, buildings: D.buildings.concat([{ id: 'casa-2', node: 'doggee-s110' }]) };
  assert.equal(H.pick(two, TALKS).length, 1);
});
