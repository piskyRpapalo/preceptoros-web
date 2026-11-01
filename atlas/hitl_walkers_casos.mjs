// P5a · el «?» HITL y los caminantes deterministas (plan 2.5D, F4). Casos puros en node.
// Uso: node --test atlas/hitl_walkers_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HW = require('../public/game/hitl_walkers.js');
const OS = require('../public/game/openworld_state.js');
const FIX = JSON.parse(readFileSync(new URL('./fixtures/hitl_estado.json', import.meta.url), 'utf8'));
const NODES = [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }, { id: 'far', q: 2, r: 0 }, { id: 'lost', q: 5, r: 5 }];
const SEALS = { cabin: 'LIVE', 'ring-e': 'LIVE', far: 'STALE', lost: 'LIVE' };
const bytes = (f) => Buffer.byteLength(JSON.stringify(f), 'utf8');

test('el estado lleva pending por nodo visible; el estado por defecto no lleva ninguno', () => {
  assert.deepEqual(OS.leer(FIX).pending, { cabin: 'P5a tutorial signature' });
  assert.deepEqual(OS.leer(JSON.parse(readFileSync(new URL('../public/openworld/estado.json', import.meta.url), 'utf8'))).pending, {});
  const malo = JSON.parse(JSON.stringify(FIX)); malo.colonia.nodes[1].pending = 7;
  assert.throws(() => OS.leer(malo), /malformed pending/);
});

test('pendingOf: solo los nodos visibles con pieza, en orden de nodo', () => {
  assert.deepEqual(HW.pendingOf({ nodes: NODES }, { far: 'P9', cabin: 'P1', ghost: 'P0' }), [{ id: 'cabin', piece: 'P1' }, { id: 'far', piece: 'P9' }]);
});

test('la pose es función pura de (semilla, tick): misma entrada, misma pose; sin Math.random ni Date', () => {
  const src = readFileSync(new URL('../public/game/hitl_walkers.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|Date\.now|new Date/.test(src));
  for (let t = 0; t < 60; t++) { assert.deepEqual(HW.walkerAt(NODES, SEALS, {}, 'far', 's', t, false), HW.walkerAt(NODES, SEALS, {}, 'far', 's', t, false)); }
});

test('el caminante va de la cabaña a su parcela por la ruta visible y llega', () => {
  const seen = new Set(); let last = null;
  for (let t = 0; t < 80; t++) {
    last = HW.walkerAt(NODES, SEALS, {}, 'far', 's', t, false);
    if (last.state === 'walking') { seen.add(last.node + '>' + last.to); assert.ok(last.fraction >= 0 && last.fraction < 1); }
  }
  assert.deepEqual([...seen], ['cabin>ring-e', 'ring-e>far']);
  assert.equal(last.state, 'building'); assert.equal(last.node, 'far');
});

test('estados: needs-you al llegar con firma pendiente; NO_DATA sin ruta, con causa', () => {
  assert.equal(HW.walkerAt(NODES, SEALS, { far: 'P5a' }, 'far', 's', 999, false).state, 'needs-you');
  const n = HW.walkerAt(NODES, SEALS, {}, 'lost', 's', 999, false);
  assert.equal(n.state, 'NO_DATA'); assert.match(n.cause, /^NO_DATA/); assert.match(HW.sentence(n), /NO_DATA/);
});

test('movimiento reducido: salta a su parada final y el registro narra las paradas', () => {
  const w = HW.walkerAt(NODES, SEALS, {}, 'far', 's', 0, true);
  assert.equal(w.fraction, 0); assert.equal(w.node, 'far');
  assert.match(HW.sentence(w, true), /stops cabin → ring-e → far \(jumped, reduced motion\)/);
});

test('taxonomía: cada estado con forma y texto distintos (nunca solo color)', () => {
  const st = Object.values(HW.STATES);
  assert.equal(new Set(st.map((s) => s.shape)).size, 4);
  assert.equal(new Set(st.map((s) => s.text)).size, 4);
  st.forEach((s) => assert.ok(HW.SHAPES[s.shape]));
});

test('cada gráfico nuevo es un frame burbuja < 1024 B que se nombra en texto', () => {
  const w = (state) => HW.walkerFrame({ id: 'doggee-b', node: 'cabin', to: null, state, path: ['cabin', 'doggee-b'], cause: 'NO_DATA: x' }, 3);
  const frames = [HW.markerFrame('cabin', 'P5a tutorial signature', 3)].concat(['walking', 'building', 'needs-you', 'NO_DATA'].map(w));
  frames.forEach((f) => { assert.ok(bytes(f) < 1024, f.id + ' ' + bytes(f)); assert.ok(f.atoms[0].r.length > 10); assert.equal(f.v, 'preceptoros.bubble/1'); });
  assert.match(frames[0].atoms[0].r, /needs you: P5a tutorial signature/);
});
