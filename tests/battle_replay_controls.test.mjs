import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

// EU-3: the practice battle's replay controls in a real browser (atlas/battle_replay_controls_browser.mjs).
test('pause and ×1 ×2 ×4 reach the scene, the record does not change, and the visit goes on', async () => {
  const run = promisify(execFile);
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/battle_replay_controls_browser.mjs'], { cwd: new URL('..', import.meta.url), timeout: 120000 })); }
  catch (error) { throw new Error('replay controls check failed: ' + ((error.stdout || '').trim() || error.message)); }
  const out = JSON.parse(stdout.trim());
  assert.deepEqual(out.fallos, []);
  assert.deepEqual(out.medidas.tasas, [0, 0, 0, 4, 2, 0, 2]);
});
