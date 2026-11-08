// R-17 · the declared content policy stays true: HTML gets it, other files keep theirs, and the pages never need
// what the policy forbids (inline script, inline handlers, eval). Measured on the Doogee's Chrome: 0 violations / 10 pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { POLICY, withSecurity } from '../worker/security_headers.js';

const html = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? html(p) : p.endsWith('.html') ? [p] : []; });
const PAGES = html(new URL('../public', import.meta.url).pathname);

test('an HTML response gets the policy and its two companions', () => {
  const r = withSecurity(new Response('<p>', { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  assert.equal(r.headers.get('Content-Security-Policy'), POLICY);
  assert.equal(r.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(r.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
});

test('other files are returned untouched', () => {
  const r = new Response('{}', { headers: { 'content-type': 'application/json' } });
  assert.equal(withSecurity(r), r);
});

test('the policy never allows inline script or eval; objects and foreign framing are closed', () => {
  const script = POLICY.split('; ').find((d) => d.startsWith('script-src '));
  assert.doesNotMatch(script, /'unsafe-inline'|'unsafe-eval'/);
  assert.match(POLICY, /object-src 'none'/);
  assert.match(POLICY, /frame-ancestors 'self'/);
  assert.match(POLICY, /base-uri 'self'/);
});

test('no page needs what the policy forbids: no inline script, no inline handler', () => {
  assert.ok(PAGES.length >= 10, 'pages found: ' + PAGES.length);
  for (const p of PAGES) {
    const t = readFileSync(p, 'utf8');
    for (const m of t.matchAll(/<script\b([^>]*)>/g)) {
      assert.ok(/\bsrc=/.test(m[1]) || /application\/(ld\+)?json/.test(m[1]), p + ' has an inline script');
    }
    assert.doesNotMatch(t, /\son[a-z]+="/, p + ' has an inline handler');
  }
});
