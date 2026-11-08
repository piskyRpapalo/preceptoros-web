// E0 (Sovereign, 2026-11-08): the basic chat sends a message of up to 25 MB to the rack in verified 256 KiB pieces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../../public/game/open_talk.js');
const h = (b) => createHash('sha256').update(b).digest('hex');
function intake() {
  const got = { man: null, pieces: [] };
  const net = async (url, o) => {
    if (o.method === 'POST') { got.man = JSON.parse(o.body); const raiz = h(got.man.piezas.join('')); return { ok: true, json: async () => ({ raiz }) }; }
    const i = +url.split('/').pop(), ok = h(o.body) === got.man.piezas[i]; got.pieces[i] = o.body;
    return { ok, status: ok ? 200 : 400, json: async () => (ok ? { estado: 'pieza_ok' } : { causa: 'pieza_hash' }) };
  };
  return { got, net };
}
test('a 1 MB message leaves in 256 KiB pieces whose hashes the manifest names, and the root comes back', async () => {
  const text = 'idea '.repeat(210_000), { got, net } = intake(), said = [];
  const root = await C.send(text, (t) => said.push(t), net, webcrypto.subtle);
  const bytes = new TextEncoder().encode(text);
  assert.equal(got.man.bytes, bytes.length); assert.equal(got.man.sha256, h(bytes));
  assert.equal(got.man.piezas.length, Math.ceil(bytes.length / C.PIECE)); assert.equal(root, h(got.man.piezas.join('')));
  assert.equal(h(Buffer.concat(got.pieces.map((p) => Buffer.from(p)))), h(bytes), 'the pieces do not rebuild the message');
  assert.match(said.at(-1), /^Sending piece \d+ of \d+/);
});
test('over 25 MB and empty messages never leave; a refused piece says its cause', async () => {
  const { net } = intake();
  await assert.rejects(C.send('', () => {}, net, webcrypto.subtle), /empty/);
  await assert.rejects(C.send('x'.repeat(C.MAX + 1), () => {}, net, webcrypto.subtle), /over 25 MB/);
  const bad = async (u, o) => (o.method === 'POST' ? { ok: true, json: async () => ({ raiz: 'r' }) } : { ok: false, status: 400, json: async () => ({ causa: 'pieza_hash' }) });
  await assert.rejects(C.send('hello', () => {}, bad, webcrypto.subtle), /pieza_hash/);
});
test('the law is shown in plain words: text only, no IP or account, erased within 24 hours, data not orders', () => {
  assert.match(C.LAW, /25 MB/); assert.match(C.LAW, /no IP or account/); assert.match(C.LAW, /24 hours/); assert.match(C.LAW, /never as orders/);
});
test('the 24-hour list: the first look only learns what is there; a new message afterwards is fresh once', () => {
  const seen = {};
  assert.deepEqual(C.fresh(seen, [{ raiz: 'a' }, { raiz: 'b' }], true), [], 'old messages must not toast on arrival');
  assert.deepEqual(C.fresh(seen, [{ raiz: 'c' }, { raiz: 'a' }], false).map((m) => m.raiz), ['c']);
  assert.deepEqual(C.fresh(seen, [{ raiz: 'c' }], false), [], 'a message toasts twice');
});
