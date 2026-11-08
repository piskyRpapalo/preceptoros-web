// P4 · el suelo 2.5D (public/game/map_painter.js): cada chunk se traduce a un marco de burbuja < 1.024 B (su
// matemática: luz, mar, bandas, frase), determinista, con el mar quieto en movimiento reducido, colores sólo de la
// casa y un patrón por banda. Uso: node --test atlas/map_painter_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const M = createRequire(import.meta.url)('../public/game/map_painter.js');
const dir = new URL('../public/map/chunks/', import.meta.url);
const chunks = Object.fromEntries(readdirSync(dir).map((f) => { const c = JSON.parse(readFileSync(new URL(f, dir), 'utf8')); return [c.c.join('_'), c]; }));
const bytes = (o) => new TextEncoder().encode(JSON.stringify(o)).length;

test('el fixture visual conserva los bytes del chunk horneado de la cabina', () => {
  const source = readFileSync(new URL('./floor_fixture_chunk.js', import.meta.url), 'utf8');
  const match = source.match(/window\.FloorFixtureChunk = (\{.*\});/);
  assert.ok(match, 'fixture chunk missing');
  const file = readdirSync(dir).find((name) => name.startsWith('0_0.'));
  assert.ok(file, 'baked cabin chunk missing');
  assert.equal(match[1] + '\n', readFileSync(new URL(file, dir), 'utf8'));
});

test('la carta identifica cada chunk por el SHA-256 de sus bytes', () => {
  const carta = JSON.parse(readFileSync(new URL('../public/map/chart.json', import.meta.url), 'utf8'));
  assert.equal(carta.chunks.length, 7);
  for (const entry of carta.chunks) {
    const file = entry.id + '.' + entry.sha256.slice(0, 8) + '.json';
    const raw = readFileSync(new URL(file, dir));
    assert.equal(createHash('sha256').update(raw).digest('hex'), entry.sha256);
    assert.equal(raw.length, entry.bytes);
  }
});

test('cada chunk cita exactamente el marco del pintor en el tick inicial', () => {
  assert.equal(Object.keys(chunks).length, 7);
  for (const c of Object.values(chunks)) {
    assert.deepEqual(c.floor, M.frameOf(c, 0, false));
    assert.ok(bytes(c.floor) < 1024);
    assert.equal(c.floor.bands.reduce((n, band) => n + band[2], 0), c.cells.length);
  }
});

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

test('suelo liso primero (Soberano 2026-11-08): la arena es un solo color, sin textura ni sombra de vecinos', () => {
  const sand = M.bands().find((b) => b.kind === 'sand');
  assert.equal(sand.pattern, 'solid');
  const fills = new Set(), calls = { arc: 0, n: 0 };   // a top is moveTo + 5 lineTo; a side face is moveTo + 3
  const g = { canvas: { width: 400, height: 400 }, save() {}, restore() {}, beginPath() { calls.n = 0; }, moveTo() {}, lineTo() { calls.n++; }, closePath() {}, stroke() {},
    quadraticCurveTo() {}, arc() { calls.arc++; }, fill() { if (calls.n === 5) { fills.add(this.fillStyle); } }, lineJoin: '', fillStyle: '', strokeStyle: '', lineWidth: 1 };
  const flat = chunks['0_0'];
  const world = { cells: { list: flat.cells.filter((c) => c[3] !== 'water' && c[2] === 1), at: {} } };
  world.cells.list.forEach((c) => { world.cells.at[c[0] + ',' + c[1]] = c; });
  for (const c of flat.cells) { if (c[2] > 1) { world.cells.at[c[0] + ',' + c[1]] = c; } }   // taller neighbours stay, but do not shade the sand
  const drawn = M.floor(g, { k: 1.4, cx: 200, cy: 200 }, world, 0, true);
  assert.ok(world.cells.list.length > 10 && drawn > 10, 'sand drawn: ' + drawn);
  assert.equal(calls.arc, 0, 'no dots on the sand');
  // The node's city (odd/tasks/fog-and-conquest.md C1, Sovereign 2026-11-08) paves its land in one stone colour: one more flat colour, no more.
  const city = world.city && world.cells.list.some((c) => world.city[c[0] + ',' + c[1]]);
  assert.equal(fills.size, city ? 2 : 1, 'one flat colour for the sand' + (city ? ' and one for the city' : '') + ': ' + [...fills].join(','));
});
