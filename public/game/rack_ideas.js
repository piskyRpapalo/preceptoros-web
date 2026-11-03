// LA VOZ DEL RACK (ODD decree 2026-10-28): inside a building, the chat asks the rack for its ideas and shows them one by one.
// The ideas live in the study repository (the rack's public doctrine); its index ai-index.json (schema preceptoros.ai-index/1)
// names every canonical document with a one-line summary and its sha256. This page owns the window; study owns the ideas;
// the chat is only the bridge. Nothing is requested on load: the one request leaves on the visitor's explicit ask, and every
// failure is said as NO_DATA with its cause. Only "entries" are shown — never the index's decoys or canaries.
// The jewels (JOYAS, the system's name for its beautiful measured maths) come live the same way, from odd/JOYAS.md on main:
// each «### J<n> · title» heading and its «Dónde» line, quoted as written (Spanish, marked «es»).
(function (root) {
  'use strict';
  var SOURCE = 'https://raw.githubusercontent.com/piskyRpapalo/study/main/ai-index.json';
  var JEWELS = 'https://raw.githubusercontent.com/piskyRpapalo/preceptoros-web/main/odd/JOYAS.md';
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

  // parseJewels(markdown) → { ok, jewels: [{ id, title, where }] } or { ok: false, causa }. Pure; reads only the headings.
  function plainMd(t) { return String(t || '').replace(/\*\*|`/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); }
  function parseJewels(md) {
    var text = String(md || ''), jewels = [], cur = null;
    if (!/^# JOYAS/m.test(text)) { return nd('not_jewels', 'the rack answered, but not with its jewels.'); }
    text.split('\n').forEach(function (l) {
      var h = /^### (J\d+) · (.+)$/.exec(l), d = /^- \*\*Dónde:\*\*\s*(.+)$/.exec(l);
      if (h && jewels.length < MAX_IDEAS) { cur = { id: h[1], title: cut(plainMd(h[2])), where: 'NO_DATA' }; jewels.push(cur); }
      else if (d && cur && cur.where === 'NO_DATA') { cur.where = cut(plainMd(d[1])); }
    });
    if (!jewels.length) { return nd('no_jewels', 'the jewels file has no jewel heading.'); }
    return { ok: true, jewels: jewels };
  }
  function jewelLine(j, i, n) { return cut('Jewel ' + (i + 1) + '/' + n + ' · ' + j.id + ' · ' + j.title + ' · where: ' + j.where + ' · odd/JOYAS.md (es)'); }
  function jewelHeader(name, r) { return name + ' asks the rack for its jewels: ' + r.jewels.length + ', live from main.'; }

  // Each idea, one line: what it says and where it lives. The short sha lets anyone check the copy.
  function lineOf(idea, i, n) { return 'Rack idea ' + (i + 1) + '/' + n + ' · ' + idea.line + ' · study/' + idea.path + ' · sha256 ' + idea.sha256.slice(0, 12); }
  function header(name, r) { return name + ' asks the rack: ' + r.ideas.length + ' ideas, live from study (index of ' + r.generated + ').'; }

  // fetchIdeas({ fetch, online, timer }) → Promise of parse()'s result. Never rejects: every failure is a NO_DATA cause.
  function fetchIdeas(o) { return ask(o, SOURCE, parse); }
  function fetchJewels(o) { return ask(o, JEWELS, parseJewels); }
  function ask(o, url, parser) {
    if (o.online === false) { return Promise.resolve(nd('offline', 'this device is offline; the rack ideas need the network.')); }
    if (typeof o.fetch !== 'function') { return Promise.resolve(nd('no_fetch', 'this browser cannot ask the rack.')); }
    return new Promise(function (done) {
      var over = false, t = (o.timer || setTimeout)(function () { over = true; done(nd('timeout', 'the rack did not answer in ' + TIMEOUT / 1000 + ' s.')); }, TIMEOUT);
      function end(r) { if (!over) { over = true; (o.clear || clearTimeout)(t); done(r); } }
      o.fetch(url, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (res) {
        if (!res.ok) { end(nd('http_' + res.status, 'the rack answered ' + res.status + '.')); return; }
        return res.text().then(function (txt) { end(parser(txt)); });
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

  var AtlasRackIdeas = { SOURCE: SOURCE, JEWELS: JEWELS, SCHEMA: SCHEMA, MAX_LINE: MAX_LINE, STEP: STEP, parse: parse, lineOf: lineOf, header: header,
    parseJewels: parseJewels, jewelLine: jewelLine, jewelHeader: jewelHeader, fetchIdeas: fetchIdeas, fetchJewels: fetchJewels, stream: stream };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasRackIdeas; }
  else { root.AtlasRackIdeas = AtlasRackIdeas; }
})(typeof globalThis === 'object' ? globalThis : this);
