// M0, Art.13: lossless English serialization, baseline e01462b.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const raw = readFileSync(new URL('./fixtures/m0-en.json', import.meta.url));
// G5a: the two incubation labels use WavesCraft; the prior object remains in Git history.
const baseline = 'cd6d33ee6780780189482bfa031aa36f00d0c2b2709e3112f08b203b7676ee9a';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function validate(value) {
  assert.equal(value.ui.inc_h, 'WavesCraft', 'M0 incubation name');
  assert.equal(value.ui.army_carga, 'Opening WavesCraft…', 'M0 loading name');
  assert.equal(digest(value), baseline, 'English object changed');
}
const value = JSON.parse(raw);
if (process.argv.includes('--sabotage')) {
  delete value.ui.inc_h;
  validate(value);
} else {
  validate(value);
  assert(raw.byteLength < 16384, 'English serialization exceeds phase budget');
  assert.equal(raw.toString(), JSON.stringify(value) + '\n', 'serialization is not compact');
  console.log(JSON.stringify({piece:'M0',bytes:raw.byteLength,object_sha256:digest(value),equal:true}));
}
