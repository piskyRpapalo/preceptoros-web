import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worldState} from '../worker/world_state.js';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const feed = require('../public/game/world_feed.js');
const body = {esquema:'preceptoros.openworld-estado/2',colonia:{nodes:[],buildings:[],units:[]}};
const req = (method='GET') => new Request('https://preceptoros.org/api/world-state',{method});
const env = (response) => ({ADUANA:{fetch:async r => {assert.equal(new URL(r.url).pathname,'/api/v1/latidos');return response;}}});
test('fixed binding returns valid evidence without caching', async () => {
  const r = await worldState(req(),env(Response.json(body)));
  assert.equal(r.status,200); assert.equal(r.headers.get('cache-control'),'no-store'); assert.deepEqual(await r.json(),body);
});
test('missing binding, malformed source and oversized source fail closed', async () => {
  assert.equal((await worldState(req(),{})).status,503);
  assert.equal((await worldState(req(),env(Response.json({})))).status,503);
  assert.equal((await worldState(req(),env(new Response('x'.repeat(16385))))).status,503);
  assert.equal((await worldState(req('POST'),{})).status,405);
});
test('browser requests only on explicit read and rejects invalid publisher responses', async () => {
  let calls=0;
  assert.equal(calls,0);
  const f=async (url,opts) => {calls++; assert.equal(url,'/api/world-state');assert.equal(opts.cache,'no-store');return Response.json(body);};
  assert.deepEqual(await feed.read(f),body);assert.equal(calls,1);
  await assert.rejects(feed.read(async()=>Response.json({})),/invalid/);
  await assert.rejects(feed.read(async()=>new Response('',{status:503})),/unavailable/);
});

// Cloudflare Workers rejects Request redirect:error at construction; manual prevents following redirects.
test('service request uses Cloudflare-supported manual redirects and never follows 3xx', async () => {
  let calls = 0;
  const binding = {ADUANA: {fetch: async request => {
    calls++;
    assert.equal(request.redirect, 'manual');
    return new Response(null, {status: 302, headers: {location: 'https://other.example/'}});
  }}};
  const response = await worldState(req(), binding);
  assert.equal(calls, 1);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).cobertura.causa, 'world_publisher_failed');
});
