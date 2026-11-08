// Cases of place_name.js: a place name is a pure function of the map chunk, never of the visitor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
globalThis.AtlasMapCarta = require('../../public/game/map_chart.js');
const P = require('./place_name.js');
const chart = JSON.parse(readFileSync(new URL('../../public/map/chart.json', import.meta.url), 'utf8'));
const SPANISH = /\b(el|la|los|las|de|del|con|por|para|una|que|sin|sobre|casa|mundo|lugar)\b/i;

test('the radius is the chart radius, not a new chunk size', () => { assert.equal(P.RADIUS, chart.radius); });
test('deterministic: the same call gives the same name', () => {
  for (const [q, r] of [[0, 0], [3, -2], [-40, 17], [100, 100]]) assert.equal(P.name(q, r), P.name(q, r));
});
test('same chunk, same name, for every cell of the chunk', () => {
  const R = chart.radius, C = globalThis.AtlasMapCarta, seen = new Set();
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) {
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > R) continue;
    assert.deepEqual(C.chunkOf(q, r, R), [0, 0]); seen.add(P.name(q, r));
  }
  assert.equal(seen.size, 1);
});
test('different chunks give different names in a sample', () => {
  const R = chart.radius, names = new Map();
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const c = [i * (2 * R + 1) + j * R, -i * R + j * (R + 1)], n = P.name(c[0], c[1]);
    assert.ok(!names.has(n), 'collision ' + n + ' ' + names.get(n) + ' / ' + c); names.set(n, c);
  }
  assert.equal(names.size, 49);
});
test('shape: capitalized, 2-3 syllables, no Spanish', () => {
  for (let q = -60; q <= 60; q += 7) for (let r = -60; r <= 60; r += 5) {
    const n = P.name(q, r);
    assert.match(n, /^[A-Z][a-z]{3,8}$/); assert.ok(!SPANISH.test(n), n);
  }
});
test('label and the missing position', () => {
  assert.equal(P.label({ q: 2, r: -1 }), P.name(2, -1) + ' · 2, -1');
  for (const bad of [null, undefined, {}, { q: NaN, r: 0 }, { q: 1.5, r: 0 }]) assert.equal(P.label(bad), 'NO_DATA: visitor position unavailable');
});
test('the generated note is exposed and the module touches no identity, storage or network', () => {
  const el = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; if (k === 'title') delete this.title; } };
  P.mark(el, { q: 1, r: 2 });
  assert.equal(el.textContent, P.name(1, 2) + ' · 1, 2');
  assert.equal(el.title, 'Generated place name: same place, same name; not an identity');
  assert.equal(el.attrs['aria-description'], el.title);
  P.mark(el, null, 'Visitor-ab · ');
  assert.equal(el.textContent, 'Visitor-ab · NO_DATA: visitor position unavailable'); assert.equal(el.title, undefined);
  const src = readFileSync(new URL('./place_name.js', import.meta.url), 'utf8');
  assert.ok(!/localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|XMLHttpRequest|WebSocket|Math\.random|Date\b|account|info\(\)/.test(src), 'pure: coordinates only');
});
