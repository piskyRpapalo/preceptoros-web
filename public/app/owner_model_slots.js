/* Owner model slots · personal MVP · Draft configuration only.
 * One personal Chat model; one independent visitor model for an admitted
 * building. No credentials, endpoints, model loading, rack permissions, or
 * network calls in this module. The public declaration excludes Chat settings.
 */
(function (root) {
  'use strict';
  const SCHEMA = 'preceptoros.owner-model-slots/1';
  const publicSchemaId = 'preceptoros.public-visitor-model-draft/1';
  const storageKey = 'preceptoros.owner-model-slots.v1';
  const choices = Object.freeze({
    private_chat_model: Object.freeze(['none', 'on_device', 'owner_managed']),
    public_visitor_model: Object.freeze(['none', 'owner_managed']),
  });
  const blank = () => ({
    private_chat_model: { runtime: 'none', label: '' },
    public_visitor_model: { runtime: 'none', label: '' },
  });
  const badName = /(?:password|passwd|secret|token|api[\s_-]*key|private[\s_-]*key|bearer|https?:|ssh:|sk-[a-z0-9]|gh[pousr]_|github_pat_|xox[baprs]-|-----begin|[<>{}\/@])/i;
  const namePattern = /^[\p{L}\p{N}][\p{L}\p{N} ._\-]{0,59}$/u;

  function validateSlot(kind, slot) {
    if (!Object.prototype.hasOwnProperty.call(choices, kind) ||
        !slot || typeof slot !== 'object' || Array.isArray(slot)) {
      return { ok: false, cause: 'invalid_slot' };
    }
    const runtime = slot.runtime;
    const label = typeof slot.label === 'string' ? slot.label.trim() : '';
    if (!choices[kind].includes(runtime)) return { ok: false, cause: 'runtime_not_allowed' };
    if (runtime === 'none') {
      return label ? { ok: false, cause: 'name_without_runtime' } :
        { ok: true, value: { runtime: 'none', label: '' } };
    }
    if (!label || !namePattern.test(label) || badName.test(label)) {
      return { ok: false, cause: 'unsafe_model_label' };
    }
    return { ok: true, value: { runtime, label } };
  }

  function validate(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return { ok: false, cause: 'configuration_invalid' };
    }
    const privateSlot = validateSlot('private_chat_model', config.private_chat_model);
    if (!privateSlot.ok) return privateSlot;
    const publicSlot = validateSlot('public_visitor_model', config.public_visitor_model);
    if (!publicSlot.ok) return publicSlot;
    // Copy only allowlisted fields. Rogue persisted json cannot smuggle
    // secrets/endpoints/grants into our machine view or public declaration.
    return { ok: true, value: {
      schema: SCHEMA,
      private_chat_model: privateSlot.value,
      public_visitor_model: publicSlot.value,
    } };
  }

  function snapshot(config) {
    const checked = validate(config);
    if (!checked.ok) return { schema: SCHEMA, state: 'NO_DATA', cause: checked.cause };
    const v = checked.value;
    const configured = (x) => x.runtime === 'none' ? 'NO_DATA' : 'DRAFT_ONLY';
    return {
      schema: SCHEMA, authority: 'NOT_AUTHORIZED', source: 'browser_preference_only',
      private_chat_model: {
        ...v.private_chat_model, selection_state: configured(v.private_chat_model),
        reply_state: 'NO_DATA', cause: 'personal_model_turn_not_verified',
      },
      public_visitor_model: {
        ...v.public_visitor_model, selection_state: configured(v.public_visitor_model),
        admission_state: 'NO_DATA', reply_state: 'NO_DATA',
        cause: 'building_admission_and_public_turn_not_verified',
      },
    };
  }

  function publicDraft(config, consent) {
    const checked = validate(config);
    if (!checked.ok) return { ok: false, cause: checked.cause };
    const slot = checked.value.public_visitor_model;
    if (slot.runtime === 'none') return { ok: false, cause: 'public_model_not_selected' };
    if (consent !== true) return { ok: false, cause: 'owner_consent_required' };
    return { ok: true, value: {
      schema: publicSchemaId, source: 'owner_local_draft', state: 'DRAFT_ONLY',
      public_visitor_model: { runtime: slot.runtime, label: slot.label },
      owner_consent: 'DRAFT_ONLY', building_admission: 'NO_DATA',
      public_response: 'NO_DATA', authority: 'NOT_AUTHORIZED',
      cause: 'not_submitted_not_admitted_not_serving',
    } };
  }

  function read(storage) {
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return { ok: true, value: blank(), cause: 'first_run' };
      if (raw.length > 1024) return { ok: false, cause: 'stored_config_oversized' };
      const parsed = JSON.parse(raw);
      const checked = validate(parsed);
      return checked.ok ? { ok: true, value: checked.value, cause: 'browser_choice_only' } : checked;
    } catch (_) {
      return { ok: false, cause: 'browser_storage_unavailable_or_invalid' };
    }
  }

  function save(storage, config) {
    const checked = validate(config);
    if (!checked.ok) return checked;
    try {
      const raw = JSON.stringify(checked.value);
      if (raw.length > 1024) return { ok: false, cause: 'configuration_too_large' };
      storage.setItem(storageKey, raw);
      return { ok: true, value: checked.value };
    } catch (_) {
      return { ok: false, cause: 'browser_storage_unavailable' };
    }
  }

  // All html is static; no user input is interpolated as html.
  const markup = `
<section class="tarjeta owner-models" id="owner-models" aria-labelledby="owner-models-heading">
  <h3 id="owner-models-heading">Choose your two independent models</h3>
  <p class="pie">Personal Chat and your future OpenWorld building are separate. Saving a choice does not connect or publish a model. No credentials or endpoint URLs are stored.</p>
  <form id="owner-models-form" autocomplete="off">
    <div class="owner-models-grid">
      <fieldset class="owner-model-slot" id="owner-private-slot">
        <legend>1 · Private Chat model</legend>
        <p class="pie">Only your personal mini-orchestrator. Never exported to the public building.</p>
        <label for="owner-private-runtime">Where it would run</label>
        <select id="owner-private-runtime">
          <option value="none">Not selected</option>
          <option value="on_device">On-device model (requires verified runtime)</option>
          <option value="owner_managed">Owner-managed model (requires connector)</option>
        </select>
        <label for="owner-private-label">Model name (not a key)</label>
        <input id="owner-private-label" maxlength="60" placeholder="My local model" autocomplete="off">
        <p id="owner-private-status" role="status" aria-live="polite" data-state="NO_DATA" data-acho="NO_DATA">NO_DATA(personal_model_turn_not_verified)</p>
      </fieldset>
      <fieldset class="owner-model-slot" id="owner-public-slot">
        <legend>2 · Public visitor model</legend>
        <p class="pie">Only visitors to your admitted building. It has no access to private Chat, memory or tools.</p>
        <label for="owner-public-runtime">How visitors would reach it</label>
        <select id="owner-public-runtime">
          <option value="none">Not selected</option>
          <option value="owner_managed">Owner-managed visitor model (pending admission)</option>
        </select>
        <label for="owner-public-label">Public model name (not a key)</label>
        <input id="owner-public-label" maxlength="60" placeholder="My public guide" autocomplete="off">
        <p id="owner-public-status" role="status" aria-live="polite" data-state="NO_DATA" data-acho="NO_DATA">NO_DATA(building_admission_and_public_turn_not_verified)</p>
      </fieldset>
    </div>
    <div class="owner-model-buttons">
      <button type="submit" id="owner-model-save">Save choices on this device</button>
      <button type="button" id="owner-model-clear">Clear both choices</button>
    </div>
    <p id="owner-models-status" role="status" aria-live="polite" aria-atomic="true" data-state="NO_DATA" data-acho="NO_DATA">NO_DATA(model_choices_not_saved)</p>
    <label class="owner-model-consent">
      <input type="checkbox" id="owner-model-public-consent">
      I understand a public model draft does not create a building, send an admission request or grant access.
    </label>
    <button type="button" id="owner-model-export">Prepare public model declaration (local draft)</button>
    <p id="owner-model-export-status" role="status" aria-live="polite" data-state="NO_DATA" data-acho="NO_DATA">NO_DATA(public_model_draft_not_prepared)</p>
    <pre id="owner-model-public-draft" hidden aria-label="Public model declaration draft"></pre>
  </form>
  <pre id="owner-models-machine" hidden aria-label="Machine state of your two local choices"></pre>
</section>`;

  function mount(doc, storage) {
    const host = doc && doc.getElementById('owner-model-slots-mount');
    if (!host || host.dataset.mounted === '1') return false;
    host.dataset.mounted = '1';
    host.insertAdjacentHTML('beforeend', markup);
    const $ = (id) => doc.getElementById(id);
    const state = $('owner-models-status');
    const machine = $('owner-models-machine');
    const publicText = $('owner-model-public-draft');
    const publicStatus = $('owner-model-export-status');
    const f = $('owner-models-form');
    const get = () => ({
      private_chat_model: { runtime: $('owner-private-runtime').value, label: $('owner-private-label').value },
      public_visitor_model: { runtime: $('owner-public-runtime').value, label: $('owner-public-label').value },
    });
    const announce = (el, msg, status) => {
      el.textContent = msg;
      el.dataset.state = status;
      el.dataset.acho = status;
    };
    const paint = (config) => {
      const snap = snapshot(config);
      machine.textContent = JSON.stringify(snap);
      [['private', snap.private_chat_model], ['public', snap.public_visitor_model]].forEach(([kind, entry]) => {
        const el = $('owner-' + kind + '-status');
        if (!entry) return announce(el, 'NO_DATA(model_slot_invalid)', 'NO_DATA');
        announce(el, (entry.selection_state === 'DRAFT_ONLY' ?
          'DRAFT_ONLY · model named, not connected. ' : 'NO_DATA · no model selected. ') +
          'Response: NO_DATA(' + entry.cause + ').', entry.selection_state);
      });
    };
    const refreshDraft = () => {
      publicText.textContent = '';
      publicText.hidden = true;
      announce(publicStatus, 'NO_DATA(public_model_draft_not_prepared)', 'NO_DATA');
    };
    let initial = read(storage);
    if (!initial.ok) {
      initial = { value: blank() };
      announce(state, 'NO_DATA(browser_storage_unavailable_or_invalid)', 'NO_DATA');
    } else {
      announce(state, initial.cause === 'first_run' ?
        'NO_DATA(first_run_no_model_choices)' :
        'DRAFT_ONLY · local choices restored; no model connection verified.',
        initial.cause === 'first_run' ? 'NO_DATA' : 'DRAFT_ONLY');
    }
    $('owner-private-runtime').value = initial.value.private_chat_model.runtime;
    $('owner-private-label').value = initial.value.private_chat_model.label;
    $('owner-public-runtime').value = initial.value.public_visitor_model.runtime;
    $('owner-public-label').value = initial.value.public_visitor_model.label;
    paint(initial.value);

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const result = save(storage, get());
      if (!result.ok) return announce(state, 'NO_DATA(' + result.cause + ') · nothing stored.', 'NO_DATA');
      paint(result.value);
      refreshDraft();
      announce(state, 'DRAFT_ONLY · two independent choices saved on this browser only. No model was contacted.', 'DRAFT_ONLY');
    });
    $('owner-model-clear').addEventListener('click', () => {
      try {
        storage.removeItem(storageKey);
        $('owner-private-runtime').value = 'none'; $('owner-private-label').value = '';
        $('owner-public-runtime').value = 'none'; $('owner-public-label').value = '';
        $('owner-model-public-consent').checked = false;
        paint(blank()); refreshDraft();
        announce(state, 'NO_DATA(model_choices_cleared) · this browser has no selected models.', 'NO_DATA');
      } catch (_) {
        announce(state, 'NO_DATA(browser_storage_unavailable) · could not clear choices.', 'NO_DATA');
      }
    });
    for (const id of ['owner-private-runtime', 'owner-private-label', 'owner-public-runtime', 'owner-public-label']) {
      $(id).addEventListener('input', () => {
        refreshDraft();
        announce(state, 'DRAFT_ONLY · unsaved edits. No model contacted.', 'DRAFT_ONLY');
      });
    }
    $('owner-model-public-consent').addEventListener('change', refreshDraft);
    $('owner-model-export').addEventListener('click', () => {
      const result = publicDraft(get(), $('owner-model-public-consent').checked);
      if (!result.ok) return announce(publicStatus, 'NO_DATA(' + result.cause + ') · nothing exported.', 'NO_DATA');
      publicText.textContent = JSON.stringify(result.value, null, 2);
      publicText.hidden = false;
      announce(publicStatus, 'DRAFT_ONLY · public model name only. Review, copy or download manually; nothing sent.', 'DRAFT_ONLY');
    });
    return true;
  }
  const api = Object.freeze({ schema: SCHEMA, storageKey: storageKey, validateSlot, validate, snapshot, publicDraft, read, save, mount });
  root.PreceptorOwnerModelSlots = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    let storage;
    try { storage = root.localStorage; } catch (_) { storage = null; }
    mount(root.document, storage);
  }
})(typeof window === 'undefined' ? globalThis : window);
