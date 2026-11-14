// The crab's trail (BEAUTY-02, 2026-11-14): the last cells the crab really walked keep a small footprint in Acho (two
// rows of dots, the tracks a crab leaves in sand), each one fainter than the one after it. The trail fades by STEPS,
// never by a clock, so there is no loop while the crab stands still (Sovereign 2026-11-08, «the crab alive»).
// Projection only: the walker (colony_controls.js) decides every step; this only remembers the keys it already took.
(function (root) {
  'use strict';
  var KEEP = 6, keys = [];
  // Pure: note(list, key, keep) → the trail after the crab stands on key (a revisit moves the print to the front).
  function note(list, key, keep) {
    if (!key || list[list.length - 1] === key) { return list; }
    var out = list.filter(function (k) { return k !== key; }); out.push(key);
    return out.slice(-(keep || KEEP));
  }
  // Pure: alpha(i, n) → the strength of the i-th print of n (0 = oldest); the crab's own cell (last) is not printed.
  function alpha(i, n) { return n < 2 ? 0 : 0.12 + 0.4 * (i + 1) / n; }
  // draw(g, V, w): called by map_aura.js under the names and the crab.
  function draw(g, V, w) {
    if (!w || !V || !V.world) { return keys; }
    keys = note(keys, w.q + ',' + w.r, KEEP);
    var k = V.G.k, ink = V.H.rgbOf(V.H.T.FRONT_DOOR.cyan), n = keys.length;
    g.save(); g.fillStyle = V.H.css(V.H.shade(ink, 0.7));
    keys.forEach(function (key, i) {
      if (i === n - 1) { return; }
      var q = key.split(','), c = V.world.cells.at[key], h0 = V.P(+q[0], +q[1]), p = V.turn(h0.x, h0.y);
      var x = V.G.cx + p.x * k, y = V.G.cy + p.y * k - (c ? V.height(c) * V.HSTEP : 0) * k, r = Math.max(1.2, 1.9 * k);
      g.globalAlpha = alpha(i, n);
      [-1, 1].forEach(function (s) { for (var j = -1; j <= 1; j++) { g.beginPath(); g.arc(x + j * 6 * k, y + s * 3.2 * k + (j % 2) * k, r, 0, 6.283); g.fill(); } });
    });
    g.restore(); return keys;
  }
  var api = { KEEP: KEEP, note: note, alpha: alpha, draw: draw };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabTrail = api;
})(typeof window !== 'undefined' ? window : globalThis);
