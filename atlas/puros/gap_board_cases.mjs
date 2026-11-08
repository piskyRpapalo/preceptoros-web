// E4 / L13 · the gap board counts only what the interiors contract declares.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const G = require('../../public/game/gap_board.js');
const doc = JSON.parse(readFileSync(new URL('../../public/game/building_interiors.json', import.meta.url), 'utf8'));

test('the board counts every option and every gap of the contract', () => {
  const r = G.board(doc);
  let total = 0, gaps = 0;
  doc.buildings.forEach((b) => b.options.forEach((o) => { total++; if (!o.piece) gaps++; }));
  assert.equal(r.ok, true);
  assert.equal(r.total, total);
  assert.equal(r.gaps.length, gaps);
  assert.equal(r.live + r.gaps.length, r.total);
});

test('each gap keeps its mission and its declared cause; nothing is invented', () => {
  for (const g of G.board(doc).gaps) {
    assert.ok(g.missions.length > 0, g.option);
    assert.match(g.cause, /^[a-z0-9_]+$/);
  }
});

test('the live line names at most three gaps and says how many more', () => {
  const r = G.board(doc);
  assert.match(r.line, new RegExp('^' + r.gaps.length + ' of ' + r.total + ' options are NO_DATA'));
  assert.equal((r.line.match(/\(/g) || []).length, Math.min(G.SHOW, r.gaps.length));
  if (r.gaps.length > G.SHOW) assert.match(r.line, new RegExp('and ' + (r.gaps.length - G.SHOW) + ' more$'));
  assert.ok(r.line.length <= 280, 'short enough for one aria-live line');
});

test('order is deterministic: by first mission, then option id', () => {
  const a = G.board(doc).gaps.map((g) => g.option), b = G.board(JSON.parse(JSON.stringify(doc))).gaps.map((g) => g.option);
  assert.deepEqual(a, b);
  const m = G.board(doc).gaps.map((g) => g.missions[0]);
  assert.deepEqual(m, m.slice().sort());
});

test('no contract, no board: NO_DATA with its cause', () => {
  assert.deepEqual(G.board(null), { ok: false, line: 'NO_DATA · interiors_not_loaded', gaps: [] });
});

test('when nothing is missing the board says so', () => {
  const full = { buildings: [{ name: 'X', options: [{ id: 'a', piece: 'p.js', missions: ['Z1'] }] }] };
  assert.equal(G.board(full).line, 'all 1 options are LIVE · no gap left');
});

test('pure: no clock, randomness, network or DOM', () => {
  const src = readFileSync(new URL('../../public/game/gap_board.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|fetch\(|XMLHttpRequest|document\./);
});
