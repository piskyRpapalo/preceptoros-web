// Seam A · shared crab presence, the authority's pure core (Mesa #34, 2026-11-14). NOT served, wired to no network.
// Two visitors see the same crab only if ONE authority accepts each step and both read ITS view. This is that
// authority as a pure reducer, so the law can be proved before any transport exists:
//   - a visit opens with explicit consent and its own ephemeral Ed25519 key (visitor_account.js makes it);
//   - a step is a record «atlas.paso/1» { esquema, dir, seq, prev, clave_publica }, signed by that key, under
//     1,024 B: the same chain shape as atlas.invocacion/2 (seq + hash of the previous record), so a replay, a gap or
//     an altered record is refused;
//   - the visitor never declares where it is: the authority walks the step on the same floor with the same walker
//     (visitor_walk.js) and the accepted coordinates are its own;
//   - the view is what any other visitor may draw: a session id, a cell and a seal (LIVE or STALE), nothing else;
//   - a visit that stops stepping goes STALE and then is forgotten whole, key included: no permanent identity.
// Time is the authority's tick, handed in; how many ticks make STALE or forgotten is the Sovereign's law, also
// handed in: this piece carries no default and refuses to run without it. No clock, no randomness, no network.
(function (root) {
  'use strict';
  var SCHEMA = 'atlas.paso/1', FIELDS = 'clave_publica|dir|esquema|prev|seq', LIMIT = 1024;
  // «I am still here»: a visitor who stands still signs atlas.presente/1 on the SAME chain as its steps, so a beat can
  // be neither replayed nor reordered. law.beat_gap (optional, ticks) is the least time between two accepted beats.
  var BEAT = 'atlas.presente/1', BEAT_FIELDS = 'clave_publica|esquema|prev|seq';
  var KEY = /^[0-9a-f]{64}$/, SIG = /^ed25519:[0-9a-f]{128}$/;

  function bytes(text) { return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text).length : text.length; }
  function no(cause, state) { return { ok: false, cause: cause, state: state }; }
  function tickOk(t) { return Number.isSafeInteger(t) && t >= 0; }
  // law = { stale_after, gone_after, max_visits } in ticks and visits. Missing or malformed → the piece does not run.
  function lawOk(l) {
    return !!l && [l.stale_after, l.gone_after, l.max_visits].every(function (n) { return Number.isSafeInteger(n) && n > 0; }) && l.gone_after > l.stale_after &&
      (l.beat_gap === undefined || (Number.isSafeInteger(l.beat_gap) && l.beat_gap >= 0));
  }
  function need(law) { if (!lawOk(law)) { throw new Error('crab_presence: law_not_signed'); } }

  function empty() { return { visits: {} }; }
  function copy(state) {
    var out = { visits: {} };
    Object.keys(state.visits).forEach(function (k) { var v = state.visits[k]; out.visits[k] = { q: v.q, r: v.r, seq: v.seq, last: v.last, seen: v.seen, id: v.id, beat: v.beat }; });
    return out;
  }
  // forget(state, tick, law) → the state without the visits that have been silent for gone_after ticks. Nothing of
  // them remains: a later step with that key is a visit the authority does not know.
  function forget(state, tick, law) {
    need(law);
    var out = copy(state);
    Object.keys(out.visits).forEach(function (k) { if (tick - out.visits[k].seen >= law.gone_after) { delete out.visits[k]; } });
    return out;
  }

  // open(state, { key, consent, tick, start }, law, deps) → { ok, state } | { ok: false, cause }. deps.digest is
  // async sha-256 as hex; the session id is derived from the ephemeral key and dies with the visit.
  async function open(state, o, law, deps) {
    need(law);
    if (!o || o.consent !== true) { return no('consent_required', state); }
    if (!KEY.test(o.key || '') || !tickOk(o.tick)) { return no('visit_malformed', state); }
    var s = forget(state, o.tick, law);
    if (s.visits[o.key]) { return no('visit_already_open', state); }
    if (Object.keys(s.visits).length >= law.max_visits) { return no('world_full', state); }
    // The cell where a crab joins is the only one it may name, and only if the floor has it: presence is not land.
    var start = o.start || [0, 0];
    if (!Array.isArray(start) || !Number.isSafeInteger(start[0]) || !Number.isSafeInteger(start[1])) { return no('visit_malformed', state); }
    if (o.start && deps.walk.create(deps.cells, start).here().kind === 'NO_DATA') { return no('start_not_on_the_floor', state); }
    s.visits[o.key] = { q: start[0], r: start[1], seq: 0, last: 'genesis', seen: o.tick, beat: null, id: 'crab-' + (await deps.digest('preceptoros.visit/1|' + o.key)).slice(0, 8) };
    return { ok: true, state: s };
  }

  // step(state, { record, signature, tick }, law, deps) → { ok, state, at } | { ok: false, cause }.
  // deps = { verify(keyHex, text, signature) → Promise<boolean>, digest(text) → Promise<hex>, walk, cells }.
  // Order matters: shape, then the chain, then the signature, then the floor. Nothing is written on a refusal.
  async function step(state, m, law, deps) {
    need(law);
    var r = m && m.record;
    var beat = !!r && r.esquema === BEAT;
    if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).sort().join('|') !== (beat ? BEAT_FIELDS : FIELDS) || (!beat && r.esquema !== SCHEMA)) { return no('record_scope_rejected', state); }
    var text = JSON.stringify(r);
    if (bytes(text) >= LIMIT) { return no('record_over_budget', state); }
    if (!KEY.test(r.clave_publica) || !SIG.test(m.signature || '') || !tickOk(m.tick)) { return no('record_malformed', state); }
    var s = forget(state, m.tick, law), v = s.visits[r.clave_publica];
    if (!v) { return no('visit_unknown', state); }
    if (!Number.isSafeInteger(r.seq) || r.seq !== v.seq + 1) { return no(r.seq <= v.seq ? 'replayed_step' : 'step_out_of_order', state); }
    if (r.prev !== v.last) { return no('chain_broken', state); }
    if (!beat && !Object.prototype.hasOwnProperty.call(deps.walk.DIRS, r.dir)) { return no('direction_unknown', state); }
    if (beat && law.beat_gap && v.beat !== null && m.tick - v.beat < law.beat_gap) { return no('beat_too_soon', state); }
    if (await deps.verify(r.clave_publica, text, m.signature) !== true) { return no('signature_rejected', state); }
    if (beat) { v.seq = r.seq; v.last = await deps.digest(text); v.seen = m.tick; v.beat = m.tick; return { ok: true, state: s, at: { q: v.q, r: v.r } }; }
    var walked = deps.walk.create(deps.cells, [v.q, v.r]).step(r.dir);
    if (!walked.ok) { return no('floor_refused', state); } // water, keepout or the end of the map: the same walker says so
    v.q = walked.q; v.r = walked.r; v.seq = r.seq; v.last = await deps.digest(text); v.seen = m.tick;
    return { ok: true, state: s, at: { q: v.q, r: v.r } };
  }

  function dist(a, b) { var dq = b.q - a.q, dr = b.r - a.r; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // view(state, tick, law, around) → { esquema, tick, crabs: [{ id, q, r, seal }], more? }, forgotten visits gone.
  // No key, no sequence, no hash leaves the authority.
  //   without `around`: every crab, sorted by id; it must fit one frame or the piece throws (small worlds, the cases).
  //   with around = { q, r, radius }: the crabs within `radius` hexes of that cell, nearest first, and as many as fit
  //   one frame; `more` counts the ones in the region that did not fit. The frame is never made bigger: a crowded
  //   place is read region by region.
  function view(state, tick, law, around) {
    need(law);
    var s = forget(state, tick, law);
    var crabs = Object.keys(s.visits).map(function (k) {
      var v = s.visits[k];
      return { id: v.id, q: v.q, r: v.r, seal: tick - v.seen >= law.stale_after ? 'STALE' : 'LIVE' };
    });
    var byId = function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; };
    if (!around) {
      var all = { esquema: 'atlas.presencia/1', tick: tick, crabs: crabs.sort(byId) };
      if (bytes(JSON.stringify(all)) >= LIMIT) { throw new Error('crab_presence: view_over_budget'); }
      return all;
    }
    if (!Number.isSafeInteger(around.q) || !Number.isSafeInteger(around.r) || !Number.isSafeInteger(around.radius) || around.radius < 0) { throw new Error('crab_presence: region_malformed'); }
    var near = crabs.filter(function (c) { return dist(around, c) <= around.radius; })
      .sort(function (a, b) { return dist(around, a) - dist(around, b) || byId(a, b); });
    var out = { esquema: 'atlas.presencia/1', tick: tick, crabs: [], more: near.length }, i;
    for (i = 0; i < near.length; i++) {
      out.crabs.push(near[i]); out.more = near.length - out.crabs.length;
      if (bytes(JSON.stringify(out)) >= LIMIT) { out.crabs.pop(); out.more = near.length - out.crabs.length; break; }
    }
    if (!out.more) { delete out.more; }
    return out;
  }

  var api = { SCHEMA: SCHEMA, BEAT: BEAT, LIMIT: LIMIT, empty: empty, open: open, step: step, view: view, forget: forget, lawOk: lawOk };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasCrabPresence = api; }
})(this);
