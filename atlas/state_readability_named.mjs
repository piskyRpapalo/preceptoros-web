// Proposed named projection for an offline reading experiment. No world effects.
import { byteCount, canonicalJson, canonicalHash, textHash, LIMIT } from './state_readability_probe.mjs';

export const NAMED_SCHEMA = 'preceptoros.named-state/1';
export const NAMED_DICTIONARY = Object.freeze({
  schema: 'preceptoros.named-state-dictionary/1', source_schema: 'preceptoros.vector/1', output_schema: NAMED_SCHEMA,
  mappings: {
    c: 'world.cycle', r: 'world.resources: copper, light, biomass, oxygen',
    k: 'crab.offset: x, y, space=home_offset; army; skills: swim, reach',
    e: 'buildings: id, phase, life_per_thousand', p: 'panel: id, seal, age_cycles',
    t: 'tutorial: step, demonstrated_actions', l: 'places: name, wins, losses',
    n: 'nodes: id, measured_fraction', z: 'tombstone_count', q: 'radio: speaker, seal, cycle',
    g: 'panel_transition: from, to, text_delta, open_count', nd: 'no_data: source causes with named keys'
  },
  null_meaning: 'No value encoded by the source; no zero or absolute position may be inferred',
  scope: 'Lossless projection of this source vector; world data absent from the source remain unavailable',
  control: 'Read-only state, never an action, signature or permission'
});

const SOURCE_KEYS = ['v', 'c', 'r', 'k', 'p', 't', 'e', 'l', 'n', 'z', 'q', 'g', 'nd'];
const CAUSE_KEYS = { c: 'cycle', r: 'resources', k: 'crab', p: 'panel', t: 'tutorial',
  e: 'buildings', l: 'places', n: 'nodes', z: 'tombstones', q: 'radio', g: 'panel_transition', recorte: 'source_trim' };
const fail = (message) => { throw new TypeError(message); };
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value) => value === null || typeof value === 'number' && Number.isFinite(value);
const integer = (value) => value === null || Number.isSafeInteger(value);
const text = (value) => typeof value === 'string';
const primitive = (value) => value === null || text(value) || finite(value) || typeof value === 'boolean';
function tuple(value, width, checks) {
  if (!Array.isArray(value) || value.length !== width || checks.some((check, index) => !check(value[index]))) fail('Source tuple shape rejected');
  return value;
}
function rows(value, width, checks, build) {
  if (!Array.isArray(value)) fail('Source collection shape rejected');
  return value.map((row) => build(tuple(row, width, checks)));
}
function optional(value, width, checks, build) { return value === null ? null : build(tuple(value, width, checks)); }
function causes(value) {
  if (!isObject(value)) fail('Source causes shape rejected');
  const result = {};
  for (const key of Object.keys(value).sort()) {
    if (!text(value[key]) || !value[key]) fail('Source cause is not explicit text');
    const name = CAUSE_KEYS[key] || 'source_' + key;
    if (Object.hasOwn(result, name)) fail('Source cause mapping collision');
    Object.defineProperty(result, name, { value: value[key], enumerable: true });
  }
  return result;
}

// Every source field is mapped. A budget failure rejects the whole candidate.
// Values such as a phase name are preserved, not translated or guessed.
export function namedProjection(vector) {
  if (!isObject(vector) || vector.v !== 'preceptoros.vector/1'
    || SOURCE_KEYS.some((key) => !Object.hasOwn(vector, key))
    || Object.keys(vector).some((key) => !SOURCE_KEYS.includes(key))) fail('Source vector schema rejected');
  if (!integer(vector.c) || !integer(vector.z)) fail('Source cycle or count rejected');
  const resources = vector.r === null ? null : tuple(vector.r, 4, [finite, finite, finite, finite]);
  const crab = optional(vector.k, 5, [integer, integer, integer, integer, integer],
    (row) => ({ offset: { x: row[0], y: row[1], space: 'home_offset' }, army: row[2], skills: { swim: row[3], reach: row[4] } }));
  const missing = causes(vector.nd);
  const hasNull = (value) => value === null || value && typeof value === 'object' && Object.values(value).some(hasNull);
  if (hasNull(vector)) missing.null_value = 'Source null; use a named cause when provided';
  if (vector.c === null && !missing.cycle) missing.cycle = 'Source cycle is null';
  if (resources === null && !missing.resources) missing.resources = 'Source resources are null';
  if (crab === null && !missing.crab) missing.crab = 'Source crab data are null';
  if (vector.z === null && !missing.tombstones) missing.tombstones = 'Source count is null';
  if (resources) ['copper', 'light', 'biomass', 'oxygen'].forEach((name, index) => {
    if (resources[index] === null) missing['resource_' + name] = 'Source resource value is null';
  });
  return {
    schema: NAMED_SCHEMA,
    world: { cycle: vector.c, resources: resources === null ? null : {
      copper: resources[0], light: resources[1], biomass: resources[2], oxygen: resources[3]
    } },
    crab,
    buildings: rows(vector.e, 3, [text, text, integer], (row) => ({ id: row[0], phase: row[1], life_per_thousand: row[2] })),
    panel: optional(vector.p, 3, [text, text, integer], (row) => ({ id: row[0], seal: row[1], age_cycles: row[2] })),
    tutorial: optional(vector.t, 2, [text, integer], (row) => ({ step: row[0], demonstrated_actions: row[1] })),
    places: rows(vector.l, 3, [text, integer, integer], (row) => ({ name: row[0], wins: row[1], losses: row[2] })),
    nodes: rows(vector.n, 2, [text, text], (row) => ({ id: row[0], measured_fraction: row[1] })),
    tombstone_count: vector.z,
    radio: rows(vector.q, 3, [text, text, integer], (row) => ({ speaker: row[0], seal: row[1], cycle: row[2] })),
    panel_transition: optional(vector.g, 4, [primitive, primitive, primitive, integer],
      (row) => ({ from: row[0], to: row[1], text_delta: row[2], open_count: row[3] })),
    no_data: missing,
    completeness: { state: 'PARTIAL', projection: 'all source fields',
      absent_from_source: ['absolute_position', 'camera', 'harmonics', 'color_mapping', 'sound_recipe'] }
  };
}

// An evidence wrapper, not part of the state sent to the reader.
// Dictionary and prompt costs are separate from the strict state byte budget.
export function namedWire(vector) {
  const dictionaryText = canonicalJson(NAMED_DICTIONARY);
  const evidence = { schema: NAMED_SCHEMA, limit_bytes: LIMIT, limit_relation: '<',
    dictionary_bytes: byteCount(dictionaryText), dictionary_sha256: textHash(dictionaryText),
    dictionary_in_wire: false, executed_actions: 0, signatures_requested: 0, network_requests: 0 };
  try {
    const sourceHash = canonicalHash(vector), projection = namedProjection(vector), wireText = canonicalJson(projection);
    const count = byteCount(wireText), candidateHash = textHash(wireText);
    if (count >= LIMIT) return { ...evidence, ok: false, state: 'NO_DATA', source_sha256: sourceHash,
      cause: 'Named state is not below 1024 UTF-8 bytes; no fields were removed and no state was emitted',
      candidate_bytes: count, candidate_sha256: candidateHash };
    return { ...evidence, ok: true, state: 'MEDIDO', meaning_status: 'UNVERIFIED',
      scope: 'Named projection only; no live capture or model comprehension claimed',
      source_sha256: sourceHash, wire_text: wireText, wire_bytes: count, wire_sha256: candidateHash };
  } catch {
    return { ...evidence, ok: false, state: 'NO_DATA',
      cause: 'Source vector cannot be projected without guessing; no state was emitted' };
  }
}
