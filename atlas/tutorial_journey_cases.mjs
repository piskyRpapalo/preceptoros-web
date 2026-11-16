// G4-2 · First Journey Contract — transition tests (odd/tasks/first-journey-contract.md).
// Tests: full journey, each transition, rejection cases, skip semantics, determinism.
// Usage: node --test atlas/tutorial_journey_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const req = createRequire(import.meta.url);
const J = req('../atlas/puros/tutorial_journey.js');

// Fixtures
const sealsWithHome = { home: 'LIVE' };
const sealsEmpty = {};
const ctxWithSeals = { seals: sealsWithHome };
const ctxPlayerAtHome = { seals: sealsWithHome, playerNode: 'home' };
const ctxNodeResponded = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true };
const ctxSummonCompleted = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true };
const ctxBattleWon = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true, battleFought: true, battleWon: true };
const ctxConquestCredited = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true, battleFought: true, battleWon: true, conquestCredited: true };
const ctxBuildingBuilt = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true, battleFought: true, battleWon: true, conquestCredited: true, buildingBuilt: true };

test('ESTADOS: 8 estados definidos', () => {
  assert.equal(J.STATES.length, 8);
  assert.deepEqual(J.STATES, ['WELCOME', 'TRAVEL', 'NODE_0', 'SUMMON', 'BATTLE', 'CONQUEST', 'BUILD', 'EXPLORE']);
});

test('TRANSICIONES: 7 transiciones definidas', () => {
  assert.equal(J.TRANSITIONS.length, 7);
});

test('createJourney: empieza en WELCOME con log vacío', () => {
  var j = J.createJourney();
  assert.equal(j.state, 'WELCOME');
  assert.equal(j.log.length, 0);
  assert.equal(j.skipped.length, 0);
  assert.equal(j.completed.length, 0);
});

test('WELCOME → TRAVEL: con nodo vivo, avanza', () => {
  var j = J.createJourney();
  var r = J.transition(j, 'map_opened', ctxWithSeals);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'TRAVEL');
  assert.equal(r.receipt.outcome, 'traveling');
});

test('WELCOME → TRAVEL: sin sellos, rechaza', () => {
  var j = J.createJourney();
  var r = J.transition(j, 'map_opened', {});
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'WELCOME');
  assert.ok(r.cause.indexOf('NO_DATA') === 0);
});

test('WELCOME → TRAVEL: sellos vacíos, rechaza', () => {
  var j = J.createJourney();
  var r = J.transition(j, 'map_opened', { seals: {} });
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'WELCOME');
});

test('TRAVEL → NODE_0: jugador en nodo vivo, avanza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  assert.equal(j.state, 'TRAVEL');
  var r = J.transition(j, 'player_arrived', ctxPlayerAtHome);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'NODE_0');
  assert.equal(r.receipt.outcome, 'arrived');
});

test('TRAVEL → NODE_0: sin posición de jugador, rechaza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  var r = J.transition(j, 'player_arrived', { seals: sealsWithHome });
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'TRAVEL');
  assert.ok(r.cause.indexOf('player position unknown') >= 0);
});

test('NODE_0 → SUMMON: nodo respondió, avanza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  var r = J.transition(j, 'node_responded', ctxNodeResponded);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'SUMMON');
  assert.equal(r.receipt.outcome, 'summon_available');
});

test('NODE_0 → SUMMON: nodo no respondió, rechaza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  var r = J.transition(j, 'node_responded', { seals: sealsWithHome, playerNode: 'home' });
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'NODE_0');
  assert.ok(r.cause.indexOf('Node 0 has not responded') >= 0);
});

test('SUMMON → BATTLE: invocación completada, avanza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  var r = J.transition(j, 'summon_completed', ctxSummonCompleted);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'BATTLE');
  assert.equal(r.receipt.outcome, 'battle_ready');
});

test('SUMMON → BATTLE: invocación rechazada, no avanza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  var ctx = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonRejected: true, summonCause: 'node_busy' };
  var r = J.transition(j, 'summon_completed', ctx);
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'SUMMON');
  assert.ok(r.cause.indexOf('summon was rejected') >= 0);
});

test('BATTLE → CONQUEST: batalla ganada, avanza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  j = J.transition(j, 'summon_completed', ctxSummonCompleted).journey;
  var r = J.transition(j, 'battle_won', ctxBattleWon);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'CONQUEST');
  assert.equal(r.receipt.outcome, 'conquered');
});

test('BATTLE → CONQUEST: batalla perdida, no avanza (D23)', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  j = J.transition(j, 'summon_completed', ctxSummonCompleted).journey;
  var ctx = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true, battleFought: true, battleWon: false };
  var r = J.transition(j, 'battle_won', ctx);
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'BATTLE');
  assert.ok(r.cause.indexOf('battle was lost') >= 0);
});

test('BATTLE → CONQUEST: solo abrió pantalla, no avanza (D23)', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  j = J.transition(j, 'summon_completed', ctxSummonCompleted).journey;
  var ctx = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true, battleScreenOpened: true };
  var r = J.transition(j, 'battle_won', ctx);
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'BATTLE');
  assert.ok(r.cause.indexOf('no battle has been fought') >= 0);
});

test('CONQUEST → BUILD: conquista acreditada, avanza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  j = J.transition(j, 'summon_completed', ctxSummonCompleted).journey;
  j = J.transition(j, 'battle_won', ctxBattleWon).journey;
  var r = J.transition(j, 'conquest_credited', ctxConquestCredited);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'BUILD');
  assert.equal(r.receipt.outcome, 'build_available');
});

test('CONQUEST → BUILD: conquista no acreditada, rechaza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  j = J.transition(j, 'summon_completed', ctxSummonCompleted).journey;
  j = J.transition(j, 'battle_won', ctxBattleWon).journey;
  var ctx = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true, battleFought: true, battleWon: true };
  var r = J.transition(j, 'conquest_credited', ctx);
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'CONQUEST');
  assert.ok(r.cause.indexOf('conquest not yet credited') >= 0);
});

test('BUILD → EXPLORE: edificio construido, avanza', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  j = J.transition(j, 'summon_completed', ctxSummonCompleted).journey;
  j = J.transition(j, 'battle_won', ctxBattleWon).journey;
  j = J.transition(j, 'conquest_credited', ctxConquestCredited).journey;
  var r = J.transition(j, 'building_built', ctxBuildingBuilt);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'EXPLORE');
  assert.equal(r.receipt.outcome, 'exploring');
});

test('BUILD → EXPLORE: solo vio tarjeta, no avanza (D24)', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  j = J.transition(j, 'node_responded', ctxNodeResponded).journey;
  j = J.transition(j, 'summon_completed', ctxSummonCompleted).journey;
  j = J.transition(j, 'battle_won', ctxBattleWon).journey;
  j = J.transition(j, 'conquest_credited', ctxConquestCredited).journey;
  var ctx = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true, summonCompleted: true, battleFought: true, battleWon: true, conquestCredited: true, buildingCardViewed: true };
  var r = J.transition(j, 'building_built', ctx);
  assert.equal(r.ok, false);
  assert.equal(r.journey.state, 'BUILD');
  assert.ok(r.cause.indexOf('no building has been built') >= 0);
});

test('Recorrido completo: WELCOME → EXPLORE en 7 pasos', () => {
  var j = J.createJourney();
  var events = ['map_opened', 'player_arrived', 'node_responded', 'summon_completed', 'battle_won', 'conquest_credited', 'building_built'];
  var contexts = [ctxWithSeals, ctxPlayerAtHome, ctxNodeResponded, ctxSummonCompleted, ctxBattleWon, ctxConquestCredited, ctxBuildingBuilt];
  var expectedStates = ['TRAVEL', 'NODE_0', 'SUMMON', 'BATTLE', 'CONQUEST', 'BUILD', 'EXPLORE'];
  for (var i = 0; i < events.length; i++) {
    var r = J.transition(j, events[i], contexts[i]);
    assert.equal(r.ok, true, 'step ' + i + ' failed: ' + r.cause);
    assert.equal(r.journey.state, expectedStates[i], 'state mismatch at step ' + i);
    j = r.journey;
  }
  assert.equal(j.completed.length, 7);
  assert.equal(j.skipped.length, 0);
});

test('Evento inesperado: rechaza con causa', () => {
  var j = J.createJourney();
  var r = J.transition(j, 'wrong_event', ctxWithSeals);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('unexpected event') >= 0);
});

test('skipStep: registra skipped, no completed (D19)', () => {
  var j = J.createJourney();
  var r = J.skipStep(j, 'walk_to_node');
  assert.equal(r.ok, true);
  assert.equal(r.journey.skipped.length, 1);
  assert.equal(r.journey.skipped[0], 'walk_to_node');
  assert.equal(r.journey.completed.length, 0);
  assert.equal(r.journey.log[0].outcome, 'skipped');
});

test('skipStep: no convierte skipped en completed (D19)', () => {
  var j = J.createJourney();
  j = J.skipStep(j, 'walk_to_node').journey;
  // Even after skip, completed must remain empty
  assert.equal(j.completed.length, 0);
  assert.equal(j.skipped.length, 1);
});

test('skipToExplore: salta a EXPLORE sin fabricar recompensas (D25)', () => {
  var j = J.createJourney();
  var r = J.skipToExplore(j, ctxWithSeals);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'EXPLORE');
  assert.equal(r.journey.completed.length, 0);
  // All remaining steps are marked skipped
  assert.ok(r.journey.skipped.length > 0);
  assert.equal(r.receipt.outcome, 'skipped_to_explore');
});

test('skipToExplore: desde mitad del recorrido, conserva lo completado', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  j = J.transition(j, 'player_arrived', ctxPlayerAtHome).journey;
  // Now at NODE_0, skip the rest
  var r = J.skipToExplore(j, ctxNodeResponded);
  assert.equal(r.ok, true);
  assert.equal(r.journey.state, 'EXPLORE');
  assert.equal(r.journey.completed.length, 2); // walk_to_node, enter_node
  assert.ok(r.journey.skipped.length > 0);
});

test('progress: cuenta correctamente completados y omitidos', () => {
  var j = J.createJourney();
  j = J.transition(j, 'map_opened', ctxWithSeals).journey;
  // Now at TRAVEL, skip the current step (enter_node)
  j = J.skipStep(j, 'enter_node').journey;
  var p = J.progress(j);
  assert.equal(p.state, 'TRAVEL');
  assert.equal(p.completed, 1);
  assert.equal(p.skipped, 1);
  assert.equal(p.total, 7);
});

test('currentSignal: devuelve señal para cada estado', () => {
  var j = J.createJourney();
  var sig = J.currentSignal(j);
  assert.equal(sig.actionId, 'open_map');
  assert.equal(sig.icon, 'map');
  assert.ok(sig.accessibleName.length > 0);
  assert.ok(sig.voiceInstruction.length > 0);
});

test('whatDoNow: explica por qué está bloqueado', () => {
  var j = J.createJourney();
  var answer = J.whatDoNow(j);
  assert.ok(answer.indexOf('NO_DATA') >= 0, 'should explain why blocked: ' + answer);
});

test('whatDoNow: con contexto válido, da instrucción clara', () => {
  var j = J.createJourney();
  j.context = ctxWithSeals;
  var answer = J.whatDoNow(j);
  assert.ok(answer.indexOf('map') >= 0 || answer.indexOf('Map') >= 0, 'should mention map: ' + answer);
});

test('Determinismo: mismo recorrido produce mismo resultado', () => {
  function runJourney() {
    var j = J.createJourney();
    var events = ['map_opened', 'player_arrived', 'node_responded', 'summon_completed', 'battle_won', 'conquest_credited', 'building_built'];
    var contexts = [ctxWithSeals, ctxPlayerAtHome, ctxNodeResponded, ctxSummonCompleted, ctxBattleWon, ctxConquestCredited, ctxBuildingBuilt];
    for (var i = 0; i < events.length; i++) {
      j = J.transition(j, events[i], contexts[i]).journey;
    }
    return JSON.stringify(j.log);
  }
  assert.equal(runJourney(), runJourney());
});

test('Sin Math.random ni Date ni fetch en el contrato', () => {
  var src = readFileSync(fileURLToPath(new URL('../atlas/puros/tutorial_journey.js', import.meta.url)), 'utf8');
  var noComments = src.replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/Math\.random|Date\.now|new Date|performance\.now|fetch\(/.test(noComments), 'contract must be pure');
});

test('Receipt schema: v = preceptoros.journey/1', () => {
  var j = J.createJourney();
  var r = J.transition(j, 'map_opened', ctxWithSeals);
  assert.equal(r.receipt.v, 'preceptoros.journey/1');
  assert.equal(r.receipt.state, 'TRAVEL');
  assert.equal(r.receipt.event, 'map_opened');
  assert.equal(r.receipt.outcome, 'traveling');
});

test('EXPLORE: ya completo, no rechaza eventos', () => {
  var j = J.createJourney();
  var events = ['map_opened', 'player_arrived', 'node_responded', 'summon_completed', 'battle_won', 'conquest_credited', 'building_built'];
  var contexts = [ctxWithSeals, ctxPlayerAtHome, ctxNodeResponded, ctxSummonCompleted, ctxBattleWon, ctxConquestCredited, ctxBuildingBuilt];
  for (var i = 0; i < events.length; i++) {
    j = J.transition(j, events[i], contexts[i]).journey;
  }
  assert.equal(j.state, 'EXPLORE');
  // Any further event returns ok with 'complete'
  var r = J.transition(j, 'anything', {});
  assert.equal(r.ok, true);
  assert.equal(r.receipt.outcome, 'complete');
});
