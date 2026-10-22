import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../public/game/descent_sound.js');
const C = require('../public/assets/codex_scene.js');
const RATE = 44100;

function render(voices, contextRate, start) {
  const buffers = [], sources = [];
  let oscillators = 0;
  const ctx = {
    sampleRate: contextRate,
    currentTime: start,
    destination: {},
    createBuffer(channels, length, rate) {
      const samples = new Float32Array(length);
      const buffer = { channels, length, rate, samples, getChannelData: () => samples };
      buffers.push(buffer);
      return buffer;
    },
    createBufferSource() {
      const source = { buffer: null, connect() {}, start() {}, stop() {} };
      sources.push(source);
      return source;
    },
    createOscillator() { oscillators++; return { frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; },
    createGain() { return { connect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {} } }; }
  };
  const count = D.play(ctx, voices, start);
  assert.equal(oscillators, 0, 'PCM generation must not delegate waveform phase to native oscillators');
  assert.equal(buffers.length, 1, 'one bounded PCM buffer carries the complete score');
  assert.equal(sources.length, 1, 'the deterministic buffer is scheduled once');
  assert.equal(sources[0].buffer, buffers[0]);
  assert.equal(buffers[0].rate, RATE, 'PCM uses the declared rate');
  const bytes = Buffer.alloc(buffers[0].samples.length * 4);
  buffers[0].samples.forEach((value, index) => bytes.writeFloatLE(value, index * 4));
  return { count, samples: buffers[0].samples.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

const score = D.score(C.frame('PRECEPTOR'));
const first = render(score.voices, RATE, 0);
const reload = render(score.voices, 48000, 17);
assert.deepEqual(reload, first, 'same frame keeps identical PCM across rate and scheduling origins');
assert.equal(first.samples, Math.ceil(score.length * RATE));
const changed = score.voices.map(voice => voice.src === 'noise' ? { ...voice, seed: voice.seed + 1 } : voice);
assert.notEqual(render(changed, RATE, 0).sha256, first.sha256, 'declared seed changes PCM');
console.log(`PASS deterministic descent PCM · ${first.samples} samples · sha256 ${first.sha256}`);
