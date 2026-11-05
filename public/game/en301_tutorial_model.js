(function (raiz) {
  'use strict';
  var enNode = typeof module === 'object' && !!module.exports;
  var T = enNode ? require('./tutorial_fases.js') : raiz.AtlasTutorial;
  var E = enNode ? require('./etiqueta.js') : raiz.AtlasEtiqueta;
  var K = enNode ? require('./en301_tutorial_copy.js') : raiz.AtlasTutorialCopy;
  var COPY = K.COPY;
  var READY_NEXT = K.READY_NEXT;
  var B = enNode ? require('./en301_tutorial_building.js') : raiz.En301TutorialBuilding;
  var STAMP = 'SIMULATED';
  var FRAME_SCHEMA = 'preceptoros.tutorial-frame/1';
  var FRAME_LIMIT = 1024;
  var LABEL_LIMIT = 1024;
  var ORDER = ['puerta', 'pulso', 'disipa', 'arena101', 'recompensa', 'campamento', 'primer_edificio', 'cartas', 'salto'];
  var MACHINE_EVENTS = ['door', 'pulso', 'disipa', 'arena101', 'recompensa', 'campamento', 'primer_edificio', 'cartas'];
  var PRACTICE_STEPS = ['arena101', 'campamento'];
  var PRACTICE_SEEDS = { arena101: 'practice-arena-101', campamento: 'practice-camp-202' };
  var TONE = { verb: 'state', state: 'PROPOSED', cause: 'Local practice; no signed game effect' };
  var EGGS = ['Shield', 'Pike', 'Bow'];
  var CARDS = ['Atlantis', 'the Risen'];
  var FORM_DEFAULT = { title: 'My beacon', rag_base_prompt: 'A local practice beacon. Proposals require human review.' };
  var TRANSFER_CAUSE = 'no signed visit card or transport exists: real node transfer is unavailable';
  var CARD_CAUSE = 'no verified local signed visit card for this node';
  var PRACTICE_CAUSE = 'practice result not verified yet';
  var BUILDING_CAUSE = 'no prepared local label yet: press "Prepare local label" first';
  var PREVIEW_TEXT = 'Practice beacon preview: a simulated ring of fog around a local practice building. Not deployed.';
  var DISIPA_CAUSE = 'the first building is measured in F2, not in the fog';
  var IDLE_CAUSE = 'sound is off until you turn it on';
  var TONE_NO_START = 'local tone could not start: Web Audio is unavailable or was refused';
  var NO_STATE_CAUSE = 'the tutorial state names no known step';


  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function refuse(reason) { return { ok: false, reason: reason }; }
  function report(status, cause) { return { status: status, cause: cause || null }; }
  function bytesOf(text) { return new TextEncoder().encode(text).length; }
  function stepOf(st) { return st && st.fase === 'F0' ? 'puerta' : (st ? st.paso : null); }
  function ordinalOf(step) { return ORDER.indexOf(step) + 1; }
  function spokenOf(copy) { return copy.heading + '. ' + copy.instruction + ' ' + copy.next; }

  function doorOf(name) {
    if (name === 'direct' || name === 'directo') { return 'directo'; }
    if (name === 'niebla') { return 'niebla'; }
    return null;
  }

  function readMeasures(measures) {
    var m = measures && typeof measures === 'object' ? measures : {};
    return {
      practiceVerified: m.practiceVerified === true,
      practiceReady: m.practiceReady === true,
      label: m.label || null,
      soundOn: m.soundOn === true,
      reducedMotion: m.reducedMotion === true,
      hasExit: m.hasExit === true
    };
  }

  function canonicalLabel(texto) {
    var parsed;
    try { parsed = JSON.parse(texto); } catch (e) { return refuse('label text is not JSON'); }
    var again = E.etiqueta(parsed);
    if (!again.ok || again.texto !== texto) { return refuse('label is not canonical AtlasEtiqueta output'); }
    return { ok: true, texto: texto, bytes: again.bytes };
  }

  function checkLabel(label) {
    if (!label || typeof label !== 'object' || label.ok !== true) { return refuse('label is absent or not an AtlasEtiqueta result'); }
    if (typeof label.texto !== 'string') { return refuse('label text is missing'); }
    var n = bytesOf(label.texto);
    if (label.bytes !== n) { return refuse('label byte count does not match its text'); }
    if (n >= LABEL_LIMIT) { return refuse('label of ' + n + ' B is not strictly below ' + LABEL_LIMIT + ' B'); }
    if (!B.measured(label.texto)) { return refuse('NO_DATA: building contract measures missing or changed'); }
    return canonicalLabel(label.texto);
  }

  function prepareLabel(form, source) {
    var base = {};
    if (source) {
      var valid = checkLabel(source);
      if (!valid.ok) { return valid; }
      base = JSON.parse(valid.texto);
    }
    var made = E.etiqueta(Object.assign(base, { title: form && form.title, rag_base_prompt: form && form.rag_base_prompt }));
    if (!made.ok) { return refuse('title and rag_base_prompt are required, and the label must stay under ' + LABEL_LIMIT + ' B'); }
    return checkLabel(made);
  }

  function settle(estado) {
    return T.invariantes(estado) ? refuse('tutorial invariant broken') : { ok: true, estado: estado };
  }

  function machineStep(st, name, datos) {
    var r = T.evento(st, name, datos);
    return r.ok ? settle(r.estado) : refuse('step ' + stepOf(st) + ' does not accept ' + name);
  }

  function advanceDoor(st, action) {
    var door = doorOf(action.door);
    if (!door) { return refuse('unknown door'); }
    var r = T.elige(st, door);
    return r.ok ? settle(r.estado) : refuse('doors exist only in F0');
  }

  function advanceBuilding(st, m) {
    var label = checkLabel(m.label);
    return label.ok ? machineStep(st, 'primer_edificio', { etiqueta: label.texto }) : label;
  }

  function gateOf(event, m) {
    if (PRACTICE_STEPS.indexOf(event) >= 0 && !m.practiceVerified) { return 'practice result not verified: ' + event + ' stays closed'; }
    return null;
  }

  function dataOf(event) {
    if (event === 'recompensa') { return { huevos: 3 }; }
    if (event === 'disipa') { return { dato: 'NO_DATA', causa: DISIPA_CAUSE }; }
    return {};
  }

  function advance(st, action, measures) {
    var m = readMeasures(measures);
    if (!st || typeof st !== 'object') { return refuse('state is missing'); }
    if (!action || typeof action !== 'object') { return refuse('action must be an object'); }
    if (action.event === 'cruza') { return refuse(TRANSFER_CAUSE); }
    if (action.event === 'door') { return advanceDoor(st, action); }
    if (MACHINE_EVENTS.indexOf(action.event) < 0) { return refuse('not a tutorial machine event; the host handles this action'); }
    var gate = gateOf(action.event, m);
    if (gate) { return refuse(gate); }
    if (action.event === 'primer_edificio') { return advanceBuilding(st, m); }
    if (action.event === 'disipa' && m.label && checkLabel(m.label).ok) { return machineStep(st, 'disipa', { dato: 'medido', etiqueta: m.label.texto }); }
    return machineStep(st, action.event, dataOf(action.event));
  }

  function action(id, label, kind, event, cause) {
    return { id: id, label: label, kind: kind, event: event || null, enabled: !cause, cause: cause || null };
  }

  function doorAction(id, label, door) {
    var a = action(id, label, 'machine', 'door');
    a.door = door;
    return a;
  }

  function buildingCause(m) {
    if (!m.label) { return BUILDING_CAUSE; }
    var c = checkLabel(m.label);
    return c.ok ? null : c.reason;
  }

  function stepActions(step, m) {
    if (step === 'puerta') { return [doorAction('door-direct', 'Go straight to visit cards', 'directo'), doorAction('door-niebla', 'Start in the Fog', 'niebla')]; }
    if (step === 'pulso') { return [action('pulso', 'Pulse the Wave', 'machine', 'pulso')]; }
    if (step === 'disipa') { return [action('disipa', 'Clear the fog', 'machine', 'disipa')]; }
    if (step === 'arena101') { return [action('arena101', 'Reopen practice fight', 'practice', 'arena101')]; }
    if (step === 'recompensa') { return [action('recompensa', 'Collect 3 practice eggs', 'machine', 'recompensa')]; }
    if (step === 'campamento') { return [action('campamento', 'Reopen camp fight', 'practice', 'campamento')]; }
    if (step === 'primer_edificio') {
      return [action('prepare', 'Prepare local label', 'prepare', null), action('primer_edificio', 'Place first building', 'machine', 'primer_edificio', buildingCause(m))];
    }
    if (step === 'cartas') { return [action('cartas', 'Show crossing options', 'machine', 'cartas')]; }
    if (step === 'salto') { return [action('cruza', 'Cross to Node 3', 'machine', 'cruza', TRANSFER_CAUSE)]; }
    return [];
  }

  function soundAction(m) {
    return action('sound', m.soundOn ? 'Turn sound off' : 'Enable sound and hear guidance', 'sound', null);
  }

  function repeatAction(m) {
    return action('repeat', 'Repeat guidance', 'repeat', null, m.soundOn ? null : 'sound is off: enable it to hear guidance');
  }

  function exitAction(step, m) {
    var label = step === 'puerta' ? 'Play locally' : 'Keep playing locally';
    return action('exit', label, 'exit', null, m.hasExit ? null : 'no local game is attached to this tutorial');
  }

  function actionsOf(step, m) {
    return [soundAction(m)].concat(stepActions(step, m), [repeatAction(m), exitAction(step, m)]);
  }

  function stepCause(step, m) {
    if (PRACTICE_STEPS.indexOf(step) >= 0) { return m.practiceVerified || m.practiceReady ? null : PRACTICE_CAUSE; }
    if (step === 'primer_edificio') { return buildingCause(m); }
    if (step === 'cartas') { return CARD_CAUSE; }
    if (step === 'salto') { return TRANSFER_CAUSE; }
    return null;
  }

  function cardsOf(step) {
    if (step !== 'cartas') { return null; }
    return CARDS.map(function (name) { return { name: name, stamp: 'NO_DATA', cause: CARD_CAUSE }; });
  }

  function eggsOf(step) { return step === 'recompensa' ? EGGS.slice() : null; }

  function previewOf(step) {
    return step === 'pulso' || step === 'disipa' ? { stamp: STAMP, text: PREVIEW_TEXT } : null;
  }

  function formOf(step) {
    return step === 'primer_edificio' ? { title: FORM_DEFAULT.title, rag_base_prompt: FORM_DEFAULT.rag_base_prompt } : null;
  }

  function cueSound(m) { return m.soundOn ? 'state:PROPOSED' : 'off'; }

  function cueHaptic(m, step) {
    return m.soundOn && !m.reducedMotion ? { pulses: 1, ms: ordinalOf(step) * 10 } : null;
  }

  function buildFrame(fields) {
    var size = bytesOf(JSON.stringify(fields));
    if (size < FRAME_LIMIT) { return fields; }
    return {
      schema: FRAME_SCHEMA, phase: fields.phase, step: fields.step, stamp: 'NO_DATA',
      cause: 'frame of ' + size + ' B exceeds ' + FRAME_LIMIT + ' B; nothing was truncated',
      text: null, next: null, sound: fields.sound, haptic: null
    };
  }

  function frameOf(st, step, copy, cause, m) {
    return buildFrame({
      schema: FRAME_SCHEMA, phase: st.fase, step: step, stamp: STAMP, cause: cause || null,
      text: copy.instruction, next: copy.next, sound: cueSound(m), haptic: cueHaptic(m, step)
    });
  }

  function noDataView(st, m) {
    var phase = st && st.fase ? st.fase : null;
    var copy = { heading: 'NO_DATA', instruction: NO_STATE_CAUSE, next: 'Next: press "Keep playing locally" to return to the local game.' };
    var spoken = spokenOf(copy);
    return {
      phase: phase, step: null, heading: copy.heading, instruction: copy.instruction, next: copy.next,
      stamp: STAMP, audible_text: spoken, mirror_text: spoken,
      frame: buildFrame({ schema: FRAME_SCHEMA, phase: phase, step: null, stamp: 'NO_DATA', cause: NO_STATE_CAUSE, text: null, next: null, sound: cueSound(m), haptic: null }),
      cause: NO_STATE_CAUSE, progress: { done: 0, total: ORDER.length },
      actions: [soundAction(m), exitAction('noData', m)], preview: null, cards: null, eggs: null, form: null
    };
  }

  function view(st, measures) {
    var m = readMeasures(measures), step = stepOf(st);
    if (!hasOwn(COPY, step)) { return noDataView(st, m); }
    var copy = COPY[step], cause = stepCause(step, m);
    if (m.practiceReady && PRACTICE_STEPS.indexOf(step) >= 0) { copy = { heading: copy.heading, instruction: copy.instruction, next: READY_NEXT }; }
    var spoken = spokenOf(copy);
    return {
      phase: st.fase, step: step, heading: copy.heading, instruction: copy.instruction, next: copy.next,
      stamp: STAMP, audible_text: spoken, mirror_text: spoken,
      frame: frameOf(st, step, copy, cause, m), cause: cause,
      progress: { done: ordinalOf(step), total: ORDER.length },
      actions: actionsOf(step, m), preview: previewOf(step), cards: cardsOf(step), eggs: eggsOf(step), form: formOf(step)
    };
  }

  var api = {
    STAMP: STAMP,
    FRAME_SCHEMA: FRAME_SCHEMA,
    FRAME_LIMIT: FRAME_LIMIT,
    LABEL_LIMIT: LABEL_LIMIT,
    ORDER: ORDER,
    MACHINE_EVENTS: MACHINE_EVENTS,
    PRACTICE_STEPS: PRACTICE_STEPS,
    PRACTICE_SEEDS: PRACTICE_SEEDS,
    TONE: TONE,
    EGGS: EGGS,
    CARDS: CARDS,
    FORM_DEFAULT: FORM_DEFAULT,
    TRANSFER_CAUSE: TRANSFER_CAUSE,
    CARD_CAUSE: CARD_CAUSE,
    PRACTICE_CAUSE: PRACTICE_CAUSE,
    BUILDING_CAUSE: BUILDING_CAUSE,
    PREVIEW_TEXT: PREVIEW_TEXT,
    DISIPA_CAUSE: DISIPA_CAUSE,
    IDLE_CAUSE: IDLE_CAUSE,
    TONE_NO_START: TONE_NO_START,
    NO_STATE_CAUSE: NO_STATE_CAUSE,
    COPY: COPY,
    hasOwn: hasOwn,
    refuse: refuse,
    report: report,
    bytesOf: bytesOf,
    stepOf: stepOf,
    ordinalOf: ordinalOf,
    spokenOf: spokenOf,
    doorOf: doorOf,
    readMeasures: readMeasures,
    canonicalLabel: canonicalLabel,
    checkLabel: checkLabel,
    prepareLabel: prepareLabel,
    settle: settle,
    machineStep: machineStep,
    advanceDoor: advanceDoor,
    advanceBuilding: advanceBuilding,
    gateOf: gateOf,
    dataOf: dataOf,
    advance: advance,
    action: action,
    doorAction: doorAction,
    buildingCause: buildingCause,
    stepActions: stepActions,
    soundAction: soundAction,
    repeatAction: repeatAction,
    exitAction: exitAction,
    actionsOf: actionsOf,
    stepCause: stepCause,
    cardsOf: cardsOf,
    eggsOf: eggsOf,
    previewOf: previewOf,
    formOf: formOf,
    cueSound: cueSound,
    cueHaptic: cueHaptic,
    buildFrame: buildFrame,
    frameOf: frameOf,
    noDataView: noDataView,
    view: view
  };
  if (enNode) { module.exports = api; } else { raiz.AtlasTutorialGuideModel = api; }
})(this);
