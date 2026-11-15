// town_plan_cases.mjs · the node's town (public/game/town_plan.js, 2026-11-15): hall at the node, ten buildings inside the
// coloured territory, every NPC building outside it, the fog's clearing = the territory.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), T = req('../public/game/town_plan.js'), MC = req('../public/game/map_chunks.js');
const cells = []; for (let q = -20; q <= 20; q++) for (let r = -20; r <= 20; r++) if (T.hexDist([q, r], [0, 0]) <= 20) cells.push([q, r, 0, 'floor']);
const world = () => ({ cells: { list: cells, at: Object.fromEntries(cells.map((c) => [c[0] + ',' + c[1], c])) } });
const mix = (q, r) => { let h = (q * 73856093) ^ (r * 19349663) ^ 20261108; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };
test('ring(R) has 6R distinct hexes, all at distance R; slots spread evenly', () => {
  for (const R of [1, 3, 4]) { const r = T.ring(R); assert.equal(r.length, 6 * R); assert.ok(r.every((c) => T.hexDist(c, [0, 0]) === R)); assert.equal(new Set(r.map(String)).size, 6 * R); }
  const s = T.slots(10); assert.equal(new Set(s.map(String)).size, 10);
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) assert.ok(T.hexDist(s[i], s[j]) >= 2, 'two buildings side by side');
});
test('plan: one of each kind is the node\'s, on the ring, inside the territory; every NPC building is outside', () => {
  const p = T.plan(world(), MC.KINDS, mix, []), own = p.markList.filter((m) => !m.fog), npc = p.markList.filter((m) => m.fog);
  assert.deepEqual(own.map((m) => m.id).sort(), MC.KINDS.map((k) => k[0]).sort());
  assert.ok(own.every((m) => T.hexDist([m.q, m.r], [0, 0]) === T.RING && p.city[m.q + ',' + m.r]));
  assert.ok(npc.length > 10 && npc.every((m) => T.hexDist([m.q, m.r], [0, 0]) > T.TERR + 1 && !p.city[m.q + ',' + m.r]));
});
test('plan: the territory is coloured to TERR and nothing beyond; the square around the hall is paved', () => {
  const p = T.plan(world(), MC.KINDS, mix, []);
  for (const c of cells) { const d = T.hexDist(c, [0, 0]), v = p.city[c[0] + ',' + c[1]]; assert.equal(!!v, d <= T.TERR, 'hex ' + c); if (d <= T.SQUARE) assert.equal(v, 1); }
});
test('plan is deterministic, and map_chunks.landmarks uses it', () => {
  assert.deepEqual(T.plan(world(), MC.KINDS, mix, []).markList, T.plan(world(), MC.KINDS, mix, []).markList);
  const w = world(); MC.landmarks(w); assert.equal(w.markList.filter((m) => !m.fog).length, MC.KINDS.length); assert.ok(w.city['0,0']);
});
test('sabotage: an NPC building moved inside the territory is caught', () => {
  const p = T.plan(world(), MC.KINDS, mix, []), m = p.markList.find((x) => x.fog); m.q = 1; m.r = 1;
  assert.ok(p.markList.some((x) => x.fog && T.hexDist([x.q, x.r], [0, 0]) <= T.TERR));
});
test('wall: the territory edge is 6(2R+1) hex sides, each from a hex at TERR to one outside', () => {
  const e = T.edges(T.TERR); assert.equal(e.length, 6 * (2 * T.TERR + 1));
  assert.ok(e.every(([a, b, c, d]) => T.hexDist(a, [0, 0]) === T.TERR && T.hexDist(b, [0, 0]) === T.TERR + 1 && T.hexDist(a, c) === 1 && T.hexDist(b, c) === 1 && T.hexDist(a, d) === 1 && T.hexDist(b, d) === 1));
});
