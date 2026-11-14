// Cases for the odds that sound (experiment E2, not served). Uso: node --test atlas/puros/odds_voice_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require('./odds_voice.js'), G = require('../../public/game/gacha.js'), F = require('../../public/game/state_frames.js');
const S = require('../../public/game/acho_sonify.js'), C = require('../../public/game/acho_claim.js'), TA = require('../../public/game/town_actions.js');
let line = null; TA.run('odds', { load: (s, n, then) => then(G) }, (t) => { line = t; });
const frame = F.stateFrame({ id: 'lottery/odds', sentence: 'Honest lottery · ' + line, waves: V.waves(G) });

test('the frame with the real sentence and its four waves obeys the law of the syllable', () => {
  assert.deepEqual(F.valida(frame), []);
  assert.equal(frame.sound, 'ok');
});
test('one voice per tier, and a luckier tier is never a lower note', () => {
  const r = S.sonify(frame);
  assert.equal(r.ok, true);
  assert.equal(r.voices.length, Object.keys(G.TCS).length);
  const hz = r.voices.map((v) => v.recipe.carrier);
  const luck = Object.keys(G.TCS).map((tc) => G.odds(tc)[2] + G.odds(tc)[3]);
  for (let i = 1; i < hz.length; i++) { assert.equal(Math.sign(hz[i] - hz[i - 1]), Math.sign(luck[i] - luck[i - 1]), 'tier ' + i); }
});
test('eye, ear and machine point at the same rows of one claim', () => {
  const c = C.claim(frame);
  assert.equal(c.ok, true);
  const waves = c.rows.filter((r) => r.primitive === 'wave');
  assert.equal(waves.length, 4);
  waves.forEach((r, i) => { assert.ok(r.listen && r.look > 0 && r.silent === null); assert.deepEqual(r.inspect.h, V.wave(G.odds(Object.keys(G.TCS)[i]))); });
});
test('sabotage: odds that do not add to a thousand make no sound at all', () => {
  assert.equal(V.wave([640, 280, 65, 16]), null);
  assert.equal(V.waves({ TCS: { a: 1 }, odds: () => [1, 2, 3, 4] }), null);
  assert.match(F.stateFrame({ id: 'x', sentence: 'x', waves: V.waves({ TCS: { a: 1 }, odds: () => [1, 2, 3, 4] }) || [] }).sound, /^NO_DATA/);
});
test('sabotage: another table is another sound', () => {
  assert.notDeepEqual(S.recipe(V.wave([640, 280, 65, 15])), S.recipe(V.wave([500, 280, 150, 70])));
});
test('pure: no clock, no randomness, no network', () => {
  assert.doesNotMatch(readFileSync(new URL('./odds_voice.js', import.meta.url), 'utf8'), /Math\.random|Date\.now|new Date|fetch\(|XMLHttpRequest/);
});
