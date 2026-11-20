// Building suggestions are NOT the public 24-hour chat. A proposal needs its own owner-reviewed inbox.
// Pure until submit() is deliberately called; the real inbox adapter is NOT connected in WEB yet.
// Input is untrusted data, never an instruction, mission, node declaration or owner's approval.
(function (root) {
  'use strict';
  var VERSION = 'preceptoros.building-suggestion/1';
  var RECEIPT = 'preceptoros.building-suggestion-receipt/1';
  var MAX_BYTES = 1024;
  function fail(cause) { return Object.freeze({ ok: false, state: 'NO_DATA', cause: cause }); }
  function bytes(text) { return new TextEncoder().encode(text); }
  function prepare(input, makeDraft) {
    // Use the existing DayDBuildingDraft.makeDraft validation; no second validator or transport.
    if (typeof makeDraft !== 'function') { return fail('building_draft_validator_unavailable'); }
    if (!input || typeof input.name !== 'string' || typeof input.purpose !== 'string') {
      return fail('building_name_and_purpose_required');
    }
    var check = makeDraft(input);
    if (!check || check.ok !== true) { return fail(check && check.cause || 'building_draft_rejected'); }
    var payload = {
      v: VERSION,
      kind: 'building-proposal',
      status: 'PROPOSE_ONLY',
      origin: 'ephemeral-web',
      name: input.name.trim(),
      purpose: input.purpose.trim(),
      authority: 'none'
    };
    var content = JSON.stringify(payload);
    if (bytes(content).length >= MAX_BYTES) { return fail('proposal_exceeds_1023_utf8_bytes'); }
    return Object.freeze({ ok: true, state: 'LOCAL_DRAFT', content: content, schema: VERSION,
      delivery: 'NO_DATA(owner_proposal_inbox_not_connected)' });
  }
  function hex(buffer) {
    return Array.from(new Uint8Array(buffer), function (v) { return v.toString(16).padStart(2, '0'); }).join('');
  }
  // deliver is deliberately NOT AtlasOpenChat.send. No default endpoint: a 24h public chat receipt is unacceptable.
  // The owner-controlled inbox must return a separately verified receipt binding its content hash.
  // The browser's local crypto hash by itself does NOT establish that anything was stored.
  async function submit(input, options) {
    var opt = options || {};
    if (opt.consent !== true) { return fail('explicit_proposal_submission_consent_required'); }
    var draft = prepare(input, opt.makeDraft);
    if (!draft.ok) { return draft; }
    if (typeof opt.deliver !== 'function' || typeof opt.verifyReceipt !== 'function' ||
        !opt.subtle || typeof opt.subtle.digest !== 'function') {
      return fail('owner_proposal_inbox_not_connected');
    }
    try {
      var sha = hex(await opt.subtle.digest('SHA-256', bytes(draft.content)));
      var ack = await opt.deliver({ schema: VERSION, content: draft.content, sha256: sha });
      if (!ack || ack.schema !== RECEIPT || ack.state !== 'STORED_PENDING_REVIEW' ||
          ack.content_sha256 !== sha || typeof ack.receipt !== 'string' ||
          !/^[0-9a-f]{64}$/.test(ack.receipt) ||
          await opt.verifyReceipt(ack, { content: draft.content, sha256: sha }) !== true) {
        return fail('owner_inbox_receipt_not_verified');
      }
      return Object.freeze({ ok: true, state: 'STORED_PENDING_REVIEW', receipt: ack.receipt,
        content_sha256: sha, owner_notification: 'NO_DATA(owner_notification_not_verified)',
        owner_approved: false, published: false });
    } catch (_) { return fail('owner_inbox_delivery_unconfirmed'); }
  }
  var API = Object.freeze({ version: VERSION, receiptSchema: RECEIPT, prepare: prepare, submit: submit });
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  root.AtlasBuildingSuggestionBridge = API;
})(typeof window !== 'undefined' ? window : globalThis);
