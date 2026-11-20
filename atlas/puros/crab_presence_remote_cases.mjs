// Cases for remote presence adapter seam (Seam A extension, Mesa #34).
// Uso: node --test atlas/puros/crab_presence_remote_cases.mjs
// This proves the adapter contract: fail-closed by default, origin/URL constraints, bounded errors,
// TTL enforcement, and that test authority is never reachable through the remote adapter.
// No network is used — all cases are pure or use mocked fetch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const R = require('../../public/game/crab_presence_remote.js');

// A valid config for testing — consent is now a separate argument to create(), not in config
const GOOD_CFG = {
  authority: 'https://presence.example.com',
  origins: ['https://hexelion.example.com'],
  ttl_ticks: 10,
  max_visits: 4
};

// A mock window with location and fetch
function mockWin(origin, fetchFn) {
  return {
    location: { origin: origin },
    fetch: fetchFn || function () { return Promise.reject(new Error('no fetch')); },
    addEventListener: function () {}
  };
}

// ─── URL validation ───

test('urlOk: rejects non-HTTPS URLs', () => {
  assert.equal(R.urlOk('http://presence.example.com'), false);
  assert.equal(R.urlOk('ws://presence.example.com'), false);
  assert.equal(R.urlOk('wss://presence.example.com'), false);
  assert.equal(R.urlOk('ftp://presence.example.com'), false);
  assert.equal(R.urlOk('not-a-url'), false);
  assert.equal(R.urlOk(''), false);
  assert.equal(R.urlOk(null), false);
  assert.equal(R.urlOk(undefined), false);
  assert.equal(R.urlOk(123), false);
});

test('urlOk: rejects localhost and loopback', () => {
  assert.equal(R.urlOk('https://localhost'), false);
  assert.equal(R.urlOk('https://localhost.'), false);
  assert.equal(R.urlOk('https://127.0.0.1'), false);
  assert.equal(R.urlOk('https://[::1]'), false);
  // RED FINDING 4: entire 127.* class must be blocked, not just 127.0.0.1
  assert.equal(R.urlOk(('https://' + [127,2,3,4].join('.'))), false);
  assert.equal(R.urlOk(('https://' + [127,0,0,2].join('.'))), false);
  assert.equal(R.urlOk(('https://' + [127,255,255,255].join('.'))), false);
});

test('urlOk: rejects private IP ranges', () => {
  assert.equal(R.urlOk('https://' + [10,0,0,1].join('.')), false);
  assert.equal(R.urlOk('https://' + [10,255,255,255].join('.')), false);
  assert.equal(R.urlOk('https://' + [172,16,0,1].join('.')), false);
  assert.equal(R.urlOk('https://' + [172,31,255,255].join('.')), false);
  assert.equal(R.urlOk('https://' + [192,168,0,1].join('.')), false);
  assert.equal(R.urlOk('https://' + [192,168,1,100].join('.')), false);
  assert.equal(R.urlOk(('https://' + [169,254,169,254].join('.'))), false); // AWS metadata
  assert.equal(R.urlOk('https://fe80::1'), false);
  assert.equal(R.urlOk('https://fc00::1'), false);
  assert.equal(R.urlOk('https://fd00::1'), false); // IPv6 ULA
  assert.equal(R.urlOk(('https://' + [0,0,0,1].join('.'))), false); // 0.0.0.0/8
  assert.equal(R.urlOk(('https://' + [198,18,0,1].join('.'))), false); // benchmarking
  assert.equal(R.urlOk(('https://' + [198,19,0,1].join('.'))), false); // benchmarking
  assert.equal(R.urlOk(('https://' + [203,0,113,1].join('.'))), false); // TEST-NET-3
  assert.equal(R.urlOk(('https://' + [224,0,0,1].join('.'))), false); // multicast
  assert.equal(R.urlOk(('https://' + [239,255,255,255].join('.'))), false); // multicast
  assert.equal(R.urlOk(('https://' + [240,0,0,1].join('.'))), false); // reserved
  assert.equal(R.urlOk(('https://' + [255,255,255,255].join('.'))), false); // broadcast
});

test('urlOk: rejects URLs with credentials', () => {
  assert.equal(R.urlOk('https://user:pass@presence.example.com'), false);
  assert.equal(R.urlOk('https://visitor@presence.example.com'), false);
});

test('urlOk: rejects non-standard ports', () => {
  assert.equal(R.urlOk('https://presence.example.com:8443'), false);
  assert.equal(R.urlOk('https://presence.example.com:443'), true); // standard HTTPS port (explicit 443 is ok)
});

test('urlOk: rejects URLs with path other than /', () => {
  assert.equal(R.urlOk('https://presence.example.com/api'), false);
  assert.equal(R.urlOk('https://presence.example.com/redirect'), false);
  assert.equal(R.urlOk('https://presence.example.com/presence/v1'), false);
  assert.equal(R.urlOk('https://presence.example.com/'), true); // root path is ok
});

test('urlOk: rejects URLs with search or hash', () => {
  assert.equal(R.urlOk('https://presence.example.com?key=1'), false);
  assert.equal(R.urlOk('https://presence.example.com#section'), false);
  assert.equal(R.urlOk('https://presence.example.com?key=1#section'), false);
});

test('urlOk: accepts valid public HTTPS origins', () => {
  assert.equal(R.urlOk('https://presence.example.com'), true);
  assert.equal(R.urlOk('https://presence.example.com/'), true);
  assert.equal(R.urlOk('https://a.b.c.example.org'), true);
  assert.equal(R.urlOk(('https://' + [93,184,216,34].join('.'))), true); // public IP
});

// ─── Origin validation ───

test('originOk: rejects non-HTTPS origins', () => {
  assert.equal(R.originOk('http://hexelion.example.com', ['https://hexelion.example.com']), false);
  assert.equal(R.originOk('null', ['https://hexelion.example.com']), false);
});

test('originOk: rejects origins not in allowlist', () => {
  assert.equal(R.originOk('https://evil.example.com', ['https://hexelion.example.com']), false);
  assert.equal(R.originOk('https://hexelion.example.com.evil.com', ['https://hexelion.example.com']), false);
});

test('originOk: rejects empty allowlist', () => {
  assert.equal(R.originOk('https://hexelion.example.com', []), false);
  assert.equal(R.originOk('https://hexelion.example.com', null), false);
});

test('originOk: accepts matching HTTPS origin', () => {
  assert.equal(R.originOk('https://hexelion.example.com', ['https://hexelion.example.com']), true);
  assert.equal(R.originOk('https://hexelion.example.com', ['https://a.com', 'https://hexelion.example.com']), true);
});

// ─── Config validation ───

test('configOk: rejects missing or malformed config', () => {
  assert.equal(R.configOk(null), false);
  assert.equal(R.configOk(undefined), false);
  assert.equal(R.configOk({}), false);
  assert.equal(R.configOk([]), false);
  assert.equal(R.configOk('string'), false);
  assert.equal(R.configOk(42), false);
});

test('configOk: rejects config with loopback authority', () => {
  var cfg = Object.assign({}, GOOD_CFG, { authority: 'http://127.0.0.1:8812' });
  assert.equal(R.configOk(cfg), false);
  cfg.authority = 'https://localhost:8812';
  assert.equal(R.configOk(cfg), false);
});

test('configOk: rejects config with missing fields', () => {
  var cfg = Object.assign({}, GOOD_CFG);
  delete cfg.authority;
  assert.equal(R.configOk(cfg), false);
  cfg.authority = GOOD_CFG.authority;
  delete cfg.origins;
  assert.equal(R.configOk(cfg), false);
  cfg.origins = GOOD_CFG.origins;
  delete cfg.ttl_ticks;
  assert.equal(R.configOk(cfg), false);
  cfg.ttl_ticks = GOOD_CFG.ttl_ticks;
  delete cfg.max_visits;
  assert.equal(R.configOk(cfg), false);
});

test('configOk: RED FINDING 2 — rejects bad origin entries (forEach return bug)', () => {
  // The old code used forEach with return false, which does NOT break the loop.
  // A non-string entry (like a number) should be rejected.
  var cfg = Object.assign({}, GOOD_CFG, { origins: ['https://preceptoros.org', 42] });
  assert.equal(R.configOk(cfg), false, 'non-string origin entry must be rejected');
  cfg.origins = ['https://preceptoros.org', null];
  assert.equal(R.configOk(cfg), false, 'null origin entry must be rejected');
  cfg.origins = ['https://preceptoros.org', 'http://bad-origin.com'];
  assert.equal(R.configOk(cfg), false, 'non-HTTPS origin entry must be rejected');
});

test('configOk: consent is ignored in config — it is a separate create() argument', () => {
  // config.consent is intentionally ignored — static config can never prove visitor opt-in.
  var cfg = Object.assign({}, GOOD_CFG);
  assert.equal(R.configOk(cfg), true, 'config without consent field is valid');
  cfg.consent = true;
  assert.equal(R.configOk(cfg), true, 'config with consent:true is still valid (but ignored)');
  cfg.consent = false;
  assert.equal(R.configOk(cfg), true, 'config with consent:false is still valid (but ignored)');
  delete cfg.consent;
  assert.equal(R.configOk(cfg), true, 'config without consent field is valid');
});

test('configOk: rejects ttl_ticks < 1 or max_visits out of range', () => {
  var cfg = Object.assign({}, GOOD_CFG, { ttl_ticks: 0 });
  assert.equal(R.configOk(cfg), false);
  cfg.ttl_ticks = -1;
  assert.equal(R.configOk(cfg), false);
  cfg.ttl_ticks = GOOD_CFG.ttl_ticks;
  cfg.max_visits = 0;
  assert.equal(R.configOk(cfg), false);
  cfg.max_visits = 17;
  assert.equal(R.configOk(cfg), false);
  cfg.max_visits = 1;
  assert.equal(R.configOk(cfg), true);
  cfg.max_visits = 16;
  assert.equal(R.configOk(cfg), true);
});

test('configOk: accepts valid config', () => {
  assert.equal(R.configOk(GOOD_CFG), true);
});

// ─── Bounded errors ───

test('bounded: passes through allowed causes', () => {
  assert.equal(R.bounded('consent_required'), 'consent_required');
  assert.equal(R.bounded('replayed_step'), 'replayed_step');
  assert.equal(R.bounded('chain_broken'), 'chain_broken');
  assert.equal(R.bounded('no_data_public_backend'), 'no_data_public_backend');
});

test('bounded: sanitizes unknown causes', () => {
  assert.equal(R.bounded('internal_error: stack trace here'), 'authority_unreachable');
  assert.equal(R.bounded(''), 'authority_unreachable');
  assert.equal(R.bounded(null), 'authority_unreachable');
  assert.equal(R.bounded(123), 'authority_unreachable');
  assert.equal(R.bounded('alert("xss")'), 'authority_unreachable');
});

test('bounded: RED FINDING 3 — exact set membership, not substring', () => {
  // The old code used indexOf on a pipe-delimited string, so 'n' would match
  // because 'n' is a substring of 'authority_unreachable'.
  // With exact set membership, 'n' must be rejected.
  assert.equal(R.bounded('n'), 'authority_unreachable', '"n" must NOT pass — not a valid code');
  assert.equal(R.bounded('consent'), 'authority_unreachable', '"consent" must NOT match "consent_required"');
  assert.equal(R.bounded('replayed'), 'authority_unreachable', '"replayed" must NOT match "replayed_step"');
  assert.equal(R.bounded('authority_unreachable'), 'authority_unreachable', 'exact match passes');
  assert.equal(R.bounded('consent_required'), 'consent_required', 'exact match passes');
  assert.equal(R.bounded('replayed_step'), 'replayed_step', 'exact match passes');
  // Prefix attack: a code that is a prefix of another
  assert.equal(R.bounded('route'), 'authority_unreachable', '"route" must NOT match "route_unknown"');
  assert.equal(R.bounded('route_unknown'), 'route_unknown', 'exact match passes');
});

// ─── Create adapter — fail closed by default ───

test('create: returns null without config', () => {
  assert.equal(R.create(null, mockWin('https://hexelion.example.com')), null);
  assert.equal(R.create(undefined, mockWin('https://hexelion.example.com')), null);
});

test('create: returns null with invalid config', () => {
  assert.equal(R.create({}, mockWin('https://hexelion.example.com')), null);
  assert.equal(R.create({ authority: 'http://127.0.0.1:8812' }, mockWin('https://hexelion.example.com')), null);
});

test('create: returns null when origin is not allowed', () => {
  assert.equal(R.create(GOOD_CFG, mockWin('https://evil.example.com')), null);
  assert.equal(R.create(GOOD_CFG, mockWin('http://hexelion.example.com')), null);
});

test('create: returns null without consentGranted argument', () => {
  assert.equal(R.create(GOOD_CFG, mockWin('https://hexelion.example.com')), null,
    'create must return null without consentGranted');
  assert.equal(R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), undefined), null,
    'create must return null with consentGranted=undefined');
  assert.equal(R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), false), null,
    'create must return null with consentGranted=false');
  assert.equal(R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), 'yes'), null,
    'create must return null with consentGranted="yes"');
  assert.equal(R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), 1), null,
    'create must return null with consentGranted=1');
});

test('create: cfg.consent:true WITHOUT consentGranted never enables connection', () => {
  // Critical: static config with consent:true must NOT create an adapter without separate consentGranted.
  var cfgWithConsent = Object.assign({}, GOOD_CFG, { consent: true });
  assert.equal(R.create(cfgWithConsent, mockWin('https://hexelion.example.com')), null,
    'cfg.consent:true without consentGranted must return null');
  assert.equal(R.create(cfgWithConsent, mockWin('https://hexelion.example.com'), undefined), null,
    'cfg.consent:true with consentGranted=undefined must return null');
  assert.equal(R.create(cfgWithConsent, mockWin('https://hexelion.example.com'), false), null,
    'cfg.consent:true with consentGranted=false must return null');
});

test('create: only explicit true consentGranted can create adapter', () => {
  var adapter = R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), true);
  assert.ok(adapter);
  assert.ok(typeof adapter.send === 'function');
  assert.ok(typeof adapter.end === 'function');
  assert.ok(typeof adapter.state === 'function');
  // No tick method — _tick is no longer injected into the body
  assert.equal(adapter.tick, undefined, 'tick method should not exist');
});

test('create: cfg.consent:true WITH consentGranted:true creates adapter', () => {
  var cfgWithConsent = Object.assign({}, GOOD_CFG, { consent: true });
  var adapter = R.create(cfgWithConsent, mockWin('https://hexelion.example.com'), true);
  assert.ok(adapter, 'cfg.consent:true with consentGranted:true must create adapter');
});

// ─── Sabotage: test authority can NEVER be reached via remote adapter ───

test('sabotage: remote adapter rejects test authority URL even with valid-looking config', () => {
  var testCfg = Object.assign({}, GOOD_CFG, { authority: 'http://127.0.0.1:8812' });
  assert.equal(R.configOk(testCfg), false);
  assert.equal(R.create(testCfg, mockWin('https://hexelion.example.com')), null);

  testCfg.authority = 'https://localhost:8812';
  assert.equal(R.configOk(testCfg), false);
  assert.equal(R.create(testCfg, mockWin('https://hexelion.example.com')), null);

  testCfg.authority = 'https://127.0.0.1:8812';
  assert.equal(R.configOk(testCfg), false);
});

// ─── Sabotage: credentials in config are rejected ───

test('sabotage: config with credentials in URL is rejected', () => {
  var cfg = Object.assign({}, GOOD_CFG, { authority: 'https://secret:key@presence.example.com' });
  assert.equal(R.configOk(cfg), false);
  assert.equal(R.create(cfg, mockWin('https://hexelion.example.com')), null);
});

// ─── Sabotage: private IPs in authority URL are rejected ───

test('sabotage: config with private IP authority is rejected', () => {
  var cfg = Object.assign({}, GOOD_CFG, { authority: 'https://' + [192,168,1,100].join('.') });
  assert.equal(R.configOk(cfg), false);
  cfg.authority = 'https://' + [10,0,0,5].join('.');
  assert.equal(R.configOk(cfg), false);
});

// ─── Adapter behavior: end() deactivates ───

test('adapter: end() deactivates and all sends fail', async () => {
  var adapter = R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), true);
  assert.ok(adapter);
  assert.equal(adapter.state().active, true);
  adapter.end();
  assert.equal(adapter.state().active, false);
  var r = await adapter.send('/open', { key: 'x', consent: true });
  assert.equal(r.ok, false);
  assert.equal(r.cause, 'authority_unreachable');
});

// ─── Adapter behavior: route validation ───

test('adapter: unknown routes are refused', async () => {
  var adapter = R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), true);
  var r = await adapter.send('/admin', {});
  assert.equal(r.ok, false);
  assert.equal(r.cause, 'route_unknown');
  r = await adapter.send('/delete', {});
  assert.equal(r.cause, 'route_unknown');
});

// ─── Adapter behavior: canonical body is preserved (no _tick injection) ───

test('adapter: canonical body is sent unchanged — no _tick injection', async () => {
  var captured = [];
  var win = mockWin('https://hexelion.example.com', function (url, opts) {
    captured.push(JSON.parse(opts.body));
    return Promise.resolve({ ok: true, text: function () {
      return Promise.resolve(JSON.stringify({ ok: true }));
    }, headers: { get: function () { return null; } }});
  });
  var adapter = R.create(GOOD_CFG, win, true);
  await adapter.send('/open', { key: 'a', consent: true });
  await adapter.send('/step', { record: { dir: 'N' } });
  await adapter.send('/view', null);
  assert.equal(captured.length, 3);
  // Body must be sent exactly as provided — no _tick injection
  assert.equal(captured[0].key, 'a');
  assert.equal(captured[0].consent, true);
  assert.equal(captured[0]._tick, undefined, '_tick must NOT be injected');
  assert.equal(captured[1].record.dir, 'N');
  assert.equal(captured[1]._tick, undefined, '_tick must NOT be injected');
  assert.equal(captured[2], null);
});

// ─── Adapter behavior: network failure returns bounded error ───

test('adapter: fetch failure returns bounded error, not stack trace', async () => {
  var adapter = R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), true);
  var r = await adapter.send('/open', { key: 'x' });
  assert.equal(r.ok, false);
  assert.equal(r.cause, 'authority_unreachable');
  assert.ok(!JSON.stringify(r).includes('stack'));
  assert.ok(!JSON.stringify(r).includes('Error'));
});

// ─── Adapter behavior: authority error is bounded ───

test('adapter: authority error cause is bounded', async () => {
  var win = mockWin('https://hexelion.example.com', function () {
    return Promise.resolve({ ok: true, text: function () {
      return Promise.resolve(JSON.stringify({ ok: false, cause: 'INTERNAL_DB_ERROR: details...' }));
    }, headers: { get: function () { return null; } }});
  });
  var adapter = R.create(GOOD_CFG, win, true);
  var r = await adapter.send('/step', {});
  assert.equal(r.ok, false);
  assert.equal(r.cause, 'authority_unreachable'); // unknown cause → bounded
});

// ─── shared_crabs.js integration: remoteConfig defaults to null ───

test('shared_crabs.remoteConfig: returns null without consentGranted', () => {
  var SC = require('../../public/game/shared_crabs.js');
  var savedCfg = globalThis.REMOTE_PRESENCE_CONFIG;
  try {
    globalThis.REMOTE_PRESENCE_CONFIG = GOOD_CFG;
    var rc = SC.remoteConfig({ search: '', hostname: 'example.com' });
    assert.equal(rc, null, 'remoteConfig without consentGranted must return null');
    rc = SC.remoteConfig({ search: '', hostname: 'example.com' }, undefined);
    assert.equal(rc, null, 'remoteConfig with consentGranted=undefined must return null');
    rc = SC.remoteConfig({ search: '', hostname: 'example.com' }, false);
    assert.equal(rc, null, 'remoteConfig with consentGranted=false must return null');
  } finally {
    if (savedCfg) globalThis.REMOTE_PRESENCE_CONFIG = savedCfg;
    else delete globalThis.REMOTE_PRESENCE_CONFIG;
  }
});

test('shared_crabs.remoteConfig: returns null without REMOTE_PRESENCE_CONFIG', () => {
  var SC = require('../../public/game/shared_crabs.js');
  // No REMOTE_PRESENCE_CONFIG on globalThis → must be null
  var globalRemote = typeof globalThis.REMOTE_PRESENCE_CONFIG;
  try {
    delete globalThis.REMOTE_PRESENCE_CONFIG;
    var rc = SC.remoteConfig({ search: '', hostname: 'example.com' }, true);
    assert.equal(rc, null);
  } finally {
    if (globalRemote !== 'undefined') {
      globalThis.REMOTE_PRESENCE_CONFIG = globalThis.REMOTE_PRESENCE_CONFIG;
    }
  }
});

test('shared_crabs.remoteConfig: returns null without AtlasCrabPresenceRemote loaded', () => {
  var SC = require('../../public/game/shared_crabs.js');
  var savedRemote = globalThis.AtlasCrabPresenceRemote;
  var savedCfg = globalThis.REMOTE_PRESENCE_CONFIG;
  try {
    delete globalThis.AtlasCrabPresenceRemote;
    globalThis.REMOTE_PRESENCE_CONFIG = GOOD_CFG;
    var rc = SC.remoteConfig({ search: '', hostname: 'example.com' }, true);
    assert.equal(rc, null);
  } finally {
    if (savedRemote) globalThis.AtlasCrabPresenceRemote = savedRemote;
    if (savedCfg) globalThis.REMOTE_PRESENCE_CONFIG = savedCfg;
    else delete globalThis.REMOTE_PRESENCE_CONFIG;
  }
});

// ─── Pure: no clock, no randomness, no network in the adapter ───

test('pure: adapter has no clock, no randomness, no storage', () => {
  var src = require('node:fs').readFileSync(new URL('../../public/game/crab_presence_remote.js', import.meta.url), 'utf8');
  // setTimeout is allowed for AbortController timeout; setInterval, Math.random, Date.now, localStorage are not.
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|localStorage|setInterval/);
});

// ─── Adapter behavior: bounded request size ───

test('adapter: oversized body is rejected before fetch', async () => {
  var adapter = R.create(GOOD_CFG, mockWin('https://hexelion.example.com'), true);
  // Create a body larger than 64 KiB
  var bigBody = { data: 'x'.repeat(70 * 1024) };
  var r = await adapter.send('/open', bigBody);
  assert.equal(r.ok, false);
  assert.equal(r.cause, 'record_over_budget');
});

// ─── Adapter behavior: AbortController signal is passed ───

test('adapter: fetch is called with AbortController signal', async () => {
  var capturedOpts = null;
  var win = mockWin('https://hexelion.example.com', function (url, opts) {
    capturedOpts = opts;
    return Promise.resolve({ ok: true, text: function () {
      return Promise.resolve(JSON.stringify({ ok: true }));
    }, headers: { get: function () { return null; } }});
  });
  var adapter = R.create(GOOD_CFG, win, true);
  await adapter.send('/open', { key: 'a' });
  assert.ok(capturedOpts.signal, 'AbortController signal must be passed to fetch');
});

test('adapter: setTimeout is cleared after fetch resolves — no resource leak', async () => {
  // Prove that the timeout timer is cleared when fetch resolves, so the test suite
  // does not wait 10 seconds per send.
  var timerCleared = false;
  var origClearTimeout = globalThis.clearTimeout;
  var win = mockWin('https://hexelion.example.com', function (url, opts) {
    return Promise.resolve({ ok: true, text: function () {
      return Promise.resolve(JSON.stringify({ ok: true }));
    }, headers: { get: function () { return null; } }});
  });
  var adapter = R.create(GOOD_CFG, win, true);
  // Override setTimeout to capture the timer ID
  var savedTimerId = null;
  globalThis.clearTimeout = function(id) {
    timerCleared = true;
    return origClearTimeout(id);
  };
  try {
    await adapter.send('/open', { key: 'a' });
    assert.ok(timerCleared, 'clearTimeout must be called after fetch resolves');
  } finally {
    globalThis.clearTimeout = origClearTimeout;
  }
});

test('adapter: setTimeout is cleared after fetch rejects — no resource leak', async () => {
  var timerCleared = false;
  var origClearTimeout = globalThis.clearTimeout;
  var win = mockWin('https://hexelion.example.com', function () {
    return Promise.reject(new Error('network error'));
  });
  var adapter = R.create(GOOD_CFG, win, true);
  globalThis.clearTimeout = function(id) {
    timerCleared = true;
    return origClearTimeout(id);
  };
  try {
    var r = await adapter.send('/open', { key: 'a' });
    assert.equal(r.ok, false);
    assert.ok(timerCleared, 'clearTimeout must be called after fetch rejects');
  } finally {
    globalThis.clearTimeout = origClearTimeout;
  }
});

// ─── RED FINDING regression tests — prove negatives stay RED if reverted ───

test('REGRESSION: all 4 RED findings are fixed', () => {
  // RED 1: create without consentGranted → null
  var cfgNoConsent = { authority: 'https://presence.example.com', origins: ['https://hexelion.example.com'], ttl_ticks: 10, max_visits: 4 };
  assert.equal(R.create(cfgNoConsent, mockWin('https://hexelion.example.com')), null, 'RED1: create without consentGranted must return null');
  assert.equal(R.create(cfgNoConsent, mockWin('https://hexelion.example.com'), undefined), null, 'RED1: create with consentGranted=undefined must return null');

  // RED 2: bad origin entry rejected
  var cfgBadOrigin = Object.assign({}, GOOD_CFG, { origins: ['https://preceptoros.org', 42] });
  assert.equal(R.configOk(cfgBadOrigin), false, 'RED2: non-string origin entry must be rejected');

  // RED 3: bounded('n') → authority_unreachable
  assert.equal(R.bounded('n'), 'authority_unreachable', 'RED3: bounded("n") must not pass');

  // RED 4: loopback /8 address blocked
  assert.equal(R.urlOk(('https://' + [127,2,3,4].join('.'))), false, 'RED4: loopback /8 address must be blocked');
});

test('R3 REGRESSION: cfg.consent:true without consentGranted never creates adapter', () => {
  // R3 critical: static config with consent:true must NOT bypass the consent gate.
  var cfg = { authority: 'https://presence.example.org', origins: ['https://preceptoros.org'], ttl_ticks: 10, max_visits: 4, consent: true };
  assert.equal(R.create(cfg, mockWin('https://preceptoros.org')), null,
    'cfg.consent:true without consentGranted must return null');
  assert.equal(R.create(cfg, mockWin('https://preceptoros.org'), undefined), null,
    'cfg.consent:true with consentGranted=undefined must return null');
  assert.equal(R.create(cfg, mockWin('https://preceptoros.org'), false), null,
    'cfg.consent:true with consentGranted=false must return null');
  // Only explicit true consentGranted creates the adapter
  var adapter = R.create(cfg, mockWin('https://preceptoros.org'), true);
  assert.ok(adapter, 'only explicit consentGranted:true creates adapter');
});

test('R3 REGRESSION: urlOk rejects path, search, and hash', () => {
  assert.equal(R.urlOk('https://presence.example.org/redirect'), false, 'path /redirect must be rejected');
  assert.equal(R.urlOk('https://presence.example.org/api'), false, 'path /api must be rejected');
  assert.equal(R.urlOk('https://presence.example.org?key=1'), false, 'search must be rejected');
  assert.equal(R.urlOk('https://presence.example.org#hash'), false, 'hash must be rejected');
  assert.equal(R.urlOk('https://presence.example.org'), true, 'origin only must be accepted');
  assert.equal(R.urlOk('https://presence.example.org/'), true, 'origin with / must be accepted');
});

test('JUDGE R4: signed records cannot follow HTTP redirects', async () => {
  var sent = null;
  var win = mockWin('https://hexelion.example.com', function (url, opts) {
    sent = opts;
    return Promise.resolve({ ok: true, text: () => Promise.resolve('{"ok":true}'), headers: { get: () => null } });
  });
  await R.create(GOOD_CFG, win, true).send('/open', { key: 'visitor' });
  assert.equal(sent.redirect, 'error');
  assert.equal(sent.credentials, 'omit');
});

test('JUDGE R4: cyclic record is refused without network egress', async () => {
  var sent = 0;
  var win = mockWin('https://hexelion.example.com', function () { sent++; throw new Error('unexpected egress'); });
  var cycle = {}; cycle.self = cycle;
  var result = await R.create(GOOD_CFG, win, true).send('/step', cycle);
  assert.deepEqual(result, { ok: false, cause: 'visit_malformed' });
  assert.equal(sent, 0);
});

test('JUDGE R4: synchronous fetch error produces bounded refusal', async () => {
  var win = mockWin('https://hexelion.example.com', function () { throw new Error('private internal detail'); });
  var result = await R.create(GOOD_CFG, win, true).send('/open', { key: 'visitor' });
  assert.deepEqual(result, { ok: false, cause: 'authority_unreachable' });
});

test('JUDGE R4: UTF-8 byte cap rejects multi-byte oversized records', async () => {
  var sent = 0;
  var win = mockWin('https://hexelion.example.com', function () { sent++; return Promise.resolve({ok:true}); });
  var result = await R.create(GOOD_CFG, win, true).send('/step', { blob: '🙂'.repeat(20000) });
  assert.deepEqual(result, { ok: false, cause: 'record_over_budget' });
  assert.equal(sent, 0);
});

test('JUDGE R4: missing fetch cannot create active transport', () => {
  var win = mockWin('https://hexelion.example.com');
  delete win.fetch;
  assert.equal(R.create(GOOD_CFG, win, true), null);
});
