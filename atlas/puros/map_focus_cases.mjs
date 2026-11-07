// Pure cases for public/game/map_focus.js (gap: only browser guards covered it). Run: node --test atlas/puros/map_focus_cases.mjs
// Laws checked: Tab order is back to front then left to right with id ties; names carry the bubble sentence and what
// Enter does; forced colours are detected; no clock/randomness/network; the focus ring is shape, never colour alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const F = require('../../public/game/map_focus.js');
const SRC = readFileSync(new URL('../../public/game/map_focus.js', import.meta.url), 'utf8');

test('order: smaller y first, then smaller x, then id; input untouched', () => {
  const items = [
    { id: 'c', x: 5, y: 9 }, { id: 'b', x: 7, y: 1 }, { id: 'a', x: 7, y: 1 }, { id: 'd', x: 2, y: 1 },
  ];
  const copy = JSON.parse(JSON.stringify(items));
  assert.deepEqual(F.order(items).map((i) => i.id), ['d', 'a', 'b', 'c']);
  assert.deepEqual(items, copy);
  assert.deepEqual(F.order(items.slice().reverse()).map((i) => i.id), ['d', 'a', 'b', 'c']);
  assert.deepEqual(F.order([]), []);
});

test('label: names the node, its sentences, and what Enter does', () => {
  assert.equal(F.label('n1', ['Hello', '', null, 'Door']), 'Map node n1: Hello; Door. Enter walks there; on it, Enter goes in.');
  assert.equal(F.label('n2'), 'Map node n2. Enter walks there; on it, Enter goes in.');
  assert.equal(F.label('n3', []), F.label('n3', [null, '']));
});

test('forced: true only when forced-colors is active', () => {
  const win = (m) => ({ matchMedia: (q) => ({ matches: m && q === '(forced-colors: active)' }) });
  assert.equal(F.forced(win(true)), true);
  assert.equal(F.forced(win(false)), false);
  assert.equal(F.forced({}), false);
  assert.equal(F.forced(null), false);
});

test('no clock, randomness or network in the piece', () => {
  assert.doesNotMatch(SRC, /Math\.random|Date\.|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});

test('proxies are 44x44 targets (centred by a 22 px offset) and the ring is solid plus dashed', () => {
  assert.match(SRC, /it\.x \* sx - 22/); assert.match(SRC, /it\.y \* sy - 22/);
  assert.match(SRC, /setLineDash\(\[6, 4\]\)/);
  assert.match(SRC, /CanvasText/);
});

test('attach returns null without a surface (no throw)', () => {
  assert.equal(F.attach({ document: { getElementById: () => null } }), null);
});
