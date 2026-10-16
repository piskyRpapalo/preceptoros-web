// Offline measurement only: no action execution, identity access or network.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const SOURCE = new URL('../public/game/state_vector.js', import.meta.url);
const CONTRACT = new URL('../public/game/vector_contract.js', import.meta.url);
const SOURCE_BASELINE = new URL('./evidence/state-readability-20261015/source-baseline.json', import.meta.url);
export const LIMIT = 1024;
export const RESPONSE_SCHEMA = 'preceptoros.state-readability.response/1';
export const ARTIFACT_SCHEMA = 'preceptoros.state-readability.responses/1';
export const READING_TASK = 'Read the supplied game state without acting. Return only a JSON object with schema '
  + RESPONSE_SCHEMA + ', reading, and proposal. Reading has exactly cycle, copper, crab_offset, '
  + 'coordinate_reference, absolute_position, buoy_phase. Use null for unavailable numbers, coordinates or phase. '
  + 'Coordinate arrays contain two integers. Coordinate reference is home_offset or NO_DATA. '
  + 'Proposal is null or an object containing action and reason strings. A proposal is never permission to execute. '
  + 'Use only supplied evidence; do not invent an absolute position.';
export const byteCount = (text) => Buffer.byteLength(text, 'utf8');
export const textHash = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

// Historical evidence is replayed only against its captured source, never treated as current behavior.
export function historicalSource() {
  const evidence = JSON.parse(readFileSync(SOURCE_BASELINE, 'utf8'));
  if (evidence.schema !== 'preceptoros.state-readability.source/1' || typeof evidence.source_text !== 'string'
    || textHash(evidence.source_text) !== evidence.source_sha256) throw new Error('Historical source evidence rejected');
  return { sourceText: evidence.source_text, sourceSha256: evidence.source_sha256 };
}

// This canonical form is for evidence hashes, never a substitute for wire bytes.
export function canonicalJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + Array.from(value, canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  }
  throw new TypeError('Evidence must contain finite JSON values');
}
export const canonicalHash = (value) => textHash(canonicalJson(value));
const copy = (value) => JSON.parse(canonicalJson(value));
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

// Every invocation gets a new VM and frozen synthetic readers. No live browser is claimed.
export function freshRead(readings, sourceText = readFileSync(SOURCE, 'utf8')) {
  const before = canonicalHash(readings), data = freeze(copy(readings));
  let denied = 0;
  const deny = () => { denied++; throw new Error('Read-only boundary'); };
  const context = { fetch: deny, XMLHttpRequest: deny, WebSocket: deny,
    Identity: { firmar: deny }, localStorage: { setItem: deny },
    AtlasJuego: { instantanea: () => data.instantanea || null, aplica: deny } };
  if (data.cangrejo) context.AtlasCangrejoLibre = {
    desplazamiento: () => ({ x: data.cangrejo.dx, y: data.cangrejo.dy }),
    skills: () => [{ nivel: data.cangrejo.swim }, { nivel: data.cangrejo.reach }]
  };
  if ('army' in (data.cangrejo || {})) context.AtlasIncubadora = { army: () => Array.from({ length: data.cangrejo.army || 0 }) };
  if (data.panel) context.AtlasVentana = { ficha: () => ({ ...data.panel, edad: 'cycle delta Δ ' + data.panel.edadN }) };
  if (data.tutorial) context.AtlasTutorial = { ficha: () => data.tutorial };
  if (data.edificios || 'lapidas' in data) context.AtlasArrecife = {
    vectores: () => data.edificios || [], lapidas: () => Array.from({ length: data.lapidas || 0 })
  };
  if (data.lugares) context.AtlasInspector = { todas: () => data.lugares.map((place) => {
    const total = place.g + place.p, share = total ? Math.round(place.g * 1000 / total) : 0;
    return [['Name', place.nombre], ['State', 'win share ' + share + '/1000 · ' + total + ' fights']];
  }) };
  if (data.nodos) {
    context.AtlasNodosCedulas = { nodos: data.nodos.map((node) => ({ nodo: node.id, counts: node })) };
    context.AtlasCorales = { coral: (node) => ({ medidas: node.counts.med, total: node.counts.tot }) };
  }
  if (data.radio) context.AtlasRadioChat = { registro: () => data.radio };
  if (data.gusano) context.AtlasWorm = { ficha: () => data.gusano };
  vm.createContext(context, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(readFileSync(CONTRACT, 'utf8'), context, { timeout: 1000 });
  vm.runInContext(sourceText, context, { timeout: 1000 });
  const vector = context.AtlasVector.leer(), declaration = context.AtlasVector.esquema();
  return { vector: copy(vector), declaration: copy(declaration), wireText: JSON.stringify(vector),
    readOnly: denied === 0 && before === canonicalHash(readings) };
}

export function auditWire(wireText, declaration) {
  const wireBytes = byteCount(wireText), schemaText = canonicalJson(declaration), findings = [];
  if (wireBytes >= LIMIT) findings.push('WIRE_OVER_LIMIT');
  if (wireBytes !== wireText.length) findings.push('UTF8_DIFFERS_FROM_UTF16');
  const vector = JSON.parse(wireText);
  if (vector.nd && vector.nd.recorte) findings.push('SOURCE_TRIM_DECLARED');
  // These omissions are measured against the existing vector shape, not invented data.
  const coverage = {
    cycle: typeof vector.c === 'number', resources: Array.isArray(vector.r),
    crab_home_offset: Array.isArray(vector.k), absolute_position: false,
    building_state: Array.isArray(vector.e) && vector.e.length > 0,
    building_coordinates: false, camera: false, harmonics: false, sound_recipe: false, color_mapping: false
  };
  return { wire_bytes: wireBytes, utf16_units: wireText.length, limit_bytes: LIMIT,
    limit_relation: '<', wire_within_limit: wireBytes < LIMIT, declaration_bytes: byteCount(schemaText),
    wire_sha256: textHash(wireText), canonical_state_sha256: canonicalHash(vector),
    declaration_sha256: textHash(schemaText), findings, coverage };
}

export function readerInput(wireText, declaration, withSchema) {
  return READING_TASK + '\n' + wireText + (withSchema ? '\n' + canonicalJson(declaration) : '');
}

// The reading task is deliberately smaller than gameplay. Validity is not comprehension.
export function expectedReading(vector) {
  const buoy = (vector.e || []).find((building) => building[0] === 'boya-estado');
  return { cycle: vector.c, copper: vector.r ? vector.r[0] : null,
    crab_offset: vector.k ? [vector.k[0], vector.k[1]] : null,
    coordinate_reference: vector.k ? 'home_offset' : 'NO_DATA',
    absolute_position: null, buoy_phase: buoy ? buoy[1] : null };
}
function sourceReading(data) {
  const instant = data.instantanea, crab = data.cangrejo;
  const buoy = (data.edificios || []).find((building) => building.id === 'boya-estado');
  return { cycle: instant ? instant.ciclo : null,
    copper: instant && instant.recursos ? instant.recursos.cobre : null,
    crab_offset: crab ? [Math.round(crab.dx), Math.round(crab.dy)] : null,
    coordinate_reference: crab ? 'home_offset' : 'NO_DATA', absolute_position: null,
    buoy_phase: buoy ? buoy.fase : null };
}
const sameKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('|') === keys.slice().sort().join('|');
function failClosedReadingProjection(vector) {
  const causeKeys = ['c', 'r', 'k', 'p', 't', 'e', 'l', 'n', 'z', 'q', 'g', 'recorte'];
  const unavailable = vector && vector.nd;
  if (!sameKeys(vector, ['v', 'c', 'r', 'k', 'p', 't', 'e', 'l', 'n', 'z', 'q', 'g', 'nd'])
    || !sameKeys(unavailable, causeKeys)
    || causeKeys.some((key) => typeof unavailable[key] !== 'string' || !unavailable[key])) return false;
  if (!/no partial state sent/.test(unavailable.recorte)) return false;
  if (vector.v !== 'preceptoros.vector/1' || vector.c !== null || vector.r !== null || vector.k !== null
    || vector.p !== null || vector.t !== null || vector.z !== null || vector.g !== null
    || !['e', 'l', 'n', 'q'].every((key) => Array.isArray(vector[key]) && vector[key].length === 0)) return false;
  // v1 carries no absolute position field; all other requested fields map to c, r, k or e.
  const failedClosedReading = { cycle: null, copper: null, crab_offset: null,
    coordinate_reference: 'NO_DATA', absolute_position: null, buoy_phase: null };
  return canonicalJson(expectedReading(vector)) === canonicalJson(failedClosedReading);
}
const integer = (value) => value === null || Number.isSafeInteger(value);
const finiteNumber = (value) => value === null || typeof value === 'number' && Number.isFinite(value);
function readingForm(value) {
  return sameKeys(value, ['cycle', 'copper', 'crab_offset', 'coordinate_reference', 'absolute_position', 'buoy_phase'])
    && integer(value.cycle) && finiteNumber(value.copper)
    && (value.crab_offset === null || Array.isArray(value.crab_offset) && value.crab_offset.length === 2 && value.crab_offset.every(Number.isSafeInteger))
    && ['home_offset', 'NO_DATA'].includes(value.coordinate_reference)
    && (value.absolute_position === null || Array.isArray(value.absolute_position) && value.absolute_position.length === 2 && value.absolute_position.every(Number.isSafeInteger))
    && (value.buoy_phase === null || typeof value.buoy_phase === 'string');
}
export function evaluateResponse(responseText, expected) {
  let response;
  try { response = JSON.parse(responseText); } catch { return { format_valid: false, semantic_correct: false, proposal: 'REJECTED', executed: false }; }
  const valid = sameKeys(response, ['schema', 'reading', 'proposal']) && response.schema === RESPONSE_SCHEMA
    && readingForm(response.reading) && (response.proposal === null || sameKeys(response.proposal, ['action', 'reason'])
      && typeof response.proposal.action === 'string' && typeof response.proposal.reason === 'string');
  return { format_valid: !!valid, semantic_correct: !!valid && canonicalJson(response.reading) === canonicalJson(expected),
    proposal: !valid ? 'REJECTED' : response.proposal === null ? 'NONE' : 'UNREVIEWED', executed: false };
}

export function defaultFixtures() {
  const complete = {
    instantanea: { ciclo: 1234, recursos: { cobre: 22, luz: 0, biomasa: 1, oxigeno: 244 } },
    cangrejo: { dx: -94.4, dy: -355.2, army: 2, swim: 1, reach: null },
    panel: { id: 'pliego-estado', sello: 'LIVE', edadN: 3 }, tutorial: { paso: 'summon', competencia: 3 },
    edificios: [{ id: 'boya-estado', fase: 'vivo', vida: 936, col: 400, fila: 500, hsl: [122, 43, 38] }],
    lugares: [{ nombre: 'Reef Patrol', g: 1, p: 0 }], nodos: [{ id: 'nodo.0.hexelion', med: 2, tot: 2 }],
    lapidas: 1, radio: [{ quien: 'Radio', sello: 'LIVE', ciclo: 1233 }]
  };
  const unicode = copy(complete); unicode.radio[0].quien = 'é'.repeat(400);
  const overflow = copy(complete);
  overflow.nodos = Array.from({ length: 60 }, (_, index) => ({ id: 'synthetic-node-' + index, med: 1, tot: 2 }));
  return [{ id: 'empty', readings: {} }, { id: 'complete', readings: complete },
    { id: 'unicode', readings: unicode }, { id: 'overflow', readings: overflow }]
    .map((fixture) => ({ ...fixture, provenance: 'SYNTHETIC', cause: 'Frozen structural fixture; not a live visitor capture' }));
}

export function compareOffline(cases, artifact) {
  if (!artifact) return { state: 'NO_DATA', cause: 'No recorded model responses supplied; JavaScript readability is not model comprehension' };
  const label = (value) => typeof value === 'string' && /^[A-Za-z0-9_.:@+-]{1,120}$/.test(value);
  if (artifact.schema !== ARTIFACT_SCHEMA || !sameKeys(artifact.model, ['id', 'runtime', 'configuration'])
    || !label(artifact.model.id) || !label(artifact.model.runtime) || !artifact.model.configuration
    || typeof artifact.model.configuration !== 'object' || Array.isArray(artifact.model.configuration)
    || !Array.isArray(artifact.cases) || !artifact.cases.length
    || !['recorded_model_response', 'synthetic_test'].includes(artifact.provenance)) {
    throw new Error('Offline response artifact shape rejected');
  }
  const seen = new Set(), results = [];
  for (const entry of artifact.cases) {
    if (!entry || seen.has(entry.fixture_id)) throw new Error('Duplicate or missing response case');
    seen.add(entry.fixture_id);
    const item = cases.find((candidate) => candidate.fixture_id === entry.fixture_id);
    if (!item) throw new Error('Unknown response case');
    if (!item.reading_projection_faithful) throw new Error('Source reading mismatch prevents semantic scoring');
    const pair = {};
    for (const condition of ['with_schema', 'without_schema']) {
      const evidence = entry[condition];
      if (!evidence || evidence.input_sha256 !== item.inputs[condition].sha256 || evidence.fresh_context !== true
        || typeof evidence.response_text !== 'string') throw new Error('Response input or context evidence rejected');
      pair[condition] = { response_sha256: textHash(evidence.response_text),
        ...evaluateResponse(evidence.response_text, expectedReading(JSON.parse(item.wire_text))) };
    }
    results.push({ fixture_id: entry.fixture_id, ...pair });
  }
  return { state: artifact.provenance === 'synthetic_test' ? 'SYNTHETIC' : 'DECLARED',
    cause: 'Offline answers scored; model identity and collection conditions remain declared evidence',
    model: { id: artifact.model.id, runtime: artifact.model.runtime, configuration_sha256: canonicalHash(artifact.model.configuration) },
    evidence_sha256: canonicalHash(artifact),
    supplied_pairs: results.length, expected_pairs: cases.length, complete: results.length === cases.length, results };
}

export function runAudit({ sourceText = readFileSync(SOURCE, 'utf8'), fixtures = defaultFixtures(), responses = null } = {}) {
  const cases = fixtures.map((fixture) => {
    const first = freshRead(fixture.readings, sourceText), second = freshRead(fixture.readings, sourceText);
    const inputs = {};
    for (const condition of ['with_schema', 'without_schema']) {
      const text = readerInput(first.wireText, first.declaration, condition === 'with_schema');
      inputs[condition] = { sha256: textHash(text), bytes: byteCount(text) };
    }
    const valuesFaithful = canonicalJson(sourceReading(fixture.readings)) === canonicalJson(expectedReading(first.vector));
    const failClosed = !valuesFaithful && failClosedReadingProjection(first.vector);
    return { fixture_id: fixture.id, provenance: fixture.provenance, cause: fixture.cause,
      input_sha256: canonicalHash(fixture.readings), source_sha256: textHash(sourceText),
      deterministic: first.wireText === second.wireText && canonicalHash(first.declaration) === canonicalHash(second.declaration),
      reading_projection_faithful: valuesFaithful || failClosed,
      reading_projection_basis: valuesFaithful ? 'SOURCE_VALUES' : failClosed ? 'FAIL_CLOSED_WITH_CAUSES' : 'MISMATCH',
      reading_projection_cause: failClosed
        ? 'Null reading fields are covered by source causes c/r/k/e; absolute_position is absent from vector v1'
        : null,
      read_only: first.readOnly && second.readOnly, ...auditWire(first.wireText, first.declaration), inputs, wire_text: first.wireText };
  });
  return { schema: 'preceptoros.state-readability.audit/1', state: 'MEDIDO',
    scope: 'Offline fresh-VM observations of synthetic fixtures; no live visitor or SLM reading claimed',
    language_status: cases.every((item) => item.wire_within_limit) ? 'BYTE_LIMIT_ONLY' : 'RED',
    meaning_status: 'INCOMPLETE', reading_task: READING_TASK, reading_task_bytes: byteCount(READING_TASK),
    declaration: freshRead({}, sourceText).declaration, cases, reader_evidence: compareOffline(cases, responses),
    executed_actions: 0, signatures_requested: 0, network_requests: 0 };
}

const direct = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (direct) {
  try {
    const args = process.argv.slice(2);
    const options = {}, seen = new Set();
    for (let index = 0; index < args.length; index += 2) {
      const flag = args[index], path = args[index + 1];
      if (!['--responses', '--source'].includes(flag) || !path || seen.has(flag)) throw new Error('Usage rejected');
      seen.add(flag);
      const artifact = JSON.parse(readFileSync(path, 'utf8'));
      if (flag === '--responses') options.responses = artifact;
      else {
        if (artifact.schema !== 'preceptoros.state-readability.source/1' || typeof artifact.source_text !== 'string'
          || textHash(artifact.source_text) !== artifact.source_sha256) throw new Error('Source evidence rejected');
        options.sourceText = artifact.source_text;
      }
    }
    const report = runAudit(options);
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } catch {
    process.stdout.write(JSON.stringify({ schema: 'preceptoros.state-readability.audit/1', state: 'NO_DATA',
      cause: 'Audit input or source rejected; no model or language certification issued' }) + '\n');
    process.exitCode = 1;
  }
}
