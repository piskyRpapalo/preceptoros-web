// Cases for EL PULSO (public/game/pulse.js, mission K5). Offline, synthetic: the stamps are made here, no clock is read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const FILE = new URL('../../public/game/pulse.js', import.meta.url);
const P = require(FILE.pathname);
const marks = (n, step, t0 = 0) => Array.from({ length: n }, (_, i) => t0 + i * step);
const stripped = () => readFileSync(FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

test('60 marks at 16 ms: 62.5 fps, MEASURED for strong', () => {
  const s = marks(60, 16);
  assert.deepEqual(P.measure(s), { frames: 60, ms: 944, fps: 62.5 });
  assert.deepEqual(P.verdict(s, 'strong'), { estado: 'MEASURED', fps: 62.5, declared: 60, cls: 'strong' });
});

test('60 marks at 40 ms: NO_DATA for strong, MEASURED for weak', () => {
  const s = marks(60, 40);
  assert.deepEqual(P.verdict(s, 'strong'), { estado: 'NO_DATA', causa: 'pulse_under_declared', fps: 25, declared: 60, cls: 'strong' });
  assert.deepEqual(P.verdict(s, 'weak'), { estado: 'MEASURED', fps: 25, declared: 24, cls: 'weak' });
});

test('one mark: pulse_too_few_frames', () => {
  assert.deepEqual(P.measure(marks(1, 16)), { estado: 'NO_DATA', causa: 'pulse_too_few_frames' });
  assert.deepEqual(P.verdict([], 'strong'), { estado: 'NO_DATA', causa: 'pulse_too_few_frames' });
});

test('stamps that fall, repeat or are not finite: pulse_stamps_not_rising', () => {
  assert.equal(P.verdict([0, 16, 8], 'strong').causa, 'pulse_stamps_not_rising');
  assert.equal(P.verdict([0, 16, 16], 'strong').causa, 'pulse_stamps_not_rising');
  assert.equal(P.verdict([0, NaN, 32], 'strong').causa, 'pulse_stamps_not_rising');
});

test('unknown class: pulse_class_unknown', () => {
  const v = P.verdict(marks(60, 16), 'ultra');
  assert.equal(v.estado, 'NO_DATA');
  assert.equal(v.causa, 'pulse_class_unknown');
});

test('line(): one short line that names the state', () => {
  const under = P.line(P.verdict(marks(60, 40), 'strong'));
  assert.equal(under, 'Pulse · 25 fps · declared 60 for strong · NO_DATA pulse_under_declared');
  const ok = P.line(P.verdict(marks(60, 16), 'strong'));
  assert.equal(ok, 'Pulse · 62.5 fps · declared 60 for strong · MEASURED');
  const few = P.line(P.verdict([], 'strong'));
  assert.equal(few, 'Pulse · NO_DATA · pulse_too_few_frames');
  for (const l of [under, ok, few]) { assert.ok(l.length < 120, l); }
  assert.ok(under.includes('NO_DATA'));
  assert.ok(ok.includes('MEASURED'));
});

test('envelope: under 1024 bytes, unknown piece uses PIECE_CEILING', () => {
  const env = P.envelope(marks(60, 16), 'strong', { 'public/game/pulse.js': 5000, 'public/game/new.js': 20000 });
  assert.equal(env.v, 'preceptoros.pulse/1');
  assert.equal(env.estado, 'MEASURED');
  assert.deepEqual(env.budget[0], ['public/game/pulse.js', 5000, 6000, true]);
  assert.deepEqual(env.budget[1], ['public/game/new.js', 20000, 16384, false]);
  assert.ok(Buffer.byteLength(JSON.stringify(env), 'utf8') < 1024);
});

test('envelope with 200 pieces: throws Error', () => {
  const many = {};
  for (let i = 0; i < 200; i++) { many['public/game/piece_' + i + '.js'] = 1000; }
  assert.throws(() => P.envelope(marks(60, 16), 'strong', many), { name: 'Error', message: 'pulse: envelope over 1,024 bytes' });
});

test('source has no Math.random, Date.now or performance.now (comments removed)', () => {
  assert.doesNotMatch(stripped(), /Math\.random|Date\.now|performance\.now/);
});

test('pulse.js weighs at most 6000 bytes', () => {
  assert.ok(statSync(FILE).size <= 6000);
});

test('budget: frozen tables, ceiling 16384, every value over it is an EXCEPTION', () => {
  assert.equal(P.PIECE_CEILING, 16384);
  assert.deepEqual(P.CLASSES, { weak: { fps: 24 }, mid: { fps: 30 }, strong: { fps: 60 } });
  assert.ok(Object.isFrozen(P.CLASSES) && Object.isFrozen(P.BUDGET) && Object.isFrozen(P.EXCEPTIONS));
  for (const [piece, bytes] of Object.entries(P.BUDGET)) {
    if (bytes > P.PIECE_CEILING) { assert.ok(piece in P.EXCEPTIONS, piece); }
  }
});

test('start() without requestAnimationFrame: NO_DATA pulse_no_animation_frame', () => {
  const out = [];
  P.start({}, 'strong', (l) => out.push(l));
  assert.deepEqual(out, ['Pulse · NO_DATA · pulse_no_animation_frame']);
});

test('start() with a fake frame clock at 16 ms: one MEASURED line', () => {
  let t = 0;
  const queue = [];
  const win = { requestAnimationFrame: (cb) => { queue.push(cb); } };
  const out = [];
  P.start(win, 'strong', (l) => out.push(l));
  while (queue.length) { const cb = queue.shift(); t += 16; cb(t); }
  assert.deepEqual(out, ['Pulse · 62.5 fps · declared 60 for strong · MEASURED']);
});
