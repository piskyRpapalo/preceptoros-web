// W3 cases: a duel with no reveal for 900 game cycles is abandoned. Sabotage: ABANDON must equal the core's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const S = require('../public/game/wave_duel_stall.js');
const core = require('./puros/wave_duel.js');
const F = require('../public/game/state_frames.js');
const P = { duelId: 'd1', committedAtCycle: 100, revealed: false };

test('899 cycles without a reveal stay OPEN with 1 cycle left', () => {
  const r = S.status(P, 999);
  assert.equal(r.state, 'OPEN'); assert.equal(r.cyclesLeft, 1);
});

test('900 cycles without a reveal is ABANDON and says so', () => {
  const r = S.status(P, 1000);
  assert.equal(r.state, 'ABANDON'); assert.equal(r.cyclesLeft, 0);
  assert.match(r.sentence, /abandoned/);
  assert.equal(S.status(P, 5000).state, 'ABANDON');
});

test('a revealed duel is REVEALED even after 900 cycles', () => {
  assert.equal(S.status({ ...P, revealed: true }, 5000).state, 'REVEALED');
});

test('SABOTAGE: ABANDON equals the core ABANDON (100000 would turn this red)', () => {
  assert.equal(S.ABANDON, core.ABANDON);
  assert.equal(S.status(P, 100 + core.ABANDON).state, 'ABANDON');
  assert.equal(S.status(P, 100 + core.ABANDON - 1).state, 'OPEN');
});

test('invalid inputs give NO_DATA with a cause', () => {
  const bad = [
    S.status(P, 1.5), S.status(P, -1), S.status(P, '1000'), S.status(P, 99),
    S.status({ ...P, committedAtCycle: 1.2 }, 1000), S.status({ ...P, committedAtCycle: -3 }, 1000),
    S.status({ ...P, revealed: 'yes' }, 1000), S.status({ ...P, duelId: '' }, 1000),
    S.status(null, 10), S.status(undefined, 10)
  ];
  for (const r of bad) { assert.equal(r.state, 'NO_DATA'); assert.ok(r.cause && r.cause.length > 0); }
});

test('every frame passes AtlasStateFrames.valida() and is under 1,024 bytes', () => {
  for (const c of [999, 1000]) {
    const f = S.frame(S.status(P, c));
    assert.deepEqual(F.valida(f), []);
    assert.ok(Buffer.byteLength(JSON.stringify(f)) < 1024);
    assert.match(f.sound, /^NO_DATA/); assert.ok(f.soundCause);
  }
  for (const r of [S.status({ ...P, revealed: true }, 5), S.status(null, 1), null]) {
    assert.deepEqual(F.valida(S.frame(r)), []);
  }
});

test('the module has no random source, clock, network or balance', () => {
  const src = readFileSync(new URL('../public/game/wave_duel_stall.js', import.meta.url), 'utf8');
  for (const w of ['Math.random', 'Date', 'performance.now', 'fetch(', 'damage', 'life']) { assert.ok(!src.includes(w), w); }
});
