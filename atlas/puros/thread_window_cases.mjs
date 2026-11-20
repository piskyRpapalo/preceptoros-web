import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const W = require('../../public/game/thread_window.js');
const bytes = (s) => new TextEncoder().encode(s).length;

test('empty session: only visitor input goes outbound', () => {
  const t = W.create();
  assert.equal(t.outbound('hello'), 'hello');
});

test('short context retained if transport byte budget allows', () => {
  const t = W.create();
  t.append('you', 'What is our name?'); t.append('node0', 'River Library');
  const out = t.outbound('What did I say?');
  assert.ok(out.includes('River Library')); assert.ok(out.includes('What did I say?'));
  assert.ok(bytes(out) <= 600);
});

test('full session never exceeds transport 600 bytes incl emoji', () => {
  const t = W.create();
  for (let i = 0; i < 12; i++) t.append(i % 2 ? 'node0' : 'you', '🦀'.repeat(150));
  const message = '🦀'.repeat(100);
  const out = t.outbound(message);
  assert.ok(bytes(out) <= 600);
  assert.ok(out.endsWith(message));
});

test('long message remains intact; unrelated history is omitted', () => {
  const t = W.create();
  t.append('you', 'a'.repeat(400));
  const latest = 'b'.repeat(590);
  assert.equal(t.outbound(latest), latest);
});

test('overlong input fails closed rather than truncating content', () => {
  const t = W.create();
  assert.throws(() => t.outbound('🦀'.repeat(151)), /message_exceeds_chat_transport/);
});

test('session reset destroys all prior facts', () => {
  const t = W.create();
  t.append('node0', 'private ephemeral conversation');
  t.clear();
  assert.equal(t.size(), 0);
  assert.equal(t.outbound('hello'), 'hello');
});

test('snapshot does not expose mutable backing state', () => {
  const t = W.create();
  t.append('you', 'hello');
  const snap = t.snapshot(); snap[0].text = 'changed'; snap.push({role:'node0',text:'extra'});
  assert.deepEqual(t.snapshot(), [{role:'you',text:'hello'}]);
});

test('full signed-turn envelope blocks oversized text before network access', async () => {
  const api = require('../../public/game/classroom_chat.js');
  let sent = false;
  const out = await api.turn(async () => { sent = true; throw new Error('must not send'); },
    'a'.repeat(64), '🦀'.repeat(150),
    { tic: 1, hash: 'b'.repeat(64), sello: { tic: 1, hash: 'b'.repeat(64), firma: 'c'.repeat(128) } },
    '/openworld/');
  assert.equal(sent, false);
  assert.equal(out.ok, false);
  assert.equal(out.cause, 'cief_invalido');
});
test('normal chat envelope still reaches fake gateway and rejects non-OK reply', async () => {
  const api = require('../../public/game/classroom_chat.js');
  let sent = 0;
  const out = await api.turn(async (_, req) => {
    sent += 1;
    assert.ok(bytes(req.body) < 1024);
    return { status: 503, json: async () => ({causa: 'nodo_dormido'}) };
  }, 'a'.repeat(64), 'hello', {tic:0, hash:null,sello:null}, '/openworld/');
  assert.equal(sent, 1);
  assert.equal(out.ok, false);
  assert.equal(out.cause, 'nodo_dormido');
});
