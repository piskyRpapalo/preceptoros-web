// Q-01 (Sovereign, 2026-11-08): near the crab (hex distance <= 2) a node building's name is drawn 50 % larger and answers a
// direct tap; NPC buildings in the fog never do. Pure: a test double canvas and a toy world.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const A = createRequire(import.meta.url)('../../public/game/map_aura.js');
function g() { const calls = []; return { calls, save() {}, restore() {}, beginPath() {}, moveTo() {}, arc() {}, closePath() {}, fill() { calls.push('fill'); }, stroke() {},
  fillText(t, x, y) { calls.push(['text', t, this.font]); }, measureText(t) { return { width: t.length * 9 }; } }; }
const V = { G: { k: 1, cx: 200, cy: 200 }, HSTEP: 4, height: () => 0, P: (q, r) => ({ x: q * 40, y: r * 30 }), turn: (x, y) => ({ x, y }),
  H: { css: (c) => 'rgb(' + c + ')', rgbOf: (t) => t, T: { NEUTRAL: { ink: '0,0,0', paper: '255,255,255' } } },
  world: { cells: { at: {} }, markList: [{ id: 'coliseum', q: 2, r: 1 }, { id: 'agora', q: 9, r: 9 }, { id: 'lottery', q: 1, r: 0, fog: true }] } };
test('a node building within two hexes wears a larger name and becomes a tap target; far and fog ones do not', () => {
  const c = g(), hits = A.near(c, V, { q: 2, r: 0 }, 1);
  assert.deepEqual(hits.map((h) => h.m.id), ['coliseum']);
  const t = c.calls.find((x) => Array.isArray(x)); assert.equal(t[1], 'Coliseum'); assert.match(t[2], /^800 17px/, 'the near name is not 50 % larger (11 px → 16.5 px)');
  const h = hits[0]; assert.ok(h.x1 - h.x0 >= 44 && h.y1 - h.y0 >= 44, 'the tap target is smaller than 44 px');
  assert.equal(A.hitAt((h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2).id, 'coliseum'); assert.equal(A.hitAt(-999, -999), null);
});
test('no crab, no near names', () => { assert.deepEqual(A.near(g(), V, null, 1), []); });
