// C2 (odd/tasks/fog-and-conquest.md): an NPC building fields a squad that comes from its key alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
globalThis.AtlasValores = { patrullas: [{ id: 'a', n: 3, tc: 'tc1' }, { id: 'b', n: 5, tc: 'tc3' }], combate: { tropas_max: 10 } };
globalThis.AtlasCanon = { sha: (s) => createHash('sha256').update(s).digest('hex') };
createRequire(import.meta.url)('../../public/game/visitor_battle.js');
const B = globalThis.AtlasVisitorBattle;
test('the same building fields the same squad; another building may not', () => {
  const a = B.npcPlace('b:customs:-3,0'), b = B.npcPlace('b:customs:-3,0'), c = B.npcPlace('b:customs:5,2');
  assert.deepEqual(a, b);
  assert.equal(a.name, 'NPC customs'); assert.deepEqual(a.coordinate, [-3, 0]);
  assert.ok(a.troops.length >= 3 && a.troops.every((t) => /^tc[1-4]$/.test(t.tc) && /^[a-f0-9]{64}$/.test(t.semilla)));
  assert.notDeepEqual(a.troops, c.troops);
});
test('only a building key is an NPC place', () => {
  for (const id of ['arrecife', 'b:', 'b:Customs:1,1', 'b:customs:1', 'x:customs:1,1', undefined]) { assert.equal(B.npcPlace(id), null, String(id)); }
  assert.ok(B.npcPlace('b:model-tower:-12,7'));
});
