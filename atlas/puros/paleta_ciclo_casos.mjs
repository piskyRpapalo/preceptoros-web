// Cases for the day and night palette (ODD isometric-colony, IC5). The colours read the tick t alone. The sabotages
// must be able to go red: a palette that reads a wall clock, a random number in the render path, a non-whole tick.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const P = require('./paleta_ciclo.js');
const F = require('./state_frames.js');
const G = require('../../public/game/global_map.js');

test('the measured ends: tick 0 is the night sky #17131f, tick 120 the day sky #f4ebd0', () => {
  assert.equal(P.paleta(0).cielo, '#17131f');
  assert.equal(P.paleta(120).cielo, '#f4ebd0');
  assert.equal(P.paleta(0).dia, 0);
  assert.equal(P.paleta(120).dia, 256);
});

test('the period is 240 ticks: t and t+240 give the same colours', () => {
  for (const t of [0, 1, 37, 119, 120, 200]) {
    assert.equal(P.paleta(t).cielo, P.paleta(t + 240).cielo, 'tick ' + t);
    assert.equal(P.paleta(t).tinta, P.paleta(t + 240).tinta, 'tick ' + t);
  }
});

test('the extraction matches the palette measured on the global map, tick by tick over one period', () => {
  for (let t = 0; t < 480; t++) {
    const a = P.paleta(t), b = G.paleta(t);
    assert.equal(a.cielo, b.cielo, 'sky at tick ' + t);
    assert.equal(a.tinta, b.tinta, 'ink at tick ' + t);
  }
});

test('the lerp is whole numbers: every channel is an integer, the sky is a 6-digit hex', () => {
  for (let t = 0; t < 240; t += 7) {
    assert.match(P.paleta(t).cielo, /^#[0-9a-f]{6}$/);
    assert.match(P.paleta(t).tinta, /^#[0-9a-f]{6}$/);
  }
});

test('reduced motion is no cycle: the palette stays at noon whatever the tick, and no sky frame changes', () => {
  assert.equal(P.paleta(0, true).cielo, '#f4ebd0');
  assert.equal(P.paleta(77, true).cielo, '#f4ebd0');
  assert.deepEqual(P.cambios(0, 480, true), []);
});

test('the colours are a function of t alone: the same tick gives the same colours in any run', () => {
  assert.equal(JSON.stringify(P.paleta(55)), JSON.stringify(P.paleta(55)));
});

test('a sky frame is a state frame under the law, its sentence names the palette', () => {
  const f = P.marcoCielo(60);
  assert.deepEqual(F.valida(f), []);
  assert.match(f.atoms[0].r, /the sky at tick 60: #[0-9a-f]{6} · day \d+ of 256/);
  assert.ok(new TextEncoder().encode(JSON.stringify(f)).length < 1024);
});

test('a change of colour travels as a state frame, one per tick where the day fraction moves', () => {
  const fs = P.cambios(0, 10);
  assert.ok(fs.length > 0);
  assert.ok(fs.every((f) => F.valida(f).length === 0));
  assert.equal(fs[0].t, 1);
});

test('sabotage: a non-whole tick is refused, a fraction would be a clock', () => {
  assert.throws(() => P.paleta(1.5), /t must be a whole tick/);
  assert.throws(() => P.paleta(NaN), /t must be a whole tick/);
  assert.throws(() => P.paleta(Date.now() / 1000 + 0.5), /t must be a whole tick/);
});

test('sabotage: the colours do not move when the wall clock moves', () => {
  const real = Date.now;
  try {
    Date.now = () => 0;
    const a = P.paleta(90).cielo;
    Date.now = () => 9e12;
    const b = P.paleta(90).cielo;
    assert.equal(a, b);
  } finally { Date.now = real; }
});

test('sabotage: the colours do not depend on random numbers', () => {
  const real = Math.random;
  try {
    Math.random = () => { throw new Error('Math.random read in the palette'); };
    assert.equal(P.paleta(90).cielo, P.paleta(90).cielo);
  } finally { Math.random = real; }
});

test('the palette reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./paleta_ciclo.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
