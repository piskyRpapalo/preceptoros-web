// Type scale cases (I7 «The right letters»). Offline, synthetic: fake doc and win objects, no DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync as rd, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const T = require('../../public/game/type_scale.js');
const KEY = 'preceptoros.letters';

function fakeDoc() {
  const calls = { props: {}, attrs: {}, writes: 0 };
  const el = {
    style: { setProperty(k, v) { calls.props[k] = v; calls.writes++; } },
    setAttribute(k, v) { calls.attrs[k] = v; calls.writes++; },
  };
  return { doc: { documentElement: el }, calls };
}
function fakeWin(saved) {
  const store = new Map(saved === undefined ? [] : [[KEY, saved]]);
  return {
    store,
    localStorage: {
      getItem(k) { return store.has(k) ? store.get(k) : null; },
      setItem(k, v) { store.set(k, String(v)); },
    },
  };
}
const throwing = () => ({
  localStorage: {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
  },
});

test('STEPS is frozen, ascending, first 1, last at most 1.5', () => {
  assert.ok(Object.isFrozen(T.STEPS));
  assert.deepEqual([...T.STEPS], [1, 1.15, 1.3, 1.5]);
  for (let i = 1; i < T.STEPS.length; i++) assert.ok(T.STEPS[i] > T.STEPS[i - 1]);
  assert.equal(T.STEPS[0], 1);
  assert.ok(T.STEPS[T.STEPS.length - 1] <= 1.5);
});

test('label of each step', () => {
  assert.equal(T.label(1), 'Letters 100%');
  assert.equal(T.label(1.15), 'Letters 115%');
  assert.equal(T.label(1.3), 'Letters 130%');
  assert.equal(T.label(1.5), 'Letters 150%');
});

test('label of an unknown step: NO_DATA with cause', () => {
  assert.equal(T.label(2), 'Letters NO_DATA · letters_step_unknown');
  assert.equal(T.label('1.3'), 'Letters NO_DATA · letters_step_unknown');
});

test('next cycles the four steps and returns to 1', () => {
  let s = 1, seen = [];
  for (let i = 0; i < 4; i++) { s = T.next(s); seen.push(s); }
  assert.deepEqual(seen, [1.15, 1.3, 1.5, 1]);
  assert.equal(T.next(2), 1);
});

test('read: win null gives 1', () => {
  assert.equal(T.read(null), 1);
});

test('read: localStorage that throws gives 1 and does not throw', () => {
  assert.equal(T.read(throwing()), 1);
  assert.equal(T.read({ get localStorage() { throw new Error('denied'); } }), 1);
});

test('read: garbage value 7 gives 1; saved 1.3 gives 1.3', () => {
  assert.equal(T.read(fakeWin('7')), 1);
  assert.equal(T.read(fakeWin('')), 1);
  assert.equal(T.read(fakeWin()), 1);
  assert.equal(T.read(fakeWin('1.3')), 1.3);
});

test('write: throwing storage gives false without throwing; normal gives true', () => {
  assert.equal(T.write(throwing(), 1.3), false);
  assert.equal(T.write(null, 1.3), false);
  const w = fakeWin();
  assert.equal(T.write(w, 1.15), true);
  assert.equal(w.store.get(KEY), '1.15');
});

test('apply sets --letters and data-letters on documentElement', () => {
  const { doc, calls } = fakeDoc();
  const r = T.apply(doc, 1.3);
  assert.deepEqual(calls.props, { '--letters': '1.3' });
  assert.deepEqual(calls.attrs, { 'data-letters': '1.3' });
  assert.deepEqual(r, { estado: 'MEASURED', step: 1.3, label: 'Letters 130%' });
});

test('apply with an unknown step: NO_DATA and the doc is not touched', () => {
  const { doc, calls } = fakeDoc();
  const r = T.apply(doc, 2);
  assert.deepEqual(r, { estado: 'NO_DATA', causa: 'letters_step_unknown' });
  assert.equal(calls.writes, 0);
});

test('cycle four times returns to 1 and leaves 1 stored', () => {
  const { doc, calls } = fakeDoc();
  const w = fakeWin();
  const got = [];
  for (let i = 0; i < 4; i++) got.push(T.cycle(doc, w).step);
  assert.deepEqual(got, [1.15, 1.3, 1.5, 1]);
  assert.equal(w.store.get(KEY), '1');
  assert.equal(calls.props['--letters'], '1');
  assert.equal(calls.attrs['data-letters'], '1');
});

test('cycle with throwing storage still applies the next step', () => {
  const { doc, calls } = fakeDoc();
  const r = T.cycle(doc, throwing());
  assert.equal(r.estado, 'MEASURED');
  assert.equal(r.step, 1.15);
  assert.equal(calls.attrs['data-letters'], '1.15');
});

test('restore applies the saved step', () => {
  const { doc, calls } = fakeDoc();
  const r = T.restore(doc, fakeWin('1.5'));
  assert.equal(r.step, 1.5);
  assert.equal(calls.props['--letters'], '1.5');
  assert.equal(T.restore(fakeDoc().doc, throwing()).step, 1);
});

test('the module exports an API; it mounts only through mount(), and only when a gamepad exists', () => {
  for (const k of ['STEPS', 'KEY', 'label', 'next', 'read', 'write', 'apply', 'cycle', 'restore', 'mount']) {
    assert.ok(k in T, k);
  }
  assert.equal(T.KEY, KEY);
  const src = rd(new URL('../../public/game/type_scale.js', import.meta.url), 'utf8');
  assert.equal(src.split('\n').filter((l) => /root\.document/.test(l) && !/^\s*\/\//.test(l)).length, 1, 'one guarded self-mount line only');
  let timers = 0;
  const doc = { querySelector: () => null };
  assert.equal(T.mount(doc, { setTimeout: () => { timers++; } }), null, 'no gamepad: nothing mounts');
  assert.equal(timers, 1, 'it waits for the gamepad once per try');
  assert.equal(T.mount(doc, null, 40), null, 'it stops after 40 tries');
});

test('no random, clock, network or require in the source', () => {
  const src = rd(new URL('../../public/game/type_scale.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|\bDate\b|performance|fetch\(|XMLHttpRequest|require\(|https?:/);
});

test('the module is at most 4000 bytes', () => {
  assert.ok(statSync(new URL('../../public/game/type_scale.js', import.meta.url)).size <= 4000);
});
