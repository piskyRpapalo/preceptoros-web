// Visitor building suggestion → already existing public ingesta transport (NO NEW SERVER).
// PROPOSE_ONLY: a receipt means quarantined input, never owner notification, admission or deploy.
// Pure until an explicit call to submit(): no auto-upload, UI, storage, identity, node or clock.
(function (root) {
  'use strict';
  var VERSION = 'preceptoros.building-suggestion/1';
  var BYTES = 1024;
  function fail(cause) { return Object.freeze({ ok: false, cause: cause }); }
  function bytes(s) { return new TextEncoder().encode(s).length; }
  // Reuse the already-reviewed DayDBuildingDraft.makeDraft input filter, not a new validator.
  function prepare(input, makeDraft) {
    if (typeof makeDraft !== 'function') { return fail('building_draft_validator_unavailable'); }
    if (!input || typeof input.name !== 'string' || typeof input.purpose !== 'string') {
      return fail('building_name_and_purpose_required');
    }
    var verdict = makeDraft(input);
    if (!verdict || verdict.ok !== true) { return fail(verdict && verdict.cause || 'building_draft_rejected'); }
    var obj = {
      v: VERSION, kind: 'public-building-suggestion', status: 'PROPOSE_ONLY',
      name: input.name.trim(), purpose: input.purpose.trim(),
      origin: 'ephemeral-web', retention: 'public-ingesta-up-to-24h',
      authority: 'none', owner_notification: 'NO_DATA(owner_notification_not_verified)'
    };
    var content = JSON.stringify(obj);
    if (bytes(content) >= BYTES) { return fail('suggestion_exceeds_1023_utf8_bytes'); }
    return Object.freeze({ ok: true, content: content, schema: VERSION, privacy: 'public-up-to-24h' });
  }
  // The sender is the EXISTING AtlasOpenChat.send(text, say, net, subtle).
  // The caller must show that public retention disclosure before the visitor explicitly consents.
  async function submit(input, options) {
    var opt = options || {};
    if (opt.consent !== true) { return fail('explicit_public_submission_consent_required'); }
    var draft = prepare(input, opt.makeDraft);
    if (!draft.ok) { return draft; }
    if (typeof opt.send !== 'function' || typeof opt.net !== 'function' || !opt.subtle) {
      return fail('ingesta_transport_unavailable');
    }
    try {
      var rootHash = await opt.send(draft.content, function () {}, opt.net, opt.subtle);
      if (typeof rootHash !== 'string' || !/^[0-9a-f]{64}$/.test(rootHash)) {
        return fail('ingesta_receipt_invalid');
      }
      return Object.freeze({ ok: true, state: 'QUARANTINED', receipt: rootHash,
        public: true, owner_delivery: 'NO_DATA(owner_notification_not_verified)',
        expiry: 'public-ingesta-up-to-24h', admitted: false });
    } catch (_) {
      return fail('ingesta_delivery_unconfirmed');
    }
  }
  var API = Object.freeze({ version: VERSION, prepare: prepare, submit: submit });
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  root.AtlasBuildingSuggestionBridge = API;
})(typeof window !== 'undefined' ? window : globalThis);
