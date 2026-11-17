// ow_calm.js · OpenWorld, calm: each thing appears when it can act; no capability is removed, only its moment.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../../public/game/ow_calm.js');
test('phase: no visit is arrive; a visit stays visit regardless of tutorial state', () => {
  assert.equal(C.phase(false, 'done'), 'arrive');
  assert.equal(C.phase(true, ''), 'visit'); assert.equal(C.phase(true, 'started'), 'visit');
  assert.equal(C.phase(true, 'done'), 'visit'); assert.equal(C.phase(true, 'skipped'), 'visit');
});
test('the guardian arrow acts from the visit on; the builders\' embers also from the visit on (not gated by phase)', () => {
  assert.deepEqual(['arrive', 'visit'].map((p) => C.shows('arrow', p)), [false, true]);
  assert.deepEqual(['arrive', 'visit'].map((p) => C.shows('embers', p)), [false, true]);
});
test('names: the important buildings always, the rest when walked near (no phase shortcut)', () => {
  C.KEY.forEach((id) => assert.equal(C.named(id, 6, 'arrive'), true));
  assert.equal(C.named('lottery', 4, 'arrive'), false); assert.equal(C.named('lottery', C.CLOSE, 'visit'), true);
  assert.equal(C.named('lottery', 6, 'visit'), false); // distance > CLOSE: never shown by phase alone
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
