// The Town actions table answers exactly the actions the interiors contract declares, and fails closed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const TA = require('../../public/game/town_actions.js');
const doc = JSON.parse(readFileSync(new URL('../../public/game/building_interiors.json', import.meta.url), 'utf8'));

test('the table and the contract name the same actions', () => {
  assert.deepEqual(TA.NAMES.slice().sort(), Object.keys(doc.actions).sort());
});

test('every LIVE option with an action points at a declared action', () => {
  doc.buildings.forEach((b) => b.options.forEach((o) => { if (o.action) assert.ok(TA.NAMES.includes(o.action), o.action); }));
});

test('an unknown action says NO_DATA · action_unknown and loads nothing', () => {
  let loads = 0, said = null;
  TA.run('nope', { load: () => { loads++; } }, (t) => { said = t; });
  assert.equal(said, 'NO_DATA · action_unknown');
  assert.equal(loads, 0);
});

test('a piece that does not load says NO_DATA · piece_not_loaded', () => {
  let said = null;
  TA.run('gaps', { load: (src, name, then) => then(null) }, (t) => { said = t; });
  assert.equal(said, 'NO_DATA · piece_not_loaded');
});

test('gaps runs through the real gap board with the contract', () => {
  const G = require('../../public/game/gap_board.js');
  let said = null, asked = null;
  TA.run('gaps', { data: doc, load: (src, name, then) => { asked = [src, name]; then(G); } }, (t) => { said = t; });
  assert.deepEqual(asked, ['/game/gap_board.js', 'AtlasGapBoard']);
  assert.equal(said, G.board(doc).line);
});

test('typo without a selection asks the person to select first; nothing is saved', () => {
  const T = require('../../public/game/typo_report.js');
  const saved = [];
  const win = { getSelection: () => '', location: { pathname: '/openworld/' },
    localStorage: { length: 0, key: () => null, getItem: () => null, setItem: (k) => saved.push(k) } };
  let said = null;
  TA.run('typo', { win, load: (s, n, then) => then(T) }, (t) => { said = t; });
  assert.match(said, /^NO_DATA · nothing_selected · select the wrong words first$/);
  assert.equal(saved.length, 0);
});

test('the actions piece stays small', () => {
  assert.ok(statSync(new URL('../../public/game/town_actions.js', import.meta.url)).size <= 4096);
});
