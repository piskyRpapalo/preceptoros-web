// M0, Art.13: lossless English serialization, baseline e01462b.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const raw = readFileSync(new URL('../public/atlas-en.json', import.meta.url));
const baseline = 'b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function validate(value) {
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
