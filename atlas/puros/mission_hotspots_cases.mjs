// The mission map on the map: every waiting mission sits at one building, the node's own, never twice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const M = createRequire(import.meta.url)('../../public/game/mission_hotspots.js');
const interiors = JSON.parse(readFileSync(new URL('../../public/game/building_interiors.json', import.meta.url), 'utf8'));
const tanda = readFileSync(new URL('../../odd/tasks/noche-8nov-tanda.md', import.meta.url), 'utf8');
test('every gap a building declares is a hot spot on that same building', () => {
  interiors.buildings.forEach((b) => (b.options || []).filter((o) => !o.piece).forEach((o) => (o.missions || []).forEach((c) => {
    assert.ok((M.WAIT[b.id] || []).includes(c), b.id + ' waits for ' + c);
  })));
});
test('every mission of the night tanda waits at exactly one building', () => {
  ['H1', 'A1', 'W1', 'E1', 'R1', 'S1', 'N1', 'RS1'].forEach((c) => {
    assert.ok(tanda.includes('**' + c + ' '), c + ' is in the tanda index');
    assert.equal(Object.values(M.WAIT).filter((l) => l.includes(c)).length, 1, c);
  });
});
test('every mission of the chat of 2026-11-09 waits at the building its index names, once', () => {
  const idx = readFileSync(new URL('../../odd/tasks/chat-9nov-tanda.md', import.meta.url), 'utf8');
  const names = { Coliseum: 'coliseum', Agora: 'agora', 'Visitor house': 'visitor-house', Hostel: 'hostel', Customs: 'customs', Choir: 'choir', Workshop: 'workshop' };
  const rows = [...idx.matchAll(/^\| \*\*(Y\d+) ?\*\* \| ([A-Za-z ]+?) \|/gm)];
  assert.equal(rows.length, 12);
  rows.forEach(([, code, place]) => assert.deepEqual(Object.keys(M.WAIT).filter((k) => M.WAIT[k].includes(code)), [names[place]], code));
});
test('no duplicates: a code is placed once, and only at real buildings', () => {
  const all = Object.values(M.WAIT).flat();
  assert.equal(new Set(all).size, all.length);
  const ids = new Set(interiors.buildings.map((b) => b.id));
  Object.keys(M.WAIT).forEach((id) => assert.ok(ids.has(id), id));
});
test('spots: the node\'s own building only, one per kind, never a fogged NPC', () => {
  const list = [{ id: 'agora', q: 1, r: 0, fog: false }, { id: 'agora', q: 5, r: 2, fog: true }, { id: 'lottery', q: 2, r: 0, fog: false }, { id: 'agora', q: 3, r: 0, fog: false }];
  const s = M.spots(list);
  assert.deepEqual(s.map((x) => [x.m.q, x.codes.join()]), [[1, M.WAIT.agora.join()]]);
});
test('draw on a test double: one tap target of at least 44 px per spot, no raw colour, no chance, no clock', () => {
  const g = new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 30 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  const V = { world: { markList: [{ id: 'choir', q: 0, r: 1, fog: false }], cells: { at: {} } }, P: (q, r) => ({ x: q, y: r }), turn: (x, y) => ({ x, y }), G: { k: 1, cx: 0, cy: 0 }, height: () => 0, HSTEP: 4,
    H: { rgbOf: () => [1, 2, 3], css: () => 'tok', T: { FRONT_DOOR: { 'PROPUESTA.base': 'x' }, NEUTRAL: { ink: 'y', paper: 'z' } } } };
  const h = M.draw(g, V, 1);
  assert.equal(h.length, 1); assert.ok(h[0].x1 - h[0].x0 >= 44 && h[0].y1 - h[0].y0 >= 44);
  assert.equal(M.hitAt(h[0].x0 + 1, h[0].y0 + 1).m.id, 'choir');
  const src = readFileSync(new URL('../../public/game/mission_hotspots.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|Date\.now|new Date|#[0-9a-fA-F]{3,6}\b|rgba?\(/.test(src));
});
test('the guide answers missions from this table: every code named, placed at its one building, never swapped', () => {
  Object.entries(M.WAIT).forEach(([id, codes]) => codes.forEach((c) => {
    assert.ok(M.WHAT[c], c + ' has its words');
    const a = M.answer('What is ' + c + '?');
    assert.match(a, new RegExp('^' + c + ' is '), a);
    Object.values(M.WAIT).flat().filter((o) => o !== c).forEach((o) => assert.ok(!new RegExp('\\b' + o + '\\b').test(a), c + ' answer names ' + o));
  }));
  assert.match(M.answer('What is coming to the Coliseum?'), /A1.*K6c/);
  assert.match(M.answer('Which missions wait at Customs?'), /N1.*J7/);
  assert.equal(M.answer('What is this map?'), null);
  assert.equal(M.answer('How do I move?'), null);
});
