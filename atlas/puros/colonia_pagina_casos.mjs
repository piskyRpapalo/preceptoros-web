// Cases for the colony page of /openworld/ (ODD isometric-colony, IC6). The served copies under public/game must be the
// same files as the sources under atlas/puros; the page refuses an invalid colony; a bot obeys the frame law; no random
// number, no clock and no network enter the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);

// [source under atlas/puros, copy under public/game]: the source keeps the name the IC5 gate already cites.
const COPIAS = [['colony_state.js', 'colony_state.js'], ['hex_projection.js', 'hex_projection.js'], ['colonia_edificios.js', 'colonia_edificios.js'], ['paleta_ciclo.js', 'palette_cycle.js'], ['state_frames.js', 'state_frames.js']];
const sha = (ruta) => createHash('sha256').update(readFileSync(new URL(ruta, import.meta.url))).digest('hex');

// The page reads its modules from the browser globals; in node they are provided the same way.
globalThis.AtlasStateFrames = require('./state_frames.js');
globalThis.HexProjection = require('./hex_projection.js');
globalThis.AtlasColonyState = require('../../public/game/colony_state.js');
globalThis.AtlasEdificios = require('../../public/game/colonia_edificios.js');
globalThis.AtlasPaletteCycle = require('../../public/game/palette_cycle.js');
const CP = require('../../public/game/colonia_pagina.js');
const F = require('./state_frames.js');

const COLONIA = {
  nodes: [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }, { id: 'ring-w', q: -1, r: 0 }],
  buildings: [{ id: 'b-cabin', node: 'cabin' }, { id: 'b-ring-e', node: 'ring-e' }],
  units: []
};

test('the served copies under public/game are the same files as the sources under atlas/puros', () => {
  for (const [fuente, copia] of COPIAS) {
    assert.equal(sha('../puros/' + fuente), sha('../../public/game/' + copia), fuente + ' must match its served copy');
  }
});

test('the page draws the colony: one tile per node, one bot with a face per building, the sky of its tick', () => {
  const sc = CP.scene(COLONIA, 120, false);
  assert.equal(sc.tiles.length, 3);
  assert.equal(sc.buildings.length, 2);
  assert.equal(sc.bots.length, 2, 'one bot per building');
  assert.equal(sc.cielo, '#f4ebd0', 'tick 120 is the day sky');
});

test('an invalid colony is refused, never drawn: no invented row', () => {
  assert.throws(() => CP.scene({ nodes: [], buildings: [] }, 0, false));
  assert.throws(() => CP.scene({ nodes: [{ id: 'a', q: 0, r: 0 }], buildings: [{ id: 'b', node: 'ghost' }], units: [] }, 0, false));
});

test('a bot obeys the frame law: under 1,024 bytes, a sentence, a declared sound; it bobs by whole steps only', () => {
  for (let t = 0; t < 8; t++) {
    const f = CP.botFrame({ id: 'cabin' }, t, false);
    assert.deepEqual(F.valida(f), [], 'tick ' + t);
    assert.ok(new TextEncoder().encode(JSON.stringify(f)).length < 1024);
    assert.match(f.sound, /^NO_DATA: /);
  }
});

test('reduced motion: the bot stands still, its frame is the same at every tick', () => {
  const a = JSON.stringify(CP.botFrame({ id: 'cabin' }, 0, true).atoms[0].i);
  const b = JSON.stringify(CP.botFrame({ id: 'cabin' }, 3, true).atoms[0].i);
  assert.equal(a, b);
});

test('the page reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('../../public/game/colonia_pagina.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
