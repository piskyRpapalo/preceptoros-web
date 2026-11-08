// Agent state table cases (E4+B5). Offline, synthetic. Loads the REAL table from public/game/agent_states.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const A = require('../../public/game/agent_state.js');
const SRC = new URL('../../public/game/agent_state.js', import.meta.url);
const T = JSON.parse(readFileSync(new URL('../../public/game/agent_states.json', import.meta.url), 'utf8'));
const clone = () => JSON.parse(JSON.stringify(T));

test('the real table is valid', () => {
  assert.deepEqual(A.valida(T), []);
});

test('valida rejects an extra state', () => {
  const t = clone();
  t.states.zombie = { shape: 'circle', text: 'zombie' };
  assert.ok(A.valida(t).includes('states_not_exact'));
});

test('valida rejects an unknown destination', () => {
  const t = clone();
  t.table.ready.start = 'sleeping';
  assert.deepEqual(A.valida(t), ['table_to_unknown:ready.start']);
});

test('valida rejects unavailable without cause_required', () => {
  const t = clone();
  delete t.states.unavailable.cause_required;
  assert.deepEqual(A.valida(t), ['unavailable_no_cause_required']);
});

test('valida rejects a cause that is not snake_case', () => {
  const t = clone();
  t.causes.push('Bad-Cause');
  assert.deepEqual(A.valida(t), ['cause_not_snake:Bad-Cause']);
});

test('happy path: start, ask, signed, finish goes ready, working, needs-you, working, ready', () => {
  const ev = [{ event: 'start' }, { event: 'ask' }, { event: 'signed' }, { event: 'finish' }];
  const seen = [];
  for (let i = 0; i <= ev.length; i++) seen.push(A.replay(T, ev.slice(0, i)).state);
  assert.deepEqual(seen, ['ready', 'working', 'needs-you', 'working', 'ready']);
});

test('drop with a measured cause goes unavailable and says the cause', () => {
  const r = A.step(T, 'working', 'drop', 'connection_closed');
  assert.deepEqual(r, { state: 'unavailable', cause: 'connection_closed' });
  const v = A.view(T, r);
  assert.equal(v.say, 'unavailable · connection_closed');
  assert.equal(v.text, 'unavailable');
  assert.equal(v.shape, 'dash');
});

test('drop without a cause, or with an invented one, is NO_DATA', () => {
  const want = { state: 'NO_DATA', cause: 'unavailable_without_measured_cause' };
  assert.deepEqual(A.step(T, 'working', 'drop'), want);
  assert.deepEqual(A.step(T, 'ready', 'drop', 'gremlins'), want);
  const v = A.view(T, A.step(T, 'working', 'drop'));
  assert.equal(v.shape, 'dash');
  assert.equal(v.say, 'NO_DATA · unavailable_without_measured_cause');
});

test('illegal transition is NO_DATA, and replay stops there with its index', () => {
  assert.deepEqual(A.step(T, 'ready', 'finish'),
    { state: 'NO_DATA', cause: 'agent_illegal_transition', from: 'ready', event: 'finish' });
  const r = A.replay(T, [{ event: 'start' }, { event: 'start' }, { event: 'ask' }]);
  assert.equal(r.state, 'NO_DATA');
  assert.equal(r.cause, 'agent_illegal_transition');
  assert.equal(r.index, 1);
});

test('same record gives the same result, twice', () => {
  const ev = [{ event: 'start' }, { event: 'drop', cause: 'no_heartbeat' }, { event: 'revive' }];
  assert.deepEqual(A.replay(T, ev), A.replay(T, ev));
  assert.deepEqual(A.replay(T, ev), { state: 'ready', cause: '' });
  assert.deepEqual(A.replay(T, ev.slice(0, 2)), A.replay(T, ev.slice(0, 2)));
});

test('revive takes unavailable back to ready and clears the cause', () => {
  const d = A.step(T, 'working', 'drop', 'station_unreachable');
  const r = A.step(T, d.state, 'revive');
  assert.deepEqual(r, { state: 'ready', cause: '' });
  assert.equal(A.view(T, r).say, 'ready');
});

test('wake does not compute an asleep agent and computes a visible one once', () => {
  let n = 0;
  const f = () => { n++; return 42; };
  assert.deepEqual(A.wake(false, f), { asleep: true });
  assert.deepEqual(A.wake('yes', f), { asleep: true });
  assert.equal(n, 0);
  assert.deepEqual(A.wake(true, f), { asleep: false, value: 42 });
  assert.equal(n, 1);
});

test('each state is told apart by shape and by text', () => {
  const names = Object.keys(T.states);
  for (const a of names) {
    for (const b of names) {
      if (a === b) continue;
      assert.notEqual(T.states[a].shape, T.states[b].shape, a + '/' + b);
      assert.notEqual(T.states[a].text, T.states[b].text, a + '/' + b);
    }
  }
});

test('the source is pure and within 4096 bytes', () => {
  const src = readFileSync(SRC, 'utf8');
  for (const bad of ['Math.random', 'Date.now', 'fetch(', 'document.']) {
    assert.equal(src.includes(bad), false, bad);
  }
  assert.ok(Buffer.byteLength(src) <= 4096, String(Buffer.byteLength(src)));
});
