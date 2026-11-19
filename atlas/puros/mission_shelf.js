// Mission shelf — readonly WEB-local hints, NOT a verified Public Mesa mirror (M2 pure, Mesa #50 CLAIM 7008064671).
// Every shelf entry is an Acho frame under 1,024 UTF-8 bytes. No network on load, no automatic sync,
// no second map, no new HTML. Reuses WEB mission_hotspots.js WAIT/WHAT only as local hints; Public Mesa is separate authority.
// Fields: source_repo, source_sha, generated_at, plus cause-bearing NO_DATA and STALE (>30 days).
// No forbidden terms (H7): oraculo, notario, depin, token, moneda, clearing, magia.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var SF = common ? require('../../public/game/state_frames.js') : root.AtlasStateFrames;
  var MH = common ? require('../../public/game/mission_hotspots.js') : root.AtlasMissionHotspots;

  var LIMITE_BYTES = 1024;
  var STALE_DAYS = 30;
  var MS_PER_DAY = 86400000;

  // These human-readable hints belong to the WEB repo. They are NOT the
  // authoritative Public Mesa catalog; no cross-repo sync has been measured.
  var SOURCE_REPO = 'piskyRpapalo/preceptoros-web';
  var SOURCE_PATH = 'public/game/mission_hotspots.js';
  // The source HEAD remains NO_DATA until a reproducible input is supplied.
  var SOURCE_SHA = 'NO_DATA: no exact-head SHA recorded for this shelf generation';

  // generated_at is ISO 8601; absent until a human records it.
  var GENERATED_AT = 'NO_DATA: no generation timestamp recorded';

  // Pure: shelfEntry(missionId, extra) → an Acho frame for one mission on the shelf.
  // missionId: a code from mission_hotspots.js WAIT/WHAT (e.g. 'H1', 'J7', 'Y1').
  // extra: optional { source_sha, generated_at, note } to override defaults.
  function shelfEntry(missionId, extra) {
    extra = extra || {};
    // A syntactically valid SHA only identifies a proposed source revision;
    // this pure module never claims to have fetched or verified its bytes.
    var sha = typeof extra.source_sha === 'string' && /^[a-f0-9]{40}$/.test(extra.source_sha)
      ? extra.source_sha : SOURCE_SHA;
    var gen = typeof extra.generated_at === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(extra.generated_at) &&
      Number.isFinite(Date.parse(extra.generated_at))
        ? extra.generated_at : GENERATED_AT;
    var what = (MH && MH.WHAT && MH.WHAT[missionId]) ? MH.WHAT[missionId] : 'NO_DATA: mission ' + missionId + ' not in WAIT/WHAT';
    var note = extra.note || '';
    var sentence = missionId + ': ' + what + '; source ' + SOURCE_REPO + '; sha ' + sha + '; generated ' + gen;
    if (note) { sentence += '; ' + note; }
    var frame = SF.stateFrame({ id: 'shelf.' + missionId, sentence: sentence });
    frame.source_repo = SOURCE_REPO;
    frame.source_path = SOURCE_PATH;
    frame.authority = 'NO_DATA';
    frame.authority_cause = 'public_mesa_catalog_not_projected';
    frame.source_sha = sha;
    frame.generated_at = gen;
    return frame;
  }

  // Pure: isStale(isoString, nowMs) → true if more than STALE_DAYS elapsed.
  // nowMs defaults to the caller-supplied value; no internal clock read.
  function isStale(isoString, nowMs) {
    if (typeof isoString !== 'string' || isoString.indexOf('NO_DATA') === 0) { return false; }
    var t = Date.parse(isoString);
    if (isNaN(t)) { return false; }
    return (nowMs - t) > STALE_DAYS * MS_PER_DAY;
  }

  // Pure: staleNote(isoString, nowMs) → a STALE annotation or empty string.
  function staleNote(isoString, nowMs) {
    return isStale(isoString, nowMs) ? 'STALE: generated_at ' + isoString + ' exceeds ' + STALE_DAYS + ' days' : '';
  }

  // Pure: validaShelf(frame) → list of problems; reuses state_frames.valida plus shelf-specific checks.
  function validaShelf(frame) {
    var problemas = SF.valida(frame);
    if (!frame.source_repo || typeof frame.source_repo !== 'string') {
      problemas.push('source_repo not declared');
    }
    if (!frame.source_sha || typeof frame.source_sha !== 'string') {
      problemas.push('source_sha not declared');
    }
    if (frame.authority !== 'NO_DATA' || frame.authority_cause !== 'public_mesa_catalog_not_projected') {
      problemas.push('unverified Public Mesa content cannot claim authority');
    }
    if (frame.source_path !== SOURCE_PATH || frame.source_repo !== SOURCE_REPO) {
      problemas.push('source path does not match WEB-local mission hints');
    }
    if (frame.source_sha && !frame.source_sha.startsWith('NO_DATA:') &&
        !/^[a-f0-9]{40}$/.test(frame.source_sha)) {
      problemas.push('source_sha is not an exact Git commit SHA');
    }
    if (!frame.generated_at || typeof frame.generated_at !== 'string') {
      problemas.push('generated_at not declared');
    }
    var texto = JSON.stringify(frame);
    var bytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(texto).length : texto.length;
    if (bytes >= LIMITE_BYTES) {
      // Already caught by SF.valida, but record the shelf-specific cause.
      problemas.push('shelf frame ' + bytes + ' bytes exceeds ' + LIMITE_BYTES + ' Acho limit');
    }
    return problemas;
  }

  // Pure: shelfBatch(ids, extra) → array of shelf frames, one per mission id.
  function shelfBatch(ids, extra) {
    return (ids || []).map(function (id) { return shelfEntry(id, extra); });
  }

  var api = {
    SOURCE_REPO: SOURCE_REPO,
    SOURCE_PATH: SOURCE_PATH,
    SOURCE_SHA: SOURCE_SHA,
    GENERATED_AT: GENERATED_AT,
    STALE_DAYS: STALE_DAYS,
    LIMITE_BYTES: LIMITE_BYTES,
    shelfEntry: shelfEntry,
    shelfBatch: shelfBatch,
    isStale: isStale,
    staleNote: staleNote,
    validaShelf: validaShelf
  };
  if (common) { module.exports = api; }
  else { root.AtlasMissionShelf = api; }
})(typeof globalThis === 'object' ? globalThis : this);
