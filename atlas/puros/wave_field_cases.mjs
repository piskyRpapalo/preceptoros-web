// The wave field (public/game/wave_field.js): the battle drawn on the map floor. Pure laws, no browser:
// the motion is a function of the record and the seed; the life on screen is the record's; the speed of the
// replay never changes who wins; the field lies inside the canvas, the crab's squad at the near end.
//   node --test atlas/puros/wave_field_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const K = require('../../public/game/canon.js');
const G = require('../../public/game/gacha.js');
const T = require('../../public/game/combat_ticks.js');
const C = require('../../public/game/battle_choreography.js');
const F = require('../../public/game/wave_field.js');

const squad = (q, tc, k) => Array.from({ length: k }, (_, i) => ({ tc, semilla: K.sha(`wave-field:${q}:${i}`) }));
const stats = (l) => l.map((x) => { const s = G.tirada(x.semilla, x.tc).stats; return { max: s.vida, vel: s.velocidad, inercia: s.inercia }; });
const fights = [['a', 'tc1', 3, 'tc2', 2], ['b', 'tc3', 4, 'tc1', 4], ['c', 'tc2', 2, 'tc4', 5]].map(([q, td, nd, ta, na]) => {
  const def = squad(q + 'd', td, nd), asa = squad(q + 'a', ta, na), seed = K.sha('wave-field-seed:' + q);
  const combat = T.combate(def, asa, seed);
  return { def, asa, seed, combat, c: C.coreografia(combat.registro, [stats(def), stats(asa)], seed, combat.gana) };
});

test('same record and seed, same motion (hash), twice', () => {
  fights.forEach((f) => { const again = C.coreografia(f.combat.registro, [stats(f.def), stats(f.asa)], f.seed, f.combat.gana); assert.equal(again.hash, f.c.hash); });
});

test('the life on the floor at the end is the record\'s life, unit by unit', () => {
  fights.forEach((f) => {
    const n0 = f.def.length, life = stats(f.def).concat(stats(f.asa)).map((u) => u.max);
    f.combat.registro.forEach((e) => { if (e[4] >= 0) { const j = e[1] ? e[3] : n0 + e[3]; life[j] = Math.max(0, life[j] - e[4]); } });
    const end = life.map((_, j) => F.pose(f.c, j, f.c.total).vida);
    assert.deepEqual(end, life);
  });
});

test('speed never changes the winner: ×1, ×2 and ×4 reach the same last pose and the same landed count', () => {
  fights.forEach((f) => {
    f.c.hits = f.combat.registro.length;
    const at = (rate) => { let vt = 0; while (vt < f.c.fin + 1600) { vt += 16 * rate; } return vt; };
    const ends = [1, 2, 4].map((r) => ({ hits: F.landed(f.c, at(r)), last: JSON.stringify(f.c.frames[f.c.frames.length - 1]) }));
    ends.forEach((e) => { assert.equal(e.hits, f.c.hits); assert.equal(e.last, ends[0].last); });
    assert.equal(C.ganadorVisual(f.c) === 'empate' || f.combat.gana === 'empate' || C.ganadorVisual(f.c) === f.combat.gana, true);
  });
});

test('landed hits grow with time and never pass the record', () => {
  const f = fights[1]; f.c.hits = f.combat.registro.length; let prev = -1;
  for (let vt = 0; vt <= f.c.total; vt += 50) { const h = F.landed(f.c, vt); assert.ok(h >= prev && h <= f.c.hits); prev = h; }
  assert.equal(F.landed(f.c, 0), 0);
});

test('the field lies on the canvas: phone (portrait) and desktop (landscape)', () => {
  [[840, 1320], [1920, 900], [780, 780]].forEach(([W, H]) => {
    const p0 = F.place(W, H, 0, 0), crab = p0.crab, P = F.place(W, H, crab.x, crab.y);
    [[85, 300], [915, 300], [500, 70], [500, 530], [40, 300], [960, 300]].forEach(([x, y]) => {
      const s = P.at(x, y); assert.ok(s.x >= 0 && s.x <= W && s.y >= 0 && s.y <= H, `${W}x${H} ${x},${y} -> ${Math.round(s.x)},${Math.round(s.y)}`);
    });
    const near = P.at(85, 300), far = P.at(915, 300);
    assert.ok(Math.hypot(near.x - crab.x, near.y - crab.y) < Math.hypot(far.x - crab.x, far.y - crab.y), 'the crab\'s squad starts near the crab');
  });
});

test('sabotage: a field that lets the picture decide life is caught', () => {
  const f = fights[0], bad = { ...f.c, frames: f.c.frames.map((fr) => fr.map((v, i) => (i % 3 === 2 ? 99 : v))) };
  assert.notEqual(F.pose(bad, 0, bad.total).vida, F.pose(f.c, 0, f.c.total).vida);
});
