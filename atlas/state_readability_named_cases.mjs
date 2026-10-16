// Tests of meaning and byte rejection; no model inference or world mutation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { byteCount, canonicalJson, canonicalHash, textHash, defaultFixtures, freshRead, READING_TASK } from './state_readability_probe.mjs';
import { namedProjection, namedWire, NAMED_SCHEMA, NAMED_DICTIONARY } from './state_readability_named.mjs';

const args = process.argv.slice(2), sabotageAxes = args.includes('--sabotage-axes'), sabotageBudget = args.includes('--sabotage-overflow');
const results = [], check = (name, run) => {
  try { run(); results.push({ name, ok: true }); }
  catch { results.push({ name, ok: false, cause: 'Named projection assertion rejected' }); }
};
const fixture = (id) => freshRead(defaultFixtures().find((item) => item.id === id).readings).vector;
const base = fixture('complete');

check('resource labels preserve the source order and finite fractions', () => {
  const input = structuredClone(base); input.r = [22.5, 3, 4, 5];
  const projection = namedProjection(input);
  assert.deepEqual(projection.world.resources, { copper: 22.5, light: 3, biomass: 4, oxygen: 5 });
  assert.equal(projection.world.cycle, input.c);
});
check('offset axes remain x then y in home space; absolute coordinates stay unavailable', () => {
  const projection = namedProjection(base), offset = projection.crab.offset;
  if (sabotageAxes) [offset.x, offset.y] = [offset.y, offset.x];
  assert.equal(offset.x, -94); assert.equal(offset.y, -355); assert.equal(offset.space, 'home_offset');
  assert.equal(Object.hasOwn(projection.crab, 'absolute_position'), false);
  assert.ok(projection.completeness.absent_from_source.includes('absolute_position'));
});
check('building identity, phase and life are preserved without visual claims', () => {
  const projection = namedProjection(base);
  assert.deepEqual(projection.buildings, [{ id: 'boya-estado', phase: 'vivo', life_per_thousand: 936 }]);
  assert.equal(projection.completeness.state, 'PARTIAL');
  for (const name of ['camera', 'harmonics', 'color_mapping', 'sound_recipe']) assert.ok(projection.completeness.absent_from_source.includes(name));
});
check('unknown values carry explicit source causes and never become zero', () => {
  const vector = fixture('empty'), projection = namedProjection(vector);
  assert.equal(projection.world.cycle, null); assert.equal(projection.world.resources, null); assert.equal(projection.crab, null);
  assert.equal(projection.no_data.cycle, vector.nd.c); assert.equal(projection.no_data.resources, vector.nd.r);
  assert.equal(projection.no_data.crab, vector.nd.k);
  const partial = structuredClone(base); partial.r[0] = null;
  const projected = namedProjection(partial);
  assert.equal(projected.world.resources.copper, null); assert.equal(typeof projected.no_data.resource_copper, 'string');
});
check('all remaining source fields are preserved with named labels', () => {
  const vector = structuredClone(base); vector.g = ['one', 'two', 8, 2];
  const projection = namedProjection(vector);
  assert.deepEqual(projection.panel, { id: vector.p[0], seal: vector.p[1], age_cycles: vector.p[2] });
  assert.deepEqual(projection.tutorial, { step: vector.t[0], demonstrated_actions: vector.t[1] });
  assert.deepEqual(projection.places[0], { name: vector.l[0][0], wins: vector.l[0][1], losses: vector.l[0][2] });
  assert.deepEqual(projection.nodes[0], { id: vector.n[0][0], measured_fraction: vector.n[0][1] });
  assert.deepEqual(projection.radio[0], { speaker: vector.q[0][0], seal: vector.q[0][1], cycle: vector.q[0][2] });
  assert.deepEqual(projection.panel_transition, { from: 'one', to: 'two', text_delta: 8, open_count: 2 });
  assert.equal(projection.tombstone_count, vector.z);
});
check('source trim is retained as a cause rather than hidden behind a completeness claim', () => {
  const projection = namedProjection(fixture('overflow'));
  assert.match(projection.no_data.source_trim, /over 1024 UTF-8 bytes after trim/);
  assert.match(projection.no_data.source_trim, /no partial state sent/); assert.equal(projection.completeness.state, 'PARTIAL');
});
check('projection is pure, canonical and independent of source object key order', () => {
  const before = canonicalJson(base), reversed = Object.fromEntries(Object.entries(base).reverse());
  assert.equal(canonicalJson(namedProjection(base)), canonicalJson(namedProjection(reversed)));
  assert.equal(canonicalJson(base), before); assert.notEqual(namedProjection(base).buildings, base.e);
  assert.deepEqual(namedWire(base), namedWire(base));
});
check('a valid named wire is strictly below the byte ceiling with separate dictionary cost', () => {
  const result = namedWire(base); assert.equal(result.ok, true);
  assert.equal(result.wire_bytes, byteCount(result.wire_text)); assert.ok(result.wire_bytes < 1024);
  assert.equal(result.wire_sha256, textHash(result.wire_text)); assert.equal(result.source_sha256, canonicalHash(base));
  assert.equal(result.dictionary_bytes, byteCount(canonicalJson(NAMED_DICTIONARY)));
  assert.equal(result.dictionary_in_wire, false); assert.equal(result.meaning_status, 'UNVERIFIED');
  assert.equal(JSON.parse(result.wire_text).schema, NAMED_SCHEMA);
});
check('current UTF-8 source is bounded; the named candidate rejects its own oversized projection whole', () => {
  for (const id of ['unicode', 'overflow']) {
    const vector = fixture(id), wire = JSON.stringify(vector);
    assert.ok(byteCount(wire) < 1024); assert.match(vector.nd.recorte, /over 1024 UTF-8 bytes/);
    const result = namedWire(vector);
    if (result.ok) { assert.ok(result.wire_bytes < 1024); assert.equal(Object.hasOwn(result, 'candidate_bytes'), false); }
    else { assert.ok(result.candidate_bytes >= 1024); assert.equal(Object.hasOwn(result, 'wire_text'), false); }
  }
  const oversized = structuredClone(base); oversized.q = [['é'.repeat(1200), 'LIVE', 1233]];
  const rejected = namedWire(oversized); if (sabotageBudget) rejected.ok = true;
  assert.equal(rejected.ok, false); assert.equal(rejected.state, 'NO_DATA');
  assert.ok(rejected.candidate_bytes >= 1024); assert.equal(Object.hasOwn(rejected, 'wire_text'), false);
  assert.match(rejected.cause, /no fields were removed/);
});
check('exactly 1024 UTF-8 bytes is rejected and 1023 is accepted', () => {
  const input = structuredClone(base), initial = byteCount(canonicalJson(namedProjection(input)));
  input.q[0][0] += 'x'.repeat(1023 - initial);
  assert.equal(namedWire(input).wire_bytes, 1023);
  input.q[0][0] += 'x'; assert.equal(namedWire(input).candidate_bytes, 1024); assert.equal(namedWire(input).ok, false);
});
check('invalid, extra or non-finite data are rejected without guessing', () => {
  for (const edit of [(v) => { v.r[0] = Infinity; }, (v) => { v.k[0] = 1.5; },
    (v) => { v.extra = 7; }, (v) => { delete v.e; }, (v) => { v.v = 'unknown'; }]) {
    const input = structuredClone(base); edit(input);
    assert.equal(namedWire(input).ok, false); assert.equal(Object.hasOwn(namedWire(input), 'wire_text'), false);
  }
});
check('the model input shares the original task without an oracle or a separate legend', () => {
  const result = namedWire(base), input = READING_TASK + '\n' + result.wire_text, projection = JSON.parse(result.wire_text);
  assert.equal(input.slice(0, READING_TASK.length), READING_TASK);
  assert.equal(Object.hasOwn(projection, 'reading'), false); assert.equal(Object.hasOwn(projection, 'proposal'), false);
  assert.equal(Object.hasOwn(projection, 'copper'), false); assert.equal(Object.hasOwn(projection, 'crab_offset'), false);
  assert.equal(input.includes(canonicalJson(NAMED_DICTIONARY)), false);
  assert.equal(result.executed_actions + result.signatures_requested + result.network_requests, 0);
});
check('the pure module contains no dispatcher, signing hook or network call', () => {
  const source = readFileSync(new URL('./state_readability_named.mjs', import.meta.url), 'utf8');
  for (const pattern of [/AtlasJuego\.aplica/, /Identity\.firmar/, /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bWebSocket\b/]) assert.equal(pattern.test(source), false);
});

process.stdout.write(JSON.stringify({ schema: 'preceptoros.named-state.cases/1', state: results.every((item) => item.ok) ? 'PASS' : 'FAIL',
  total: results.length, cases: results }, null, 2) + '\n');
process.exitCode = results.every((item) => item.ok) ? 0 : 1;
