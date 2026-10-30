// Cases for buildings and birth growth (ODD isometric-colony, IC4). Every module and building is a frame born from the
// colony state; growth runs in PASOS steps; reduced motion arrives whole in one scene; nothing reads a random number or a clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const colony = require('./colony_state.js');
const E = require('./colonia_edificios.js');
const F = require('./state_frames.js');

const COLONIA = colony({
  nodes: [{ id: 'cabin', q: 0, r: 0 }, { id: 'atlantis', q: -2, r: 1 }, { id: 'risen', q: 2, r: -1 }],
  buildings: [{ id: 'b-cabin', node: 'cabin' }, { id: 'b-risen', node: 'risen' }],
  units: []
});

test('every node is a module tile, every building a frame; the scene is placed on the hex projection', () => {
  const s = E.scene(COLONIA, 1, false);
  assert.deepEqual(s.tiles.map((t) => t.id), ['cabin', 'atlantis', 'risen']);
  assert.deepEqual(s.buildings.map((b) => b.id).sort(), ['b-cabin', 'b-risen']);
  const risen = s.tiles.find((t) => t.id === 'risen');
  assert.equal(risen.x, 192, 'projection x = 48q, scaled by 2');
  assert.equal(risen.y, 0, 'projection y = 12q + 24r, here 0');
});

test('a module keeps its colour from the id: the same colour in every run and every scene', () => {
  const a = E.scene(COLONIA, 1, false).tiles.map((t) => t.color);
  const b = E.scene(COLONIA, 0.5, false).tiles.map((t) => t.color);
  assert.deepEqual(a, b);
  for (const c of a) assert.ok(E.MODULOS.includes(c), 'the colour is one of the house bands');
});

test('a building shape comes from its id, one of the three forms, and all three appear across ids', () => {
  const formas = new Set(Array.from({ length: 40 }, (_, i) => E.formaDe('b-' + i)));
  assert.deepEqual([...formas].sort(), [...E.FORMAS].sort());
});

test('every frame obeys the law: under 1,024 bytes, a sentence on each atom, a declared sound', () => {
  for (const sc of E.nacimiento(COLONIA)) {
    for (const f of [...sc.tiles.map((t) => t.frame), ...sc.buildings.map((b) => b.frame)]) {
      assert.deepEqual(F.valida(f), [], `frame ${f.id} obeys the law`);
      assert.ok(new TextEncoder().encode(JSON.stringify(f)).length < 1024);
    }
  }
});

test('birth growth runs in PASOS steps, the last one whole', () => {
  const seq = E.nacimiento(COLONIA);
  assert.equal(seq.length, E.PASOS);
  assert.deepEqual(seq.map((s) => s.paso), [1, 2, 3, 4, 5, 6]);
  assert.equal(seq[seq.length - 1].p, 1);
});

test('reduced motion arrives in one step: the building is whole at once', () => {
  const seq = E.nacimiento(COLONIA, true);
  assert.equal(seq.length, 1);
  assert.equal(seq[0].p, 1);
  assert.equal(seq[0].paso, E.PASOS);
});

test('the growth progress is clamped to 0-1, and a missing progress is whole', () => {
  assert.equal(E.scene(COLONIA, -1, false).p, 0);
  assert.equal(E.scene(COLONIA, 9, false).p, 1);
  assert.equal(E.scene(COLONIA, NaN, false).p, 1);
  assert.equal(E.scene(COLONIA).p, 1);
});

test('the buildings are drawn back to front: a lower one comes after a higher one', () => {
  const ys = E.scene(COLONIA, 1, false).buildings.map((b) => b.y);
  assert.deepEqual(ys, [...ys].sort((a, b) => a - b));
});

test('the same colony gives byte-identical scenes, two runs', () => {
  assert.equal(JSON.stringify(E.scene(COLONIA, 0.5, false)), JSON.stringify(E.scene(COLONIA, 0.5, false)));
});

test('sabotage: a building on a node that is not in the colony is refused', () => {
  const rota = { nodes: COLONIA.nodes, buildings: [{ id: 'b-ghost', node: 'ghost' }], units: [] };
  assert.throws(() => E.scene(rota, 1, false), /unknown node/);
});

test('sabotage: a scene without a colony is refused, not drawn empty', () => {
  assert.throws(() => E.scene(null, 1, false), /a colony with nodes and buildings is required/);
  assert.throws(() => E.scene({ nodes: [] }, 1, false), /a colony with nodes and buildings is required/);
});

test('the buildings and modules read no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./colonia_edificios.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
