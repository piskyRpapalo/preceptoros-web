// Genera los vectores de prueba del canon EJECUTANDO el codigo original (no una reimplementacion).
// Fuente: render_seed.js (TG.hash) y la formula de render_combat.js:64-65, copiada literal.
// Uso: node atlas/fixtures/genera_vectores_canon.mjs <ruta-a-render_seed.js> <ruta-de-salida.json>
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const [, , fuente, salida] = process.argv;
const codigo = readFileSync(fuente, 'utf8');
const ventana = {};
vm.createContext(ventana);
vm.runInContext(codigo.replace('window.TG = window.TG || {};', 'var window = this; window.TG = window.TG || {};'), ventana);
const TG = ventana.TG;

// Formula de cosecha: copia literal de render_combat.js:64-65 (seed + outcome).
function cosecha(st) {
  const seed = TG.hash(st.vertices, st.spectrum, st.valve + st.selected);
  const outcome = (seed % 100) < (40 + st.vertices * 3 + st.valve * 10) ? 'PENETRATES' : 'FILTERED';
  return { seed, outcome };
}

const hashes = [];
for (const a of [0, 1, 2, 7, 63, 1024, 65535, 4294967295]) {
  for (const b of [0, 1, 2, 3, 5, 9, 17]) {
    for (const c of [0, 1, 4, 8, 100]) hashes.push({ a, b, c, h: TG.hash(a, b, c) });
  }
}
const cosechas = [];
for (const vertices of [3, 4, 5, 8, 12]) for (const spectrum of [1, 2, 6]) for (const valve of [0, 1, 2]) for (const selected of [0, 1, 4]) {
  cosechas.push({ vertices, spectrum, valve, selected, ...cosecha({ vertices, spectrum, valve, selected }) });
}
const fuenteSha = createHash('sha256').update(codigo).digest('hex');
const doc = { fuente: 'render_seed.js (cosecha_joyas)', sha256: fuenteSha, hash: hashes, cosecha: cosechas };
writeFileSync(salida, JSON.stringify(doc) + '\n', 'utf8');
console.log(JSON.stringify({ hash: hashes.length, cosecha: cosechas.length, sha256: fuenteSha.slice(0, 16) }));
