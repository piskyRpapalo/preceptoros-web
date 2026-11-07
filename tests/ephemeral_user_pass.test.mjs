import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

// EU-1 piece 1: the single visit pass in a real browser (atlas/ephemeral_user_pass_browser.mjs).
const run = promisify(execFile);
async function visit(args) {
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/ephemeral_user_pass_browser.mjs', ...args], { cwd: new URL('..', import.meta.url), timeout: 90000 })); }
  catch (error) { throw new Error('visit pass failed: ' + ((error.stdout || '').trim() || error.message)); }
  return JSON.parse(stdout.trim());
}

// 2026-11-07: with no node alive the place steps are NO_DATA ('no node is alive to visit yet') and the visit still ends.
test('empty colony: the place steps are NO_DATA with their cause and the visit completes the rest', async () => {
  const out = await visit(['--empty']);
  assert.deepEqual(out.fallos, []);
  assert.match(out.medidas.linea_vacia, /NO_DATA: no node is alive yet \(the colony is empty\)/);
  assert.match(out.medidas.fin_visita, /played: none · skipped: key, beacon, node/);
});

test('one visit from /openworld/ to the end of the short route, with the account alive and the tutorial coherent', async () => {
  const run = promisify(execFile);
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/ephemeral_user_pass_browser.mjs'], { cwd: new URL('..', import.meta.url), timeout: 90000 })); }
  catch (error) { throw new Error('visit pass failed: ' + ((error.stdout || '').trim() || error.message)); }
  const out = JSON.parse(stdout.trim());
  assert.deepEqual(out.fallos, []);
  assert.match(out.medidas.fin_visita, /skipped: beacon/);
  assert.match(out.medidas.ultima, /tutorial: complete/);
});
