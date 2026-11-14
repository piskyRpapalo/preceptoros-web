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
  // COOP-01 · two crabs do one thing together (Mesa #34, round 4). An EXPERIMENT: it makes no copper, claims no land
  // and grants nothing; it only proves that one authority can turn two signed decisions into ONE event.
  //   a meeting   two LIVE crabs within law.meet_radius hexes: the authority says so once, until they part
  //   atlas.coop/1     { accion: 'faro', con: <the other crab's id> }  A asks B to light the beacon together
  //   atlas.coop_si/1  { peticion: <the ask's id> }                    B, and only B, says yes
  // Both are signed on the same chain as steps and beats. The beacon (deps.beacon, a cell of the map) is lit ONCE,
  // when both stand within law.coop_radius of it, both are LIVE, and the yes arrives within law.coop_wait ticks.
  var ASK = 'atlas.coop/1', ASK_FIELDS = 'accion|clave_publica|con|esquema|prev|seq';
  var YES = 'atlas.coop_si/1', YES_FIELDS = 'clave_publica|esquema|peticion|prev|seq';
  var SHAPES = {}; SHAPES[SCHEMA] = FIELDS; SHAPES[BEAT] = BEAT_FIELDS; SHAPES[ASK] = ASK_FIELDS; SHAPES[YES] = YES_FIELDS;
  var CRAB = /^crab-[0-9a-f]{8}$/, ASKID = /^ask-[0-9a-f]{8}$/, KEPT = 3; // events kept for the views
  var KEY = /^[0-9a-f]{64}$/, SIG = /^ed25519:[0-9a-f]{128}$/;

  function bytes(text) { return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text).length : text.length; }
  function no(cause, state) { return { ok: false, cause: cause, state: state }; }
  function tickOk(t) { return Number.isSafeInteger(t) && t >= 0; }
  // law = { stale_after, gone_after, max_visits } in ticks and visits. Missing or malformed → the piece does not run.
  function lawOk(l) {
    return !!l && [l.stale_after, l.gone_after, l.max_visits].every(function (n) { return Number.isSafeInteger(n) && n > 0; }) && l.gone_after > l.stale_after &&
      (l.beat_gap === undefined || (Number.isSafeInteger(l.beat_gap) && l.beat_gap >= 0)) &&
      ['meet_radius', 'coop_radius', 'coop_wait'].every(function (k) { return l[k] === undefined || (Number.isSafeInteger(l[k]) && l[k] >= 0); });
  }
  function need(law) { if (!lawOk(law)) { throw new Error('crab_presence: law_not_signed'); } }

  function empty() { return { visits: {}, events: [], near: {}, asks: {}, lit: null, n: 0 }; }
  function copy(state) {
    var out = { visits: {}, events: (state.events || []).slice(), near: Object.assign({}, state.near), asks: Object.assign({}, state.asks), lit: state.lit || null, n: state.n || 0 };
    Object.keys(state.visits).forEach(function (k) { var v = state.visits[k]; out.visits[k] = { q: v.q, r: v.r, seq: v.seq, last: v.last, seen: v.seen, id: v.id, beat: v.beat }; });
    return out;
  }
  // forget(state, tick, law) → the state without the visits that have been silent for gone_after ticks. Nothing of
  // them remains: a later step with that key is a visit the authority does not know.
  function forget(state, tick, law) {
    need(law);
    var out = copy(state);
    Object.keys(out.visits).forEach(function (k) { if (tick - out.visits[k].seen >= law.gone_after) { delete out.visits[k]; } });
    // An ask dies with its time, or with either of its two crabs: a cooperation is never finished by a ghost.
    var alive = {}; Object.keys(out.visits).forEach(function (k) { alive[out.visits[k].id] = 1; });
    Object.keys(out.asks).forEach(function (id) { var a = out.asks[id]; if (!alive[a.from] || !alive[a.to] || (law.coop_wait !== undefined && tick - a.tick > law.coop_wait)) { delete out.asks[id]; } });
    Object.keys(out.near).forEach(function (pair) { var w = pair.split('+'); if (!alive[w[0]] || !alive[w[1]]) { delete out.near[pair]; } });
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
    var beat = !!r && r.esquema === BEAT, ask = !!r && r.esquema === ASK, yes = !!r && r.esquema === YES;
    if (!r || typeof r !== 'object' || Array.isArray(r) || !Object.prototype.hasOwnProperty.call(SHAPES, r.esquema) || Object.keys(r).sort().join('|') !== SHAPES[r.esquema]) { return no('record_scope_rejected', state); }
    if (ask && (r.accion !== 'faro' || !CRAB.test(r.con || ''))) { return no('record_scope_rejected', state); }
    if (yes && !ASKID.test(r.peticion || '')) { return no('record_scope_rejected', state); }
    var text = JSON.stringify(r);
    if (bytes(text) >= LIMIT) { return no('record_over_budget', state); }
    if (!KEY.test(r.clave_publica) || !SIG.test(m.signature || '') || !tickOk(m.tick)) { return no('record_malformed', state); }
    var s = forget(state, m.tick, law), v = s.visits[r.clave_publica];
    if (!v) { return no('visit_unknown', state); }
    if (!Number.isSafeInteger(r.seq) || r.seq !== v.seq + 1) { return no(r.seq <= v.seq ? 'replayed_step' : 'step_out_of_order', state); }
    if (r.prev !== v.last) { return no('chain_broken', state); }
    if (!beat && !ask && !yes && !Object.prototype.hasOwnProperty.call(deps.walk.DIRS, r.dir)) { return no('direction_unknown', state); }
    if (beat && law.beat_gap && v.beat !== null && m.tick - v.beat < law.beat_gap) { return no('beat_too_soon', state); }
    if (await deps.verify(r.clave_publica, text, m.signature) !== true) { return no('signature_rejected', state); }
    if (beat) { v.seq = r.seq; v.last = await deps.digest(text); v.seen = m.tick; v.beat = m.tick; return { ok: true, state: s, at: { q: v.q, r: v.r } }; }
    if (ask || yes) {
      var c = await coop(s, v, r, text, m.tick, law, deps, ask);
      if (!c.ok) { return no(c.cause, state); }
      v.seq = r.seq; v.last = await deps.digest(text); v.seen = m.tick;
      return ask ? { ok: true, state: s, at: { q: v.q, r: v.r }, ask: c.ask } : { ok: true, state: s, at: { q: v.q, r: v.r }, event: c.event };
    }
    var walked = deps.walk.create(deps.cells, [v.q, v.r]).step(r.dir);
    if (!walked.ok) { return no('floor_refused', state); } // water, keepout or the end of the map: the same walker says so
    v.q = walked.q; v.r = walked.r; v.seq = r.seq; v.last = await deps.digest(text); v.seen = m.tick;
    var met = await meetings(s, v, m.tick, law, deps);
    return met.length ? { ok: true, state: s, at: { q: v.q, r: v.r }, met: met } : { ok: true, state: s, at: { q: v.q, r: v.r } };
  }

  function live(v, tick, law) { return tick - v.seen < law.stale_after; }
  function byId(s, id) { var out = null; Object.keys(s.visits).forEach(function (k) { if (s.visits[k].id === id) { out = s.visits[k]; } }); return out; }
  async function record(s, e, deps) {
    e.n = ++s.n; e.id = 'ev-' + (await deps.digest(JSON.stringify(e))).slice(0, 8);
    s.events.push(e); if (s.events.length > KEPT) { s.events.shift(); }
    return e;
  }
  // meetings(s, mover, tick, law, deps) → the events made by this step. Two LIVE crabs within meet_radius meet ONCE;
  // the pair is armed again only after they part. Without meet_radius in the law nothing is ever said to have met.
  async function meetings(s, v, tick, law, deps) {
    var out = [];
    if (law.meet_radius === undefined) { return out; }
    var keys = Object.keys(s.visits).sort(), i;
    for (i = 0; i < keys.length; i++) {
      var o = s.visits[keys[i]];
      if (o === v) { continue; }
      var pair = [v.id, o.id].sort().join('+'), d = dist(v, o);
      if (d > law.meet_radius) { delete s.near[pair]; continue; }
      if (s.near[pair] || !live(o, tick, law)) { continue; }
      s.near[pair] = 1;
      out.push(await record(s, { k: 'meet', who: [v.id, o.id].sort(), d: d, tick: tick }, deps));
    }
    return out;
  }
  // coop(...) → { ok, ask } for a request, { ok, event } for the yes that lights the beacon, or { ok: false, cause }.
  // Every check is the authority's: who asks, who answers, where both stand, whether both are still heard, and when.
  async function coop(s, v, r, text, tick, law, deps, ask) {
    var b = deps.beacon;
    if (law.coop_radius === undefined || law.coop_wait === undefined || !b || !Number.isSafeInteger(b.q) || !Number.isSafeInteger(b.r)) { return { ok: false, cause: 'coop_not_in_this_law' }; }
    if (s.lit) { return { ok: false, cause: 'already_lit' }; }
    if (ask) {
      var o = byId(s, r.con);
      if (!o) { return { ok: false, cause: 'partner_unknown' }; }
      if (o === v) { return { ok: false, cause: 'not_the_partner' }; }
      if (!live(o, tick, law)) { return { ok: false, cause: 'partner_silent' }; }
      if (dist(v, b) > law.coop_radius) { return { ok: false, cause: 'too_far_from_the_beacon' }; }
      if (dist(o, b) > law.coop_radius) { return { ok: false, cause: 'partner_too_far' }; }
      Object.keys(s.asks).forEach(function (id) { if (s.asks[id].from === v.id) { delete s.asks[id]; } }); // one open ask per crab
      var id = 'ask-' + (await deps.digest(text)).slice(0, 8);
      s.asks[id] = { from: v.id, to: o.id, tick: tick };
      return { ok: true, ask: id };
    }
    var a = s.asks[r.peticion];
    if (!a) { return { ok: false, cause: 'request_unknown' }; }
    if (a.to !== v.id) { return { ok: false, cause: 'not_the_partner' }; }
    // (an ask older than law.coop_wait is already gone: forget() removed it, so a late yes finds no request)
    var from = byId(s, a.from);
    if (!from || !live(from, tick, law)) { return { ok: false, cause: 'partner_silent' }; }
    if (dist(v, b) > law.coop_radius) { return { ok: false, cause: 'too_far_from_the_beacon' }; }
    if (dist(from, b) > law.coop_radius) { return { ok: false, cause: 'partner_too_far' }; }
    var e = await record(s, { k: 'faro', who: [a.from, a.to], cell: [b.q, b.r], ask: r.peticion, tick: tick }, deps);
    s.lit = e; s.asks = {};
    return { ok: true, event: e };
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
    var order = function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; };
    var extra = {};
    if (s.events.length) { extra.events = s.events.map(function (e) { return e.k === 'meet' ? { k: e.k, id: e.id, who: e.who, d: e.d, tick: e.tick } : { k: e.k, id: e.id, who: e.who, cell: e.cell, tick: e.tick }; }); }
    if (Object.keys(s.asks).length) { extra.asks = Object.keys(s.asks).sort().map(function (id) { return { id: id, from: s.asks[id].from, to: s.asks[id].to }; }); }
    if (s.lit) { extra.lit = s.lit.id; }
    if (!around) {
      var all = Object.assign({ esquema: 'atlas.presencia/1', tick: tick, crabs: crabs.sort(order) }, extra);
      if (bytes(JSON.stringify(all)) >= LIMIT) { throw new Error('crab_presence: view_over_budget'); }
      return all;
    }
    if (!Number.isSafeInteger(around.q) || !Number.isSafeInteger(around.r) || !Number.isSafeInteger(around.radius) || around.radius < 0) { throw new Error('crab_presence: region_malformed'); }
    var near = crabs.filter(function (c) { return dist(around, c) <= around.radius; })
      .sort(function (a, b) { return dist(around, a) - dist(around, b) || order(a, b); });
    var out = Object.assign({ esquema: 'atlas.presencia/1', tick: tick, crabs: [], more: near.length }, extra), i;
    for (i = 0; i < near.length; i++) {
      out.crabs.push(near[i]); out.more = near.length - out.crabs.length;
      if (bytes(JSON.stringify(out)) >= LIMIT) { out.crabs.pop(); out.more = near.length - out.crabs.length; break; }
    }
    if (!out.more) { delete out.more; }
    return out;
  }

  var api = { SCHEMA: SCHEMA, BEAT: BEAT, ASK: ASK, YES: YES, LIMIT: LIMIT, empty: empty, open: open, step: step, view: view, forget: forget, lawOk: lawOk };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasCrabPresence = api; }
})(this);
