// The quest board (the player's soul): progress is what the visit really did; each reward once per visit.
// Uso: node --test atlas/puros/quests_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.AtlasArmy = { crea: () => ({ lista: () => [] }), verificaWeb: null, cronica: () => [] };
globalThis.AtlasGacha = { TCS: {}, tirada: null };
new Function(readFileSync(new URL('../../public/game/visitor_eggs.js', import.meta.url), 'utf8'))();
const account = () => ({ info: () => ({ publicKey: 'k', name: 'v' }), end: () => {} });
const visit = () => globalThis.AtlasVisitorEggs.create(account());

test('a new visit: ten quests, none ready, nothing taken', async () => {
  const q = (await visit()).quests();
  assert.equal(q.length, 10);
  assert.ok(q.every((x) => !x.ready && !x.taken));
});
test('the beacon quest is ready only after the beacon, pays light once', async () => {
  const g = await visit();
  assert.throws(() => g.claim('beacon'), /not ready/);
  g.beacon();
  const s = g.claim('beacon');
  assert.equal(s.light, 50); assert.equal(s.copper, 100);
  assert.throws(() => g.claim('beacon'), /not ready/);
  assert.ok(g.quests().find((x) => x.id === 'beacon').taken);
});
test('walking counts steps; fights and wins are reported by the battle', async () => {
  const g = await visit();
  for (let i = 0; i < 20; i++) g.advance();
  assert.equal(g.claim('walk').copper, 100);
  g.fought(false); g.fought(true);
  const q = g.quests();
  assert.ok(q.find((x) => x.id === 'fight').ready && q.find((x) => x.id === 'win').ready);
});
test('an unknown quest is refused', async () => {
  const g = await visit();
  assert.throws(() => g.claim('gold'), /not ready/);
});
test('buildings feed the quests: three different buildings, and one action', async () => {
  const g = await visit();
  g.entered('coliseum'); g.entered('coliseum'); g.entered('tower');
  assert.equal(g.quests().find((x) => x.id === 'explore').have, 2);
  g.entered('workshop'); g.acted();
  const q = g.quests();
  assert.ok(q.find((x) => x.id === 'explore').ready && q.find((x) => x.id === 'act').ready);
  assert.equal(g.claim('act').light, 100);
});
