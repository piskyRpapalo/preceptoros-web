// Paired offline comparison of the current compact vector and named projection.
// Synthetic fixtures only; no game dispatch, network, identity or live visitor state.
import { spawnSync } from 'node:child_process';
import { accessSync, constants, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson, defaultFixtures, evaluateResponse, expectedReading, freshRead, READING_TASK, runAudit, textHash } from './state_readability_probe.mjs';
import { namedWire } from './state_readability_named.mjs';

const RESPONSE = 'preceptoros.state-readability.response/1';
const PREFIX = '<|im_start|>system\nRead the complete supplied evidence. Return only the requested JSON without acting.<|im_end|>\n<|im_start|>user\n';
const SUFFIX = '<|im_end|>\n<|im_start|>assistant\n';
const COMPACT_MAP = 'Extract: cycle=c; copper=r[0]; crab_offset=[k[0],k[1]] when k is an array, otherwise null; buoy_phase=e[i][1] for row e[i] where e[i][0] is boya-estado, otherwise null. absolute_position=null because absent. coordinate_reference=home_offset exactly when crab_offset is an array, else NO_DATA.';
const NAMED_MAP = 'Extract: cycle=world.cycle; copper=world.resources.copper; crab_offset=[crab.offset.x,crab.offset.y] when crab is an object, otherwise null; buoy_phase=buildings[i].phase for item buildings[i] where buildings[i].id is boya-estado, otherwise null. absolute_position=null because absent. coordinate_reference=home_offset exactly when crab_offset is an array, else NO_DATA.';
const TASK = READING_TASK + '\n';
const CONDITIONS = ['compact_vector', 'named_projection'];
const sha = (value) => createHash('sha256').update(value).digest('hex');
const readHash = (file) => sha(readFileSync(file));
const args = process.argv.slice(2);
const arg = (name) => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
const hashPattern = /^[a-f0-9]{64}$/;
const ARTIFACT_KEYS = ['schema', 'provenance', 'source_sha256', 'runtime', 'runtime_sha256', 'runtime_version',
  'model', 'model_sha256', 'settings', 'grammar_sha256', 'grammar_bytes', 'summary', 'fixtures', 'records', 'limitations', 'no_data'];
const RECORD_KEYS = ['pass', 'fixture_id', 'condition', 'source_sha256', 'wire_sha256', 'wire_bytes', 'input_sha256',
  'model_input_sha256', 'response_text', 'response_sha256', 'response', 'format_valid', 'semantic_correct',
  'proposal', 'executed', 'elapsed_ms', 'prompt_evaluation_count', 'generation_evaluation_runs',
  'token_count_cause', 'returncode', 'no_data'];
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('|') === keys.slice().sort().join('|');
const same = (a, b) => { try { return canonicalJson(a) === canonicalJson(b); } catch { return false; } };

function sourceCases() {
  const audit = runAudit();
  const fixtures = new Map(defaultFixtures().map((fixture) => [fixture.id, fixture]));
  const selected = ['empty', 'complete'].map((id) => {
    const base = audit.cases.find((item) => item.fixture_id === id);
    if (!base) throw new Error(`NO_DATA: current source fixture missing: ${id}`);
    const vector = JSON.parse(base.wire_text), fixture = fixtures.get(id);
    const reads = freshRead(fixture.readings);
    if (!reads.readOnly || canonicalJson(reads.vector) !== canonicalJson(vector)) throw new Error(`NO_DATA: fixture projection drift: ${id}`);
    const named = namedWire(vector);
    if (!named.ok) throw new Error(`NO_DATA: named representation rejected ${id}: ${named.cause}`);
    return { id, vector, expected: expectedReading(vector), compact: base.wire_text, named: named.wire_text,
      source_sha256: base.source_sha256, vector_sha256: textHash(base.wire_text), named_sha256: named.wire_sha256,
      compact_bytes: Buffer.byteLength(base.wire_text), named_bytes: named.wire_bytes };
  });
  return { source_sha256: audit.cases[0]?.source_sha256, selected };
}

function makeInput(condition, fixture) {
  const compact = condition === 'compact_vector';
  return TASK + 'Contract rule: unavailable crab_offset is null; coordinate_reference is home_offset if and only if crab_offset contains two integers, and NO_DATA otherwise.\n'
    + (compact ? COMPACT_MAP : NAMED_MAP) + '\n' + (compact ? fixture.compact : fixture.named);
}

export function validateRepresentationArtifact(artifact, fixtureSet, runtimePath, modelPath) {
  const errors = new Set();
  if (!exactKeys(artifact, ARTIFACT_KEYS)) errors.add('ARTIFACT_KEYS');
  if (artifact?.schema !== 'preceptoros.state-readability.representation-experiment/1'
      || artifact.provenance !== 'Two frozen synthetic fixtures; paired fresh local subprocesses; no live visitor state') errors.add('ARTIFACT_CONTRACT');
  if (artifact?.source_sha256 !== fixtureSet.source_sha256) errors.add('SOURCE_HASH');
  if (artifact?.runtime !== path.basename(runtimePath) || artifact?.runtime_sha256 !== readHash(runtimePath)) errors.add('RUNTIME_BINDING');
  if (artifact?.model !== path.basename(modelPath) || artifact?.model_sha256 !== readHash(modelPath)) errors.add('MODEL_BINDING');
  if (!hashPattern.test(artifact?.grammar_sha256 || '') || !Number.isSafeInteger(artifact?.grammar_bytes)) errors.add('GRAMMAR_BINDING');
  if (!same(artifact?.settings, { passes: 2, temperature: 0, seed: 14, threads: 1, gpu_layers: 0, context: 4096, max_generated: 512, offline: true })) errors.add('SETTINGS');
  const fixtureMap = new Map(fixtureSet.selected.map((fixture) => [fixture.id, fixture]));
  if (!Array.isArray(artifact?.fixtures) || artifact.fixtures.length !== fixtureMap.size) errors.add('FIXTURE_COUNT');
  else for (const row of artifact.fixtures) {
    const fixture = fixtureMap.get(row?.id);
    if (!fixture || !exactKeys(row, ['id', 'provenance', 'source_sha256', 'vector_sha256', 'named_sha256', 'compact_bytes', 'named_bytes'])
        || row.provenance !== 'SYNTHETIC' || row.source_sha256 !== fixture.source_sha256
        || row.vector_sha256 !== fixture.vector_sha256 || row.named_sha256 !== fixture.named_sha256
        || row.compact_bytes !== fixture.compact_bytes || row.named_bytes !== fixture.named_bytes) errors.add('FIXTURE_BINDING');
  }
  const records = artifact?.records;
  if (!Array.isArray(records) || records.length !== fixtureMap.size * 2 * CONDITIONS.length) errors.add('RECORD_COUNT');
  const seen = new Set(), rowsByCondition = Object.fromEntries(CONDITIONS.map((condition) => [condition, []]));
  for (const row of Array.isArray(records) ? records : []) {
    if (!exactKeys(row, RECORD_KEYS)) { errors.add('RECORD_KEYS'); continue; }
    const fixture = fixtureMap.get(row.fixture_id);
    if (!fixture || ![1, 2].includes(row.pass) || !CONDITIONS.includes(row.condition)) { errors.add('RECORD_IDENTITY'); continue; }
    const id = `${row.pass}|${row.fixture_id}|${row.condition}`;
    if (seen.has(id)) errors.add('RECORD_DUPLICATE'); seen.add(id);
    rowsByCondition[row.condition].push(row);
    const expectedWire = row.condition === 'compact_vector' ? fixture.vector_sha256 : fixture.named_sha256;
    const expectedBytes = row.condition === 'compact_vector' ? fixture.compact_bytes : fixture.named_bytes;
    const input = makeInput(row.condition, fixture), wrapped = PREFIX + input + SUFFIX;
    if (row.source_sha256 !== fixture.source_sha256 || row.wire_sha256 !== expectedWire || row.wire_bytes !== expectedBytes) errors.add('WIRE_BINDING');
    if (row.input_sha256 !== textHash(input) || row.model_input_sha256 !== sha(wrapped)) errors.add('INPUT_BINDING');
    if (typeof row.response_text !== 'string' || row.response_sha256 !== textHash(row.response_text)) errors.add('RESPONSE_HASH');
    if (!Number.isFinite(row.elapsed_ms) || row.elapsed_ms < 0 || row.executed !== false
        || row.prompt_evaluation_count !== null || row.generation_evaluation_runs !== null
        || typeof row.token_count_cause !== 'string' || !row.token_count_cause
        || !(row.returncode === null || Number.isInteger(row.returncode))
        || !Array.isArray(row.no_data) || row.no_data.some((cause) => typeof cause !== 'string' || !cause)) errors.add('MEASUREMENT_FIELDS');
    const checked = evaluateResponse(row.response_text, fixture.expected);
    let parsed = null; try { parsed = JSON.parse(row.response_text); } catch { /* closed validation */ }
    if (!same(parsed, row.response) || row.format_valid !== checked.format_valid
        || row.semantic_correct !== checked.semantic_correct || row.proposal !== checked.proposal) errors.add('RESPONSE_VALIDATION');
    if (row.returncode !== 0 && row.no_data.length === 0) errors.add('PROCESS_CAUSE');
    if (!checked.format_valid && row.no_data.length === 0) errors.add('CONTRACT_CAUSE');
  }
  if (seen.size !== fixtureMap.size * 2 * CONDITIONS.length) errors.add('CONDITION_COVERAGE');
  const summary = {};
  for (const condition of CONDITIONS) {
    const rows = rowsByCondition[condition], sorted = rows.map((row) => row.elapsed_ms).sort((a, b) => a - b);
    summary[condition] = { readings: rows.length, format_valid: rows.filter((row) => row.format_valid).length,
      semantic_correct: rows.filter((row) => row.semantic_correct).length,
      median_latency_ms: sorted[Math.floor(rows.length / 2)] };
  }
  if (!same(artifact?.summary, summary)) errors.add('SUMMARY_BINDING');
  if (!Array.isArray(artifact?.limitations) || !Array.isArray(artifact?.no_data)
      || !artifact.no_data.some((row) => row?.field === 'energy')
      || !artifact.no_data.some((row) => row?.field === 'exact_sampled_tokens')) errors.add('NO_DATA_CAUSES');
  return { ok: errors.size === 0, errors: Array.from(errors).sort() };
}

function run() {
  const runtime = arg('--runtime'), model = arg('--model'), output = arg('--output');
  const validateFile = arg('--validate');
  if (validateFile && runtime && model && !output) {
    const runtimePath = path.resolve(runtime), modelPath = path.resolve(model), artifact = JSON.parse(readFileSync(path.resolve(validateFile), 'utf8'));
    const integrity = validateRepresentationArtifact(artifact, sourceCases(), runtimePath, modelPath);
    process.stdout.write(JSON.stringify(integrity) + '\n');
    if (!integrity.ok) process.exitCode = 1;
    return;
  }
  if (!runtime || !model || !output) throw new Error('Required: --runtime PATH --model PATH --output PATH; validation: --validate FILE --runtime PATH --model PATH');
  const [runtimePath, modelPath, outputPath] = [runtime, model, output].map((value) => path.resolve(value));
  for (const file of [runtimePath, modelPath]) {
    try { accessSync(file, constants.R_OK); } catch (error) { throw new Error(`NO_DATA: unreadable input ${file}: ${error.message}`); }
  }
  const fixtures = sourceCases();
  const grammarFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'evidence/state-readability-20261015/responses-pass2.json');
  const grammar = JSON.stringify(JSON.parse(readFileSync(grammarFile, 'utf8')).model.configuration.grammar_schema);
  const version = spawnSync(runtimePath, ['--version'], { encoding: 'utf8', timeout: 10000 });
  if (version.status !== 0) throw new Error(`NO_DATA: runtime version failed: ${version.stderr || version.error}`);
  const settings = { passes: 2, temperature: 0, seed: 14, threads: 1, gpu_layers: 0, context: 4096, max_generated: 512, offline: true };
  const records = [];
  for (let pass = 1; pass <= 2; pass++) for (const fixture of fixtures.selected) for (const condition of CONDITIONS) {
    const input = makeInput(condition, fixture), wrapped = PREFIX + input + SUFFIX;
    const begin = process.hrtime.bigint();
    const result = spawnSync(runtimePath, ['--offline', '-m', modelPath, '-p', wrapped, '--no-conversation', '--no-display-prompt', '--no-warmup', '--seed', '14', '--temp', '0', '-c', '4096', '-n', '512', '-t', '1', '--gpu-layers', '0', '--json-schema', grammar], { encoding: 'utf8', timeout: 60000, maxBuffer: 131072 });
    const elapsed_ms = Number(process.hrtime.bigint() - begin) / 1e6;
    const response_text = (result.stdout || '').replace(/\s*\[end of text\]\s*$/, '').trim();
    let response = null;
    try { response = JSON.parse(response_text); } catch { /* fail closed below */ }
    const checked = response === null ? { format_valid: false, semantic_correct: false, proposal: 'REJECTED', executed: false }
      : evaluateResponse(response_text, fixture.expected);
    const no_data = result.error ? [`Runtime process error: ${result.error.message}`]
      : result.status !== 0 ? [`Runtime exit status ${result.status}`]
        : !checked.format_valid ? ['Output rejected by closed response contract'] : [];
    records.push({ pass, fixture_id: fixture.id, condition, source_sha256: fixture.source_sha256,
      wire_sha256: condition === 'compact_vector' ? fixture.vector_sha256 : fixture.named_sha256,
      wire_bytes: condition === 'compact_vector' ? fixture.compact_bytes : fixture.named_bytes,
      input_sha256: textHash(input), model_input_sha256: sha(wrapped), response_text,
      response_sha256: textHash(response_text), response, ...checked, elapsed_ms,
      prompt_evaluation_count: null, generation_evaluation_runs: null,
      token_count_cause: 'This llama.cpp build exposes evaluation counters on stderr; exact sampled-token count is not captured by this runner.',
      returncode: result.status, no_data });
    process.stdout.write(`pass=${pass} fixture=${fixture.id} representation=${condition} valid=${checked.format_valid} correct=${checked.semantic_correct} ms=${elapsed_ms.toFixed(0)}\n`);
  }
  const summary = {};
  for (const condition of CONDITIONS) {
    const rows = records.filter((record) => record.condition === condition);
    summary[condition] = { readings: rows.length, format_valid: rows.filter((row) => row.format_valid).length,
      semantic_correct: rows.filter((row) => row.semantic_correct).length,
      median_latency_ms: rows.map((row) => row.elapsed_ms).sort((a, b) => a - b)[Math.floor(rows.length / 2)] };
  }
  const artifact = { schema: 'preceptoros.state-readability.representation-experiment/1',
    provenance: 'Two frozen synthetic fixtures; paired fresh local subprocesses; no live visitor state',
    source_sha256: fixtures.source_sha256, runtime: path.basename(runtimePath), runtime_sha256: readHash(runtimePath),
    runtime_version: (version.stdout + version.stderr).trim(), model: path.basename(modelPath), model_sha256: readHash(modelPath),
    settings, grammar_sha256: textHash(grammar), grammar_bytes: Buffer.byteLength(grammar), summary,
    fixtures: fixtures.selected.map(({ id, source_sha256, vector_sha256, named_sha256, compact_bytes, named_bytes }) =>
      ({ id, provenance: 'SYNTHETIC', source_sha256, vector_sha256, named_sha256, compact_bytes, named_bytes })), records,
    limitations: ['Only empty and complete fixtures fit both representations; unicode and overflow are excluded from paired inference.',
      'Compact and named prompts each state equivalent extraction paths; task token counts differ and remain a limitation.',
      'Two passes over two synthetic fixtures do not establish general comprehension or live game suitability.',
      'Energy is NO_DATA: no energy reading was collected.',
      'Exact sampled token totals are NO_DATA: this runner does not parse or independently verify token totals.'],
    no_data: [{ field: 'energy', cause: 'No energy reading was collected.' },
      { field: 'exact_sampled_tokens', cause: 'Runtime counters are not captured as an independently verified sampled-token count.' }] };
  if (records.length !== 8 || records.some((row) => !hashPattern.test(row.response_sha256) || !Number.isFinite(row.elapsed_ms))) throw new Error('NO_DATA: evidence record contract failed');
  const integrity = validateRepresentationArtifact(artifact, fixtures, runtimePath, modelPath);
  if (!integrity.ok) throw new Error(`NO_DATA: generated evidence rejected by contract: ${integrity.errors.join(', ')}`);
  writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + '\n');
  process.stdout.write(`artifact=${outputPath} sha256=${readHash(outputPath)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
