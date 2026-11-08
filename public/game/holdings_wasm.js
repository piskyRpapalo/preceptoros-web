// C8 holdings on the page: the Rust acho-ledger compiled to WASM (Sovereign, 2026-11-08: «Firmo todo lo que pueda ser en rust desde ahora»).
// Every failure is NO_DATA with its cause. Resources: 0 copper, 1 light, 2 biomass, 3 oxygen. Life is per mille (0..1000).
(function (root) {
  'use strict';
  var KINDS = ['workshop', 'lottery', 'customs', 'hostel', 'tower', 'choir', 'agora', 'doctor', 'coliseum', 'visitor-house'];
  var RES = ['copper', 'light', 'biomass', 'oxygen'];
  function nd(causa) { return { estado: 'NO_DATA', causa: causa }; }
  function fromExports(e) {
    var api = {
      reset: function () { e.ledger_reset(); },
      grant: function (res, n, step) { e.ledger_grant(res, n, step); },
      conquer: function (id, kind, waves, life) {
        var k = typeof kind === 'string' ? KINDS.indexOf(kind) : kind;
        return k >= 0 && e.ledger_conquer(id, k, waves, life) === 1;
      },
      tick: function (step) {
        var m = e.ledger_tick(step);
        return { raided: !!(m & 1), fell: !!(m & 2), retaken: !!(m & 4), starved: !!(m & 8) };
      },
      heal: function (step, id) { var v = e.ledger_heal(step, id); return v < 0 ? null : v; },
      healCost: function (life) { return e.ledger_heal_cost(life); },
      balances: function () {
        return { copper: e.ledger_balance(0), light: e.ledger_balance(1), biomass: e.ledger_balance(2), oxygen: e.ledger_balance(3) };
      },
      holdings: function () {
        var out = [], n = e.ledger_count();
        for (var i = 0; i < n; i++) {
          out.push({ id: e.ledger_holding_id(i), kind: KINDS[e.ledger_holding_kind(i)], life: e.ledger_holding_life(i), waves: e.ledger_holding_waves(i) });
        }
        return out;
      },
      army: function () { return e.ledger_army(); },
      entries: function () { return e.ledger_entries(); },
      head: function () {
        var s = '';
        for (var i = 0; i < 32; i++) { s += ('0' + e.ledger_head_byte(i).toString(16)).slice(-2); }
        return s;
      },
      verify: function () { return e.ledger_verify() === 1; }
    };
    return api;
  }
  // load(url): fetch + instantiate (no instantiateStreaming: the server may not send application/wasm). Never throws.
  function load(url) {
    var W = root.WebAssembly;
    if (typeof root.fetch !== 'function') { return Promise.resolve(nd('fetch not available')); }
    if (!W || typeof W.instantiate !== 'function') { return Promise.resolve(nd('WebAssembly not available')); }
    return Promise.resolve()
      .then(function () { return root.fetch(url === undefined ? '/game/acho_ledger.wasm' : url); })
      .then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.arrayBuffer(); })
      .then(function (bytes) { return W.instantiate(bytes, {}); })
      .then(function (m) { return fromExports(m.instance.exports); })
      .catch(function (err) { return nd('load failed: ' + (err && err.message || 'unknown')); });
  }
  var api = { KINDS: KINDS, RES: RES, load: load, fromExports: fromExports };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasHoldings = api;
})(typeof window !== 'undefined' ? window : globalThis);
