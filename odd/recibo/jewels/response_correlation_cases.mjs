// G4-4 · Response Correlation Contract — test cases.
// Tests the correlation guarantees between request and response.
// Covers: cross-visitor rejection, turn mismatch, chain integrity, generation check, NO_DATA states.
// Includes sabotage cases that would fail without the correlation checks.
// Usage: node --test atlas/response_correlation_cases.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
var require = createRequire(import.meta.url);
var C = require('./puros/response_correlation.js');

// --- FIXTURES ---

var seedA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
var seedB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function makeResponse(visitor, tic, text) {
  return {
    estado: 'OK',
    burbuja: { texto: text || 'Hello from node', visita: visitor },
    sello: { tic: tic, visita: visitor }
  };
}

function makeErrorResponse(cause) {
  return { causa: cause || 'red' };
}

// --- CONTEXT CREATION ---

test('Crear contexto de correlación con seed válido', () => {
  var ctx = C.createCorrelationContext(seedA);
  assert.equal(ctx.visitorSeed, seedA);
  assert.equal(ctx.tic, 0);
  assert.equal(ctx.hash, null);
  assert.equal(ctx.generation, 0);
});

test('Crear contexto con seed vacío lanza error', () => {
  assert.throws(() => C.createCorrelationContext(''), /visitorSeed/);
});

test('Crear contexto con seed nulo lanza error', () => {
  assert.throws(() => C.createCorrelationContext(null), /visitorSeed/);
});

test('Crear contexto con seed numérico lanza error', () => {
  assert.throws(() => C.createCorrelationContext(123), /visitorSeed/);
});

// --- REQUEST BUILDING ---

test('Construir petición con contexto válido', () => {
  var ctx = C.createCorrelationContext(seedA);
  var result = C.buildRequest(ctx, 'Hello node', '/openworld/');
  assert.equal(result.ok, true);
  assert.equal(result.request.estado.visita, seedA);
  assert.equal(result.request.tic, 1);
  assert.equal(result.request.hash_esperado, null);
  assert.ok(result.request.request_id);
});

test('Construir petición sin contexto devuelve NO_DATA', () => {
  var result = C.buildRequest(null, 'Hello', '/openworld/');
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

test('Construir petición con texto vacío devuelve NO_DATA', () => {
  var ctx = C.createCorrelationContext(seedA);
  var result = C.buildRequest(ctx, '', '/openworld/');
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

test('Segunda petición lleva hash_esperado de la primera', () => {
  var ctx = C.createCorrelationContext(seedA);
  var r1 = C.buildRequest(ctx, 'First', '/openworld/');
  assert.equal(r1.request.tic, 1);
  assert.equal(r1.request.hash_esperado, null);

  // Simulate accepting first response
  var resp1 = makeResponse(seedA, 1, 'First reply');
  var accept1 = C.acceptResponse(r1.context, r1.request, resp1);
  assert.equal(accept1.ok, true);

  var r2 = C.buildRequest(accept1.context, 'Second', '/openworld/');
  assert.equal(r2.request.tic, 2);
  assert.ok(r2.request.hash_esperado);
});

test('Cada petición tiene request_id único', () => {
  var ctx = C.createCorrelationContext(seedA);
  var r1 = C.buildRequest(ctx, 'One', '/openworld/');
  var r2 = C.buildRequest(r1.context, 'Two', '/openworld/');
  assert.notEqual(r1.request.request_id, r2.request.request_id);
});

// --- RESPONSE ACCEPTANCE ---

test('Aceptar respuesta correlacionada correctamente', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 1, 'Hello back');
  var result = C.acceptResponse(req.context, req.request, resp);
  assert.equal(result.ok, true);
  assert.equal(result.text, 'Hello back');
  assert.equal(result.context.tic, 1);
});

test('Respuesta cortada se marca correctamente', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 1, 'Short');
  resp.burbuja.recortada = true;
  var result = C.acceptResponse(req.context, req.request, resp);
  assert.equal(result.ok, true);
  assert.equal(result.cut, true);
});

test('Respuesta sin burbuja.texto devuelve NO_DATA', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = { estado: 'OK', burbuja: {}, sello: { tic: 1 } };
  var result = C.acceptResponse(req.context, req.request, resp);
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

test('Respuesta sin sello devuelve NO_DATA', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = { estado: 'OK', burbuja: { texto: 'Hi' } };
  var result = C.acceptResponse(req.context, req.request, resp);
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

test('Respuesta con estado error devuelve causa', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeErrorResponse('tiempo_agotado');
  var result = C.acceptResponse(req.context, req.request, resp);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'tiempo_agotado');
});

// --- CROSS-VISITOR REJECTION (P0 — Codex's bug) ---

test('P0: Respuesta de otro visitante es rechazada', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello from A', '/openworld/');

  // Simulated response from visitor B — the bug Codex found
  var respB = makeResponse(seedB, 1, 'Hello from B');

  var result = C.acceptResponse(reqA.context, reqA.request, respB);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'cross_visitor_rejected');
});

test('P0: detectCrossVisitor rechaza respuesta cruzada', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello', '/openworld/');
  var respB = makeResponse(seedB, 1, 'Not for A');

  var result = C.detectCrossVisitor(reqA.request, respB);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'cross_visitor_rejected');
  assert.equal(result.requestVisitor, seedA);
  assert.equal(result.responseVisitor, seedB);
});

test('P0: detectCrossVisitor acepta respuesta del mismo visitante', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello', '/openworld/');
  var respA = makeResponse(seedA, 1, 'For A');

  var result = C.detectCrossVisitor(reqA.request, respA);
  assert.equal(result.ok, true);
});

test('P0: Respuesta sin visitante es NO_DATA, no éxito', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello', '/openworld/');
  var respNoVisitor = { estado: 'OK', burbuja: { texto: 'No visitor' }, sello: { tic: 1 } };

  var result = C.detectCrossVisitor(reqA.request, respNoVisitor);
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

test('P0: Dos visitantes, cada uno recibe su respuesta', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var ctxB = C.createCorrelationContext(seedB);

  var reqA = C.buildRequest(ctxA, 'Question A', '/openworld/');
  var reqB = C.buildRequest(ctxB, 'Question B', '/openworld/');

  var respA = makeResponse(seedA, 1, 'Answer A');
  var respB = makeResponse(seedB, 1, 'Answer B');

  // A gets A's response — accepted
  var resultA = C.acceptResponse(reqA.context, reqA.request, respA);
  assert.equal(resultA.ok, true);
  assert.equal(resultA.text, 'Answer A');

  // B gets B's response — accepted
  var resultB = C.acceptResponse(reqB.context, reqB.request, respB);
  assert.equal(resultB.ok, true);
  assert.equal(resultB.text, 'Answer B');

  // A gets B's response — rejected
  var crossA = C.acceptResponse(reqA.context, reqA.request, respB);
  assert.equal(crossA.ok, false);
  assert.equal(crossA.cause, 'cross_visitor_rejected');

  // B gets A's response — rejected
  var crossB = C.acceptResponse(reqB.context, reqB.request, respA);
  assert.equal(crossB.ok, false);
  assert.equal(crossB.cause, 'cross_visitor_rejected');
});

// --- TURN MISMATCH ---

test('Turn mismatch: tic incorrecto es rechazado', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 5, 'Wrong turn'); // tic=5 but expected tic=1

  var result = C.acceptResponse(req.context, req.request, resp);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'turn_mismatch');
});

test('detectTurnMismatch rechaza tic incorrecto', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 99, 'Wrong');

  var result = C.detectTurnMismatch(req.request, resp);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'turn_mismatch');
  assert.equal(result.expected, 1);
  assert.equal(result.actual, 99);
});

test('detectTurnMismatch acepta tic correcto', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 1, 'Correct');

  var result = C.detectTurnMismatch(req.request, resp);
  assert.equal(result.ok, true);
});

test('Respuesta sin tic en sello es NO_DATA', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = { estado: 'OK', burbuja: { texto: 'Hi', visita: seedA }, sello: {} };

  var result = C.detectTurnMismatch(req.request, resp);
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

// --- CHAIN INTEGRITY ---

test('Primera respuesta no requiere cadena previa', () => {
  var ctx = C.createCorrelationContext(seedA);
  var resp = makeResponse(seedA, 1, 'First');

  var result = C.verifyChain(ctx, resp);
  assert.equal(result.ok, true);
});

test('Cadena rota: tic salta de 1 a 3', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'First', '/openworld/');
  var resp1 = makeResponse(seedA, 1, 'Reply 1');
  var accept1 = C.acceptResponse(req.context, req.request, resp1);
  assert.equal(accept1.ok, true);

  // Now context.tic = 1, next should be 2
  var resp3 = makeResponse(seedA, 3, 'Reply 3');
  var result = C.verifyChain(accept1.context, resp3);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'chain_broken');
  assert.equal(result.expected, 2);
  assert.equal(result.actual, 3);
});

test('Cadena correcta: tic avanza secuencialmente', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'First', '/openworld/');
  var resp1 = makeResponse(seedA, 1, 'Reply 1');
  var accept1 = C.acceptResponse(req.context, req.request, resp1);

  var result = C.verifyChain(accept1.context, makeResponse(seedA, 2, 'Reply 2'));
  assert.equal(result.ok, true);
});

// --- VISIT END / GENERATION ---

test('endVisit incrementa generación y resetea cadena', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 1, 'Reply');
  var accept = C.acceptResponse(req.context, req.request, resp);
  assert.equal(accept.context.tic, 1);

  var ended = C.endVisit(accept.context);
  assert.equal(ended.generation, 1);
  assert.equal(ended.tic, 0);
  assert.equal(ended.hash, null);
});

test('checkGeneration rechaza petición de generación antigua', () => {
  var ctx = C.createCorrelationContext(seedA);
  var gen = ctx.generation;
  var ended = C.endVisit(ctx);

  var result = C.checkGeneration(ended, gen);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'stale_generation');
});

test('checkGeneration acepta petición de generación actual', () => {
  var ctx = C.createCorrelationContext(seedA);
  var result = C.checkGeneration(ctx, ctx.generation);
  assert.equal(result.ok, true);
});

// --- FULL CORRELATION CHECK ---

test('fullCorrelationCheck pasa con respuesta correcta', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 1, 'Reply');

  var result = C.fullCorrelationCheck(req.context, req.request, resp);
  assert.equal(result.overall.ok, true);
  assert.equal(result.checks.crossVisitor.ok, true);
  assert.equal(result.checks.turnMismatch.ok, true);
  assert.equal(result.checks.chainIntegrity.ok, true);
});

test('fullCorrelationCheck falla con respuesta cruzada', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedB, 1, 'Not for A');

  var result = C.fullCorrelationCheck(req.context, req.request, resp);
  assert.equal(result.overall.ok, false);
  assert.equal(result.checks.crossVisitor.ok, false);
});

test('fullCorrelationCheck falla con turn mismatch', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 99, 'Wrong turn');

  var result = C.fullCorrelationCheck(req.context, req.request, resp);
  assert.equal(result.overall.ok, false);
  assert.equal(result.checks.turnMismatch.ok, false);
});

// --- NO_DATA STATES ---

test('noDataState devuelve estado NO_DATA con causa', () => {
  var result = C.noDataState('some cause');
  assert.equal(result.state, 'NO_DATA');
  assert.equal(result.cause, 'some cause');
});

test('noDataState sin causa usa mensaje por defecto', () => {
  var result = C.noDataState();
  assert.equal(result.state, 'NO_DATA');
  assert.ok(result.cause);
});

test('acceptResponse con respuesta nula devuelve NO_DATA', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var result = C.acceptResponse(req.context, req.request, null);
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

test('acceptResponse con respuesta array devuelve NO_DATA', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var result = C.acceptResponse(req.context, req.request, []);
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
});

// --- SABOTAGE CASES ---

test('SABOTAGE: Sin la verificación cross-visitor, la respuesta de B se aceptaría', () => {
  // This test demonstrates the bug: if we only check structure and tic,
  // a response from visitor B would be accepted by visitor A.
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello', '/openworld/');
  var respB = makeResponse(seedB, 1, 'Imposter response');

  // The contract correctly rejects this
  var result = C.acceptResponse(reqA.context, reqA.request, respB);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'cross_visitor_rejected');

  // Verify the context is NOT contaminated
  assert.equal(reqA.context.tic, 0); // Still at tic 0, not advanced
});

test('SABOTAGE: Respuesta con tic correcto pero visitante incorrecto es rechazada', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello', '/openworld/');
  // Same tic as expected, but wrong visitor
  var respB = makeResponse(seedB, 1, 'Right tic, wrong visitor');

  var result = C.acceptResponse(reqA.context, reqA.request, respB);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'cross_visitor_rejected');
});

test('SABOTAGE: Respuesta con visitante correcto pero tic incorrecto es rechazada', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello', '/openworld/');
  // Right visitor, wrong tic
  var respWrongTic = makeResponse(seedA, 99, 'Right visitor, wrong tic');

  var result = C.acceptResponse(reqA.context, reqA.request, respWrongTic);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'turn_mismatch');
});

test('SABOTAGE: Después de endVisit, respuesta antigua es rechazada por generación', () => {
  var ctx = C.createCorrelationContext(seedA);
  var gen = ctx.generation;
  var ended = C.endVisit(ctx);

  var result = C.checkGeneration(ended, gen);
  assert.equal(result.ok, false);
  assert.equal(result.cause, 'stale_generation');
});

test('SABOTAGE: Respuesta sin firma de visitante no se acepta como éxito', () => {
  var ctxA = C.createCorrelationContext(seedA);
  var reqA = C.buildRequest(ctxA, 'Hello', '/openworld/');
  var respNoVisitor = {
    estado: 'OK',
    burbuja: { texto: 'No visitor field at all' },
    sello: { tic: 1 }
  };

  var result = C.detectCrossVisitor(reqA.request, respNoVisitor);
  assert.equal(result.ok, false);
  assert.ok(result.cause.indexOf('NO_DATA') >= 0);
  // An uncorrelated response is safer rejected than accepted
});

test('SABOTAGE: fullCorrelationCheck distingue correlación de autenticidad', () => {
  // The contract checks correlation (response belongs to this request),
  // not authenticity (server is who it claims). A correlated response
  // from a spoofed server would pass correlation but not authenticity.
  // This test verifies the contract does not claim authenticity.
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 1, 'Reply');

  var result = C.fullCorrelationCheck(req.context, req.request, resp);
  assert.equal(result.overall.ok, true);
  // The result has no "authenticity" field — correlation ≠ authenticity
  assert.equal(result.overall.authenticity, undefined);
});

// --- PURITY ---

test('Pureza: el contrato no modifica el contexto original', () => {
  var ctx = C.createCorrelationContext(seedA);
  var originalTic = ctx.tic;
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedA, 1, 'Reply');
  C.acceptResponse(req.context, req.request, resp);

  // Original context unchanged
  assert.equal(ctx.tic, originalTic);
});

test('Pureza: detectCrossVisitor no tiene efectos secundarios', () => {
  var ctx = C.createCorrelationContext(seedA);
  var req = C.buildRequest(ctx, 'Hello', '/openworld/');
  var resp = makeResponse(seedB, 1, 'Cross');
  var reqCopy = JSON.parse(JSON.stringify(req.request));

  C.detectCrossVisitor(req.request, resp);

  // Request unchanged
  assert.deepEqual(req.request, reqCopy);
});
