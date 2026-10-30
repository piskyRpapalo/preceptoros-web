// Cases of the optional frame seal (IC7 seal contract, odd/tasks/frame-seal-contract.md, SEAL-2 and SEAL-4).
// A frame may carry a top-level `seal` of the six doctrine labels; absent means the frame declares none.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { checkFrame } = await import('./param_gate.mjs');

const base = () => ({ v: 'preceptoros.bubble/1', id: 'x', t: 0, cv: [120, 110],
  atoms: [{ k: 'k', r: 'a sentence', i: [{ o: 'ribbon', pts: [[1, 1], [50, 1], [50, 50]], closed: true, f: 'paper', s: 'ink', lw: 2 }] }],
  bands: ['paper', 'ink', 'cyan'], change: ['a sentence'], sound: 'NO_DATA', soundCause: 'no waves' });

for (const seal of ['LIVE', 'STALE', 'STATIC', 'SIMULATED', 'NO_DATA', 'ERROR']) {
  test(`a frame with seal ${seal} passes the contract`, () => {
    const f = { ...base(), seal };
    assert.equal(checkFrame(f).ok, true, JSON.stringify(checkFrame(f).causes));
  });
}

test('a frame with no seal passes: absent means no declared seal', () => {
  assert.equal(checkFrame(base()).ok, true);
});

test('sabotage: a seal outside the six labels is refused', () => {
  const r = checkFrame({ ...base(), seal: 'PROBABLE' });
  assert.equal(r.ok, false);
  assert.ok(r.causes.some((c) => /seal outside the doctrine labels/.test(c)));
});

test('sabotage: a seal written as a colour is refused, never shown as a colour', () => {
  assert.equal(checkFrame({ ...base(), seal: '#17131f' }).ok, false);
});

test('sabotage: a lower-case seal is refused, the labels are exact', () => {
  assert.equal(checkFrame({ ...base(), seal: 'live' }).ok, false);
});

// SEAL-4: colony frames (bots and buildings) carry the seal of their node, and pass the contract.
globalThis.AtlasStateFrames = require('../public/game/state_frames.js');
globalThis.HexProjection = require('../public/game/hex_projection.js');
globalThis.AtlasColonyState = require('../public/game/colony_state.js');
globalThis.AtlasEdificios = require('../public/game/colonia_edificios.js');
globalThis.AtlasPaletteCycle = require('../public/game/palette_cycle.js');
const CP = require('../public/game/colonia_pagina.js');
const COLONIA = { nodes: [{ id: 'beelink', q: 0, r: 0 }, { id: 'doggee-a', q: 2, r: 0 }], buildings: [{ id: 'b1', node: 'beelink' }], units: [] };

test('a colony bot and building carry the seal of their node and pass the contract', () => {
  const sc = CP.scene(COLONIA, 0, false, {}, { beelink: 'LIVE', 'doggee-a': 'STALE' });
  const frames = sc.bots.map((b) => b.frame).concat(sc.buildings.map((b) => b.frame));
  for (const f of frames) assert.equal(checkFrame(f).ok, true, f.id + ' ' + JSON.stringify(checkFrame(f).causes));
  assert.equal(sc.bots.find((b) => b.id === 'bot-doggee-a').frame.seal, 'STALE');
  assert.equal(sc.buildings.find((b) => b.id === 'b1').frame.seal, 'LIVE');
});

test('sabotage: a colony node with no seal shows NO_DATA, never LIVE', () => {
  const sc = CP.scene(COLONIA, 0, false, {}, {});
  assert.ok(sc.bots.every((b) => b.frame.seal === 'NO_DATA'));
});
