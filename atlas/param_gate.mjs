// Gate de parametros del lote atlas · decision mia (sin firma). Node 22, ESM, sin dependencias.
// Mide los fotogramas del dataset de legibilidad y los vectores de estado contra su contrato.
// Uso: node atlas/param_gate.mjs <dataset.json> [--sabotage-band|--sabotage-serial|--sabotage-size]
//      node atlas/param_gate.mjs --vector <fichero.json>
// rc 0 = todo ok · rc 1 = algun fotograma o el vector no pasa · rc 2 = uso incorrecto.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const AV = req(ruta('../public/game/state_vector.js'));
const { valida } = req(ruta('../public/game/vector_contract.js'));
const TOKENS = req(ruta('../public/game/comic_tokens.js'));
const ACENTOS = ruta('../public/game/comic_accents.js');

// Fuente unica del tope: state_vector.js. No se escribe a mano.
export const TOPE = AV.TOPE;

const NEUTROS = ['ink', 'paper', 'ocean', 'cyan'];
const BANDAS = ['brillo', 'base', 'sombra', 'contorno'];
const CLAVES_COLOR = ['f', 's', 'fill', 'stroke'];
// IC7 seal contract (2026-10-31): the six doctrine labels. An optional top-level `seal` must be one of them.
const SELLOS = ['LIVE', 'STALE', 'STATIC', 'SIMULATED', 'NO_DATA', 'ERROR'];
const SABOTAJES = ['--sabotage-band', '--sabotage-serial', '--sabotage-size'];
let nombres = null;

const esObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const cadena = (x) => typeof x === 'string' && x.trim() !== '';
const plano = (x) => { const p = Object.getPrototypeOf(x); return p === Object.prototype || p === null; };
const sinRepetir = (xs) => [...new Set(xs)];

// Mapa nombre <-> literal, desde comic_tokens (y comic_accents si existe). Colision de literal = throw.
// decision mia (sin firma): la colision se compara en minusculas.
// decision mia (sin firma): formato de comic_accents.js supuesto, ACCENTS = { NOMBRE: {brillo,base,sombra,contorno} | {bands:{...}} }.
export function bandNames() {
  if (nombres) return nombres;
  const porNombre = new Map();
  const porLiteral = new Map();
  const add = (nombre, literal) => {
    if (!cadena(literal)) throw new Error('banda sin literal: ' + nombre);
    const clave = literal.trim().toLowerCase();
    if (porLiteral.has(clave) && porLiteral.get(clave) !== nombre) {
      throw new Error(`colision de literal ${literal}: ${porLiteral.get(clave)} / ${nombre}`);
    }
    porNombre.set(nombre, literal);
    porLiteral.set(clave, nombre);
  };
  for (const n of NEUTROS) add(n, TOKENS.NEUTRAL[n]);
  for (const s of TOKENS.SEALS) {
    const tono = TOKENS.tone(s);
    if (!tono.bands) throw new Error('sello sin bandas: ' + s);
    for (const b of BANDAS) add(`${s}.${b}`, tono.bands[b]);
  }
  if (existsSync(ACENTOS)) {
    const acentos = req(ACENTOS).ACCENTS;
    if (!esObjeto(acentos)) throw new Error('comic_accents.js existe sin export ACCENTS legible');
    for (const s of Object.keys(acentos)) {
      const bandas = acentos[s].bands || acentos[s];
      for (const b of BANDAS) add(`${s}.${b}`, bandas[b]);
    }
  }
  nombres = { porNombre, porLiteral };
  return nombres;
}

// Igualdad profunda para la ida y vuelta por JSON: NaN, undefined o funciones no sobreviven.
function igual(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b) || (!Array.isArray(a) && !plano(a))) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length
    && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && igual(a[k], b[k]));
}

// Sonido de un fotograma o de un atomo: 'ok', 'NO_DATA: <causa>' o null (no declarado).
// Un 'NO_DATA' pelado no vale como declarado; con causa (en el valor o en soundCause), si.
function sonido(o) {
  if (!esObjeto(o)) return null;
  if (cadena(o.sound) && !o.sound.startsWith('NO_DATA')) return 'ok';
  if (cadena(o.sound) && /^NO_DATA:\s*\S/.test(o.sound)) return o.sound;
  if (cadena(o.soundCause)) return 'NO_DATA: ' + o.soundCause;
  return null;
}

// Un fotograma: serializable, bajo el tope, colores con nombre declarado, texto junto al color,
// y los seis campos del receptor lab.scene-legibility/1 (elements, colors, changes, sounds, text, state).
export function checkFrame(frame) {
  const nm = bandNames().porNombre;
  const causas = [];
  let bytes = null;
  try {
    const json = JSON.stringify(frame);
    if (typeof json === 'string') {
      bytes = Buffer.byteLength(json, 'utf8');
      if (!igual(frame, JSON.parse(json))) causas.push('not serializable');
    } else causas.push('not serializable');
  } catch (e) {
    causas.push(/circular/i.test(e.message) ? 'not serializable: cycle' : 'not serializable: ' + e.message);
  }
  if (bytes !== null && bytes >= TOPE) causas.push('NO_DATA: frame over TOPE bytes');
  if (esObjeto(frame) && Object.prototype.hasOwnProperty.call(frame, 'seal') && !SELLOS.includes(frame.seal)) {
    causas.push('seal outside the doctrine labels: ' + String(frame.seal));
  }
  if (!esObjeto(frame)) {
    causas.push('not an object: frame');
    return { ok: false, bytes, causes: sinRepetir(causas), fields: {} };
  }
  const atoms = Array.isArray(frame.atoms) ? frame.atoms : [];
  const usados = new Set();
  atoms.forEach((a, ia) => {
    const items = esObjeto(a) && Array.isArray(a.i) ? a.i.filter(esObjeto) : [];
    let noNeutro = false;
    for (const it of items) {
      for (const k of CLAVES_COLOR) {
        if (!Object.prototype.hasOwnProperty.call(it, k)) continue;
        const v = it[k];
        if (typeof v !== 'string' || !nm.has(v) || /#|rgb\(|hsl\(/.test(v)) {
          causas.push('color without named band: ' + String(v));
          continue;
        }
        usados.add(v);
        if (!NEUTROS.includes(v)) noNeutro = true;
      }
    }
    const conTexto = (esObjeto(a) && cadena(a.r)) || items.some((it) => it.o === 'text');
    if (noNeutro && !conTexto) causas.push('color without text: atom ' + ia);
  });
  const declaradas = Array.isArray(frame.bands) ? frame.bands : [];
  for (const n of declaradas) if (typeof n !== 'string' || !nm.has(n)) causas.push('color without named band: ' + String(n));
  for (const u of usados) if (!declaradas.includes(u)) causas.push('band not declared in frame.bands: ' + u);
  // decision mia (sin firma): sounds usa el fotograma; si no lo declara, todos sus atomos.
  const sFrame = sonido(frame);
  const sAtomos = atoms.map(sonido);
  let sounds = 'NO_DATA: sound not declared in frame or atoms';
  if (sFrame !== null) sounds = sFrame;
  else if (sAtomos.length && sAtomos.every((x) => x !== null)) sounds = sAtomos.find((x) => x !== 'ok') ?? 'ok';
  const fields = {
    elements: atoms.length ? 'ok' : 'NO_DATA: atoms empty',
    colors: Array.isArray(frame.bands) ? 'ok' : 'NO_DATA: bands not an array',
    changes: Array.isArray(frame.change) ? 'ok' : 'NO_DATA: change not an array',
    sounds,
    text: atoms.some((a) => esObjeto(a) && cadena(a.r)) ? 'ok' : 'NO_DATA: no atom with non-empty r',
    state: Number.isFinite(frame.t) ? 'ok' : 'NO_DATA: t not numeric',
  };
  // elements, colors y state tumban el fotograma; changes, sounds y text quedan como NO_DATA declarado.
  for (const k of ['elements', 'colors', 'state']) if (fields[k] !== 'ok') causas.push(fields[k]);
  return { ok: causas.length === 0, bytes, causes: sinRepetir(causas), fields };
}

// Revision de un dataset {scene, keys, rules, frames[]}.
// decision mia (sin firma): un dataset sin fotogramas no pasa (un 'todos' vacio seria un ok sin medir).
function revisa(data) {
  const scene = esObjeto(data) && data.scene !== undefined ? data.scene : null;
  if (!esObjeto(data) || !Array.isArray(data.frames)) return { ok: false, scene, frames: [], causes: ['dataset without frames[]'] };
  const frames = data.frames.map((x) => {
    const r = checkFrame(x);
    return { t: esObjeto(x) && x.t !== undefined ? x.t : null, ok: r.ok, bytes: r.bytes, causes: r.causes, fields: r.fields };
  });
  return {
    ok: frames.length > 0 && frames.every((x) => x.ok),
    scene,
    frames,
    causes: frames.length ? [] : ['dataset with no frames'],
  };
}

export function checkDataset(path) {
  return revisa(JSON.parse(readFileSync(path, 'utf8')));
}

// Vector de estado: valida() del contrato y acota() sobre copia profunda (acota muta su entrada).
// decision mia (sin firma): un vector no serializable, o cuyo acota lance, tampoco pasa.
export function checkVector(v) {
  const causas = [];
  let bytes = null;
  let estado = 'NO_DATA: acota not evaluated';
  try {
    const json = JSON.stringify(v);
    if (typeof json === 'string') bytes = Buffer.byteLength(json, 'utf8');
  } catch {
    bytes = null;
  }
  if (bytes === null) causas.push('not serializable');
  let valido = false;
  try { valido = valida(v) === true; } catch { valido = false; }
  if (!valido) causas.push('valida(v) false');
  try { estado = AV.acota(structuredClone(v)).estado; } catch (e) { causas.push('acota threw: ' + e.message); }
  if (estado === 'fail-closed') causas.push('acota: fail-closed');
  return { ok: causas.length === 0, bytes, estado, causes: sinRepetir(causas) };
}

const primerItem = (f) => (Array.isArray(f.atoms) ? f.atoms : [])
  .flatMap((a) => (esObjeto(a) && Array.isArray(a.i) ? a.i : [])).find(esObjeto);

// Sabotaje en memoria sobre el PRIMER fotograma; el fichero no se toca.
function sabotea(data, flag) {
  const f = esObjeto(data) && Array.isArray(data.frames) ? data.frames[0] : null;
  if (!esObjeto(f)) throw new Error('sabotaje: no hay primer fotograma');
  if (flag === '--sabotage-size') { f.pad = 'x'.repeat(1100); return; }
  const it = primerItem(f);
  if (!it) throw new Error('sabotaje: el primer fotograma no tiene items');
  if (flag === '--sabotage-band') it.f = '#123456';
  else it.sz = NaN;
}

function uso(msg) {
  process.stderr.write(`uso incorrecto: ${msg}\n`
    + 'uso: node atlas/param_gate.mjs <dataset.json> [--sabotage-band|--sabotage-serial|--sabotage-size]\n'
    + '     node atlas/param_gate.mjs --vector <fichero.json>\n');
  process.exitCode = 2;
}

function emite(obj, rc) {
  process.stdout.write(JSON.stringify(obj) + '\n');
  process.exitCode = rc;
}

function cliDataset(p, flag) {
  if (!existsSync(p)) return uso('no existe ' + p);
  let salida;
  try {
    const data = JSON.parse(readFileSync(p, 'utf8'));
    if (flag) sabotea(data, flag);
    salida = { ...revisa(data), sabotaje: flag ?? null };
  } catch (e) {
    salida = { ok: false, error: e.message, sabotaje: flag ?? null };
  }
  emite(salida, salida.ok ? 0 : 1);
}

function cliVector(p) {
  if (!existsSync(p)) return uso('no existe ' + p);
  let r;
  try { r = checkVector(JSON.parse(readFileSync(p, 'utf8'))); } catch (e) {
    r = { ok: false, bytes: null, estado: null, causes: ['no es JSON: ' + e.message] };
  }
  emite(r, r.ok ? 0 : 1);
}

function cli(args) {
  const flags = args.filter((a) => a.startsWith('--'));
  const pos = args.filter((a) => !a.startsWith('--'));
  if (flags.includes('--vector')) {
    if (args.length !== 2 || args[0] !== '--vector' || pos.length !== 1) return uso('--vector admite un solo fichero y nada mas');
    return cliVector(pos[0]);
  }
  if (pos.length !== 1 || flags.length > 1 || flags.some((f) => !SABOTAJES.includes(f))) {
    return uso('falta <dataset.json> o hay argumentos no reconocidos');
  }
  return cliDataset(pos[0], flags[0] ?? null);
}

// El CLI corre solo si este fichero es el punto de entrada; el test lo importa sin efectos.
const esEntrada = (() => {
  try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; }
})();
if (esEntrada) cli(process.argv.slice(2));
