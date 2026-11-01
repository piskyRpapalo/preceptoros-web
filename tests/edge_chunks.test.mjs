// Edge chunks: the worker labels the baked world immutable and the index short-lived; it keeps no state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const seen = [];
const env = { ASSETS: { fetch: async (req) => {
  const p = new URL(req.url).pathname; seen.push(p);
  return p.includes('missing') ? new Response('no', { status: 404 })
    : new Response('asset:' + p, { status: 200, headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } });
} } };
const go = (p, h) => worker.fetch(new Request('https://preceptoros.org' + p, { headers: h || {} }), env);
const IMM = 'public, max-age=31536000, immutable';

test('a content-addressed chunk is immutable and its ETag is the sha in its name', async () => {
  const r = await go('/map/chunks/-17_8.533552f4.json');
  assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), IMM);
  assert.equal(r.headers.get('etag'), '"533552f4"'); assert.equal(await r.text(), 'asset:/map/chunks/-17_8.533552f4.json');
});

test('a matching If-None-Match answers 304 without touching the assets', async () => {
  const n = seen.length, r = await go('/map/chunks/0_0.1a4f24a6.json', { 'if-none-match': '"1a4f24a6"' });
  assert.equal(r.status, 304); assert.equal(seen.length, n);
});

test('art and model parts are immutable; the carta revalidates', async () => {
  for (const p of ['/art/sea-palette.json', '/models/web-node/m.bin.part0']) assert.equal((await go(p)).headers.get('cache-control'), IMM, p);
  const c = await go('/map/carta.json');
  assert.equal(c.headers.get('cache-control'), 'public, max-age=300, must-revalidate'); assert.equal(c.headers.get('etag'), null);
});

test('lookalikes and other files keep the asset defaults; errors are never made immutable', async () => {
  for (const p of ['/map/chunks/0_0.json', '/map/chunks/0_0.XYZ.json', '/art/sub/x.json', '/game/map_chunks.js', '/']) {
    assert.equal((await go(p)).headers.get('cache-control'), 'public, max-age=0, must-revalidate', p);
  }
  const e = await go('/art/missing.json');
  assert.equal(e.status, 404); assert.notEqual(e.headers.get('cache-control'), IMM);
});

test('no cookie is set on any edge-cached path', async () => {
  for (const p of ['/map/chunks/0_0.1a4f24a6.json', '/map/carta.json', '/art/sea-palette.json']) assert.equal((await go(p)).headers.get('set-cookie'), null);
});
