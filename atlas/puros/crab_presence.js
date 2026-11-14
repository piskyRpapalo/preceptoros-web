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
  var KEY = /^[0-9a-f]{64}$/, SIG = /^ed25519:[0-9a-f]{128}$/;

  function bytes(text) { return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text).length : text.length; }
  function no(cause, state) { return { ok: false, cause: cause, state: state }; }
  function tickOk(t) { return Number.isSafeInteger(t) && t >= 0; }
  // law = { stale_after, gone_after, max_visits } in ticks and visits. Missing or malformed → the piece does not run.
  function lawOk(l) {
    return !!l && [l.stale_after, l.gone_after, l.max_visits].every(function (n) { return Number.isSafeInteger(n) && n > 0; }) && l.gone_after > l.stale_after;
  }
  function need(law) { if (!lawOk(law)) { throw new Error('crab_presence: law_not_signed'); } }

  function empty() { return { visits: {} }; }
  function copy(state) {
    var out = { visits: {} };
    Object.keys(state.visits).forEach(function (k) { var v = state.visits[k]; out.visits[k] = { q: v.q, r: v.r, seq: v.seq, last: v.last, seen: v.seen, id: v.id }; });
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
    var start = o.start || [0, 0];
    if (!Number.isSafeInteger(start[0]) || !Number.isSafeInteger(start[1])) { return no('visit_malformed', state); }
    s.visits[o.key] = { q: start[0], r: start[1], seq: 0, last: 'genesis', seen: o.tick, id: 'crab-' + (await deps.digest('preceptoros.visit/1|' + o.key)).slice(0, 8) };
    return { ok: true, state: s };
  }

  // step(state, { record, signature, tick }, law, deps) → { ok, state, at } | { ok: false, cause }.
  // deps = { verify(keyHex, text, signature) → Promise<boolean>, digest(text) → Promise<hex>, walk, cells }.
  // Order matters: shape, then the chain, then the signature, then the floor. Nothing is written on a refusal.
  async function step(state, m, law, deps) {
    need(law);
    var r = m && m.record;
    if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).sort().join('|') !== FIELDS || r.esquema !== SCHEMA) { return no('record_scope_rejected', state); }
    var text = JSON.stringify(r);
    if (bytes(text) >= LIMIT) { return no('record_over_budget', state); }
    if (!KEY.test(r.clave_publica) || !SIG.test(m.signature || '') || !tickOk(m.tick)) { return no('record_malformed', state); }
    var s = forget(state, m.tick, law), v = s.visits[r.clave_publica];
    if (!v) { return no('visit_unknown', state); }
    if (!Number.isSafeInteger(r.seq) || r.seq !== v.seq + 1) { return no(r.seq <= v.seq ? 'replayed_step' : 'step_out_of_order', state); }
    if (r.prev !== v.last) { return no('chain_broken', state); }
    if (!Object.prototype.hasOwnProperty.call(deps.walk.DIRS, r.dir)) { return no('direction_unknown', state); }
    if (await deps.verify(r.clave_publica, text, m.signature) !== true) { return no('signature_rejected', state); }
    var walked = deps.walk.create(deps.cells, [v.q, v.r]).step(r.dir);
    if (!walked.ok) { return no('floor_refused', state); } // water, keepout or the end of the map: the same walker says so
    v.q = walked.q; v.r = walked.r; v.seq = r.seq; v.last = await deps.digest(text); v.seen = m.tick;
    return { ok: true, state: s, at: { q: v.q, r: v.r } };
  }

  // view(state, tick, law) → { esquema, tick, crabs: [{ id, q, r, seal }] }, sorted by id, forgotten visits gone.
  // No key, no sequence, no hash leaves the authority. It always fits one frame (max_visits is checked for that).
  function view(state, tick, law) {
    need(law);
    var s = forget(state, tick, law);
    var crabs = Object.keys(s.visits).map(function (k) {
      var v = s.visits[k];
      return { id: v.id, q: v.q, r: v.r, seal: tick - v.seen >= law.stale_after ? 'STALE' : 'LIVE' };
    }).sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    var out = { esquema: 'atlas.presencia/1', tick: tick, crabs: crabs };
    if (bytes(JSON.stringify(out)) >= LIMIT) { throw new Error('crab_presence: view_over_budget'); }
    return out;
  }

  var api = { SCHEMA: SCHEMA, LIMIT: LIMIT, empty: empty, open: open, step: step, view: view, forget: forget, lawOk: lawOk };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasCrabPresence = api; }
})(this);
