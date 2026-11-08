// Cases for Audio only (public/game/audio_only.js, mission D10, building Choir). Offline: fake store, win and doc objects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const FILE = new URL('../../public/game/audio_only.js', import.meta.url);
const A = require(FILE.pathname);
const KEY = 'preceptoros.audio-only';

function fakeStore(initial) {
  const m = new Map(initial === undefined ? [] : [[KEY, initial]]);
  return { m, getItem(k) { return m.has(k) ? m.get(k) : null; }, setItem(k, v) { m.set(k, String(v)); } };
}
const throwingStore = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
const fakeDoc = () => ({ documentElement: { dataset: {} } });
const full = { place: 'Choir', x: 3, y: 4, buildings: [{ name: 'Forge', live: 2, total: 3 }, { name: 'Hall', live: 1, total: 2 }], gaps: 2 };

test('describe with a full state: 3 lines, each at most 120 characters, the place is named', () => {
  const lines = A.describe(full);
  assert.ok(lines.length >= 3);
  for (const l of lines) { assert.ok(l.length <= 120, l); }
  assert.deepEqual(lines, ['You are in Choir at 3, 4', '2 buildings · 3 of 5 options LIVE', '2 gaps']);
  assert.ok(lines[0].includes('Choir'));
});

test('describe({}) says each missing field as NO_DATA with its cause, and does not throw', () => {
  const lines = A.describe({});
  assert.equal(lines.length, 3);
  for (const l of lines) { assert.ok(l.includes('NO_DATA (not given)'), l); }
  assert.deepEqual(A.describe(null).length, 3);
  assert.deepEqual(A.describe(undefined).length, 3);
});

test('describe is deterministic: same input, same lines', () => {
  assert.deepEqual(A.describe(full), A.describe(full));
  assert.deepEqual(A.describe(JSON.parse(JSON.stringify(full))), A.describe(full));
});

test('describe: a missing x or y is said as NO_DATA; a long place is cut to 120 characters', () => {
  assert.equal(A.describe({ place: 'Choir' })[0], 'You are in Choir · position NO_DATA (not given)');
  assert.equal(A.describe({ x: 3, y: 4 })[0], 'place NO_DATA (not given) · at 3, 4');
  for (const l of A.describe({ place: 'x'.repeat(300), x: 1, y: 2 })) { assert.ok(l.length <= 120, l); }
});

test('speak with a fake speechSynthesis queues one utterance per line, lang en', () => {
  const spoken = [];
  const win = {
    speechSynthesis: { speak(u) { spoken.push(u); } },
    SpeechSynthesisUtterance: class { constructor(t) { this.text = t; } },
  };
  const out = [];
  A.speak(win, ['one', 'two', 'three'], (t) => out.push(t));
  assert.equal(spoken.length, 3);
  assert.deepEqual(spoken.map((u) => u.text), ['one', 'two', 'three']);
  assert.ok(spoken.every((u) => u.lang === 'en'));
  assert.deepEqual(out, ['speaking 3 lines']);
});

test('speak without speechSynthesis: NO_DATA · speech_unavailable and the lines, never throws', () => {
  const out = [];
  A.speak({}, ['a', 'b'], (t) => out.push(t));
  assert.deepEqual(out, ['NO_DATA · speech_unavailable · a · b']);
  const out2 = [];
  A.speak({ speechSynthesis: {} }, ['a'], (t) => out2.push(t));
  assert.deepEqual(out2, ['NO_DATA · speech_unavailable · a']);
  assert.doesNotThrow(() => A.speak(null, ['x'], () => {}));
});

test('speak whose speechSynthesis throws: NO_DATA · speech_failed, never throws', () => {
  const win = {
    speechSynthesis: { speak() { throw new Error('boom'); } },
    SpeechSynthesisUtterance: class { constructor(t) { this.text = t; } },
  };
  const out = [];
  assert.doesNotThrow(() => A.speak(win, ['z'], (t) => out.push(t)));
  assert.deepEqual(out, ['NO_DATA · speech_failed · z']);
});

test('toggle flips the mode, sets and removes data-audio-only, and persists', () => {
  const doc = fakeDoc(), store = fakeStore();
  const on = A.toggle(doc, null, store);
  assert.deepEqual(on, { on: true, line: 'Audio only on' });
  assert.equal(doc.documentElement.dataset.audioOnly, 'on');
  assert.equal(A.read(store), true);
  assert.equal(store.m.get(KEY), 'on');
  const off = A.toggle(doc, null, store);
  assert.deepEqual(off, { on: false, line: 'Audio only off' });
  assert.equal('audioOnly' in doc.documentElement.dataset, false);
  assert.equal(A.read(store), false);
  assert.equal(store.m.get(KEY), 'off');
});

test('read returns the saved value', () => {
  assert.equal(A.read(fakeStore('on')), true);
  assert.equal(A.read(fakeStore('off')), false);
  assert.equal(A.read(fakeStore()), false);
});

test('read and write with a null or throwing store do not break; read gives false', () => {
  assert.equal(A.read(null), false);
  assert.equal(A.read(throwingStore), false);
  assert.equal(A.write(null, true), false);
  assert.equal(A.write(throwingStore, true), false);
  assert.equal(A.write(fakeStore(), true), true);
  const doc = fakeDoc();
  const r = A.toggle(doc, null, throwingStore);
  assert.deepEqual(r, { on: true, line: 'Audio only on' });
  assert.equal(doc.documentElement.dataset.audioOnly, 'on');
});

test('source: no Math.random, Date.now or fetch(, no motion, at most 4096 bytes', () => {
  const src = readFileSync(FILE, 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|fetch\(/);
  assert.doesNotMatch(src, /requestAnimationFrame|animat|transition/);
  assert.ok(statSync(FILE).size <= 4096, String(statSync(FILE).size));
});
