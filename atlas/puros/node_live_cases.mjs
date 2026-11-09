// Y7 · node_live.js: the Live nodes line says NO_DATA without a measured heartbeat, never zero; names are the LIVE seals.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const N = createRequire(import.meta.url)('../../public/game/node_live.js');
test('unknown heartbeat is NO_DATA, not zero', () => { assert.match(N.line(''), /^Live nodes: NO_DATA/); assert.deepEqual(N.names(''), []); });
test('a measured heartbeat with no live node says none', () => { assert.equal(N.line('-'), 'Live nodes: none right now.'); assert.deepEqual(N.names('-'), []); });
test('live nodes are counted and named in order', () => {
  assert.equal(N.line('primer-ancla doggee-s110'), 'Live nodes: 2 · primer-ancla, doggee-s110.');
  assert.deepEqual(N.names('primer-ancla doggee-s110'), ['primer-ancla', 'doggee-s110']);
});
