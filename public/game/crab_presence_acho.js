// Seam A · many crabs in Acho (Mesa #34). Loaded only by shared_crabs.js after the visitor's consent. One view of the authority becomes ONE event with the same
// meaning for eye, ear, screen reader and machine, reusing state_frames.js and acho_sonify.js: no new renderer, no
// new sound. For someone who cannot see the map this is the map: who is here, how far, which way, and whether the
// authority still hears them.
//   describe(view, me, F, before) → { ok, line, frame, others: [{ id, seal, distance, way }], news } | { ok: false, cause }
// `before` is the `others` of the last view: with it the line also says who arrived, who came nearer or went
// farther, who fell silent and who is gone, so a change is heard and read, never only seen.
// `heard` is the list of event ids already said: a meeting or the lit beacon (the authority's events, in the view) is
// said ONCE, by its own id, with the same words for both crabs except for who «you» is. An ask to light the beacon
// is said while it waits. The beacon's event sounds as three rising notes before the crabs' own notes.
// The line names the nearest crabs first and counts the rest. Each named crab is one wave: a nearer crab is a higher
// note, a STALE crab is a duller one (no upper harmonic). Pure: no clock, no randomness, no network.
(function (root) {
  'use strict';
  var WAYS = [['east', 1, 0], ['north-east', 1, -1], ['north-west', 0, -1], ['west', -1, 0], ['south-west', -1, 1], ['south-east', 0, 1]];
  var NAMED = 3, AUDIO_RANGE = 8; // crabs said by name; hexes beyond which the note stops falling
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
    var h = [[1, 1, 0, 0], [4 + (AUDIO_RANGE - Math.min(AUDIO_RANGE, o.distance)), 2, 0, 0]];
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
  var CHORD = [[[1, 1, 0, 0], [6, 2, 0, 0], [2, 1, 1, 0]], [[1, 1, 0, 0], [8, 2, 0, 0], [2, 1, 1, 0]], [[1, 1, 0, 0], [10, 2, 0, 0], [2, 1, 1, 0]]];
  function name(id, me) { return id === me ? 'you' : id; }
  function pairOf(who, me) { var w = who.slice().sort(function (a, b) { return (a === me ? 0 : 1) - (b === me ? 0 : 1) || (a < b ? -1 : 1); }); return name(w[0], me) + ' and ' + name(w[1], me); }
  // told(view, me, heard) → { lines, ids, lit }: what the authority's events and asks say to this crab.
  function told(view, me, heard) {
    var lines = [], ids = [], lit = false, done = Array.isArray(heard) ? heard : [];
    (Array.isArray(view.events) ? view.events : []).forEach(function (e) {
      if (!e || done.indexOf(e.id) >= 0 || !Array.isArray(e.who) || e.who.length !== 2) { return; }
      if (e.k === 'meet') { lines.push(e.who.indexOf(me) >= 0 ? 'You met ' + (e.who[0] === me ? e.who[1] : e.who[0]) : e.who[0] + ' met ' + e.who[1]); ids.push(e.id); }
      if (e.k === 'faro') { lines.push('The beacon is lit: ' + pairOf(e.who, me) + ' lit it together'); ids.push(e.id); lit = true; }
    });
    (Array.isArray(view.asks) ? view.asks : []).forEach(function (a) {
      if (a.to === me) { lines.push(a.from + ' asks you to light the beacon together'); }
      else if (a.from === me) { lines.push('You asked ' + a.to + ' · waiting for their yes'); }
    });
    return { lines: lines, ids: ids, lit: lit };
  }
  function describe(view, me, F, before, heard) {
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
    var changed = news(before, others), hidden = (view.more ? ' · ' + view.more + ' more beyond this frame' : '') + (view.lit ? ' · the beacon is lit' : '');
    var t = told(view, me, heard), first = t.lines.concat(changed.slice(0, NAMED));
    var line = (first.length ? first.join('; ') + ' · ' : '') + 'You at ' + self.q + ', ' + self.r + ' · ' + (others.length ? others.length + (others.length === 1 ? ' other crab' : ' other crabs') + ' · ' + said.join('; ') + (rest > 0 ? '; and ' + rest + ' more' : '') : 'no other crab in sight') + hidden;
    var waves = (t.lit ? CHORD : []).concat(others.slice(0, t.lit ? 1 : NAMED).map(wave));
    var frame = F.stateFrame({ id: 'presence/' + me, sentence: line, waves: waves });
    // The syllable is never made bigger: a line too long for one frame keeps the authority's events and drops the notes.
    if (F.valida(frame).length) { frame = F.stateFrame({ id: 'presence/' + me, sentence: line, waves: t.lit ? CHORD : [] }); }
    if (F.valida(frame).length) { // still too long: the authority's events first, then where you are and how many; the names wait
      line = t.lines.slice(-2).join('; ') + (t.lines.length ? ' · ' : '') + 'You at ' + self.q + ', ' + self.r + ' · ' + others.length + ' other crabs' + hidden;
      frame = F.stateFrame({ id: 'presence/' + me, sentence: line, waves: [] });
    }
    if (F.valida(frame).length) { return { ok: false, cause: 'frame_breaks_the_law' }; }
    return { ok: true, line: line, frame: frame, others: others, news: changed, events: t.ids, lit: !!view.lit };
  }
  // beaconEvents(view) → the authority's lightings in this view, as it sent them: the one door for the beacon layer.
  function beaconEvents(view) {
    return (view && Array.isArray(view.events) ? view.events : []).filter(function (e) { return e && e.k === 'faro' && typeof e.id === 'string' && Array.isArray(e.who) && e.who.length === 2 && Array.isArray(e.cell); });
  }
  var api = { NAMED: NAMED, distance: distance, way: way, news: news, told: told, describe: describe, beaconEvents: beaconEvents };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabPresenceAcho = api;
})(typeof globalThis === 'object' ? globalThis : this);
