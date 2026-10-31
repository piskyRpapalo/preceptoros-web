import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

// W-4: the keyboard walks the map (atlas/walk_keys_browser.mjs). The six-direction grid is gone.
test('arrow keys choose a visible neighbour, Enter walks there, and the grid is gone', async () => {
  const run = promisify(execFile);
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/walk_keys_browser.mjs'], { cwd: new URL('..', import.meta.url), timeout: 120000 })); }
  catch (error) { throw new Error('walk keys check failed: ' + ((error.stdout || '').trim() || error.message)); }
  const out = JSON.parse(stdout.trim());
  assert.deepEqual(out.fallos, []);
  assert.deepEqual(out.medidas.botones, ['Skip tutorial']);
});
