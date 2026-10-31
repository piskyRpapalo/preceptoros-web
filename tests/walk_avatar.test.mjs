import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

// W-3: the avatar walks the map on a click (atlas/walk_avatar_browser.mjs).
test('a click walks the avatar over the visible route; arrival enters the node; an empty hex says NO_DATA', async () => {
  const run = promisify(execFile);
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/walk_avatar_browser.mjs'], { cwd: new URL('..', import.meta.url), timeout: 120000 })); }
  catch (error) { throw new Error('walk avatar check failed: ' + ((error.stdout || '').trim() || error.message)); }
  const out = JSON.parse(stdout.trim());
  assert.deepEqual(out.fallos, []);
  assert.match(out.medidas.llegada, /terminal: basic/);
  assert.ok(out.medidas.dibujos >= 12);
});
