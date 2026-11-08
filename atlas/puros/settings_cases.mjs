// The settings wheel: where a building may be built from Settings, and what the sheet holds.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../../public/game/settings_sheet.js');
const sand = [5, 0, 1, 'sand'], water = [5, 0, 0, 'water'];
test('a building stands only on free dry floor outside the cabin clearing, up to the device cap', () => {
  assert.equal(S.why(sand, {}, [], 5, 0), null);
  assert.equal(S.why(null, {}, [], 5, 0), 'no_floor_here');
  assert.equal(S.why(water, {}, [], 5, 0), 'water_cannot_hold_a_building');
  assert.equal(S.why(sand, {}, [], 1, 1), 'the_cabin_clearing_stays_free');
  assert.equal(S.why(sand, { '5,0': {} }, [], 5, 0), 'a_building_already_stands_here');
  assert.equal(S.why(sand, {}, Array(S.CAP).fill({}), 5, 0), 'this_device_holds_' + S.CAP + '_buildings');
});
test('the sheet holds the device, notes and build groups; every build kind has a roof and a tone', () => {
  assert.deepEqual(S.GROUPS.map((g) => g[0]), ['Device', 'Notes', 'Build']);
  assert.ok(S.GROUPS[2][1].length === S.KINDS.length && S.KINDS.every((k) => k[2] && k[3]));
  assert.deepEqual(S.read({ localStorage: { getItem: () => 'not json' } }), []);
});
