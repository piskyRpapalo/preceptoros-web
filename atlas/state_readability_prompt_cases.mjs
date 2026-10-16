// Contract cases for the offline prompt experiment; no runtime is invoked here.
// The dated model artifact is historical and must fail closed when today's source/input differs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runAudit, READING_TASK } from './state_readability_probe.mjs';
import { EXPLICIT_MAP_TASK, makeInput, validateExperimentArtifact } from './state_readability_prompt_experiment.mjs';

const report = runAudit();
for (const item of report.cases) {
  for (const withVectorDictionary of [false, true]) {
    const fixture = { ...item, declaration: report.declaration };
    const control = makeInput('control', fixture, withVectorDictionary);
    const mapped = makeInput('explicit_map', fixture, withVectorDictionary);
    assert.equal(control.includes(item.wire_text), true, 'control input binds exact current wire');
    assert.equal(mapped.includes(item.wire_text), true, 'candidate input binds exact current wire');
    assert.equal(control.includes(JSON.stringify(fixture.declaration)), withVectorDictionary);
    assert.equal(mapped.includes(JSON.stringify(fixture.declaration)), withVectorDictionary);
    assert.notEqual(control, mapped, 'the treatment changes only the reading instructions');
  }
}
assert.ok(EXPLICIT_MAP_TASK.startsWith(READING_TASK));
assert.match(EXPLICIT_MAP_TASK, /r\[0\].*copper/);
assert.match(EXPLICIT_MAP_TASK, /k\[0\].*k\[1\].*home_offset/);
assert.match(EXPLICIT_MAP_TASK, /no absolute position/i);
assert.doesNotMatch(EXPLICIT_MAP_TASK, /1234|22|355/);
const artifactPath = new URL('./evidence/state-readability-20261015/prompt-experiment-20261015.json', import.meta.url);
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
const historicalErrors = validateExperimentArtifact(artifact).errors;
assert.deepEqual(historicalErrors, ['INPUT_HASH', 'MODEL_INPUT_HASH', 'SOURCE_HASH'],
  'changed source/input invalidates historical scores; no local model rerun is claimed');
const extra = structuredClone(artifact); extra.unexpected = true;
assert.ok(validateExperimentArtifact(extra).errors.includes('ARTIFACT_KEYS'), 'unknown fields fail closed');
const extraRecord = structuredClone(artifact); extraRecord.records[0].unexpected = true;
assert.ok(validateExperimentArtifact(extraRecord).errors.includes('RECORD_KEYS'), 'unknown record fields fail closed');
const altered = structuredClone(artifact); altered.records[0].input_sha256 = '0'.repeat(64);
assert.ok(validateExperimentArtifact(altered).errors.includes('INPUT_HASH'), 'altered input evidence is rejected');
const alteredOutput = structuredClone(artifact); alteredOutput.records[0].response_text = '{}';
assert.ok(validateExperimentArtifact(alteredOutput).errors.includes('RESPONSE_HASH'), 'altered output evidence is rejected');
process.stdout.write(`prompt experiment fixtures=${report.cases.length} conditions=2×2 · historical model evidence=NO_DATA for current source/input (${historicalErrors.join(',')})\n`);
