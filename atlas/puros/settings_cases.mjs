// The settings wheel: what the sheet holds. Build moved to the Conquest sheet (conquest_cases.mjs, C3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../../public/game/settings_sheet.js');
test('the sheet holds the device and notes groups; Build is not here any more (it lives in Town › Conquest)', () => {
  assert.deepEqual(S.GROUPS.map((g) => g[0]), ['Device', 'Notes']);
  assert.ok(!S.GROUPS.some((g) => g[1].some((o) => /^build:/.test(o[0]))));
});
