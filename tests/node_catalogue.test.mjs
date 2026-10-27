// North N3 (2026-10-26): the public catalogue shows each node's state and cause, never a device key and never a test
// node. A row with any field beyond the five rejects the whole answer. Rows are the worker's shape (aduana catalogo).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url), C = require('../public/game/node_catalogue.js');
const fila = (nodo, over = {}) => ({ nodo, estado: 'pendiente', causa: 'ancla_ausente', recibido: '2026-10-26T23:00:00.000Z', recibo_sha256: 'ab'.repeat(32), ...over });
const cat = (cedulas) => ({ esquema: 'preceptoros.catalogo-cedulas/1', solo_lectura: true, nota: 'pendiente = no verificada', cedulas });

test('N3 · a valid catalogue is read: pending with its cause, verified with no cause', () => {
  const l = C.lee(cat([fila('nodo.5.vecino'), fila('nodo.7.otro', { estado: 'verificado', causa: null })]));
  assert.equal(l.ok, true); assert.equal(l.filas.length, 2); assert.equal(l.descartadas, 0);
});

test('N3 · a row carrying a device key (or any sixth field) rejects the whole catalogue', () => {
  for (const extra of [{ dispositivos: [{ clave: 'cd'.repeat(32) }] }, { clave: 'cd'.repeat(32) }, { admin_sha256: 'ef'.repeat(32) }]) {
    const l = C.lee(cat([fila('nodo.5.vecino'), fila('nodo.6.malo', extra)]));
    assert.equal(l.ok, false); assert.equal(l.code, 'fields');
  }
});

test('N3 · test nodes are never listed (second fence after the worker)', () => {
  const l = C.lee(cat([fila('nodo.9101.claude-test', { causa: 'cuenta_de_prueba' }), fila('nodo.5.claude-test'), fila('nodo.5.vecino')]));
  assert.deepEqual(l.filas.map((r) => r.nodo), ['nodo.5.vecino']); assert.equal(l.descartadas, 2);
});

test('N3 · wrong schema, not read-only, a verified row with a cause, a bad hash or date are rejected', () => {
  assert.equal(C.lee({ ...cat([]), esquema: 'otro' }).ok, false);
  assert.equal(C.lee({ ...cat([]), solo_lectura: false }).ok, false);
  assert.equal(C.lee(cat([fila('nodo.5.v', { estado: 'verificado' })])).code, 'cause');
  assert.equal(C.lee(cat([fila('nodo.5.v', { recibo_sha256: 'zz' })])).code, 'shape');
  assert.equal(C.lee(cat([fila('nodo.5.v', { recibido: 'ayer' })])).code, 'shape');
});

test('N3 · rendering uses text, so hostile values are never markup', () => {
  const el = (t) => ({ tag: t, children: [], textContent: '', appendChild(c) { this.children.push(c); } });
  const doc = { createElement: el }, tbody = el('tbody');
  C.pinta(tbody, [fila('nodo.5.vecino', { causa: '<img src=x onerror=alert(1)>' })], doc);
  const textos = tbody.children[0].children.map((td) => td.textContent);
  assert.ok(textos.includes('<img src=x onerror=alert(1)>')); assert.equal(tbody.children[0].children.some((td) => 'innerHTML' in td), false);
});
