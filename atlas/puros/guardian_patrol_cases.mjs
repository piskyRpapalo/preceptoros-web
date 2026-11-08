// Q-02 (Sovereign, 2026-11-08): the ghost guardians walk a loop inside the hexagon they guard; near the crab a «?» opens their
// profile (difficulty, reward), never their army. Pure: a test double canvas, a toy world, no document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const F = createRequire(import.meta.url)('../../public/game/map_fog_layer.js');
const g = { save() {}, restore() {}, beginPath() {}, moveTo() {}, quadraticCurveTo() {}, closePath() {}, fill() {}, stroke() {}, arc() {}, fillText() {}, lineTo() {} };
const V = { G: { k: 1, cx: 300, cy: 300 }, HSTEP: 4, height: () => 0, P: (q, r) => ({ x: q * 40, y: r * 30 }), turn: (x, y) => ({ x, y }),
  H: { css: () => '#000000', rgbOf: (t) => t, mix: () => [0, 0, 0], T: { NEUTRAL: { ink: 'i', paper: 'p' }, FRONT_DOOR: { 'FIRMADO.base': 'f', 'LIVE.base': 'l' } } },
  world: { cells: { at: {} }, markList: [{ id: 'lottery', q: 3, r: 0, fog: true }, { id: 'choir', q: -6, r: 5, fog: true }] } };
test('the patrol is a loop inside the hexagon: same building, same place on the same frame; never beyond half a step', () => {
  const m = V.world.markList[0];
  assert.deepEqual(F.spot(m, 7, 40, 0.4), F.spot(m, 7, 40, 0.4));
  assert.notDeepEqual(F.spot(m, 7, 40, 0.4), F.spot(m, 8, 40, 0.4), 'the guardian does not move from frame to frame');
  for (let t = 0; t < 200; t++) { const d = F.spot(m, t, 40, 0.4); assert.ok(Math.abs(d[0]) <= 20.0001 && Math.abs(d[1]) <= 8.0001); }
  assert.notDeepEqual(F.spot(m, 7, 40, 0.4), F.spot(V.world.markList[1], 7, 40, 0.4), 'two guardians walk in step');
});
test('only a guardian within three hexes of the crab carries the question, and a tap on it finds that guardian', () => {
  F.draw(g, V, { width: 600, height: 600 }, { q: 1, r: 0 });
  let found = null; for (let y = 0; y < 600 && !found; y += 2) { for (let x = 0; x < 600 && !found; x += 2) { found = F.askAt(x, y); } }
  assert.equal(found && found.id, 'lottery'); assert.equal(F.askAt(-50, -50), null);
});
test('the profile tells difficulty and reward, never the army', () => {
  const t = F.profile(V.world.markList[0]);
  assert.match(t, /^Guardian of this lottery · difficulty: /); assert.match(t, /reward: NO_DATA/);
  assert.doesNotMatch(t, /troop|semilla|tc\b|army/i);
});
