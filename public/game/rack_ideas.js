// LA VOZ DEL RACK (ODD decree 2026-10-28): inside a building, the chat asks the rack for its ideas and shows them one by one.
// The ideas live in the study repository (the rack's public doctrine); its index ai-index.json (schema preceptoros.ai-index/1)
// names every canonical document with a one-line summary and its sha256. This page owns the window; study owns the ideas;
// the chat is only the bridge. Nothing is requested on load: the one request leaves on the visitor's explicit ask, and every
// failure is said as NO_DATA with its cause. Only "entries" are shown — never the index's decoys or canaries.
(function (root) {
  'use strict';
  var SOURCE = 'https://raw.githubusercontent.com/piskyRpapalo/study/main/ai-index.json';
  var SCHEMA = 'preceptoros.ai-index/1', MAX_IDEAS = 32, MAX_LINE = 300, TIMEOUT = 8000, STEP = 400;

  function cut(s) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > MAX_LINE ? s.slice(0, MAX_LINE - 1) + '…' : s; }
  function nd(cause, plain) { return { ok: false, causa: 'NO_DATA · ' + cause + ': ' + plain }; }

  // parse(text) → { ok, generated, ideas: [{ path, line, sha256 }] } or { ok: false, causa }. Pure.
  function parse(text) {
    var d;
    try { d = JSON.parse(text); } catch (e) { return nd('not_json', 'the rack answered, but not with its index.'); }
    if (!d || d.esquema !== SCHEMA) { return nd('schema_unknown', 'the rack index has an unknown form (' + cut(d && d.esquema) + ').'); }
    if (!Array.isArray(d.entries)) { return nd('no_entries', 'the rack index lists no ideas.'); }
    var ideas = [];
    d.entries.forEach(function (e) {
      if (!e || typeof e.path !== 'string' || typeof e.one_liner !== 'string' || !/^[0-9a-f]{64}$/.test(e.sha256 || '')) { return; }
      if (ideas.length < MAX_IDEAS) { ideas.push({ path: e.path, line: cut(e.one_liner), sha256: e.sha256 }); }
    });
    if (!ideas.length) { return nd('no_ideas', 'the rack index has no well-formed idea.'); }
    return { ok: true, generated: cut(d.generated_utc) || 'NO_DATA', ideas: ideas };
  }

  // Each idea, one line: what it says and where it lives. The short sha lets anyone check the copy.
  function lineOf(idea, i, n) { return 'Rack idea ' + (i + 1) + '/' + n + ' · ' + idea.line + ' · study/' + idea.path + ' · sha256 ' + idea.sha256.slice(0, 12); }
  function header(name, r) { return name + ' asks the rack: ' + r.ideas.length + ' ideas, live from study (index of ' + r.generated + ').'; }

  // fetchIdeas({ fetch, online, timer }) → Promise of parse()'s result. Never rejects: every failure is a NO_DATA cause.
  function fetchIdeas(o) {
    if (o.online === false) { return Promise.resolve(nd('offline', 'this device is offline; the rack ideas need the network.')); }
    if (typeof o.fetch !== 'function') { return Promise.resolve(nd('no_fetch', 'this browser cannot ask the rack.')); }
    return new Promise(function (done) {
      var over = false, t = (o.timer || setTimeout)(function () { over = true; done(nd('timeout', 'the rack did not answer in ' + TIMEOUT / 1000 + ' s.')); }, TIMEOUT);
      function end(r) { if (!over) { over = true; (o.clear || clearTimeout)(t); done(r); } }
      o.fetch(SOURCE, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (res) {
        if (!res.ok) { end(nd('http_' + res.status, 'the rack answered ' + res.status + '.')); return; }
        return res.text().then(function (txt) { end(parse(txt)); });
      }).catch(function () { end(nd('network_error', 'the rack could not be reached.')); });
    });
  }

  // stream(lines, say, still, wait): says one line per step while still() holds (the visitor is in the same building).
  function stream(lines, say, still, wait) {
    var i = 0;
    (function next() {
      if (i >= lines.length || !still()) { return; }
      say(lines[i++]); if (i < lines.length) { wait(next, STEP); }
    })();
  }

  var AtlasRackIdeas = { SOURCE: SOURCE, SCHEMA: SCHEMA, MAX_LINE: MAX_LINE, STEP: STEP, parse: parse, lineOf: lineOf, header: header, fetchIdeas: fetchIdeas, stream: stream };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasRackIdeas; }
  else { root.AtlasRackIdeas = AtlasRackIdeas; }
})(typeof globalThis === 'object' ? globalThis : this);
