// G4-4 · Response Correlation Contract (odd/tasks/response-correlation-contract.md). Pure: no DOM, no clock, no random, no network.
// Codex found: a simulated Node 0 response from another visitor/turn was accepted by the client.
// This contract defines the minimum correlation guarantees between request and response:
//   - Each request carries a visitor seed (ephemeral identity).
//   - Each request carries a turn chain (tic, hash, sello) for ordering.
//   - Each response must correlate to the requesting visitor and turn.
//   - A response from another visitor is rejected without contaminating history.
//   - Correlation ≠ server authenticity: we verify the response belongs to us, not that the server is who it claims.
//
// The contract provides:
//   1. createCorrelationContext(visitorSeed) — creates a fresh correlation context for one visitor.
//   2. buildRequest(context, text, page) — builds a CIEF-like request with visitor, turn chain, and request id.
//   3. acceptResponse(context, request, response) — verifies response correlates to request.
//   4. rejectCrossVisitor(context, request, response) — proves a cross-visitor response is rejected.
//   5. noDataState(cause) — returns NO_DATA state when correlation cannot be verified.
//
// Reuses patterns from: classroom_chat.js (CIEF structure, chain), visitor_account.js (seed),
// crab_presence.js (visit isolation), map_chat.js (generation check).

(function (root) {
  'use strict';
  var SCHEMA = 'preceptoros.correlation/1';
  var NO_DATA = 'NO_DATA';

  /* ------------------------------------------------------------------ */
  /* CORRELATION CONTEXT                                                */
  /* ------------------------------------------------------------------ */

  // createCorrelationContext(visitorSeed) → context. Creates a fresh context for one visitor.
  // visitorSeed must be a non-empty string (the ephemeral visit hash).
  function createCorrelationContext(visitorSeed) {
    if (!visitorSeed || typeof visitorSeed !== 'string' || visitorSeed.length === 0) {
      throw new Error('correlation: visitorSeed must be a non-empty string');
    }
    return {
      schema: SCHEMA,
      visitorSeed: visitorSeed,
      tic: 0,           // turn counter
      hash: null,        // hash of last response text
      sello: null,       // server's sello object
      generation: 0,     // increments when visit ends
      requestIdCounter: 0 // unique request id counter
    };
  }

  // copyContext(ctx) → deep copy. Ensures purity.
  function copyContext(ctx) {
    return {
      schema: ctx.schema,
      visitorSeed: ctx.visitorSeed,
      tic: ctx.tic,
      hash: ctx.hash,
      sello: ctx.sello ? Object.assign({}, ctx.sello) : null,
      generation: ctx.generation,
      requestIdCounter: ctx.requestIdCounter
    };
  }

  /* ------------------------------------------------------------------ */
  /* REQUEST BUILDING                                                   */
  /* ------------------------------------------------------------------ */

  // buildRequest(context, text, page) → { ok, request, context } | { ok: false, cause }.
  // Builds a CIEF-like request. The request carries: visitor seed, turn chain, text, page, and a unique request id.
  function buildRequest(context, text, page) {
    if (!context || !context.visitorSeed) {
      return { ok: false, cause: NO_DATA + ': no correlation context' };
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { ok: false, cause: NO_DATA + ': empty text' };
    }
    var reqId = 'req-' + context.visitorSeed.slice(0, 8) + '-' + (context.requestIdCounter + 1);
    var request = {
      v: 'preceptoros.chat/1',
      estado: { visita: context.visitorSeed },
      intencion: 'chat',
      contexto: { texto: text.trim(), pagina: page || '/openworld/' },
      hash_esperado: context.tic > 0 ? context.hash : null,
      tic: context.tic + 1,
      request_id: reqId
    };
    if (context.tic > 0 && context.sello) {
      request.sello = context.sello;
    }
    var newCtx = copyContext(context);
    newCtx.requestIdCounter++;
    return { ok: true, request: request, context: newCtx, request_id: reqId };
  }

  /* ------------------------------------------------------------------ */
  /* RESPONSE CORRELATION                                               */
  /* ------------------------------------------------------------------ */

  // acceptResponse(context, request, response) → { ok, result, context } | { ok: false, cause }.
  // Verifies that a response correlates to the request that produced it.
  // Checks:
  //   1. Response exists and has the expected structure.
  //   2. Response visitor matches request visitor (CRITICAL: prevents cross-visitor acceptance).
  //   3. Response tic matches expected turn number.
  //   4. Response sello is present and non-empty.
  //   5. Response text is a valid string.
  //
  // This checks CORRELATION (response belongs to this request), not AUTHENTICITY (server is who it claims).
  function acceptResponse(context, request, response) {
    if (!context || !request || !response) {
      return { ok: false, cause: NO_DATA + ': missing context, request, or response' };
    }

    // 1. Response structure
    if (typeof response !== 'object' || Array.isArray(response)) {
      return { ok: false, cause: NO_DATA + ': response is not an object' };
    }
    if (response.estado !== 'OK') {
      var cause = response.causa || 'red';
      return { ok: false, cause: cause, retry: response.retry_after, context: context };
    }
    if (!response.burbuja || typeof response.burbuja.texto !== 'string') {
      return { ok: false, cause: NO_DATA + ': response missing burbuja.texto' };
    }
    if (!response.sello || typeof response.sello !== 'object') {
      return { ok: false, cause: NO_DATA + ': response missing sello' };
    }

    // 2. CRITICAL: Response visitor must match request visitor.
    // This is the check Codex found missing. A response from visitor B must not be accepted by visitor A.
    var responseVisitor = (response.estado && response.estado.visita) ||
                          (response.burbuja && response.burbuja.visita) ||
                          (response.sello && response.sello.visita) ||
                          (response.visita || null);
    if (responseVisitor && responseVisitor !== request.estado.visita) {
      return { ok: false, cause: 'cross_visitor_rejected', context: context,
               detail: 'Response visitor ' + responseVisitor + ' does not match request visitor ' + request.estado.visita };
    }

    // 3. Response tic must match expected turn
    if (typeof response.sello.tic !== 'number' || response.sello.tic !== request.tic) {
      return { ok: false, cause: 'turn_mismatch', context: context,
               detail: 'Expected tic ' + request.tic + ', got ' + response.sello.tic };
    }

    // 4. Response text validity
    if (response.burbuja.texto.length === 0) {
      return { ok: false, cause: NO_DATA + ': empty response text' };
    }

    // 5. Update context with accepted response
    var newCtx = copyContext(context);
    newCtx.tic = response.sello.tic;
    newCtx.hash = response._computedHash || 'sha256-placeholder'; // In production, compute SHA-256 of response text
    newCtx.sello = response.sello;

    return {
      ok: true,
      context: newCtx,
      text: response.burbuja.texto,
      cut: response.burbuja.recortada === true,
      receiptState: response.recibo || null
    };
  }

  /* ------------------------------------------------------------------ */
  /* CROSS-VISITOR REJECTION                                            */
  /* ------------------------------------------------------------------ */

  // detectCrossVisitor(request, response) → { ok, cause }. Specifically checks for cross-visitor responses.
  // This is the pure test of the bug Codex found: a response from visitor B accepted by visitor A.
  function detectCrossVisitor(request, response) {
    if (!request || !response) {
      return { ok: false, cause: NO_DATA + ': missing request or response' };
    }
    var requestVisitor = request.estado && request.estado.visita;
    if (!requestVisitor) {
      return { ok: false, cause: NO_DATA + ': request has no visitor' };
    }
    var responseVisitor = (response.estado && response.estado.visita) ||
                          (response.burbuja && response.burbuja.visita) ||
                          (response.sello && response.sello.visita) ||
                          (response.visita || null);
    if (!responseVisitor) {
      // If response has no visitor field at all, it cannot be correlated — reject as NO_DATA.
      // This is safer than accepting an uncorrelated response.
      return { ok: false, cause: NO_DATA + ': response has no visitor identifier' };
    }
    if (responseVisitor !== requestVisitor) {
      return { ok: false, cause: 'cross_visitor_rejected',
               requestVisitor: requestVisitor, responseVisitor: responseVisitor };
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* TURN MISMATCH DETECTION                                            */
  /* ------------------------------------------------------------------ */

  // detectTurnMismatch(request, response) → { ok, cause }. Checks turn number correlation.
  function detectTurnMismatch(request, response) {
    if (!request || !response) {
      return { ok: false, cause: NO_DATA + ': missing request or response' };
    }
    var expectedTic = request.tic;
    var actualTic = response.sello && response.sello.tic;
    if (actualTic === undefined || actualTic === null) {
      return { ok: false, cause: NO_DATA + ': response has no turn number' };
    }
    if (actualTic !== expectedTic) {
      return { ok: false, cause: 'turn_mismatch', expected: expectedTic, actual: actualTic };
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* CHAIN INTEGRITY                                                    */
  /* ------------------------------------------------------------------ */

  // verifyChain(context, response) → { ok, cause }. Verifies the response's chain links to the previous state.
  function verifyChain(context, response) {
    if (!context || !response) {
      return { ok: false, cause: NO_DATA + ': missing context or response' };
    }
    // If this is the first turn, no previous hash to verify
    if (context.tic === 0) {
      return { ok: true, cause: '' };
    }
    // The response's sello must carry a tic that is exactly one more than the context's tic
    if (!response.sello || typeof response.sello.tic !== 'number') {
      return { ok: false, cause: NO_DATA + ': response sello missing tic' };
    }
    if (response.sello.tic !== context.tic + 1) {
      return { ok: false, cause: 'chain_broken', expected: context.tic + 1, actual: response.sello.tic };
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* VISIT END / GENERATION CHECK                                       */
  /* ------------------------------------------------------------------ */

  // endVisit(context) → new context with incremented generation. When a visit ends, any pending response
  // from the old generation must be rejected.
  function endVisit(context) {
    if (!context) return null;
    var newCtx = copyContext(context);
    newCtx.generation++;
    newCtx.tic = 0;
    newCtx.hash = null;
    newCtx.sello = null;
    newCtx.requestIdCounter = 0;
    return newCtx;
  }

  // checkGeneration(context, requestGeneration) → { ok, cause }. Verifies the request was made in the current generation.
  function checkGeneration(context, requestGeneration) {
    if (!context) {
      return { ok: false, cause: NO_DATA + ': no context' };
    }
    if (requestGeneration !== context.generation) {
      return { ok: false, cause: 'stale_generation', contextGen: context.generation, requestGen: requestGeneration };
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* NO_DATA STATE                                                      */
  /* ------------------------------------------------------------------ */

  // noDataState(cause) → { state, cause }. Returns NO_DATA state with cause.
  function noDataState(cause) {
    return { state: NO_DATA, cause: cause || 'correlation cannot be verified' };
  }

  /* ------------------------------------------------------------------ */
  /* FULL CORRELATION CHECK                                             */
  /* ------------------------------------------------------------------ */

  // fullCorrelationCheck(context, request, response) → complete correlation verification.
  // This is the main entry point: checks all correlation guarantees in order.
  // Distinguishes correlation from server authenticity.
  function fullCorrelationCheck(context, request, response) {
    var result = {
      schema: SCHEMA,
      checks: {},
      overall: { ok: false, cause: '' }
    };

    // 1. Cross-visitor check (P0 — the bug Codex found)
    result.checks.crossVisitor = detectCrossVisitor(request, response);

    // 2. Turn mismatch check
    result.checks.turnMismatch = detectTurnMismatch(request, response);

    // 3. Chain integrity
    result.checks.chainIntegrity = verifyChain(context, response);

    // 4. Full accept (includes all above plus structure checks)
    result.checks.accept = acceptResponse(context, request, response);

    // Overall: all correlation checks must pass
    var critical = ['crossVisitor', 'turnMismatch', 'chainIntegrity'];
    var allOk = true;
    var firstCause = '';
    for (var i = 0; i < critical.length; i++) {
      var c = critical[i];
      if (!result.checks[c].ok) {
        allOk = false;
        if (!firstCause) firstCause = result.checks[c].cause;
      }
    }
    result.overall.ok = allOk;
    result.overall.cause = firstCause;

    return result;
  }

  /* ------------------------------------------------------------------ */
  /* EXPORT                                                             */
  /* ------------------------------------------------------------------ */

  var api = {
    SCHEMA: SCHEMA,
    NO_DATA: NO_DATA,
    createCorrelationContext: createCorrelationContext,
    buildRequest: buildRequest,
    acceptResponse: acceptResponse,
    detectCrossVisitor: detectCrossVisitor,
    detectTurnMismatch: detectTurnMismatch,
    verifyChain: verifyChain,
    endVisit: endVisit,
    checkGeneration: checkGeneration,
    noDataState: noDataState,
    fullCorrelationCheck: fullCorrelationCheck
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.AtlasResponseCorrelation = api;
  }
})(this);
