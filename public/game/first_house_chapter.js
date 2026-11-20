// The first-house chapter is an observer of verified game facts, NOT a second combat/ownership authority.
// No node, storage, clock, network, sprite or automatic victory. Game results come from existing verifiers.
(function (root) {
  'use strict';
  var VERSION = 'preceptoros.first-house/1', HOUSE = /^b:visitor-house:-?\d+,-?\d+$/;
  function fresh(seed) {
    if (typeof seed !== 'string' || !/^[a-f0-9]{64}$/.test(seed)) { throw new Error('NO_DATA: valid visit seed required'); }
    return Object.freeze({ version: VERSION, seed: seed, place: null, held: false, claimed: false,
      profile: false, npcSeen: false, retaken: false, recaptured: false, garrison: 0,
      hospital: false, healed: false, skipped: false, step: 0 });
  }
  function phase(s) {
    if (!s || s.version !== VERSION) { return 'NO_DATA(invalid_chapter)'; }
    if (s.skipped) { return 'skipped'; }
    if (!s.claimed) { return 'first-house'; }
    if (!s.profile) { return 'personalize'; }
    if (s.retaken && !s.held) { return 'recapture'; }
    if (s.held && s.garrison > 0) { return s.hospital ? (s.healed ? 'explore' : 'healing') : 'hospital'; }
    if (s.recaptured) { return 'defend'; }
    return s.npcSeen ? 'protect-or-lose' : 'learn-defense';
  }
  function fail(cause, current) { return { ok: false, cause: cause, state: current }; }
  function accept(s, type, event) {
    var changed = Object.assign({}, s, event, { step: s.step + 1 });
    return { ok: true, state: Object.freeze(changed), phase: phase(changed) };
  }
  // The gate functions are caller-supplied adapters to the EXISTING resolver, holdings ledger and WEB builder.
  // A boolean field in an event is never a proof. Missing gates reject closed.
  async function advance(s, ev, gates) {
    if (!s || s.version !== VERSION || !ev || typeof ev !== 'object') { return fail('invalid_chapter_or_event', s); }
    var key = ev.place, g = gates || {};
    if (ev.kind === 'skip' || ev.kind === 'resume') {
      return accept(s, ev.kind, { skipped: ev.kind === 'skip' });
    }
    if (!HOUSE.test(key || '') && ev.kind !== 'hospital_built' && ev.kind !== 'healed') {
      return fail('visitor_house_place_required', s);
    }
    if (ev.kind === 'claim' || ev.kind === 'recapture') {
      if ((ev.kind === 'claim' && s.claimed) || (ev.kind === 'recapture' && (!s.retaken || s.held || key !== s.place))) {
        return fail('claim_out_of_order', s);
      }
      // Both battle replay AND the map's conquest receipt must agree; build origin uses its own independent gate.
      var battle = ev.battle, validBattle = battle && battle.place === key && battle.practice !== true &&
        battle.combat && battle.combat.gana === 'asalto' && typeof g.verifyBattle === 'function' &&
        await g.verifyBattle(battle, s.seed) === true;
      var validConquest = validBattle && typeof g.verifyConquest === 'function' &&
        await g.verifyConquest(key, ev, s.seed) === true;
      var validBuild = ev.kind === 'claim' && ev.origin === 'visitor-build' &&
        typeof g.verifyBuild === 'function' && await g.verifyBuild(key, ev, s.seed) === true;
      if (!validConquest && !validBuild) { return fail('capture_not_verified', s); }
      return accept(s, ev.kind, { place: key, held: true, claimed: true,
        retaken: false, recaptured: ev.kind === 'recapture', garrison: 0 });
    }
    if (!s.claimed || (ev.kind !== 'hospital_built' && ev.kind !== 'healed' && key !== s.place)) {
      return fail('house_not_claimed_in_this_visit', s);
    }
    if (ev.kind === 'profile_saved') {
      if (!s.held || !ev.card || ev.card.esquema !== 'preceptoros.visitor-house/1') {
        return fail('profile_requires_owned_house', s);
      }
      var P = root.AtlasVisitorHouseProfile;
      var checked = P && P.normalize(ev.card);
      if (!checked || !checked.ok) { return fail('invalid_house_profile', s); }
      return accept(s, ev.kind, { profile: true });
    }
    if (ev.kind === 'npc_approach') {
      // A sighting is not an ownership event. The visual NPC can move even if it cannot win.
      if (typeof g.confirmApproach !== 'function' || await g.confirmApproach(key, ev) !== true) {
        return fail('npc_route_not_confirmed', s);
      }
      return accept(s, ev.kind, { npcSeen: true });
    }
    if (ev.kind === 'npc_retake') {
      if (!s.held || s.garrison !== 0 || !s.npcSeen || typeof g.confirmRetake !== 'function' ||
          await g.confirmRetake(key, ev) !== true) { return fail('npc_retake_not_confirmed', s); }
      return accept(s, ev.kind, { held: false, retaken: true, garrison: 0 });
    }
    if (ev.kind === 'garrison') {
      if (!s.held || !Number.isSafeInteger(ev.count) || ev.count < 1 || ev.count > 10 ||
          typeof g.readGarrison !== 'function') { return fail('garrison_not_measured', s); }
      var observed = await g.readGarrison(key, s.seed);
      if (!observed || observed.count !== ev.count || !Number.isSafeInteger(observed.life) || observed.life <= 0 || observed.life > 1000) {
        return fail('garrison_ledger_mismatch', s);
      }
      return accept(s, ev.kind, { garrison: observed.count });
    }
    if (ev.kind === 'garrison_broken') {
      // A previously posted defense can truly fall in the ledger. The drawing must not keep it alive.
      if (!s.held || s.garrison < 1 || typeof g.readGarrison !== 'function') {
        return fail('garrison_loss_not_measured', s);
      }
      var remaining = await g.readGarrison(key, s.seed);
      if (!remaining || remaining.count !== 0) { return fail('garrison_still_alive', s); }
      return accept(s, ev.kind, { garrison: 0 });
    }
    if (ev.kind === 'hospital_built') {
      if (!s.held || !s.garrison || typeof g.confirmHospital !== 'function' ||
          await g.confirmHospital(ev, s.seed) !== true) { return fail('healing_building_not_verified', s); }
      return accept(s, ev.kind, { hospital: true });
    }
    if (ev.kind === 'healed') {
      if (!s.hospital || typeof g.confirmHealing !== 'function' ||
          await g.confirmHealing(ev, s.seed) !== true) { return fail('healing_rule_not_implemented', s); }
      return accept(s, ev.kind, { healed: true });
    }
    return fail('unknown_chapter_event', s);
  }
  var API = Object.freeze({ fresh: fresh, phase: phase, advance: advance, schema: VERSION });
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  root.AtlasFirstHouseChapter = API;
})(typeof window !== 'undefined' ? window : globalThis);
