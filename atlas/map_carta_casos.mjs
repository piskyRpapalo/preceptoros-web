// P1 · atlas.carta/1 (public/game/map_carta.js): teselado exacto en chunks hex, vecindad de 7 por clave cuantizada y el
// contrato de cada gráfico con su marco de burbuja (< 1.024 B). Uso: node --test atlas/map_carta_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../public/game/map_carta.js');
const R = 8;
const frame = { t: 'Tutorial cabin chunk', d: 'Floor and water around the tutorial cabin.' };
const budget = { chunk_bytes_max: 65536, visible_bytes_max: 458752 };
const carta = () => ({ v: 'atlas.carta/1', radius: R, seed: 1, budget, frame, chunks: [{ id: '0_0', c: [0, 0], sha256: 'a'.repeat(64), bytes: 900, frame }] });

test('el teselado es exacto: cada celda cae en un solo chunk y cada chunk tiene 3R²+3R+1 celdas', () => {
  const n = new Map();
  for (let q = -70; q <= 70; q++) for (let r = -70; r <= 70; r++) {
    const c = C.chunkOf(q, r, R); assert.ok(c, q + ',' + r);
    assert.ok(C.dist(q - c[0], r - c[1]) <= R); n.set(C.key(c), (n.get(C.key(c)) || 0) + 1);
  }
  const interior = [...n].filter(([k]) => k.split('_').every((x) => Math.abs(+x) < 45));
  assert.ok(interior.length > 10 && interior.every(([, v]) => v === 3 * R * R + 3 * R + 1));
});

test('la vecindad son 7 claves distintas, contiguas, y una posición sólo sale como su clave', () => {
  const v = C.neighbourhood([0, 0], R).map(C.key);
  assert.equal(new Set(v).size, 7);
  for (const k of v) { const [a, b] = k.split('_').map(Number); assert.equal(C.key(C.chunkOf(a, b, R)), k); }
  assert.equal(C.key(C.chunkOf(3, -2, R)), C.key(C.chunkOf(-5, 1, R)), 'dos posiciones del mismo chunk dan la misma clave');
});

test('carta, chunk y asset válidos pasan; cada violación dice su causa', () => {
  assert.equal(C.checkCarta(carta()), null);
  const malos = [
    Object.assign(carta(), { v: 'atlas.carta/2' }), Object.assign(carta(), { radius: 0 }), Object.assign(carta(), { frame: { t: 'x' } }),
    Object.assign(carta(), { chunks: [{ id: '1_1', c: [1, 1], sha256: 'a'.repeat(64), bytes: 9, frame }] }),
    Object.assign(carta(), { chunks: [{ id: '0_0', c: [0, 0], sha256: 'x', bytes: 9, frame }] }),
    Object.assign(carta(), { frame: { t: 'big', d: 'x'.repeat(1100) } })];
  for (const m of malos) assert.equal(typeof C.checkCarta(m), 'string', JSON.stringify(m).slice(0, 80));
  const ch = { v: 'atlas.chunk/1', c: [0, 0], seed: 1, frame, cells: [[0, 0, 0, 'floor']], assets: ['sea-palette'] };
  assert.equal(C.checkChunk(ch, R), null);
  assert.match(C.checkChunk(Object.assign({}, ch, { cells: [[20, 0, 0, 'floor']] }), R), /outside its chunk/);
  assert.match(C.checkChunk(Object.assign({}, ch, { cells: [[0, 0, 0, 'lava']] }), R), /unknown kind/);
  assert.equal(C.checkAsset({ v: 'atlas.asset/1', id: 'sea-palette', kind: 'palette', frame, data: {} }), null);
  assert.match(C.checkAsset({ v: 'atlas.asset/1', id: 'x', kind: 'glb', frame, data: {} }), /kind/);
});

test('presupuesto (enmienda 2026-11-01): sin budget, chunk por encima o área visible por encima se rechazan', () => {
  const sin = carta(); delete sin.budget;
  assert.match(C.checkCarta(sin), /budget/);
  assert.match(C.checkCarta(Object.assign(carta(), { budget: { chunk_bytes_max: 9, visible_bytes_max: 3 } })), /budget/);
  const gordo = carta(); gordo.chunks[0].bytes = 65537;
  assert.match(C.checkCarta(gordo), /over budget: 65537 bytes \(limit 65536\)/);
  const justo = carta(); justo.chunks[0].bytes = 65536; assert.equal(C.checkCarta(justo), null);
  const area = Object.assign(carta(), { budget: { chunk_bytes_max: 600, visible_bytes_max: 1000 } });
  area.chunks = C.neighbourhood([0, 0], R).slice(0, 2).map((c) => ({ id: C.key(c), c, sha256: 'a'.repeat(64), bytes: 600, frame }));
  assert.match(C.checkCarta(area), /over visible budget: 1200/);
});

test('el marco de burbuja se mide en bytes UTF-8, no en caracteres', () => {
  assert.match(C.frameCause({ t: 'ñ', d: 'ñ'.repeat(520) }), /bytes/, '520 ñ son 1.040 B aunque sean 521 caracteres');
});
