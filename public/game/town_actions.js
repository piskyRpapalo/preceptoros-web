// The Town actions: what a LIVE option with an `action` does when pressed (/game/building_interiors.json → actions).
// Loaded by building_sheet.js on the first press. Each entry: [piece path, its global, glue(M, doc, done, c)],
// where c = { win, doc, data (the interiors contract), load }. An unknown action or a piece that does not load says
// NO_DATA with its cause; nothing is invented.
(function (root) {
  'use strict';
  var ACTIONS = {
    letters: ['/game/type_scale.js', 'AtlasTypeScale', function (T, doc, done, c) {
      var r = T.cycle(doc, c.win), aa = doc.getElementById('gp-letters');
      if (aa && r.label) { aa.setAttribute('aria-label', r.label); aa.title = r.label; }
      done(r.label || ('NO_DATA · ' + r.causa));
    }],
    pulse: ['/game/pulse.js', 'AtlasPulse', function (P, doc, done, c) { done('measuring…'); P.start(c.win, 'weak', done); }],
    gaps: ['/game/gap_board.js', 'AtlasGapBoard', function (G, doc, done, c) { done(G.board(c.data).line); }],
    audio: ['/game/audio_only.js', 'AtlasAudioOnly', function (A, doc, done, c) {
      var r = A.toggle(doc, c.win), h = doc.getElementById('map-h'), m = /^(.+?) · (-?\d+), (-?\d+)$/.exec(h ? h.textContent : '');
      if (!r.on) { done(r.line); return; }
      var bs = (c.data && c.data.buildings || []).map(function (b) { return { name: b.name, total: b.options.length, live: b.options.filter(function (o) { return o.piece; }).length }; });
      var gaps = bs.reduce(function (n, b) { return n + b.total - b.live; }, 0);
      var lines = A.describe({ place: m && m[1], x: m && +m[2], y: m && +m[3], buildings: bs, gaps: gaps });
      A.speak(c.win, lines, function (t) { done(r.line + ' · ' + t); });
    }],
    typo: ['/game/typo_report.js', 'AtlasTypoReport', function (T, doc, done, c) {
      var store = null; try { store = c.win.localStorage; } catch (e) { store = null; }
      var e = T.envelope(T.selection(c.win), c.win.location ? c.win.location.pathname : '/', '', new Date().toISOString());
      if (!e.ok) { done(T.line(e) + (e.cause === 'nothing_selected' ? ' · select the wrong words first' : '')); return; }
      var r = T.save(store, e.report); done(T.line(r, r.count));
    }],
    inhabitants: ['/game/inhabitants.js', 'AtlasInhabitants', function (I, doc, done, c) {
      if (!c.win.fetch) { done('NO_DATA · fetch_unavailable'); return; }
      var get = function (u) { return c.win.fetch(u, { cache: 'no-store', credentials: 'omit' }).then(function (r) { return r.json(); }); };
      c.load('/game/agent_state.js', 'AtlasAgentState', function (S) {
        if (!S) { done('NO_DATA · piece_not_loaded'); return; }
        Promise.all([get('/api/world-state'), get('/game/agent_states.json')]).then(function (x) { done(I.from(x[0], S, x[1]).line); },
          function () { done('NO_DATA · world_state_unreachable'); });
      });
    }],
    notebook: ['/game/notebook_export.js', 'AtlasNotebook', function (N, doc, done, c) {
      var store = null; try { store = c.win.localStorage; } catch (e) { store = null; }
      var nb = N.build(store, new Date().toISOString());
      done(N.line(nb) + (N.download(c.win, nb) ? ' · saved' : ' · NO_DATA · notebook_download_failed'));
    }]
  };

  function run(name, c, done) {
    var a = ACTIONS[name];
    if (!a) { done('NO_DATA · action_unknown'); return; }
    c.load(a[0], a[1], function (M) {
      if (!M) { done('NO_DATA · piece_not_loaded'); return; }
      a[2](M, c.doc, done, c);
    });
  }
  var api = { NAMES: Object.keys(ACTIONS), run: run };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasTownActions = api;
})(typeof window !== 'undefined' ? window : globalThis);
