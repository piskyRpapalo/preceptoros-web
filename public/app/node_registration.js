/* Proposed phone flow. The phone holds no signing function. */
(function (root) {
  'use strict';
  var schemaName = 'preceptoros.cedula-nodo/1';
  var nodePattern = /^nodo\.[0-9]{1,6}\.[a-z0-9][a-z0-9-]{0,30}$/;
  var stateNames = Object.freeze({ draft: 'draft', preview: 'preview', consented: 'consented',
    submitting: 'submitting', pendingUntrusted: 'pending_untrusted', catalogStub: 'catalog_stub', failed: 'failed' });
  var doorOneUrl = 'https://api.preceptoros.org/api/v1/cedulas';

  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (key) {
        return JSON.stringify(key) + ':' + canonical(value[key]);
      }).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  async function digest(value) {
    if (!root.crypto || !root.crypto.subtle || !root.TextEncoder) throw new Error('secure_hash_unavailable');
    var bytes = new root.TextEncoder().encode(value);
    var hash = await root.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  async function createRequest(node) {
    if (!nodePattern.test(String(node || ''))) throw new Error('invalid_node_name');
    var cedula = { esquema: schemaName, nodo: node, admin: null, dispositivos: [],
      firma: null, firma_ssh: null, autenticidad: 'NO_DATA' };
    cedula.sha256 = await digest(canonical(cedula));
    return cedula;
  }

  // Aduana intake contract (source: aduana/src/index.js on main 5f58d76).
  // The historical createRequest/doorOneAdapter above and below remain dry-run stubs;
  // neither is evidence that the phone was admitted.
  var hex64 = /^[0-9a-f]{64}$/;
  var deviceStates = Object.freeze(['solicitado', 'linkeado', 'revocado']);
  function canonicalAduana(value) {
    // Aduana's shaBytes calls canonicalJson(value, true): ascii-escaped canonical JSON.
    return canonical(value).replace(/[^\x00-\x7f]/g, function (ch) {
      return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
    });
  }
  function plainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
  function requireHex(value, field) {
    if (!hex64.test(value || '')) throw new Error('invalid_' + field);
  }
  function bytesOf(value) {
    return new root.TextEncoder().encode(value).length;
  }

  // Owner-supplied digests are NOT invented, signed, or proved by this client.
  // Empty firma_ssh is syntactically accepted by Aduana only as an unsigned intake
  // when the anchor is absent; it never grants approval or LIVE.
  async function createAduanaRequest(input) {
    if (!plainObject(input) || !nodePattern.test(input.node || '')) throw new Error('invalid_node_name');
    requireHex(input.adminSha256, 'admin_sha256');
    requireHex(input.planSha256, 'plan_sha256');
    var devices = input.devices === undefined ? [] : input.devices;
    if (!Array.isArray(devices) || devices.length > 128 ||
        !devices.every(function (d) { return plainObject(d) && hex64.test(d.clave || '')
          && deviceStates.includes(d.estado); })) throw new Error('invalid_devices');
    var signature = input.firmaSsh === undefined ? '' : input.firmaSsh;
    if (typeof signature !== 'string' || signature.length > 16384) throw new Error('invalid_firma_ssh');
    var cedula = { esquema: schemaName, nodo: input.node, admin: input.adminSha256,
      dispositivos: devices.map(function (d) { return { clave: d.clave, estado: d.estado }; }),
      plan_sha256: input.planSha256, firma_ssh: signature };
    cedula.sha256 = await digest(canonicalAduana(cedula));
    if (bytesOf(JSON.stringify({ cedula: cedula })) > 24576) throw new Error('cedula_too_large');
    return cedula;
  }

  async function verifyAduanaReceipt(cedula, reply, status) {
    if (!plainObject(cedula) || !hex64.test(cedula.sha256 || '')) throw new Error('invalid_cedula');
    if (status !== 200 && status !== 202) throw new Error('admission_http_rejected');
    if (!plainObject(reply) || !plainObject(reply.recibo)) throw new Error('receipt_missing');
    var receipt = reply.recibo;
    if (receipt.esquema !== 'preceptoros.recibo-cedula/1' ||
        !hex64.test(receipt.recibo_sha256 || '') ||
        receipt.credential_sha256 !== cedula.sha256 ||
        receipt.node_id !== cedula.nodo ||
        receipt.admin_sha256 !== cedula.admin ||
        receipt.plan_sha256 !== cedula.plan_sha256 ||
        !['pendiente', 'verificado'].includes(receipt.estado) ||
        reply.estado !== receipt.estado || reply.causa !== receipt.causa ||
        !(receipt.causa === null || typeof receipt.causa === 'string') ||
        typeof receipt.recibido !== 'string' ||
        !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(receipt.recibido) ||
        !Number.isFinite(Date.parse(receipt.recibido))) throw new Error('receipt_unverified');
    var unsigned = Object.assign({}, receipt);
    delete unsigned.recibo_sha256;
    if (await digest(canonicalAduana(unsigned)) !== receipt.recibo_sha256) throw new Error('receipt_hash_mismatch');
    if (!plainObject(reply.paquete) ||
        reply.paquete.esquema !== 'preceptoros/cedula-nodo/1' ||
        !Array.isArray(reply.paquete.pares) || reply.paquete.pares.length !== 1 ||
        reply.paquete.pares[0].sha256 !== cedula.sha256) throw new Error('receipt_package_mismatch');
    // Receipt digest checks integrity, not authorship. 'verificado' from Aduana
    // still does not prove operator approval, heartbeat, or public LIVE.
    return Object.freeze({
      state: receipt.estado === 'pendiente' ? 'pending' : 'submitted',
      aduanaState: receipt.estado, cause: receipt.causa,
      receipt: receipt, receiptIntegrity: 'sha256_match_not_signature',
      approved: false, live: false
    });
  }

  // Injection point for Android's strictly allowlisted HTTPS native transport.
  // No root.fetch fallback, no traffic, and no private-rack endpoint here.
  function aduanaAdapter(send) {
    return {
      endpoint: doorOneUrl,
      submit: async function (cedula, consent) {
        if (consent !== true) throw new Error('explicit_consent_required');
        if (typeof send !== 'function') throw new Error('native_https_transport_required');
        if (!plainObject(cedula) || cedula.esquema !== schemaName ||
            !nodePattern.test(cedula.nodo || '') || !hex64.test(cedula.admin || '') ||
            !hex64.test(cedula.plan_sha256 || '') || !Array.isArray(cedula.dispositivos) ||
            typeof cedula.firma_ssh !== 'string' || !hex64.test(cedula.sha256 || '')) {
          throw new Error('invalid_cedula');
        }
        var unsigned = Object.assign({}, cedula);
        delete unsigned.sha256;
        if (await digest(canonicalAduana(unsigned)) !== cedula.sha256) throw new Error('cedula_hash_mismatch');
        var body = JSON.stringify({ cedula: cedula });
        if (bytesOf(body) > 24576) throw new Error('cedula_too_large');
        var response = await send(doorOneUrl, { method: 'POST', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }, body: body });
        var json;
        try { json = await response.json(); } catch (_error) { throw new Error('invalid_response_json'); }
        return verifyAduanaReceipt(cedula, json, response.status);
      }
    };
  }

  // Preliminary deployment is a review request, NOT the signed cédula protocol.
  // Brain owns the distinct request endpoint and reply schema; until that
  // contract is integrated this client cannot claim a submitted request.
  var deploymentStates = Object.freeze({
    draft: 'DRAFT_ONLY', requested: 'REQUESTED', pending: 'PENDING',
    approved: 'APPROVED', live: 'LIVE', rejected: 'REJECTED', unknown: 'NO_DATA'
  });

  function deploymentDraft(node, purpose) {
    if (!nodePattern.test(String(node || ''))) throw new Error('invalid_node_name');
    if (typeof purpose !== 'string' || !purpose.trim() || purpose.trim().length > 512) {
      throw new Error('invalid_deployment_purpose');
    }
    return Object.freeze({ node: node, purpose: purpose.trim(), state: deploymentStates.draft });
  }

  function deploymentEvidence(state, evidence) {
    // An arbitrary server string, receipt digest, visitor identity or HTTP
    // status can never authorize a rack operation or public liveness.
    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return deploymentStates.unknown;
    if (state === deploymentStates.draft) return deploymentStates.draft;
    if ((state === deploymentStates.requested || state === deploymentStates.pending) &&
        evidence.preliminaryReceiptValidated === true &&
        typeof evidence.trackingId === 'string' &&
        /^[a-z0-9][a-z0-9._-]{7,119}$/i.test(evidence.trackingId) &&
        evidence.requestNode === evidence.expectedNode) return state;
    if (state === deploymentStates.rejected &&
        evidence.operatorDecisionVerified === true &&
        evidence.preliminaryReceiptValidated === true) return state;
    if (state === deploymentStates.approved &&
        evidence.operatorDecisionVerified === true &&
        evidence.signedAdmissionVerified === true) return state;
    if (state === deploymentStates.live &&
        evidence.operatorDecisionVerified === true &&
        evidence.signedAdmissionVerified === true &&
        evidence.heartbeatFreshVerified === true &&
        evidence.publicWorldVisible === true) return state;
    return deploymentStates.unknown;
  }

  async function requestDeploymentReview(draft, consent, nativeBridge) {
    if (consent !== true) throw new Error('explicit_consent_required');
    if (!draft || draft.state !== deploymentStates.draft ||
        !nodePattern.test(draft.node || '')) throw new Error('invalid_deployment_draft');
    if (!nativeBridge || typeof nativeBridge.requestPreliminary !== 'function') {
      throw new Error('native_preliminary_request_not_available');
    }
    // No WebView fetch: Android owns the allowlisted HTTPS and a second
    // native consent confirmation. The native bridge must bind the installed
    // identity, route, signed server response and caller origin.
    var result = await nativeBridge.requestPreliminary({
      node: draft.node, purpose: draft.purpose, consent: true
    });
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new Error('preliminary_receipt_unverified');
    }
    // Brain has not yet published the authoritative receipt format.
    // Never accept an arbitrary mock or HTTP 200 as a real tracking receipt.
    if (result.contractVerified !== true ||
        result.preliminaryReceiptValidated !== true ||
        !result.trackingId || result.node !== draft.node) {
      throw new Error('preliminary_receipt_contract_unconfirmed');
    }
    var state = result.state === 'PENDING' ? deploymentStates.pending :
      (result.state === 'REQUESTED' ? deploymentStates.requested : deploymentStates.unknown);
    if (deploymentEvidence(state, {
      preliminaryReceiptValidated: result.preliminaryReceiptValidated,
      trackingId: result.trackingId,
      requestNode: result.node, expectedNode: draft.node
    }) === deploymentStates.unknown) throw new Error('preliminary_receipt_unverified');
    return Object.freeze({ state: state, trackingId: result.trackingId,
      approved: false, live: false });
  }

  function pendingSigner() {
    return Promise.resolve({ state: 'pending', cause: 'signature_missing',
      detail: 'The phone never signs; the Sovereign must be present at the rack ceremony.' });
  }

  function testStubSigner(cedula) {
    return Promise.resolve({ state: 'pending', cause: 'signature_missing',
      label: 'test_stub_no_signature', cedula: cedula });
  }

  function doorOneAdapter(fetchImpl) {
    var send = fetchImpl || function () { throw new Error('explicit_test_transport_required'); };
    return {
      endpoint: doorOneUrl,
      submitPending: async function (cedula, consent) {
        if (consent !== true) throw new Error('explicit_consent_required');
        if (!cedula || cedula.esquema !== schemaName || cedula.firma !== null || cedula.firma_ssh !== null) {
          throw new Error('pending_cedula_required');
        }
        var canonicalBody = Object.assign({}, cedula);
        delete canonicalBody.sha256;
        if (await digest(canonical(canonicalBody)) !== cedula.sha256) throw new Error('cedula_hash_mismatch');
        if (new root.TextEncoder().encode(JSON.stringify(cedula)).length >= 1024) {
          throw new Error('cedula_too_large');
        }
        var response = await send(doorOneUrl, { method: 'POST', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cedula: cedula }) });
        var resultBody;
        try { resultBody = await response.json(); } catch (_error) { resultBody = {}; }
        var receiptValid = typeof resultBody.receipt_id === 'string' && resultBody.receipt_id.length > 0
          && resultBody.cedula_sha256 === cedula.sha256;
        if (resultBody.receipt === 'test_stub_only' && resultBody.persisted === false && receiptValid) return resultBody;
        if (response.ok && resultBody.state === 'pending' && resultBody.trust === 'untrusted'
            && resultBody.cause && receiptValid) return resultBody;
        var errorCause = response.ok && !receiptValid ? 'receipt_unverified'
          : resultBody.cause || (response.status === 404 ? 'route_unavailable' : 'receipt_unavailable');
        var error = new Error(errorCause);
        error.cause = errorCause;
        error.httpStatus = response.status;
        throw error;
      }
    };
  }

  async function runDryRun(node, signer, adapter) {
    var state = stateNames.draft;
    var transitions = [state];
    var cedula = await createRequest(node);
    state = stateNames.preview;
    transitions.push(state);
    var signerResult = await signer(cedula);
    if (!signerResult || signerResult.state !== 'pending' || cedula.firma !== null || cedula.firma_ssh !== null) {
      transitions.push(stateNames.failed);
      return { state: stateNames.failed, transitions: transitions, cedula: cedula, cause: 'phone_signing_forbidden' };
    }
    state = stateNames.consented;
    transitions.push(state);
    state = stateNames.submitting;
    transitions.push(state);
    var receipt = await adapter.submitPending(cedula, true);
    if (receipt.receipt === 'test_stub_only' && receipt.catalog && receipt.catalog.state === 'stub_not_published') {
      transitions.push(stateNames.catalogStub);
      return { state: stateNames.catalogStub, transitions: transitions, cedula: cedula, signer: signerResult, receipt: receipt };
    }
    transitions.push(stateNames.pendingUntrusted);
    return { state: stateNames.pendingUntrusted, transitions: transitions, cedula: cedula, signer: signerResult, receipt: receipt };
  }

  function mount(document) {
    var form = document.getElementById('node-registration-form');
    if (!form) return;
    var input = document.getElementById('node-registration-name');
    var purpose = document.getElementById('node-registration-purpose');
    var status = document.getElementById('node-registration-status');
    var preview = document.getElementById('node-registration-preview');
    var signerStatus = document.getElementById('node-registration-signer');
    var consent = document.getElementById('node-registration-consent');
    var submit = document.getElementById('node-registration-submit');
    var draft = null;
    var submitted = false;

    function show(state, message, cause) {
      // One state for eye, ear (aria-live status) and machine/Acho.
      status.textContent = state + ' · ' + message;
      status.setAttribute('data-state', state);
      status.setAttribute('data-acho', state);
      status.setAttribute('data-cause', cause);
    }
    function clear() {
      draft = null;
      submitted = false;
      consent.checked = false;
      consent.disabled = true;
      submit.disabled = true;
    }
    clear();
    signerStatus.textContent = 'The phone requests a review; it never signs the Sovereign cédula.';
    // English-only MVP: replace dormant historical copy after app.js initialized.
    var wording = {
      node_registration_title: 'Deploy a node (review request)',
      node_registration_help: 'Sign deployment requests human review only. It cannot approve a node, sign an SSH credential or make a node LIVE.',
      node_registration_name: 'Proposed canonical node name',
      node_registration_preview: 'Preview deployment request',
      node_registration_consent: 'I consent to send this preliminary request for human review. Approval and signing are separate.',
      node_registration_submit: 'Sign deployment · request review',
      node_registration_signer_pending: 'The phone never signs the final cédula.'
    };
    Object.keys(wording).forEach(function (key) {
      var target = document.querySelector('[data-i18n="' + key + '"]');
      if (!target) return;
      target.textContent = wording[key];
      target.removeAttribute('data-i18n');
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clear();
      try {
        draft = deploymentDraft(input.value.trim(), purpose.value);
        preview.textContent = JSON.stringify({
          nodo: draft.node, purpose: draft.purpose,
          estado: deploymentStates.draft, sent: false, approved: false, live: false
        }, null, 2);
        consent.disabled = false;
        show(deploymentStates.draft,
          'Review your request and consent to contact Aduana. No submission or signature yet.',
          'owner_consent_required');
      } catch (error) {
        preview.textContent = '';
        show(deploymentStates.unknown, 'Nothing sent: ' + error.message, error.message);
      }
    });

    function invalidate() {
      clear();
      show(deploymentStates.draft,
        'Node details changed. Preview again before consent.', 'draft_changed');
    }
    input.addEventListener('input', invalidate);
    purpose.addEventListener('input', invalidate);

    consent.addEventListener('change', function () {
      submit.disabled = submitted || !draft || !consent.checked;
    });
    submit.addEventListener('click', async function (event) {
      event.preventDefault();
      if (!draft || !consent.checked || submitted) return;
      submitted = true;
      submit.disabled = true;
      show('submitting', 'Waiting for Android native consent and a real receipt.',
        'native_confirmation_required');
      try {
        var receipt = await requestDeploymentReview(draft, true, root.PreceptorAndroidJoin);
        show(receipt.state, 'Request received; tracking ' + receipt.trackingId +
          '. Awaiting human approval. Not a live node.', 'human_approval_pending');
        preview.textContent = JSON.stringify({
          nodo: draft.node, tracking_id: receipt.trackingId,
          estado: receipt.state, approved: false, live: false
        }, null, 2);
      } catch (error) {
        show(deploymentStates.unknown,
          'No verified request receipt: ' + error.message + '. Nothing approved or live.',
          error.message);
      }
    });
    show(deploymentStates.draft,
      'Create a node request locally. Sign deployment means request review, not SSH signing.',
      'local_only');
  }

  function text(key) {
    return typeof root.PreceptorNodeRegistrationText === 'function'
      ? root.PreceptorNodeRegistrationText(key) : key;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = Object.freeze({ schemaName: schemaName, states: stateNames, doorOneUrl: doorOneUrl,
      canonical: canonical, createRequest: createRequest, pendingSigner: pendingSigner,
      testStubSigner: testStubSigner, doorOneAdapter: doorOneAdapter, runDryRun: runDryRun, mount: mount,
    canonicalAduana: canonicalAduana, createAduanaRequest: createAduanaRequest,
    verifyAduanaReceipt: verifyAduanaReceipt, aduanaAdapter: aduanaAdapter,
    deploymentStates: deploymentStates, deploymentDraft: deploymentDraft,
    deploymentEvidence: deploymentEvidence, requestDeploymentReview: requestDeploymentReview });
  } else {
    root.PreceptorNodeRegistration = Object.freeze({ schemaName: schemaName, states: stateNames,
      createRequest: createRequest, pendingSigner: pendingSigner,
      doorOneAdapter: doorOneAdapter, mount: mount,
      canonicalAduana: canonicalAduana, createAduanaRequest: createAduanaRequest,
      verifyAduanaReceipt: verifyAduanaReceipt, aduanaAdapter: aduanaAdapter,
    deploymentStates: deploymentStates, deploymentDraft: deploymentDraft,
    deploymentEvidence: deploymentEvidence, requestDeploymentReview: requestDeploymentReview });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
