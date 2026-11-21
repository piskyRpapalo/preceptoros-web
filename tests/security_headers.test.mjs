// R-17 · the declared content policy stays true: HTML gets it, other files keep theirs, and the pages never need
// what the policy forbids (inline script, inline handlers, eval). Measured on the Doogee's Chrome: 0 violations / 10 pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { POLICY, MINI_INLINE_SCRIPT_HASH, policyForPath, withSecurity } from '../worker/security_headers.js';

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
  const fa = POLICY.split('; ').find((d) => d.startsWith('frame-ancestors'));
  assert.equal(fa, "frame-ancestors 'self' http://127.0.0.1:8742 http://localhost:8742 https://preceptoros.mvp.local", 'only the web, the app\'s loopback origins and the APK bundled origin may frame it');
  assert.ok(!/\*|https?:\/\/(?!127\.0\.0\.1:8742|localhost:8742|preceptoros\.mvp\.local(?: |$))/.test(fa.replace("frame-ancestors 'self' ", '').replace(/ /g, ' ')), 'no wildcard, no other origin');
  assert.match(POLICY, /base-uri 'self'/);
});

test('only the unchanged official MINI boot script is hash-allowed inside /app/', () => {
  const index = readFileSync(new URL('../public/app/index.html', import.meta.url));
  const manifest = JSON.parse(readFileSync(new URL('../public/app/package-manifest.json', import.meta.url),'utf8'));
  assert.equal(manifest.source_head, 'cde2d0034d9d107ced9e16b88c095136d07ab37d');
  assert.equal(createHash('sha256').update(index).digest('hex'), manifest.files['index.html']);
  const html=index.toString('utf8');
  const inline=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(m=> !/\bsrc=/.test(m[1]) && !/application\/(ld\+)?json/.test(m[1]));
  assert.equal(inline.length,1,'only one official inline boot fragment');
  const digest=createHash('sha256').update(inline[0][2],'utf8').digest('base64');
  assert.equal("'sha256-"+digest+"'",MINI_INLINE_SCRIPT_HASH);
  const scoped=policyForPath('/app/');
  assert.match(scoped,/script-src /);
  assert.ok(scoped.includes(MINI_INLINE_SCRIPT_HASH));
  const scriptDirective=scoped.split('; ').find(d=>d.startsWith('script-src '));
  assert.doesNotMatch(scriptDirective,/'unsafe-inline'|'unsafe-eval'/,
    'unsafe-inline and unsafe-eval must not be in script-src');
  assert.equal(policyForPath('/'),POLICY);
  assert.equal(policyForPath('/get-the-app/'),POLICY);
  assert.equal(policyForPath('/app/not-an-index.html'),POLICY);
  const res=withSecurity(new Response('<h1>MINI</h1>',{
    headers:{'content-type':'text/html; charset=utf-8'}}),'/app/');
  assert.equal(res.headers.get('content-security-policy'),scoped);
});

test('no page needs what the policy forbids: no inline script, no inline handler', () => {
  assert.ok(PAGES.length >= 10, 'pages found: ' + PAGES.length);
  for (const p of PAGES) {
    const t = readFileSync(p, 'utf8');
    for (const m of t.matchAll(/<script\b([^>]*)>/g)) {
      const isInline=!(/\bsrc=/.test(m[1]) || /application\/(ld\+)?json/.test(m[1]));
      if(!isInline)continue;
      const appIndex=new URL('../public/app/index.html',import.meta.url).pathname;
      if(p===appIndex){
        const html=readFileSync(p,'utf8');
        const embedded=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
          .filter(x=> !/\bsrc=/.test(x[1]) && !/application\/(ld\+)?json/.test(x[1]));
        assert.equal(embedded.length,1,'MINI exact, singleton inline script');
        const actual="'sha256-"+createHash('sha256').update(embedded[0][2]).digest('base64')+"'";
        assert.equal(actual,MINI_INLINE_SCRIPT_HASH,'MINI inline fragment must remain APP-owned');
      }else{
        assert.fail(p+' has an inline script');
      }
    }
    assert.doesNotMatch(t, /\son[a-z]+="/, p + ' has an inline handler');
  }
});
