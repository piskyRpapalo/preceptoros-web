// guide_next.js · the guide names the next real step, with a place and a distance.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const G = createRequire(import.meta.url)('../../public/game/guide_next.js'), L = G.line;
const S = (o) => Object.assign({ copper: 0, claimed: false, troops: [], eggs: [] }, o);
test('fresh visit: the beacon, not «ask the guide»', () => { assert.match(L(S({}), null, []), /beacon/); });
test('copper or an egg: the caller keeps its summon/gestation line', () => {
  assert.equal(L(S({ claimed: true, copper: 100 }), null, []), null);
});
test('a troop and fog: the nearest grey building, with its distance', () => {
  const m = [{ q: 4, r: 0, fog: true }, { q: 1, r: 1, fog: true }];
  assert.match(L(S({ claimed: true, troops: [1] }), { q: 0, r: 0 }, m), /· 2 hexes away/);
  assert.match(L(S({ claimed: true, troops: [1] }), { q: 1, r: 1 }, m), /You stand at a grey building/);
});
test('every building won: hold them; nothing known: null', () => {
  assert.match(L(S({ claimed: true, troops: [1] }), null, [{ q: 1, r: 0, won: true }]), /Every building is yours/);
  assert.equal(L(null), null);
});
test('sabotage: one hex is singular', () => { assert.match(L(S({ claimed: true, troops: [1] }), { q: 0, r: 0 }, [{ q: 1, r: 0, fog: true }]), /· 1 hex away/); });
