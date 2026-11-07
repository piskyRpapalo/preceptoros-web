// The web judge: quote or stay silent (F0 plan, slice i). The web has no answer model, so the
// judge never writes an answer: it returns EXACT quotes from the canon corpus
// (/openworld/judge-corpus.json) or NO_DATA with its cause, before anything else. Same ceilings
// as the app judge: at most 3 sources, quotes <= 320 UTF-8 bytes in total. A quote is not an
// explanation. Deterministic: no randomness, no clock, no network.
(function (raiz) {
  'use strict';

  var MAX_SOURCES = 3, MAX_QUOTES_B = 320, LIMIT = 1024, MIN_TOKEN = 3, STEM = 4;
  // Function words (English and Spanish) never make a match.
  var STOP = {};
  ('the and for how why are was its you has not but can who que los las del una por con sus mas '
    + 'does what that this with from have when which their there these those where would could should about into '
    + 'only also than then them they your para como pero esta este esto donde cuando sobre entre tiene sino porque')
    .split(' ').forEach(function (w) { STOP[w] = true; });

  function bytesOf(s) {
    return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : unescape(encodeURIComponent(s)).length;
  }
  function tokens(s) {
    var seen = {}, out = [];
    String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).forEach(function (t) {
      // decision without signature: words compare by their first four letters (wave/waves,
      // damage/damaged); the quote itself is never changed.
      var k = t.slice(0, STEM);
      if (t.length >= MIN_TOKEN && !STOP[t] && !seen[k]) { seen[k] = true; out.push(k); }
    });
    return out;
  }
  function overlap(qt, text) {
    var have = {}; tokens(text).forEach(function (t) { have[t] = true; });
    return qt.filter(function (t) { return have[t]; }).length;
  }
  // Cut by characters until the quote fits the byte cap; the result stays an exact substring.
  function fit(s, cap) {
    while (s && bytesOf(s) > cap) { s = s.slice(0, -1); }
    return s.trim() === s ? s : s.replace(/\s+$/, '');
  }

  // search(corpus, question) -> {estado:'MEASURED', fuentes:[{id,doc,sha256,quote}]} or NO_DATA.
  function search(corpus, question) {
    if (typeof question !== 'string' || !question.trim() || bytesOf(question) >= LIMIT) {
      return { estado: 'NO_DATA', causa: 'question_invalid' };
    }
    if (!corpus || corpus.schema !== 'preceptoros.judge-corpus/1' || !Array.isArray(corpus.passages)) {
      return { estado: 'NO_DATA', causa: 'corpus_unavailable' };
    }
    var qt = tokens(question);
    // decision without signature: two shared words make a source; one when the question has one.
    var need = qt.length === 1 ? 1 : 2;
    var ranked = corpus.passages.map(function (p) { return { p: p, s: overlap(qt, p.text) }; })
      .filter(function (x) { return x.s >= need; })
      .sort(function (a, b) { return b.s - a.s || a.p.id - b.p.id; })
      .slice(0, MAX_SOURCES);
    if (!ranked.length) { return { estado: 'NO_DATA', causa: 'no_cited_source' }; }
    var cap = Math.floor(MAX_QUOTES_B / ranked.length);
    var fuentes = ranked.map(function (x) {
      var best = x.p.text.split(/(?<=[.!?])\s+/).reduce(function (a, s) {
        return overlap(qt, s) > overlap(qt, a) ? s : a;
      });
      return { id: x.p.id, doc: x.p.doc, sha256: x.p.sha256, quote: fit(best, cap) };
    }).filter(function (f) { return f.quote; });
    return fuentes.length ? { estado: 'MEASURED', fuentes: fuentes } : { estado: 'NO_DATA', causa: 'no_cited_source' };
  }

  // frame(result) -> acho/1 frame (< 1,024 B), same shape as state_frames.js. It never sounds:
  // a quote declares no waves, so its sound is NO_DATA with cause.
  function frame(result) {
    var r = result && result.estado === 'MEASURED'
      ? result.fuentes.map(function (f) { return '«' + f.quote + '» (' + f.doc + ')'; }).join(' · ')
      : 'NO_DATA · ' + ((result && result.causa) || 'no_result');
    return { v: 'preceptoros.acho/1', id: 'judge', t: 0, cv: [320, 96],
      atoms: [{ k: 'judge', r: r, i: [] }], bands: ['paper', 'ink', 'cyan'], change: [r],
      sound: 'NO_DATA: a quote declares no waves', soundCause: 'the judge quotes; nothing is invented' };
  }

  var AtlasJudgeCorpus = { MAX_SOURCES: MAX_SOURCES, MAX_QUOTES_B: MAX_QUOTES_B, search: search, frame: frame, tokens: tokens };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasJudgeCorpus; }
  else { raiz.AtlasJudgeCorpus = AtlasJudgeCorpus; }
})(this);
