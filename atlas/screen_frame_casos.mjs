// La pantalla en una burbuja (preceptoros.bubble/1): lo que ve el carbono en /openworld/ cabe en <1.024 B UTF-8,
// sale igual dos veces, nunca trae undefined (NO_DATA con causa) y, si no cabe, suelta átomos en orden fijo.
// Uso: node --test atlas/screen_frame_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('../public/game/screen_frame.js');

// A minimal stub document: nodes with id, class, role, attributes, text and children; selectors limited to what the
// module asks (by id, by class, by tag, by attribute, and the two descendant forms it uses).
function nodo(tag, o = {}, hijos = []) {
  const n = { tagName: tag.toUpperCase(), id: o.id || '', className: o.cls || '', hidden: !!o.hidden, attrs: o.attrs || {}, children: hijos, parentNode: null, offsetParent: o.hidden ? null : {},
    get textContent() { return (o.text || '') + hijos.map((h) => ' ' + h.textContent).join(''); },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; } };
  hijos.forEach((h) => { h.parentNode = n; });
  n.querySelectorAll = (sel) => buscar(n, sel); n.querySelector = (sel) => buscar(n, sel)[0] || null;
  return n;
}
function bajo(n) { const out = []; (function r(x) { x.children.forEach((h) => { out.push(h); r(h); }); })(n); return out; }
function casa(n, s) {
  if (s.startsWith('#')) return n.id === s.slice(1);
  if (s.startsWith('.')) return n.className.split(' ').includes(s.slice(1));
  const at = [...s.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)], tag = s.replace(/\[.*$/, '');
  if (tag && n.tagName !== tag.toUpperCase()) return false;
  return at.every(([, k, v]) => v === undefined ? k in n.attrs : n.attrs[k] === v);
}
function buscar(raiz, sel) {
  const res = new Set();
  for (const alt of sel.split(',').map((x) => x.trim())) {
    const pasos = alt.split(/\s+/); let actual = [raiz];
    for (const p of pasos) actual = actual.flatMap((a) => bajo(a).filter((x) => casa(x, p)));
    actual.forEach((x) => res.add(x));
  }
  return bajo(raiz).filter((x) => res.has(x));
}
function doc(extra = {}) {
  const body = nodo('body', {}, [
    nodo('div', { id: 'joy' }, [nodo('p', { attrs: { 'aria-live': 'polite' }, text: extra.joy ?? 'terminal: basic · at cabin' })]),
    nodo('section', { id: 'sheet-news', cls: 'sheet', hidden: true }, [nodo('h2', { text: 'News of the map' })]),
    nodo('section', { id: 'sheet-summons', cls: 'sheet', hidden: !extra.summons }, [nodo('h2', { text: 'Summons' }),
      nodo('div', { id: 'visitor-play' }, extra.visit ? [nodo('p', { text: 'Copper 100 · Light 5 · Step 3 · Troops 0' }), nodo('button', { id: 'visitor-hatch-1', text: 'Sign adoption · egg 1' })] : [])]),
    nodo('div', { attrs: { role: 'tablist' } }, ['Map', 'News', 'Summons', 'Army'].map((t, i) => nodo('button', { attrs: { role: 'tab', 'aria-selected': String(extra.summons ? i === 2 : i === 0) }, text: t }))),
    nodo('p', { id: 'state', cls: 'state', attrs: { 'aria-live': 'polite' }, text: extra.state ?? 'Nodes online: 0.' }),
    nodo('p', { id: 'floor-state', cls: 'state', text: 'Map chunks: 7 of 7 around area 0_0. Cabin chunk: 1 water' }),
    nodo('ul', { id: 'log' }, (extra.log || ['The chat is not live yet: NO_DATA until you download the brain.']).map((t) => nodo('li', { text: t }))),
    nodo('p', { id: 'chat-note', cls: 'state', text: 'NO_DATA: no local answer model is connected.' }),
    ...(extra.buttons || []).map((t) => nodo('button', { text: t })),
  ]);
  return { location: { pathname: '/openworld/' }, getElementById: (id) => buscar(body, '#' + id)[0] || null, querySelectorAll: (s) => buscar(body, s) };
}
const env = { AtlasOpenworldView: () => ({ colony: { nodes: [{ id: 'cabin' }], buildings: [{}], units: [] } }) };
const B = (f) => new TextEncoder().encode(JSON.stringify(f)).length;
const sinUndef = (x) => JSON.stringify(x, (k, v) => { assert.notEqual(v, undefined, 'undefined en ' + k); return v; });

test('el marco típico cabe en <1.024 B, dice la cabaña y su campo bytes es la medida real', () => {
  const f = F.read(doc(), env);
  assert.equal(f.schema, 'preceptoros.bubble/1');
  assert.ok(B(f) < 1024, B(f) + ' B'); assert.equal(f.bytes, B(f));
  assert.equal(f.atoms.page, '/openworld/'); assert.equal(f.atoms.area, '0_0'); assert.match(f.atoms.crab, /cabin/);
  assert.equal(f.atoms.colony, 'nodes 1 · buildings 1 · units 0'); assert.equal(f.atoms.tab, 'Map');
  assert.match(f.sentence, /^Screen · \/openworld\/ · Map tab · area 0_0/); assert.equal(f.dropped, 0);
  assert.match(f.atoms.nodata, /no local answer model/);
});

test('la visita se lee: cobre, luz, huevos y paso', () => {
  const f = F.read(doc({ summons: true, visit: true }), env);
  assert.equal(f.atoms.visit, 'copper 100 · light 5 · eggs 1 · step 3'); assert.equal(f.atoms.sheet, 'Summons'); assert.match(f.sentence, /visit copper 100/);
});

test('determinista: el mismo documento da los mismos bytes', () => {
  assert.equal(JSON.stringify(F.read(doc({ visit: true, summons: true }), env)), JSON.stringify(F.read(doc({ visit: true, summons: true }), env)));
});

test('NO_DATA con causa en vez de undefined (sin entorno, sin nada)', () => {
  const vacio = { getElementById: () => null, querySelectorAll: () => [] };
  const f = F.read(vacio, null); sinUndef(f);
  for (const [k, v] of Object.entries(f.atoms)) if (k !== 'nodata') assert.match(v, /^NO_DATA: \S/, k + ' = ' + v);
  sinUndef(F.read(null, null));
});

test('entradas enormes: <1.024 B siempre, y suelta átomos en el orden fijo diciendo cuántos', () => {
  const gordo = 'ñ🦀'.repeat(4000);
  const f = F.read(doc({ joy: gordo, state: gordo, log: [gordo, gordo, gordo], buttons: Array.from({ length: 300 }, (_, i) => gordo + i) }), env);
  assert.ok(B(f) < 1024, B(f) + ' B'); assert.equal(f.bytes, B(f)); sinUndef(f);
  assert.ok(F.read(doc(), env, 99999).bytes < 1024, 'un límite mayor no se concede');
});

test('si no cabe, suelta átomos en el orden fijo y dice cuántos (límite pedido de 600 B)', () => {
  const gordo = 'ñ🦀'.repeat(4000);
  const f = F.read(doc({ joy: gordo, state: gordo, log: [gordo, gordo, gordo], buttons: Array.from({ length: 300 }, (_, i) => gordo + i) }), env, 600);
  assert.ok(B(f) <= 600, B(f) + ' B'); sinUndef(f);
  assert.ok(f.dropped > 0, 'no soltó nada');
  const soltados = F.DROP_ORDER.slice(0, f.dropped), quedan = F.DROP_ORDER.slice(f.dropped);
  soltados.forEach((k) => assert.ok(!(k in f.atoms), k + ' debía caer'));
  quedan.forEach((k) => assert.ok(k in f.atoms, k + ' no debía caer'));
  assert.deepEqual(soltados.slice(0, 2), ['log', 'buttons']);
});
