// Unit checks use only existing public fixtures, never the blinded reader holdouts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { byteCount, canonicalJson, canonicalHash, textHash, defaultFixtures, freshRead, READING_TASK } from './state_readability_probe.mjs';
import { namedProjection } from './state_readability_named.mjs';
import { geometryProjection, geometryWire, GEOMETRY_SCHEMA, GEOMETRY_DICTIONARY,
  MANIFEST_TYPE_EVIDENCE } from './state_readability_geometry.mjs';

const args = process.argv.slice(2), sabotageAxes = args.includes('--sabotage-axes'), sabotageBudget = args.includes('--sabotage-overflow');
const cases = [], check = (name, run) => {
  try { run(); cases.push({ name, ok: true }); }
  catch { cases.push({ name, ok: false, cause: 'Geometry projection assertion rejected' }); }
};
const fixture = (id) => freshRead(defaultFixtures().find((item) => item.id === id).readings).vector;
const base = fixture('complete');

check('position tuple preserves source axis order and explicitly names home space', () => {
  const output = geometryProjection(base);
  if (sabotageAxes) output.crab.position.reverse();
  assert.deepEqual(output.crab.position, base.k.slice(0, 2));
  assert.equal(output.crab.coordinate_space, 'home_offset');
  assert.equal(Object.hasOwn(output.crab, 'absolute_position'), false);
});
check('all crab values survive the change of geometric notation', () => {
  const output = geometryProjection(base), named = namedProjection(base);
  assert.equal(output.crab.army, named.crab.army); assert.deepEqual(output.crab.skills, named.crab.skills);
  assert.deepEqual(output.crab.position, [named.crab.offset.x, named.crab.offset.y]);
  assert.equal(output.crab.coordinate_space, named.crab.offset.space);
});
check('typed buoy comes from the exact measured source manifest', () => {
  const evidence = MANIFEST_TYPE_EVIDENCE['boya-estado'];
  const source = readFileSync(new URL('../public/game/reef_buildings_layer.js', import.meta.url), 'utf8');
  assert.equal(textHash(source), evidence.source_sha256);
  assert.match(source, /id: 'boya-estado', tipo: 'boya'/);
  const building = geometryProjection(base).buildings[0];
  assert.equal(building.type, 'buoy'); assert.equal(building.id, base.e[0][0]);
  assert.equal(building.phase, base.e[0][1]); assert.equal(building.life_per_thousand, base.e[0][2]);
  assert.match(evidence.source_anchor, /reef_buildings_layer\.js:74-77/);
});
check('similar ids remain unknown rather than classified by a pattern', () => {
  for (const id of ['boya-estado-copy', 'buoy', 'unknown']) {
    const vector = structuredClone(base); vector.e[0][0] = id;
    const building = geometryProjection(vector).buildings[0];
    assert.equal(building.id, id); assert.equal(building.type, null); assert.match(building.type_cause, /^NO_DATA:/);
    assert.equal(building.phase, vector.e[0][1]);
  }
});
check('all remaining candidate 1 source fields and causes are unchanged', () => {
  const named = namedProjection(base), geometry = geometryProjection(base);
  for (const key of Object.keys(named).filter((key) => !['schema', 'crab', 'buildings'].includes(key))) {
    assert.deepEqual(geometry[key], named[key]);
  }
  assert.equal(geometry.completeness.state, 'PARTIAL');
  assert.equal(geometry.dictionary_enrichment, 'manifest');
});
check('empty source stays unknown and retains its declared causes', () => {
  const vector = fixture('empty'), output = geometryProjection(vector);
  assert.equal(output.crab, null); assert.equal(output.world.cycle, null); assert.equal(output.world.resources, null);
  assert.deepEqual(output.buildings, []); assert.equal(output.no_data.crab, vector.nd.k);
  assert.ok(output.completeness.absent_from_source.includes('absolute_position'));
});
check('source and frozen candidate 1 remain unchanged by composition', () => {
  const before = canonicalHash(base), namedBefore = canonicalHash(namedProjection(base));
  geometryProjection(base); geometryWire(base);
  assert.equal(canonicalHash(base), before); assert.equal(canonicalHash(namedProjection(base)), namedBefore);
  assert.ok(Object.isFrozen(GEOMETRY_DICTIONARY)); assert.ok(Object.isFrozen(MANIFEST_TYPE_EVIDENCE['boya-estado']));
});
check('canonical output repeats and ignores source key insertion order', () => {
  const reverse = Object.fromEntries(Object.entries(base).reverse());
  assert.deepEqual(geometryWire(base), geometryWire(reverse));
  const result = geometryWire(base); assert.equal(result.ok, true);
  assert.equal(result.wire_text, canonicalJson(geometryProjection(base)));
  assert.equal(result.wire_bytes, byteCount(result.wire_text)); assert.ok(result.wire_bytes < 1024);
  assert.equal(result.wire_sha256, textHash(result.wire_text)); assert.equal(result.source_sha256, canonicalHash(base));
});
check('current UTF-8 source is bounded; geometry rejects an oversized candidate whole', () => {
  for (const id of ['unicode', 'overflow']) {
    const vector = fixture(id);
    assert.ok(byteCount(JSON.stringify(vector)) < 1024); assert.match(vector.nd.recorte, /over 1024 UTF-8 bytes/);
    const result = geometryWire(vector);
    if (result.ok) { assert.ok(result.wire_bytes < 1024); assert.equal(Object.hasOwn(result, 'candidate_bytes'), false); }
    else { assert.ok(result.candidate_bytes >= 1024); assert.equal(Object.hasOwn(result, 'wire_text'), false); }
  }
  const oversized = structuredClone(base); oversized.q = [['é'.repeat(1200), 'LIVE', 1233]];
  const rejected = geometryWire(oversized); if (sabotageBudget) rejected.ok = true;
  assert.equal(rejected.ok, false); assert.equal(Object.hasOwn(rejected, 'wire_text'), false);
  assert.ok(rejected.candidate_bytes >= 1024); assert.match(rejected.cause, /no fields were removed/);
});
check('strict byte boundary accepts 1023 and rejects 1024', () => {
  const vector = structuredClone(base), initial = byteCount(canonicalJson(geometryProjection(vector)));
  vector.q[0][0] += 'x'.repeat(1023 - initial);
  assert.equal(geometryWire(vector).wire_bytes, 1023);
  vector.q[0][0] += 'x'; const rejected = geometryWire(vector);
  assert.equal(rejected.ok, false); assert.equal(rejected.candidate_bytes, 1024);
  assert.equal(Object.hasOwn(rejected, 'wire_text'), false);
});
check('invalid source data is never repaired by semantic guessing', () => {
  const vector = structuredClone(base); vector.k[0] = Infinity;
  assert.equal(geometryWire(vector).ok, false); assert.equal(Object.hasOwn(geometryWire(vector), 'wire_text'), false);
});
check('dictionary enrichment and its source evidence are accounted separately', () => {
  const result = geometryWire(base);
  assert.equal(result.dictionary_bytes, byteCount(canonicalJson(GEOMETRY_DICTIONARY)));
  assert.equal(result.dictionary_sha256, canonicalHash(GEOMETRY_DICTIONARY));
  assert.equal(result.manifest_evidence_sha256, canonicalHash(MANIFEST_TYPE_EVIDENCE));
  assert.equal(result.dictionary_in_wire, false); assert.equal(result.enrichment, 'exact_manifest_dictionary');
  assert.equal(result.meaning_status, 'UNVERIFIED');
});
check('reader gets the same task, not a task-shaped answer or a separate legend', () => {
  const result = geometryWire(base), input = READING_TASK + '\n' + result.wire_text, projection = JSON.parse(result.wire_text);
  assert.equal(projection.schema, GEOMETRY_SCHEMA); assert.equal(input.includes(canonicalJson(GEOMETRY_DICTIONARY)), false);
  for (const key of ['reading', 'proposal', 'cycle', 'copper', 'crab_offset', 'buoy_phase']) assert.equal(Object.hasOwn(projection, key), false);
  assert.equal(result.executed_actions + result.signatures_requested + result.network_requests, 0);
});

process.stdout.write(JSON.stringify({ schema: 'preceptoros.state-geometry.cases/1', state: cases.every((item) => item.ok) ? 'PASS' : 'FAIL',
  total: cases.length, cases }, null, 2) + '\n');
process.exitCode = cases.every((item) => item.ok) ? 0 : 1;
