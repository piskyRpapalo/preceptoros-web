// Cases for the state file of /openworld/, schema v2 (ODD live-colony-nodes, IC7-S2). A node is drawn only when it is
// alive and sealed LIVE or STALE; a LIVE seal needs its dated measurement; an unknown seal or date is refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('./openworld_state.js');

const alive = (id, q, r, seal = 'LIVE', since = '2026-10-30') => ({ id, q, r, alive: true, seal, since });
const v2 = (nodes, buildings = [], units = []) => ({ esquema: S.V2, colonia: { nodes, buildings, units } });

test('schema v1 (the file on main today) carries no colony', () => {
  const r = S.leer({ esquema: S.V1, nodes: [] });
  assert.equal(r.version, 1);
  assert.equal(r.colonia, null);
});

test('the file on main reads as v1 with no colony', () => {
  const raw = JSON.parse(readFileSync(new URL('../../public/openworld/estado.json', import.meta.url), 'utf8'));
  assert.equal(S.leer(raw).colonia, null);
});

test('a missing schema is read as v1, so an old file keeps working', () => {
  assert.equal(S.leer({ nodes: [] }).version, 1);
  assert.equal(S.leer(undefined).version, 1);
});

test('v2: alive LIVE nodes are drawn, with their buildings', () => {
  const r = S.leer(v2([alive('beelink', 0, 0), alive('doggee-a', 1, 0)], [{ id: 'b1', node: 'beelink' }]));
  assert.equal(r.version, 2);
  assert.deepEqual(r.colonia.nodes.map((n) => n.id), ['beelink', 'doggee-a']);
  assert.deepEqual(r.colonia.buildings, [{ id: 'b1', node: 'beelink' }]);
  assert.equal(r.hidden, 0);
});

test('STALE is drawn too: it is shown with its own seal, not as LIVE', () => {
  const r = S.leer(v2([alive('doggee-a', 1, 0, 'STALE', '2026-10-01')]));
  assert.equal(r.colonia.nodes.length, 1);
  assert.equal(r.seals['doggee-a'], 'STALE');
});

test('a node that is not alive, or sealed NO_DATA or ERROR, is never drawn; it is counted as hidden', () => {
  const r = S.leer(v2([
    alive('a', 0, 0),
    { id: 'b', q: 1, r: 0, alive: false, seal: 'LIVE', since: '2026-10-30' },
    { id: 'c', q: 0, r: 1, alive: true, seal: 'NO_DATA', since: null },
    { id: 'd', q: -1, r: 0, alive: true, seal: 'ERROR', since: null }
  ]));
  assert.deepEqual(r.colonia.nodes.map((n) => n.id), ['a']);
  assert.equal(r.hidden, 3);
});

test('a building on a hidden node is dropped, never drawn on nothing', () => {
  const r = S.leer(v2([alive('a', 0, 0), { id: 'b', q: 1, r: 0, alive: false, seal: 'LIVE', since: '2026-10-30' }],
    [{ id: 'b1', node: 'a' }, { id: 'b2', node: 'b' }]));
  assert.deepEqual(r.colonia.buildings, [{ id: 'b1', node: 'a' }]);
});

test('sabotage: a LIVE seal without a dated measurement is refused, never shown as live', () => {
  assert.throws(() => S.leer(v2([{ id: 'a', q: 0, r: 0, alive: true, seal: 'LIVE', since: null }])), /LIVE without a dated measurement/);
});

test('sabotage: an unknown seal is refused, not guessed', () => {
  assert.throws(() => S.leer(v2([{ id: 'a', q: 0, r: 0, alive: true, seal: 'PROBABLE', since: null }])), /unknown seal/);
});

test('sabotage: a malformed date is refused', () => {
  assert.throws(() => S.leer(v2([alive('a', 0, 0, 'LIVE', '30/10/2026')])), /malformed date/);
});

test('sabotage: two buildings on one node are refused by IC1, at most one per node', () => {
  assert.throws(() => S.leer(v2([alive('a', 0, 0)], [{ id: 'b1', node: 'a' }, { id: 'b2', node: 'a' }])), Error);
});

test('sabotage: an unknown schema is refused', () => {
  assert.throws(() => S.leer({ esquema: 'preceptoros.openworld-estado/9', colonia: {} }), /unknown schema/);
});

test('v2 without its colonia arrays is refused', () => {
  assert.throws(() => S.leer({ esquema: S.V2 }), /needs colonia with nodes and buildings arrays/);
});

test('the same state gives the same colony, two runs', () => {
  const s = v2([alive('a', 0, 0), alive('b', 1, 0)], [{ id: 'b1', node: 'a' }]);
  assert.equal(JSON.stringify(S.leer(s)), JSON.stringify(S.leer(s)));
});

test('the served copy under public/game is the same file as the source', () => {
  const sha = (u) => createHash('sha256').update(readFileSync(new URL(u, import.meta.url))).digest('hex');
  assert.equal(sha('./openworld_state.js'), sha('../../public/game/openworld_state.js'));
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./openworld_state.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});

test('IC7-S4 (D11): look defaults to basic; zombie is returned for the visible node that declares it', () => {
  const r = S.leer(v2([
    { id: 'beelink', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-10-30' },
    { id: 'doggee-a', q: 2, r: 0, alive: true, seal: 'LIVE', since: '2026-10-30', look: 'zombie' }
  ]));
  assert.deepEqual(r.looks, { beelink: 'basic', 'doggee-a': 'zombie' });
});

test('sabotage: an unknown look is refused, never drawn with a guessed face', () => {
  assert.throws(() => S.leer(v2([{ id: 'a', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-10-30', look: 'neon' }])), /unknown look/);
});

test('IC7-S4: Doggee on two adjacent nodes, one building each, is accepted by IC1', () => {
  const r = S.leer(v2([
    { id: 'doggee-a', q: 2, r: 0, alive: true, seal: 'LIVE', since: '2026-10-30', look: 'zombie' },
    { id: 'doggee-b', q: 2, r: -1, alive: true, seal: 'LIVE', since: '2026-10-30', look: 'zombie' }
  ], [{ id: 'b-a', node: 'doggee-a' }, { id: 'b-b', node: 'doggee-b' }]));
  assert.equal(r.colonia.buildings.length, 2);
});
