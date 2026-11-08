import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

// W-4/W-5 after the controls retirement: the pad and the arrow-walk are gone; walking is a tap,
// a node place, and Enter; the view joystick stays on the map.
test('the pad and arrow-walk are retired; the view joystick stays; Enter walks on node places', async () => {
  const run = promisify(execFile);
  let stdout = '';
  try { ({ stdout } = await run(process.execPath, ['atlas/walk_keys_browser.mjs'], { cwd: new URL('..', import.meta.url), timeout: 120000 })); }
  catch (error) { throw new Error('walk keys check failed: ' + ((error.stdout || '').trim() || error.message)); }
  const out = JSON.parse(stdout.trim());
  assert.deepEqual(out.fallos, []);
  assert.deepEqual(out.medidas.botones, ['Skip tutorial']);
  assert.equal(out.medidas.retiro.pad, false);
  assert.equal(out.medidas.retiro.dataDirections, 0);
  assert.equal(out.medidas.retiro.arrowsWalk, false);
  assert.equal(out.medidas.joystick.present, true);
  assert.equal(out.medidas.joystick.buttons, 2); // decree 2026-11-07, fulfilled 2026-11-08: the crab is born, its stick lives
  assert.ok(out.medidas.joystick.minHeight >= 44);
  assert.match(out.medidas.llegada, /terminal: basic/);
});
