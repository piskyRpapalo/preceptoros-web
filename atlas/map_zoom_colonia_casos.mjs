// H1b · zoom de la colonia: el factor de map_zoom.js (canvas.dataset.zoom) escala la ÚNICA colocación (geometry de
// colonia_pagina.js), así que el ancla dibujada y la prueba de clic leen lo mismo a cualquier zoom.
// Uso: node --test atlas/map_zoom_colonia_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// The page reads its modules from the browser globals; in node they are provided the same way (as atlas/puros/colonia_pagina_casos.mjs).
globalThis.AtlasStateFrames = require('./puros/state_frames.js');
globalThis.HexProjection = require('./puros/hex_projection.js');
globalThis.AtlasColonyState = require('../public/game/colony_state.js');
globalThis.AtlasEdificios = require('../public/game/colonia_edificios.js');
globalThis.AtlasPaletteCycle = require('../public/game/palette_cycle.js');
const CP = require('../public/game/colonia_pagina.js');
const Z = require('../public/game/map_zoom.js');

const COLONIA = { nodes: [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }, { id: 'ring-w', q: -1, r: 0 }], buildings: [], units: [] };
const lienzo = (zoom) => ({ width: 640, height: 400, dataset: zoom === undefined ? {} : { zoom: String(zoom) } });

test('sin zoom declarado, la colocación es la de siempre (factor 1)', () => {
  assert.deepEqual(CP.anchorOf(lienzo(), COLONIA, 0, {}, {}, 'ring-e'), CP.anchorOf(lienzo(1), COLONIA, 0, {}, {}, 'ring-e'));
});

test('zoom 2 duplica la distancia de un nodo al centro', () => {
  const c = lienzo(1), a1 = CP.anchorOf(c, COLONIA, 0, {}, {}, 'ring-e'), a2 = CP.anchorOf(lienzo(2), COLONIA, 0, {}, {}, 'ring-e');
  const cx = c.width / 2, cy = c.height / 2;
  assert.ok(Math.abs((a2.x - cx) - 2 * (a1.x - cx)) < 1e-9 && Math.abs((a2.y - cy) - 2 * (a1.y - cy)) < 1e-9);
});

test('a cualquier zoom, el clic sobre el ancla dibujada cae en su nodo', () => {
  for (const z of [Z.MIN, 1, 1.7, Z.MAX]) {
    const c = lienzo(z), a = CP.anchorOf(c, COLONIA, 0, {}, {}, 'ring-w');
    assert.equal(CP.nodeAt(c, COLONIA, 0, {}, {}, a.x, a.y), 'ring-w', 'zoom ' + z);
  }
});
