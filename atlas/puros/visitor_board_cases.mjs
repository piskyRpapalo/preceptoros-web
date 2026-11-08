// The House board (second block of visitor_view.js): the pure helpers. stats() is what a child reads on a troop card; figure() is the troop's own
// Fourier figure (the PR #15 language). node --test atlas/puros/visitor_board_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('../../public/game/visitor_view.js');
const B = globalThis.AtlasVisitorBoard;

test('stats: the rank first, then every stat above zero, in English', () => {
  assert.deepEqual(B.stats({ rareza: 'magico', stats: { vida: 10, armadura: 4, velocidad: 10, sigilo: 0 } }),
    [['Rank', 'Magic'], ['Life', 10], ['Armour', 4], ['Speed', 10]]);
});
test('stats: an unknown troop says NO_DATA, never a guess', () => {
  assert.deepEqual(B.stats(null), [['Rank', 'NO_DATA']]);
});
test('figure: a closed path inside the 0..100 box, the same for the same harmonics', () => {
  const t = { armonicos: [[1, 24, 24, 0], [-3, 15, 15, 47], [9, 3, 3, 34]] };
  const d = B.figure(t);
  assert.match(d, /^M[\d.]+ [\d.]+(L[\d.]+ [\d.]+)+Z$/);
  for (const n of d.match(/[\d.]+/g).map(Number)) { assert.ok(n >= 0 && n <= 100, 'outside the box: ' + n); }
  assert.equal(B.figure(t), d);
});
test('figure: no harmonics, no figure', () => {
  assert.equal(B.figure({}), '');
});
