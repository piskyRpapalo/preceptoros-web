// Cases for the one hexagonal skin (F0 slice v): it hangs from the live OpenWorld floor
// (map_painter.js + comic_tokens.js), never from a second palette.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const req = createRequire(import.meta.url);
const S = req('../public/game/skin_tokens.js');
const M = req('../public/game/map_painter.js');
const F = req('../public/game/state_frames.js');
const P = req('../public/game/hex_projection.js');
const SRC = readFileSync(new URL('../public/game/skin_tokens.js', import.meta.url), 'utf8');

test('tiles are the floor bands, in map order, each with its pattern', () => {
  assert.deepEqual(S.TILES.map((t) => [t.kind, t.pattern]), M.bands().map((b) => [b.kind, b.pattern]));
  assert.deepEqual(S.TILES.map((t) => t.pattern), ['waves', 'dots', 'hatch', 'cross']);
  M.bands().forEach((b, i) => {
    assert.equal(S.TILES[i].base, M.color.css(b.base));
    assert.equal(S.TILES[i].height, b.h * M.HSTEP);
  });
});

test('no colour literal lives in the skin: every colour is computed from canon', () => {
  assert.equal(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i.test(SRC), false);
  for (const t of S.TILES) for (const k of ['base', 'top', 'sideDark', 'sideLit']) assert.match(t[k], /^#[0-9a-f]{6}$/);
});

test('prism faces keep the floor light: dark side < lit side < top', () => {
  const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  for (const t of S.TILES) assert.ok(lum(t.sideDark) < lum(t.sideLit) && lum(t.sideLit) < lum(t.top), t.kind);
});

test('motion is the floor sea, and it stands still under reduced motion', () => {
  assert.deepEqual(S.motion(false), M.frameOf({ c: [0, 0], cells: [] }, 0, false).sea);
  const still = S.motion(true);
  assert.equal(still.amp, 0);
  assert.equal(still.speed, 0);
  for (const [ms, red] of [[300, true], [300, false], [-5, false], [5000, false], [12.6, false]]) {
    assert.equal(S.transitionMs(ms, red), F.transitionMs(ms, red));
  }
});

test('text on every tile is readable: body >= 4.5:1, or flagged large-only >= 3:1', () => {
  for (const t of S.TILES) {
    const r = S.textOn(t.kind);
    assert.ok(r.color, t.kind);
    assert.ok(r.largeOnly ? r.ratio >= 3 : r.ratio >= 4.5, t.kind + ' ' + r.ratio);
  }
  assert.equal(S.textOn('lava'), null);
  assert.ok(S.contrast(S.PAPER, S.INK) >= 4.5);
  assert.equal(S.contrast('red', '#000000'), null);
});

test('touch target never under 44 px, type never under 12 px; bad radius is null', () => {
  for (let r = 8; r <= 256; r += 0.5) {
    const m = S.metrics(r);
    assert.ok(m.touchPx >= 44 && m.fontPx >= 12 && m.strokePx >= 1, 'r=' + r);
  }
  assert.deepEqual(S.metrics(32), { hexWidth: 64, hexHeight: 55, fontPx: 16, lineHeightPx: 22, strokePx: 2, touchPx: 55 });
  for (const r of [7.9, 257, NaN, Infinity, '32', null, undefined]) assert.equal(S.metrics(r), null);
});

test('map constants follow hex_projection and the floor prism step', () => {
  assert.equal(P(1, 0).x, 1.5 * S.MAP.radius);
  assert.ok(Math.abs(P(0, 1).y - Math.sqrt(3) * S.MAP.radius * S.MAP.squash) < 1e-9);
  assert.equal(S.MAP.prismStep, M.HSTEP);
});

test('font is the measured canon, and the OpenWorld page loads the skin sources first', () => {
  assert.equal(S.FONT_FAMILY, 'system-ui, sans-serif');
  const html = readFileSync(new URL('../public/openworld/index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('/game/comic_tokens.js') < html.indexOf('/game/map_painter.js'));
});

test('the module is pure: no randomness, no clock, no network, no DOM', () => {
  for (const bad of ['Math.random', 'Date', 'fetch(', 'XMLHttpRequest', 'document.']) assert.ok(!SRC.includes(bad), bad);
});
