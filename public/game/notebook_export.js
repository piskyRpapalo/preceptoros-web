// Notebook export (K8c, Workshop): this device's 'preceptoros.' records as one JSON file.
// Pure core: no clock, no random numbers, no network. Secret-looking or over-1 KB (UTF-8) records are dropped.
// Not mounted by itself: a caller requires it and calls download().
(function (root) {
  'use strict';
  var PREFIX = 'preceptoros.', MOLD = 1024, MAX_RECORDS = 64;
  var SECRET = /token|secret|password|passwd|api_key|apikey|private|bearer|sk-[A-Za-z0-9_\-]{8,}|ghp_|github_pat_/i; // guardia:permitir detector of secret-looking keys; it holds no secret

  // utf8(text) → byte length of the text as UTF-8 (a lone surrogate counts as 3 bytes, like TextEncoder).
  function utf8(text) {
    var n = 0, s = String(text);
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) { n += 1; }
      else if (c < 0x800) { n += 2; }
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length && (s.charCodeAt(i + 1) & 0xFC00) === 0xDC00) { n += 4; i++; }
      else { n += 3; }
    }
    return n;
  }

  // keys(store) → sorted keys of a localStorage-like store that start with PREFIX; [] when the store is absent or throws.
  function keys(store) {
    var out = [];
    try {
      if (!store) { return []; }
      for (var i = 0; i < store.length; i++) {
        var k = store.key(i);
        if (typeof k === 'string' && k.indexOf(PREFIX) === 0) { out.push(k); }
      }
    } catch (e) { return []; }
    return out.sort();
  }

  // record(key, raw) → { key, bytes, value } | { key, estado: 'NO_DATA', causa, bytes? } (the value is never shown when dropped).
  function record(key, raw) {
    var text = raw === null || raw === undefined ? '' : String(raw), value = raw;
    if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch (e) { value = raw; } }
    if (SECRET.test(String(key)) || SECRET.test(text)) {
      return { key: key, estado: 'NO_DATA', causa: 'notebook_secret_dropped' };
    }
    var bytes = utf8(JSON.stringify({ key: key, value: value === undefined ? null : value }));
    if (bytes > MOLD) { return { key: key, estado: 'NO_DATA', causa: 'notebook_record_over_mold', bytes: bytes }; }
    return { key: key, bytes: bytes, value: value };
  }

  // build(store, nowIso) → the export document. nowIso is passed in by the caller; this module never reads a clock.
  function build(store, nowIso) {
    var ks = keys(store), records = [], kept = 0, dropped = 0;
    for (var i = 0; i < ks.length; i++) {
      if (i >= MAX_RECORDS) { records.push({ estado: 'NO_DATA', causa: 'notebook_over_count', index: i }); dropped++; continue; }
      var raw = null, readOk = true;
      try { raw = store.getItem(ks[i]); } catch (e) { readOk = false; }
      if (!readOk) { records.push({ key: ks[i], estado: 'NO_DATA', causa: 'notebook_read_failed' }); dropped++; continue; }
      var r = record(ks[i], raw);
      records.push(r);
      if (r.estado) { dropped++; } else { kept++; }
    }
    var doc = { v: 'preceptoros.notebook/1', made: nowIso, device: 'this device only', records: records, counts: { kept: kept, dropped: dropped } };
    if (ks.length === 0) { doc.note = 'NO_DATA · notebook_empty'; }
    return doc;
  }

  // text(doc) → the file body: JSON with one-space indent.
  function text(doc) { return JSON.stringify(doc, null, 1); }

  // fileName(nowIso) → 'preceptoros-notebook-YYYY-MM-DD.json' (first 10 characters of the given text).
  function fileName(nowIso) { return 'preceptoros-notebook-' + String(nowIso).slice(0, 10) + '.json'; }

  // download(win, doc) → true when the file was offered to the browser; false (no throw) when Blob, URL or document is missing.
  function download(win, doc) {
    try {
      if (!win || !win.Blob || !win.URL || !win.URL.createObjectURL || !win.document) { return false; }
      var blob = new win.Blob([text(doc)], { type: 'application/json' });
      var url = win.URL.createObjectURL(blob);
      var a = win.document.createElement('a');
      a.href = url; a.download = fileName(doc.made);
      a.click();
      win.URL.revokeObjectURL(url);
      return true;
    } catch (e) { return false; }
  }

  // line(doc) → one short sentence for an aria-live region (under 120 characters).
  function line(doc) {
    var c = doc.counts || { kept: 0, dropped: 0 };
    if (c.kept === 0 && c.dropped === 0) { return 'Notebook · NO_DATA · notebook_empty'; }
    if (c.kept === 0) { return 'Notebook · 0 kept · ' + c.dropped + ' dropped · nothing to save'; }
    return 'Notebook · ' + c.kept + ' kept · ' + c.dropped + ' dropped · ready to save';
  }

  var api = { PREFIX: PREFIX, MOLD: MOLD, MAX_RECORDS: MAX_RECORDS, SECRET: SECRET, keys: keys, record: record,
    build: build, text: text, fileName: fileName, download: download, line: line };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasNotebook = api;
})(typeof window !== 'undefined' ? window : globalThis);
