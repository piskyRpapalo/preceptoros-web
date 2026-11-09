// C8 live: a won fight becomes a garrison; every step walked is a tick of the Rust ledger (the real acho_ledger.wasm).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const H = req('../../public/game/holdings_wasm.js'), L = req('../../public/game/holdings_live.js');
async function ledger() {
  const { instance } = await WebAssembly.instantiate(readFileSync(new URL('../../public/game/acho_ledger.wasm', import.meta.url)), {});
  const led = H.fromExports(instance.exports); led.reset(); return led;
}
const win = (place, n) => ({ place, attackers: new Array(n).fill({}), combat: { gana: 'asalto' } });
test('a win: the winning squad stays at 95 % life, and the first win opens the stores once', async () => {
  const led = await ledger(), st = { step: 0, opened: false, names: {} };
  assert.equal(L.won(st, led, { place: 'b:workshop:3,1', attackers: [{}], combat: { gana: 'defensa' } }), null, 'a lost fight took a building');
  assert.match(L.won(st, led, win('b:workshop:3,1', 3)), /Workshop is yours: 3 waves/);
  assert.deepEqual(led.holdings(), [{ id: L.key('b:workshop:3,1'), kind: 'workshop', life: 950, waves: 3 }]);
  L.won(st, led, win('b:agora:1,1', 1));
  assert.deepEqual(led.balances(), { copper: 10, light: 0, biomass: 5, oxygen: 30 }, 'the stores opened twice');
});
test('the clock is steps: a raid on step 20 costs 10 %, told in words; yield and upkeep run every step', async () => {
  const led = await ledger(), st = { step: 0, opened: false, names: {} };
  L.won(st, led, win('b:workshop:3,1', 1));
  let told = [];
  for (let s = 1; s <= 20; s++) { told = told.concat(L.walked(st, led)); }
  assert.equal(told.length, 1); assert.match(told[0], /^Step 20: the NPC raided/);
  assert.equal(led.holdings()[0].life, 850, '950 minus one raid of 100');
  assert.ok(led.balances().copper > 10, 'the workshop yielded nothing');
  assert.equal(led.balances().oxygen, 30 - 20, 'one wave breathes one oxygen per step');
});
test('two waves on 30 oxygen starve on step 16: the stores push the visitor towards an oxygen building', async () => {
  const led = await ledger(), st = { step: 0, opened: false, names: {} };
  L.won(st, led, win('b:workshop:3,1', 2));
  const told = []; for (let s = 1; s <= 16; s++) { told.push(...L.walked(st, led)); }
  assert.deepEqual(told, ['Step 16: no oxygen left; the garrisons weaken.']);
});
test('an unknown kind holds as a visitor house; the key is stable', () => {
  assert.equal(L.kindOf('b:moonbase:0,0', ['workshop', 'visitor-house']), 'visitor-house');
  assert.equal(L.key('b:workshop:3,1'), L.key('b:workshop:3,1'));
  assert.notEqual(L.key('b:workshop:3,1'), L.key('b:workshop:3,2'));
});
