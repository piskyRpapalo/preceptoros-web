// Cases for the building interiors contract. Uso: node --test atlas/puros/building_interiors_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const B = createRequire(import.meta.url)('./building_interiors.js');
const raiz = new URL('../../', import.meta.url);
const doc = JSON.parse(readFileSync(new URL('public/game/building_interiors.json', raiz), 'utf8'));
const existe = (p) => existsSync(new URL(p, raiz));
const clon = () => JSON.parse(JSON.stringify(doc));

test('the served contract is valid: eight buildings (no lottery), the law of the number, real pieces', () => {
  assert.deepEqual(B.valida(doc, existe), []);
});
test('a building with eight options breaks the law', () => {
  const d = clon(); const b = d.buildings[0];
  while (b.options.length < 8) b.options.push({ id: 'x' + b.options.length, label: 'x', missions: ['Z'], piece: null, cause: 'x' });
  assert.ok(B.valida(d, existe).some((e) => e.startsWith('law_of_number:hostel')));
});
test('no lottery in the web (Sovereign 2026-11-24): no lottery building, no exception kept for it', () => {
  const d = clon(); assert.ok(!d.buildings.some((b) => /lotter/i.test(b.id + b.name))); assert.equal(d.exceptions.lottery, undefined);
});
test('a piece that does not exist is caught; NO_DATA needs its cause', () => {
  const d = clon(); d.buildings[0].options[0].piece = 'public/game/nope.js';
  d.buildings[1].options[2].cause = '';
  const f = B.valida(d, existe);
  assert.ok(f.includes('piece_missing:hostel/play-without-account'));
  assert.ok(f.includes('no_data_cause:customs/economy'));
});
test('counts are measured, not declared', () => {
  const c = B.cuenta(doc);
  assert.equal(c.live + c.no_data, doc.buildings.reduce((s, b) => s + b.options.length, 0));
});
test('pure: no clock, no randomness, no network', () => {
  const src = readFileSync(new URL('atlas/puros/building_interiors.js', raiz), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|fetch\(|XMLHttpRequest/);
});

test('an action is declared in the contract and needs its real piece', () => {
  const acts = doc.buildings.flatMap((b) => b.options.filter((o) => o.action).map((o) => [b.id, o.id, o.action, o.piece]));
  assert.deepEqual(acts.map((a) => a[2]).sort(), ['audio', 'gaps', 'inhabitants', 'letters', 'notebook', 'odds', 'pulse', 'tower', 'typo']);
  assert.ok(acts.every((a) => a[3] && doc.actions[a[2]]));
  const bad = JSON.parse(JSON.stringify(doc)); bad.buildings[0].options[0].action = 'teleport';
  assert.ok(B.valida(bad, existe).some((f) => f.startsWith('action_unknown:')));
});

// Honest doors (Mesa #34, 2026-11-14): LIVE is an operation, never a file. A piece with no action and no door is a
// source that exists, not something the visitor can do.
const D = createRequire(import.meta.url)('../../public/game/building_doors.js');
const all = doc.buildings.flatMap((b) => b.options.map((o) => [b.id + '/' + o.id, o]));
test('an option is LIVE only with an action or a door; a piece alone is NO_DATA', () => {
  const can = all.filter(([, o]) => o.action || D.DOORS[o.id]);
  assert.deepEqual(B.cuenta(doc, D.live), { live: can.length, no_data: all.length - can.length });
  assert.equal(all.filter(([, o]) => D.live(o) && !o.action && !D.DOORS[o.id]).length, 0, 'false LIVE');
  assert.equal(can.length, 15); // 9 actions + 6 doors (no lottery roll door, 2026-11-24)
});
test('sabotage: a piece with no operation can never count as LIVE', () => {
  assert.equal(D.live({ id: 'ghost', piece: 'public/game/gacha.js' }), false);
  assert.equal(D.live({ id: 'ghost', piece: null, action: 'odds' }), false); // an action still needs its piece
  assert.equal(D.live({ id: 'summons', piece: 'public/game/gacha.js' }), true);
});
test('every door of the table is an option of the contract that has its piece', () => {
  Object.keys(D.DOORS).forEach((id) => assert.ok(all.some(([, o]) => o.id === id && o.piece), id));
});
