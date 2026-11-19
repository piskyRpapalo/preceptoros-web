// C2 external intake: access evidence projection, not a browser measurement or authorization.
// Pure, non-served WEB module. Reuse existing preceptoros.acho/1; never claim a tested door is LIVE.
// The client of this module must supply actual harness readings and independently verify their receipt.
(function (root) {
  'use strict';
  var SF = typeof module === 'object' && module.exports
    ? require('../../public/game/state_frames.js') : root.AtlasStateFrames;
  var ORDER = ['keyboard', 'proxy_blocked', 'target_px', 'screenreader_role',
    'aria_live', 'audio', 'contrast_ratio', 'reduced_motion'];
  var LIMIT = 1024;

  function unknown(v) {
    return typeof v === 'string' && /^NO_DATA: [a-z0-9][a-z0-9_ .-]{3,95}$/i.test(v);
  }
  function bytes(v) { return new TextEncoder().encode(JSON.stringify(v)).length; }
  function assess(readings) {
    var problems = [], unknowns = [], failures = [];
    if (!readings || typeof readings !== 'object' || Array.isArray(readings)) {
      return { status: 'INVALID', problems: ['readings_not_object'] };
    }
    Object.keys(readings).forEach(function (key) {
      if (ORDER.indexOf(key) < 0) { problems.push('unexpected_' + key); }
    });
    ORDER.forEach(function (key) {
      var v = readings[key];
      if (unknown(v)) { unknowns.push(key); return; }
      if (v === undefined || v === null || (typeof v === 'string' && v.startsWith('NO_DATA'))) {
        problems.push(key + '_missing_cause'); return;
      }
      if (key === 'target_px' || key === 'contrast_ratio') {
        if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 10000) {
          problems.push(key + '_not_finite'); return;
        }
        if (v < (key === 'target_px' ? 44 : 4.5)) { failures.push(key); }
      } else if (key === 'screenreader_role') {
        if (typeof v !== 'string' || !/^(button|link|menuitem)$/.test(v)) {
          problems.push(key + '_invalid_role');
        }
      } else if (typeof v !== 'boolean') {
        problems.push(key + '_not_boolean');
      } else if ((key === 'proxy_blocked' && v) || (key !== 'proxy_blocked' && !v)) {
        failures.push(key);
      }
    });
    if (problems.length) { return { status: 'INVALID', problems: problems }; }
    return { status: failures.length ? 'FAIL' : unknowns.length ? 'NO_DATA' : 'REPORTED',
      problems: [], failures: failures, unknowns: unknowns };
  }

  function make(door, readings, provenance) {
    if (typeof door !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,47}$/.test(door)) {
      return { frame: null, problems: ['door_invalid'] };
    }
    var result = assess(readings);
    if (result.problems.length) { return { frame: null, problems: result.problems }; }
    if (provenance != null && (typeof provenance !== 'string' || provenance.length > 96 ||
        !/^[a-zA-Z0-9_./: -]+$/.test(provenance))) {
      return { frame: null, problems: ['provenance_invalid'] };
    }
    var note = result.status === 'FAIL' ? result.failures.join(',') :
      result.status === 'NO_DATA' ? result.unknowns.join(',') : 'harness_proof_unverified';
    var sentence = 'Access ' + door + ': ' + result.status + ' · ' + note;
    var frame = SF.stateFrame({ id: 'access.' + door, sentence: sentence });
    frame.access = { door: door, status: result.status, readings: readings,
      source: provenance || 'NO_DATA: no harness receipt',
      authority: 'NO_DATA: independent_harness_proof_unverified' };
    var problems = validate(frame);
    return problems.length ? { frame: null, problems: problems } : { frame: frame, problems: [] };
  }

  function validate(frame) {
    if (!frame || typeof frame !== 'object') { return ['frame_missing']; }
    var problems = SF.valida(frame), access = frame.access;
    if (!access || typeof access !== 'object') { return problems.concat(['access_missing']); }
    if (typeof access.door !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,47}$/.test(access.door)) {
      problems.push('door_invalid');
    }
    var result = assess(access.readings);
    problems.push.apply(problems, result.problems);
    if (access.status !== result.status || frame.id !== 'access.' + access.door) {
      problems.push('access_status_or_id_mismatch');
    }
    if (access.authority !== 'NO_DATA: independent_harness_proof_unverified') {
      problems.push('unverified_access_cannot_claim_authority');
    }
    if (typeof access.source !== 'string' || !/^[a-zA-Z0-9_./: -]{1,96}$/.test(access.source)) {
      problems.push('source_invalid');
    }
    var note = result.status === 'FAIL' ? result.failures.join(',') :
      result.status === 'NO_DATA' ? result.unknowns.join(',') : 'harness_proof_unverified';
    var sentence = 'Access ' + access.door + ': ' + result.status + ' · ' + note;
    if (!Array.isArray(frame.atoms) || frame.atoms.length !== 1 ||
        !frame.atoms[0] || frame.atoms[0].r !== sentence ||
        !Array.isArray(frame.change) || frame.change.length !== 1 || frame.change[0] !== sentence) {
      problems.push('visual_machine_sentence_mismatch');
    }
    if (frame.sound !== 'NO_DATA: no waves declared for this state') {
      problems.push('audio_claim_without_acho_waves');
    }
    if (bytes(frame) >= LIMIT) { problems.push('access_frame_over_1024'); }
    return problems;
  }
  var api = { ORDER: ORDER, LIMIT: LIMIT, assess: assess, make: make, validate: validate };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.AtlasAccessEvidence = api; }
})(this);
