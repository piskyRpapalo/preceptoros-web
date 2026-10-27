// The apex is the canonical origin (Sovereign, 2026-10-25). www only redirects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const env = { ASSETS: { fetch: async (req) => new Response('asset:' + new URL(req.url).pathname, { status: 200 }) } };
const go = (url) => worker.fetch(new Request(url), env);

test('www redirects to the apex with 301, keeping path and query', async () => {
  const r = await go('https://www.preceptoros.org/face/basic.html?x=1');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://preceptoros.org/face/basic.html?x=1');
});

test('www root and a static file both redirect; nothing is served from www', async () => {
  for (const u of ['https://www.preceptoros.org/', 'https://www.preceptoros.org/sw.js']) {
    assert.equal((await go(u)).status, 301, u);
  }
});

test('the nine language portals answer 301 to the one English landing', async () => {
  for (const l of ['ar', 'de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'ru']) {
    for (const p of ['/' + l, '/' + l + '/', '/' + l + '/index.html']) {
      const r = await go('https://preceptoros.org' + p + '?x=1');
      assert.equal(r.status, 301, p);
      assert.equal(r.headers.get('location'), 'https://preceptoros.org/', p);
    }
  }
});

test('only the portal itself redirects: lookalike paths are served as assets', async () => {
  for (const p of ['/players/', '/playground.html', '/face/', '/es.json', '/esx/', '/creation.json']) {
    const r = await go('https://preceptoros.org' + p);
    assert.equal(r.status, 200, p);
  }
});

// NORTE 5 [3] (2026-10-27, decree ·6452880777): "play the game" and the web Creation Studio left; their old addresses
// answer 301 to the worlds, and only those exact paths do (the lookalikes above stay assets).
test('the paths that left answer 301 to the worlds', async () => {
  for (const p of ['/play/', '/play', '/play/index.html', '/creation.html']) {
    const r = await go('https://preceptoros.org' + p);
    assert.equal(r.status, 301, p);
    assert.equal(r.headers.get('location'), 'https://preceptoros.org/face/', p);
  }
});

test('the apex is served by the assets, untouched', async () => {
  const r = await go('https://preceptoros.org/sw.js');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'asset:/sw.js');
});
