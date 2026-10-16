// Sabotage verifies the audit, not a claim that the existing language is complete.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { byteCount, canonicalHash, canonicalJson, textHash, freshRead, auditWire, readerInput,
  expectedReading, evaluateResponse, defaultFixtures, runAudit, historicalSource, RESPONSE_SCHEMA, ARTIFACT_SCHEMA, READING_TASK } from './state_readability_probe.mjs';

const require = createRequire(import.meta.url);
const Gacha = require('../public/game/gacha.js');
const Audio = require('../public/game/core.js');
const Camera = require('../public/game/world_camera.js');
const Lifecycle = require('../public/game/reef_building_lifecycle.js');
const source = readFileSync(new URL('../public/game/state_vector.js', import.meta.url), 'utf8');
const fixtures = defaultFixtures(), cases = [];
const sabotage = process.argv.includes('--sabotage-byte-count');
const check = (name, run) => {
  try { run(); cases.push({ name, ok: true }); }
  catch { cases.push({ name, ok: false, cause: 'Assertion rejected; inspect the named case' }); }
};
const answer = (reading, proposal = null) => JSON.stringify({ schema: RESPONSE_SCHEMA, reading, proposal });

check('UTF-8 counts bytes rather than UTF-16 units', () => {
  const count = sabotage ? (text) => text.length : byteCount;
  assert.equal(count('é🌊'), 6); assert.equal(count('ASCII'), 5);
});
check('canonical evidence is independent of object key order', () => {
  assert.equal(canonicalHash({ b: 2, a: [null, 'é'] }), canonicalHash({ a: [null, 'é'], b: 2 }));
  for (const value of [NaN, Infinity, undefined, { missing: undefined }, Array(1)]) assert.throws(() => canonicalJson(value));
});
check('wire budget includes the exact serialized text and its boundary', () => {
  assert.equal(auditWire(JSON.stringify('x'.repeat(1021)), {}).wire_within_limit, true);
  assert.equal(auditWire(JSON.stringify('x'.repeat(1022)), {}).wire_within_limit, false);
  assert.equal(auditWire(JSON.stringify('x'.repeat(1023)), {}).wire_within_limit, false);
  assert.notEqual(auditWire('{ "a":1}', {}).wire_sha256, auditWire('{"a":1}', {}).wire_sha256);
  assert.equal(auditWire('{ "a":1}', {}).canonical_state_sha256, auditWire('{"a":1}', {}).canonical_state_sha256);
});
check('fresh VM reads existing leer with no input mutation', () => {
  const item = fixtures.find((fixture) => fixture.id === 'complete'), before = canonicalJson(item);
  const first = freshRead(item.readings), second = freshRead(item.readings);
  assert.equal(first.wireText, second.wireText); assert.equal(first.readOnly, true);
  assert.equal(before, canonicalJson(item)); assert.deepEqual(first.vector.k.slice(0, 2), [-94, -355]);
  assert.equal(first.vector.c, 1234); assert.equal(first.vector.r[0], 22);
});
check('read-only probe rejects action and signature attempts', () => {
  assert.throws(() => freshRead({}, source + '\nAtlasJuego.aplica({});'));
  assert.throws(() => freshRead({}, source + '\nIdentity.firmar({});'));
  assert.throws(() => freshRead({}, source + '\nfetch("https://example.invalid");'));
});
check('schema cost is separate and no-schema control uses identical wire', () => {
  const read = freshRead(fixtures[1].readings), audit = auditWire(read.wireText, read.declaration);
  assert.equal(readerInput(read.wireText, read.declaration, false), READING_TASK + '\n' + read.wireText);
  assert.equal(readerInput(read.wireText, read.declaration, true), READING_TASK + '\n' + read.wireText + '\n' + canonicalJson(read.declaration));
  assert.equal(audit.declaration_bytes, byteCount(canonicalJson(read.declaration)));
  assert.notEqual(textHash(readerInput(read.wireText, read.declaration, true)), textHash(read.wireText));
});
check('historical baseline reproduces the Unicode byte-count defect; current source closes it', () => {
  const legacy = historicalSource();
  assert.equal(legacy.sourceSha256, 'f754e30326bb5fd6df00902cd1fa06c1af21e77ef60a5c599e275a3b9a1b9c21');
  const readings = fixtures.find((item) => item.id === 'unicode').readings;
  const oldRead = freshRead(readings, legacy.sourceText), oldAudit = auditWire(oldRead.wireText, oldRead.declaration);
  assert.ok(oldAudit.utf16_units <= 1024); assert.ok(oldAudit.wire_bytes > 1024);
  assert.ok(oldAudit.findings.includes('WIRE_OVER_LIMIT')); assert.ok(oldAudit.findings.includes('UTF8_DIFFERS_FROM_UTF16'));
  const liveRead = freshRead(readings), liveAudit = auditWire(liveRead.wireText, liveRead.declaration);
  assert.equal(liveAudit.wire_bytes, byteCount(liveRead.wireText)); assert.ok(liveAudit.wire_bytes < 1024);
  assert.equal(liveAudit.findings.includes('WIRE_OVER_LIMIT'), false);
  assert.ok(liveAudit.findings.includes('SOURCE_TRIM_DECLARED'));
});
check('historical post-trim overflow is preserved; current source fails closed after remeasurement', () => {
  const legacy = historicalSource(), readings = fixtures.find((item) => item.id === 'overflow').readings;
  const oldRead = freshRead(readings, legacy.sourceText), oldAudit = auditWire(oldRead.wireText, oldRead.declaration);
  assert.ok(oldAudit.findings.includes('SOURCE_TRIM_DECLARED')); assert.equal(oldAudit.wire_within_limit, false);
  const liveRead = freshRead(readings), liveAudit = auditWire(liveRead.wireText, liveRead.declaration), vector = liveRead.vector;
  assert.equal(liveAudit.wire_bytes, byteCount(liveRead.wireText)); assert.ok(liveAudit.wire_bytes < 1024);
  assert.ok(liveAudit.findings.includes('SOURCE_TRIM_DECLARED'));
  assert.equal(vector.c, null); assert.equal(vector.r, null); assert.equal(vector.k, null);
  assert.deepEqual([vector.e, vector.l, vector.n, vector.q], [[], [], [], []]);
  const cause = vector.nd.recorte;
  assert.match(cause, /no partial state sent/);
  for (const key of ['c', 'r', 'k', 'p', 't', 'e', 'l', 'n', 'z', 'q', 'g']) assert.equal(vector.nd[key], cause);
  const audited = runAudit().cases.find((item) => item.fixture_id === 'overflow');
  assert.equal(audited.reading_projection_faithful, true);
  assert.equal(audited.reading_projection_basis, 'FAIL_CLOSED_WITH_CAUSES');
  assert.match(audited.reading_projection_cause, /absolute_position is absent/);
});
check('missing state stays unknown rather than fabricated zero', () => {
  const read = freshRead({}), expected = expectedReading(read.vector);
  assert.equal(expected.cycle, null); assert.equal(expected.copper, null); assert.equal(expected.crab_offset, null);
  assert.equal(expected.coordinate_reference, 'NO_DATA'); assert.ok(read.vector.nd.c);
  assert.equal(evaluateResponse(answer({ ...expected, copper: 0 }), expected).semantic_correct, false);
});
check('valid JSON is not proof of correct coordinate interpretation', () => {
  const read = freshRead(fixtures[1].readings), expected = expectedReading(read.vector);
  const wrong = evaluateResponse(answer({ ...expected, absolute_position: [-94, -355] }), expected);
  assert.equal(wrong.format_valid, true); assert.equal(wrong.semantic_correct, false);
  assert.equal(evaluateResponse(answer(expected), expected).semantic_correct, true);
  assert.equal(evaluateResponse(answer({ ...expected, crab_offset: [-355, -94] }), expected).semantic_correct, false);
  assert.equal(evaluateResponse(answer({ ...expected, copper: read.vector.r[1] }), expected).semantic_correct, false);
});
check('source truth catches a resource permutation before model scoring', () => {
  const changed = source.replace('[R.cobre, R.luz,', '[R.luz, R.cobre,');
  assert.notEqual(changed, source);
  const report = runAudit({ sourceText: changed });
  assert.equal(report.cases.find((item) => item.fixture_id === 'complete').reading_projection_faithful, false);
});
check('fractional resources stay valid while non-finite values are rejected', () => {
  const expected = { ...expectedReading(freshRead(fixtures[1].readings).vector), copper: 0.8 };
  assert.equal(evaluateResponse(answer(expected), expected).semantic_correct, true);
  assert.equal(evaluateResponse(answer({ ...expected, copper: '0.8' }), expected).format_valid, false);
  assert.equal(evaluateResponse(answer(expected).replace('0.8', '1e999'), expected).format_valid, false);
  assert.equal(evaluateResponse(answer(expected).replace('0.8', 'NaN'), expected).format_valid, false);
});
check('proposals remain unreviewed data with zero execution', () => {
  const expected = expectedReading(freshRead(fixtures[1].readings).vector);
  const result = evaluateResponse(answer(expected, { action: 'move', reason: 'Unreviewed model proposal' }), expected);
  assert.equal(result.proposal, 'UNREVIEWED'); assert.equal(result.executed, false);
  assert.equal(evaluateResponse('not JSON', expected).format_valid, false);
  assert.equal(evaluateResponse(answer(expected, { action: 'move', reason: 'x', execute: true }), expected).format_valid, false);
});
check('existing Fourier, audio, camera and color projections repeat from the same inputs', () => {
  const seed = '12345678'.repeat(8), wave = Gacha.tirada(seed, 'tc1');
  assert.deepEqual(wave, Gacha.tirada(seed, 'tc1')); assert.deepEqual(Audio.vozDe(wave), Audio.vozDe(Gacha.tirada(seed, 'tc1')));
  const camera = Camera.crea({ x: 12, y: -8 }), screen = Camera.aPantalla(camera, 800, 600, 2, 50, 20);
  const world = Camera.aMundo(camera, 800, 600, 2, ...screen);
  assert.ok(Math.abs(world[0] - 50) < 1e-10 && Math.abs(world[1] - 20) < 1e-10);
  const manifest = { esquema: 'preceptoros.edificio/1', id: 'fixture', tipo: 'boya', col: 1, fila: 2,
    huella: 1, nace_tic: 0, madura_tics: 3, desgaste_por_tic: 8, carga: 300, escudo: 0 };
  assert.deepEqual(Lifecycle.color(manifest, 8), Lifecycle.color(manifest, 8));
  const vector = freshRead(fixtures[1].readings).vector;
  assert.equal('col' in vector.e[0], false); assert.equal(auditWire(JSON.stringify(vector), {}).coverage.harmonics, false);
});
check('deterministic report measures findings without certifying an SLM', () => {
  const first = runAudit(), second = runAudit();
  assert.equal(canonicalJson(first), canonicalJson(second)); assert.equal(first.language_status, 'BYTE_LIMIT_ONLY');
  assert.equal(first.meaning_status, 'INCOMPLETE'); assert.equal(first.reader_evidence.state, 'NO_DATA');
  assert.ok(first.cases.every((item) => item.provenance === 'SYNTHETIC' && item.deterministic && item.read_only));
  assert.ok(first.cases.every((item) => item.wire_bytes === byteCount(item.wire_text) && item.wire_within_limit));
  assert.equal(first.executed_actions + first.signatures_requested + first.network_requests, 0);
});
check('offline paired evidence binds the exact input and separates format from meaning', () => {
  const report = runAudit(), item = report.cases[1], expected = expectedReading(JSON.parse(item.wire_text));
  const artifact = { schema: ARTIFACT_SCHEMA, provenance: 'synthetic_test',
    model: { id: 'synthetic-reader', runtime: 'test-only', configuration: {} }, cases: [{ fixture_id: item.fixture_id,
      with_schema: { input_sha256: item.inputs.with_schema.sha256, fresh_context: true, response_text: answer(expected) },
      without_schema: { input_sha256: item.inputs.without_schema.sha256, fresh_context: true,
        response_text: answer({ ...expected, coordinate_reference: 'NO_DATA' }) } }] };
  const evidence = runAudit({ responses: artifact }).reader_evidence;
  assert.equal(evidence.state, 'SYNTHETIC'); assert.equal(evidence.complete, false);
  assert.equal(evidence.results[0].with_schema.semantic_correct, true);
  assert.equal(evidence.results[0].without_schema.format_valid, true);
  assert.equal(evidence.results[0].without_schema.semantic_correct, false);
  artifact.cases[0].with_schema.input_sha256 = 'wrong'; assert.throws(() => runAudit({ responses: artifact }));
});

process.stdout.write(JSON.stringify({ schema: 'preceptoros.state-readability.cases/1',
  state: cases.every((item) => item.ok) ? 'PASS' : 'FAIL', total: cases.length, cases }, null, 2) + '\n');
process.exitCode = cases.every((item) => item.ok) ? 0 : 1;
