// panel_sheet_cases.mjs · the panel sheet (public/game/panel_sheet.js): the audio guide order and the framing step.
import { readFileSync } from 'node:fs'; import { test } from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../public/game/panel_sheet.js');
test('reading: title first, then each card in screen order: name, heading, one sentence, its buttons', () => {
  const l = S.reading('Help', [{ who: 'Welcome', head: 'Welcome to the sunken forest', text: 'A world of waves. Owners build.', buttons: ['Play now', 'Tools'] },
    { who: 'Guide', text: '', buttons: [] }]);
  assert.equal(l[0], 'Help panel.');
  assert.equal(l[1], 'Welcome: Welcome to the sunken forest. A world of waves. Buttons: Play now, Tools.');
  assert.equal(l[2], 'Guide');
  assert.ok(S.reading('T', Array.from({ length: 20 }, () => ({ who: 'x' }))).length <= 9, 'never a lecture');
});
test('reading never invents: an empty card says nothing', () => {
  assert.deepEqual(S.reading('Talk', [{}]), ['Talk panel.']);
});
test('aim: a point under a bottom sheet rises to the middle of what stays visible; a visible point does not move', () => {
  assert.deepEqual(S.aim({ x: 200, y: 700 }, 400, 800, 300, 400, 40), { dx: 0, dy: -550 });
  assert.deepEqual(S.aim({ x: 200, y: 100 }, 400, 800, 300, 400, 40), { dx: 0, dy: 0 });
  assert.deepEqual(S.aim({ x: 900, y: 300 }, 1200, 700, 700, 760, 40), { dx: -520, dy: 0 }, 'side sheet: moves left');
  assert.deepEqual(S.aim(null, 400, 800, 300, 400, 40), { dx: 0, dy: 0 }, 'no subject: no move');
});
test('the sheet only reads and frames: it never presses a button and has no chance', () => {
  const src = readFileSync(new URL('../public/game/panel_sheet.js', import.meta.url), 'utf8');
  assert.ok(!/\.click\(\)|Math\.random|fetch\(/.test(src), 'no presses, no chance, no network');
  assert.ok(/NO_DATA/.test(src), 'a browser without a voice is told, not hidden');
});
