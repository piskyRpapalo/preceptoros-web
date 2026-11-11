// Building doors: every door is a LIVE option of the interiors contract and leads to a real category of the page;
// a door fails closed. Uso: node --test atlas/puros/building_doors_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const D = require('../../public/game/building_doors.js');
const P = require('../../public/game/terminal_panel.js');
const doc = JSON.parse(readFileSync(new URL('../../public/game/building_interiors.json', import.meta.url), 'utf8'));
const options = doc.buildings.flatMap((b) => b.options);

test('every door is one LIVE option without an action, named once in the contract', () => {
  Object.keys(D.DOORS).forEach((id) => {
    const found = options.filter((o) => o.id === id);
    assert.equal(found.length, 1, id);
    assert.ok(found[0].piece && !found[0].action, id);
  });
});

test('every door leads to a category that has its own button on the page', () => {
  const cats = P.CATS.filter((c) => c.button).map((c) => c.name);
  Object.values(D.DOORS).forEach((cat) => assert.ok(cats.includes(cat), cat));
});

test('measured: LIVE options that do something when pressed go from 8 to 15 of 31', () => {
  const live = options.filter((o) => o.piece);
  const acts = live.filter((o) => o.action).length, doors = live.filter((o) => !o.action && D.DOORS[o.id]).length;
  assert.deepEqual([live.length, acts, acts + doors], [31, 8, 15]);
});

test('verdict: no door, absent panel, no visit, open', () => {
  assert.equal(D.verdict('duel', { hidden: false }), null);
  assert.deepEqual(D.verdict('roll', null), { open: false, line: 'NO_DATA · panel_not_on_this_page' });
  assert.deepEqual(D.verdict('roll', { hidden: true }), { open: false, line: 'NO_DATA · no_visit_yet · press Play now first' });
  assert.deepEqual(D.verdict('voices', { hidden: false, label: null }), { open: true, cat: 'Communication', line: 'opened · Communication' });
  assert.deepEqual(D.verdict('welcome-again', { hidden: false, label: 'Help' }), { open: true, cat: 'Welcome', line: 'opened · Help' });
});

// A page small enough to hold in the hand: one category button, the sheet's Close, two controls in the panel.
function page(hidden) {
  const log = [], said = [];
  const control = (id, cat, off) => ({ id, disabled: off, hidden: false, getClientRects: () => [1], closest: () => ({ dataset: { cat } }), focus: () => log.push('focus:' + id) });
  const b = { hidden, pressed: 'false', getAttribute: (k) => (k === 'aria-pressed' ? b.pressed : 'Profile'), click: () => { b.pressed = 'true'; log.push('open'); }, focus: () => log.push('focus:cat') };
  const d = { defaultView: { CustomEvent: function (t, o) { this.type = t; this.detail = o.detail; } },
    querySelector: (s) => (s === '.cats [data-cat="Profile"]' ? b : null),
    getElementById: (i) => (i === 'gp-town' ? { setAttribute: (k, v) => log.push(k + '=' + v) } : null),
    querySelectorAll: () => [control('quest', 'Profile', true), control('other', 'Welcome', false), control('beacon', 'Profile', false)],
    dispatchEvent: (e) => log.push(e.type + ':' + e.detail.name) };
  const sheet = { ownerDocument: d, hidden: false };
  return { sheet, log, said, say: (t) => said.push(t) };
}

test('go: during a visit the panel opens, the sheet closes, focus lands on the first pressable control', () => {
  const p = page(false);
  assert.equal(D.go({ id: 'roll', say: 'Honest lottery · Roll' }, p.sheet, p.say), true);
  assert.deepEqual(p.log, ['open', 'aria-expanded=false', 'focus:beacon', 'building:act:door:roll']);
  assert.equal(p.sheet.hidden, true);
  assert.deepEqual(p.said, ['Honest lottery · Roll · opened · Profile']);
});

test('go: before a visit it says NO_DATA with its cause and touches nothing', () => {
  const p = page(true);
  assert.equal(D.go({ id: 'roll', say: 'Honest lottery · Roll' }, p.sheet, p.say), false);
  assert.deepEqual([p.log, p.sheet.hidden], [[], false]);
  assert.deepEqual(p.said, ['Honest lottery · Roll · NO_DATA · no_visit_yet · press Play now first']);
});

test('go: an option without a door says nothing and does nothing', () => {
  const p = page(false);
  assert.equal(D.go({ id: 'duel', say: 'x' }, p.sheet, p.say), false);
  assert.deepEqual([p.log, p.said], [[], []]);
});

test('the doors piece stays small', () => {
  assert.ok(statSync(new URL('../../public/game/building_doors.js', import.meta.url)).size <= 3072);
});
