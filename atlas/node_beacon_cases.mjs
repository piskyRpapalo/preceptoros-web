// node_beacon_cases.mjs · the live node on the map (public/game/node_beacon.js, 2026-11-15): honest words, honest lamp.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const B = createRequire(import.meta.url)('../public/game/node_beacon.js');
test('label: the Beelink by its human name; LIVE says live, STALE says asleep with its last heartbeat day', () => {
  assert.equal(B.label({ id: 'primer-ancla', seal: 'LIVE', since: '2026-11-15' }), '💬 Beelink · live');
  assert.equal(B.label({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }), '💬 Beelink · asleep 11-09');
  assert.equal(B.label({ id: 'onexstation', seal: 'STALE', since: '' }), 'Onexstation · asleep NO_DATA');
});
test('pick: only alive nodes on an integer cell; any seal other than LIVE is STALE (never a fake glow)', () => {
  const d = { colonia: { nodes: [{ id: 'primer-ancla', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-11-15' },
    { id: 'x', q: 1.5, r: 0, alive: true, seal: 'LIVE' }, { id: 'y', q: 2, r: 0, alive: false, seal: 'LIVE' }, { id: 'z', q: 3, r: 0, alive: true, seal: 'BRIGHT' }] } };
  assert.deepEqual(B.pick(d).map((n) => n.id + ':' + n.seal), ['primer-ancla:LIVE', 'z:STALE']);
  assert.deepEqual(B.pick(null), []); assert.deepEqual(B.pick({ colonia: {} }), []);
});
test('describe: state, cause and age in words; talk only for the node that declares a chatbot', () => {
  const s = B.describe({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }, '2026-11-15');
  assert.match(s, /^Beelink node, asleep: no heartbeat in the last 5 minutes; the last one was 2026-11-09, 6 days ago\./); assert.match(s, /Hexelion/);
  assert.match(B.describe({ id: 'primer-ancla', seal: 'LIVE', since: '2026-11-15' }, '2026-11-15'), /^Beelink node, live/);
  const o = B.describe({ id: 'onexstation', seal: 'STALE', since: '' }, '2026-11-15');
  assert.match(o, /never measured \(NO_DATA\)/); assert.match(o, /declares no chatbot \(NO_DATA\)/); assert.doesNotMatch(o, /live/);
});
test('frame: the machine reads the same truth (status, source, age, talks) in under 1,024 bytes', () => {
  const f = B.frame({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }, '2026-11-15');
  assert.equal(f.status, 'STALE'); assert.equal(f.age_days, 6); assert.equal(f.talks, 'Hexelion'); assert.equal(f.source, 'gateway:/api/world-state');
  assert.equal(f.change[0], B.describe({ id: 'primer-ancla', seal: 'STALE', since: '2026-11-09' }, '2026-11-15'));
  assert.ok(new TextEncoder().encode(JSON.stringify(f)).length < 1024);
  assert.equal(B.frame({ id: 'doggee-s110', seal: 'STALE', since: '2026-11-09' }, '2026-11-15').talks, null);
});
