// Cases for the chunk router (no weights). Real bytes and real SHA-256; sabotage changes one byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const R = require('../public/game/chunk_router.js');

async function trozo(n, semilla) {
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i++) { b[i] = (i * 31 + semilla) & 255; }
  return { name: 'chunk-' + semilla, bytes: n, buf: b.buffer, sha256: await R.sha256(b.buffer) };
}

test('no manifest, no chunks: the router says NO_DATA (today, with no weights)', () => {
  assert.deepEqual(R.planifica({ chunks: [] }), { ok: false, causa: 'NO_DATA · no_chunks_published' });
  assert.equal(R.planifica(null).ok, false);
});

test('a manifest entry without a 64-hex SHA-256 is rejected', () => {
  const p = R.planifica({ chunks: [{ name: 'a', bytes: 10, sha256: 'nope' }] });
  assert.equal(p.ok, false);
  assert.match(p.causa, /bad_chunk_entry/);
});

test('the plan states origin, total size and boundaries before any download', async () => {
  const a = await trozo(8, 1), b = await trozo(4, 2);
  const p = R.planifica({ origin: 'preceptoros.org', chunks: [{ name: a.name, bytes: a.bytes, sha256: a.sha256 }, { name: b.name, bytes: b.bytes, sha256: b.sha256 }] });
  assert.equal(p.ok, true);
  assert.equal(p.total_bytes, 12);
  assert.deepEqual(p.chunks.map((c) => [c.from, c.to]), [[0, 8], [8, 12]]);
});

test('no consent, no download: zero requests', async () => {
  const a = await trozo(8, 1);
  const p = R.planifica({ chunks: [{ name: a.name, bytes: a.bytes, sha256: a.sha256 }] });
  let pidio = 0;
  const r = await R.descarga(p, { consentido: false, fetch: async () => { pidio++; return a.buf; } });
  assert.match(r.causa, /consent_required/);
  assert.equal(pidio, 0, 'a request was made without consent');
});

test('a missing chunk in the cache is NO_DATA · cache_chunk_missing', async () => {
  const a = await trozo(8, 1);
  const p = R.planifica({ chunks: [{ name: a.name, bytes: a.bytes, sha256: a.sha256 }] });
  const r = await R.descarga(p, { consentido: true, cache: new Map(), fetch: async () => null });
  assert.equal(r.ok, false);
  assert.match(r.causa, /cache_chunk_missing/);
});

test('verified chunks come through', async () => {
  const a = await trozo(8, 1);
  const p = R.planifica({ chunks: [{ name: a.name, bytes: a.bytes, sha256: a.sha256 }] });
  const r = await R.descarga(p, { consentido: true, cache: new Map([[a.name, a.buf]]) });
  assert.equal(r.ok, true);
  assert.equal(r.chunks.get(a.name).byteLength, 8);
});

test('sabotage: one changed byte in a chunk is caught by its SHA-256', async () => {
  const a = await trozo(8, 1);
  const malo = new Uint8Array(a.buf); malo[3] ^= 1;
  const p = R.planifica({ chunks: [{ name: a.name, bytes: a.bytes, sha256: a.sha256 }] });
  const r = await R.descarga(p, { consentido: true, cache: new Map([[a.name, malo.buffer]]) });
  assert.equal(r.ok, false);
  assert.match(r.causa, /chunk_hash_mismatch/);
});

test('no model installed: the answer is NO_DATA, never a guess', () => {
  assert.deepEqual(R.responde('hola', null), { ok: false, causa: 'NO_DATA · model_not_installed' });
  assert.equal(R.responde('   ', { ok: true, responde: () => 'x' }).ok, false);
});

test('with a loaded model the answer comes from the model', () => {
  const r = R.responde('hola', { ok: true, responde: (q) => 'eco: ' + q });
  assert.deepEqual(r, { ok: true, texto: 'eco: hola' });
});
