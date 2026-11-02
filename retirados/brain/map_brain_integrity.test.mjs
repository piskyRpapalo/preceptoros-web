import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const inventory = JSON.parse(readFileSync('public/game/browser_brain_manifest.json', 'utf8'));
const verdictSchema = JSON.parse(readFileSync('odd/contracts/map-brain-status-verdict.schema.json', 'utf8'));
function assertNoDataVerdict(verdict, cause) {
  assert.deepEqual(Object.keys(verdict).sort(), verdictSchema.required.slice().sort());
  assert.equal(verdict.choice, null);
  assert.equal(verdict.score, null);
  assert.equal(verdict.no_data, verdictSchema.properties.no_data.const);
  assert.equal(verdict.causa, cause);
  assert.match(verdict.causa, new RegExp(verdictSchema.properties.causa.pattern));
}
function sandbox() {
  const replies = [], calls = [];
  const self = { fetch: async (...args) => { calls.push(args); throw Error('unexpected network'); } };
  const ctx = vm.createContext({ self, crypto: webcrypto, TextEncoder, URL, Set, Uint8Array, Blob, Response,
    postMessage: message => replies.push(message) });
  vm.runInContext(readFileSync('public/game/map_brain_worker.js', 'utf8') + '\nself.test={validateManifest,recordFor,verify,setManifest:x=>manifest=x};', ctx);
  return { self, replies, calls };
}

test('inventory requires complete unique bounded chunks for the declared model', () => {
  const { self } = sandbox(), judge = self.test.validateManifest;
  assert.equal(judge(inventory), inventory);
  for (const mutate of [
    m => m.base = 'https://example.org/',
    m => m.records.pop(),
    m => m.records[1].name = m.records[0].name,
    m => m.records[0].chunks[0].offset = 1,
    m => m.records[0].chunks.pop(),
    m => m.records[0].chunks[0].sha256 = '0',
    m => m.records[0].chunks[0].bytes = 16777217,
    m => m.records[0].bytes += 1
  ]) {
    const changed = structuredClone(inventory); mutate(changed);
    assert.throws(() => judge(changed));
  }
});

test('no network when loading without consent and rejects unlisted shards', async () => {
  const { self, replies, calls } = sandbox();
  await self.onmessage({ data: { id: 1, type: 'load', consent: false } });
  assert.equal(calls.length, 0);
  assert.match(replies[0].error, /consent/);
  assertNoDataVerdict(replies[0].verdict, 'consent_required');
  self.test.setManifest(inventory);
  await assert.rejects(self.fetch(inventory.base + 'params_shard_99.bin'), /Unlisted/);
  assert.equal(calls.length, 0);
});

test('cached shard digest and byte count are checked', async () => {
  const { self } = sandbox();
  const bytes = new TextEncoder().encode('measured fixture');
  const digest = Buffer.from(await webcrypto.subtle.digest('SHA-256', bytes)).toString('hex');
  const record = { bytes: bytes.length, chunks: [{ offset: 0, bytes: bytes.length, sha256: digest }] };
  await self.test.verify(bytes.buffer, record);
  const corrupt = bytes.slice(); corrupt[0] ^= 1;
  await assert.rejects(self.test.verify(corrupt.buffer, record), /SHA-256/);
  await assert.rejects(self.test.verify(bytes.buffer.slice(1), record), /size/);
});


test('consent never bypasses the missing runtime integrity gate', async () => {
  const { self, replies, calls } = sandbox();
  await self.onmessage({ data: { id: 2, type: 'load', consent: true } });
  assert.equal(calls.length, 0);
  assert.match(replies[0].error, /runtime_integrity_unavailable/);
  assertNoDataVerdict(replies[0].verdict, 'runtime_integrity_unavailable');
  const source = readFileSync('public/game/map_brain_worker.js', 'utf8');
  assert.doesNotMatch(source, /import\s*\(/);
});

test('a chat prompt without a verified model yields only a typed no-data verdict', async () => {
  const { self, replies, calls } = sandbox();
  await self.onmessage({ data: { id: 3, type: 'reply', text: 'Explain the selected piece.', context: 'Tutorial cabin' } });
  assert.equal(calls.length, 0);
  assert.match(replies[0].error, /not loaded/);
  assertNoDataVerdict(replies[0].verdict, 'model_not_installed');
  assert.equal('text' in replies[0], false);
});
