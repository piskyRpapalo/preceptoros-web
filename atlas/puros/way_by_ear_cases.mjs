// way_by_ear.js · the guide says real distance and the arrow key the crab stick would really take; then it is quiet.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), W = req('../../public/game/way_by_ear.js'), M = req('../../public/game/map_chunks.js'), C = req('../../public/game/colony_controls.js');
test('here: the crab hex is read from the place heading, else null', () => {
  assert.deepEqual(W.here('Dorvorfen · 0, 0'), [0, 0]); assert.deepEqual(W.here('Agora · -3, 12'), [-3, 12]); assert.equal(W.here('Node · choose a building'), null);
});
test('nextKey: the chosen key is the one whose real step (dirOf, camera turn included) lands nearest', () => {
  const to = [4, 0];
  [0, 90, 180, 270].forEach((deg) => {
    const n = W.nextKey([0, 0], to, M.dirOf, C.DIRS, deg, 1); const s = C.DIRS[M.dirOf(...W.KEYS[n.key], deg, 1)];
    assert.equal(W.dist([s[0], s[1]], to), n.d); assert.ok(n.d < 4, 'the step brings the crab closer at ' + deg + '°');
  });
});
test('line: arrival, a heading of one or two keys, a new heading — and the chip says the same facts', () => {
  assert.equal(W.line('Lottery', 1, ['ArrowUp']), 'You are next to Lottery. Open Node to go in.');
  assert.equal(W.line('Lottery', 4, ['ArrowLeft', 'ArrowUp']), 'Lottery: 4 hexes away. Next: Left arrow, then Up arrow.');
  assert.match(W.line('Lottery', 4, ['ArrowRight'], 'turn'), /^New heading\. /);
  assert.equal(W.chipText('Lottery', 4, ['ArrowLeft', 'ArrowUp']), '◎ Lottery · 4 hexes · ← ↑');
});
test('heading: alternating Left/Up is one heading in either order (no «turn» at every zigzag step)', () => {
  assert.equal(W.heading(['ArrowLeft', 'ArrowUp']), W.heading(['ArrowUp', 'ArrowLeft']));
  assert.notEqual(W.heading(['ArrowLeft', 'ArrowUp']), W.heading(['ArrowRight']));
});
test('plan: a diagonal gives two keys, each a real step closer', () => {
  const p = W.plan([0, 0], [-2, -2], M.dirOf, C.DIRS, 0, 1); assert.ok(p.length >= 1 && p.length <= 2);
  let at = [0, 0]; p.forEach((k) => { const s = C.DIRS[M.dirOf(...W.KEYS[k], 0, 1)], n = [at[0] + s[0], at[1] + s[1]]; assert.ok(W.dist(n, [-2, -2]) < W.dist(at, [-2, -2])); at = n; });
});
test('sabotage: an unknown direction never invents a step', () => {
  assert.equal(W.nextKey([0, 0], [3, 0], () => 'nowhere', C.DIRS, 0, 1), null);
});
