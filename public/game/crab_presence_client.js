// Shared presence · the visitor's side (Seam A, Mesa #34). Loaded only by shared_crabs.js, after the visitor's own
// consent. It holds no network code: `send(path, body)` is handed in by whoever mounts it.
//   join(account, send, consent, start) → opens the visit at the authority, naming only the cell where the crab stands
//   client.step(dir)   → signs one atlas.paso/1 with the visit key (visitor_account.js) and sends it
//   client.beat()      → signs one atlas.presente/1 («still here») on the same chain
//   client.ask(id)     → signs one atlas.coop/1: asks that crab to light the beacon together
//   client.yes(ask)    → signs one atlas.coop_si/1: says yes to an ask made to this crab
//   client.look(around)→ the authority's view around a cell, as any other visitor may draw it
// The chain advances only when the authority accepts, so a refusal changes nothing. No clock, no randomness, no storage.
(function (root) {
  'use strict';
  var enc = new TextEncoder();
  function hex(buffer) { return Array.from(new Uint8Array(buffer), function (v) { return v.toString(16).padStart(2, '0'); }).join(''); }
  async function digest(text) { return hex(await root.crypto.subtle.digest('SHA-256', enc.encode(text))); }
  async function join(account, send, consent, start, options) {
    if (consent !== true) { return { ok: false, cause: 'consent_required' }; }
    var key = account.info().publicKey, seq = 0, prev = 'genesis', last = null, busy = Promise.resolve();
    var opened = await send('/open', start ? { key: key, consent: true, start: start } : { key: key, consent: true });
    if (!opened || opened.ok !== true) { return { ok: false, cause: (opened && opened.cause) || 'authority_unreachable' }; }
    // The production Durable Object creates a fresh unpredictable chain genesis at /open.
    // A reused session's first signed step MUST NOT fall back to the local TEST literal.
    if (options && options.requireGenesis === true) {
      if (typeof opened.genesis !== 'string' || !/^[0-9a-f]{64}$/.test(opened.genesis)) {
        return { ok: false, cause: 'genesis_missing_or_invalid' };
      }
      prev = opened.genesis;
    } else if (opened.genesis !== undefined) {
      if (typeof opened.genesis !== 'string' || !/^[0-9a-f]{64}$/.test(opened.genesis)) {
        return { ok: false, cause: 'genesis_invalid' };
      }
      prev = opened.genesis;
    }
    // One record at a time: two records signed at once would share a sequence number and one would be refused.
    function sign(record) {
      var run = busy.then(async function () {
        record.seq = seq + 1; record.prev = prev;
        var text = JSON.stringify(record), packet = { record: record, signature: await account.sign(record, true) };
        var r = await send('/step', packet);
        if (r && r.ok === true) { seq++; prev = await digest(text); last = packet; }
        return r || { ok: false, cause: 'authority_unreachable' };
      });
      busy = run.catch(function () {});
      return run.catch(function (e) { return { ok: false, cause: String(e && e.message || e).slice(0, 60) }; });
    }
    return { ok: true, id: opened.id, beacon: opened.beacon || null,
      ask: function (id) { return sign({ esquema: 'atlas.coop/1', accion: 'faro', con: id, seq: 0, prev: '', clave_publica: key }); },
      yes: function (ask) { return sign({ esquema: 'atlas.coop_si/1', peticion: ask, seq: 0, prev: '', clave_publica: key }); },
      step: function (dir) { return sign({ esquema: 'atlas.paso/1', dir: dir, seq: 0, prev: '', clave_publica: key }); },
      beat: function () { return sign({ esquema: 'atlas.presente/1', seq: 0, prev: '', clave_publica: key }); },
      resend: function () { return last ? send('/step', last) : Promise.resolve({ ok: false, cause: 'nothing_sent_yet' }); },
      forge: function (change) { return last ? send('/step', change(JSON.parse(JSON.stringify(last)))) : Promise.resolve({ ok: false, cause: 'nothing_sent_yet' }); },
      look: function (around) { return send('/view', around ? { q: around.q, r: around.r, radius: around.radius, as: opened.id } : null); } };
  }
  var api = { join: join };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabPresenceClient = api;
})(typeof globalThis === 'object' ? globalThis : this);
