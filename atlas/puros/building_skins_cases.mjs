// building_skins.js · each building's card wears its function; a conquering visitor may choose skin, name and accent.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), S = req('../../public/game/building_skins.js');
const kinds = JSON.parse(req('node:fs').readFileSync(new URL('../../public/game/building_interiors.json', import.meta.url))).buildings.map((b) => b.id);
test('every building with an interior has its own skin: a motto and an emblem path', () => {
  kinds.forEach((k) => { assert.ok(S.SKINS[k], 'no skin for ' + k); assert.ok(S.SKINS[k][0].length > 8); assert.match(S.SKINS[k][1], /^M[\d .,\-MLHVAZlhvazs]+$/i); });
  assert.equal(new Set(Object.values(S.SKINS).map((s) => s[0])).size, Object.keys(S.SKINS).length, 'two buildings share a motto');
});
test('skinOf: the visitor\'s choice when known, else the building\'s own, else none', () => {
  assert.equal(S.skinOf('customs', { skin: 'lottery' }), 'lottery');
  assert.equal(S.skinOf('customs', { skin: 'casino' }), 'customs');
  assert.equal(S.skinOf('nowhere', null), null);
});
test('clean: a visitor\'s name keeps letters, digits and . - \' only, 2..24 characters', () => {
  assert.equal(S.clean('Crab Casino <b>'), 'Crab Casino b');
  assert.equal(S.clean('  x '), null);
  assert.equal(S.clean('a'.repeat(40)).length, 24);
  assert.equal(S.clean('<img src=x onerror=1>'), 'img srcx onerror1');
});
test('sabotage: markup never survives into a name', () => {
  assert.ok(!/[<>"&=]/.test(S.clean('"><script>alert(1)</script>') || ''));
});
test('below: a card with less than half of itself above the fold is counted as hidden', () => {
  assert.equal(S.below([[10, 60], [200, 260], [600, 660], [900, 960]], 716), 1);
  assert.equal(S.below([[10, 60], [200, 260]], 716), 0);
  assert.equal(S.below([[475, 530]], 486), 1, 'Settings at 420x640: 11 of 55 px in view is hidden');
  assert.equal(S.below([[440, 500]], 486), 0, 'more than half in view is visible');
});
