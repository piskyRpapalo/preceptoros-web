// Lote 1 de iconos de burbuja: casos (decision mia, sin firma).
// Modulo: public/game/bubble_icons.js. Salida: una linea JSON {ok, casos}; rc=0 solo si todos pasan.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const gamePath = (name) => fileURLToPath(new URL('../public/game/' + name, import.meta.url));
const ICONS_PATH = gamePath('bubble_icons.js');
const CORE_PATH = gamePath('bubble_language.js');

const NAMES = ['left', 'up', 'down', 'right', 'home', 'beacon', 'eye', 'terminal', 'buoy', 'bubble', 'sound-on', 'sound-off', 'comment'];
const BANDS = [null, 'ink', 'paper', 'cyan', 'ocean', 'comic yellow.base'];
const MAX_BYTES = 16384;
const IMPURE = [/Math\.random/, /\bDate\b/, /\bfetch\b/, /\blocalStorage\b/, /\bdocument\b/];
const COLOR_LITERAL = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(?:rgba?|hsla?)\s*\(/i,
  /['"](?:red|blue|green|white|black|yellow|orange|purple|gray|grey|pink|brown|magenta|lime|navy|teal)['"]/i,
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = (value) => JSON.parse(JSON.stringify(value));

function loadModule(file) {
  if (!existsSync(file)) return { error: 'falta bubble_icons.js' };
  try { return { mod: require(file) }; } catch (e) { return { error: 'no carga bubble_icons.js: ' + e.message }; }
}
const LOADED = loadModule(ICONS_PATH);
const I = LOADED.mod || null;
const core = (() => { try { return require(CORE_PATH); } catch (e) { return null; } })();

function frameOf(items) {
  return {
    v: 'preceptoros.bubble/1', id: 'ICONOS', t: 0, cv: [412, 515], light: [-0.35, -0.94], style: 'volume',
    atoms: [{ k: 'iconos', i: items }],
  };
}

const cases = [];
function check(name, fn) {
  let result;
  try { result = fn(); } catch (e) { result = { ok: false, detail: 'excepcion: ' + (e && e.message ? e.message : String(e)) }; }
  cases.push({ caso: name, ok: result.ok === true, detalle: result.detail === undefined ? '' : result.detail });
}

check('1 · existe, <= 16384 B, sin comentarios, puro, sin literales de color, sin primitiva text', () => {
  const text = readFileSync(ICONS_PATH, 'utf8');
  const bytes = Buffer.byteLength(text, 'utf8');
  const comments = /\/\/|\/\*/.test(text);
  const impure = IMPURE.filter((re) => re.test(text)).map(String);
  const colors = COLOR_LITERAL.filter((re) => re.test(text)).map(String);
  const textPrim = /['"]text['"]/.test(text);
  const ok = bytes <= MAX_BYTES && !comments && impure.length === 0 && colors.length === 0 && !textPrim;
  return { ok, detail: { bytes, comments, impure, colors, textPrim } };
});

check('2 · NAMES son exactamente los 13 en orden', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const ok = same(I.NAMES, NAMES) && NAMES.length === 13;
  return { ok, detail: ok ? 13 : I.NAMES };
});

check('3 · cada icono compila dentro de un fotograma sin notas (compile.notes vacio)', () => {
  if (!I || !core) return { ok: false, detail: LOADED.error || 'bubble_language.js no carga' };
  const bad = [];
  for (const name of NAMES) {
    for (const f of [undefined, 'paper']) {
      const items = core.compile(frameOf([{ o: 'icon', name, x: 50, y: 50, r: 20, f }]));
      const notes = core.compile.notes.length;
      if (notes !== 0) bad.push(name + ' notas=' + notes);
      if (!Array.isArray(items) || items.length === 0) bad.push(name + ' sin items');
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad : 'limpio' };
});

check('4 · solo primitivas ribbon/wave y bandas permitidas (f y s)', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const bad = [];
  for (const name of NAMES) {
    for (const f of [undefined, 'paper', 'cyan']) {
      const items = I.WORDS.icon({ name, x: 100, y: 100, r: 20, f });
      items.forEach((it, i) => {
        if (it.o !== 'ribbon' && it.o !== 'wave') bad.push(name + '[' + i + '] primitiva ' + it.o);
        if (!BANDS.includes(it.f)) bad.push(name + '[' + i + '] f=' + it.f);
        if (!BANDS.includes(it.s)) bad.push(name + '[' + i + '] s=' + it.s);
      });
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8) : 'limpio' };
});

check('5 · cabe en su caja [x - r - lw, x + r + lw] (puntos de ribbon, centros +/- radio de wave) y lw = max(2.5, 0.16 r)', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const x = 100, y = 100, r = 20, lw = Math.max(2.5, 0.16 * r);
  const lo = [x - r - lw, y - r - lw], hi = [x + r + lw, y + r + lw];
  const inside = (px, py) => px >= lo[0] && px <= hi[0] && py >= lo[1] && py <= hi[1];
  const bad = [];
  for (const name of NAMES) {
    for (const it of I.WORDS.icon({ name, x, y, r, f: 'cyan' })) {
      if (it.lw !== lw) bad.push(name + ' lw=' + it.lw);
      if (it.o === 'ribbon') {
        it.pts.forEach((q) => { if (!inside(q[0], q[1])) bad.push(name + ' punto ' + q.join(',')); });
      } else if (it.o === 'wave') {
        for (const h of it.h) {
          const rad = Math.max(h[1], h[2]);
          if (!inside(it.x - rad, it.y - rad) || !inside(it.x + rad, it.y + rad)) bad.push(name + ' wave ' + it.x + ',' + it.y);
        }
      } else {
        bad.push(name + ' primitiva ' + it.o);
      }
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8) : 'limpio' };
});

check('6 · determinismo y no muta p', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const bad = [];
  for (const name of NAMES) {
    const p = { name, x: 100, y: 100, r: 20, f: 'paper' };
    const before = clone(p);
    const a = I.WORDS.icon(p), b = I.WORDS.icon(p);
    if (!same(a, b)) bad.push(name + ': distinto');
    if (!same(p, before)) bad.push(name + ': muta p');
  }
  return { ok: bad.length === 0, detail: bad.length ? bad : 'limpio' };
});

check('7 · name desconocido -> [] sin lanzar; missing() true para desconocidos y false para los 13', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const unknown = I.WORDS.icon({ name: 'nope', x: 0, y: 0, r: 10 });
  const undef = I.WORDS.icon(undefined);
  const emptyName = I.WORDS.icon({ x: 0, y: 0, r: 10 });
  const okEmpty = Array.isArray(unknown) && unknown.length === 0 && Array.isArray(undef) && undef.length === 0 && Array.isArray(emptyName) && emptyName.length === 0;
  const okMissing = I.missing('nope') === true && I.missing('') === true && NAMES.every((n) => I.missing(n) === false);
  const ok = okEmpty && okMissing;
  return { ok, detail: { okEmpty, okMissing } };
});

check('8 · sabotaje: un icono con f \'#123456\' hace lanzar a compile (unknown band)', () => {
  if (!I || !core) return { ok: false, detail: LOADED.error || 'bubble_language.js no carga' };
  try {
    core.compile(frameOf([{ o: 'icon', name: 'left', x: 50, y: 50, r: 20, f: '#123456' }]));
  } catch (e) {
    const ok = /unknown band/.test(e.message);
    return { ok, detail: e.message };
  }
  return { ok: false, detail: 'compile no lanzo' };
});

const ok = cases.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos: cases }));
process.exitCode = ok ? 0 : 1;
