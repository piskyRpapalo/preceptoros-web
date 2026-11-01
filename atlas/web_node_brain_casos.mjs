// El cerebro del nodo web (public/game/web_node_brain.js): sin consentimiento no pide nada; el manifiesto sólo admite
// entradas del mismo origen, acotadas y fijadas por sha; un byte cambiado es NO_DATA con causa, nunca una respuesta.
// Uso: node --test atlas/web_node_brain_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';
const M = JSON.parse(readFileSync(new URL('../public/models/web-node/manifest.json', import.meta.url), 'utf8'));
// 2026-11-01: el guía propio (LoRA de la misma base), segundo modelo a elegir, con su propio manifiesto.
const G = JSON.parse(readFileSync(new URL('../public/models/web-node-guide/manifest.json', import.meta.url), 'utf8'));
function carga(fetch) {
  const ctx = vm.createContext({ crypto: webcrypto, TextEncoder, URL, Blob, Response, Promise, Uint8Array, Error, JSON, Number, Array, String, fetch, caches: undefined, console });
  ctx.globalThis = ctx;
  vm.runInContext(readFileSync(new URL('../public/game/web_node_brain.js', import.meta.url), 'utf8'), ctx);
  return ctx.AtlasWebNodeBrain;
}

test('el manifiesto servido es válido y suma los bytes del modelo y del runtime fijados', () => {
  const B = carga(() => { throw new Error('no network'); });
  assert.ok(B.check(M));
  assert.equal(M.chunks.reduce((a, c) => a + c.bytes, 0), 105454144);
  assert.ok(M.chunks.every((c) => c.bytes <= 25 * 1024 * 1024), 'cada chunk entra en Cloudflare');
});

test('el manifiesto rechaza origen ajeno, sha suelto, tamaño fuera de 25 MiB y runtime incompleto', () => {
  const B = carga(() => { throw new Error('no network'); });
  for (const muta of [(m) => { m.chunks[0].name = 'https://example.org/x'; }, (m) => { m.chunks[0].name = '//cdn/x'; },
    (m) => { m.chunks[1].sha256 = 'abc'; }, (m) => { m.chunks[2].bytes = 26214401; }, (m) => { m.runtime.pop(); }, (m) => { m.schema = 'x'; }]) {
    const c = structuredClone(M); muta(c);
    assert.throws(() => B.check(c), (e) => e.cause === 'model_integrity_unavailable');
  }
});

test('sin consentimiento no hay ni una petición', async () => {
  let n = 0; const B = carga(() => { n++; throw new Error('network'); });
  await assert.rejects(B.load({ consent: false }), (e) => e.cause === 'consent_required');
  await assert.rejects(B.load(), (e) => e.cause === 'consent_required');
  assert.equal(n, 0);
});

test('un byte cambiado en el runtime es model_integrity_unavailable y no se ejecuta', async () => {
  const js = readFileSync(new URL('../public/vendor/wllama/wllama.js', import.meta.url)); js[100] ^= 1;
  const B = carga(async (url) => url.endsWith('manifest.json') ? new Response(JSON.stringify(M)) : new Response(js));
  await assert.rejects(B.load({ consent: true }), (e) => e.cause === 'model_integrity_unavailable' && /SHA-256 mismatch/.test(e.message));
  assert.equal(B.status(), 'idle');
});

test('cada chunk servido coincide con su sha del manifiesto (base y guía)', () => {
  for (const c of M.runtime.concat(M.chunks, G.runtime, G.chunks)) {
    const b = readFileSync(new URL('../public' + c.name, import.meta.url));
    assert.equal(b.length, c.bytes, c.name); assert.equal(createHash('sha256').update(b).digest('hex'), c.sha256, c.name);
  }
});

test('sin modelo cargado, la pregunta es NO_DATA model_not_installed', async () => {
  const B = carga(() => { throw new Error('no'); });
  await assert.rejects(B.reply('hi', 'Tutorial cabin'), (e) => e.cause === 'model_not_installed');
});

test('el manifiesto del guía es válido, propio y fijado: 5 chunks ≤ 21 MiB, su sha de modelo, Apache-2.0', () => {
  const B = carga(() => { throw new Error('no network'); });
  assert.ok(B.check(G));
  assert.equal(G.model, 'PreceptorOS guide (SmolLM2-135M LoRA)');
  assert.equal(G.license, 'Apache-2.0');
  assert.equal(G.chunks.length, 5);
  assert.ok(G.chunks.every((c) => c.name.startsWith('/models/web-node-guide/') && c.bytes <= 21 * 1024 * 1024));
  assert.equal(G.chunks.reduce((a, c) => a + c.bytes, 0), 105453984);
  const all = Buffer.concat(G.chunks.map((c) => readFileSync(new URL('../public' + c.name, import.meta.url))));
  assert.equal(createHash('sha256').update(all).digest('hex'), G.model_sha256);
  assert.deepEqual(G.runtime, M.runtime, 'mismo runtime fijado que la base');
});

test('load() pide el manifiesto elegido, y solo uno de /models/<carpeta>/manifest.json', async () => {
  const pedidas = [];
  const B = carga(async (url) => { pedidas.push(url); throw new Error('stop'); });
  await assert.rejects(B.load({ consent: true, manifest: '/models/web-node-guide/manifest.json' }));
  assert.deepEqual(pedidas, ['/models/web-node-guide/manifest.json']);
  await assert.rejects(B.load({ consent: true }));
  assert.equal(pedidas[1], B.MANIFEST, 'sin elección carga la base');
  for (const malo of ['https://example.org/models/x/manifest.json', '//cdn/models/x/manifest.json', '/models/../x/manifest.json', '/models/web-node/manifest.json?x', 42]) {
    await assert.rejects(B.load({ consent: true, manifest: malo }), (e) => e.cause === 'model_integrity_unavailable');
  }
  assert.equal(pedidas.length, 2, 'una ruta rechazada no pide nada');
});
