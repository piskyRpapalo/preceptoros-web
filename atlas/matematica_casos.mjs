// Juez de la matematica de la casa (docs/MVP.md §1): sello, techo con juez, canal.
// Funciones puras; el sabotaje las llama con una copia mutada. Sin Math.random/Date/fetch.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ficha, valida, PIEZAS as FICHAS } from './ficha_lenguaje.mjs';
const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const TECHO_PIEZA = 16384;
const TECHO_LIBRO = 4096;
const TECHO_ENTRADA = 1024;
const CLAVES_LIBRO = ['v', 'medido', 'sin_juez', 'vocablo_ley', 'vocablo_pendiente'];
const SELLO_RE = /^(NO_DATA|LIVE|MEASURED|MEDIDO|EMULAT\w*|SIMULAT\w*|STALE|STATIC|DECLAR\w*|PROPOS\w*|SIGNED|FIRMADO|UNKNOWN|ESTIMAT\w*|INFERRED|GUESS\w*|APPROX\w*)$/;
const VOCAB_EXTRA = ['MEASURED', 'EMULATED', 'SIGNED', 'PROPOSED', 'DECLARED', 'REQUIRES_FIRMA'];
const VOC = '\\b(oraculo|notario|depin|tokens?|moneda|clearing|magia|oracle|notary|currency|magic)\\b';
const CANAL = ['enviar-ar.js', 'enviar-de.js', 'enviar-el.js', 'enviar-en.js', 'enviar-es.js', 'enviar-fr.js', 'enviar-it.js', 'enviar-pt.js', 'enviar-ru.js'];
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const fin = (ok, detalle) => ({ ok, detalle });
const run = (f) => { try { return f(); } catch (e) { return fin(false, 'excepcion: ' + e.message); } };
// universo
function recorre(dir) {
 return readdirSync(dir).sort().flatMap((n) => {
  const p = join(dir, n);
  if (statSync(p).isDirectory()) return recorre(p);
  return /\.(js|css)$/.test(n) ? [p] : [];
 });
}
function leerPiezas() {
 return ['game', 'assets'].flatMap((d) => recorre(join(RAIZ, 'public', d))).map((p) => ({
  fichero: p.slice(RAIZ.length + 1), bytes: statSync(p).size, src: readFileSync(p, 'utf8'),
 }));
}
function leerTextos() {
 return readdirSync(join(RAIZ, 'public')).filter((n) => /^atlas-[a-z]{2}\.json$/.test(n)).sort()
  .map((n) => ({ fichero: 'public/' + n, obj: JSON.parse(leer('public/' + n)) }));
}
// Jueces: CI, tests y un nivel de imports './x.mjs'.
function leerJueces() {
 const base = new Set(['test_web.py', 'atlas/test_atlas.py', 'arnes_sw.mjs', 'atlas/matematica_casos.mjs']);
 for (const m of leer('.github/workflows/gate.yml').matchAll(/node\s+((?:atlas|questions)\/[\w.-]+\.mjs)/g)) base.add(m[1]);
 for (const n of readdirSync(join(RAIZ, 'tests'))) if (n.endsWith('.test.mjs')) base.add('tests/' + n);
 const todos = new Set(base);
 for (const n of base) {
  if (!n.endsWith('.mjs')) continue;
  for (const m of leer(n).matchAll(/from '\.\/([^']+)'/g)) todos.add(posix.join(posix.dirname(n), m[1]));
 }
 return [...todos].map((n) => ({ fichero: n, texto: leer(n) }));
}
function leerCenso() {
 const ruta = 'atlas/matematica_censo.json';
 if (!existsSync(join(RAIZ, ruta))) return { ausente: true, bytes: 0, censo: { sin_juez: [], vocablo_ley: [], vocablo_pendiente: [] } };
 const txt = leer(ruta);
 return { ausente: false, bytes: Buffer.byteLength(txt), censo: JSON.parse(txt) };
}
// DEPTH no se exporta desde z_cutoff.js: se lee del fuente. HUE sale de TABLA.
function claves(src, nombre) {
 const m = src.match(new RegExp('var ' + nombre + '\\s*=\\s*\\{([^}]*)\\}'));
 if (!m) throw new Error('no encuentro ' + nombre);
 return [...m[1].matchAll(/([A-Z_]+)\s*:/g)].map((x) => x[1]);
}
function vocabulario() {
 const depth = claves(leer('public/game/z_cutoff.js'), 'DEPTH');
 const tabla = require(join(RAIZ, 'public/game/tabla_semantica.js')).TABLA;
 return new Set([...depth, ...Object.keys(tabla), ...VOCAB_EXTRA]);
}
function m1(piezas) {
 const malas = piezas.filter((p) => p.bytes > TECHO_PIEZA).map((p) => p.fichero + ' ' + p.bytes + ' B');
 return fin(piezas.length > 0 && malas.length === 0,
  malas.length ? malas.join('; ') : piezas.length + ' piezas <= ' + TECHO_PIEZA + ' B');
}
const nombrada = (p, texto) => {
 const base = basename(p.fichero), stem = base.replace(/\.(js|css)$/, '');
 return texto.includes(base) || texto.includes("'" + stem + "'") || texto.includes('"' + stem + '"');
};
function m2(piezas, jueces, censo) {
 const declaradas = new Set(censo.sin_juez.filter((e) => typeof e.causa === 'string' && e.causa.trim() !== '')
  .map((e) => e.fichero));
 const fallos = [];
 let sinJuez = 0, sinJuezDecl = 0;
 for (const p of piezas) {
  if (jueces.some((j) => nombrada(p, j.texto))) continue;
  sinJuez++;
  if (declaradas.has(p.fichero)) sinJuezDecl++;
  else fallos.push('sin juez y sin causa: ' + p.fichero);
 }
 for (const e of censo.sin_juez) {
  const p = piezas.find((x) => x.fichero === e.fichero);
  if (!p) fallos.push('libro caducado, no existe: ' + e.fichero);
  else if (jueces.some((j) => nombrada(p, j.texto))) fallos.push('libro caducado, ya tiene juez: ' + e.fichero);
 }
 return { ...fin(fallos.length === 0, fallos.join('; ') || 'sin juez declaradas: ' + sinJuezDecl),
  con_juez: piezas.length - sinJuez, sin_juez_declaradas: sinJuezDecl };
}
const literales = (src) => [...src.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map((m) => m[1] ?? m[2]);
function m3(piezas, vocab) {
 const fuera = [];
 for (const p of piezas) for (const lit of literales(p.src)) if (SELLO_RE.test(lit) && !vocab.has(lit)) fuera.push(p.fichero + ' ' + lit);
 return { ...fin(fuera.length === 0, fuera.length ? fuera.join('; ') : 'sellos fuera de vocabulario: 0'), sellos_fuera: fuera.length };
}
const RE_VOC_G = new RegExp(VOC, 'gi');
const RE_VOC_T = new RegExp(VOC, 'i');
const sinComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const cadenas = (v, out = []) => {
 if (typeof v === 'string') out.push(v);
 else if (v && typeof v === 'object') Object.values(v).forEach((x) => cadenas(x, out));
 return out;
};
function hallazgos(piezas, textos) {
 const mapa = new Map();
 const anade = (fichero, texto) => {
  for (const m of texto.matchAll(RE_VOC_G)) {
   const vocablo = m[1].toLowerCase();
   mapa.set(fichero + '|' + vocablo, { fichero, vocablo });
  }
 };
 for (const p of piezas) anade(p.fichero, sinComentarios(p.src));
 for (const t of textos) for (const s of cadenas(t.obj)) anade(t.fichero, s);
 return [...mapa.values()];
}
function m4(piezas, textos, censo) {
 const clave = (e) => e.fichero + '|' + String(e.vocablo).toLowerCase();
 const ley = new Set(censo.vocablo_ley.map(clave));
 const pend = new Set(censo.vocablo_pendiente.map(clave));
 const h = hallazgos(piezas, textos);
 const halladas = new Set(h.map(clave));
 const noDecl = h.filter((x) => !ley.has(clave(x)) && !pend.has(clave(x))).map(clave);
 const caducos = [...censo.vocablo_ley, ...censo.vocablo_pendiente].filter((e) => !halladas.has(clave(e))).map(clave);
 const fallos = [...noDecl.map((k) => 'no declarado ' + k), ...caducos.map((k) => 'libro caducado ' + k)];
 return { ...fin(fallos.length === 0, fallos.join('; ') || h.length + ' hallazgos declarados'),
  vocablos_ley: h.filter((x) => ley.has(clave(x))).length,
  vocablos_pendientes: h.filter((x) => pend.has(clave(x))).length };
}
function m5(dic, sabotear) {
 const res = Object.keys(FICHAS).map((p) => {
  const f = ficha(p, dic, { mundo: 'atlantis-rift', sello: 'MEDIDO' });
  if (sabotear && p === 'VT1') f.sonido_hz = 999;
  return [p, valida(f, dic)];
 });
 const malas = res.filter(([, r]) => r !== null).map(([p, r]) => p + ': ' + r);
 return { ...fin(malas.length === 0, malas.join('; ') || 'VT1..VT6 validan null'), validas: res.length - malas.length };
}
const canalDe = (src) => { const w = {}; new Function('window', src)(w); return w.ENVT; };
function m6(piezas) {
 const fallos = [];
 const canal = CANAL.map((n) => {
  const p = piezas.find((x) => x.fichero === 'public/assets/' + n);
  if (!p) fallos.push('falta ' + n);
  return p;
 }).filter(Boolean);
 const ev = canal.map((p) => {
  try { return { p, e: canalDe(p.src) }; } catch (err) { fallos.push(p.fichero + ': no evalua'); return { p, e: null }; }
 });
 const ref = ev.find((x) => x.p.fichero === 'public/assets/enviar-en.js');
 const refKs = ref && ref.e ? Object.keys(ref.e).sort().join(',') : null;
 const malos = new Set();
 for (const { p, e } of ev) {
  if (!e || typeof e !== 'object') { malos.add(p.fichero); fallos.push(p.fichero + ': sin window.ENVT'); continue; }
  if (Object.keys(e).sort().join(',') !== refKs) { malos.add(p.fichero); fallos.push(p.fichero + ': claves distintas de enviar-en.js'); }
  for (const [k, v] of Object.entries(e)) {
   if (typeof v !== 'string' || v.trim() === '') { malos.add(p.fichero); fallos.push(p.fichero + ': ' + k + ' vacio'); }
   else if (RE_VOC_T.test(v)) { malos.add(p.fichero); fallos.push(p.fichero + ': ' + k + ' con vocablo prohibido'); }
  }
  // Texto de UI, no paquete: su ley es la de pieza (M1). Corregido por Opus: la encomienda le ponia el techo del canal.
 }
 return { ...fin(fallos.length === 0, fallos.join('; ') || 'canal con las mismas claves'),
  canal_enviar: canal.length - malos.size };
}
// Sabotaje: copia de enviar-es.js sin su primera clave.
function quitaClave(piezas) {
 const es = piezas.find((p) => p.fichero === 'public/assets/enviar-es.js');
 const e = canalDe(es.src);
 delete e[Object.keys(e)[0]];
 const src = 'window.ENVT = ' + JSON.stringify(e, null, 1) + ';\n';
 return piezas.map((p) => (p === es ? { ...p, src, bytes: Buffer.byteLength(src) } : p));
}
function m7(censo, bytes, ausente) {
 const fallos = [];
 if (ausente) fallos.push('libro ausente');
 if (bytes > TECHO_LIBRO) fallos.push(bytes + ' B > ' + TECHO_LIBRO);
 for (const k of Object.keys(censo)) if (!CLAVES_LIBRO.includes(k)) fallos.push('clave fuera: ' + k);
 for (const k of ['sin_juez', 'vocablo_ley', 'vocablo_pendiente']) {
  for (const e of censo[k] ?? []) {
   const n = Buffer.byteLength(JSON.stringify(e));
   if (n >= TECHO_ENTRADA) fallos.push(k + ' ' + e.fichero + ': ' + n + ' B');
   if (typeof e.causa !== 'string' || e.causa.trim() === '') fallos.push(k + ' ' + (e.fichero ?? '?') + ': sin causa');
  }
 }
 return fin(fallos.length === 0, fallos.join('; ') || 'libro ' + bytes + ' B, causas presentes');
}
// main
const piezas = leerPiezas();
const textos = leerTextos();
const dic = JSON.parse(leer('public/dictionary.json'));
const jueces = leerJueces();
const { censo, bytes, ausente } = leerCenso();
const vocab = vocabulario();
const casos = [];
const caso = (nombre, real, sab) => casos.push({
 caso: nombre,
 ok: real.ok === true && sab.ok === false,
 detalle: (real.ok ? 'OK ' : 'ROJO ') + real.detalle + ' | sab ' + (sab.ok ? 'VERDE(mal) ' : 'ROJO ') + sab.detalle,
});
const r1 = run(() => m1(piezas));
caso('M1 techo', r1, run(() => m1([...piezas, { fichero: 'public/game/ficticia.js', bytes: 16400, src: '' }])));
const libroSinUno = { ...censo, sin_juez: censo.sin_juez.filter((_, i) => i !== 0) };
const r2 = run(() => m2(piezas, jueces, censo));
// Con el libro vacio (2026-10-25: consiento.css ya tiene juez) no hay entrada que quitar: el sabotaje
// mete entonces una pieza nueva sin juez ni causa, que tiene que poner M2 en rojo igual.
const sabM2 = censo.sin_juez.length ? () => m2(piezas, jueces, libroSinUno)
  // El nombre se compone en ejecucion: escrito literal, este mismo fichero (que es juez) lo nombraria.
  : () => m2([...piezas, { fichero: 'public/game/' + ['pieza', 'huerfana', 'x'].join('-') + '.js', bytes: 10, src: '' }], jueces, censo);
caso('M2 juez', r2, run(sabM2));
const r3 = run(() => m3(piezas, vocab));
caso('M3 sello', r3, run(() => m3([...piezas, { fichero: 'public/game/ficticia.js', bytes: 0, src: "const e = 'GUESSED';" }], vocab)));
const r4 = run(() => m4(piezas, textos, censo));
caso('M4 vocablos', r4, run(() => m4(piezas, [...textos, { fichero: 'public/atlas-xx.json', obj: { t: 'oracle' } }], censo)));
const r5 = run(() => m5(dic, false));
caso('M5 fichas', r5, run(() => m5(dic, true)));
const r6 = run(() => m6(piezas));
caso('M6 canal', r6, run(() => m6(quitaClave(piezas))));
const sinCausa = { ...censo.sin_juez[0] };
delete sinCausa.causa;
const r7 = run(() => m7(censo, bytes, ausente));
caso('M7 libro', r7, run(() => m7({ ...censo, sin_juez: [sinCausa, ...censo.sin_juez.slice(1)] }, bytes, false)));
const resumen = {
 piezas: piezas.length,
 textos: textos.length,
 techo_max_b: Math.max(...piezas.map((p) => p.bytes)),
 con_juez: r2.con_juez ?? null,
 sin_juez_declaradas: r2.sin_juez_declaradas ?? null,
 sellos_fuera: r3.sellos_fuera ?? null,
 vocablos_ley: r4.vocablos_ley ?? null,
 vocablos_pendientes: r4.vocablos_pendientes ?? null,
 fichas_validas: r5.validas ?? null,
 canal_enviar: r6.canal_enviar ?? null,
};
console.log(JSON.stringify({ resumen, casos }, null, 1));
process.exitCode = casos.length === 7 && casos.every((c) => c.ok) ? 0 : 1;
