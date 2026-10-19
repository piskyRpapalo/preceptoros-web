(function (raiz) {
  'use strict';
  var enNode = typeof module === 'object' && !!module.exports;
  var AFM = enNode ? require('./audio_feedback_manager.js') : raiz.AudioFeedbackManager;
  var M = enNode ? require('./en301_tutorial_model.js') : raiz.AtlasTutorialGuideModel;
  var STAMP = M.STAMP;
  var FRAME_SCHEMA = M.FRAME_SCHEMA;
  var FRAME_LIMIT = M.FRAME_LIMIT;
  var LABEL_LIMIT = M.LABEL_LIMIT;
  var ORDER = M.ORDER;
  var MACHINE_EVENTS = M.MACHINE_EVENTS;
  var PRACTICE_STEPS = M.PRACTICE_STEPS;
  var PRACTICE_SEEDS = M.PRACTICE_SEEDS;
  var TONE = M.TONE;
  var EGGS = M.EGGS;
  var CARDS = M.CARDS;
  var FORM_DEFAULT = M.FORM_DEFAULT;
  var TRANSFER_CAUSE = M.TRANSFER_CAUSE;
  var CARD_CAUSE = M.CARD_CAUSE;
  var PRACTICE_CAUSE = M.PRACTICE_CAUSE;
  var BUILDING_CAUSE = M.BUILDING_CAUSE;
  var PREVIEW_TEXT = M.PREVIEW_TEXT;
  var DISIPA_CAUSE = M.DISIPA_CAUSE;
  var IDLE_CAUSE = M.IDLE_CAUSE;
  var TONE_NO_START = M.TONE_NO_START;
  var NO_STATE_CAUSE = M.NO_STATE_CAUSE;
  var COPY = M.COPY;
  var hasOwn = M.hasOwn;
  var refuse = M.refuse;
  var report = M.report;
  var bytesOf = M.bytesOf;
  var stepOf = M.stepOf;
  var ordinalOf = M.ordinalOf;
  var spokenOf = M.spokenOf;
  var doorOf = M.doorOf;
  var readMeasures = M.readMeasures;
  var canonicalLabel = M.canonicalLabel;
  var checkLabel = M.checkLabel;
  var prepareLabel = M.prepareLabel;
  var settle = M.settle;
  var machineStep = M.machineStep;
  var advanceDoor = M.advanceDoor;
  var advanceBuilding = M.advanceBuilding;
  var gateOf = M.gateOf;
  var dataOf = M.dataOf;
  var advance = M.advance;
  var action = M.action;
  var doorAction = M.doorAction;
  var buildingCause = M.buildingCause;
  var stepActions = M.stepActions;
  var soundAction = M.soundAction;
  var repeatAction = M.repeatAction;
  var exitAction = M.exitAction;
  var actionsOf = M.actionsOf;
  var stepCause = M.stepCause;
  var cardsOf = M.cardsOf;
  var eggsOf = M.eggsOf;
  var previewOf = M.previewOf;
  var formOf = M.formOf;
  var cueSound = M.cueSound;
  var cueHaptic = M.cueHaptic;
  var buildFrame = M.buildFrame;
  var frameOf = M.frameOf;
  var noDataView = M.noDataView;
  var view = M.view;
  function pickVoice(voices) {
    var local = (voices || []).filter(function (voice) { return !!voice && voice.localService === true; });
    var english = local.filter(function (voice) { return /^en([-_]|$)/i.test(String(voice.lang || '')); });
    return english[0] || local[0] || null;
  }

  function stopSpeech(env) {
    if (env.speech && typeof env.speech.cancel === 'function') { env.speech.cancel(); }
  }

  function speakReport(env, text) {
    var synth = env.speech;
    if (!synth || typeof synth.speak !== 'function' || typeof env.Utterance !== 'function') {
      return report('NO_DATA', 'speech synthesis is not available on this device');
    }
    var voice = pickVoice(typeof synth.getVoices === 'function' ? synth.getVoices() : []);
    if (!voice) { return report('NO_DATA', 'no local speech voice is installed; cloud voices are not used'); }
    try {
      var utterance = new env.Utterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      if (typeof synth.cancel === 'function') { synth.cancel(); }
      synth.speak(utterance);
      return report('SPOKEN', null);
    } catch (e) {
      return report('NO_DATA', 'local speech failed');
    }
  }

  function toneReport(env) {
    var r = env.audio.verb(TONE.verb, TONE.state, TONE.cause);
    return r ? report(r.sonido, r.sonido_causa) : report('NO_DATA', 'tone was not produced');
  }

  function hapticReport(env, cue) {
    if (!cue) { return report('INACTIVO', 'haptics need sound opt-in and no reduced-motion request'); }
    if (typeof env.vibrate !== 'function') { return report('NO_DATA', 'vibration is not available on this device'); }
    try {
      if (env.vibrate(cue.ms) === false) { return report('NO_DATA', 'Device declined vibration.'); }
      return report('PULSED', null);
    } catch (e) {
      return report('NO_DATA', 'vibration failed');
    }
  }

  function windowOf(doc) { return (doc && doc.defaultView) || raiz; }

  function prefersReduced(win) {
    return !!(win && typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function missingAudio() {
    var none = 'audio feedback manager is not loaded';
    return {
      habilitar: function () { return { estado: 'NO_DATA', causa: none }; },
      deshabilitar: function () { return { estado: 'DESHABILITADO' }; },
      verb: function () { return { sonido: 'NO_DATA', sonido_causa: none }; }
    };
  }

  function environmentOf(doc, options) {
    var win = windowOf(doc), nav = win.navigator || {};
    return {
      audio: options.audio || AFM || missingAudio(),
      speech: hasOwn(options, 'speech') ? options.speech : (win.speechSynthesis || null),
      Utterance: options.Utterance || win.SpeechSynthesisUtterance || null,
      vibrate: hasOwn(options, 'vibrate') ? options.vibrate : (typeof nav.vibrate === 'function' ? nav.vibrate.bind(nav) : null),
      reducedMotion: hasOwn(options, 'reducedMotion') ? options.reducedMotion === true : prefersReduced(win)
    };
  }

  var api = { pickVoice: pickVoice, stopSpeech: stopSpeech, speakReport: speakReport, toneReport: toneReport, hapticReport: hapticReport, windowOf: windowOf, prefersReduced: prefersReduced, missingAudio: missingAudio, environmentOf: environmentOf };
  if (enNode) { module.exports = api; } else { raiz.AtlasTutorialGuideAudio = api; }
})(this);
