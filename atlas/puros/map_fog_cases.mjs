// Fog of war on the floor: the clearings are pure, the node keeps one building of each kind, the rest are NPCs'.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const F = require('../../public/game/map_fog_layer.js');
const MC = require('../../public/game/map_chunks.js');
test('a hex is clear inside a clearing and fogged outside every one', () => {
  const list = [{ q: 0, r: 0, r0: 4 }, { q: 9, r: 0, r0: 2 }];
  assert.equal(F.clear(list, 0, 0), true);
  assert.equal(F.clear(list, 4, 0), true);
  assert.equal(F.clear(list, 6, 0), false);
  assert.equal(F.clear(list, 10, -1), true);
  assert.equal(F.clear([], 0, 0), false);
});
test('the node shows one building of each kind in colour; the rest are grey NPC buildings; the city reaches them all', () => {
  const cells = []; for (let q = -12; q <= 12; q++) for (let r = -12; r <= 12; r++) if (Math.abs(q + r) <= 12) cells.push([q, r, 1, 'land']);
  const world = { cells: { list: cells, at: Object.fromEntries(cells.map((c) => [c[0] + ',' + c[1], c])) } };
  MC.landmarks(world);
  const kinds = {}; world.markList.forEach((m) => { (kinds[m.id] = kinds[m.id] || []).push(m); });
  Object.values(kinds).forEach((list) => { assert.equal(list.filter((m) => !m.fog).length, 1, 'exactly one of each kind is the node\'s'); });
  assert.ok(world.markList.some((m) => m.fog), 'the rest are NPC buildings');
  const d = (m) => (Math.abs(m.q) + Math.abs(m.r) + Math.abs(m.q + m.r)) / 2;
  assert.ok(world.markList.filter((m) => !m.fog).every((m) => world.city[m.q + ',' + m.r]), 'the city holds the node\'s buildings');
  assert.ok(world.markList.filter((m) => m.fog).every((m) => !world.city[m.q + ',' + m.r]), 'no NPC building stands in the city');
  assert.ok(world.city['0,0'] && !world.city['12,0'], 'the city is the cabin district, not the whole map');
});
test('no chance in the fog', () => {
  assert.ok(!/Math\.random/.test(readFileSync(new URL('../../public/game/map_fog_layer.js', import.meta.url), 'utf8')));
});
test('draw lays the fog over the whole map, then cuts the clearings out of it', () => {
  const ops = [], rec = (name) => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'getContext' ? () => fogCtx : (...a) => ops.push(name + '.' + String(k) + ':' + (t.globalCompositeOperation || 'source-over'))), set: (t, k, v) => { t[k] = v; return true; } });
  const fogCtx = rec('fog'), g = rec('map');
  globalThis.document = { createElement: () => Object.assign(fogCtx, { width: 0, height: 0 }) };
  const H = { rgbOf: () => [10, 20, 30], mix: (a) => a, css: (c) => '#' + c.map((v) => ('0' + v.toString(16)).slice(-2)).join(''), T: { FRONT_DOOR: {}, NEUTRAL: {} } };
  const V = { world: { markList: [], cells: { at: {} } }, P: (q, r) => ({ x: q * 40, y: r * 40 }), turn: (x, y) => ({ x, y }), G: { k: 1, cx: 50, cy: 50 }, height: () => 0, HSTEP: 4, H };
  F.draw(g, V, { width: 100, height: 100 }, { q: 0, r: 0 });
  delete globalThis.document;
  const fill = ops.indexOf('fog.fillRect:source-over'), cut = ops.indexOf('fog.fill:destination-out'), lay = ops.indexOf('map.drawImage:source-over');
  assert.ok(fill >= 0 && cut > fill && lay > cut, ops.join(' '));
});
