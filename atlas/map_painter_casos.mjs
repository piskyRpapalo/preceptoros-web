// P4 · el suelo 2.5D (public/game/map_painter.js): cada chunk se traduce a un marco de burbuja < 1.024 B (su
// matemática: luz, mar, bandas, frase), determinista, con el mar quieto en movimiento reducido, colores sólo de la
// casa y un patrón por banda. Uso: node --test atlas/map_painter_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const M = createRequire(import.meta.url)('../public/game/map_painter.js');
const dir = new URL('../public/map/chunks/', import.meta.url);
const chunks = Object.fromEntries(readdirSync(dir).map((f) => { const c = JSON.parse(readFileSync(new URL(f, dir), 'utf8')); return [c.c.join('_'), c]; }));
const bytes = (o) => new TextEncoder().encode(JSON.stringify(o)).length;

test('cada chunk horneado se traduce a un marco < 1.024 B que cuenta todas sus celdas en texto', () => {
  for (const c of Object.values(chunks)) {
    const f = M.frameOf(c, 37, false);
    assert.ok(bytes(f) < 1024, c.c + ': ' + bytes(f));
    const n = [...f.r.matchAll(/(\d+) (water|sand|moss|rock)/g)].reduce((a, m) => a + +m[1], 0);
    assert.equal(n, c.cells.length, 'la frase cuenta las ' + c.cells.length + ' celdas');
  }
});

test('determinista: mismo chunk y tick, mismo marco y mismos trazos', () => {
  const c = chunks['0_0'];
  assert.deepEqual(M.frameOf(c, 90, false), M.frameOf(c, 90, false));
  const traza = () => { const ops = []; const g = new Proxy({ canvas: { width: 390, height: 240 } }, { get: (o, k) => k in o ? o[k] : (...a) => ops.push(k + a.map((x) => typeof x === 'number' ? x.toFixed(2) : '').join()), set: (o, k, v) => { ops.push(k + '=' + v); return true; } });
    M.floor(g, { cx: 195, cy: 120, k: 0.6 }, { cells: M.cellsOf(chunks) }, 90, false); return ops; };
  assert.deepEqual(traza(), traza());
  assert.ok(traza().length > 1000, 'pinta prismas');
});

test('movimiento reducido: el mar se queda quieto y la frase lo dice', () => {
  const c = chunks['0_0'], f = M.frameOf(c, 10, true);
  assert.equal(f.sea.amp, 0); assert.match(f.r, /the sea stands still/);
  assert.deepEqual(M.frameOf(c, 10, true), M.frameOf(c, 200, true), 'sin reloj visible en reducido');
});

test('sin azar ni reloj; colores sólo de la casa; cada banda con su patrón propio', () => {
  const src = readFileSync(new URL('../public/game/map_painter.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/Math\.random|Date\.now|new Date|performance\.now/.test(src));
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(src), 'ni un color crudo');
  const pats = M.bands().map((b) => b.pattern); assert.equal(new Set(pats).size, 4);
});

// J4 · la marea de dos trenes (odd/JOYAS.md): al tren (2, 3) se suma el (3, 2), CERCANO (misma frecuencia, diferencia
// (1, −1) → batido de ~22 celdas), a media altura y otra velocidad. Medido el 2026-11-03: el ortogonal (3, −2) NO bate
// (rango 0,20: el batido es tan corto como la ola); el cercano sí (rango 1,50). Con un solo tren, todas las ventanas
// llegan a la misma cresta (rojo).
test('J4 · el mar tiene batidos: la cresta de cada ventana 6×6 varía, está acotada y se desplaza', () => {
  assert.equal(typeof M.swell, 'function', 'map_painter expone swell(c, wt), la altura de ola de una celda');
  const crestas = (wt) => { const out = []; for (let wx = 0; wx < 60; wx += 6) for (let wy = 0; wy < 60; wy += 6) { let m = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { m = Math.max(m, Math.abs(M.swell([wx + i, wy + j], wt))); } out.push(m); } return out; };
  const a = crestas(0), b = crestas(400);
  const rango = Math.max(...a) - Math.min(...a);
  assert.ok(rango > 0.6, 'sin batidos: todas las ventanas llegan a la misma cresta (rango ' + rango.toFixed(2) + ')');
  assert.ok(Math.max(...a, ...b) <= 3.05, 'la ola se sale de su amplitud: ' + Math.max(...a, ...b));
  assert.notDeepEqual(a, b, 'los batidos no se desplazan con el tiempo');
  for (let i = 0; i < 40; i++) { const h = M.swell([i, 2 * i - 7], i * 13); assert.equal(Math.round(h * 10), h * 10, 'la altura va en décimas: ' + h); }
});
