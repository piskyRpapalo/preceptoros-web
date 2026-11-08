// A tap on a village building finds that building (map_chunks.js markAt), with the painter's own placement.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MC = require('../../public/game/map_chunks.js');
const MP = require('../../public/game/map_painter.js');
const P = require('../../public/game/hex_projection.js');
const dir = new URL('../../public/map/chunks/', import.meta.url);
function world() {
  const ch = {};
  for (const f of readdirSync(dir)) { const d = JSON.parse(readFileSync(new URL(f, dir))); ch[d.c.join('_')] = d; }
  return { cells: MP.cellsOf(ch) };
}
const V = { P, turn: (x, y) => ({ x, y }), HSTEP: 7, height: (c) => (c[3] === 'water' ? 0 : c[2]) };
test('every village building is found where it stands, and only there', () => {
  const w = world(), G = { cx: 500, cy: 500, k: 1 };
  MC.landmarks(w);
  assert.ok(w.markList.length >= 40, 'villages hold many buildings');
  for (const m of w.markList.slice(0, 12)) {
    const h = P(m.q, m.r), x = G.cx + h.x, y = G.cy + h.y - (V.height(w.cells.at[m.q + ',' + m.r]) * 7 + 12);
    assert.equal(MC.markAt(w, G, x, y, V), m);
  }
  assert.equal(MC.markAt(w, G, -5000, -5000, V), null);
});
test('placement is fixed and keeps four hexes between buildings, the cabin clearing free', () => {
  const a = world(), b = world(); MC.landmarks(a); MC.landmarks(b);
  assert.deepEqual(a.markList, b.markList);
  const d = (p, q) => (Math.abs(p.q - q.q) + Math.abs(p.r - q.r) + Math.abs(p.q + p.r - q.q - q.r)) / 2;
  a.markList.forEach((m, i) => { assert.ok(d(m, { q: 0, r: 0 }) > 2); a.markList.slice(i + 1).forEach((n) => assert.ok(d(m, n) >= 4)); });
});
test('the crab stick: a push turns into one of the six hex steps, true under the orbit', () => {
  const S = 0.433;
  assert.equal(MC.dirOf(20, 0, 0, S), 'east');
  assert.equal(MC.dirOf(-20, 0, 0, S), 'west');
  assert.equal(MC.dirOf(20, 0, 180, S), 'west', 'turned half round, a push right walks west on the ground');
  assert.ok(['north-east', 'north-west'].includes(MC.dirOf(0, -20, 0, S)));
  assert.ok(['south-east', 'south-west'].includes(MC.dirOf(0, 20, 0, S)));
});
