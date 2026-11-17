// G4-2 · First Journey Contract — visitor isolation tests (odd/tasks/first-journey-contract.md).
// Tests: two visitors must not share progress. Independent journeys, independent logs.
// If one visitor reaches the hospital, the other must not receive that progress accidentally.
// If one abandons, the other can continue. If both are at Node 0, instructions correspond to each visitor.
// Usage: node --test atlas/tutorial_isolation_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const J = req('../atlas/puros/tutorial_journey.js');

const sealsWithHome = { home: 'LIVE' };
const ctxWithSeals = { seals: sealsWithHome };
const ctxPlayerAtHome = { seals: sealsWithHome, playerNode: 'home' };
const ctxNodeResponded = { seals: sealsWithHome, playerNode: 'home', nodeResponded: true };

// --- BASIC ISOLATION ---

test('createVisitorJourney: crea viaje con visitorId', () => {
  var j = J.createVisitorJourney('visitor-A');
  assert.equal(j.visitorId, 'visitor-A');
  assert.equal(j.state, 'WELCOME');
  assert.equal(j.log.length, 0);
});

test('isolate: dos visitantes diferentes son aislados', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');
  var r = J.isolate(jA, jB);
  assert.equal(r.ok, true);
});

test('isolate: mismo visitorId no es aislado', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-A');
  var r = J.isolate(jA, jB);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('same visitor id') >= 0);
});

test('isolate: un viaje nulo no es aislado', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var r = J.isolate(jA, null);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('missing journey') >= 0);
});

// --- INDEPENDENT PROGRESS ---

test('Progreso independiente: A avanza, B se queda en WELCOME', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  // A advances to TRAVEL
  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  assert.equal(jA.state, 'TRAVEL');
  assert.equal(jB.state, 'WELCOME');
});

test('Progreso independiente: A completa el tutorial, B no recibe progreso', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  // A completes the full journey
  var events = ['map_opened', 'player_arrived', 'node_responded'];
  var contexts = [ctxWithSeals, ctxPlayerAtHome, ctxNodeResponded];
  for (var i = 0; i < events.length; i++) {
    jA = J.transition(jA, events[i], contexts[i]).journey;
  }
  assert.equal(jA.state, 'SUMMON');
  assert.equal(jA.completed.length, 3);

  // B should still be at WELCOME
  assert.equal(jB.state, 'WELCOME');
  assert.equal(jB.completed.length, 0);
  assert.equal(jB.skipped.length, 0);
});

test('Progreso independiente: A omite, B no hereda los skips', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  jA = J.skipToExplore(jA, ctxWithSeals).journey;
  assert.equal(jA.state, 'EXPLORE');
  assert.ok(jA.skipped.length > 0);

  // B should not have inherited A's skips
  assert.equal(jB.state, 'WELCOME');
  assert.equal(jB.skipped.length, 0);
});

// --- INDEPENDENT LOGS ---

test('Logs independientes: los logs no comparten referencia', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  assert.notEqual(jA.log, jB.log);
  assert.notEqual(jA.log[0], jB.log[0]); // B has no log entries
});

test('Logs independientes: modificar A no afecta B', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  jA = J.transition(jA, 'player_arrived', ctxPlayerAtHome).journey;

  // B's log should still be empty
  assert.equal(jB.log.length, 0);
  assert.equal(jA.log.length, 2);
});

// --- BOTH AT NODE 0 ---

test('Ambos en NODE_0: instrucciones corresponden a cada visitante', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  // Both advance to NODE_0
  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  jA = J.transition(jA, 'player_arrived', ctxPlayerAtHome).journey;
  jB = J.transition(jB, 'map_opened', ctxWithSeals).journey;
  jB = J.transition(jB, 'player_arrived', ctxPlayerAtHome).journey;

  assert.equal(jA.state, 'NODE_0');
  assert.equal(jB.state, 'NODE_0');

  // Both should have the same signal (same state), but independent journeys
  var sigA = J.currentSignal(jA);
  var sigB = J.currentSignal(jB);
  assert.equal(sigA.actionId, sigB.actionId); // Same action for same state
  assert.notEqual(jA, jB); // But different journey objects
});

test('Ambos en NODE_0: A responde, B no hereda', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  // Both advance to NODE_0
  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  jA = J.transition(jA, 'player_arrived', ctxPlayerAtHome).journey;
  jB = J.transition(jB, 'map_opened', ctxWithSeals).journey;
  jB = J.transition(jB, 'player_arrived', ctxPlayerAtHome).journey;

  // A's node responds
  jA = J.transition(jA, 'node_responded', ctxNodeResponded).journey;
  assert.equal(jA.state, 'SUMMON');

  // B should still be at NODE_0
  assert.equal(jB.state, 'NODE_0');
});

// --- ONE ABANDONS, OTHER CONTINUES ---

test('Uno abandona: el otro puede continuar', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  // A advances partially
  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  jA = J.transition(jA, 'player_arrived', ctxPlayerAtHome).journey;

  // A abandons (skips to explore)
  jA = J.skipToExplore(jA, ctxWithSeals).journey;
  assert.equal(jA.state, 'EXPLORE');

  // B can still start and advance independently
  jB = J.transition(jB, 'map_opened', ctxWithSeals).journey;
  assert.equal(jB.state, 'TRAVEL');
  jB = J.transition(jB, 'player_arrived', ctxPlayerAtHome).journey;
  assert.equal(jB.state, 'NODE_0');
});

// --- SIGNALS ARE STATE-BASED, NOT VISITOR-BASED ---

test('Señales: mismo estado, misma señal, pero viajes independientes', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  // Both at WELCOME
  var sigA = J.currentSignal(jA);
  var sigB = J.currentSignal(jB);
  assert.equal(sigA.actionId, 'open_map');
  assert.equal(sigB.actionId, 'open_map');

  // A advances
  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  sigA = J.currentSignal(jA);
  assert.equal(sigA.actionId, 'walk_to_node');

  // B still at WELCOME
  sigB = J.currentSignal(jB);
  assert.equal(sigB.actionId, 'open_map');
});

// --- WHAT DO NOW — INDEPENDENT ---

test('¿Qué hago ahora?: A y B reciben instrucciones independientes', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  jA = J.transition(jA, 'player_arrived', ctxPlayerAtHome).journey;

  var answerA = J.whatDoNow(jA);
  var answerB = J.whatDoNow(jB);

  // A is at NODE_0, B is at WELCOME — different answers
  assert.ok(answerA.indexOf('Enter') >= 0 || answerA.indexOf('enter') >= 0 || answerA.indexOf('NO_DATA') >= 0);
  assert.ok(answerB.indexOf('map') >= 0 || answerB.indexOf('Map') >= 0 || answerB.indexOf('NO_DATA') >= 0);
});

// --- PROGRESS — INDEPENDENT ---

test('Progress: A y B tienen progreso independiente', () => {
  var jA = J.createVisitorJourney('visitor-A');
  var jB = J.createVisitorJourney('visitor-B');

  jA = J.transition(jA, 'map_opened', ctxWithSeals).journey;
  jA = J.transition(jA, 'player_arrived', ctxPlayerAtHome).journey;

  var pA = J.progress(jA);
  var pB = J.progress(jB);

  assert.equal(pA.completed, 2);
  assert.equal(pB.completed, 0);
  assert.equal(pA.state, 'NODE_0');
  assert.equal(pB.state, 'WELCOME');
});
