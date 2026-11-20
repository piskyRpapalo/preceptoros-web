// Remote presence adapter seam (Seam A extension, Mesa #34). NOT deployed, NOT enabled by default.
// This piece sits between the presence client and the network. It exists so a future production authority
// can be reached from the public site WITHOUT exposing the test authority, leaking credentials, or weakening
// the chain guarantees that crab_presence.js already enforces. It is a pure configuration contract + bounded
// transport wrapper: no new authority, no new protocol, no new state.
//
// Design principles — fail closed, never expose test authority:
//   - DEFAULT OFF: without an explicit, validated config object AND a separate explicit consent boolean,
//     this adapter returns null. Config is static and can never prove visitor opt-in.
//   - ORIGIN CONSTRAINT: only HTTPS origins matching an explicit allowlist are accepted.
//   - URL CONSTRAINT: the authority URL must be HTTPS origin only — exact host, default port, no path except '/',
//     no search, no hash, no credentials, no loopback, no private/reserved IPs.
//   - CONSENT: a separate caller-supplied boolean (consentGranted === true) is required at create() time.
//     config.consent is IGNORED — static config can never prove visitor opt-in.
//     NO_DATA(public_consent_UI_not_wired) — consent UI is not yet wired.
//   - BOUNDED ERRORS: network failures return bounded cause strings, never stack traces or internal state.
//   - DISCONNECT: on pagehide or explicit end, the remote visit is abandoned; no reconnection.
//   - CANONICAL BODY: the outbound wrapper does NOT mutate the signed canonical body.
//     NO_DATA(public_authority_not_deployed) — server-side TTL/replay is under pre-existing authority only.
//   - TIMEOUT: fetch calls use AbortController with a bounded timeout; timer is cleared on resolve/reject.
//
// If a real backend does not exist, this adapter returns null and the page shows NO_DATA(public_backend).
// No network service is invented here.
(function (root) {
  'use strict';

  // Pure: validate an origin against an allowlist. Only exact HTTPS origins.
  function originOk(origin, allowlist) {
    if (!Array.isArray(allowlist) || allowlist.length === 0) { return false; }
    if (typeof origin !== 'string' || !/^https:\/\//.test(origin)) { return false; }
    return allowlist.indexOf(origin) >= 0;
  }

  // Pure: validate an authority URL. Must be HTTPS origin only — exact host, default port, no path except '/',
  // no search, no hash, no credentials, no loopback, no private/reserved IPs.
  // Rejects complete loopback and unspecified ranges, all RFC1918 private ranges,
  // link-local, multicast, reserved, and documented network ranges,
  // plus IPv6 ULA (fc00::/7) and link-local (fe80::/10).
  // NOTE: DNS rebinding cannot be fully prevented client-side; this is defense-in-depth, not a guarantee.
  function urlOk(url) {
    if (typeof url !== 'string' || !/^https:\/\//.test(url)) { return false; }
    try {
      var u = new URL(url);
      if (u.username || u.password) { return false; } // no credentials in URL
      // Reject non-standard ports (authority should use standard HTTPS)
      if (u.port && u.port !== '443') { return false; }
      // Reject any path other than '/'
      if (u.pathname !== '/') { return false; }
      // Reject any search or hash
      if (u.search !== '' || u.hash !== '') { return false; }
      var h = u.hostname;
      // Reject localhost variants
      if (h === 'localhost' || h === 'localhost.' || h.toLowerCase() === 'localhost') { return false; }
      // Strip trailing dot for comparison
      var host = h.replace(/\.$/, '');
      // Reject IPv6 loopback
      if (host === '::1' || host === '[::1]') { return false; }
      // Check IPv4 — parse octets
      var parts = host.split('.').map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        var a = parts[0], b = parts[1];
        // 0.0.0.0/8 — current network
        if (a === 0) { return false; }
        // RFC1918 private class A
        if (a === 10) { return false; }
        // 127.0.0.0/8 — loopback (entire range, not just 127.0.0.1)
        if (a === 127) { return false; }
        // 169.254.0.0/16 — link-local
        if (a === 169 && b === 254) { return false; }
        // RFC1918 private class B
        if (a === 172 && b >= 16 && b <= 31) { return false; }
        // 192.0.0.0/24 — IETF protocol (192.0.0.x)
        if (a === 192 && b === 0 && parts[2] === 0) { return false; }
        // RFC1918 private class C
        if (a === 192 && b === 168) { return false; }
        // 198.18.0.0/15 — benchmarking
        if (a === 198 && (b === 18 || b === 19)) { return false; }
        // 203.0.113.0/24 — documentation (TEST-NET-3)
        if (a === 203 && b === 0 && parts[2] === 113) { return false; }
        // 224.0.0.0/4 — multicast
        if (a >= 224 && a <= 239) { return false; }
        // 240.0.0.0/4 — reserved
        if (a >= 240) { return false; }
        // 255.255.255.255 — broadcast
        if (a === 255) { return false; }
      }
      // Reject IPv6 ULA (fc00::/7) and link-local (fe80::/10)
      if (host.indexOf('fe80:') === 0 || host.indexOf('fe80%') === 0) { return false; }
      if (host.indexOf('fc00:') === 0 || host.indexOf('fd00:') === 0) { return false; }
      // Reject IPv6 loopback in bracketed form
      if (host.indexOf('[') === 0) {
        var inner = host.slice(1, -1);
        if (inner === '::1') { return false; }
        if (inner.indexOf('fe80:') === 0 || inner.indexOf('fc00:') === 0 || inner.indexOf('fd00:') === 0) { return false; }
      }
      // Reject empty hostname
      if (!host || host.length === 0) { return false; }
    } catch (e) { return false; }
    return true;
  }

  // Pure: validate the full config object. Missing or malformed → null (fail closed).
  // NOTE: config.consent is IGNORED — static config can never prove visitor opt-in.
  // Consent must be supplied as a separate boolean argument to create().
  function configOk(cfg) {
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) { return false; }
    if (!urlOk(cfg.authority)) { return false; }
    if (!Array.isArray(cfg.origins) || cfg.origins.length === 0) { return false; }
    // Validate every origin entry — forEach return does NOT break the loop; use a proper loop.
    for (var i = 0; i < cfg.origins.length; i++) {
      if (typeof cfg.origins[i] !== 'string' || !/^https:\/\//.test(cfg.origins[i])) { return false; }
    }
    if (!Number.isSafeInteger(cfg.ttl_ticks) || cfg.ttl_ticks < 1) { return false; }
    if (!Number.isSafeInteger(cfg.max_visits) || cfg.max_visits < 1 || cfg.max_visits > 16) { return false; }
    // config.consent is intentionally ignored — it is static config, not visitor opt-in.
    return true;
  }

  // Bounded error — never leak internal state. Uses strict exact set membership, NOT substring match.
  function bounded(cause) {
    if (typeof cause !== 'string' || cause.length === 0) { return 'authority_unreachable'; }
    var allowed = {
      'authority_unreachable': 1,
      'consent_required': 1,
      'origin_rejected': 1,
      'url_rejected': 1,
      'config_missing': 1,
      'visit_malformed': 1,
      'visit_unknown': 1,
      'replayed_step': 1,
      'step_out_of_order': 1,
      'chain_broken': 1,
      'signature_rejected': 1,
      'record_scope_rejected': 1,
      'record_over_budget': 1,
      'floor_refused': 1,
      'direction_unknown': 1,
      'world_full': 1,
      'start_not_on_the_floor': 1,
      'beat_too_soon': 1,
      'visit_already_open': 1,
      'route_unknown': 1,
      'no_data_public_backend': 1
    };
    if (!allowed[cause]) { return 'authority_unreachable'; }
    return cause;
  }

  // create(config, win, consentGranted) → { send, end, state } or null.
  // config = { authority: 'https://...', origins: ['https://...'], ttl_ticks: N, max_visits: N }
  //   NOTE: config.consent is IGNORED — static config can never prove visitor opt-in.
  // win = the window object (for fetch, location, performance).
  // consentGranted = explicit boolean from caller; must be exactly true (from a user event or separate consent flow).
  // Returns null if config is invalid, consentGranted is not exactly true, or origin is not allowed.
  // NO_DATA(public_consent_UI_not_wired) — consent UI is not yet wired.
  function create(cfg, win, consentGranted) {
    if (consentGranted !== true) { return null; }
    if (!configOk(cfg)) { return null; }
    if (!originOk(win && win.location && win.location.origin, cfg.origins)) { return null; }
    if (!win || typeof win.fetch !== 'function') { return null; }

    var active = true;

    // Listen for pagehide — abandon the remote visit, no reconnection.
    if (win && win.addEventListener) {
      win.addEventListener('pagehide', function () { active = false; }, { once: true });
    }

    function end() { active = false; }

    // Bounded request size — do not send oversized bodies.
    var MAX_BODY = 64 * 1024; // 64 KiB JSON body ceiling
    // Bounded response size — do not read oversized responses.
    var MAX_RESPONSE = 256 * 1024; // 256 KiB response ceiling
    // Fetch timeout — abort hanging requests.
    var FETCH_TIMEOUT_MS = 10000; // 10 seconds

    // The transport wrapper: validates path, enforces size/timeout, sends the canonical body unchanged.
    // Does NOT inject _tick or mutate the signed body — canonical protocol is preserved.
    // NO_DATA(public_authority_not_deployed) — server-side TTL/replay is under pre-existing authority only.
    function send(path, body) {
      if (!active) { return Promise.resolve({ ok: false, cause: 'authority_unreachable' }); }
      if (typeof path !== 'string' || !/^\/(open|step|view)$/.test(path)) {
        return Promise.resolve({ ok: false, cause: 'route_unknown' });
      }
      // The signed JSON body is serialized without mutation; a cyclic or invalid body is rejected.
      var payload;
      try { payload = body === undefined ? 'null' : JSON.stringify(body); }
      catch (e) { return Promise.resolve({ ok: false, cause: 'visit_malformed' }); }
      if (typeof payload !== 'string') { return Promise.resolve({ ok: false, cause: 'visit_malformed' }); }
      if (new TextEncoder().encode(payload).length > MAX_BODY) {
        return Promise.resolve({ ok: false, cause: 'record_over_budget' });
      }
      var timerId = null;
      var controller;
      if (typeof AbortController === 'function') {
        controller = new AbortController();
        timerId = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
      }
      return Promise.resolve().then(function () { return win.fetch(cfg.authority + path, {
        method: 'POST',
        body: payload,
        cache: 'no-store',
        redirect: 'error', // never forward signed visit records through an HTTP redirect
        credentials: 'omit', // never send cookies to the authority
        signal: controller ? controller.signal : undefined
      }); }).then(function (r) {
        if (timerId !== null) { clearTimeout(timerId); }
        if (!r || !r.ok) { return { ok: false, cause: 'authority_unreachable' }; }
        // Bounded response — check content-length if available
        var cl = r.headers && r.headers.get ? r.headers.get('content-length') : null;
        if (cl && Number(cl) > MAX_RESPONSE) {
          return { ok: false, cause: 'record_over_budget' };
        }
        return r.text().then(function (raw) {
          if (raw.length > MAX_RESPONSE) {
            return { ok: false, cause: 'record_over_budget' };
          }
          var j;
          try {
            j = JSON.parse(raw);
          } catch (e) {
            return { ok: false, cause: 'authority_unreachable' };
          }
          if (j && j.ok === false && typeof j.cause === 'string') {
            return { ok: false, cause: bounded(j.cause) };
          }
          return j;
        }, function () { return { ok: false, cause: 'authority_unreachable' }; });
      }, function () {
        if (timerId !== null) { clearTimeout(timerId); }
        return { ok: false, cause: 'authority_unreachable' };
      });
    }

    return { send: send, end: end, state: function () { return { active: active }; } };
  }

  var api = { originOk: originOk, urlOk: urlOk, configOk: configOk, bounded: bounded, create: create };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabPresenceRemote = api;
})(typeof globalThis === 'object' ? globalThis : this);
