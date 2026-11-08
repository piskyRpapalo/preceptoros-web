// Duel state machine cases (D5). Offline, synthetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync as rd } from 'node:fs';
const require = createRequire(import.meta.url);
const D = require('./duel_states.js');
const A = { hp: 60, atk: 9 }, B = { hp: 55, atk: 10 };
const ALL_EVENTS = ['start', 'act', 'hit', 'miss', 'tick', 'done', 'next', 'end'];

test('table holds only declared states', () => {
  assert.deepEqual([...D.STATES], ['born', 'ready', 'act', 'hitstop', 'resolve', 'over']);
  for (const from of Object.keys(D.TABLE)) {
    assert.ok(D.STATES.includes(from), from);
    for (const to of Object.values(D.TABLE[from])) assert.ok(D.STATES.includes(to), to);
  }
});

test('STATES and TABLE are frozen', () => {
  assert.ok(Object.isFrozen(D.STATES));
  assert.ok(Object.isFrozen(D.TABLE));
  assert.ok(Object.isFrozen(D.TABLE.hitstop));
});

test('every legal transition moves as declared', () => {
  for (const from of Object.keys(D.TABLE)) {
    for (const [ev, to] of Object.entries(D.TABLE[from])) {
      assert.equal(D.step(from, ev), to, from + '.' + ev);
    }
  }
});

test('illegal transition closes the duel with NO_DATA', () => {
  assert.deepEqual(D.step('born', 'act'),
    { estado: 'NO_DATA', causa: 'duel_illegal_transition', from: 'born', event: 'act' });
  assert.deepEqual(D.step('ready', 'hit'),
    { estado: 'NO_DATA', causa: 'duel_illegal_transition', from: 'ready', event: 'hit' });
  assert.deepEqual(D.step('nope', 'start'),
    { estado: 'NO_DATA', causa: 'duel_illegal_transition', from: 'nope', event: 'start' });
});

test('over has no exits', () => {
  assert.deepEqual(D.TABLE.over, {});
  for (const ev of ALL_EVENTS) assert.equal(D.step('over', ev).estado, 'NO_DATA', ev);
});

test('rng is xorshift32 in [0,1) and a zero seed does not get stuck', () => {
  const r = D.rng(0), seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const u = r();
    assert.ok(u >= 0 && u < 1, String(u));
    seen.add(u);
  }
  assert.ok(seen.size > 990, String(seen.size));
});

test('same place and tick give the same fight, frame by frame, in 50 seeds', () => {
  for (let i = 0; i < 50; i++) {
    const place = 'lugar_' + (i % 5), tick = i * 7;
    const x = D.fight(place, tick, A, B), y = D.fight(place, tick, A, B);
    assert.deepEqual(x.frames, y.frames, place + ':' + tick);
    assert.deepEqual(x.receipt, y.receipt);
  }
});

test('different tick gives a different hash in most cases', () => {
  const hashes = new Set();
  for (let t = 0; t < 100; t++) hashes.add(D.fight('lugar_a', t, A, B).receipt.hash);
  assert.ok(hashes.size >= 90, String(hashes.size));
});

test('damage stays in base*(1+-SPREAD), rounded, never below 1, over 10000 samples', () => {
  const r = D.rng(0x1234abcd);
  for (let i = 0; i < 10000; i++) {
    const base = 1 + (i % 300);
    const d = D.damage(base, r);
    const lo = Math.max(1, Math.round(base * (1 - D.SPREAD)));
    const hi = Math.round(base * (1 + D.SPREAD));
    assert.ok(Number.isInteger(d) && d >= lo && d <= hi, base + ' -> ' + d);
    assert.ok(d >= 1);
  }
});

test('each hit gives exactly HITSTOP_FRAMES hitstop frames', () => {
  let runs = 0;
  for (let t = 0; t < 30; t++) {
    let run = 0;
    for (const f of D.fight('lugar_b', t, A, B).frames) {
      if (f[1] === 'hitstop') { run++; continue; }
      if (run > 0) { assert.equal(run, D.HITSTOP_FRAMES, 'tick ' + t); runs++; }
      run = 0;
    }
  }
  assert.ok(runs > 0);
});

test('receipt is under 1024 bytes and carries the declared fields', () => {
  const r = D.fight('lugar_c', 42, A, B);
  assert.ok(Buffer.byteLength(JSON.stringify(r.receipt), 'utf8') < 1024);
  assert.deepEqual(Object.keys(r.receipt).sort(), ['frames', 'hash', 'seed', 'v', 'winner']);
  assert.equal(r.receipt.v, 'preceptoros.duel/1');
  assert.match(r.receipt.hash, /^[0-9a-f]{8}$/);
  assert.equal(r.receipt.seed, D.seedOf('lugar_c', 42));
  assert.equal(r.receipt.frames, r.frames.length);
});

test('duel ends in over with one winner who is still alive', () => {
  const { frames, winner } = D.fight('lugar_d', 9, A, B);
  assert.ok(['a', 'b'].includes(winner));
  assert.equal(frames[frames.length - 1][1], 'over');
  assert.equal(frames.filter((f) => f[1] === 'over').length, 1);
  const received = (who) => frames.filter((f) => f[3] > 0 && f[2] !== who).reduce((s, f) => s + f[3], 0);
  const hp = { a: A.hp, b: B.hp }, loser = winner === 'a' ? 'b' : 'a';
  assert.ok(received(winner) < hp[winner], 'winner alive');
  assert.ok(received(loser) >= hp[loser], 'loser dead');
});

test('a duel over the frame cap closes with NO_DATA duel_frame_cap', () => {
  assert.deepEqual(D.fight('lugar_e', 1, { hp: 1e6, atk: 1 }, { hp: 1e6, atk: 1 }),
    { estado: 'NO_DATA', causa: 'duel_frame_cap' });
});

test('bad fighter closes with NO_DATA', () => {
  assert.deepEqual(D.fight('lugar_f', 1, { hp: 0, atk: 5 }, B),
    { estado: 'NO_DATA', causa: 'duel_bad_fighter' });
});

test('no Math.random, clock, DOM or network; module at most 8000 bytes', () => {
  const src = rd(new URL('./duel_states.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|\bDate\b|performance|document|window|fetch\(|XMLHttpRequest|require\(|https?:/);
  assert.ok(Buffer.byteLength(src, 'utf8') <= 8000);
});
