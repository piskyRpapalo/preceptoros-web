// MVP: el mapa de funciones y sus techos medidos. Cada caso puede ponerse rojo; el recibo cabe en el canal.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PUB = join(RAIZ, 'public');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const fallos = [];
const falla = (caso, detalle) => fallos.push(caso + ': ' + detalle);
const bytes = (s) => Buffer.byteLength(s, 'utf8');

const textoMapa = leer('atlas/mvp_mapa.json');
const mapa = JSON.parse(textoMapa);
const SEIS = ['LIVE', 'STALE', 'STATIC', 'SIMULATED', 'NO_DATA', 'ERROR'];
const T = mapa.techos;

const arg = process.argv.indexOf('--fila');
if (arg > 0) {
  const fila = mapa.filas.find((f) => f.id === process.argv[arg + 1]);
  console.log(fila ? JSON.stringify(fila) : JSON.stringify({ sello: 'NO_DATA', causa: 'row not found' }));
  process.exit(fila ? 0 : 1);
}

if (mapa.v !== 'preceptoros.mvp/1') falla('C1', 'schema id');
if (JSON.stringify(mapa.sellos) !== JSON.stringify(SEIS)) falla('C1', 'seal list is not the six canonical seals');
if (bytes(textoMapa) > T.mapa_b) falla('C1', `map ${bytes(textoMapa)} B over ${T.mapa_b} B`);
const ids = new Set();
for (const f of mapa.filas) {
  if (ids.has(f.id)) falla('C1', `duplicate id ${f.id}`);
  ids.add(f.id);
  if (!['web', 'app'].includes(f.fase)) falla('C1', `${f.id} phase ${f.fase}`);
  if (!SEIS.includes(f.sello)) falla('C1', `${f.id} seal ${f.sello} outside the six`);
  if (f.sello !== 'LIVE' && !f.causa) falla('C1', `${f.id} ${f.sello} without cause`);
  if (bytes(JSON.stringify(f)) >= T.canal_b) falla('C1', `${f.id} row over the channel ceiling`);
}
const web = mapa.filas.filter((f) => f.fase === 'web');
const primeraApp = mapa.filas.findIndex((f) => f.fase === 'app');
if (primeraApp >= 0 && mapa.filas.slice(primeraApp).some((f) => f.fase === 'web')) falla('C1', 'web rows must come before app rows');

for (const f of web) for (const a of f.anclas) if (!existsSync(join(RAIZ, a))) falla('C2', `${f.id} anchor missing ${a}`);

const gate = leer('.github/workflows/gate.yml').replace(/\bpython3\b/g, 'python');
const atlasPy = leer('atlas/test_atlas.py');
for (const f of web) {
  const j = f.juez.replace(/\bpython3\b/g, 'python');
  const enGate = gate.includes(j) || (j.startsWith('node --test ') && j.includes('tests/') && gate.includes("node --test 'tests/*.test.mjs'"));
  const viaAtlas = /^node atlas\/[\w.]+$/.test(j) && atlasPy.includes(j.split('/').pop()) && gate.includes('python atlas/test_atlas.py');
  if (!enGate && !viaAtlas) falla('C3', `${f.id} judge not run by CI: ${f.juez}`);
}

const TEXTO = /\.(js|mjs|css|html|json|txt|webmanifest|xml|svg|md|sha256)$/;
function recorre(dir, salida) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) recorre(p, salida); else salida.push(p);
  }
  return salida;
}
const servidos = recorre(PUB, []).filter((p) => TEXTO.test(p));
const pesos = servidos.map((p) => [relative(PUB, p), statSync(p).size]).sort((a, b) => b[1] - a[1]);
for (const [p, b] of pesos) if (b > T.pieza_b) falla('C4', `${p} ${b} B over ${T.pieza_b} B`);

const V = require('../public/game/state_vector.js');
const lleno = V.arma({ instantanea: { ciclo: 7, recursos: { cobre: 1, luz: 2, biomasa: 3, oxigeno: 4 } },
  cangrejo: { dx: 1, dy: 2, army: 3, swim: 1, reach: 1 } });
if (V.TOPE !== T.canal_b) falla('C5', `S_t ceiling ${V.TOPE} B is not the channel ceiling ${T.canal_b} B`);
const r1 = V.acota(lleno);
if (r1.estado !== 'completo' || r1.bytes >= T.canal_b) falla('C5', `small S_t ${r1.estado} ${r1.bytes} B`);
const gordo = V.arma({ instantanea: { ciclo: 7 } });
gordo.e = Array.from({ length: 60 }, (_, i) => ['building-' + i, 1, 1000]);
const r2 = V.acota(gordo);
if (r2.estado !== 'fail-closed' || r2.bytes >= T.canal_b || !r2.vector.nd.recorte) falla('C5', `oversize S_t not rejected whole: ${r2.estado} ${r2.bytes} B`);
const vacio = V.arma({});
for (const k of ['c', 'r']) if (!vacio.nd[k]) falla('C5', `empty S_t key ${k} without NO_DATA cause`);

const py = spawnSync('python3', ['-c', 'import sys; sys.path.insert(0, "atlas"); import mundo; print(mundo.gzip_juego())'], { cwd: RAIZ, encoding: 'utf8' });
const carga = Number(py.stdout.trim());
if (py.status !== 0 || !Number.isSafeInteger(carga)) falla('C6', 'door gzip not measured: ' + (py.stderr || '').slice(0, 120));
else if (carga >= T.carga_gzip_b) falla('C6', `door gzip ${carga} B over ${T.carga_gzip_b} B`);

const ETIQUETA = /<(script|link|img|iframe|source|audio|video|embed|object)\b[^>]*>/gi;
const EXTERNA = /\b(src|href)\s*=\s*["']?(https?:)?\/\//i;
const PIDE_JS = /\b(fetch|import|importScripts|EventSource|WebSocket|Worker)\s*\(\s*["'`](https?:)?\/\//;
let externas = 0;
for (const p of servidos) {
  const t = readFileSync(p, 'utf8');
  if (p.endsWith('.html')) {
    for (const m of t.match(ETIQUETA) || []) {
      if (/\brel\s*=\s*["']?(alternate|canonical)\b/i.test(m)) continue;
      if (EXTERNA.test(m)) { externas++; falla('C7', `${relative(PUB, p)} loads ${m.slice(0, 80)}`); }
    }
  }
  if (/\.m?js$/.test(p) && PIDE_JS.test(t)) { externas++; falla('C7', `${relative(PUB, p)} requests an external origin`); }
}

const lenguas = [...leer('LANGUAGES.md').matchAll(/^\| `([a-z]{2})` \|([^\n]*)$/gm)].map((m) => [m[1], m[2]]);
// Third declared exception · 2026-10-25: `public/face/index.html` is a
// non-language style-selection hub, not a locale. Scope: omit only the
// top-level `face/` portal from this comparison; all nine LANGUAGES.md entries
// remain required. Related exceptions: test_web.py coverage and sitemap.py /face/.
// get-the-app (North D1) and aduana (North N2), 2026-10-26: English content pages, not locale portals.
// /openworld/ (NORTE 7 PR 2, 2026-10-28): English content page (the map and the chat), not a locale portal.
const portales = readdirSync(PUB).filter((d) => d !== 'face' && d !== 'play' && d !== 'get-the-app' && d !== 'aduana' && d !== 'openworld' && existsSync(join(PUB, d, 'index.html'))).sort();
const cargador = (leer('public/assets/thegame.js').match(/var LENGUAS = \[([^\]]*)\]/) || [, ''])[1].match(/[a-z]{2}/g) || [];
if (lenguas.length !== 9) falla('C8', `LANGUAGES.md lists ${lenguas.length} languages, not 9`);
// English canon until MVP (2026-10-25): no locale portal folder may remain; each row declares the
// Worker 301, and the Worker's portal rule names every code of the table.
if (portales.length) falla('C8', `locale portals still in public/: ${portales.join(',')}`);
const reglaPortal = (leer('worker/index.js').match(/const PORTAL = \/\^\\\/\(\?:([a-z|]+)\)/) || [, ''])[1].split('|');
for (const [l, resto] of lenguas) {
  if (!resto.includes('301 to `/`')) falla('C8', `${l}: LANGUAGES.md does not declare the 301 portal`);
  if (!reglaPortal.includes(l)) falla('C8', `${l}: worker/index.js does not redirect /${l}/`);
}
for (const [l, resto] of lenguas) {
  if (!existsSync(join(PUB, `atlas-${l}.json`))) falla('C8', `atlas-${l}.json missing`);
  const dice = /\| yes \|\s*$/.test(resto);
  if (dice !== cargador.includes(l)) falla('C8', `${l}: LANGUAGES.md says loader ${dice ? 'yes' : 'no'}, thegame.js says ${cargador.includes(l) ? 'yes' : 'no'}`);
}

if (/esm\.run|CDN_ADMITIDO/.test(leer('test_web.py'))) falla('C9', 'retired WebLLM CDN exception still declared in test_web.py');

const cuenta = {};
for (const f of mapa.filas) cuenta[f.sello] = (cuenta[f.sello] || 0) + 1;
const recibo = { v: mapa.v, base: mapa.base, filas: mapa.filas.length, sellos: cuenta,
  pieza_max: pesos[0], canal_b: [r1.bytes, r2.bytes], carga_gzip_b: carga, externas,
  lenguas: [lenguas.length, cargador.length], fallos: fallos.slice(0, 4), ok: fallos.length === 0 };
const salida = JSON.stringify(recibo);
if (bytes(salida) >= T.canal_b) { console.log(JSON.stringify({ ok: false, fallos: fallos.length, causa: 'receipt over the channel ceiling' })); process.exit(1); }
console.log(salida);
process.exitCode = fallos.length ? 1 : 0;
