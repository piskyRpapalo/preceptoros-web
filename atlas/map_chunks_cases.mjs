// P2/P3 · the oven is deterministic and what is served is what is baked; the loader asks for the 7-chunk neighbourhood by key only.
// It verifies each sha and turns what is missing or corrupt into NO_DATA with a cause. Use: node --test atlas/map_chunks_cases.mjs
// Preceptor contract: study/05-contracts.md · PS: propose-only + seal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.AtlasMapCarta = require('../public/game/map_chart.js');
const L = require('../public/game/map_chunks.js');
const pub = (u) => new URL('../public' + u, import.meta.url);
const servido = (mutar = {}) => async (url) => {
  if (mutar[url] === 404) return { ok: false, status: 404 };
  let b = readFileSync(pub(url)); if (mutar[url] === 'flip') { b = Buffer.from(b); b[10] ^= 1; }
  return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) };
};

test('el horno es determinista y lo servido coincide con lo horneado', () => {
  assert.match(execFileSync('node', ['atlas/bake_chunks.mjs', '--check'], { encoding: 'utf8' }), /^VERDE/);
});

test('desde la cabaña se piden la carta y exactamente 7 chunks, y se cargan los 7', async () => {
  const r = await L.load([2, -1], { fetch: servido() });
  assert.equal(r.key, '0_0');
  assert.equal(r.requests.length, 8);
  assert.ok(r.requests.every((u) => /^\/map\/(chart|chunks\/-?\d+_-?\d+\.[0-9a-f]{8})\.json$/.test(u)), 'ninguna petición lleva coordenadas exactas');
  assert.equal(Object.keys(r.chunks).length, 7);
  assert.equal(r.say, 'Map loaded');
  assert.match(r.detail, /^Map chunks: 7 of 7 around area 0_0$/);
});

test('dos posiciones del mismo chunk hacen las mismas peticiones (la posición no viaja)', async () => {
  const a = await L.load([0, 0], { fetch: servido() }), b = await L.load([5, -3], { fetch: servido() });
  assert.deepEqual(a.requests, b.requests);
});

test('un byte cambiado es chunk_hash_mismatch; un chunk ausente es cache_chunk_missing; fuera de lo horneado, NO_DATA', async () => {
  const carta = JSON.parse(readFileSync(pub('/map/chart.json'), 'utf8')), c = carta.chunks[1];
  const url = '/map/chunks/' + c.id + '.' + c.sha256.slice(0, 8) + '.json';
  let r = await L.load([0, 0], { fetch: servido({ [url]: 'flip' }) });
  assert.deepEqual(r.missing, [{ key: c.id, cause: 'chunk_hash_mismatch' }]);
  r = await L.load([0, 0], { fetch: servido({ [url]: 404 }) });
  assert.match(r.missing[0].cause, /^cache_chunk_missing/);
  r = await L.load([17, -8], { fetch: servido() });
  assert.ok(r.missing.length > 0 && r.missing.every((m) => /not baked yet/.test(m.cause)) && /NO_DATA/.test(r.detail) && r.say === 'Part of the map is still missing');
});

test('cada gráfico horneado lleva su marco de burbuja < 1.024 B', () => {
  const C = globalThis.AtlasMapCarta;
  assert.equal(C.checkAsset(JSON.parse(readFileSync(pub('/art/sea-palette.json'), 'utf8'))), null);
});
