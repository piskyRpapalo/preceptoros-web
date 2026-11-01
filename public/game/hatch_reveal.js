// H1b · the egg opens. After a signed adoption on /openworld/, the existing reveal (summon_reveal.js: the egg falls,
// the wave is born harmonic by harmonic, sound and reduced motion included) shows the new troop. Loaded on demand: the
// first view does not pay for wave_render.js and summon_reveal.js until an egg actually hatches.
(function (root) {
  'use strict';
  var doc = root.document;
  // The reveal rules live in face_canon.css (lines 4-10; its other rules are scoped to /face ids): linked, not copied.
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
      var link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = '/face/face_canon.css'; doc.head.appendChild(link);
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
