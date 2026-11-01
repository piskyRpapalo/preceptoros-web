// H1b · the egg opens. After a signed adoption on /openworld/, the existing reveal (summon_reveal.js: the egg falls,
// the wave is born harmonic by harmonic, sound and reduced motion included) shows the new troop. Loaded on demand: the
// first view does not pay for wave_render.js and summon_reveal.js until an egg actually hatches.
(function (root) {
  'use strict';
  var doc = root.document;
  // The reveal rules of face_canon.css (lines 4-10), so the overlay is the same one /face shows.
  var CSS = '.revela{position:fixed;inset:0;z-index:90;display:grid;grid-template-rows:minmax(0,1fr) auto;background:rgb(5,8,18)}' +
    '.revela-lienzo{width:100%;height:100%;display:block;cursor:pointer}' +
    '.revela-pie{display:grid;justify-items:center;gap:.6rem;padding:1rem;max-height:55dvh;overflow:auto;color:#f2f5f7}' +
    '.revela-txt{margin:0;min-height:1.4em;font:700 1.05rem/1.3 ui-monospace,monospace;text-align:center}' +
    '.revela-ok{min-height:48px;min-width:9rem;font:inherit;font-weight:700;border-radius:14px;border:3px solid #f2f5f7;background:#00d2ff;color:#1e1826}' +
    '.revela-ficha{width:min(100%,40rem);max-height:36dvh;overflow:auto;padding:.6rem;border:2px solid #00d2ff;border-radius:12px;font-size:.85rem}' +
    '.revela-ficha-vector{display:block;max-height:4rem;overflow:auto;font-size:.68rem;overflow-wrap:anywhere}';
  var SCRIPTS = ['/game/wave_render.js', '/game/summon_reveal.js'], ready = null;

  function script(src) {
    return new Promise(function (ok, fail) {
      var s = doc.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { fail(new Error('could not load ' + src)); }; doc.head.appendChild(s);
    });
  }
  function load() {
    if (root.AtlasRevela) { return Promise.resolve(); }
    if (!ready) {
      var style = doc.createElement('style'); style.textContent = CSS; doc.head.appendChild(style);
      ready = SCRIPTS.reduce(function (p, src) { return p.then(function () { return script(src); }); }, Promise.resolve());
    }
    return ready;
  }

  // show(state, say) → opens the reveal for the troop just hatched (state.hatched, visitor_eggs.js); say(text) is told when it cannot.
  function show(state, say) {
    var troop = state && state.hatched;
    if (!troop || !troop.armonicos) { say('NO_DATA: the hatched troop has no harmonics to reveal'); return Promise.resolve(false); }
    return load().then(function () { root.AtlasRevela.muestra(troop); return true; },
      function (e) { say('NO_DATA: the egg-opening animation is unavailable (' + e.message + ')'); return false; });
  }

  root.AtlasHatchReveal = { show: show };
})(this);
