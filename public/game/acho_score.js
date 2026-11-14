// Acho score · one event, one score, every reader (Mesa #34, ROUND 5). Pure: no clock, no randomness, no DOM.
// An event the world accepted or refused becomes a SCORE: what the eye, the ear, the camera and a machine are given
// at any instant t. Nothing here decides what happened; the status comes with the event and the score obeys it.
//   event(e)        → { ok, event } | { ok: false, cause }     the envelope «acho.event/1», checked field by field
//   lit(ev, source) → the envelope of the authority's lighting event (the beacon two crabs lit together)
//   refused(kind, cause, id, source) / asked(ask, source) → the envelopes of a refusal and of an open request
//   score(event)    → { v, id, kind, status, seal, light, dur, waves, caption, ... }
//   at(score, t)    → { t, done, lamp, ring, dim, mark, sparks, focus }   t in milliseconds since the event was seen
//   rest(score)     → the sample to hold when nothing may move (reduced motion, or after the score ended)
// Laws, kept by construction and checked by the cases:
//   1. LIGHT IS A TYPE. Only an event that is `accepted` and comes from the `authority` (or a `fixture`, sealed
//      SIMULATED in every sample) gets a lamp, a ring and sparks. A refusal has its own score: the place dims, one
//      falling pair of notes, never light. A pending request is an outline, never light.
//   2. THE SEED IS THE EVENT ID. Two devices that hold the same event compute the same score without talking.
//   3. TIME IS AN ARGUMENT. at(score, t) is a closed form: 15, 30 or 60 frames a second sample the same curve, and a
//      film may ask for any instant in any order.
//   4. THE SOUND IS THE HOUSE'S SOUND. `waves` are harmonic tables for acho_sonify.js; no new synthesiser.
// Units: distances in hex widths around `where`; lamp, dim and alpha in [0, 1]. Numbers are rounded to 1e-4 so two
// engines agree to the last printed digit.
(function (root) {
  'use strict';
  var M = (typeof module === 'object' && module.exports) ? require('./acho_math.js') : root.AtlasAchoMath;
  var V_EVENT = 'acho.event/1', V_SCORE = 'acho.score/1';
  var STATUS = ['accepted', 'refused', 'pending', 'stale'], SOURCES = ['authority', 'local', 'fixture'];
  var SEAL = { authority: 'LIVE', fixture: 'SIMULATED', local: 'LOCAL' };
  var KIND = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/;
  // Three rising notes (the chord crab_presence_acho.js already plays for the lit beacon), and a falling pair.
  var RISE = [[[1, 1, 0, 0], [6, 2, 0, 0], [2, 1, 1, 0]], [[1, 1, 0, 0], [8, 2, 0, 0], [2, 1, 1, 0]], [[1, 1, 0, 0], [10, 2, 0, 0], [2, 1, 1, 0]]];
  var FALL = [[[1, 1, 0, 0], [5, 2, 0, 0]], [[1, 1, 0, 0], [3, 2, 0, 0]]];
  var SPARKS = 12, RING = 4;   // sparks per lighting (≤ 24 by budget); how many hexes the ring travels

  function r4(x) { return Math.round(x * 10000) / 10000; }
  function event(e) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) { return { ok: false, cause: 'event_not_an_object' }; }
    if (typeof e.id !== 'string' || !e.id || e.id.length > 96) { return { ok: false, cause: 'event_without_id' }; }
    if (typeof e.kind !== 'string' || !KIND.test(e.kind)) { return { ok: false, cause: 'event_kind_unreadable' }; }
    if (STATUS.indexOf(e.status) < 0) { return { ok: false, cause: 'event_status_unknown' }; }
    if (SOURCES.indexOf(e.source) < 0) { return { ok: false, cause: 'event_source_unknown' }; }
    var who = e.who === undefined ? [] : e.who;
    if (!Array.isArray(who) || who.length > 8 || who.some(function (w) { return typeof w !== 'string' || !w; })) { return { ok: false, cause: 'event_who_unreadable' }; }
    var where = e.where === undefined || e.where === null ? null : e.where;
    if (where && (!Number.isSafeInteger(where.q) || !Number.isSafeInteger(where.r))) { return { ok: false, cause: 'event_where_unreadable' }; }
    if (e.status === 'refused' && (typeof e.cause !== 'string' || !e.cause)) { return { ok: false, cause: 'refusal_without_cause' }; }
    var out = { v: V_EVENT, id: e.id, kind: e.kind, status: e.status, source: e.source, who: who.slice(), where: where ? { q: where.q, r: where.r } : null };
    if (Number.isSafeInteger(e.seq)) { out.seq = e.seq; }
    if (typeof e.cause === 'string' && e.cause) { out.cause = e.cause.slice(0, 80); }
    return { ok: true, event: out };
  }
  function lit(ev, source) {
    return { v: V_EVENT, id: String(ev && ev.id || ''), kind: 'coop.beacon_lit', status: 'accepted', source: source || 'authority',
      who: ev && Array.isArray(ev.who) ? ev.who.slice() : [], where: ev && Array.isArray(ev.cell) ? { q: ev.cell[0], r: ev.cell[1] } : null, seq: ev ? ev.tick : undefined };
  }
  function refused(kind, cause, id, source, where) {
    return { v: V_EVENT, id: String(id || ''), kind: kind, status: 'refused', source: source || 'authority', who: [], where: where || null, cause: String(cause || 'refused') };
  }
  function asked(ask, source, where) {
    return { v: V_EVENT, id: String(ask && ask.id || ''), kind: 'coop.ask', status: 'pending', source: source || 'authority', who: ask ? [ask.from, ask.to] : [], where: where || null };
  }
  function caption(e) {
    var who = e.who.length === 2 ? e.who[0] + ' and ' + e.who[1] : e.who.join(', ');
    if (e.status === 'refused') { return 'Refused · ' + e.cause.replace(/_/g, ' ') + ' · nothing was lit'; }
    if (e.status === 'stale') { return 'No longer current · ' + e.kind; }
    if (e.kind === 'coop.ask') { return who ? e.who[0] + ' asks ' + e.who[1] + ' to light the beacon together' : 'A request to light the beacon waits'; }
    if (e.kind === 'coop.beacon_lit') { return 'The beacon is lit' + (who ? ': ' + who + ' lit it together' : ''); }
    return e.kind + ' · ' + e.status;
  }
  function score(input) {
    var c = event(input);
    if (!c.ok) { return { ok: false, cause: c.cause }; }
    var e = c.event, seal = SEAL[e.source], bright = e.status === 'accepted' && (e.source === 'authority' || e.source === 'fixture');
    var s = { ok: true, v: V_SCORE, id: e.id, kind: e.kind, status: e.status, seal: seal, where: e.where, seed: M.hash(e.id), light: false, dur: 0, waves: [], shape: 'none',
      caption: caption(e) + (seal === 'SIMULATED' ? ' · SIMULATED' : '') };
    if (e.status === 'refused') { s.shape = 'refusal'; s.dur = 520; s.waves = FALL; }
    else if (e.status === 'pending') { s.shape = 'request'; s.dur = 900; }
    else if (e.status === 'stale') { s.shape = 'none'; }
    else if (bright && e.kind === 'coop.beacon_lit') { s.shape = 'beacon'; s.light = true; s.dur = 1600; s.waves = RISE; }
    else if (bright) { s.shape = 'pulse'; s.light = true; s.dur = 700; }
    else { s.shape = 'request'; s.dur = 600; }   // accepted on this device only: an outline, never a lamp
    return s;
  }
  var RING_R = M.track([[0, 0], [300, 1.6], [900, 3.4], [1400, RING]]), RING_A = M.track([[0, 0], [120, 0.9], [900, 0.5], [1400, 0]]);
  var ZOOM = M.track([[0, 1], [500, 1.12], [1600, 1.04]]), DIM = M.track([[0, 0], [140, 0.4], [520, 0]]);
  var PULSE_R = M.track([[0, 0], [700, 1.5]]), PULSE_A = M.track([[0, 0.8], [700, 0]]);
  function sparks(s, t) {
    var out = [], sec = t / 1000;
    for (var i = 0; i < SPARKS; i++) {
      var a = (i + M.rand(s.seed, i)) / SPARKS * Math.PI * 2, v = 2.2 + 1.6 * M.rand(s.seed, 100 + i), life = 0.9 + 0.5 * M.rand(s.seed, 200 + i);
      if (sec >= life) { continue; }
      var p = M.particle(sec, { x: 0, y: -0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, drag: 3, g: 2.4 });
      out.push({ x: r4(p.x), y: r4(p.y), a: r4(1 - M.smooth(sec / life)) });
    }
    return out;
  }
  function at(s, t) {
    var tt = isFinite(t) ? Number(t) : 0, ms = M.clamp(tt, 0, s.dur), done = tt >= s.dur;
    var o = { t: r4(ms), done: done, seal: s.seal, lamp: 0, ring: null, dim: 0, mark: 0, sparks: [], focus: s.where ? { q: s.where.q, r: s.where.r, zoom: 1 } : null };
    if (s.shape === 'beacon') {
      o.lamp = r4(M.clamp(M.spring(ms / 1000, 0.45, 14), 0, 1));
      if (!done) { o.ring = { r: r4(RING_R(ms)), a: r4(RING_A(ms)) }; o.sparks = sparks(s, ms); }
      else { o.lamp = 1; }
      if (o.focus) { o.focus.zoom = r4(ZOOM(ms)); }
    } else if (s.shape === 'pulse') {
      if (!done) { o.ring = { r: r4(PULSE_R(ms)), a: r4(PULSE_A(ms)) }; }
    } else if (s.shape === 'refusal') {
      o.dim = r4(DIM(ms));
    } else if (s.shape === 'request') {
      o.mark = done ? 1 : r4(0.55 + 0.45 * M.smooth(ms / s.dur));
    }
    return o;
  }
  function rest(s) { return at(s, s.dur); }
  var api = { V_EVENT: V_EVENT, V_SCORE: V_SCORE, STATUS: STATUS, SOURCES: SOURCES, SPARKS: SPARKS, RING: RING, event: event, lit: lit, refused: refused, asked: asked, score: score, at: at, rest: rest };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasAchoScore = api;
})(typeof globalThis === 'object' ? globalThis : this);
