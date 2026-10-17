// W2 · generador de fotogramas de la escena de legibilidad (decision mia, sin firma). Node, sin dependencias.
// node fotogramas.mjs                 -> escribe escena_w2_fotogramas.json (solo si los casos 1-4 y 6 pasan)
// node fotogramas.mjs --check         -> gate de 6 casos + dataset (caso 5) en JSON; rc!=0 si alguno falla
// --check --sabotage-size|--sabotage-color|--sabotage-loop|--sabotage-sound -> sabotaje en memoria; rc!=0
// Poda por Opus (ley del mini): claves cortas declaradas en LEYENDA (va en el dataset como "keys");
// sonido factorizado a nivel de fotograma cuando es identico en sus atomos.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const req = createRequire(import.meta.url);
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const M = req(join(RAIZ, 'public/game/comic_atoms.js'));
const K = req(join(RAIZ, 'public/game/comic_tokens.js'));
const DATASET = join(AQUI, 'escena_w2_fotogramas.json');
const TIEMPOS = [0, 4, 8, 16];
// decision mia (sin firma): de las bandas solo las cuatro de color; 'h' es el matiz numerico, no un color.
const BANDAS = ['brillo', 'base', 'sombra', 'contorno'];
// decision mia (sin firma): claves cortas. 'ra' = radio del circulo (la 'r' corta es 'read' en atomo).
const LEYENDA = { k: 'kind', r: 'read', i: 'items', o: 'op', f: 'fill', s: 'stroke', sh: 'shadow', tx: 'text', sz: 'size', wt: 'weight', al: 'align', ra: 'r' };
const CLAVE = Object.fromEntries(Object.entries(LEYENDA).map(([c, n]) => [n, c]));
// decision mia (sin firma): regla de poda sin perdida. Un texto de item igual al read del atomo se omite (tx).
const REGLAS = ['item de texto sin tx => su texto es r del atomo'];
const FLAGS = ['--check', '--sabotage-size', '--sabotage-color', '--sabotage-loop', '--sabotage-sound', '--sabotage-text'];
const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const SAB = { size: args.has('--sabotage-size'), color: args.has('--sabotage-color'), loop: args.has('--sabotage-loop'), sound: args.has('--sabotage-sound'), text: args.has('--sabotage-text') };
const SABOTAJE = Object.values(SAB).some(Boolean);
const extra = [...args].filter((a) => !FLAGS.includes(a));
const USO_MAL = extra.length > 0 || (SABOTAJE && !CHECK);
if (USO_MAL) {
  console.log(JSON.stringify({ error: 'uso', extra }));
  process.exitCode = 2;
}

function mapaNombres() {
  const m = new Map();
  const add = (valor, nombre) => {
    if (m.has(valor) && m.get(valor) !== nombre) throw new Error(`colision de color ${valor}: ${m.get(valor)} / ${nombre}`);
    m.set(valor, nombre);
  };
  for (const k of ['ink', 'paper', 'ocean', 'cyan']) add(K.NEUTRAL[k], k);
  for (const s of K.SEALS) {
    const tono = K.tone(s);
    if (!tono.bands) throw new Error('sello sin bandas: ' + s);
    for (const b of BANDAS) add(tono.bands[b], `${s}.${b}`);
  }
  return m;
}

function crudos(t, sab) {
  const atoms = [
    M.atom('stamp', { seal: 'LIVE', text: 'reef live', x: 10, y: 10 }, t),
    M.atom('chip', { seal: 'STALE', label: '3 cycles', x: 200, y: 150 }, t),
    M.atom('badge', { seal: 'FIRMADO', value: '7', x: 190, y: 104, r: 24 }, t),
  ];
  if (sab.color) atoms[0].items[0].fill = '#123456';
  return atoms;
}

const r2 = (n) => Math.round(n * 100) / 100;

function normItem(it, m) {
  const o = {};
  for (const k of Object.keys(it)) {
    const v = it[k];
    if (v == null) continue;
    const c = CLAVE[k] ?? k;
    if (k === 'fill' || k === 'stroke') o[c] = m.get(v) ?? v;
    else if (typeof v === 'number') o[c] = r2(v);
    else if (Array.isArray(v)) o[c] = v.map((x) => (typeof x === 'number' ? r2(x) : x));
    else o[c] = v;
  }
  return o;
}

const txt = (v) => (v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v));

// forma compacta 'a.i.campo:antes>despues' (sin espacios)
function cambios(a, b) {
  const out = [];
  b.atoms.forEach((at, i) => at.i.forEach((it, j) => {
    const p = (a.atoms[i] && a.atoms[i].i[j]) || {};
    for (const c of new Set([...Object.keys(p), ...Object.keys(it)])) {
      if (JSON.stringify(p[c]) !== JSON.stringify(it[c])) out.push(`${i}.${j}.${c}:${txt(p[c])}>${txt(it[c])}`);
    }
  }));
  return out;
}

function fotograma(t, m, sab, previo) {
  const raw = crudos(t, sab);
  const comun = raw.every((a) => a.sound === raw[0].sound && a.soundCause === raw[0].soundCause);
  const frame = { t };
  if (comun) { frame.sound = raw[0].sound; frame.soundCause = raw[0].soundCause; }
  frame.atoms = raw.map((a) => {
    const o = { k: a.kind, r: a.read };
    if (!comun) { o.sound = a.sound; o.soundCause = a.soundCause; }
    o.i = a.items.map((it) => {
      const n = normItem(it, m);
      if (n.o === 'text' && n.tx === a.read) delete n.tx;
      return n;
    });
    return o;
  });
  const bandas = new Set();
  for (const a of raw) for (const it of a.items) for (const v of [it.fill, it.stroke]) if (v != null && m.has(v)) bandas.add(m.get(v));
  frame.bands = [...bandas].sort();
  frame.change = previo ? cambios(previo, frame) : [];
  return { frame, raw };
}

function construir(sab) {
  const m = mapaNombres();
  const out = [];
  let previo = null;
  for (const t of TIEMPOS) {
    const x = fotograma(t, m, sab, previo);
    out.push(x);
    previo = x.frame;
  }
  if (sab.loop) out[out.length - 1].frame.t = 15;
  if (sab.size) out[0].frame.pad = 'x'.repeat(1100);
  if (sab.sound) for (const x of out) { delete x.frame.sound; delete x.frame.soundCause; }
  if (sab.text) out[0].frame.atoms[0].r = 'X';
  return { m, out };
}

function serializar(frames) {
  return JSON.stringify({
    scene: 'w2', source: 'public/game/comic_atoms.js', target: 'atlas/legibilidad/escena_w2_blanco.md', keys: LEYENDA, rules: REGLAS, frames,
  }, null, 1) + '\n';
}

function evaluar(out, m) {
  const fr = out.map((x) => x.frame);
  const res = [];
  const tams = fr.map((f) => Buffer.byteLength(JSON.stringify(f)));
  res.push({ caso: 1, nombre: 'fotograma < 1024 B', ok: tams.every((b) => b < 1024), tams });
  const duros = fr.filter((f) => { const s = JSON.stringify(f); return /#[0-9a-fA-F]/.test(s) || s.includes('rgb('); }).map((f) => f.t);
  res.push({ caso: 2, nombre: 'sin hex ni rgb(', ok: duros.length === 0, t_malos: duros });
  const sinNombre = [];
  const fuera = [];
  let pintados = 0;
  out.forEach(({ frame, raw }) => raw.forEach((a) => a.items.forEach((it) => [it.fill, it.stroke].forEach((v) => {
    if (v == null) return;
    pintados++;
    const n = m.get(v);
    if (n === undefined) sinNombre.push(`t${frame.t}:${v}`);
    else if (!frame.bands.includes(n)) fuera.push(`t${frame.t}:${n}`);
  }))));
  res.push({ caso: 3, nombre: 'color crudo con nombre y en bands', ok: !sinNombre.length && !fuera.length, pintados, sinNombre, fuera });
  const porT = (t) => fr.find((x) => x.t === t);
  const sinTC = (f) => { const { t, change, ...r } = f; return JSON.stringify(r); };
  const f0 = porT(0), f8 = porT(8), f16 = porT(16);
  const ok4 = !!(f0 && f8 && f16) && sinTC(f0) === sinTC(f16) && sinTC(f0) !== sinTC(f8);
  res.push({ caso: 4, nombre: 'bucle: t0 = t16 y t0 != t8', ok: ok4 });
  const sinSonido = [];
  fr.forEach((f) => f.atoms.forEach((a, i) => {
    if (!(a.sound ?? f.sound) || !(a.soundCause ?? f.soundCause)) sinSonido.push(`t${f.t}.a${i}`);
  }));
  res.push({ caso: 6, nombre: 'todo atomo con sonido resoluble (propio o del fotograma)', ok: sinSonido.length === 0, sinSonido });
  // caso 7: cada texto pintado por el atomo crudo se reconstruye desde el fotograma (tx propio o r del atomo)
  const distintos = [];
  out.forEach(({ frame, raw }) => raw.forEach((a, i) => a.items.forEach((it, j) => {
    if (it.op !== 'text') return;
    const fi = frame.atoms[i].i[j] || {};
    const rec = fi.tx ?? frame.atoms[i].r;
    if (rec !== it.text) distintos.push(`t${frame.t}.a${i}.i${j}:${rec}!=${it.text}`);
  })));
  res.push({ caso: 7, nombre: 'texto reconstruible desde el fotograma (tx o r del atomo)', ok: distintos.length === 0, distintos });
  return res;
}

function main() {
  const { m, out } = construir(SAB);
  const casos = evaluar(out, m);
  if (CHECK) {
    const esperado = Buffer.from(serializar(construir({}).out.map((x) => x.frame)));
    const existe = existsSync(DATASET);
    const c5 = { caso: 5, nombre: 'dataset en disco == generado', ok: existe && readFileSync(DATASET).equals(esperado), existe, bytes_esperados: esperado.length };
    const todos = [...casos, c5].sort((a, b) => a.caso - b.caso);
    const ok = todos.every((c) => c.ok);
    console.log(JSON.stringify({ ok, sabotaje: SAB, casos: todos }));
    process.exitCode = ok ? 0 : 1;
    return;
  }
  if (!casos.every((c) => c.ok)) {
    console.log(JSON.stringify({ ok: false, escrito: false, casos }));
    process.exitCode = 1;
    return;
  }
  const texto = serializar(out.map((x) => x.frame));
  writeFileSync(DATASET, texto);
  console.log(JSON.stringify({ ok: true, escrito: 'escena_w2_fotogramas.json', bytes: Buffer.byteLength(texto) }));
}

if (!USO_MAL) main();
