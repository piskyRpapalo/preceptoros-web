// WAVE-VISUAL-01 · Piece B: the crab's five invocation keys, translated to operations this build really has.
// Pure controller: it reads a visit snapshot and returns the operation the caller may run; it never summons,
// hatches, adopts, sands or signs anything itself, and it invents no troop, resource or receipt. The caller
// performs the returned operation through the existing signed APIs (visitor_eggs.js, ui-workshop.js).
// Where the build has no implementation, the action is disabled with a NO_DATA cause instead of a fake step.
// English UI. No DOM, no clock, no randomness, no network, no storage.
(function (root) {
  'use strict';
  var HEX64 = /^[0-9a-f]{64}$/;
  // 1 Egg · 2 Hatch · 3 Adopt · 4 Wave+ · 5 Defense. Op names are the existing operations, not new ones.
  var ACTIONS = [
    { key: '1', id: 'egg', name: 'Egg', op: 'summon' },
    { key: '2', id: 'hatch', name: 'Hatch', op: 'hatch' },
    { key: '3', id: 'adopt', name: 'Adopt', op: 'adoption' },
    { key: '4', id: 'plus', name: 'Wave+', op: 'sand' },
    { key: '5', id: 'defense', name: 'Defense', op: 'defend' }
  ];
  var KEYS = { '1': 'egg', '2': 'hatch', '3': 'adopt', '4': 'plus', '5': 'defense',
               Digit1: 'egg', Digit2: 'hatch', Digit3: 'adopt', Digit4: 'plus', Digit5: 'defense',
               Numpad1: 'egg', Numpad2: 'hatch', Numpad3: 'adopt', Numpad4: 'plus', Numpad5: 'defense' };
  function bye(id, cause, say) { return { ok: false, enabled: false, id: id, cause: cause, say: say }; }
  function actionOf(id) { for (var i = 0; i < ACTIONS.length; i++) { if (ACTIONS[i].id === id) { return ACTIONS[i]; } } return null; }
  // Pure: keyOf(eventOrValue) → action id for a plain 1..5 key, or null. Modified keys stay with the browser.
  function keyOf(e) {
    if (!e || typeof e !== 'object') { e = { key: e }; }
    if (e.altKey || e.ctrlKey || e.metaKey) { return null; }
    return typeof e.key === 'string' && Object.prototype.hasOwnProperty.call(KEYS, e.key) ? KEYS[e.key] : null;
  }
  function caps(ctx) { return ctx && ctx.caps && typeof ctx.caps === 'object' ? ctx.caps : {}; }
  function lacks(ctx, name) { return caps(ctx)[name] !== true; }
  // Pure: nonNegativeInteger(v) → true only for finite, non-negative integers (0, 1, 2, …).
  function nonNegativeInteger(v) { return Number.isFinite(v) && v === Math.floor(v) && v >= 0; }

  // Pure: plan(id, ctx) → one descriptor. ctx = { consent, state, tier, seq, troop, stat, stats, identity, caps }.
  // state is the visit snapshot from visitor_eggs.state(); costs is AtlasGacha.TCS.
  function plan(id, ctx) {
    var a = actionOf(id);
    ctx = ctx || {};
    if (!a) { return bye(id || null, 'unknown_action', 'NO_DATA: unknown invocation'); }
    if (a.id === 'adopt') {
      // Q-06: the hatch call IS the adoption consent; there is no second adoption step to fake.
      return bye(id, 'adoption_is_part_of_hatch', 'Adopt · NO_DATA: no separate adoption step — a ready egg hatches into your army under the same consent (Q-06).');
    }
    if (a.id === 'defense') {
      // No local defense order exists in this build. A duel's «defensa» is the resolving side of a log, not an action.
      return bye(id, 'no_defense_service_in_this_build', 'Defense · NO_DATA: no local defense order exists in this build.');
    }
    if (a.id === 'egg' || a.id === 'hatch') {
      if (ctx.consent !== true) { return bye(id, 'consent_required', a.name + ' · needs an explicit press: consent is not assumed.'); }
      if (lacks(ctx, a.op)) { return bye(id, 'capability_not_available', a.name + ' · NO_DATA: the signed visit API is not loaded.'); }
    }
    if (a.id === 'egg') {
      var s = ctx.state;
      if (!s || typeof s !== 'object') { return bye(id, 'state_unmeasured', 'Egg · NO_DATA: no visit is open.'); }
      var costs = ctx.costs || {}, tc = ctx.tier || 'tc1';
      if (!Object.prototype.hasOwnProperty.call(costs, tc)) { return bye(id, 'unknown_egg_class', 'Egg · NO_DATA: unknown egg class ' + tc + '.'); }
      if (s.busy === true) { return bye(id, 'visit_busy', 'Egg · wait: one signed invocation at a time.'); }
      // State resources must be finite, non-negative integers — the same shape AtlasGacha.TCS.coste uses.
      if (!nonNegativeInteger(s.copper) || !nonNegativeInteger(s.light)) { return bye(id, 'state_unmeasured', 'Egg · NO_DATA: copper and light are not measured.'); }
      var costObj = costs[tc].coste;
      if (!costObj || typeof costObj !== 'object') { return bye(id, 'malformed_cost', 'Egg · NO_DATA: cost record for ' + tc + ' is not an object.'); }
      if (!nonNegativeInteger(costObj.cobre) || !nonNegativeInteger(costObj.luz)) { return bye(id, 'malformed_cost', 'Egg · NO_DATA: cost values for ' + tc + ' are not valid non-negative integers.'); }
      var dc = costObj.cobre - s.copper, dl = costObj.luz - s.light;
      if (dc > 0 || dl > 0) {
        var need = [dc > 0 ? dc + ' more copper' : '', dl > 0 ? dl + ' more light' : ''].filter(Boolean).join(' and ');
        return bye(id, 'insufficient_resources', 'Egg · needs ' + need + ' for ' + tc + '.');
      }
      return { ok: true, enabled: true, id: id, action: a, args: { tc: tc, consent: true },
               say: 'Egg · summon ' + tc + ' for ' + costObj.cobre + ' copper' + (costObj.luz ? ' + ' + costObj.luz + ' light' : '') + '.' };
    }
    if (a.id === 'hatch') {
      var st = ctx.state, eggs = st && Array.isArray(st.eggs) ? st.eggs : null;
      if (!eggs) { return bye(id, 'state_unmeasured', 'Hatch · NO_DATA: no egg list is measured.'); }
      var egg = null, i;
      if (ctx.seq != null) { for (i = 0; i < eggs.length; i++) { if (eggs[i] && eggs[i].seq === ctx.seq) { egg = eggs[i]; } } }
      else { for (i = 0; i < eggs.length; i++) { if (eggs[i] && eggs[i].ready === true) { egg = eggs[i]; break; } } }
      if (!egg || egg.ready !== true) { return bye(id, 'egg_not_ready', 'Hatch · no ready egg: a hatching egg comes to term on its own count.'); }
      return { ok: true, enabled: true, id: id, action: a, args: { seq: egg.seq, consent: true },
               say: 'Hatch egg ' + egg.seq + ' · adoption is part of this consent (Q-06).' };
    }
    // plus
    if (lacks(ctx, 'sand')) { return bye(id, 'capability_not_available', 'Wave+ · NO_DATA: the signed Workshop API is not loaded.'); }
    if (ctx.identity !== true) { return bye(id, 'identity_required', 'Wave+ · needs this device’s signed identity.'); }
    if (!ctx.troop || !HEX64.test(ctx.troop.semilla || '')) { return bye(id, 'troop_missing', 'Wave+ · choose a measured wave first.'); }
    if (typeof ctx.stat !== 'string' || !Array.isArray(ctx.stats) || ctx.stats.indexOf(ctx.stat) < 0) {
      return bye(id, 'stat_not_eligible', 'Wave+ · that stat is not eligible under the signed Workshop rule.');
    }
    return { ok: true, enabled: true, id: id, action: a, args: { semilla: ctx.troop.semilla, stat: ctx.stat },
             say: 'Wave+ · sand ' + ctx.stat + ' one measured step; the edges stay the same.' };
  }
  // Pure: bar(ctx) → the five rows for display. Availability is shown without assuming the press: the UI must
  // still send consent:true only from the real gesture.
  function bar(ctx) {
    var shown = Object.assign({}, ctx || {}, { consent: true });
    return ACTIONS.map(function (a) {
      var p = plan(a.id, shown);
      p.key = a.key; p.name = a.name; p.op = a.op; p.action = a;
      return p;
    });
  }
  // Pure: press(e, ctx) → { id, plan } for a plain key, or null.
  // IMPORTANT: press() returns a *proposal* — a plan the UI may display. It is NEVER consent or authority.
  // Synthetic key events (e.g., programmatically dispatched KeyboardEvent) cannot be used by a privileged
  // executor to perform actions; only a real user gesture on the accessible keyboard/pointer/touch controls
  // carries consent. The caller must verify the event originates from a genuine user interaction before
  // passing consent:true to the signed APIs (visitor_eggs.js, ui-workshop.js).
  function press(e, ctx) {
    var id = keyOf(e);
    if (!id) { return null; }
    return { id: id, plan: plan(id, Object.assign({}, ctx || {}, { consent: true })) };
  }

  var AtlasCrabInvoke = { ACTIONS: ACTIONS, keyOf: keyOf, plan: plan, bar: bar, press: press };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCrabInvoke; }
  root.AtlasCrabInvoke = AtlasCrabInvoke;
})(typeof window !== 'undefined' ? window : globalThis);
