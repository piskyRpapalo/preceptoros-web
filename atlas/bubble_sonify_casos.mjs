// Cases for the native sound of a bubble frame (NORTE 8 · audio slice 2).
// The source of truth is public/game/core.js: the drift test EXTRACTS its vozDe function and runs it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const S = require('../public/game/bubble_sonify.js');
const AQUI = fileURLToPath(new URL('../public/game/', import.meta.url));
const CORE = fileURLToPath(new URL('../public/game/core.js', import.meta.url));

// Pull vozDe out of core.js and compile it with core's own PENTA_V. Null if the text changed shape.
function vozDeFromCore(text) {
  const penta = text.match(/var PENTA_V = \[([0-9, ]+)\];/);
  const start = text.indexOf('function vozDe(t) {');
  if (!penta || start < 0) { return null; }
  const end = text.indexOf('\n  }\n', start);
  if (end < 0) { return null; }
  const body = text.slice(start, end + 5);
  const pv = penta[1].split(',').map((x) => Number(x.trim()));
  return new Function('PENTA_V', 'return (' + body + ');')(pv);
}

// core.js names its keys in Spanish (tipo, portadora…). Translate them to ours before comparing.
function inEnglish(c) {
  const r = { type: c.tipo === 'onda' ? 'wave' : c.tipo, carrier: c.portadora, modulator: c.moduladora, index: c.indice, dur: c.dur, gain: c.gan };
  if (c.moduladora2 !== undefined) { r.modulator2 = c.moduladora2; r.index2 = c.indice2; }
  return r;
}

// Harmonic tables: several shapes, including more than 12 harmonics and every degree of the scale.
const TABLES = [
  [[1, 40, 10, 0]],
  [[1, 40, 10, 0], [3, 20, 5, 4]],
  [[1, 40, 10, 0], [6, 12, 3, 2], [2, 8, 4, 1], [5, 3, 1, 0]],
  [[1, 40, 10, 0], [14, 22, 9, 3], [2, 5, 2, 1], [4, 7, 0, 6], [9, 2, 1, 0]],
  [[1, 40, 10, 0], [9, 30, 12, 1]],
  [[1, 40, 10, 0], [8, 25, 6, 2]],   // degree 4 of PENTA_V: without it the scale sabotage goes unseen
];

function drift(text) {
  const vozDe = vozDeFromCore(text);
  if (!vozDe) { return ['core.js no longer has vozDe in the expected shape']; }
  const r = [];
  TABLES.forEach((t, i) => {
    const source = inEnglish(vozDe({ armonicos: t }));
    const ours = S.recipe(t);
    if (JSON.stringify(source) !== JSON.stringify(ours)) { r.push('table ' + i + ': core ' + JSON.stringify(source) + ' vs ' + JSON.stringify(ours)); }
  });
  return r;
}

const WITH_SOUND = {
  v: 'preceptoros.bubble/1', sound: 'ok',
  atoms: [{ k: 'creature', r: 'a wave creature', i: [{ o: 'wave', x: 100, y: 100, h: [[1, 40, 10, 0], [3, 20, 5, 4]] }] },
          { k: 'rock', r: 'a blob rock', i: [{ o: 'blob', x: 200, y: 200, rx: 60, ry: 40, h: [[1, 30, 8, 0], [6, 12, 3, 2]] }] }]
};

test('drift: the recipe is core.js vozDe, table by table', () => {
  assert.deepEqual(drift(readFileSync(CORE, 'utf8')), []);
});

test('sabotage: changing core.js modulation (8 + a1 → 9 + a1) must show drift', () => {
  const original = readFileSync(CORE, 'utf8');
  const mutated = original.replace('moduladora: Math.round(f * (8 + a1) / 8)', 'moduladora: Math.round(f * (9 + a1) / 8)');
  assert.notEqual(mutated, original, 'the sabotage changed nothing: the test proves nothing');
  assert.ok(drift(mutated).length > 0, 'a different modulation must show up as drift');
});

test('sabotage: changing core.js PENTA_V must show drift', () => {
  const mutated = readFileSync(CORE, 'utf8').replace('var PENTA_V = [0, 2, 4, 7, 9];', 'var PENTA_V = [0, 2, 4, 7, 11];');
  assert.ok(drift(mutated).length > 0);
});

test('native sound: a wave and a blob with harmonics give two voices, in order', () => {
  const r = S.sonify(WITH_SOUND);
  assert.equal(r.ok, true);
  assert.deepEqual(r.voices.map((v) => v.primitive), ['wave', 'blob']);
  assert.deepEqual(r.voices.map((v) => v.at_ms), [0, 180]);
  assert.deepEqual(r.voices[0].recipe, S.recipe([[1, 40, 10, 0], [3, 20, 5, 4]]));
});

test('determinism: the same frame always gives the same voices', () => {
  assert.deepEqual(S.sonify(WITH_SOUND), S.sonify(WITH_SOUND));
});

test('what does not sound says why: sound NO_DATA → ok:false, no voices', () => {
  const r = S.sonify({ sound: 'NO_DATA: static-first: sound planned, not served', atoms: WITH_SOUND.atoms });
  assert.equal(r.ok, false);
  assert.match(r.cause, /static-first/);
});

test('closed failure: a frame with no waves or harmonics invents no sound', () => {
  const r = S.sonify({ sound: 'ok', atoms: [{ k: 'label', r: 'a title', i: [{ o: 'text', tx: 'hello' }] }] });
  assert.equal(r.ok, false);
  assert.match(r.cause, /NO_DATA/);
});

test('closed failure: no frame, no sound', () => {
  assert.equal(S.sonify(null).ok, false);
});

test('play: schedules two oscillators per voice, and stays silent without a context', () => {
  const made = [];
  const context = {
    currentTime: 1, destination: {},
    createOscillator() { const o = { frequency: { value: 0 }, start() {}, stop() {}, connect() {} }; made.push(o); return o; },
    createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
  };
  const r = S.sonify(WITH_SOUND);
  assert.equal(S.play(r, context), 2);
  assert.equal(made.length, 4, 'two voices: carrier and modulator per voice');
  assert.equal(S.play(S.sonify({ sound: 'NO_DATA: x', atoms: [] }), context), 0, 'what does not sound schedules nothing');
  assert.equal(S.play(r, null), 0, 'no context, no sound');
});

test('the module fits in 16 KiB, has no randomness, clock or network', () => {
  const path = AQUI + 'bubble_sonify.js';
  const text = readFileSync(path, 'utf8');
  assert.ok(statSync(path).size <= 16384, 'the module is over 16 KiB');
  const code = text.replace(/\/\/[^\n]*/g, '');   // code only: comment prose does not count
  assert.ok(!/Math\.random|Date\.|fetch\(|XMLHttp|WebSocket/.test(code), 'the module uses randomness, clock or network');
});
