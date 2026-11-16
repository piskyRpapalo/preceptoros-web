// G4-2 · First Journey Contract (odd/tasks/first-journey-contract.md). Pure: no DOM, no clock, no random, no network.
// Extends tutorial_walk.js with a full state machine for the first journey:
//   WELCOME → TRAVEL → NODE_0 → SUMMON → BATTLE → CONQUEST → BUILD → EXPLORE
// Each transition declares: prerequisite, observed event, offered action, current state, result, rejection cause, next action.
// SKIPPED is never converted to COMPLETED (D19). A battle screen opened is not a victory (D23). Viewing a building card
// does not grant the building (D24). The transition to EXPLORE may skip the tutorial without fabricating unearned rewards (D25).
// Reuses axial hex formulas from hex_projection.js and walk_route.js.
// Parity: every event produces one meaning for Eye (marker/card), Ear (instruction/confirmation), Machine (state + receipt).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;

  /* ------------------------------------------------------------------ */
  /* STATES                                                             */
  /* ------------------------------------------------------------------ */

  var STATES = Object.freeze([
    'WELCOME',    // The journey begins. The player sees the map and the first node.
    'TRAVEL',     // The player walks toward the first node.
    'NODE_0',     // The player arrives at the first node (Node 0).
    'SUMMON',     // The player summons a unit at Node 0.
    'BATTLE',     // The player enters a duel.
    'CONQUEST',   // The player wins the duel and claims the node.
    'BUILD',      // The player builds the first structure.
    'EXPLORE'     // The journey is complete; the player explores freely.
  ]);

  /* ------------------------------------------------------------------ */
  /* TRANSITIONS                                                        */
  /* ------------------------------------------------------------------ */
  // Each transition: { from, to, prerequisite, event, action, result, reject, nextAction }
  // prerequisite(state, context) → { ok, cause }
  // event is the observed event string (e.g., 'player_arrived', 'summon_sent')
  // action is the offered action identifier (e.g., 'walk_to_node', 'summon_unit')
  // result is the outcome label (e.g., 'arrived', 'summoned')
  // reject is the cause string when prerequisite fails
  // nextAction is the next action identifier for the "!" signal

  var TRANSITIONS = Object.freeze([
    {
      from: 'WELCOME', to: 'TRAVEL',
      prerequisite: function (st, ctx) {
        if (!ctx || !ctx.seals) { return { ok: false, cause: 'NO_DATA: no seals provided' }; }
        var ids = Object.keys(ctx.seals);
        for (var i = 0; i < ids.length; i++) {
          if (ctx.seals[ids[i]] === 'LIVE' || ctx.seals[ids[i]] === 'STALE') { return { ok: true, cause: '' }; }
        }
        return { ok: false, cause: 'NO_DATA: no node is alive to travel to' };
      },
      event: 'map_opened',
      action: 'walk_to_node',
      result: 'traveling',
      reject: 'NO_DATA: cannot travel without a live node',
      nextAction: 'walk_to_node'
    },
    {
      from: 'TRAVEL', to: 'NODE_0',
      prerequisite: function (st, ctx) {
        if (!ctx || !ctx.playerNode) { return { ok: false, cause: 'NO_DATA: player position unknown' }; }
        if (!ctx || !ctx.seals) { return { ok: false, cause: 'NO_DATA: no seals provided' }; }
        var seal = ctx.seals[ctx.playerNode];
        if (seal !== 'LIVE' && seal !== 'STALE') { return { ok: false, cause: 'NO_DATA: player is not on a live node' }; }
        return { ok: true, cause: '' };
      },
      event: 'player_arrived',
      action: 'enter_node',
      result: 'arrived',
      reject: 'NO_DATA: cannot enter a node that is not alive',
      nextAction: 'enter_node'
    },
    {
      from: 'NODE_0', to: 'SUMMON',
      prerequisite: function (st, ctx) {
        // Node 0 must have responded (the player interacted with it).
        if (!ctx || !ctx.nodeResponded) { return { ok: false, cause: 'NO_DATA: Node 0 has not responded yet' }; }
        return { ok: true, cause: '' };
      },
      event: 'node_responded',
      action: 'summon_unit',
      result: 'summon_available',
      reject: 'NO_DATA: Node 0 did not respond; cannot summon',
      nextAction: 'summon_unit'
    },
    {
      from: 'SUMMON', to: 'BATTLE',
      prerequisite: function (st, ctx) {
        // A summon must have been completed, not just attempted.
        if (ctx && ctx.summonRejected) { return { ok: false, cause: 'NO_DATA: summon was rejected: ' + (ctx.summonCause || 'unknown') }; }
        if (!ctx || !ctx.summonCompleted) { return { ok: false, cause: 'NO_DATA: summon not completed' }; }
        return { ok: true, cause: '' };
      },
      event: 'summon_completed',
      action: 'enter_battle',
      result: 'battle_ready',
      reject: 'NO_DATA: cannot enter battle without a summoned unit',
      nextAction: 'enter_battle'
    },
    {
      from: 'BATTLE', to: 'CONQUEST',
      prerequisite: function (st, ctx) {
        // A battle must have been fought and won. Opening the battle screen is not enough.
        if (!ctx || !ctx.battleFought) { return { ok: false, cause: 'NO_DATA: no battle has been fought' }; }
        if (!ctx.battleWon) { return { ok: false, cause: 'NO_DATA: battle was lost or drawn' }; }
        return { ok: true, cause: '' };
      },
      event: 'battle_won',
      action: 'claim_node',
      result: 'conquered',
      reject: 'NO_DATA: cannot claim a node without winning the battle',
      nextAction: 'claim_node'
    },
    {
      from: 'CONQUEST', to: 'BUILD',
      prerequisite: function (st, ctx) {
        // Conquest must be credited (receipt verified).
        if (!ctx || !ctx.conquestCredited) { return { ok: false, cause: 'NO_DATA: conquest not yet credited' }; }
        return { ok: true, cause: '' };
      },
      event: 'conquest_credited',
      action: 'build_structure',
      result: 'build_available',
      reject: 'NO_DATA: cannot build without a credited conquest',
      nextAction: 'build_structure'
    },
    {
      from: 'BUILD', to: 'EXPLORE',
      prerequisite: function (st, ctx) {
        // A building must have been actually built, not just viewed.
        if (!ctx || !ctx.buildingBuilt) { return { ok: false, cause: 'NO_DATA: no building has been built' }; }
        return { ok: true, cause: '' };
      },
      event: 'building_built',
      action: 'explore',
      result: 'exploring',
      reject: 'NO_DATA: cannot explore without building first',
      nextAction: 'explore'
    }
  ]);

  /* ------------------------------------------------------------------ */
  /* "!" SIGNAL — Priority Action                                       */
  /* ------------------------------------------------------------------ */
  // Each state has exactly one priority action at any moment.
  // The signal expresses: icon, accessible name, voice instruction, machine-readable action id.
  // If the action is disabled, the signal explains why.

  var PRIORITY_SIGNALS = Object.freeze({
    WELCOME: {
      icon: 'map',
      accessibleName: 'Open the map',
      voiceInstruction: 'Tap the map to begin your journey',
      actionId: 'open_map',
      disabled: false,
      disabledCause: ''
    },
    TRAVEL: {
      icon: 'arrow-right',
      accessibleName: 'Walk to the first node',
      voiceInstruction: 'Use the joystick or arrow keys to walk to the highlighted node',
      actionId: 'walk_to_node',
      disabled: false,
      disabledCause: ''
    },
    NODE_0: {
      icon: 'node',
      accessibleName: 'Enter the node',
      voiceInstruction: 'Press Enter to interact with the node',
      actionId: 'enter_node',
      disabled: false,
      disabledCause: ''
    },
    SUMMON: {
      icon: 'summon',
      accessibleName: 'Summon a unit',
      voiceInstruction: 'Press the summon button to call your first unit',
      actionId: 'summon_unit',
      disabled: false,
      disabledCause: ''
    },
    BATTLE: {
      icon: 'sword',
      accessibleName: 'Enter battle',
      voiceInstruction: 'Press the battle button to fight',
      actionId: 'enter_battle',
      disabled: false,
      disabledCause: ''
    },
    CONQUEST: {
      icon: 'flag',
      accessibleName: 'Claim the node',
      voiceInstruction: 'Press the claim button to take control of this node',
      actionId: 'claim_node',
      disabled: false,
      disabledCause: ''
    },
    BUILD: {
      icon: 'hammer',
      accessibleName: 'Build a structure',
      voiceInstruction: 'Press the build button to construct your first structure',
      actionId: 'build_structure',
      disabled: false,
      disabledCause: ''
    },
    EXPLORE: {
      icon: 'compass',
      accessibleName: 'Explore freely',
      voiceInstruction: 'Your journey is complete. Explore the map at your own pace',
      actionId: 'explore',
      disabled: false,
      disabledCause: ''
    }
  });

  /* ------------------------------------------------------------------ */
  /* PARITY — Eye / Ear / Machine                                       */
  /* ------------------------------------------------------------------ */
  // Every event produces one meaning for three channels:
  //   Eye: visual marker, animation, or card.
  //   Ear: spoken instruction or confirmation.
  //   Machine: state label and receipt object.
  // NO_DATA is never transformed into success.

  var PARITY_TABLE = Object.freeze({
    // Summon completed
    summon_completed: {
      eye: { marker: 'summon_glow', card: 'unit_card', animation: 'summon_rise' },
      ear: 'Your unit has been summoned',
      machine: { state: 'BATTLE', receipt: { v: 'preceptoros.journey/1', event: 'summon_completed', outcome: 'ok' } }
    },
    // Summon rejected
    summon_rejected: {
      eye: { marker: 'summon_fail', card: 'error_card', animation: 'none' },
      ear: 'NO_DATA: summon rejected — the node is not ready',
      machine: { state: 'SUMMON', receipt: { v: 'preceptoros.journey/1', event: 'summon_rejected', outcome: 'rejected', cause: 'node_not_ready' } }
    },
    // Battle lost
    battle_lost: {
      eye: { marker: 'defeat', card: 'defeat_card', animation: 'fade_out' },
      ear: 'NO_DATA: the battle was lost — try again',
      machine: { state: 'BATTLE', receipt: { v: 'preceptoros.journey/1', event: 'battle_lost', outcome: 'lost' } }
    },
    // Battle won
    battle_won: {
      eye: { marker: 'victory', card: 'victory_card', animation: 'confetti' },
      ear: 'Victory! The node is yours to claim',
      machine: { state: 'CONQUEST', receipt: { v: 'preceptoros.journey/1', event: 'battle_won', outcome: 'won' } }
    },
    // Local conquest
    conquest_local: {
      eye: { marker: 'claimed', card: 'claim_card', animation: 'flag_raise' },
      ear: 'You have claimed this node',
      machine: { state: 'CONQUEST', receipt: { v: 'preceptoros.journey/1', event: 'conquest_local', outcome: 'claimed' } }
    },
    // Conquest credited
    conquest_credited: {
      eye: { marker: 'credited', card: 'credit_card', animation: 'seal_stamp' },
      ear: 'Conquest verified. You may now build',
      machine: { state: 'BUILD', receipt: { v: 'preceptoros.journey/1', event: 'conquest_credited', outcome: 'credited' } }
    },
    // Building unlocked
    building_unlocked: {
      eye: { marker: 'build_ready', card: 'building_card', animation: 'blueprint' },
      ear: 'A new structure is available to build',
      machine: { state: 'BUILD', receipt: { v: 'preceptoros.journey/1', event: 'building_unlocked', outcome: 'unlocked' } }
    },
    // Node 0 no response
    node0_no_response: {
      eye: { marker: 'no_data', card: 'error_card', animation: 'none' },
      ear: 'NO_DATA: Node 0 is not responding',
      machine: { state: 'NODE_0', receipt: { v: 'preceptoros.journey/1', event: 'node0_no_response', outcome: 'no_data', cause: 'node_unresponsive' } }
    },
    // Reward pending validation
    reward_pending: {
      eye: { marker: 'pending', card: 'pending_card', animation: 'spinner' },
      ear: 'Your reward is being validated',
      machine: { state: 'CONQUEST', receipt: { v: 'preceptoros.journey/1', event: 'reward_pending', outcome: 'pending' } }
    }
  });

  /* ------------------------------------------------------------------ */
  /* HEXAGONAL ROUTE HELPERS                                            */
  /* ------------------------------------------------------------------ */
  // Reuses axial formulas. Distinguishes:
  //   - Mathematical distance (axial distance formula)
  //   - Transitible path (BFS over visible nodes)
  //   - Allowed movement (step budget)
  //   - Signed step (step recorded in log)
  //   - Effectively confirmed displacement (step played in tutorial log)

  // Axial distance: |dq| + |dq+dr| + |dr| / 2  →  max(|dq|, |dr|, |dq+dr|)
  function axialDistance(q1, r1, q2, r2) {
    var dq = Math.abs(q2 - q1);
    var dr = Math.abs(r2 - r1);
    var ds = Math.abs((q2 + r2) - (q1 + r1));
    return Math.max(dq, dr, ds);
  }

  // Axial neighbours in fixed order (same as walk_route.js STEPS)
  var AXIAL_STEPS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

  function axialNeighbours(q, r) {
    var out = [];
    for (var i = 0; i < AXIAL_STEPS.length; i++) {
      out.push({ q: q + AXIAL_STEPS[i][0], r: r + AXIAL_STEPS[i][1] });
    }
    return out;
  }

  // BFS route over visible nodes. Returns { ok, path, cause }.
  // path is an array of { q, r } from start to end.
  // A route cannot traverse prohibited cells.
  function hexRoute(nodes, seals, fromQ, fromR, toQ, toR) {
    // Build lookup: "q,r" → node id
    var lookup = {};
    var nodeAt = {}; // "q,r" → { q, r, id }
    var i;
    for (i = 0; i < (nodes || []).length; i++) {
      var n = nodes[i];
      var key = n.q + ',' + n.r;
      lookup[key] = n.id;
      nodeAt[key] = { q: n.q, r: n.r, id: n.id };
    }
    var fromKey = fromQ + ',' + fromR;
    var toKey = toQ + ',' + toR;
    if (!lookup[fromKey]) { return { ok: false, path: [], cause: 'NO_DATA: start hex has no node' }; }
    if (!lookup[toKey]) { return { ok: false, path: [], cause: 'NO_DATA: end hex has no node' }; }
    // Check visibility
    var fromSeal = (seals || {})[lookup[fromKey]];
    var toSeal = (seals || {})[lookup[toKey]];
    if (fromSeal !== 'LIVE' && fromSeal !== 'STALE') { return { ok: false, path: [], cause: 'NO_DATA: start node not alive' }; }
    if (toSeal !== 'LIVE' && toSeal !== 'STALE') { return { ok: false, path: [], cause: 'NO_DATA: end node not alive' }; }
    // BFS
    var prev = {};
    var queue = [fromKey];
    var seen = {};
    seen[fromKey] = true;
    while (queue.length > 0) {
      var cur = queue.shift();
      if (cur === toKey) { break; }
      var curParts = cur.split(',');
      var cq = parseInt(curParts[0], 10);
      var cr = parseInt(curParts[1], 10);
      var neighbours = axialNeighbours(cq, cr);
      for (var j = 0; j < neighbours.length; j++) {
        var nk = neighbours[j].q + ',' + neighbours[j].r;
        if (seen[nk]) { continue; }
        if (!lookup[nk]) { continue; } // No node here — cannot traverse
        var seal = (seals || {})[lookup[nk]];
        if (seal !== 'LIVE' && seal !== 'STALE') { continue; } // Not visible — cannot traverse
        seen[nk] = true;
        prev[nk] = cur;
        queue.push(nk);
      }
    }
    if (!seen[toKey]) {
      return { ok: false, path: [], cause: 'NO_DATA: destination unreachable over alive nodes' };
    }
    // Reconstruct path
    var path = [];
    var ptr = toKey;
    while (ptr !== fromKey) {
      path.unshift(nodeAt[ptr]);
      ptr = prev[ptr];
    }
    path.unshift(nodeAt[fromKey]);
    return { ok: true, path: path, cause: '' };
  }

  // Check whether a suggested route crosses prohibited cells.
  // Returns { ok, cause }. A route that crosses a non-visible node is refused.
  function routeCrossesProhibited(path, seals, nodes) {
    var lookup = {};
    for (var i = 0; i < (nodes || []).length; i++) {
      lookup[nodes[i].q + ',' + nodes[i].r] = nodes[i].id;
    }
    for (var j = 0; j < path.length; j++) {
      var p = path[j];
      var key = p.q + ',' + p.r;
      var nodeId = lookup[key];
      if (!nodeId) { return { ok: false, cause: 'NO_DATA: step ' + j + ' has no node at ' + key }; }
      var seal = (seals || {})[nodeId];
      if (seal !== 'LIVE' && seal !== 'STALE') {
        return { ok: false, cause: 'NO_DATA: step ' + j + ' crosses non-visible node ' + nodeId + ' (seal: ' + (seal || 'absent') + ')' };
      }
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* STATE MACHINE ENGINE                                               */
  /* ------------------------------------------------------------------ */

  function fail(causa) { throw new Error('tutorial_journey: ' + causa); }

  // createJourney() → a new journey state.
  function createJourney() {
    return {
      state: 'WELCOME',
      log: [],           // { step, outcome, cause } — immutable append
      context: {},       // mutable context: seals, playerNode, nodeResponded, etc.
      skipped: [],       // list of skipped step ids
      completed: []      // list of completed step ids (never includes skipped)
    };
  }

  // currentSignal(journey) → the "!" priority signal for the current state.
  function currentSignal(journey) {
    var sig = PRIORITY_SIGNALS[journey.state];
    if (!sig) { fail('unknown state ' + journey.state); }
    return sig;
  }

  // whatDoNow(journey) → plain-language answer to "¿Qué hago ahora?".
  function whatDoNow(journey) {
    var sig = currentSignal(journey);
    var ctx = journey.context || {};
    // Check if the next transition is blocked and explain why.
    var next = nextTransition(journey.state);
    if (next) {
      var prereq = next.prerequisite(journey.state, ctx);
      if (!prereq.ok) {
        return sig.voiceInstruction + '. ' + prereq.cause;
      }
    }
    return sig.voiceInstruction;
  }

  // nextTransition(fromState) → the transition object, or undefined.
  function nextTransition(fromState) {
    for (var i = 0; i < TRANSITIONS.length; i++) {
      if (TRANSITIONS[i].from === fromState) { return TRANSITIONS[i]; }
    }
    return undefined;
  }

  // transition(journey, event, context) → { ok, journey, receipt, cause }.
  // Attempts to advance the journey from the current state using the given event and context.
  // If the prerequisite fails, returns rejection with cause.
  // If the event does not match, returns { ok: false, cause: 'unexpected event' }.
  // On success, appends to log and advances state.
  function transition(journey, event, context) {
    var j = {
      state: journey.state,
      log: (journey.log || []).slice(),
      context: context || journey.context,
      skipped: (journey.skipped || []).slice(),
      completed: (journey.completed || []).slice()
    };
    var t = nextTransition(j.state);
    if (!t) {
      // Already at EXPLORE — journey complete.
      return {
        ok: true,
        journey: j,
        receipt: { v: 'preceptoros.journey/1', state: 'EXPLORE', event: event, outcome: 'complete' },
        cause: ''
      };
    }
    // Check prerequisite
    var prereq = t.prerequisite(j.state, j.context);
    if (!prereq.ok) {
      j.log = j.log.concat([{ step: t.action, outcome: 'rejected', cause: prereq.cause }]);
      return {
        ok: false,
        journey: j,
        receipt: { v: 'preceptoros.journey/1', state: j.state, event: event, outcome: 'rejected', cause: prereq.cause },
        cause: prereq.cause
      };
    }
    // Check event match
    if (t.event !== event) {
      return {
        ok: false,
        journey: j,
        receipt: { v: 'preceptoros.journey/1', state: j.state, event: event, outcome: 'unexpected', expected: t.event },
        cause: 'unexpected event ' + JSON.stringify(event) + '; expected ' + JSON.stringify(t.event)
      };
    }
    // Success: advance state
    j.log = j.log.concat([{ step: t.action, outcome: 'completed', cause: '' }]);
    j.completed = j.completed.concat([t.action]);
    j.state = t.to;
    return {
      ok: true,
      journey: j,
      receipt: { v: 'preceptoros.journey/1', state: t.to, event: event, outcome: t.result },
      cause: ''
    };
  }

  // skipStep(journey, stepId) → { ok, journey, cause }.
  // Records a skip. Never converts skip to completed.
  function skipStep(journey, stepId) {
    var t = nextTransition(journey.state);
    if (!t) { return { ok: false, journey: journey, cause: 'no step to skip at EXPLORE' }; }
    if (t.action !== stepId) {
      return { ok: false, journey: journey, cause: 'cannot skip ' + stepId + '; current step is ' + t.action };
    }
    var j = {
      state: journey.state,
      log: (journey.log || []).concat([{ step: stepId, outcome: 'skipped', cause: 'player chose to skip' }]),
      context: journey.context,
      skipped: (journey.skipped || []).concat([stepId]),
      completed: (journey.completed || []).slice()
    };
    return { ok: true, journey: j, cause: '' };
  }

  // skipToExplore(journey, context) → { ok, journey, receipt, cause }.
  // Skips all remaining steps and goes directly to EXPLORE.
  // Does NOT fabricate rewards for skipped steps.
  function skipToExplore(journey, context) {
    var j = {
      state: 'EXPLORE',
      log: (journey.log || []).slice(),
      context: context || journey.context,
      skipped: (journey.skipped || []).slice(),
      completed: (journey.completed || []).slice()
    };
    // Mark all remaining steps as skipped
    var curState = journey.state;
    while (true) {
      var t = nextTransition(curState);
      if (!t) { break; }
      j.log = j.log.concat([{ step: t.action, outcome: 'skipped', cause: 'skipped to explore' }]);
      j.skipped = j.skipped.concat([t.action]);
      curState = t.to;
    }
    return {
      ok: true,
      journey: j,
      receipt: { v: 'preceptoros.journey/1', state: 'EXPLORE', event: 'skip_all', outcome: 'skipped_to_explore' },
      cause: ''
    };
  }

  // parityFor(event) → the parity entry for eye/ear/machine, or null.
  function parityFor(event) {
    return PARITY_TABLE[event] || null;
  }

  // progress(journey) → { state, completed, skipped, total }.
  function progress(journey) {
    return {
      state: journey.state,
      completed: (journey.completed || []).length,
      skipped: (journey.skipped || []).length,
      total: TRANSITIONS.length
    };
  }

  /* ------------------------------------------------------------------ */
  /* VISITOR ISOLATION                                                  */
  /* ------------------------------------------------------------------ */
  // Two visitors must not share progress. Each visitor has an independent journey.
  // createVisitorJourney(visitorId) → a journey tagged with the visitor id.
  function createVisitorJourney(visitorId) {
    var j = createJourney();
    j.visitorId = visitorId;
    return j;
  }

  // isolate(journeyA, journeyB) → { ok, cause }.
  // Verifies that two journeys are independent: same state does not mean shared progress.
  function isolate(journeyA, journeyB) {
    if (!journeyA || !journeyB) { return { ok: false, cause: 'NO_DATA: missing journey' }; }
    if (journeyA.visitorId === journeyB.visitorId) {
      return { ok: false, cause: 'NO_DATA: same visitor id — not isolated' };
    }
    // Verify logs are independent
    var logA = JSON.stringify(journeyA.log);
    var logB = JSON.stringify(journeyB.log);
    // They may have the same content if both are empty, but they must be separate arrays.
    if (journeyA.log === journeyB.log) {
      return { ok: false, cause: 'NO_DATA: shared log reference — not isolated' };
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* EXPORT                                                              */
  /* ------------------------------------------------------------------ */

  var AtlasTutorialJourney = Object.freeze({
    STATES: STATES,
    TRANSITIONS: TRANSITIONS,
    PRIORITY_SIGNALS: PRIORITY_SIGNALS,
    PARITY_TABLE: PARITY_TABLE,
    AXIAL_STEPS: AXIAL_STEPS,
    axialDistance: axialDistance,
    axialNeighbours: axialNeighbours,
    hexRoute: hexRoute,
    routeCrossesProhibited: routeCrossesProhibited,
    createJourney: createJourney,
    createVisitorJourney: createVisitorJourney,
    currentSignal: currentSignal,
    whatDoNow: whatDoNow,
    nextTransition: nextTransition,
    transition: transition,
    skipStep: skipStep,
    skipToExplore: skipToExplore,
    parityFor: parityFor,
    progress: progress,
    isolate: isolate
  });

  if (common) { module.exports = AtlasTutorialJourney; }
  else { root.AtlasTutorialJourney = AtlasTutorialJourney; }
})(typeof globalThis === 'object' ? globalThis : this);
