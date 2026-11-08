// E4 + B5 · the inhabitants say only what the heartbeats measure, through the single state table.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const S = require('../../public/game/agent_state.js');
const I = require('../../public/game/inhabitants.js');
const T = JSON.parse(readFileSync(new URL('../../public/game/agent_states.json', import.meta.url), 'utf8'));
const world = (nodes) => ({ colonia: { nodes } });

test('a live node is ready; a node without a heartbeat is unavailable with the measured cause', () => {
  const r = I.from(world([{ id: 'a', alive: true, seal: 'LIVE' }, { id: 'b', alive: false }]), S, T);
  assert.equal(r.ok, true);
  assert.deepEqual(r.people.map((p) => p.text), ['ready', 'unavailable']);
  assert.equal(r.people[1].say, 'inhabitant 2 unavailable · no_heartbeat');
});

test('working is never claimed: the source does not measure activity', () => {
  const r = I.from(world([{ alive: true, seal: 'LIVE' }, { alive: true, seal: 'LIVE' }]), S, T);
  assert.ok(r.people.every((p) => p.text !== 'working'));
  assert.match(r.line, /working NO_DATA \(the heartbeat does not measure activity\)$/);
});

test('an undeclared alive field is NO_DATA with its cause, not a guess', () => {
  const r = I.from(world([{}, null]), S, T);
  assert.deepEqual(r.people.map((p) => p.say), ['inhabitant 1 NO_DATA · alive_not_declared', 'inhabitant 2 NO_DATA · alive_not_declared']);
});

test('machine ids never reach the spoken line', () => {
  const r = I.from(world([{ id: 'secret-box-name', alive: true, seal: 'LIVE' }]), S, T);
  assert.doesNotMatch(r.line, /secret-box-name/);
});

test('the publisher NO_DATA cause is said as it comes', () => {
  assert.equal(I.from({ cobertura: { causa: 'publisher down' } }, S, T).line, 'NO_DATA · publisher down');
  assert.equal(I.from(null, S, T).line, 'NO_DATA · world_state_unreadable');
});

test('an empty town says so', () => {
  assert.equal(I.from(world([]), S, T).line, 'no inhabitants yet · the town is empty');
});

test('the same world gives the same line', () => {
  const w = world([{ alive: true }, { alive: false }]);
  assert.equal(I.from(w, S, T).line, I.from(JSON.parse(JSON.stringify(w)), S, T).line);
});

test('pure: no clock, randomness, network or DOM in the piece', () => {
  const src = readFileSync(new URL('../../public/game/inhabitants.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|fetch\(|document\./);
});

test('alive with a STALE heartbeat seal is not ready: the same rule as Nodes online', () => {
  const r = I.from(world([{ alive: true, seal: 'STALE' }, { alive: true, seal: 'LIVE' }]), S, T);
  assert.deepEqual(r.people.map((p) => p.text), ['unavailable', 'ready']);
  assert.match(r.line, /^2 inhabitants · 1 ready/);
});
