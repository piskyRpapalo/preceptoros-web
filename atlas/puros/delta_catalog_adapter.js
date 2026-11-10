// B6: normalize a pinned catalog source; never invent an event or GitHub authority.
'use strict';
const crypto = require('node:crypto');
const CORE = require('./delta_ranked_tray.js');
const SCHEMA = 'preceptoros.delta-catalog-adapter/1';
const REPO = 'piskyRpapalo/preceptoros-web';
const FILE = 'docs/canon-map-details-20261107.md';
const SHA = /^[0-9a-f]{40}$/i;
const HASH = /^[0-9a-f]{64}$/i;
const CODE = /^[A-Z]{1,3}[1-9][0-9]{0,2}$/;
const noData = (cause, extra = {}) => ({ state: 'NO_DATA', cause, ...extra });

function catalogCodes(body) {
  if (typeof body !== 'string' || Buffer.byteLength(body, 'utf8') > 262144)
    return noData('catalog_body_missing_or_over_budget');
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex(s => /^## 9\s+·\s+/.test(s));
  if (start < 0) return noData('mission_section_missing');
  const codes = [], found = new Set();
  for (let n = start + 1; n < lines.length; n++) {
    if (/^## \d+\s+·/.test(lines[n])) break;
    const m = /^- ([A-Z]{1,3}[1-9][0-9]{0,2})\s+·\s+(.+)$/.exec(lines[n]);
    if (!m) continue;
    if (found.has(m[1])) return noData('mission_code_repeated', { code: m[1] });
    codes.push(m[1]); found.add(m[1]);
  }
  return codes.length ? { state: 'PARSED', codes, mission_count: codes.length }
    : noData('mission_rows_missing');
}

// Historical positions and build order must come from sourced receipts.
// A digest authenticates supplied bytes ONLY. It does not authenticate GitHub.
function normalize(input) {
  if (!input || input.schema !== SCHEMA) return noData('adapter_schema_invalid');
  const d = input.document;
  if (!d || d.repository !== REPO || d.path !== FILE ||
      !SHA.test(d.commit_sha || '') || !HASH.test(d.sha256 || ''))
    return noData('catalog_source_invalid');
  const url = 'https://github.com/' + REPO + '/blob/' + d.commit_sha + '/' + FILE;
  if (d.url !== url) return noData('catalog_url_not_pinned');
  const parsed = catalogCodes(d.body);
  if (parsed.state !== 'PARSED') return parsed;
  if (crypto.createHash('sha256').update(d.body, 'utf8').digest('hex') !== d.sha256)
    return noData('catalog_digest_mismatch');
  const base = { source: url, catalog_sha: d.commit_sha, mission_count: parsed.mission_count,
                 provenance: 'DECLARED_NOT_VERIFIED' };
  if (!Array.isArray(input.events)) return noData('historical_events_missing', base);
  if (input.events.length > 4000) return noData('events_over_budget', base);
  const allowed = new Set(parsed.codes), introductions = new Map(), events = [];
  for (let n = 0; n < input.events.length; n++) {
    const e = input.events[n];
    if (!e || !CODE.test(e.mission_code || '') || !allowed.has(e.mission_code))
      return noData('mission_code_unknown_at_' + n, base);
    if (!SHA.test(e.observed_commit_sha || ''))
      return noData('observation_sha_missing_at_' + n, base);
    if (e.kind === 'introduced') {
      if (introductions.has(e.mission_code))
        return noData('introduction_repeated_at_' + n, base);
      introductions.set(e.mission_code, e.id);
      events.push({ kind: e.kind, id: e.id, source: e.source,
                    position: e.position, contracts: e.contracts });
    } else if (e.kind === 'built') {
      if (!introductions.has(e.mission_code) ||
          introductions.get(e.mission_code) !== e.id)
        return noData('build_without_intro_at_' + n, base);
      if (e.sha !== e.observed_commit_sha)
        return noData('build_sha_mismatch_at_' + n, base);
      events.push({ kind: e.kind, id: e.id, source: e.source, sha: e.sha });
    } else return noData('event_kind_invalid_at_' + n, base);
  }
  const missing = parsed.codes.filter(code => !introductions.has(code));
  if (missing.length) return noData('mission_history_incomplete', {
    ...base, recorded_count: introductions.size, missing_count: missing.length,
    missing_sample: missing.slice(0, 8)
  });
  const snapshot = { schema: CORE.SCHEMA, catalog_sha: d.commit_sha, events };
  const distance = CORE.audit(snapshot);
  if (distance.state !== 'CALCULATED')
    return noData('core_' + distance.cause, base);
  return { state: 'PREPARED', ...base, snapshot, distance };
}
module.exports = Object.freeze({ SCHEMA, REPO, FILE, catalogCodes, normalize });
