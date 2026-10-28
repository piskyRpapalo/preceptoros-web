// Cases for the state → frame core (MVP slice 1). The sound of a frame comes from its own waves through the
// shared sonify core (public/game/bubble_sonify.js); a state with no waves says NO_DATA and nothing sounds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('./state_frames.js');
const S = require('../../public/game/bubble_sonify.js');

const CON_ONDA = [[1, 40, 10, 0], [3, 20, 5, 4]];

test('a state with no waves says NO_DATA for its sound, with its cause', () => {
  const f = F.stateFrame({ id: 'cabin', sentence: 'The tutorial cabin is selected.' });
  assert.match(f.sound, /^NO_DATA: /);
  assert.ok(f.soundCause.length > 0);
  assert.equal(S.sonify(f).ok, false, 'nothing sounds when the frame declares no waves');
});

test('a state with waves sounds from its own harmonics', () => {
  const f = F.stateFrame({ id: 'listen', sentence: 'Playing two voices.', waves: [CON_ONDA, CON_ONDA] });
  assert.equal(f.sound, 'ok');
  const r = S.sonify(f);
  assert.equal(r.ok, true);
  assert.equal(r.voices.length, 2);
  assert.deepEqual(r.voices[0].recipe, S.recipe(CON_ONDA));
});

test('every frame obeys the law: under 1,024 bytes, a sentence on each atom, a declared sound', () => {
  const f = F.stateFrame({ id: 'cabin', sentence: 'The tutorial cabin is selected.' });
  assert.deepEqual(F.valida(f), []);
});

test('sabotage: a frame without a sentence is caught by the law', () => {
  const f = F.stateFrame({ id: 'cabin', sentence: '' });
  assert.ok(F.valida(f).some((p) => /no sentence/.test(p)), 'an empty sentence must be reported');
});

test('sabotage: an oversized frame is caught by the law', () => {
  const f = F.stateFrame({ id: 'cabin', sentence: 'x'.repeat(1100) });
  assert.ok(F.valida(f).some((p) => /bytes/.test(p)), 'a frame over 1,024 bytes must be reported');
});

test('reduced motion: no transition lasts', () => {
  assert.equal(F.transitionMs(400, true), 0);
  assert.equal(F.transitionMs(400, false), 400);
  assert.equal(F.transitionMs(5000, false), 1000, 'the transition is capped at one second');
});

test('determinism: the same state gives the same frame', () => {
  const a = F.stateFrame({ id: 'cabin', sentence: 'The tutorial cabin is selected.' });
  assert.deepEqual(a, F.stateFrame({ id: 'cabin', sentence: 'The tutorial cabin is selected.' }));
});
