// Phase budgets supplement the inherited suites; no runtime or public data changes.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const root = new URL('../public/', import.meta.url);
function walk(base) {
  return readdirSync(new URL(base, root)).flatMap(name => {
    const path = base + name;
    return statSync(new URL(path, root)).isDirectory() ? walk(path + '/') : [path];
  });
}
const files = walk('');
const checked = files.filter(p => /\.(?:js|css|json|html)$/.test(p));
const MAX_BLOCK_BYTES = 25 * 1024 * 1024;
for (const path of checked) {
  assert(readFileSync(new URL(path, root)).byteLength <= MAX_BLOCK_BYTES, path + ' exceeds 25 MiB');
}
// D2 (FIRMO, 2026-10-11) revoked the 16 KiB per-file ceiling; the signed 25 MiB block limit applies.
// Corte D (2026-10-28): el presupuesto inicial medido sobre thegame.js (el juego de /play/) se retiro con el juego.
// Retirada comprobada: thegame.js no existe
// y no figura en el precache.
const sw = readFileSync(new URL('sw-listas.js', root), 'utf8');
const retirados = ['assets/thegame.js', 'assets/thegame.css'];
const vivos = retirados.filter(p => files.includes(p));
const precache = retirados.filter(p => sw.includes("'/" + p + "'"));
assert.deepEqual([...vivos, ...precache], [], 'el presupuesto del juego retirado sigue vivo');
console.log(JSON.stringify({gate:'phase',public_text_files:checked.length,presupuesto_inicial:'retirado con el juego (corte D)'}));
