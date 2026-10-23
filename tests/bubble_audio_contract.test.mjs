import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const S = require('../public/game/core.js');
const B = require('../public/game/bubble_game.js');
let source = readFileSync(new URL('../public/game/gacha.js', import.meta.url), 'utf8');
if (process.env.LF2_PHASE_SABOTAGE === '1') {
  assert.ok(source.includes('h[3] * Math.PI / 32'));
  source = source.replace('h[3] * Math.PI / 32', 'h[3] * Math.PI / 180');
}
const context = {module: {exports: {}}, require: createRequire(new URL('../public/game/gacha.js', import.meta.url))};
vm.runInNewContext(source, context);
const G = context.module.exports;
const arm = [[1, 12, 8, 0], [3, 6, 4, 0], [5, 2, 1, 0]];

test('harmonic phase uses 64 steps per turn, not degrees', () => {
  const quarter = G.punto([[1, 12, 8, 16]], 0);
  assert.ok(Math.abs(quarter[0]) < 1e-12);
  assert.equal(quarter[1], 8);
  const full = G.punto([[1, 12, 8, 64]], 0);
  assert.equal(full[0], 12);
  assert.ok(Math.abs(full[1]) < 1e-12);
});

test('clash phase uses degrees on its independent ribbon projection', () => {
  const clash = ph => B.WORDS.clash({a: [0, 0], b: [100, 0], n: 1, k: 0, amp: 12, ph})[0].pts;
  // Frame serialization represents both signed zero values as 0.
  assert.equal(JSON.stringify(clash(0)), JSON.stringify(clash(360)));
  assert.deepEqual(clash(90)[12], [50, 12]);
  assert.notDeepEqual(clash(16), clash(90));
});

test('phase-only changes alter geometry but not the current voice recipe', () => {
  const shifted = arm.map(h => [h[0], h[1], h[2], h[3] + 16]);
  assert.notDeepEqual(G.punto(arm, 0), G.punto(shifted, 0));
  assert.deepEqual(S.vozDe({armonicos: arm}), S.vozDe({armonicos: shifted}));
  const louderHarmonic = arm.map(h => [...h]); louderHarmonic[1][1] += 2;
  assert.notDeepEqual(S.vozDe({armonicos: arm}), S.vozDe({armonicos: louderHarmonic}));
});

test('wave renderer detuning changes plotted points without calling sound', () => {
  let audioCalls = 0;
  const count = () => { audioCalls++; throw new Error('unexpected sound call'); };
  const root = {AtlasGacha: G, AtlasValores: {}, AtlasSintesis: {suena: count}, AudioContext: count};
  vm.runInNewContext(readFileSync(new URL('../public/game/wave_render.js', import.meta.url), 'utf8'), root);
  function draw(desafina) {
    const points = [], ctx = new Proxy({}, {get: (_, key) => (...args) => {
      if (key === 'moveTo' || key === 'lineTo') points.push(args);
    }});
    root.AtlasOnda.dibuja(ctx, arm, 0, 0, 20,
      {desafina, respira: false, calidad: 0, brillo: 0});
    return points;
  }
  const original = JSON.stringify(arm);
  assert.notDeepEqual(draw(0), draw(1));
  assert.equal(JSON.stringify(arm), original);
  assert.equal(audioCalls, 0);
});
