import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

// EU-1 piece 1: the single visit pass in a real browser (atlas/usuario_efimero_pasada_browser.mjs).
test('one visit from /openworld/ to the end of the short route, with the account alive and the tutorial coherent', async () => {
  const run = promisify(execFile);
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/usuario_efimero_pasada_browser.mjs'], { cwd: new URL('..', import.meta.url), timeout: 90000 })); }
  catch (error) { throw new Error('visit pass failed: ' + ((error.stdout || '').trim() || error.message)); }
  const out = JSON.parse(stdout.trim());
  assert.deepEqual(out.fallos, []);
  assert.match(out.medidas.fin_visita, /skipped: beacon/);
  assert.match(out.medidas.ultima, /tutorial: complete/);
});
