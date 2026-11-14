// crab_trail_cases.mjs · the crab's trail (public/game/crab_trail.js): pure note/alpha, and a draw on a test double.
import { readFileSync } from 'node:fs'; import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const T = createRequire(import.meta.url)('../public/game/crab_trail.js');
test('note keeps the last cells walked, newest last, no duplicates', () => {
  let l = []; for (const k of ['0,0', '1,0', '2,0', '1,0']) l = T.note(l, k, 6);
  assert.deepEqual(l, ['0,0', '2,0', '1,0']);
  assert.deepEqual(T.note(l, '1,0', 6), l, 'standing still adds nothing');
  let m = []; for (let i = 0; i < 10; i++) m = T.note(m, i + ',0', 6); assert.equal(m.length, 6); assert.equal(m[0], '4,0');
});
test('alpha rises toward the crab; one cell alone prints nothing', () => {
  assert.equal(T.alpha(0, 1), 0); assert.ok(T.alpha(0, 6) < T.alpha(4, 6)); assert.ok(T.alpha(4, 6) <= 0.52);
});
test('draw: the crab cell is never printed; nothing without a walker; no clock', () => {
  const calls = []; const g = new Proxy({}, { get: (o, k) => k in o ? o[k] : (...a) => calls.push(k), set: (o, k, v) => { o[k] = v; return true; } });
  const H = { T: { FRONT_DOOR: { cyan: '#7FD1E8' } }, rgbOf: () => [127, 209, 232], shade: (c) => c, css: () => '#000000' };
  const V = { world: { cells: { at: {} } }, G: { k: 1, cx: 0, cy: 0 }, P: (q, r) => ({ x: q * 10, y: r * 10 }), turn: (x, y) => ({ x, y }), height: () => 0, HSTEP: 4, H };
  assert.deepEqual(T.draw(g, V, null), [], 'no walker: nothing noted');
  T.draw(g, V, { q: 0, r: 0 }); const before = calls.filter((c) => c === 'arc').length; assert.equal(before, 0, 'first cell: the crab stands on it');
  T.draw(g, V, { q: 1, r: 0 }); assert.equal(calls.filter((c) => c === 'arc').length, 6, 'one print = six dots');
  const src = readFileSync(new URL('../public/game/crab_trail.js', import.meta.url), 'utf8');
  assert.ok(!/Date\.now|performance\.now|Math\.random|setTimeout|requestAnimationFrame/.test(src), 'no clock, no chance, no loop');
});
