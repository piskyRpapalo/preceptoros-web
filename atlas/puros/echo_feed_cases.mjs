// Echoes (public/game/echo_feed.js): the world's events from the one bus 'acho:event'. Pure laws.
//   node --test atlas/puros/echo_feed_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('../../public/game/echo_feed.js');

test('an echo keeps its source, kind, sentence and hex', () => {
  const e = F.read({ id: 'building/yours/3,-2', event: { kind: 'building.yours', source: 'local' }, frame: { change: ['Yours now'] } }, 5);
  assert.deepEqual(e, { id: 'building/yours/3,-2', kind: 'building.yours', source: 'local', line: 'Yours now', hex: [3, -2], t: 5 });
  const n = F.read({ id: 'node/tank-3', event: { kind: 'node.state', status: 'LIVE', source: 'gateway' }, frame: { atoms: [{ r: 'Tank 3 · LIVE' }] } }, 1);
  assert.equal(n.source, 'gateway'); assert.equal(n.line, 'Tank 3 · LIVE'); assert.equal(n.hex, null);
});

test('an event without a source is not an echo (never invented)', () => {
  assert.equal(F.read({ id: 'odds/1', frame: { change: ['x'] } }, 0), null);
  assert.equal(F.read({ id: 'x', event: { source: 'rumour' } }, 0), null);
  assert.equal(F.read(null, 0), null);
  assert.equal(F.read({ id: 7 }, 0), null);
});

test('presence and world frames from the shared authority count as gateway', () => {
  assert.equal(F.read({ id: 'presence/abc', frame: {} }, 0).source, 'gateway');
  assert.equal(F.read({ id: 'world/nodes', frame: {} }, 0).source, 'gateway');
});

test('age is written for people', () => {
  assert.equal(F.age(0), '0 s ago'); assert.equal(F.age(59000), '59 s ago'); assert.equal(F.age(180000), '3 min ago'); assert.equal(F.age(-5), '0 s ago');
});

test('a long sentence is cut at 140 characters', () => {
  assert.equal(F.read({ id: 'a', event: { source: 'local' }, frame: { change: ['y'.repeat(400)] } }, 0).line.length, 140);
});

// Town echoes (public/game/town_echoes.js), held here so CI runs them with the feed they speak through.
const T = createRequire(import.meta.url)('../../public/game/town_echoes.js');
test('only locked → available is an opening', () => {
  assert.deepEqual(T.opened({ workshop: 'locked', agora: 'locked', hostel: 'available' }, { workshop: 'available', agora: 'locked', hostel: 'available' }), ['workshop']);
  assert.deepEqual(T.opened({ workshop: 'available' }, { workshop: 'available' }), []);
  assert.deepEqual(T.opened(null, { workshop: 'available' }), []); // the first reading is not news
});
test('the echo names the building and carries its hex for the ring', () => {
  const e = T.echo('workshop', 3, -2);
  assert.equal(e.id, 'town/open/workshop/3,-2'); assert.equal(e.event.source, 'local'); assert.equal(e.event.kind, 'town.open');
  assert.equal(e.frame.change[0], 'Workshop opens in the town · walk to it');
});
test('echo_feed reads it as a local echo on that hex', async () => {
  const F = createRequire(import.meta.url)('../../public/game/echo_feed.js');
  const r = F.read(T.echo('agora', -1, 4), 1000);
  assert.deepEqual([r.source, r.kind, r.hex, r.line], ['local', 'town.open', [-1, 4], 'Agora opens in the town · walk to it']);
});
