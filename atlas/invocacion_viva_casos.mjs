// La invocación vive · casos puros de public/game/invocacion_viva.js. Uso: node --test atlas/invocacion_viva_casos.mjs
// Mismo recibo → mismas partículas; movimiento reducido → sin animación; física acotada; sin Math.random ni Date;
// la voz pasa por la sonificación de la casa (acho_sonify.js); el túnel cabe en 600 ms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const V = require('../public/game/invocacion_viva.js');
const S = require('../public/game/acho_sonify.js');
const FUENTE = readFileSync(new URL('../public/game/invocacion_viva.js', import.meta.url), 'utf8');
const R = 'summon|tc1|1|0';

test('mismo recibo, mismas partículas; otro recibo, otras', () => {
  assert.deepEqual(V.simulate(R), V.simulate(R));
  assert.notDeepEqual(V.simulate(R)[30], V.simulate('summon|tc1|2|0')[30]);
  assert.equal(V.seedOf(R), V.seedOf(R));
});

test('movimiento reducido: un anillo quieto y ningún fotograma', () => {
  const p = V.plan(R, true);
  assert.equal(p.animated, false); assert.equal(p.frames.length, 0); assert.ok(p.ring.r > 0);
  assert.equal(V.plan(R, false).animated, true);
});

test('física acotada: ≤ 1,5 s, nada bajo el suelo, rebote y amortiguación', () => {
  for (const r of [R, 'echo|' + 'a'.repeat(64) + '|1', 'x', '']) {
    const fr = V.simulate(r);
    assert.ok(fr.length <= V.FRAMES && V.FRAMES <= 90);
    for (const f of fr) for (const p of f) {
      assert.ok(Math.abs(p.sx) <= V.BOUND && Math.abs(p.sy) <= V.BOUND && p.alpha >= 0 && p.alpha <= 1);
      assert.ok(['circle', 'arc'].includes(p.kind));
    }
  }
  let ps = V.particles(R), suelo = true, rebota = false;
  for (let i = 0; i < 300; i++) { const n = ps.map(V.step); n.forEach((q, j) => { if (q.z < 0) suelo = false; if (ps[j].vz < 0 && q.vz > 0) rebota = true; }); ps = n; }
  assert.ok(suelo, 'una partícula cruzó el suelo'); assert.ok(rebota, 'ninguna rebotó');
  ps.forEach((q) => assert.ok(Math.hypot(q.vx, q.vy) < 0.01, 'la amortiguación no frena'));
});

test('sin Math.random ni Date en la pieza', () => {
  assert.doesNotMatch(FUENTE, /Math\.random|Date\.|new Date|performance\.now/);
});

test('texto equivalente: nunca solo color', () => {
  assert.equal(V.describe({ type: 'summon', tc: 'tc1', copper: 50 }), 'Summoned · reef egg · 50 copper');
  assert.match(V.describe({ type: 'echo', copper: 25, sha: 'f'.repeat(64) }), /^Voice Star · \+25 copper/);
});

test('la voz sale de la sonificación de la casa y es determinista', () => {
  const a = S.sonify(V.voice(R)), b = S.sonify(V.voice(R));
  assert.equal(a.ok, true); assert.deepEqual(a, b);
  assert.ok(a.voices[0].recipe.carrier > 0);
});

test('túnel hexagonal: ≤ 600 ms, anillos de seis lados que crecen', () => {
  assert.ok(V.TUNNEL_FRAMES <= 36);
  const a = V.hexRings(0.2, 4), b = V.hexRings(0.8, 4);
  assert.equal(a.length, 4); a.forEach((r) => assert.equal(r.pts.length, 6));
  assert.ok(b[0].r > a[0].r);
});

test('cada tic del túnel es una escena Acho determinista y legible', () => {
  assert.equal(typeof V.tunnelFrame, 'function');
  const a = V.tunnelFrame(12, 360, 640), b = V.tunnelFrame(12, 360, 640);
  assert.deepEqual(a, b);
  assert.equal(a.v, 'preceptoros.acho/1'); assert.equal(a.t, 12);
  assert.equal(a.seed, 'openworld-entry');
  assert.match(a.atoms[0].r, /hexagonal tunnel.*frame 12 of 36/i);
  assert.match(a.sound, /^NO_DATA:/); assert.ok(a.soundCause);
  assert.ok(Buffer.byteLength(JSON.stringify(a), 'utf8') < 1024);
  const B = require('../public/game/acho_language.js');
  const shapes = B.compile(a);
  assert.equal(shapes.length, 4);
  assert.equal(B.compile.notes.length, 0);
  for (let t = 0; t <= V.TUNNEL_FRAMES; t++) {
    const frame = V.tunnelFrame(t, 360, 640);
    assert.ok(Buffer.byteLength(JSON.stringify(frame), 'utf8') < 1024, 'frame ' + t + ' exceeds 1,024 B');
    assert.deepEqual(frame, V.tunnelFrame(t, 360, 640), 'frame ' + t + ' changed for the same scene, seed and tick');
    assert.equal(B.compile(frame).length, 4); assert.equal(B.compile.notes.length, 0);
  }
});
