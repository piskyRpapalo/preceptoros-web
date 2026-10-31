// Cases of the replay controls (EU-3). Pure: they check the state and never the record.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('./battle_replay_controls.js');

test('the replay starts playing at ×1', () => {
  const s = C.start();
  assert.equal(C.rate(s), 1);
  assert.equal(C.label(s), 'PLAYING · ×1');
});

test('pause freezes the event time (rate 0) and says so on screen', () => {
  const s = C.pause(C.start());
  assert.equal(C.rate(s), 0);
  assert.equal(C.label(s), 'PAUSED · ×1');
});

test('resuming goes back to the speed that was set before the pause', () => {
  const s = C.play(C.pause(C.setSpeed(C.start(), 4)));
  assert.equal(C.rate(s), 4);
  assert.equal(C.label(s), 'PLAYING · ×4');
});

test('speeds ×2 and ×4 are accepted; the rate is the speed', () => {
  assert.equal(C.rate(C.setSpeed(C.start(), 2)), 2);
  assert.equal(C.rate(C.setSpeed(C.start(), 4)), 4);
});

test('a speed change keeps the pause as it was', () => {
  const s = C.setSpeed(C.pause(C.start()), 2);
  assert.equal(s.paused, true);
  assert.equal(C.rate(s), 0);
});

test('sabotage: a speed outside ×1 ×2 ×4 is refused and the state stays', () => {
  const s = C.setSpeed(C.start(), 3);
  assert.deepEqual(s, C.start());
  assert.deepEqual(C.setSpeed(C.start(), 0), C.start());
  assert.deepEqual(C.setSpeed(C.start(), '4'), C.start());
});

test('sabotage: a paused replay never reports a positive rate', () => {
  for (const v of [1, 2, 4]) {
    assert.equal(C.rate(C.pause(C.setSpeed(C.start(), v))), 0);
  }
});

test('the functions return new states and never mutate the one they receive', () => {
  const base = C.start();
  C.pause(base); C.setSpeed(base, 4);
  assert.deepEqual(base, { speed: 1, paused: false });
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./battle_replay_controls.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
