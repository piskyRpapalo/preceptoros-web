// Cases for the page piece of shared crabs (pure parts). Uso: node --test atlas/puros/shared_crabs_cases.mjs
import test from 'node:test';
import './ed25519_lite_law.mjs'; // the visit key's fallback (APP WebView without Ed25519) runs with the crabs it serves
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

test('Revoking HTTPS consent while /open is pending never resurrects a shared crab', async () => {
  // A slow authority may accept /open after the visitor withdraws consent.
  // The client must not re-create its local session or start polling afterwards.
  const names = ['AtlasCrabPresenceRemote','REMOTE_PRESENCE_CONFIG','AtlasCrabPresenceClient',
    'AtlasCrabPresenceAcho','AtlasSonifyAcho','AtlasAchoMath','AtlasAchoScore',
    'AtlasCoopBeacon','AtlasOpenworldView'];
  const before = new Map(names.map(n => [n, { present: Object.hasOwn(globalThis, n), value: globalThis[n] }]));
  let reply, opened = 0, ended = 0, intervals = 0;
  class El {
    constructor(id = '') {
      this.id = id; this.hidden = false; this.disabled = false; this.checked = false;
      this.dataset = {}; this.style = {}; this.textContent = ''; this.listeners = {};
      this.children = []; this.attributes = {};
    }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, payload = {}) { for (const fn of this.listeners[type] || []) fn({ type, ...payload }); }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); return child; }
    get firstChild() { return this.children[0] || null; }
    setAttribute(k, v) { this.attributes[k] = v; }
  }
  try {
    const cfg = { authority: 'https://api.preceptoros.org',
      origins: ['https://preceptoros.org'], ttl_ticks: 120, max_visits: 16 };
    globalThis.REMOTE_PRESENCE_CONFIG = cfg;
    globalThis.AtlasCrabPresenceRemote = { create: () => ({
      send: () => Promise.resolve({ ok: false, cause: 'authority_unreachable' }),
      end: () => { ended++; }
    }) };
    globalThis.AtlasCrabPresenceClient = { join: () => {
      opened++;
      return new Promise(resolve => { reply = resolve; });
    } };
    globalThis.AtlasCrabPresenceAcho = {};
    globalThis.AtlasSonifyAcho = {};
    globalThis.AtlasAchoMath = {};
    globalThis.AtlasAchoScore = {};
    globalThis.AtlasCoopBeacon = {};
    globalThis.AtlasOpenworldView = () => ({ controls: { walker: () => ({q:0,r:0}) }, redraw() {} });
    const els = Object.fromEntries(['visitor-play','surface','online-share','online-status',
      'online-consent','online-disconnect','online-player-list','online-players-toggle',
      'online-players'].map(id => [id, new El(id)]));
    const doc = {
      visibilityState: 'visible', readyState: 'loading',
      getElementById: id => els[id] || null,
      createElement: () => new El(),
      addEventListener() {}, dispatchEvent() {}
    };
    const win = {
      location: { origin: 'https://preceptoros.org', hostname: 'preceptoros.org', search: '' },
      REMOTE_PRESENCE_CONFIG: cfg, fetch: async () => { throw Error('no production network'); },
      addEventListener() {},
      setInterval: () => { intervals++; return intervals; },
      clearInterval: () => {}
    };
    const mounted = S.mount(doc, win);
    assert.ok(mounted);
    els['visitor-play'].emit('visitor:render', { detail: { account: {} } });
    els['online-consent'].checked = true;
    els['online-share'].emit('click');
    await new Promise(resolve => setImmediate(resolve)); // wait for module loading and /open pending
    assert.equal(opened, 1);
    els['online-consent'].checked = false;
    els['online-consent'].emit('change');
    assert.equal(ended, 1, 'revocation must end even a pending connection');
    reply({ ok: true, id: 'crab-12345678', beacon: null });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(mounted.state().id, null, 'late /open must not recreate presence');
    assert.equal(intervals, 0, 'late /open must not start polling or heartbeat');
    assert.equal(els['online-status'].dataset.cause, 'consent_revoked');
  } finally {
    for (const [name, saved] of before) {
      if (saved.present) globalThis[name] = saved.value;
      else delete globalThis[name];
    }
  }
});

test('pace: a look keeps no crab alive, so alone it breathes 4× slower; near a LIVE crab 1 s; ?poll= stays fixed', () => {
  const v = (crabs) => ({ crabs });
  assert.equal(S.pace(v([{ id: 'me', seal: 'LIVE' }]), 'me', 500, 0), 4000);
  assert.equal(S.pace(v([{ id: 'me', seal: 'LIVE' }, { id: 'b', seal: 'LIVE' }]), 'me', 500, 0), 1000);
  assert.equal(S.pace(v([{ id: 'me', seal: 'LIVE' }, { id: 'b', seal: 'STALE' }]), 'me', 500, 0), 4000, 'a STALE crab does not speed the look');
  assert.equal(S.pace(null, 'me', 500, 0), 4000, 'no view yet: slow, never a burst');
  assert.equal(S.pace(v([{ id: 'b', seal: 'LIVE' }]), 'me', 300, 300), 300, 'tests and rehearsals keep their fixed pace');
  // Budget (2026-11-23 quota exhaustion): requests per second of one crab = looks + beats (beat 2 s).
  const rate = (ms) => 1000 / ms + 0.5;
  assert.ok(rate(S.pace(null, 'me', 500, 0)) <= 0.75 && rate(500) === 2.5, 'alone: 2.5 → 0.75 req/s');
});
