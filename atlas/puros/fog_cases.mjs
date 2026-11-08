// Fog of war cases (I4, edificio Hostel). Offline, synthetic. Measures public/game/fog_of_war.js without changing it.
// Run: node --test atlas/puros/fog_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';

const require = createRequire(import.meta.url);
const K = require('../../public/game/canon.js');
const N = require('../../public/game/fog_of_war.js');
const SRC = new URL('../../public/game/fog_of_war.js', import.meta.url);
const PUB = K.sha('fog-test-account');

// Node with k MEDIDO measures on the Hexelion node (the only one with a map point).
const nodo = (k, nombre = 'nodo.0.hexelion') => ({
  nodo: nombre,
  aparato: { medidas: Object.fromEntries(Array.from({ length: k }, (_, i) => ['m' + i, { estado: 'MEDIDO' }])) },
});
const estado = (k) => ({ pub: PUB, sha: K.sha, nodos: [nodo(k)] });
const grid = (n = 21, paso = 100) => {
  const pts = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) pts.push({ x: (i - (n - 1) / 2) * paso, y: (j - (n - 1) / 2) * paso });
  return pts;
};

test('the fog is never empty: anclas of an empty state keep the Hexelion echo', () => {
  const a = N.anclas({});
  assert.ok(a.length >= 1, 'anclas({}) returned ' + a.length);
  assert.ok(a.some((x) => x.id === 'eco:hexelion'), 'eco:hexelion missing');
});

test('the fog is never empty: clearings of an empty state (measured: 0 circles)', { todo: 'fog_empty_when_no_data' }, () => {
  const c = N.despejado({ nodos: [], lugares: [] });
  assert.ok(c.length >= 1, 'despejado({nodos:[],lugares:[]}) returned ' + c.length + ' circles');
});

test('niebla stays inside 0..1 on a 21x21 grid, with and without circles', () => {
  const c = N.despejado(estado(3));
  for (const circ of [c, [], [{ x: 0, y: 0, r: 0 }]]) {
    for (const p of grid()) {
      const v = N.niebla(p.x, p.y, circ);
      assert.ok(v >= 0 && v <= 1, `out of range at ${p.x},${p.y}: ${v}`);
    }
  }
});

test('centre of a clearing is clearer than far from every clearing', () => {
  const c = N.despejado(estado(1));
  const dentro = N.niebla(0, 0, c), lejos = N.niebla(5000, 5000, c);
  assert.equal(dentro, 0);
  assert.equal(lejos, 1);
  assert.ok(dentro < lejos);
});

test('huella is deterministic: same state, same string', () => {
  const a = N.huella(N.despejado(estado(2))), b = N.huella(N.despejado(estado(2)));
  assert.equal(a, b);
  assert.ok(a.length > 0);
});

test('huella differs for different states', () => {
  assert.notEqual(N.huella(N.despejado(estado(1))), N.huella(N.despejado(estado(3))));
  assert.notEqual(N.huella(N.despejado(estado(1))), N.huella(N.despejado({ pub: K.sha('other-account'), sha: K.sha, nodos: [] })));
});

test('more MEDIDO measures clear a radius that is not smaller', () => {
  const r1 = N.despejado(estado(1)).find((c) => c.que === 'nodo.0.hexelion').r;
  const r3 = N.despejado(estado(3)).find((c) => c.que === 'nodo.0.hexelion').r;
  assert.equal(r1, 540);
  assert.equal(r3, 860);
  assert.ok(r3 >= r1);
});

test('sitioNodo: Hexelion has a point, another node has none', () => {
  assert.notEqual(N.sitioNodo('nodo.0.hexelion'), null);
  assert.equal(N.sitioNodo('nodo.1.example'), null);
});

test('source has no Math.random, no Date.now, and weighs at most 16384 B', () => {
  const src = readFileSync(SRC, 'utf8');
  assert.ok(!src.includes('Math.random'), 'Math.random found');
  assert.ok(!src.includes('Date.now'), 'Date.now found');
  assert.ok(statSync(SRC).size <= 16384, 'size ' + statSync(SRC).size);
});
