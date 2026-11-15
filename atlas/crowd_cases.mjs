// crowd_cases.mjs · crowds, not piles (2026-11-15): crabs on one hex stand side by side (shared_crabs.js slot), the
// near building name has one label (map_chunks.js yields to map_aura.js), and preceptor news docks at the map's foot.
import { readFileSync } from 'node:fs'; import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../public/game/shared_crabs.js');
const src = (f) => readFileSync(new URL('../public/game/' + f, import.meta.url), 'utf8');
test('slot: the own crab keeps the centre; the others alternate right, left, farther — every slot distinct', () => {
  const s = Array.from({ length: 7 }, (_, i) => S.slot(i));
  assert.deepEqual(s, [0, 1, -1, 2, -2, 3, -3]);
  assert.equal(new Set(s).size, s.length, 'no two crabs on one place');
});
test('slot is deterministic and has no chance: the order is by id, never random', () => {
  assert.ok(!/Math\.random/.test(src('shared_crabs.js')));
  assert.ok(/a\.id < b\.id/.test(src('shared_crabs.js')), 'the crowd is ordered by id');
});
test('one name per near building: the small label yields where the aura draws the tappable one', () => {
  assert.ok(/dd <= 2 && root\.AtlasMapAura/.test(src('map_chunks.js')));
});
test('preceptor news docks at the foot, above the beacon bar; it never floats over the crabs', () => {
  const t = src('preceptor_talk.js');
  assert.ok(/var dock = news \|\|/.test(t)); assert.ok(/st\.height - h - 8 - foot/.test(t));
});
