// Task #10 (Sovereign, 2026-11-08): the app's ball and sting on every click, ported from the app's transicion.js and sting.js.
// Pure: the path and the score are read without a document or an AudioContext.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const T = createRequire(import.meta.url)('../../public/game/click_trail.js');
const src = readFileSync(new URL('../../public/game/click_trail.js', import.meta.url), 'utf8');
test('the ball floats from one control to the next: seven fading balls, it arrives, and it sways side to side', () => {
  const a = [20, 600], b = [300, 100], first = T.path(a, b, 0), end = T.path(a, b, T.FRAMES);
  assert.equal(first.length, 7); assert.deepEqual(first[0].slice(0, 2), a);
  assert.ok(Math.hypot(end[0][0] - b[0], end[0][1] - b[1]) < 1e-6, 'the lead ball does not arrive');
  assert.ok(end.every((p, i) => i === 0 || p[3] < end[i - 1][3]), 'the tail does not fade');
  const mid = T.path(a, b, T.FRAMES / 4)[0], u = 0.25, line = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  assert.ok(Math.hypot(mid[0] - line[0], mid[1] - line[1]) > 2, 'the ball goes straight: no side-to-side float');
  assert.deepEqual(T.path(a, b, 9), T.path(a, b, 9), 'the same frame draws a different path');
});
test('the sting is the app\'s: eight FM notes up from 220 Hz, 70 ms apart, the whole under 0.6 s', () => {
  const n = T.notes(); assert.equal(n.length, 8); assert.equal(n[0][0], 220); assert.ok(Math.abs(n[7][0] - 220 * Math.pow(2, 16 / 12)) < 1e-9);
  assert.ok(n.every((x, i) => Math.abs(x[1] - i * 0.07) < 1e-9) && n[7][2] < 0.6);
});
test('no chance, no clock; reduced motion is silent and still; the ball is hidden from screen readers', () => {
  assert.doesNotMatch(src, /Math\.random|Date\.now|performance\.now|new Date/);
  assert.match(src, /prefers-reduced-motion: reduce/); assert.match(src, /still\(win\)\) \{ last = el \|\| last; return; \}/);
  assert.match(src, /setAttribute\('aria-hidden', 'true'\)/);
});
