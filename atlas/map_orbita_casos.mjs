// Órbita del mapa: el ángulo de vista (canvas.dataset.angle) gira la proyección en la ÚNICA colocación (geometry de
// colonia_pagina.js) y en el pintor del suelo (map_painter.js), que reordena por la profundidad GIRADA. Dibujo y prueba
// de clic leen lo mismo a cualquier ángulo; el zoom anclado deja fijo el punto bajo el dedo. Ley P5: sólo cambia la vista.
// Uso: node --test atlas/map_orbita_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.AtlasStateFrames = require('./puros/state_frames.js');
globalThis.HexProjection = require('./puros/hex_projection.js');
globalThis.AtlasColonyState = require('../public/game/colony_state.js');
globalThis.AtlasEdificios = require('../public/game/colonia_edificios.js');
globalThis.AtlasPaletteCycle = require('../public/game/palette_cycle.js');
const CP = require('../public/game/colonia_pagina.js');
const Z = require('../public/game/map_zoom.js');
const MP = require('../public/game/map_painter.js');
const HP = require('../public/game/hex_projection.js');

const COLONIA = { nodes: [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }, { id: 'ring-w', q: -1, r: 0 }, { id: 'ring-s', q: 0, r: 1 }], buildings: [], units: [] };
const lienzo = (angle, extra = {}) => ({ width: 640, height: 400, dataset: Object.assign({ angle: String(angle) }, extra) });
const ANGULOS = [0, 60, 137, 300];
const geo = (c) => CP.geometry({ tiles: [{ x: 100 }] }, c);
// unplace(G, m) → the scene point drawn at canvas point m (the inverse of G.at).
const unplace = (G, m) => { const ux = (m[0] - G.cx) / G.k, v = (m[1] - G.cy) / G.k / CP.SQUASH; return [ux * G.cos + v * G.sin, (-ux * G.sin + v * G.cos) * CP.SQUASH]; };

test('a 0°, 60°, 137° y 300° el clic sobre cada ancla dibujada cae en su nodo (también con zoom y pan)', () => {
  for (const a of ANGULOS) {
    for (const extra of [{}, { zoom: '1.7', panx: '-40', pany: '25' }]) {
      const c = lienzo(a, extra);
      for (const n of COLONIA.nodes) {
        const p = CP.anchorOf(c, COLONIA, 0, {}, {}, n.id);
        assert.equal(CP.nodeAt(c, COLONIA, 0, {}, {}, p.x, p.y), n.id, a + '° ' + n.id + ' ' + JSON.stringify(extra));
      }
    }
  }
});

test('el giro es sobre el suelo: a 60°, 120°… cada vecina cae exactamente donde se dibuja otra vecina (el hex sigue siendo hex)', () => {
  const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([q, r]) => HP(q, r));
  assert.equal(CP.SQUASH, Z.SQUASH);
  for (const a of [60, 120, 180, 240, 300]) {
    const G = geo(lienzo(a));
    for (const p of NB) {
      const t = G.turn(p.x, p.y);
      assert.ok(NB.some((q) => Math.abs(q.x - t.x) < 1e-9 && Math.abs(q.y - t.y) < 1e-9), a + '°: ' + JSON.stringify(t));
    }
  }
  // A 137° no hay vecina exacta, pero la distancia en el suelo se conserva.
  const G = geo(lienzo(137)), g = (p) => Math.hypot(p.x, p.y / CP.SQUASH);
  for (const p of NB) { assert.ok(Math.abs(g(G.turn(p.x, p.y)) - g(p)) < 1e-9); }
});

test('sin ángulo declarado la colocación es la de siempre; el ángulo se guarda en grados enteros normalizados', () => {
  const sin = { width: 640, height: 400, dataset: {} };
  assert.deepEqual(CP.anchorOf(sin, COLONIA, 0, {}, {}, 'ring-s'), CP.anchorOf(lienzo(0), COLONIA, 0, {}, {}, 'ring-s'));
  assert.deepEqual([geo(lienzo(-60)).angle, geo(lienzo(420)).angle, geo(lienzo(59.6)).angle], [300, 60, 60]);
});

test('el pintor reordena el suelo por la profundidad GIRADA (atrás → delante) y a 0° conserva su orden', () => {
  const dir = new URL('../public/map/chunks/', import.meta.url);
  const chunks = Object.fromEntries(readdirSync(dir).map((f) => { const c = JSON.parse(readFileSync(new URL(f, dir), 'utf8')); return [c.c.join('_'), c]; }));
  const cells = MP.cellsOf(chunks);
  assert.equal(MP.orderAt(cells, geo(lienzo(0))), cells.list);
  for (const a of [60, 137, 300]) {
    const G = geo(lienzo(a)), lista = MP.orderAt(cells, G);
    assert.equal(lista.length, cells.list.length);
    for (let i = 1; i < lista.length; i++) {
      const p = HP(lista[i - 1][0], lista[i - 1][1]), q = HP(lista[i][0], lista[i][1]);
      assert.ok(G.turn(p.x, p.y).y <= G.turn(q.x, q.y).y + 1e-9, a + '°: celda ' + i + ' fuera de orden');
    }
  }
});

test('las capas de la colonia se dibujan por su profundidad girada', () => {
  const g = new Proxy({}, { get: (o, k) => k in o ? o[k] : () => ({}), set: (o, k, v) => { o[k] = v; return true; } });
  globalThis.AtlasBubble = { compile: (f) => f }; globalThis.AtlasComicAtoms = { paint: () => {} };
  for (const a of [0, 137, 300]) {
    const c = lienzo(a); c.getContext = () => g;
    const sc = CP.draw(c, COLONIA, 0, true, {}, {}, null), G = CP.geometry(sc, c);
    const pos = Object.fromEntries(sc.tiles.map((n, i) => ['tile-' + i, n]).concat(sc.buildings.map((n, i) => ['building-' + i, n]), sc.bots.map((n, i) => ['bot-' + i, n])));
    const ys = sc.order.map((id) => G.turn(pos[id].x, pos[id].y).y);
    assert.equal(ys.length, sc.tiles.length + sc.buildings.length + sc.bots.length);
    for (let i = 1; i < ys.length; i++) { assert.ok(ys[i - 1] <= ys[i] + 1e-9, a + '°: ' + sc.order.join(',')); }
  }
});

test('zoom anclado: el punto bajo el cursor no se mueve al cambiar el zoom, a cualquier ángulo', () => {
  for (const a of ANGULOS) {
    const m = [470, 120], G = geo(lienzo(a, { zoom: '1', panx: '30', pany: '-10' })), s = unplace(G, m);
    const p = Z.zoomAt({ w: 640, h: 400, zoom: 1, panx: 30, pany: -10 }, 2.4, m[0], m[1]);
    const q = geo(lienzo(a, { zoom: '2.4', panx: String(p.panx), pany: String(p.pany) })).at(s[0], s[1]);
    assert.ok(Math.abs(q.x - m[0]) < 1e-6 && Math.abs(q.y - m[1]) < 1e-6, a + '°: ' + JSON.stringify(q));
  }
});

test('girar alrededor de un punto lo deja fijo; el ajuste de 60° salta al siguiente múltiplo', () => {
  const m = [100, 300], s = unplace(geo(lienzo(0, { panx: '12', pany: '7' })), m);
  const p = Z.turnAt({ w: 640, h: 400, zoom: 1, panx: 12, pany: 7 }, 137, m[0], m[1]);
  const q = geo(lienzo(137, { panx: String(p.panx), pany: String(p.pany) })).at(s[0], s[1]);
  assert.ok(Math.abs(q.x - m[0]) < 1e-6 && Math.abs(q.y - m[1]) < 1e-6, JSON.stringify(q));
  assert.deepEqual([Z.snapped(0, 1), Z.snapped(0, -1), Z.snapped(300, 1), Z.snapped(137, 1)], [60, 300, 0, 180]);
});
