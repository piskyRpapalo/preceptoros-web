// The selected building's aura: its breath is pure and steady under reduced motion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const A = createRequire(import.meta.url)('../../public/game/map_aura.js');
test('the outer ring breathes out and fades over 1.6 s, the same at the same time', () => {
  assert.deepEqual(A.phase(0, false), { grow: 0, alpha: 0.7 });
  assert.equal(A.phase(800, false).grow, 0.5);
  assert.ok(A.phase(1500, false).alpha < A.phase(100, false).alpha);
  assert.deepEqual(A.phase(1234, false), A.phase(1234 + 1600, false));
});
test('reduced motion: a steady aura, whatever the time', () => {
  assert.deepEqual(A.phase(0, true), A.phase(999, true));
});
test('no chance in the aura', () => {
  assert.ok(!/Math\.random/.test(readFileSync(new URL('../../public/game/map_aura.js', import.meta.url), 'utf8')));
});
test('draw runs whole on a test double: rings in the token gold, with alpha, no raw colour', () => {
  const calls = [], g = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop: (o, c) => calls.push(c) })), set: (t, k, v) => { t[k] = v; if (k === 'strokeStyle') calls.push(v); return true; } });
  const V = { world: { cells: { at: { '1,0': [1, 0, 1, 'land'] } } }, P: (q, r) => ({ x: q * 10, y: r * 10 }), turn: (x, y) => ({ x, y }), G: { k: 1, cx: 0, cy: 0 }, height: () => 1, HSTEP: 4,
    H: { rgbOf: () => [200, 160, 40], css: (c) => '#' + c.map((v) => ('0' + v.toString(16)).slice(-2)).join(''), T: { FRONT_DOOR: { 'PROPUESTA.base': 'x' }, NEUTRAL: { ink: 'y' } } } };
  const s = { dataset: { sel: '1,0' }, width: 100, height: 100 };
  assert.doesNotThrow(() => A.draw(g, V, s, true, () => {}, null));
  assert.ok(calls.includes('#c8a0286b') || calls.some((c) => /^#c8a028[0-9a-f]{2}$/.test(c)), JSON.stringify(calls));
});
