import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

// W-4/W-5: keyboard node law remains beside the native terminal joystick.
test('arrow keys choose a visible neighbour, Enter walks there, and touch keeps six directions', async () => {
  const run = promisify(execFile);
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/walk_keys_browser.mjs'], { cwd: new URL('..', import.meta.url), timeout: 120000 })); }
  catch (error) { throw new Error('walk keys check failed: ' + ((error.stdout || '').trim() || error.message)); }
  const out = JSON.parse(stdout.trim());
  assert.deepEqual(out.fallos, []);
  assert.deepEqual(out.medidas.botones, ['NW', 'NE', 'W', 'E', 'SW', 'SE', 'Skip tutorial']);
  assert.deepEqual(out.medidas.joystick.directions, ['north-west', 'north-east', 'west', 'east', 'south-west', 'south-east']);
});
