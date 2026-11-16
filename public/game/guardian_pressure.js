// Guardian pressure · the guardians of the grey buildings notice the crab (Mesa #46 · WORLD-LIFE 17 + ECHOES «guard awake»).
// A projection of facts the map already holds: the hex distance to the crab and whether this visit won the building's
// fight. It moves nothing in the rules: no patrol attacks, no fight starts, nothing is owned. Presence is not property.
//   pace(tMs, q, r)   → the patrol angle. TIME IS AN ARGUMENT (acho_score law 3): 2.1 rad a second whatever the frame
//                       rate, the same look Q-02 had at 60 frames (0.035 a frame); the offset still comes from the key.
//   pressure(d)       → p in [0, 1] from the hex distance: 0 at 4 or more, 1 at 1 or less, smoothstep between
//                       (d 3 → 0.2593, d 2 → 0.7407). The patrol loop shrinks by (1 − p); the guardian leans 0.1 hex
//                       toward the crab and steps 0.45 hex aside of the crab's line (the side from its key) by p, so
//                       the crab never hides it (measured at 360 px): at one hex it stands by its door, eyes on you.
//   retreat(u)        → { out, alpha, scale } for u in [0, 1] of the 1.2 s after the page SAW this visit win the fight.
//   state(d, phase)   → 'patrol' | 'watching' | 'alert' | 'retreating' | 'gone'.
//   pose(...)         → { dx, dy, look, alpha, scale, state }: what map_fog_layer.js draws.
// Parity: read() gives each guardian on screen to a machine; the first alert of a guardian in this visit is said in
// words (unless the walk or the first adventure is already speaking) and, with the built-in sound on, as two low
// notes. Reduced motion: no loop, no glide, the retreat is a cut.
(function (root) {
  'use strict';
  var W = 2.1, LEAN = 0.1, SIDE = 0.45, LOOP = 0.5, RETREAT_MS = 1200, FAR = 4;
  function r4(x) { return Math.round(x * 1e4) / 1e4; }
  function phase0(q, r) { return (((q * 73856093) ^ (r * 19349663)) >>> 0) % 628 / 100; }
  function pace(tMs, q, r) { return W * tMs / 1000 + phase0(q, r); }
  function pressure(d) { var x = Math.max(0, Math.min(1, (FAR - d) / (FAR - 1))); return r4(x * x * (3 - 2 * x)); }
  function retreat(u) { u = Math.max(0, Math.min(1, u)); var e = u * u * (3 - 2 * u); return { out: r4(1.2 * e), alpha: r4(1 - u), scale: r4(1 - 0.4 * e) }; }
  function state(d, ph) { return ph === 'gone' || ph === 'retreating' ? ph : d <= 1 ? 'alert' : pressure(d) > 0 ? 'watching' : 'patrol'; }
  // pose(a, d, dir, step, sq, u, side): a = pace angle, dir = unit screen vector toward the crab, u = retreat progress or
  // -1, side = +1 or -1 (which side of the crab's line it stands on).
  function pose(a, d, dir, step, sq, u, side) {
    var p = pressure(d), k = 1 - p, ux = dir ? dir[0] : 0, uy = dir ? dir[1] : 0, sd = side === -1 ? -1 : 1;
    var dx = Math.cos(a) * LOOP * step * k + (ux * LEAN - uy * SIDE * sd) * step * p, dy = Math.sin(a) * LOOP * step * sq * k + (uy * LEAN + ux * SIDE * sd) * step * p;
    if (u >= 0) { var R = retreat(u); return { dx: r4(dx - ux * R.out * step), dy: r4(dy - uy * R.out * step), look: [-ux, -uy], alpha: R.alpha, scale: R.scale, state: u >= 1 ? 'gone' : 'retreating' }; }
    return { dx: r4(dx), dy: r4(dy), look: p > 0 ? [ux, uy] : null, alpha: 1, scale: 1, state: state(d) };
  }
  var api = { W: W, LEAN: LEAN, SIDE: SIDE, RETREAT_MS: RETREAT_MS, pace: pace, pressure: pressure, retreat: retreat, state: state, pose: pose };
  if (typeof module === 'object' && module.exports) { module.exports = api; root.AtlasGuardianPressure = api; return; }
  // Browser: what the page saw, by building key. `seen` holds the fog → won transition time; a building already won when
  // first seen (a reload) is simply gone: its retreat happened before.
  var doc = root.document, seen = {}, alerted = {}, shown = [], clock = function () { return root.performance ? root.performance.now() : Date.now(); };
  function key(m) { return m.id + ':' + m.q + ',' + m.r; }
  function still() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function low() { // two low notes, rising a minor third: attention, not refusal (a refusal falls) and not light (three rising)
    if (!doc || doc.documentElement.dataset.audioOnly !== 'on') { return; }
    try { var A = root.AudioContext || root.webkitAudioContext; if (!A) { return; }
      var c = low.c || (low.c = new A()), t = c.currentTime;
      [[294, 0], [349, 0.14]].forEach(function (n) { var o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(n[0], t + n[1]);
        g.gain.setValueAtTime(0.0001, t + n[1]); g.gain.exponentialRampToValueAtTime(0.1, t + n[1] + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.2);
        o.connect(g); g.connect(c.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.22); });
    } catch (e) { /* no audio: the words carry it */ }
  }
  function busy() { var F = root.AtlasMapFog, fa = doc && doc.getElementById('fa'); return !!((F && F.walking && F.walking()) || (fa && !fa.hidden) || (doc && doc.querySelector('.bs-sheet:not([hidden]),dialog[open],.pt-news'))); } // another voice speaks: the notes only
  function say(m) {
    var T = root.AtlasPreceptorTalk && root.AtlasPreceptorTalk.view, name = String(m.id).replace(/-/g, ' ');
    if (!busy() && T && T.news) { T.news('The guardian of this ' + name + ' has seen you. It stands its ground: challenge it from its card, or walk on.', 'Guardian', true); }
    low();
  }
  // at(m, d, dir, step, sq, now): one guardian's pose this frame; called by map_fog_layer.js for fogged and won marks.
  function at(m, d, dir, step, sq, now) {
    var k = key(m), t = now == null ? clock() : now, rm = still();
    if (m.won) {
      if (!(k in seen)) { seen[k] = null; } // won before this page looked: nothing to retreat
      if (seen[k] === null) { return null; }
      var u = rm ? 1 : (t - seen[k]) / RETREAT_MS; if (u >= 1) { seen[k] = null; return null; }
      var R = pose(rm ? 0 : pace(t, m.q, m.r), d, dir, step, sq, u, phase0(m.q, m.r) < 3.14 ? 1 : -1); R.key = k; R.d = d; shown.push(R); return R;
    }
    seen[k] = t; // fogged now: a win seen later starts its retreat from this moment's next frame
    var P = pose(rm ? 0 : pace(t, m.q, m.r), d, dir, step, sq, -1, phase0(m.q, m.r) < 3.14 ? 1 : -1); P.key = k; P.d = d; P.p = pressure(d); P.a = rm ? null : r4(pace(t, m.q, m.r)); P.t = t; shown.push(P);
    if (P.state === 'alert' && !alerted[k]) { alerted[k] = true; say(m); }
    return P;
  }
  function frame() { shown = []; } // map_fog_layer.js starts each draw with it
  function read() { return shown.map(function (s) { return { key: s.key, d: s.d, p: s.p == null ? null : s.p, state: s.state, dx: s.dx, dy: s.dy, a: s.a == null ? null : s.a, t: s.t == null ? null : s.t }; }); }
  function alertedNow() { return Object.keys(alerted); }
  api.at = at; api.frame = frame; api.read = read; api.alerted = alertedNow;
  root.AtlasGuardianPressure = api;
})(typeof window !== 'undefined' ? window : globalThis);
