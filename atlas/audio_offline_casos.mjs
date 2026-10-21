import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../public/game/descent_sound.js');
const C = require('../public/assets/codex_scene.js');
const R = require('../public/game/aiact-art50-state-radio.js');
const T = require('../public/game/tarjeta_cantada.js');
const F = require('../public/game/audio_feedback_manager.js');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function renderNoise(voices, start, rate = 44100) {
  const buffers = [], node = () => ({frequency:{value:0}, connect(){}, start(){}, stop(){}});
  const ctx = {sampleRate: rate, currentTime: start, createOscillator: node, createBufferSource: node,
    createBuffer(channels, size, hz) {
      assert.equal(hz, rate); const samples = new Float32Array(size); buffers.push(samples);
      return {getChannelData: () => samples};
    }, createGain: () => ({connect(){}, gain: {setValueAtTime(){}, linearRampToValueAtTime(){}}})};
  D.play(ctx, voices, start);
  return buffers.map(samples => {
    const bytes = Buffer.alloc(samples.length * 4);
    samples.forEach((x, i) => bytes.writeFloatLE(x, i * 4));
    return {samples: samples.length, sha256: hash(bytes)};
  });
}
const noise = [{src:'noise', seed:1, at:.5, env:{a:.6,d:.4,s:.5,r:.9},gain:.03}];
assert.deepEqual(renderNoise(noise, 0), renderNoise(noise, 1000), 'noise must not depend on scheduling origin');
assert.notDeepEqual(renderNoise(noise, 0), renderNoise(noise, 0, 48000));
assert.notDeepEqual(renderNoise(noise, 0), renderNoise([{...noise[0],seed:2}], 0));
const rows = C.SECTIONS.map(id => {
  const frame = C.frame(id), score = D.score(frame);
  const packet = JSON.stringify({v:'preceptoros.sound/1',id,cycle:frame.t,sound:frame.sound,score});
  assert.ok(Buffer.byteLength(packet) < 1024);
  assert.deepEqual(renderNoise(score.voices, 0), renderNoise(score.voices, 1000));
  return {id, bytes:Buffer.byteLength(packet), recipe:hash(packet), noise:renderNoise(score.voices,0)};
});
const snap = {esquema:'atlas.instantanea/1',integridad:80,integridad_max:100,recursos:{cobre:1,biomasa:2,luz:3,oxigeno:4},fase:1,nivel_nucleo:1,grieta:{abierta:false},ciclo:7,profundidad:4};
const recipes = {radio:R.guion(snap),card:T.melodía({id:'fixture',sello:'LIVE',hue:196}),feedback:F.verb('state','MEASURED')};
for (const value of Object.values(recipes)) assert.ok(Buffer.byteLength(JSON.stringify(value)) < 1024);
const output = {rate:44100,rows,recipes_sha256:hash(JSON.stringify(recipes)),native_pcm:'NO_DATA: no browser in this environment'};
if (process.argv.includes('--sabotage')) output.rows[0].recipe = 'changed';
console.log(JSON.stringify(output));
