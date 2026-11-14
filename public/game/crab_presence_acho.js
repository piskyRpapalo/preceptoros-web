// Seam A · many crabs in Acho (Mesa #34). Loaded only by shared_crabs.js after the visitor's consent. One view of the authority becomes ONE event with the same
// meaning for eye, ear, screen reader and machine, reusing state_frames.js and acho_sonify.js: no new renderer, no
// new sound. For someone who cannot see the map this is the map: who is here, how far, which way, and whether the
// authority still hears them.
//   describe(view, me, F, before) → { ok, line, frame, others: [{ id, seal, distance, way }], news } | { ok: false, cause }
// `before` is the `others` of the last view: with it the line also says who arrived, who came nearer or went
// farther, who fell silent and who is gone, so a change is heard and read, never only seen.
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
  // news(before, now) → ['crab-x arrived', 'crab-y nearer', 'crab-z farther', 'crab-w silent', 'crab-v gone'], by id.
  function news(before, now) {
    if (!Array.isArray(before)) { return []; }
    var was = {}, is = {}, out = [];
    before.forEach(function (o) { was[o.id] = o; }); now.forEach(function (o) { is[o.id] = o; });
    Object.keys(is).sort().forEach(function (id) {
      var a = was[id], b = is[id];
      if (!a) { out.push(id + ' arrived'); return; }
      if (b.distance !== a.distance) { out.push(id + (b.distance < a.distance ? ' nearer' : ' farther')); }
      if (a.seal === 'LIVE' && b.seal === 'STALE') { out.push(id + ' silent'); }
      if (a.seal === 'STALE' && b.seal === 'LIVE') { out.push(id + ' back'); }
    });
    Object.keys(was).sort().forEach(function (id) { if (!is[id]) { out.push(id + ' gone'); } });
    return out;
  }
  function describe(view, me, F, before) {
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
    var changed = news(before, others), hidden = view.more ? ' · ' + view.more + ' more beyond this frame' : '';
    var line = (changed.length ? changed.slice(0, NAMED).join('; ') + ' · ' : '') + 'You at ' + self.q + ', ' + self.r + ' · ' + (others.length ? others.length + (others.length === 1 ? ' other crab' : ' other crabs') + ' · ' + said.join('; ') + (rest > 0 ? '; and ' + rest + ' more' : '') : 'no other crab in sight') + hidden;
    var frame = F.stateFrame({ id: 'presence/' + me, sentence: line, waves: others.slice(0, NAMED).map(wave) });
    if (F.valida(frame).length) { return { ok: false, cause: 'frame_breaks_the_law' }; }
    return { ok: true, line: line, frame: frame, others: others, news: changed };
  }
  var api = { NAMED: NAMED, distance: distance, way: way, news: news, describe: describe };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabPresenceAcho = api;
})(typeof globalThis === 'object' ? globalThis : this);
