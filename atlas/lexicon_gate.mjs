// NORTE 8 · MANDATO 2 · el gate del lexicon (ley del Soberano, 2026-10-28): en lo publico, nada que no sea
// ingles o un nombre de la casa. Este gate escanea el codigo SERVIDO (public/**/*.{html,js,mjs,css}) y falla
// con cualquier palabra española que no este en la linea base.
//
// Es un RATCHET: atlas/lexicon_base.json lista la deuda medida hoy, fichero a fichero. Lo nuevo falla; lo que
// desaparece obliga a bajar la base (la base solo puede encogerse). Se regenera con `--escribe-base`.
//
// Honestidad: la ley dice «palabra fuera de la lista blanca»; hoy el gate aplica la lista NEGRA medida (las
// palabras españolas del D2) mas la lista blanca de excepciones (atlas/lexicon_permitidas.json). Una lista
// blanca completa de ingles exige un diccionario versionado: decision pendiente del Soberano.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const RAIZ_POR_DEFECTO = resolve(HERE, '..');
const EXT = /\.(html|js|mjs|css)$/;
const SIN = new Set(['historial', 'node_modules']);

function ficheros(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!SIN.has(n)) ficheros(p, out); }
    else if (EXT.test(n)) out.push(p);
  }
  return out;
}

function cargaLista(raiz, nombre, por) {
  const p = join(raiz, 'atlas', nombre);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : por;
}

// Devuelve { fichero: [palabras] } para cada fichero servido con palabra española no permitida.
export function escanea(raiz = RAIZ_POR_DEFECTO) {
  const lista = cargaLista(raiz, 'lexicon_espanol.json', { palabras: [] });
  const permitidas = new Set(cargaLista(raiz, 'lexicon_permitidas.json', { palabras: [] }).palabras.map((w) => w.toLowerCase()));
  const negra = new Set(lista.palabras);
  const hallazgos = {};
  for (const f of ficheros(join(raiz, 'public'))) {
    const texto = readFileSync(f, 'utf8').replace(/https?:\/\/[^\s'"`)]+/g, '');
    const toks = texto.match(/[A-Za-zÁÉÍÓÚáéíóúÑñ][A-Za-zÁÉÍÓÚáéíóúÑñ_-]*/g) || [];
    const hallados = new Set();
    for (const t of toks) {
      const bajo = t.toLowerCase();
      const partes = t.split(/(?=[A-Z])|[_-]/).map((x) => x.toLowerCase()).filter(Boolean);
      const cae = negra.has(bajo) || negra.has(partes.join('')) || partes.some((p) => p.length > 2 && negra.has(p));
      if (cae && !permitidas.has(bajo)) hallados.add(bajo);
    }
    if (hallados.size) hallazgos[relative(raiz, f)] = [...hallados].sort();
  }
  return hallazgos;
}

// Compara con la base. Devuelve { nuevos, resueltos } para que el gate sea rojo en ambos sentidos.
export function compara(hallazgos, base) {
  const nuevos = [], resueltos = [];
  for (const [f, ws] of Object.entries(hallazgos)) {
    const viejos = new Set(base[f] || []);
    const extra = ws.filter((w) => !viejos.has(w));
    if (extra.length) nuevos.push(`${f}: ${extra.join(', ')}`);
  }
  for (const [f, ws] of Object.entries(base)) {
    const ahora = new Set(hallazgos[f] || []);
    const ya = ws.filter((w) => !ahora.has(w));
    if (ya.length) resueltos.push(`${f}: ${ya.join(', ')} (quitar de la base)`);
  }
  return { nuevos, resueltos };
}

function main(argv) {
  const hallazgos = escanea(RAIZ_POR_DEFECTO);
  const basePath = join(RAIZ_POR_DEFECTO, 'atlas', 'lexicon_base.json');
  if (argv.includes('--escribe-base')) {
    writeFileSync(basePath, JSON.stringify(hallazgos, null, 2) + '\n', 'utf8');
    console.log(`base escrita: ${Object.keys(hallazgos).length} ficheros`);
    return 0;
  }
  const base = existsSync(basePath) ? JSON.parse(readFileSync(basePath, 'utf8')) : {};
  const { nuevos, resueltos } = compara(hallazgos, base);
  const fichs = Object.keys(hallazgos).length;
  console.log(`lexicon: ${fichs} ficheros con palabra española · base ${Object.keys(base).length} · nuevos ${nuevos.length} · resueltos sin bajar la base ${resueltos.length}`);
  for (const l of nuevos) console.log('  NUEVA  ' + l);
  for (const l of resueltos) console.log('  BAJAR  ' + l);
  const ok = nuevos.length === 0 && resueltos.length === 0;
  console.log(ok ? 'VERDE' : 'ROJO · el lexicon no cuadra con la base');
  return ok ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2));
}
