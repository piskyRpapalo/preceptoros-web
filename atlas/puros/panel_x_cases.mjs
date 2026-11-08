// Panels close: which accepted actions close their panel and which also zoom onto the crab.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const X = createRequire(import.meta.url)('../../public/game/panel_x.js');
test('actions the crab carries out close the panel; summon and build also look at the crab', () => {
  assert.equal(X.verdict('visitor-summon-tc1'), 'close+look');
  assert.equal(X.verdict('visitor-beacon'), 'close+look');
  assert.equal(X.verdict('set-build-hostel'), 'close+look');
  assert.equal(X.verdict('visitor-fight-arrecife'), 'close');
  assert.equal(X.verdict('visitor-hatch-1'), 'close');
});
test('settings of the device and plain panel buttons leave the panel open', () => {
  for (const id of ['set-letters', 'set-audio', 'visitor-start', 'gp-town', '', undefined]) { assert.equal(X.verdict(id), null, String(id)); }
});
