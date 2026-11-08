// The pad in Acho, lifted: every button has its own inked icon, buttons stand on a ledge and sink when pressed, the sticks
// are domes; no raw colour, and forced colours stay plain (Sovereign, 2026-11-08).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../../public/game/talk.css', import.meta.url), 'utf8');
test('each pad button has its icon, painted as a mask in the ink colour; the text glyph stays as the aria fallback', () => {
  for (const sel of ['#gp-play', '#gp-town', '#gp-letters', '[data-cat=Welcome]', '[data-cat=Profile]', '[data-cat=Communication]']) {
    assert.ok(css.includes(sel + '{--ic:url("data:image/svg+xml,'), sel + ' has no icon');
  }
  assert.match(css, /@supports \(\(-webkit-mask-image:none\) or \(mask-image:none\)\)\{/, 'without masks the glyphs stay');
  assert.match(css, /::before\{content:"";[^}]*background:currentColor;-webkit-mask:var\(--ic\)/);
});
test('lifted: a ledge under each button, a press sinks it, the sticks are domes; reduced motion and forced colours respected', () => {
  assert.match(css, /:is\(\.gp-b,\.cats button\)\{box-shadow:0 4px 0 var\(--a1d1b26\)/);
  assert.match(css, /:active\{translate:0 3px;/);
  assert.match(css, /\.view-stick\.gp-acho\{box-shadow:[^}]*inset 0 10px 12px/);
  assert.match(css, /prefers-reduced-motion:reduce\)\{#gamepad :is\(\.gp-b,\.cats button\)\{transition:none\}/);
  assert.match(css, /forced-colors:active\)\{#gamepad :is\(\.gp-b,\.cats button\)::before\{forced-color-adjust:none;background:CanvasText\}/);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(css), 'no raw colour');
});
