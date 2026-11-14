// Seam A · many crabs in Acho (Mesa #34). NOT served. One view of the authority becomes ONE event with the same
// meaning for eye, ear, screen reader and machine, reusing state_frames.js and acho_sonify.js: no new renderer, no
// new sound. For someone who cannot see the map this is the map: who is here, how far, which way, and whether the
// authority still hears them.
//   describe(view, me, F) → { ok, line, frame, others: [{ id, seal, distance, way }] } | { ok: false, cause }
// The line names the nearest crabs first and counts the rest. Each named crab is one wave: a nearer crab is a higher
// note, a STALE crab is a duller one (no upper harmonic). Pure: no clock, no randomness, no network.
(function (root) {
  'use strict';
  var WAYS = [['east', 1, 0], ['north-east', 1, -1], ['north-west', 0, -1], ['west', -1, 0], ['south-west', -1, 1], ['south-east', 0, 1]];
  var NAMED = 3, NEAR = 8; // crabs said by name; hexes beyond which the note stops falling
  function distance(a, b) { var dq = b.q - a.q, dr = b.r - a.r; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // way(a, b) → the one of the six walking directions that points most nearly from a to b; 'here' on the same cell.
  function way(a, b) {
    var dq = b.q - a.q, dr = b.r - a.r;
    if (!dq && !dr) { return 'here'; }
    var x = dq + dr / 2, y = dr * 0.8660254, best = null, top = -Infinity;
    WAYS.forEach(function (w) { var wx = w[1] + w[2] / 2, wy = w[2] * 0.8660254, d = (x * wx + y * wy) / Math.sqrt(wx * wx + wy * wy); if (d > top) { top = d; best = w[0]; } });
    return best;
  }
  function wave(o) {
    var h = [[1, 1, 0, 0], [4 + (NEAR - Math.min(NEAR, o.distance)), 2, 0, 0]];
    if (o.seal === 'LIVE') { h.push([2, 1, 1, 0]); }
    return h;
  }
  function describe(view, me, F) {
    if (!view || view.esquema !== 'atlas.presencia/1' || !Array.isArray(view.crabs)) { return { ok: false, cause: 'view_not_readable' }; }
    var self = view.crabs.filter(function (c) { return c.id === me; })[0];
    if (!self) { return { ok: false, cause: 'you_are_not_in_this_view' }; }
    var others = view.crabs.filter(function (c) { return c.id !== me; }).map(function (c) {
      return { id: c.id, seal: c.seal, distance: distance(self, c), way: way(self, c) };
    }).sort(function (a, b) { return a.distance - b.distance || (a.id < b.id ? -1 : 1); });
    var said = others.slice(0, NAMED).map(function (o) {
      return o.id + ' ' + o.seal + (o.way === 'here' ? ' on your hex' : ' ' + o.distance + (o.distance === 1 ? ' hex ' : ' hexes ') + o.way);
    });
    var rest = others.length - said.length;
    var line = 'You at ' + self.q + ', ' + self.r + ' · ' + (others.length ? others.length + (others.length === 1 ? ' other crab' : ' other crabs') + ' · ' + said.join('; ') + (rest > 0 ? '; and ' + rest + ' more' : '') : 'no other crab in sight');
    var frame = F.stateFrame({ id: 'presence/' + me, sentence: line, waves: others.slice(0, NAMED).map(wave) });
    if (F.valida(frame).length) { return { ok: false, cause: 'frame_breaks_the_law' }; }
    return { ok: true, line: line, frame: frame, others: others };
  }
  var api = { NAMED: NAMED, distance: distance, way: way, describe: describe };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasCrabPresenceAcho = api; }
})(this);
