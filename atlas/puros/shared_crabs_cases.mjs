// Cases for the page piece of shared crabs (pure parts). Uso: node --test atlas/puros/shared_crabs_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../../public/game/shared_crabs.js'), WALK = require('../../public/game/visitor_walk.js');

test('an authority exists only on loopback and only by its port; the public site has none', () => {
  assert.equal(S.authority({ hostname: '127.0.0.1', search: '?presence=8812' }), 'http://127.0.0.1:8812');
  assert.equal(S.authority({ hostname: 'localhost', search: '?colony=alone&presence=8812&poll=300' }), 'http://127.0.0.1:8812');
  assert.equal(S.authority({ hostname: 'preceptoros.org', search: '?presence=8812' }), null);
  assert.equal(S.authority({ hostname: '127.0.0.1', search: '' }), null);
  for (const bad of ['?presence=evil.example', '?presence=//evil.example', '?presence=8812@evil', '?presence=http://x', '?presence=1', '?xpresence=8812']) {
    assert.equal(S.authority({ hostname: '127.0.0.1', search: bad }), null, bad);
  }
});
test('nothing is mounted without an authority: no button, no line, no request', () => {
  let asked = 0; const made = [];
  const doc = { getElementById: (id) => ({ id, appendChild() {}, addEventListener() {} }), createElement: (t) => { made.push(t); return {}; } };
  assert.equal(S.mount(doc, { location: { hostname: 'preceptoros.org', search: '?presence=8812' }, fetch: () => { asked++; } }), null);
  assert.deepEqual([asked, made.length], [0, 0]);
});
test('a walked hex is one of the six steps; a jump is not a step', () => {
  for (const [name, d] of Object.entries(WALK.DIRS)) { assert.equal(S.dirOf({ q: 3, r: -2 }, { q: 3 + d[0], r: -2 + d[1] }, WALK.DIRS), name); }
  assert.equal(S.dirOf({ q: 0, r: 0 }, { q: 0, r: 0 }, WALK.DIRS), null);
  assert.equal(S.dirOf({ q: 0, r: 0 }, { q: 2, r: 0 }, WALK.DIRS), null);
});
test('a silent crab says STALE in words, not only in paleness', () => {
  assert.equal(S.label({ id: 'crab-1a2b3c4d', seal: 'LIVE' }), '1a2b');
  assert.equal(S.label({ id: 'crab-1a2b3c4d', seal: 'STALE' }), '1a2b · STALE');
});
test('the piece asks the network only through the authority it was given, with no cookies', () => {
  const src = readFileSync(new URL('../../public/game/shared_crabs.js', import.meta.url), 'utf8');
  assert.equal((src.match(/fetch\(/g) || []).length, 1);
  assert.match(src, /win\.fetch\(auth \+ path, \{ method: 'POST', body: JSON\.stringify\(body\), cache: 'no-store', credentials: 'omit' \}\)/);
  assert.doesNotMatch(src, /localStorage|sessionStorage|document\.cookie|XMLHttpRequest|WebSocket/);
});
