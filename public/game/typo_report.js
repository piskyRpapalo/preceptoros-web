// Typo report (J4, piece 1): one misspelt text kept on this device as 'preceptoros.typo.NNN'. Pure: no clock, no network.
(function (root) {
  'use strict';
  var PREFIX = 'preceptoros.typo.', MOLD = 1024, MAX = 16, QUOTE_MAX = 200, NOTE_MAX = 200, V = 'preceptoros.typo/1';
  var SECRET = /token|secret|password|passwd|api_key|apikey|private|bearer|sk-[A-Za-z0-9_\-]{8,}|ghp_|github_pat_/i; // guardia:permitir detection pattern, not a secret

  function clean(text) { return (text === null || text === undefined ? '' : String(text)).replace(/\s+/g, ' ').trim(); }
  // envelope(quote, page, note, when) → { ok, report | cause }. Stores nothing.
  function envelope(quote, page, note, when) {
    var q = clean(quote), n = clean(note), report;
    if (q === '') { return { ok: false, cause: 'nothing_selected' }; }
    if (q.length > QUOTE_MAX) { return { ok: false, cause: 'quote_too_long' }; }
    if (n.length > NOTE_MAX) { return { ok: false, cause: 'note_too_long' }; }
    if (typeof page !== 'string' || page.charAt(0) !== '/') { return { ok: false, cause: 'page_invalid' }; }
    if (SECRET.test(q) || SECRET.test(n)) { return { ok: false, cause: 'looks_like_a_secret' }; }
    report = { v: V, page: page, quote: q, note: n, when: String(when) };
    if (new TextEncoder().encode(JSON.stringify(report)).length >= MOLD) { return { ok: false, cause: 'over_mold' }; }
    return { ok: true, report: report };
  }
  // scan(store) → sorted PREFIX keys; throws when the store is missing or blocked.
  function scan(store) {
    if (!store) { throw new Error('storage_unavailable'); }
    var out = [];
    for (var i = 0; i < store.length; i++) {
      var k = store.key(i);
      if (typeof k === 'string' && k.indexOf(PREFIX) === 0) { out.push(k); }
    }
    return out.sort();
  }
  function isReport(v) {
    return !!v && typeof v === 'object' && v.v === V && typeof v.page === 'string' && typeof v.quote === 'string' &&
      typeof v.note === 'string' && typeof v.when === 'string';
  }
  // list(store) → valid reports in key order; [] when blocked. Bad records skipped.
  function list(store) {
    var ks, out = [];
    try { ks = scan(store); } catch (e) { return []; }
    for (var i = 0; i < ks.length; i++) {
      try { var parsed = JSON.parse(store.getItem(ks[i])); if (isReport(parsed)) { out.push(parsed); } } catch (e) { /* skipped */ }
    }
    return out;
  }
  // save(store, report) → { ok, key, count | cause }. Lowest free number from 001.
  function save(store, report) {
    var ks, n, pad, key;
    try { ks = scan(store); } catch (e) { return { ok: false, cause: 'storage_unavailable' }; }
    if (ks.length >= MAX) { return { ok: false, cause: 'notebook_full' }; }
    for (n = 1; n <= MAX; n++) { pad = ('00' + n).slice(-3); if (ks.indexOf(PREFIX + pad) < 0) { break; } }
    key = PREFIX + pad;
    try { store.setItem(key, JSON.stringify(report)); } catch (e) { return { ok: false, cause: 'storage_unavailable' }; }
    return { ok: true, key: key, count: ks.length + 1 };
  }
  // line(result, count) → one short aria-live sentence.
  function line(result, count) {
    if (result && result.ok) {
      return 'Saved for the Mesa · ' + (count === undefined ? result.count : count) + ' of ' + MAX + ' · export your notebook to send it';
    }
    return 'NO_DATA · ' + (result && result.cause ? result.cause : 'unknown');
  }
  // selection(win) → trimmed selection text, or ''. Never throws.
  function selection(win) {
    try {
      if (!win || typeof win.getSelection !== 'function') { return ''; }
      var s = win.getSelection();
      return s === null || s === undefined ? '' : String(s).trim();
    } catch (e) { return ''; }
  }

  var api = { PREFIX: PREFIX, MOLD: MOLD, MAX: MAX, QUOTE_MAX: QUOTE_MAX, NOTE_MAX: NOTE_MAX, SECRET: SECRET,
    envelope: envelope, list: list, save: save, line: line, selection: selection };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasTypoReport = api;
})(typeof window !== 'undefined' ? window : globalThis);
