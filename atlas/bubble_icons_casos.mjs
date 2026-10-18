// Lote 2 de iconos de burbuja: casos (decision mia, sin firma).
// Modulo: public/game/bubble_icons.js. Salida: una linea JSON {ok, casos}; rc=0 solo si todos pasan.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const gamePath = (name) => fileURLToPath(new URL('../public/game/' + name, import.meta.url));
const ICONS_PATH = gamePath('bubble_icons.js');
const CORE_PATH = gamePath('bubble_language.js');

const NAMES = ['left', 'up', 'down', 'right', 'home', 'beacon', 'eye', 'terminal', 'buoy', 'bubble', 'sound-on', 'sound-off', 'comment', 'menu', 'history', 'waves', 'nodes', 'help', 'play', 'pause'];
const OLD_NAMES = NAMES.slice(0, 13);
const BANDS = [null, 'ink', 'paper', 'cyan', 'ocean', 'comic yellow.base'];
const MAX_BYTES = 16384;
const IMPURE = [/Math\.random/, /\bDate\b/, /\bfetch\b/, /\blocalStorage\b/, /\bdocument\b/, /\bwindow\b/];
const COLOR_LITERAL = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(?:rgba?|hsla?)\s*\(/i,
  /['"](?:red|blue|green|white|black|yellow|orange|purple|gray|grey|pink|brown|magenta|lime|navy|teal)['"]/i,
];
const SHA_ICONS_OLD = 'b134e8729e71d5ae3cbd7f94a4077641d280ffde3c6426ae50a7ff9843b90386';
const SHA_COMPILE_OLD = 'fb0a2ff76a7d500dcef775b037e0f0884e3638998eec8f2a79f98c70ecc8c555';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = (value) => JSON.parse(JSON.stringify(value));
const sha = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

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

function fakeDoc() {
  const ctx = { transforms: [], setTransform(...a) { this.transforms.push(a); } };
  const made = [];
  return {
    ctx, made,
    createElement(tag) {
      const el = {
        tag, width: 0, height: 0, className: '', attrs: {},
        setAttribute(k, v) { this.attrs[k] = v; },
        getContext() { return ctx; },
      };
      made.push(el);
      return el;
    },
  };
}

const cases = [];
function check(name, fn) {
  let result;
  try { result = fn(); } catch (e) { result = { ok: false, detail: 'excepcion: ' + (e && e.message ? e.message : String(e)) }; }
  cases.push({ caso: name, ok: result.ok === true, detalle: result.detail === undefined ? '' : result.detail });
}

check('1 · existe, <= 16384 B, sin comentarios, puro, sin literales de color, sin primitiva text, sin document ni window', () => {
  const text = readFileSync(ICONS_PATH, 'utf8');
  const bytes = Buffer.byteLength(text, 'utf8');
  const comments = /\/\/|\/\*/.test(text);
  const impure = IMPURE.filter((re) => re.test(text)).map(String);
  const colors = COLOR_LITERAL.filter((re) => re.test(text)).map(String);
  const textPrim = /['"]text['"]/.test(text);
  const ok = bytes <= MAX_BYTES && !comments && impure.length === 0 && colors.length === 0 && !textPrim;
  return { ok, detail: { bytes, comments, impure, colors, textPrim } };
});

check('2 · NAMES son exactamente los 20 en orden (13 antiguos + menu, history, waves, nodes, help, play, pause)', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const ok = same(I.NAMES, NAMES) && NAMES.length === 20;
  return { ok, detail: ok ? 20 : I.NAMES };
});

check('3 · cada icono compila dentro de un fotograma sin notas (compile.notes vacio), con y sin halo', () => {
  if (!I || !core) return { ok: false, detail: LOADED.error || 'bubble_language.js no carga' };
  const bad = [];
  for (const name of NAMES) {
    for (const f of [undefined, 'paper']) {
      for (const halo of [false, true]) {
        const items = core.compile(frameOf([{ o: 'icon', name, x: 50, y: 50, r: 20, f, halo }]));
        const notes = core.compile.notes.length;
        if (notes !== 0) bad.push(name + ' halo=' + halo + ' notas=' + notes);
        if (!Array.isArray(items) || items.length === 0) bad.push(name + ' halo=' + halo + ' sin items');
      }
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad : 'limpio' };
});

check('4 · solo primitivas ribbon/wave y bandas permitidas (f y s), con y sin halo', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const bad = [];
  for (const name of NAMES) {
    for (const f of [undefined, 'paper', 'cyan']) {
      for (const halo of [false, true]) {
        const items = I.WORDS.icon({ name, x: 100, y: 100, r: 20, f, halo });
        if (items.length === 0) bad.push(name + ' sin items');
        items.forEach((it, i) => {
          if (it.o !== 'ribbon' && it.o !== 'wave') bad.push(name + '[' + i + '] primitiva ' + it.o);
          if (!BANDS.includes(it.f)) bad.push(name + '[' + i + '] f=' + it.f);
          if (!BANDS.includes(it.s)) bad.push(name + '[' + i + '] s=' + it.s);
        });
      }
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8) : 'limpio' };
});

check('5 · cabe en su caja [x - r - lw, x + r + lw] y lw = max(2.5, 0.16 r), los 20', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const x = 100, y = 100, r = 20, lw = Math.max(2.5, 0.16 * r);
  const lo = [x - r - lw, y - r - lw], hi = [x + r + lw, y + r + lw];
  const inside = (px, py) => px >= lo[0] && px <= hi[0] && py >= lo[1] && py <= hi[1];
  const bad = [];
  for (const name of NAMES) {
    const items = I.WORDS.icon({ name, x, y, r, f: 'cyan' });
    if (items.length === 0) bad.push(name + ' sin items');
    for (const it of items) {
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

check('6 · determinismo y no muta p, con y sin halo', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const bad = [];
  for (const name of NAMES) {
    for (const halo of [false, true]) {
      const p = { name, x: 100, y: 100, r: 20, f: 'paper', halo };
      const before = clone(p);
      const a = I.WORDS.icon(p), b = I.WORDS.icon(p);
      if (a.length === 0) bad.push(name + ': sin items');
      if (!same(a, b)) bad.push(name + ': distinto');
      if (!same(p, before)) bad.push(name + ': muta p');
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad : 'limpio' };
});

check('7 · name desconocido -> [] sin lanzar; missing() true para desconocidos y false para los 20', () => {
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

check('9 · halo: con halo true la salida son copias en s paper (f null, lw + 3) seguidas del icono sin cambios', () => {
  if (!I) return { ok: false, detail: LOADED.error };
  const bad = [];
  for (const name of NAMES) {
    for (const f of [undefined, 'paper']) {
      const base = I.WORDS.icon({ name, x: 100, y: 100, r: 20, f });
      const halo = I.WORDS.icon({ name, x: 100, y: 100, r: 20, f, halo: true });
      const n = base.length;
      if (halo.length !== 2 * n) bad.push(name + ' longitud ' + halo.length + ' != ' + 2 * n);
      halo.slice(0, n).forEach((it, i) => {
        if (it.s !== 'paper') bad.push(name + '[' + i + '] s=' + it.s);
        if (it.f !== null) bad.push(name + '[' + i + '] f=' + it.f);
        if (!(it.lw > base[i].lw)) bad.push(name + '[' + i + '] lw ' + it.lw + ' no mayor que ' + base[i].lw);
        if (it.lw !== base[i].lw + 3) bad.push(name + '[' + i + '] lw ' + it.lw + ' != ' + (base[i].lw + 3));
      });
      if (!same(halo.slice(n), base)) bad.push(name + ': el icono cambia con halo');
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8) : 'limpio' };
});

check('10 · sin halo, los 13 iconos antiguos salen identicos a los de antes (sha256 del JSON capturado del HEAD original)', () => {
  if (!I || !core) return { ok: false, detail: LOADED.error || 'bubble_language.js no carga' };
  const icons = [], compiled = [];
  for (const name of OLD_NAMES) {
    for (const f of [undefined, 'paper', 'cyan']) icons.push(I.WORDS.icon({ name, x: 50, y: 50, r: 20, f }));
  }
  for (const name of OLD_NAMES) compiled.push(core.compile(frameOf([{ o: 'icon', name, x: 50, y: 50, r: 20 }])));
  const hIcons = sha(icons), hCompiled = sha(compiled);
  const ok = hIcons === SHA_ICONS_OLD && hCompiled === SHA_COMPILE_OLD;
  return { ok, detail: { icons: hIcons === SHA_ICONS_OLD, compiled: hCompiled === SHA_COMPILE_OLD } };
});

function fakeAtoms() {
  const calls = [];
  return { calls, paint(g, items) { calls.push({ g, items }); } };
}

function withAtoms(atoms, fn) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'AtlasComicAtoms');
  const prev = globalThis.AtlasComicAtoms;
  if (atoms) globalThis.AtlasComicAtoms = atoms; else delete globalThis.AtlasComicAtoms;
  try { return fn(); } finally {
    if (had) globalThis.AtlasComicAtoms = prev; else delete globalThis.AtlasComicAtoms;
  }
}

check('11 · canvas: lienzo 56 x 56 para size 28 (scale 2), paint una vez, setTransform(2,0,0,2,0,0), clase y aria', () => {
  if (!I || typeof I.canvas !== 'function') return { ok: false, detail: 'falta canvas' };
  const doc = fakeDoc(), atoms = fakeAtoms();
  const cv = withAtoms(atoms, () => I.canvas(doc, 'help', 28, { scale: 2 }));
  if (!cv) return { ok: false, detail: 'devolvio null' };
  const ok = cv.width === 56 && cv.height === 56 && cv.className === 'bubble-ico' && cv.attrs['aria-hidden'] === 'true'
    && atoms.calls.length === 1 && atoms.calls[0].g === doc.ctx && Array.isArray(atoms.calls[0].items) && atoms.calls[0].items.length > 0
    && same(doc.ctx.transforms, [[2, 0, 0, 2, 0, 0]]);
  return { ok, detail: { w: cv.width, h: cv.height, cls: cv.className, aria: cv.attrs['aria-hidden'], paints: atoms.calls.length, tf: doc.ctx.transforms } };
});

check('12 · canvas: escala por defecto 2 y halo pasa al icono', () => {
  if (!I || typeof I.canvas !== 'function') return { ok: false, detail: 'falta canvas' };
  const doc = fakeDoc(), atoms = fakeAtoms();
  const cv = withAtoms(atoms, () => I.canvas(doc, 'menu', 28, { halo: true }));
  if (!cv) return { ok: false, detail: 'devolvio null' };
  const plainAtoms = fakeAtoms();
  withAtoms(plainAtoms, () => I.canvas(fakeDoc(), 'menu', 28, {}));
  const haloN = atoms.calls[0] ? atoms.calls[0].items.length : -1, plainN = plainAtoms.calls[0] ? plainAtoms.calls[0].items.length : -1;
  const ok = cv.width === 56 && cv.height === 56 && atoms.calls.length === 1 && plainN > 0 && haloN > plainN;
  return { ok, detail: { w: cv.width, h: cv.height, paints: atoms.calls.length, haloN, plainN } };
});

check('13 · canvas: null con nombre desconocido, sin documento, o sin AtlasComicAtoms', () => {
  if (!I || typeof I.canvas !== 'function') return { ok: false, detail: 'falta canvas' };
  const a = withAtoms(fakeAtoms(), () => I.canvas(fakeDoc(), 'nope', 28, {}));
  const b = withAtoms(fakeAtoms(), () => I.canvas(undefined, 'help', 28, {}));
  const c = withAtoms(null, () => I.canvas(fakeDoc(), 'help', 28, {}));
  const ok = a === null && b === null && c === null;
  return { ok, detail: { unknown: a === null, sinDoc: b === null, sinAtoms: c === null } };
});

const ok = cases.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos: cases }));
process.exitCode = ok ? 0 : 1;
