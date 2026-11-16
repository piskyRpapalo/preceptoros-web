// ow_calm.js · OpenWorld, calm: each thing appears when it can act; no capability is removed, only its moment.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../../public/game/ow_calm.js');
test('phase: no visit is arrive; a visit is visit until the first adventure is done or skipped, then free', () => {
  assert.equal(C.phase(false, 'done'), 'arrive');
  assert.equal(C.phase(true, ''), 'visit'); assert.equal(C.phase(true, 'started'), 'visit');
  assert.equal(C.phase(true, 'done'), 'free'); assert.equal(C.phase(true, 'skipped'), 'free');
});
test('the guardian arrow acts from the visit on; the builders\' embers once the visitor is free', () => {
  assert.deepEqual(['arrive', 'visit', 'free'].map((p) => C.shows('arrow', p)), [false, true, true]);
  assert.deepEqual(['arrive', 'visit', 'free'].map((p) => C.shows('embers', p)), [false, false, true]);
});
test('names: the important buildings always, the rest when walked near, every one once free', () => {
  C.KEY.forEach((id) => assert.equal(C.named(id, 6, 'arrive'), true));
  assert.equal(C.named('lottery', 4, 'arrive'), false); assert.equal(C.named('lottery', C.CLOSE, 'visit'), true);
  assert.equal(C.named('lottery', 6, 'free'), true);
  assert.ok(C.KEY.includes('doctor'), 'the doctor stays among the basics');
});
test('label in name: the accessible name begins with the visible name, and keeps the old words', () => {
  assert.equal(C.label('Talk', 'Communication'), 'Talk · Communication');
  assert.equal(C.label('Play', 'Play now. Sign on this device.'), 'Play now. Sign on this device.');
  assert.equal(C.label('Node', 'Node: the buildings of this node'), 'Node: the buildings of this node');
  Object.values(C.NAMES).forEach((n) => assert.ok(n.length <= 8 && /^[A-Z][a-z]+$/.test(n), n));
});
test('sabotage: a phase that shows the embers before the visit is caught', () => {
  const bad = { ...C, shows: (w, p) => true };
  assert.notDeepEqual(['arrive', 'visit'].map((p) => bad.shows('embers', p)), ['arrive', 'visit'].map((p) => C.shows('embers', p)));
});
