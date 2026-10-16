// Candidate 2: source values expressed as typed geometry, not inferred world state.
import { byteCount, canonicalJson, canonicalHash, textHash, LIMIT } from './state_readability_probe.mjs';
import { namedProjection, NAMED_DICTIONARY } from './state_readability_named.mjs';

export const GEOMETRY_SCHEMA = 'preceptoros.state-geometry/1';
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
// Exact manifest evidence measured before this candidate was frozen. Unknown ids stay unknown.
export const MANIFEST_TYPE_EVIDENCE = freeze({
  'boya-estado': {
    type: 'buoy', source_type: 'boya', source_anchor: 'public/game/reef_buildings_layer.js:74-77',
    source_sha256: '562879f4378a7dcce6e38f65ec6f112a920ca828204d5ab7affc8cbdbc2427cd',
    evidence: 'manifiestoBoya returns this exact id and source type; buoy is its English dictionary label'
  }
});
const parent = JSON.parse(canonicalJson(NAMED_DICTIONARY));
export const GEOMETRY_DICTIONARY = freeze({
  ...parent, schema: 'preceptoros.state-geometry-dictionary/1', output_schema: GEOMETRY_SCHEMA,
  parent_dictionary_sha256: canonicalHash(NAMED_DICTIONARY),
  mappings: { ...parent.mappings,
    k: 'crab.position is the source [x,y] tuple; coordinate_space=home_offset; army and skills unchanged',
    e: 'buildings preserve source id, phase and life; type is an exact-id manifest dictionary enrichment'
  },
  manifest_types: MANIFEST_TYPE_EVIDENCE,
  geometry: 'Position is relative to home, never a calculated absolute world coordinate',
  unknown_type: 'null with NO_DATA cause; no pattern matching, translation of phase or guessed classification'
});

// Composition preserves every value represented by candidate 1; only its notation changes.
export function geometryProjection(vector) {
  const projection = namedProjection(vector);
  projection.schema = GEOMETRY_SCHEMA;
  if (projection.crab) {
    const crab = projection.crab;
    projection.crab = { position: [crab.offset.x, crab.offset.y], coordinate_space: crab.offset.space,
      army: crab.army, skills: crab.skills };
  }
  projection.buildings = projection.buildings.map((building) => {
    const evidence = Object.hasOwn(MANIFEST_TYPE_EVIDENCE, building.id) ? MANIFEST_TYPE_EVIDENCE[building.id] : null;
    return evidence ? { ...building, type: evidence.type } : { ...building, type: null,
      type_cause: 'NO_DATA: no exact manifest dictionary entry' };
  });
  projection.dictionary_enrichment = 'manifest';
  return projection;
}

// The wrapper is evidence only. Send wire_text alone with the unchanged reading task.
// An oversized candidate is rejected whole, never shortened or partly emitted.
export function geometryWire(vector) {
  const dictionaryText = canonicalJson(GEOMETRY_DICTIONARY);
  const evidence = { schema: GEOMETRY_SCHEMA, limit_bytes: LIMIT, limit_relation: '<',
    dictionary_bytes: byteCount(dictionaryText), dictionary_sha256: textHash(dictionaryText), dictionary_in_wire: false,
    enrichment: 'exact_manifest_dictionary', manifest_evidence_sha256: canonicalHash(MANIFEST_TYPE_EVIDENCE),
    executed_actions: 0, signatures_requested: 0, network_requests: 0 };
  try {
    const sourceHash = canonicalHash(vector), wireText = canonicalJson(geometryProjection(vector));
    const count = byteCount(wireText), candidateHash = textHash(wireText);
    if (count >= LIMIT) return { ...evidence, ok: false, state: 'NO_DATA', source_sha256: sourceHash,
      cause: 'Geometry state is not below 1024 UTF-8 bytes; no fields were removed and no state was emitted',
      candidate_bytes: count, candidate_sha256: candidateHash };
    return { ...evidence, ok: true, state: 'MEDIDO', meaning_status: 'UNVERIFIED',
      scope: 'Source geometry projection with declared manifest dictionary enrichment; no model comprehension claimed',
      source_sha256: sourceHash, wire_text: wireText, wire_bytes: count, wire_sha256: candidateHash };
  } catch {
    return { ...evidence, ok: false, state: 'NO_DATA',
      cause: 'Source vector cannot be projected without guessing; no state was emitted' };
  }
}
