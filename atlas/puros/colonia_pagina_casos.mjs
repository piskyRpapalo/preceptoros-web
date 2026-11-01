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
const COPIAS = [['openworld_state.js', 'openworld_state.js'], ['colony_state.js', 'colony_state.js'], ['hex_projection.js', 'hex_projection.js'], ['colonia_edificios.js', 'colonia_edificios.js'], ['paleta_ciclo.js', 'palette_cycle.js'], ['state_frames.js', 'state_frames.js']];
const sha = (ruta) => createHash('sha256').update(readFileSync(new URL(ruta, import.meta.url))).digest('hex');

// The page reads its modules from the browser globals; in node they are provided the same way.
globalThis.AtlasStateFrames = require('./state_frames.js');
globalThis.HexProjection = require('./hex_projection.js');
globalThis.AtlasColonyState = require('../../public/game/colony_state.js');
globalThis.AtlasEdificios = require('../../public/game/colonia_edificios.js');
globalThis.AtlasPaletteCycle = require('../../public/game/palette_cycle.js');
const CP = require('../../public/game/colonia_pagina.js');
const OS = require('../../public/game/openworld_state.js');
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

test('the page draws the colony: one tile per node, one bot with a face per live node, the sky of its tick', () => {
  const sc = CP.scene(COLONIA, 120, false);
  assert.equal(sc.tiles.length, 3);
  assert.equal(sc.buildings.length, 2);
  assert.equal(sc.bots.length, 3, 'one bot per live node (IC7-S3), not per building');
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

test('IC7-S3: a node that the state does not declare alive gets no bot and no tile (D7)', () => {
  const estado = { esquema: OS.V2, colonia: { nodes: [
    { id: 'beelink', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-10-30' },
    { id: 'doggee-a', q: 1, r: 0, alive: false, seal: 'LIVE', since: '2026-10-30' },
    { id: 'doggee-b', q: -1, r: 0, alive: true, seal: 'NO_DATA', since: null }
  ], buildings: [{ id: 'b1', node: 'beelink' }, { id: 'b2', node: 'doggee-a' }], units: [] } };
  const sc = CP.scene(OS.leer(estado).colonia, 0, false);
  assert.deepEqual(sc.bots.map((b) => b.id), ['bot-beelink']);
  assert.deepEqual(sc.tiles.map((t) => t.id), ['beelink']);
});

test('IC7-S4 (D11): a zombie bot has its own face and body family, and says so in its sentence', () => {
  const z = CP.botFrame({ id: 'doggee-a', look: 'zombie' }, 0, false);
  const b = CP.botFrame({ id: 'doggee-a', look: 'basic' }, 0, false);
  assert.match(z.atoms[0].r, /zombie face/);
  assert.match(b.atoms[0].r, /basic face/);
  assert.notEqual(JSON.stringify(z.atoms[0].i), JSON.stringify(b.atoms[0].i));
  assert.deepEqual(F.valida(z), []);
});

test('IC7-S4: scene passes the looks of the state to each bot', () => {
  const sc = CP.scene(COLONIA, 0, false, { 'ring-e': 'zombie' });
  const bot = sc.bots.find((x) => x.id === 'bot-ring-e');
  assert.match(bot.frame.atoms[0].r, /zombie face/);
});

test('HUECO 1 + 2: every bot and building sentence says its seal; a missing seal says NO_DATA, never LIVE', () => {
  const sc = CP.scene(COLONIA, 0, false, {}, { 'ring-e': 'LIVE' });
  const texts = CP.frases(sc);
  assert.equal(texts.length, sc.bots.length + sc.buildings.length, 'one sentence per bot and per building');
  assert.ok(texts.some((t) => /bot of ring-e .*seal LIVE/.test(t)));
  assert.ok(texts.some((t) => /bot of cabin .*seal NO_DATA/.test(t)), 'no seal given: NO_DATA');
  assert.ok(texts.some((t) => /building b-ring-e on ring-e .*seal LIVE/.test(t)));
});

test('TA-3 (D15): the ephemeral walker has its own sentence, seal NO_DATA, and passes the frame law', () => {
  const frame = CP.youFrame({ node: 'cabin', q: 0, r: 0 }, 6, false);
  assert.equal(frame.seal, 'NO_DATA');
  assert.match(frame.atoms[0].r, /ephemeral walker on node cabin .* seal NO_DATA/);
  assert.deepEqual(F.valida(frame), []);
});

test('H1b: with the ephemeral crab loaded, the visitor is drawn as the crab (sea class), under the frame law', () => {
  const sin = CP.youFrame({ node: 'cabin', q: 0, r: 0 }, 6, false);
  globalThis.AtlasCrab = require('../../public/game/gdpr-art25-ephemeral-crab.js');
  try {
    const frame = CP.youFrame({ node: 'cabin', q: 0, r: 0 }, 6, false);
    assert.match(frame.atoms[0].r, /ephemeral crab \(sea\) on node cabin .* seal NO_DATA/, 'colour plus text: the sentence names the crab');
    const pts = frame.atoms[0].i[0].pts;
    assert.equal(pts.length, 24);
    assert.ok(pts.every((p) => Number.isInteger(p[0]) && Number.isInteger(p[1])), 'integer points');
    assert.notDeepEqual(pts, sin.atoms[0].i[0].pts, 'the outline is the crab, not the old ring');
    assert.deepEqual(F.valida(frame), []);
    assert.ok(Buffer.byteLength(JSON.stringify(frame)) < 1024, 'frame under 1 KB');
    assert.deepEqual(CP.youFrame({ node: 'cabin', q: 0, r: 0 }, 6, false), frame, 'deterministic');
  } finally { delete globalThis.AtlasCrab; }
});
