// 6B-1: el toque informa antes de actuar; ficha, coordenada y acciones del mismo lugar.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../public/game/', import.meta.url);
const S = { Promise, console, Math, calls: [], AtlasArrecife: { COSTE: 8, mira: (_t, p) => { S.calls.push(['look', p]); return { id: 'vista-1' }; } } };
vm.createContext(S);
for (const f of ['reef_place_cards.js', 'piece_inspector.js']) vm.runInContext(readFileSync(new URL(f, root), 'utf8'), S);
const C = S.AtlasPlaceCards, I = S.AtlasInspector;
// Sabotajes en memoria: el gate debe fallar sin modificar el arbol publicado.
if (process.argv.includes('--sabotage-actions')) { const real = C.ficha; C.ficha = (...a) => ({ ...real(...a), actions: [] }); }
if (process.argv.includes('--sabotage-coordinate')) { const real = I.toca; I.toca = (...a) => (real(...a) || []).filter(l => l[0] !== 'Touched'); }
if (process.argv.includes('--sabotage-hit')) { const real = I.registra; I.registra = (cola, ...r) => real(cola.map(p => ({ ...p, ficha: () => ({ ...p.ficha(), hit: null }) })), ...r); }
let n = 0;
function caso(name, f) { try { f(); n++; console.log('ok ' + name); } catch (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; } }
for (const [tipo, id] of [['boya', 'radio'], ['observatorio', 'look'], ['lapidas', 'receipts'], ['cristal', 'measurements']]) {
  caso(tipo + ': ficha y accion real, ninguna ejecutada al leer', () => {
    const f = C.ficha(tipo, { que: tipo, estado: 'LIVE' }, { centro: { x: 12, y: -5 }, coste: 8, medidas: 1 });
    assert.equal(f.actions[0].id, id); assert.equal(S.calls.length, 0);
    assert.ok(I.lineas(f, 12, -5).some(x => /world \(12, -5\)/.test(x[1])));
  });
}
caso('observatorio: dry run y objetivo medidos; segundo gesto hace la mirada', () => {
  const f = C.ficha('observatorio', { que: 'Observatory', estado: 'LIVE' }, { centro: { x: 12, y: -5 }, coste: 8 });
  assert.match(f.actions[0].preview, /8 cycles/); assert.match(f.actions[0].preview, /12, -5/);
  assert.equal(S.calls.length, 0); C.ejecuta(f.actions[0]); assert.equal(S.calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(S.calls[0][1])), { x: 12, y: -5 }); S.calls.length = 0;
});
caso('coral con fuente publica: enlace real; sin fuente: NO_DATA con causa', () => {
  const f = C.ficha('coral', { que: 'Coral', estado: 'MEDIDO' }, { enlace: 'https://github.com/piskyRpapalo/lab/tree/main/benchmarks/bench_20261011' });
  assert.equal(f.actions[0].id, 'lab'); assert.ok(f.actions[0].href.startsWith('https://github.com/'));
  const nd = C.ficha('coral', { que: 'Coral', estado: 'NO_DATA' }, {});
  assert.equal(nd.actions.length, 0); assert.match(nd.actionCause, /NO_DATA \(.+\)/);
});
caso('observatorio sin coordenada no ofrece mirar; cristal sin medicion explica la causa', () => {
  assert.equal(C.ficha('observatorio', {}, {}).actions.length, 0);
  assert.match(C.ficha('observatorio', {}, {}).actionCause, /coordinate/);
  assert.match(C.ficha('cristal', {}, { medidas: 0 }).actions[0].preview, /NO_DATA \(.+\)/);
});
caso('accion desconocida o mirada rechazada: NO_DATA explicito, ningun resultado inventado', () => {
  assert.match(C.ejecuta({ id: 'inventada' }).cause, /NO_DATA \(.+\)/);
  S.AtlasArrecife.mira = () => 'mirando';
  assert.match(C.ejecuta({ id: 'look', target: { x: 1, y: 2 } }).cause, /already/);
});
caso('toque de una pieza: informa coordenada tocada y centro sin seleccionar ni ejecutar', () => {
  I.registra([{ col: 12, fila: -5, ficha: () => C.ficha('boya', { que: 'State buoy', estado: 'LIVE' }, {}) }], () => [10, 20]);
  const l = I.toca(10, 20, 44, { x: 11, y: -4 });
  assert.ok(l.some(x => x[0] === 'Touched' && /11, -4/.test(x[1]))); assert.equal(S.calls.length, 0);
});
// Las capas reales: casa y reloj sinteticos declarados, sin identidad, firmas, DB ni red.
for (const file of ['reef_building_lifecycle.js', 'hexelion_bench.js', 'reef_corals.js', 'latency_crystal.js', 'reef_buildings_paint.js', 'reef_buildings_layer.js']) {
  vm.runInContext(readFileSync(new URL(file, root), 'utf8'), S);
}
S.AtlasJuego = { instantanea: () => ({ ciclo: 1 }) };
S.AtlasNiebla = { sitioCasa: () => ({ x: 0, y: 0 }), sitioNodo: () => ({ x: 120, y: 120 }) };
S.AtlasNodosCedulas = { nodos: [{ nodo: 'nodo.0.hexelion', aparato: { medidas: { cpu: { estado: 'MEDIDO' } } } }] };
const g = new Proxy({}, { get: (obj, k) => k in obj ? obj[k] : (() => {}), set: (obj, k, v) => (obj[k] = v, true) });
const cola = [];
S.AtlasArrecife.pinta(g, (x, y) => [x, y], { pub: 'EMULATED fixture', sha: x => x, dpr: 1, t: 0, ts: 16, quieto: true,
  cam: { x: 30, y: 40 }, texto: k => ({ boya_estado: 'State buoy', obs_nombre: 'Observatory', lap_nombre: 'Tombstones', cri_nombre: 'Latency crystal' }[k] || k),
  pon: (col, fila, pinta, ficha) => cola.push({ col, fila, ficha }) });
for (const tipo of ['boya', 'observatorio', 'lapidas', 'cristal', 'coral']) {
  caso('capa real ' + tipo + ': tap entrega ficha+coordenada+acciones', () => {
    const p = cola.find(p => p.ficha().kind === tipo); assert.ok(p, 'piece not registered');
    I.registra([p], (x, y) => [x, y]);
    const l = I.toca(p.col, p.fila, 1, { x: p.col, y: p.fila });
    assert.ok(l.some(x => x[0] === 'Touched')); assert.ok(l.some(x => x[0] === 'Available actions'));
    assert.ok(l.some(x => x[0] === 'Coordinate')); assert.ok(!/undefined|NaN/.test(JSON.stringify(l)));
  });
}
caso('mirada real solo en el segundo gesto y en el objetivo anunciado', () => {
  assert.equal(S.AtlasArrecife.circulos().length, 0);
  const a = cola.find(p => p.ficha().kind === 'observatorio').ficha().actions[0];
  const r = C.ejecuta(a); assert.equal(r.receipt.col, 30); assert.equal(r.receipt.fila, 40);
  assert.equal(r.receipt.nace_tic, 1); assert.equal(S.AtlasArrecife.circulos().length, 0, 'view must mature for 8 cycles');
});
caso('coral alto: la cabeza visible es tocable con las mismas cifras que el dibujo', () => {
  const original = S.AtlasNodosCedulas.nodos;
  S.AtlasNodosCedulas.nodos = [{ nodo: 'coral-alto', aparato: { medidas: Object.fromEntries(Array.from({ length: 8 }, (_, i) => ['m' + i, { estado: 'MEDIDO' }])) } }];
  const high = [];
  S.AtlasCorales.pinta(g, (x, y) => [x, y], { dpr: 1, pon: (col, fila, pinta, ficha) => high.push({ col, fila, ficha }) });
  const p = high[0], k = S.AtlasCorales.coral(S.AtlasNodosCedulas.nodos[0]);
  I.registra([p], (x, y) => [x, y]);
  const l = I.toca(p.col + k.ladeo, p.fila - k.altura, 44, { x: p.col, y: p.fila });
  assert.ok(l && l.some(x => x[0] === 'What' && x[1] === 'Coral · coral-alto'));
  S.AtlasNodosCedulas.nodos = original;
});
caso('puntero: seleccion y Fight ocurren solo al ejecutar el control de la ficha', () => {
  const listeners = {}; let selection = 0, fight = 0, offered;
  const old = S.AtlasInspector;
  S.AtlasInspector = { toca: (_x, _y, _r, point, place) => { offered = place.action; assert.equal(point.x, 0); return [['Touched', 'world (0, 0)']]; } };
  S.document = { getElementById: id => id === 'arena-lucha' ? { click: () => fight++ } : null };
  vm.runInContext(readFileSync(new URL('map_pointer_input.js', root), 'utf8'), S);
  const c = { width: 100, height: 100, addEventListener: (k, v) => listeners[k] = v, setPointerCapture() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  S.AtlasMapaDedo.monta({ c, C: { aMundoDelta: () => [0, 0], aPantalla: () => [50, 50] }, dpr: 1, z: () => 1,
    cam: () => ({ x: 0, y: 0 }), marca() {}, lugares: () => [{ npc: true, clave: 'x' }], sitio: () => ({ x: 0, y: 0 }), elige: () => selection++ });
  listeners.pointerdown({ clientX: 50, clientY: 50, pointerId: 1 }); listeners.pointerup({ clientX: 50, clientY: 50 });
  assert.equal(selection, 0); assert.equal(fight, 0); assert.equal(offered.id, 'fight'); C.ejecuta(offered);
  assert.equal(selection, 1); assert.equal(fight, 1); S.AtlasInspector = old; delete S.document;
});
console.log(n + ' casos verdes');
