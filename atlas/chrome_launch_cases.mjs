import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// An unavailable browser must produce a failed measurement, never a skipped green gate.
const run = spawnSync(process.execPath, [new URL('./sin_undefined.mjs', import.meta.url).pathname], {
  env: { ...process.env, CHROME_BINARY: '/nonexistent/phase-chrome' },
  encoding: 'utf8', timeout: 20000
});
assert.equal(run.error, undefined, run.error?.message);
assert.equal(run.status, 1, 'missing Chrome escaped the gate');
const report = JSON.parse(run.stdout);
assert.equal(report.pasos, 0);
assert(report.fallos.some(f => /NO_DATA: Chrome CDP unavailable/.test(f.snippet) && /ENOENT/.test(f.snippet)));
console.log('Chrome unavailable: exit 1, zero steps, NO_DATA with cause; rejection verified.');
