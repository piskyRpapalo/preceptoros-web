// Cases for the building interiors contract. Uso: node --test atlas/puros/building_interiors_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const B = createRequire(import.meta.url)('./building_interiors.js');
const raiz = new URL('../../', import.meta.url);
const doc = JSON.parse(readFileSync(new URL('data/building_interiors.json', raiz), 'utf8'));
const existe = (p) => existsSync(new URL(p, raiz));
const clon = () => JSON.parse(JSON.stringify(doc));

test('the served contract is valid: nine buildings, the law of the number, real pieces', () => {
  assert.deepEqual(B.valida(doc, existe), []);
});
test('a building with eight options breaks the law', () => {
  const d = clon(); const b = d.buildings[0];
  while (b.options.length < 8) b.options.push({ id: 'x' + b.options.length, label: 'x', missions: ['Z'], piece: null, cause: 'x' });
  assert.ok(B.valida(d, existe).some((e) => e.startsWith('law_of_number:hostel')));
});
test('the lottery keeps two options only because the exception is declared', () => {
  const d = clon(); delete d.exceptions.lottery;
  assert.ok(B.valida(d, existe).includes('law_of_number:lottery:2'));
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
  assert.ok(c.live > c.no_data);
});
test('pure: no clock, no randomness, no network', () => {
  const src = readFileSync(new URL('atlas/puros/building_interiors.js', raiz), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|fetch\(|XMLHttpRequest/);
});
