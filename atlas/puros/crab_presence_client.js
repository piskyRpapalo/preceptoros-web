// Seam A · the visitor's side of shared presence (Mesa #34). NOT served and loaded by no page: a harness hands it to
// a test page. It holds no network code: `send(path, body)` is handed in, so the transport is whoever mounts it.
//   join(account, send)            → opens the visit at the authority with explicit consent; returns the client
//   client.step(dir)               → signs one atlas.paso/1 with the visit key (visitor_account.js) and sends it;
//                                    the chain advances only when the authority accepts, so a refusal changes nothing
//   client.look()                  → the authority's view, as any other visitor may draw it
//   client.resend()                → the last accepted packet again (what a replay looks like, for the cases)
// No clock, no randomness, no storage.
(function (root) {
  'use strict';
  var enc = new TextEncoder();
  function hex(buffer) { return Array.from(new Uint8Array(buffer), function (v) { return v.toString(16).padStart(2, '0'); }).join(''); }
  async function digest(text) { return hex(await root.crypto.subtle.digest('SHA-256', enc.encode(text))); }
  async function join(account, send, consent) {
    if (consent !== true) { return { ok: false, cause: 'consent_required' }; }
    var key = account.info().publicKey, seq = 0, prev = 'genesis', last = null;
    var opened = await send('/open', { key: key, consent: true });
    if (!opened || opened.ok !== true) { return { ok: false, cause: (opened && opened.cause) || 'authority_unreachable' }; }
    return { ok: true, id: opened.id,
      step: async function (dir) {
        var record = { esquema: 'atlas.paso/1', dir: dir, seq: seq + 1, prev: prev, clave_publica: key }, text = JSON.stringify(record);
        var packet = { record: record, signature: await account.sign(record, true) };
        var r = await send('/step', packet);
        if (r && r.ok === true) { seq++; prev = await digest(text); last = packet; }
        return r || { ok: false, cause: 'authority_unreachable' };
      },
      resend: function () { return last ? send('/step', last) : Promise.resolve({ ok: false, cause: 'nothing_sent_yet' }); },
      forge: function (change) { return last ? send('/step', change(JSON.parse(JSON.stringify(last)))) : Promise.resolve({ ok: false, cause: 'nothing_sent_yet' }); },
      look: function () { return send('/view', null); } };
  }
  var api = { join: join };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabPresenceClient = api;
})(typeof globalThis === 'object' ? globalThis : this);
