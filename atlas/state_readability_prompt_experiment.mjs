// Offline prompt comparison against synthetic fixtures; never called by the game.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, accessSync, constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runAudit, READING_TASK, canonicalJson, expectedReading, evaluateResponse, textHash } from './state_readability_probe.mjs';

export const EXPLICIT_MAP_TASK = READING_TASK + '\nWire map: c is cycle; r[0] copper, r[1] light, r[2] biomass, r[3] oxygen; '
  + 'k[0] and k[1] are the crab home_offset x and y; there is no absolute position in this vector; '
  + 'buoy_phase is the second item of the e entry whose first item is exactly boya-estado. '
  + 'A null field means unavailable; do not copy a value from another field.';
const PREFIX = '<|im_start|>system\nRead the complete supplied evidence. Return only the requested JSON without acting.<|im_end|>\n<|im_start|>user\n';
const SUFFIX = '<|im_end|>\n<|im_start|>assistant\n';
const HASH = /^[0-9a-f]{64}$/;
const ARTIFACT_KEYS = ['schema', 'provenance', 'source_sha256', 'runtime', 'runtime_sha256', 'runtime_version', 'model', 'model_sha256', 'settings', 'summary', 'records'];
const RECORD_KEYS = ['pass', 'fixture_id', 'condition', 'with_vector_dictionary', 'input_sha256', 'model_input_sha256', 'response_sha256', 'response_text', 'response', 'format_valid', 'semantic_correct', 'proposal', 'executed', 'expected', 'elapsed_ms', 'prompt_tokens', 'generated_tokens', 'token_count_cause', 'returncode', 'no_data'];
const keysMatch = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('|') === keys.slice().sort().join('|');
const same = (a, b) => { try { return canonicalJson(a) === canonicalJson(b); } catch { return false; } };
export function makeInput(condition, item, withVectorDictionary) {
  const task = condition === 'explicit_map' ? EXPLICIT_MAP_TASK : READING_TASK;
  return task + '\n' + item.wire_text + (withVectorDictionary ? '\n' + canonicalJson(item.declaration) : '');
}
export function makeModelInput(input) { return PREFIX + input + SUFFIX; }
const sha = (v) => createHash('sha256').update(v).digest('hex');
export function validateExperimentArtifact(artifact) {
  const errors = new Set();
  if (!keysMatch(artifact, ARTIFACT_KEYS)) errors.add('ARTIFACT_KEYS');
  if (!artifact || artifact.schema !== 'preceptoros.state-readability.prompt-experiment/1'
      || artifact.provenance !== 'SYNTHETIC fixtures; fresh local subprocess per reading; no live user data') errors.add('ARTIFACT_CONTRACT');
  if (typeof artifact?.runtime !== 'string' || !artifact.runtime || artifact.runtime !== path.basename(artifact.runtime)
      || typeof artifact?.model !== 'string' || !artifact.model || artifact.model !== path.basename(artifact.model)
      || typeof artifact?.runtime_version !== 'string' || !artifact.runtime_version) errors.add('ARTIFACT_IDENTITY');
  for (const field of ['source_sha256', 'runtime_sha256', 'model_sha256']) if (!HASH.test(artifact?.[field] || '')) errors.add('ARTIFACT_HASH');
  const settings = { passes: 2, temperature: 0, seed: 14, threads: 1, gpu_layers: 0, context: 4096, max_generated: 512, offline: true };
  if (!same(artifact?.settings, settings)) errors.add('SETTINGS_CONTRACT');
  const audit = runAudit(), sourceHash = audit.cases[0]?.source_sha256;
  if (artifact?.source_sha256 !== sourceHash) errors.add('SOURCE_HASH');
  const fixtures = new Map(audit.cases.map((item) => [item.fixture_id, { ...item, declaration: audit.declaration, vector: JSON.parse(item.wire_text) }]));
  const records = artifact?.records;
  if (!Array.isArray(records) || records.length !== fixtures.size * 2 * 2 * 2) errors.add('RECORD_COUNT');
  const seen = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) { errors.add('RECORD_KEYS'); continue; }
    if (!keysMatch(record, RECORD_KEYS)) errors.add('RECORD_KEYS');
    const fixture = fixtures.get(record.fixture_id);
    if (!fixture || ![1, 2].includes(record.pass) || !['control', 'explicit_map'].includes(record.condition)
        || typeof record.with_vector_dictionary !== 'boolean') { errors.add('RECORD_IDENTITY'); continue; }
    const combination = [record.pass, record.fixture_id, record.condition, record.with_vector_dictionary].join('|');
    if (seen.has(combination)) errors.add('RECORD_DUPLICATE');
    seen.add(combination);
    const input = makeInput(record.condition, fixture, record.with_vector_dictionary);
    if (record.input_sha256 !== textHash(input)) errors.add('INPUT_HASH');
    if (record.model_input_sha256 !== sha(makeModelInput(input))) errors.add('MODEL_INPUT_HASH');
    if (typeof record.response_text !== 'string' || textHash(record.response_text) !== record.response_sha256) errors.add('RESPONSE_HASH');
    if (!Number.isFinite(record.elapsed_ms) || record.elapsed_ms < 0 || record.prompt_tokens !== null
        || record.generated_tokens !== null || typeof record.token_count_cause !== 'string' || !record.token_count_cause
        || record.executed !== false || !Array.isArray(record.no_data)
        || !(record.returncode === null || Number.isInteger(record.returncode))) errors.add('MEASUREMENT_FIELDS');
    if (record.no_data.some((cause) => typeof cause !== 'string' || !cause.trim())) errors.add('NO_DATA_CAUSE');
    if (record.returncode !== 0 && record.no_data.length === 0) errors.add('PROCESS_CAUSE');
    let parsed = null, parsedOk = true;
    try { parsed = JSON.parse(record.response_text); } catch { parsedOk = false; }
    if (!parsedOk) {
      if (record.response !== null || record.format_valid !== false || record.semantic_correct !== false
          || record.proposal !== 'REJECTED' || record.no_data.length === 0) errors.add('RESPONSE_BINDING');
    } else {
      if (!same(parsed, record.response)) errors.add('RESPONSE_BINDING');
      const checked = evaluateResponse(record.response_text, expectedReading(fixture.vector));
      if (record.format_valid !== checked.format_valid || record.semantic_correct !== checked.semantic_correct
          || record.proposal !== checked.proposal) errors.add('RESPONSE_VALIDATION');
      if (!checked.format_valid && record.no_data.length === 0) errors.add('REJECTION_CAUSE');
    }
    if (!same(record.expected, expectedReading(fixture.vector))) errors.add('EXPECTED_READING');
  }
  if (seen.size !== fixtures.size * 2 * 2 * 2) errors.add('CONDITION_COVERAGE');
  const summaryKeys = ['control_without_vector_dictionary', 'control_with_vector_dictionary',
    'explicit_map_without_vector_dictionary', 'explicit_map_with_vector_dictionary'];
  if (keysMatch(artifact?.summary, summaryKeys)) {
    const expectedSummary = {};
    const recordList = Array.isArray(records) ? records : [];
    for (const condition of ['control', 'explicit_map']) for (const withVectorDictionary of [false, true]) {
      const subset = recordList.filter((r) => r && r.condition === condition && r.with_vector_dictionary === withVectorDictionary);
      expectedSummary[`${condition}_${withVectorDictionary ? 'with' : 'without'}_vector_dictionary`] = {
        readings: subset.length, semantic_correct: subset.filter((r) => r.semantic_correct).length,
        format_valid: subset.filter((r) => r.format_valid).length,
        median_latency_ms: subset.map((r) => r.elapsed_ms).sort((a,b) => a-b)[Math.floor(subset.length / 2)]
      };
    }
    if (!same(artifact.summary, expectedSummary)) errors.add('SUMMARY_BINDING');
  } else errors.add('SUMMARY_KEYS');
  return { ok: errors.size === 0, errors: Array.from(errors).sort() };
}
function digestPath(p) { const r = spawnSync('sha256sum', [p], { encoding: 'utf8', timeout: 120000 }); if (r.status !== 0) throw new Error(`NO_DATA: sha256sum failed for ${p}: ${r.stderr}`); return r.stdout.split(/\s+/)[0]; }
function arg(name, fallback = null) { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; }
function run() {
  const runtime = arg('--runtime'), model = arg('--model'), out = arg('--output');
  if (!runtime || !model || !out) throw new Error('Required: --runtime PATH --model PATH --output PATH');
  const resolved = [runtime, model].map((p) => path.resolve(p));
  for (const p of resolved) { try { accessSync(p, constants.R_OK); } catch (error) { throw new Error(`NO_DATA: unreadable input ${p}: ${error.message}`); } }
  const passCount = Number(arg('--passes', '2'));
  if (!Number.isInteger(passCount) || passCount !== 2) throw new Error('Only two passes are defined for this comparison');
  const audit = runAudit();
  const fixtures = audit.cases.map((item) => ({ ...item, declaration: audit.declaration, vector: JSON.parse(item.wire_text) }));
  const schema = JSON.parse(readFileSync(new URL('./evidence/state-readability-20261015/responses-pass2.json', import.meta.url), 'utf8')).model.configuration.grammar_schema;
  const grammar = JSON.stringify(schema);
  const runtimeVersion = spawnSync(resolved[0], ['--version'], { encoding: 'utf8', timeout: 10000 });
  if (runtimeVersion.status !== 0) throw new Error(`NO_DATA: runtime version failed: ${runtimeVersion.stderr}`);
  const records = [];
  for (let pass = 1; pass <= passCount; pass++) for (const fixture of fixtures) for (const withVectorDictionary of [false, true]) for (const condition of ['control', 'explicit_map']) {
    const input = makeInput(condition, fixture, withVectorDictionary), wrapped = makeModelInput(input);
    const start = process.hrtime.bigint();
    const result = spawnSync(resolved[0], ['--offline', '-m', resolved[1], '-p', wrapped, '--single-turn', '--simple-io', '--no-display-prompt', '--no-context-shift', '--no-warmup', '--seed', '14', '--temp', '0', '-c', '4096', '-n', '512', '-t', '1', '--gpu-layers', '0', '--json-schema', grammar], { encoding: 'utf8', timeout: 60000, maxBuffer: 131072 });
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    const raw = (result.stdout || '').replace(/\s*\[end of text\]\s*$/, '').trim();
    let validated;
    let parsed = null, parsedOk = true;
    try { parsed = JSON.parse(raw); } catch { parsedOk = false; }
    validated = parsedOk ? evaluateResponse(raw, expectedReading(fixture.vector)) : { format_valid: false, semantic_correct: false, proposal: 'REJECTED', executed: false };
    const noData = result.error ? [result.error.message] : !parsedOk ? ['Runtime output is not parseable JSON']
      : !validated.format_valid ? ['Model output rejected by the closed response contract']
        : result.status !== 0 ? [`Runtime exited with status ${result.status}`] : [];
    records.push({ pass, fixture_id: fixture.fixture_id, condition, with_vector_dictionary: withVectorDictionary,
      input_sha256: textHash(input), model_input_sha256: sha(wrapped), response_sha256: textHash(raw), response_text: raw,
      response: parsed, ...validated, expected: expectedReading(fixture.vector), elapsed_ms: elapsedMs,
      prompt_tokens: null, generated_tokens: null,
      token_count_cause: 'This runtime exposes evaluation units, not independently verified sampled-token totals',
      returncode: result.status, no_data: noData });
    process.stdout.write(`pass=${pass} fixture=${fixture.fixture_id} condition=${condition} dictionary=${withVectorDictionary} semantic=${records.at(-1).semantic_correct} ms=${elapsedMs.toFixed(0)}\n`);
    if (result.error) records.at(-1).process_error = result.error.message;
  }
  const summary = {};
  for (const condition of ['control', 'explicit_map']) for (const withVectorDictionary of [false, true]) {
    const subset = records.filter((r) => r.condition === condition && r.with_vector_dictionary === withVectorDictionary);
    summary[`${condition}_${withVectorDictionary ? 'with' : 'without'}_vector_dictionary`] = { readings: subset.length, semantic_correct: subset.filter((r) => r.semantic_correct).length, format_valid: subset.filter((r) => r.format_valid).length, median_latency_ms: subset.map((r) => r.elapsed_ms).sort((a,b) => a-b)[Math.floor(subset.length / 2)] };
  }
  const artifact = { schema: 'preceptoros.state-readability.prompt-experiment/1', provenance: 'SYNTHETIC fixtures; fresh local subprocess per reading; no live user data', source_sha256: audit.cases[0]?.source_sha256 ?? null, runtime: path.basename(resolved[0]), runtime_sha256: digestPath(resolved[0]), runtime_version: (runtimeVersion.stdout + runtimeVersion.stderr).trim(), model: path.basename(resolved[1]), model_sha256: digestPath(resolved[1]), settings: { passes: 2, temperature: 0, seed: 14, threads: 1, gpu_layers: 0, context: 4096, max_generated: 512, offline: true }, summary, records };
  const integrity = validateExperimentArtifact(artifact);
  if (!integrity.ok) throw new Error(`NO_DATA: generated evidence rejected by contract: ${integrity.errors.join(', ')}`);
  writeFileSync(out, JSON.stringify(artifact, null, 2) + '\n');
  process.stdout.write(`artifact=${out} sha256=${sha(readFileSync(out))}\n`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
