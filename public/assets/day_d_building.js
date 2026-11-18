// Day D: one building proposal written and downloaded on the visitor's device.
// The public website never sends, stores, signs, registers or deploys this draft.
(function (root) {
  'use strict';
  var MAX_NAME = 60, MAX_PURPOSE = 400;
  function fail(code) { return { ok: false, cause: code }; }
  function clean(value, max) {
    return typeof value === 'string' && value.trim().length <= max ? value.trim() : '';
  }
  function secret(value) {
    return /-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{15,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}/i.test(value);
  }
  function makeDraft(input) {
    var name = clean(input && input.name, MAX_NAME), purpose = clean(input && input.purpose, MAX_PURPOSE);
    if (!name || !purpose) return fail('building_name_and_purpose_required');
    if (secret(name) || secret(purpose)) return fail('credentials_not_allowed');
    var text = [
      '# One building · local proposal',
      '',
      'Format: plain Markdown · local proposal, not a live protocol',
      'Status: DRAFT_ONLY',
      'Building count: 1',
      'Name (human data): ' + JSON.stringify(name),
      'Purpose (human data): ' + JSON.stringify(purpose),
      '',
      'Node owner: NO_DATA(owner_not_registered)',
      'Node admission: NO_DATA(node_admission_not_approved)',
      'Deployment: NO_DATA(world_publication_not_verified)',
      'Model: NO_DATA(owner_model_not_connected)',
      'Feedback channel: NO_DATA(owner_opt_in_not_signed)',
      'Signature: NO_DATA(building_proposal_not_signed)',
      '',
      'Feedback stays only on the node owner\'s device after the owner opens the channel.',
      'No credentials, model, Hexelion instance or rights are transferred by this draft.',
      'Next at home: install your own PreceptorOS APP, choose your own model, then review the Companion guide.',
      ''
    ].join('\n');
    return { ok: true, text: text, filename: 'BUILDING_PROPOSAL.md' };
  }
  var API = Object.freeze({ makeDraft: makeDraft, MAX_NAME: MAX_NAME, MAX_PURPOSE: MAX_PURPOSE });
  if (typeof module === 'object' && module.exports) { module.exports = API; return; }
  root.DayDBuildingDraft = API;
  var doc = root.document, form = doc && doc.getElementById('dayd-building-form');
  if (!form) return;
  var name = doc.getElementById('dayd-building-name'),
    purpose = doc.getElementById('dayd-building-purpose'),
    status = doc.getElementById('dayd-building-status'),
    output = doc.getElementById('dayd-building-output'),
    download = doc.getElementById('dayd-building-download'),
    url = null;
  function clear() {
    if (url) { root.URL.revokeObjectURL(url); url = null; }
    download.hidden = true; download.removeAttribute('href'); output.hidden = true;
  }
  form.querySelector('#dayd-building-make').disabled = false; // no-JS means no accidental GET/POST submission
  form.addEventListener('input', function () { clear(); status.textContent = 'DRAFT_ONLY · not saved or sent. Create a fresh draft after editing.'; });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clear();
    var value = makeDraft({ name: name.value, purpose: purpose.value });
    if (!value.ok) { status.textContent = 'NO_DATA(' + value.cause + ')'; return; }
    output.value = value.text; output.hidden = false;
    url = root.URL.createObjectURL(new root.Blob([value.text], { type: 'text/markdown;charset=utf-8' }));
    download.href = url; download.download = value.filename; download.hidden = false;
    status.textContent = 'DRAFT_ONLY · one building document prepared on this device. Download and keep it; nothing was sent or registered.';
  });
  root.addEventListener('pagehide', clear);
})(typeof window !== 'undefined' ? window : globalThis);
