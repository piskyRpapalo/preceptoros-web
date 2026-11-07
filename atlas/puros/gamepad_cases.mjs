// Cases for the gamepad's pure core (public/game/gamepad.js, Sovereign 2026-11-07). The spectrum of a control reads its
// name alone: the same name gives the same curve on every run, no clock, no random number, no network; every target is
// at least 44 px; under prefers-reduced-motion there is no gesture.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const FILE = new URL('../../public/game/gamepad.js', import.meta.url);
const G = require(FILE.pathname);
const NAMES = ['Map', 'Character', 'Play', 'Welcome', 'Profile', 'Communication'];

test('FNV-1a 32-bit matches the published vectors', () => {
  assert.equal(G.fnv1a(''), 0x811c9dc5);
  assert.equal(G.fnv1a('a'), 0xe40c292c);
  assert.equal(G.fnv1a('foobar'), 0xbf9cf968);
});

test('determinism n=2: two runs give the same spectrum, curve, SVG and gesture', () => {
  for (const n of NAMES) {
    const a = [G.spectrum(n), G.curve(n, 32, 10, 25), G.svg(n, 32, 10), G.gesture(n, false)];
    const b = [G.spectrum(n), G.curve(n, 32, 10, 25), G.svg(n, 32, 10), G.gesture(n, false)];
    assert.deepEqual(a, b, n);
  }
});

test('the spectrum is three harmonics, amplitudes 1/k, a floor colour of the colony', () => {
  const soil = new Map(G.SOIL);
  for (const n of NAMES) {
    const s = G.spectrum(n);
    assert.deepEqual(s.amps, [1, 0.5, 0.333]);
    assert.equal(s.phases.length, 3);
    s.phases.forEach((p) => assert.ok(p >= 0 && p < Math.PI * 2, n + ' phase ' + p));
    assert.equal(soil.get(s.soil), s.color, n);
  }
  assert.deepEqual(G.SOIL.map((x) => x[1]), ['#64ae91', '#348ea2', '#6eb75d', '#d8be78', '#c19964', '#eacb56', '#45cbd4', '#a9bf68']);
});

test('the curve stays inside its box', () => {
  for (const n of NAMES) {
    const pts = G.curve(n, 32, 10, 25);
    assert.equal(pts.length, 25);
    pts.forEach(([x, y]) => assert.ok(x >= 0 && x <= 32 && y >= 0 && y <= 10, n + ' ' + x + ',' + y));
  }
});

test('44 px: a target is never under 44 px', () => {
  assert.equal(G.MIN, 44);
  for (const px of [0, 1, 20, 43.9, -5, NaN]) assert.equal(G.target(px), 44, String(px));
  assert.equal(G.target(64), 64);
});

test('reduced motion: no gesture; full motion: a gesture that starts and ends at rest', () => {
  for (const n of NAMES) {
    assert.equal(G.gesture(n, true).frames.length, 0, n);
    const g = G.gesture(n, false);
    assert.ok(g.frames.length >= 3, n);
    assert.equal(g.frames[0].transform, 'translate(0px,0px)');
    assert.equal(g.frames[g.frames.length - 1].transform, 'translate(0px,0px)');
    assert.ok(g.options.duration > 0);
  }
});

test('no clock, no random number, no network, under 9000 B', () => {
  const src = readFileSync(FILE, 'utf8');
  for (const bad of ['Math.random', 'Date.now', 'new Date', 'performance.now', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'setTimeout', 'setInterval']) {
    assert.ok(!src.includes(bad), 'gamepad.js uses ' + bad);
  }
  assert.ok(statSync(FILE).size <= 9000, 'gamepad.js is ' + statSync(FILE).size + ' B');
});

test('the middle buttons open things that already exist; the SVG is decorative', () => {
  assert.deepEqual(G.BUTTONS.map((b) => b.name), ['Play', 'Welcome', 'Profile', 'Communication']);
  assert.ok(G.svg('Play', 32, 10).includes('aria-hidden="true"'));
});
