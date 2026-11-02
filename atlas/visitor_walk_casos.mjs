// Caminar libre (public/game/visitor_walk.js): el cangrejo de la visita anda celda a celda por el suelo horneado.
// Rechaza agua, keepout y fuera del mapa con su causa; acepta suelo; seis direcciones; determinista.
// Uso: node --test atlas/visitor_walk_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const V = req('../public/game/visitor_walk.js');
const M = req('../public/game/map_painter.js');
const dir = new URL('../public/map/chunks/', import.meta.url);
const chunks = Object.fromEntries(readdirSync(dir).map((f) => { const c = JSON.parse(readFileSync(new URL(f, dir), 'utf8')); return [c.c.join('_'), c]; }));
const cells = M.cellsOf(chunks);

test('acepta suelo: seis pasos al este desde la cabaña, cada uno dicho en inglés', () => {
  const w = V.create(cells);
  let s;
  for (let i = 1; i <= 6; i++) { s = w.step('east'); assert.equal(s.ok, true); assert.equal(s.q, i); }
  assert.equal(s.sentence, 'You walk east to 6,0 · moss · step 6');
  assert.equal(s.h, 2);
});

test('rechaza el agua y no se mueve', () => {
  const w = V.create(cells, [6, 0]);
  const s = w.step('east');
  assert.equal(s.ok, false); assert.equal(s.q, 6);
  assert.equal(s.sentence, 'NO_DATA: water blocks the way east');
});

test('rechaza keepout y fuera de las celdas cargadas', () => {
  const w = V.create({ at: { '0,0': [0, 0, 1, 'floor'], '1,0': [1, 0, 1, 'keepout'] } });
  assert.equal(w.step('east').sentence, 'NO_DATA: a keepout cell blocks the way east');
  assert.equal(w.step('west').sentence, 'NO_DATA: the map ends the way west');
  assert.equal(w.step('up').ok, false);
  assert.deepEqual([w.here().q, w.here().r], [0, 0]);
});

test('seis direcciones: cada una mueve al vecino axial correcto', () => {
  const at = {}; for (let q = -1; q <= 1; q++) for (let r = -1; r <= 1; r++) at[q + ',' + r] = [q, r, 1, 'floor'];
  const want = { east: [1, 0], west: [-1, 0], 'north-east': [1, -1], 'north-west': [0, -1], 'south-east': [0, 1], 'south-west': [-1, 1] };
  for (const [d, v] of Object.entries(want)) { const s = V.create({ at }).step(d); assert.equal(s.ok, true, d); assert.deepEqual([s.q, s.r], v, d); }
});

test('determinista y sin azar ni reloj', () => {
  const run = () => { const w = V.create(cells); return ['north-east', 'north-east', 'east', 'south-west', 'west'].map((d) => w.step(d).sentence); };
  assert.deepEqual(run(), run());
  const src = readFileSync(new URL('../public/game/visitor_walk.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/Math\.random|Date\.now|new Date|performance\.now|fetch\(/.test(src));
});
