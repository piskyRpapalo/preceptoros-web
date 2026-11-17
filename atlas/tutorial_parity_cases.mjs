// G4-2 · First Journey Contract — parity tests (odd/tasks/first-journey-contract.md).
// Tests: Eye/Ear/Machine parity for all 9 required events.
// NO_DATA is never transformed into success.
// Usage: node --test atlas/tutorial_parity_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const J = req('../atlas/puros/tutorial_journey.js');

// --- PARITY TABLE STRUCTURE ---

test('PARITY_TABLE: 9 eventos definidos', () => {
  var keys = Object.keys(J.PARITY_TABLE);
  assert.equal(keys.length, 9);
});

test('PARITY_TABLE: cada evento tiene eye, ear, machine', () => {
  var keys = Object.keys(J.PARITY_TABLE);
  for (var i = 0; i < keys.length; i++) {
    var entry = J.PARITY_TABLE[keys[i]];
    assert.ok(entry.eye !== undefined, keys[i] + ' missing eye');
    assert.ok(entry.ear !== undefined, keys[i] + ' missing ear');
    assert.ok(entry.machine !== undefined, keys[i] + ' missing machine');
  }
});

test('PARITY_TABLE: cada eye tiene marker, card, animation', () => {
  var keys = Object.keys(J.PARITY_TABLE);
  for (var i = 0; i < keys.length; i++) {
    var eye = J.PARITY_TABLE[keys[i]].eye;
    assert.ok(eye.marker !== undefined, keys[i] + ' eye missing marker');
    assert.ok(eye.card !== undefined, keys[i] + ' eye missing card');
    assert.ok(eye.animation !== undefined, keys[i] + ' eye missing animation');
  }
});

test('PARITY_TABLE: cada machine tiene state y receipt', () => {
  var keys = Object.keys(J.PARITY_TABLE);
  for (var i = 0; i < keys.length; i++) {
    var machine = J.PARITY_TABLE[keys[i]].machine;
    assert.ok(machine.state !== undefined, keys[i] + ' machine missing state');
    assert.ok(machine.receipt !== undefined, keys[i] + ' machine missing receipt');
    assert.equal(machine.receipt.v, 'preceptoros.journey/1', keys[i] + ' receipt schema mismatch');
  }
});

// --- SPECIFIC EVENTS ---

test('Invocación completada: eye muestra glow, ear confirma, machine avanza a BATTLE', () => {
  var p = J.parityFor('summon_completed');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'summon_glow');
  assert.equal(p.eye.card, 'unit_card');
  assert.ok(p.ear.indexOf('NO_DATA') === -1, 'success should not say NO_DATA');
  assert.equal(p.machine.state, 'BATTLE');
  assert.equal(p.machine.receipt.outcome, 'ok');
});

test('Invocación rechazada: eye muestra error, ear dice NO_DATA, machine se queda en SUMMON', () => {
  var p = J.parityFor('summon_rejected');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'summon_fail');
  assert.ok(p.ear.indexOf('NO_DATA') === 0, 'rejected should start with NO_DATA');
  assert.equal(p.machine.state, 'SUMMON');
  assert.equal(p.machine.receipt.outcome, 'rejected');
});

test('Combate perdido: eye muestra derrota, ear dice NO_DATA, machine se queda en BATTLE', () => {
  var p = J.parityFor('battle_lost');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'defeat');
  assert.ok(p.ear.indexOf('NO_DATA') === 0, 'lost should start with NO_DATA');
  assert.equal(p.machine.state, 'BATTLE');
  assert.equal(p.machine.receipt.outcome, 'lost');
});

test('Combate ganado: eye muestra victoria, ear confirma, machine avanza a CONQUEST', () => {
  var p = J.parityFor('battle_won');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'victory');
  assert.ok(p.ear.indexOf('NO_DATA') === -1, 'victory should not say NO_DATA');
  assert.equal(p.machine.state, 'CONQUEST');
  assert.equal(p.machine.receipt.outcome, 'won');
});

test('Conquista local: eye muestra claim, ear confirma, machine en CONQUEST', () => {
  var p = J.parityFor('conquest_local');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'claimed');
  assert.ok(p.ear.indexOf('NO_DATA') === -1);
  assert.equal(p.machine.state, 'CONQUEST');
  assert.equal(p.machine.receipt.outcome, 'claimed');
});

test('Conquista acreditada: eye muestra sello, ear confirma, machine avanza a BUILD', () => {
  var p = J.parityFor('conquest_credited');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'credited');
  assert.ok(p.ear.indexOf('NO_DATA') === -1);
  assert.equal(p.machine.state, 'BUILD');
  assert.equal(p.machine.receipt.outcome, 'credited');
});

test('Edificio desbloqueado: eye muestra blueprint, ear informa, machine en BUILD', () => {
  var p = J.parityFor('building_unlocked');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'build_ready');
  assert.ok(p.ear.indexOf('NO_DATA') === -1);
  assert.equal(p.machine.state, 'BUILD');
  assert.equal(p.machine.receipt.outcome, 'unlocked');
});

test('Node 0 sin respuesta: eye muestra NO_DATA, ear dice NO_DATA, machine se queda en NODE_0', () => {
  var p = J.parityFor('node0_no_response');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'no_data');
  assert.ok(p.ear.indexOf('NO_DATA') === 0, 'no response should start with NO_DATA');
  assert.equal(p.machine.state, 'NODE_0');
  assert.equal(p.machine.receipt.outcome, 'no_data');
});

test('Recompensa pendiente de validación: eye muestra spinner, ear informa, machine en CONQUEST', () => {
  var p = J.parityFor('reward_pending');
  assert.ok(p !== null);
  assert.equal(p.eye.marker, 'pending');
  assert.ok(p.ear.indexOf('NO_DATA') === -1, 'pending is not a failure');
  assert.equal(p.machine.state, 'CONQUEST');
  assert.equal(p.machine.receipt.outcome, 'pending');
});

// --- NO_DATA NEVER BECOMES SUCCESS ---

test('NO_DATA nunca se transforma en éxito: summon_rejected no es ok', () => {
  var p = J.parityFor('summon_rejected');
  assert.equal(p.machine.receipt.outcome, 'rejected');
  assert.notEqual(p.machine.receipt.outcome, 'ok');
});

test('NO_DATA nunca se transforma en éxito: battle_lost no es won', () => {
  var p = J.parityFor('battle_lost');
  assert.equal(p.machine.receipt.outcome, 'lost');
  assert.notEqual(p.machine.receipt.outcome, 'won');
});

test('NO_DATA nunca se transforma en éxito: node0_no_response no es ok', () => {
  var p = J.parityFor('node0_no_response');
  assert.equal(p.machine.receipt.outcome, 'no_data');
  assert.notEqual(p.machine.receipt.outcome, 'ok');
});

// --- parityFor returns null for unknown events ---

test('parityFor: evento desconocido devuelve null', () => {
  assert.equal(J.parityFor('unknown_event'), null);
});

test('parityFor: evento vacío devuelve null', () => {
  assert.equal(J.parityFor(''), null);
});

// --- EYE/EAR/MACHINE CONSISTENCY ---

test('Consistencia: si ear dice NO_DATA, outcome no es ok', () => {
  var keys = Object.keys(J.PARITY_TABLE);
  for (var i = 0; i < keys.length; i++) {
    var entry = J.PARITY_TABLE[keys[i]];
    if (entry.ear.indexOf('NO_DATA') === 0) {
      assert.notEqual(entry.machine.receipt.outcome, 'ok', keys[i] + ': ear says NO_DATA but outcome is ok');
    }
  }
});

test('Consistencia: si outcome es ok, ear no dice NO_DATA', () => {
  var keys = Object.keys(J.PARITY_TABLE);
  for (var i = 0; i < keys.length; i++) {
    var entry = J.PARITY_TABLE[keys[i]];
    if (entry.machine.receipt.outcome === 'ok') {
      assert.ok(entry.ear.indexOf('NO_DATA') === -1, keys[i] + ': outcome is ok but ear says NO_DATA');
    }
  }
});
