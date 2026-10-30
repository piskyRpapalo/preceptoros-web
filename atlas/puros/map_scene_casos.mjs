// Cases of the one-map composition (M1-1). Twice, with sabotages that must go red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const S = require('./map_scene.js');
const F = (id) => ({ v: 'preceptoros.bubble/1', id, t: 0, cv: [120, 110], atoms: [{ k: id, r: 'a sentence', i: [] }], bands: ['paper', 'ink', 'cyan'], change: ['x'], sound: 'NO_DATA: none', soundCause: 'none' });
const ITEMS = [
  { id: 'bot-b', x: 5, y: 40, frame: F('bot-b') },
  { id: 'hex-a', x: 0, y: 10, frame: F('hex-a') },
  { id: 'bot-a', x: 2, y: 40, frame: F('bot-a') },
  { id: 'cabin', x: 0, y: 30, frame: F('cabin') }
];

test('the scene is back to front: by y, then x, then id', () => {
  const sc = S.compose(ITEMS);
  assert.deepEqual(sc.map((e) => e.id), ['hex-a', 'cabin', 'bot-a', 'bot-b']);
  assert.equal(S.inOrder(sc), true);
});

test('the same items give the same scene, twice', () => {
  assert.equal(JSON.stringify(S.compose(ITEMS)), JSON.stringify(S.compose(ITEMS)));
});

test('the input is not reordered in place', () => {
  const before = ITEMS.map((i) => i.id).join();
  S.compose(ITEMS);
  assert.equal(ITEMS.map((i) => i.id).join(), before);
});

test('sabotage: an element with no id is refused', () => {
  assert.throws(() => S.compose([{ x: 0, y: 0, frame: F('a') }]), /no id/);
});

test('sabotage: a repeated id is refused', () => {
  assert.throws(() => S.compose([ITEMS[0], ITEMS[0]]), /repeated id/);
});

test('sabotage: a position that is not finite is refused', () => {
  assert.throws(() => S.compose([{ id: 'z', x: NaN, y: 0, frame: F('z') }]), /finite position/);
});

test('sabotage: a frame of 1,024 bytes or more is refused by the frame law', () => {
  const big = F('big'); big.atoms[0].r = 'x'.repeat(1100);
  assert.throws(() => S.compose([{ id: 'big', x: 0, y: 0, frame: big }]), /limit 1024/);
});

test('sabotage: an out-of-order scene is caught by inOrder', () => {
  const sc = S.compose(ITEMS).slice().reverse();
  assert.equal(S.inOrder(sc), false);
});

test('the module reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./map_scene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
