(function (raiz) {
  'use strict';
  var enNode = typeof module === 'object' && !!module.exports;
  var T = enNode ? require('./tutorial_fases.js') : raiz.AtlasTutorial;
  var M = enNode ? require('./en301_tutorial_model.js') : raiz.AtlasTutorialGuideModel;
  var STAMP = M.STAMP;
  var FRAME_SCHEMA = M.FRAME_SCHEMA;
  var FRAME_LIMIT = M.FRAME_LIMIT;
  var LABEL_LIMIT = M.LABEL_LIMIT;
  var ORDER = M.ORDER;
  var PRACTICE_STEPS = M.PRACTICE_STEPS;
  var PRACTICE_SEEDS = M.PRACTICE_SEEDS;
  var EGGS = M.EGGS;
  var CARDS = M.CARDS;
  var FORM_DEFAULT = M.FORM_DEFAULT;
  var IDLE_CAUSE = M.IDLE_CAUSE;
  var TONE_NO_START = M.TONE_NO_START;
  var COPY = M.COPY;
  var hasOwn = M.hasOwn;
  var refuse = M.refuse;
  var report = M.report;
  var stepOf = M.stepOf;
  var checkLabel = M.checkLabel;
  var prepareLabel = M.prepareLabel;
  var advance = M.advance;
  var action = M.action;
  var buildFrame = M.buildFrame;
  var view = M.view;
  var A = enNode ? require('./en301_tutorial_audio.js') : raiz.AtlasTutorialGuideAudio;
  var pickVoice = A.pickVoice;
  var stopSpeech = A.stopSpeech;
  var speakReport = A.speakReport;
  var toneReport = A.toneReport;
  var hapticReport = A.hapticReport;
  var windowOf = A.windowOf;
  var prefersReduced = A.prefersReduced;
  var missingAudio = A.missingAudio;
  var environmentOf = A.environmentOf;
  function make(doc, tag, cls, text) {
    var node = doc.createElement(tag);
    if (cls) { node.className = cls; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  function clear(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  function appendAll(parent, kids) {
    kids.forEach(function (kid) { parent.appendChild(kid); });
  }

  function idleCues() {
    return {
      sound: report('INACTIVO', IDLE_CAUSE),
      speech: report('INACTIVO', IDLE_CAUSE),
      tone: report('INACTIVO', IDLE_CAUSE),
      haptic: report('INACTIVO', IDLE_CAUSE)
    };
  }

  function formChanged(ctl) {
    ctl.measures.label = null;
    ctl.note = 'the label is stale because its text changed: prepare it again';
    paint(ctl, null);
  }

  function buildForm(doc, ctl) {
    var box = make(doc, 'div', 'en301-form');
    var titleLabel = make(doc, 'label', 'en301-field', 'Building title');
    var titleInput = make(doc, 'input', 'en301-input');
    titleInput.type = 'text';
    titleInput.value = ctl.form.title;
    titleInput.addEventListener('input', function () { ctl.form.title = titleInput.value; formChanged(ctl); });
    titleLabel.appendChild(titleInput);
    var promptLabel = make(doc, 'label', 'en301-field', 'Prompt for the local mind');
    var promptInput = make(doc, 'textarea', 'en301-input');
    promptInput.value = ctl.form.rag_base_prompt;
    promptInput.addEventListener('input', function () { ctl.form.rag_base_prompt = promptInput.value; formChanged(ctl); });
    promptLabel.appendChild(promptInput);
    appendAll(box, [titleLabel, promptLabel]);
    box.hidden = true;
    return box;
  }

  function buildDom(doc, host, ctl) {
    var parts = {};
    parts.root = make(doc, 'section', 'en301-tutorial');
    parts.root.setAttribute('aria-label', 'Guided local tutorial, simulated');
    parts.stamp = make(doc, 'p', 'en301-stamp', STAMP + ' · local practice · no signed game effect');
    parts.status = make(doc, 'div', 'en301-status');
    parts.status.setAttribute('role', 'status');
    parts.status.setAttribute('aria-live', 'polite');
    parts.status.setAttribute('aria-atomic', 'true');
    parts.heading = make(doc, 'h2', 'en301-heading');
    parts.heading.tabIndex = -1;
    parts.instruction = make(doc, 'p', 'en301-instruction');
    parts.next = make(doc, 'p', 'en301-next');
    parts.cause = make(doc, 'p', 'en301-cause');
    parts.note = make(doc, 'p', 'en301-note');
    parts.progress = make(doc, 'p', 'en301-progress');
    parts.feedback = make(doc, 'div', 'en301-feedback');
    appendAll(parts.status, [parts.heading, parts.instruction, parts.next, parts.cause, parts.note, parts.progress]);
    parts.preview = make(doc, 'div', 'en301-preview');
    parts.practice = make(doc, 'div', 'en301-practice');
    parts.practice.hidden = true;
    parts.extras = make(doc, 'ul', 'en301-extras');
    parts.form = buildForm(doc, ctl);
    parts.actions = make(doc, 'ul', 'en301-actions');
    parts.details = make(doc, 'details', 'en301-details');
    parts.summary = make(doc, 'summary', null, 'Technical details');
    parts.frame = make(doc, 'pre', 'en301-frame');
    appendAll(parts.details, [parts.summary, parts.feedback, parts.frame]);
    appendAll(parts.root, [parts.stamp, parts.status, parts.preview, parts.practice, parts.extras, parts.form, parts.actions, parts.details]);
    host.appendChild(parts.root);
    return parts;
  }

  function lineOf(name, r) {
    return name + ': ' + r.status + (r.cause ? ' (' + r.cause + ')' : '');
  }

  function renderFeedback(ctl) {
    clear(ctl.parts.feedback);
    var lines = [['Sound', ctl.cues.sound], ['Speech', ctl.cues.speech], ['Tone', ctl.cues.tone], ['Haptic', ctl.cues.haptic]];
    lines.forEach(function (pair) {
      ctl.parts.feedback.appendChild(make(ctl.doc, 'p', 'en301-cue', lineOf(pair[0], pair[1])));
    });
  }

  function renderPreview(ctl, v) {
    clear(ctl.parts.preview);
    if (v.preview) { ctl.parts.preview.appendChild(make(ctl.doc, 'p', 'en301-stamp', v.preview.stamp + ': ' + v.preview.text)); }
    if (v.step === 'primer_edificio' && ctl.measures.label) {
      ctl.parts.preview.appendChild(make(ctl.doc, 'h3', null, 'F2 · First building label · ' + ctl.measures.label.bytes + ' B'));
      ctl.parts.preview.appendChild(make(ctl.doc, 'pre', 'en301-frame', ctl.measures.label.texto));
    }
  }

  function extraRows(v) {
    if (v.cards) { return v.cards.map(function (c) { return c.name + ': ' + c.stamp + ' (' + c.cause + ')'; }); }
    if (v.eggs) { return v.eggs.map(function (e) { return e + ': practice egg, claimed only when you collect it, never adopted'; }); }
    return [];
  }

  function renderExtras(ctl, v) {
    clear(ctl.parts.extras);
    extraRows(v).forEach(function (text) { ctl.parts.extras.appendChild(make(ctl.doc, 'li', 'en301-extra', text)); });
  }

  function renderActions(ctl, v) {
    clear(ctl.parts.actions);
    ctl.buttons = {};
    v.actions.forEach(function (a) {
      var item = make(ctl.doc, 'li', 'en301-item');
      var button = make(ctl.doc, 'button', 'en301-action', a.label);
      button.type = 'button';
      button.setAttribute('data-action', a.id);
      if (a.enabled) { button.addEventListener('click', function () { onAction(ctl, a); }); }
      else { button.disabled = true; }
      item.appendChild(button);
      if (!a.enabled) { item.appendChild(make(ctl.doc, 'small', 'en301-cause', 'Unavailable: ' + a.cause)); }
      ctl.buttons[a.id] = button;
      ctl.parts.actions.appendChild(item);
    });
  }

  function focusTarget(ctl, key) {
    if (key === 'heading') { ctl.parts.heading.focus(); return; }
    if (key && hasOwn(ctl.buttons, key) && !ctl.buttons[key].disabled) { ctl.buttons[key].focus(); }
  }

  function paint(ctl, focusKey) {
    syncPractice(ctl, stepOf(ctl.st));
    var h = ctl.practice && ctl.practice.handle;
    ctl.measures.practiceReady = !!(h && typeof h.ready === 'function' && h.ready());
    var v = view(ctl.st, ctl.measures);
    ctl.parts.heading.textContent = v.heading;
    ctl.parts.instruction.textContent = v.instruction;
    ctl.parts.next.textContent = v.next;
    ctl.parts.cause.textContent = v.cause ? 'Cause: ' + v.cause : '';
    ctl.parts.note.textContent = ctl.note || '';
    ctl.parts.progress.textContent = 'Phase ' + (v.phase || 'unknown') + ' · step ' + v.progress.done + ' of ' + v.progress.total;
    renderFeedback(ctl);
    renderPreview(ctl, v);
    renderExtras(ctl, v);
    ctl.parts.form.hidden = v.step !== 'primer_edificio';
    ctl.parts.practice.hidden = PRACTICE_STEPS.indexOf(v.step) < 0;
    renderActions(ctl, v);
    ctl.parts.frame.textContent = JSON.stringify(v.frame, null, 2);
    focusTarget(ctl, focusKey);
  }

  function disposerOf(handle) {
    if (typeof handle === 'function') { return handle; }
    if (handle && typeof handle.destroy === 'function') { return function () { handle.destroy(); }; }
    return null;
  }

  function disposePractice(ctl) {
    var p = ctl.practice;
    ctl.practice = null;
    clear(ctl.parts.practice);
    if (p && typeof p.dispose === 'function') {
      try { p.dispose(); } catch (e) { ctl.note = 'practice dispose failed'; }
    }
  }

  function verifyPractice(ctl, packet, step) {
    var verifier = ctl.options.verifyPractice;
    if (typeof verifier !== 'function') { return refuse('no practice verifier is attached'); }
    try {
      var verdict = verifier(packet, { step: step, seed: PRACTICE_SEEDS[step] });
      return verdict && verdict.ok === true ? { ok: true } : refuse(verdict && verdict.reason ? verdict.reason : 'practice result was not verified');
    } catch (e) {
      return refuse('practice verifier failed');
    }
  }

  function transition(ctl, estado) {
    ctl.st = estado;
    ctl.note = null;
    ctl.measures.practiceVerified = false;
    announce(ctl);
    paint(ctl, 'heading');
  }

  function acceptPractice(ctl, revision, step, packet) {
    if (!ctl.practice || ctl.practice.revision !== revision || stepOf(ctl.st) !== step) { return; }
    var verdict = verifyPractice(ctl, packet, step);
    if (!verdict.ok) {
      ctl.note = 'practice result rejected: ' + verdict.reason;
      paint(ctl, null);
      return;
    }
    ctl.measures.practiceVerified = true;
    var r = advance(ctl.st, { event: step }, ctl.measures);
    ctl.measures.practiceVerified = false;
    if (!r.ok) {
      ctl.note = r.reason;
      paint(ctl, null);
      return;
    }
    transition(ctl, r.estado);
  }

  function openPractice(ctl, step) {
    var revision = ctl.revision = (ctl.revision || 0) + 1;
    var adapter = ctl.options.openPractice;
    ctl.practice = { step: step, revision: revision, dispose: null };
    if (typeof adapter !== 'function') {
      ctl.note = 'no practice adapter is attached: the practice fight cannot open';
      return;
    }
    try {
      var handle = adapter(ctl.parts.practice, function (packet) { acceptPractice(ctl, revision, step, packet); }, { step: step, seed: PRACTICE_SEEDS[step] });
      ctl.practice.dispose = disposerOf(handle);
      ctl.practice.handle = handle;
    } catch (e) {
      ctl.note = 'practice adapter failed to open';
    }
  }

  function syncPractice(ctl, step) {
    var wanted = PRACTICE_STEPS.indexOf(step) >= 0;
    if (ctl.practice && ctl.practice.step === step && wanted) { return; }
    disposePractice(ctl);
    if (wanted) { openPractice(ctl, step); }
  }

  function announce(ctl) {
    if (!ctl.measures.soundOn) { return; }
    var v = view(ctl.st, ctl.measures);
    ctl.cues.speech = speakReport(ctl.env, v.audible_text);
    ctl.cues.tone = toneReport(ctl.env);
    ctl.cues.haptic = hapticReport(ctl.env, v.frame.haptic);
  }

  function setSound(ctl, on) {
    if (!on) {
      stopSpeech(ctl.env);
      ctl.env.audio.deshabilitar();
      ctl.measures.soundOn = false;
      ctl.cues = idleCues();
      ctl.cues.sound = report('DESHABILITADO', null);
      paint(ctl, 'sound');
      return;
    }
    var r;
    try { r = ctl.env.audio.habilitar(); } catch (e) { r = { estado: 'NO_DATA', causa: 'Local tone activation failed.' }; }
    ctl.measures.soundOn = true;
    ctl.cues = idleCues();
    ctl.cues.sound = report(r.estado, r.estado === 'HABILITADO' ? null : r.causa || TONE_NO_START);
    announce(ctl);
    paint(ctl, 'sound');
  }

  function repeatGuidance(ctl) {
    if (!ctl.measures.soundOn) { return; }
    ctl.cues.speech = speakReport(ctl.env, view(ctl.st, ctl.measures).audible_text);
    paint(ctl, 'repeat');
  }

  function teardown(ctl) {
    ctl.closed = true;
    stopSpeech(ctl.env);
    ctl.env.audio.deshabilitar();
    disposePractice(ctl);
  }

  function exitLocal(ctl) {
    var onExit = ctl.options.onExit;
    teardown(ctl);
    if (typeof onExit === 'function') { onExit({ reason: 'keep-playing-locally' }); }
  }

  function prepare(ctl) {
    var label = prepareLabel(ctl.form, ctl.options.label);
    ctl.measures.label = label.ok ? label : null;
    ctl.note = label.ok ? 'Local label prepared: SIMULATED, not deployed, not written to memory or RAG.' : label.reason;
    paint(ctl, 'prepare');
  }

  function machineAction(ctl, a) {
    var r = advance(ctl.st, a, ctl.measures);
    if (!r.ok) {
      ctl.note = r.reason;
      paint(ctl, a.id);
      return;
    }
    transition(ctl, r.estado);
  }

  function reopenPractice(ctl, a) {
    if (stepOf(ctl.st) !== a.event) { return; }
    disposePractice(ctl);
    openPractice(ctl, a.event);
    paint(ctl, a.id);
  }

  function onAction(ctl, a) {
    if (ctl.closed) { return; }
    if (a.kind === 'sound') { setSound(ctl, !ctl.measures.soundOn); return; }
    if (a.kind === 'repeat') { repeatGuidance(ctl); return; }
    if (a.kind === 'exit') { exitLocal(ctl); return; }
    if (a.kind === 'prepare') { prepare(ctl); return; }
    if (a.kind === 'practice') { reopenPractice(ctl, a); return; }
    machineAction(ctl, a);
  }

  function copyState(st) {
    return Object.assign({}, st, { eventos: st.eventos.slice() });
  }

  function mount(doc, host, options) {
    options = options || {};
    var ctl = {
      doc: doc, host: host, options: options, env: environmentOf(doc, options), st: T.inicia(),
      measures: { practiceVerified: false, label: null, soundOn: false, reducedMotion: false, hasExit: typeof options.onExit === 'function' },
      form: { title: FORM_DEFAULT.title, rag_base_prompt: FORM_DEFAULT.rag_base_prompt },
      cues: idleCues(), note: null, practice: null, revision: 0, buttons: {}, closed: false
    };
    if (options.label && checkLabel(options.label).ok) {
      ctl.measures.label = options.label;
      var initial = JSON.parse(options.label.texto);
      ctl.form = { title: initial.title, rag_base_prompt: initial.rag_base_prompt };
    }
    ctl.measures.reducedMotion = ctl.env.reducedMotion;
    ctl.parts = buildDom(doc, host, ctl);
    paint(ctl, null);
    return {
      destroy: function () {
        teardown(ctl);
        if (ctl.parts.root.parentNode === host) { host.removeChild(ctl.parts.root); }
      },
      narrate: function (text) { if (ctl.closed) { return; } if (ctl.measures.soundOn) { ctl.cues.speech = speakReport(ctl.env, text); } paint(ctl, null); },
      state: function () { return copyState(ctl.st); },
      view: function () { return view(ctl.st, ctl.measures); }
    };
  }

  var AtlasTutorialGuide = {
    STAMP: STAMP, FRAME_SCHEMA: FRAME_SCHEMA, FRAME_LIMIT: FRAME_LIMIT, LABEL_LIMIT: LABEL_LIMIT,
    ORDER: ORDER, PRACTICE_SEEDS: PRACTICE_SEEDS, COPY: COPY, CARDS: CARDS, EGGS: EGGS,
    view: view, advance: advance, prepareLabel: prepareLabel, checkLabel: checkLabel,
    buildFrame: buildFrame, pickVoice: pickVoice, mount: mount
  };
  if (enNode) { module.exports = AtlasTutorialGuide; }
  else { raiz.AtlasTutorialGuide = AtlasTutorialGuide; }
})(this);
