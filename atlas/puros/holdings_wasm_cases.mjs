// C8 holdings: the real acho_ledger.wasm through the page wrapper, plus the NO_DATA paths of load().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const WASM = process.env.ACHO_WASM || new URL('../../public/game/acho_ledger.wasm', import.meta.url);
const JS = process.env.HOLDINGS_JS || fileURLToPath(new URL('../../public/game/holdings_wasm.js', import.meta.url));
const H = createRequire(import.meta.url)(JS);
async function fresh() {
  const m = await WebAssembly.instantiate(fs.readFileSync(WASM), {});
  const A = H.fromExports(m.instance.exports);
  A.reset();
  return A;
}
test('reset, grant, conquer, tick: the real module gives the contract numbers', async () => {
  const A = await fresh();
  A.grant(3, 100, 0);
  assert.equal(A.conquer(7, 'workshop', 2, 1000), true);
  assert.deepEqual(A.tick(1), { raided: false, fell: false, retaken: false, starved: false });
  assert.equal(A.balances().copper, 6);
  assert.equal(A.balances().oxygen, 98);
  assert.deepEqual(A.holdings(), [{ id: 7, kind: 'workshop', life: 1000, waves: 2 }]);
  assert.match(A.head(), /^[0-9a-f]{64}$/);
  assert.equal(A.verify(), true);
  assert.equal(A.heal(2, 7), null, 'a full life is refused');
  assert.equal(A.conquer(8, 9, 1, 1000), true, 'kind by index');
  assert.equal(A.conquer(9, 10, 1, 1000), false, 'kind out of range');
  assert.equal(A.conquer(9, 'nope', 1, 1000), false, 'unknown kind name');
});
test('raided shows at tick 20 and not before, with 20 ticks', async () => {
  const A = await fresh();
  A.grant(3, 100, 0);
  A.conquer(7, 'workshop', 2, 1000);
  const first = [];
  for (let t = 1; t <= 20; t++) { if (A.tick(t).raided) { first.push(t); } }
  assert.deepEqual(first, [20]);
});
test('load() without fetch or WebAssembly resolves NO_DATA and never throws', async () => {
  const f = globalThis.fetch;
  globalThis.fetch = undefined;
  try {
    const r = await H.load('/game/acho_ledger.wasm');
    assert.equal(r.estado, 'NO_DATA');
    assert.match(r.causa, /fetch/);
  } finally { globalThis.fetch = f; }
});
test('load() with a fetch that returns the wasm bytes gives a working api', async () => {
  const bytes = fs.readFileSync(WASM);
  const f = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, arrayBuffer: async () => bytes });
  try {
    const A = await H.load('/game/acho_ledger.wasm');
    assert.equal(typeof A.tick, 'function');
    assert.deepEqual(A.balances(), { copper: 0, light: 0, biomass: 0, oxygen: 0 });
  } finally { globalThis.fetch = f; }
});
test('load() with a failing response resolves NO_DATA with the cause', async () => {
  const f = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  try {
    const r = await H.load('/game/nope.wasm');
    assert.deepEqual(r, { estado: 'NO_DATA', causa: 'load failed: HTTP 404' });
  } finally { globalThis.fetch = f; }
});
