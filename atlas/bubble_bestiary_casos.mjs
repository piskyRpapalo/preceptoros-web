// W1 · casos de las palabras compuestas de la lengua de burbuja (decision mia, sin firma).
// Criaturas: public/game/bubble_bestiary.js. Lugares: public/game/bubble_world.js.
// Salida: una linea JSON {ok, casos}; rc=0 solo si todos los casos pasan.
// NO_DATA con causa cuenta como paso (caso 8, mientras el nucleo no exista).
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const gamePath = (name) => fileURLToPath(new URL('../public/game/' + name, import.meta.url));
const BESTIARY_PATH = gamePath('bubble_bestiary.js');
const WORLD_PATH = gamePath('bubble_world.js');
const CORE_PATH = gamePath('bubble_language.js');

const PRIMITIVES = ['wave', 'blob', 'ribbon', 'arcs', 'field', 'text'];
const BANDS = ['ink', 'paper', 'ocean', 'cyan', 'comic yellow.base', 'FIRMADO.base'];
const CREATURES = ['bust', 'crab', 'star', 'snail', 'octo', 'fish', 'troop'];
const PLACES = ['city', 'reef', 'pile', 'rift', 'seam', 'boing', 'wob'];
const ALL_WORDS = [...CREATURES, ...PLACES];
const PEGI_BANNED = ['teeth', 'blood', 'crack', 'fire', 'skull', 'fang', 'knife'];
const IMPURE = [/\bdocument\b/, /\bDate\b/, /Math\.random/, /\bperformance\b/, /\bfetch\b/, /\blocalStorage\b/];
const COLOR_LITERAL = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(?:rgba?|hsla?)\s*\(/i,
  /['"](?:red|blue|green|white|black|yellow|orange|purple|gray|grey|pink|brown|magenta|lime|navy|teal)['"]/i,
];

// Parametros minimos (x, y y los obligatorios) y variantes de estado de cada palabra.
const MINIMAL = {
  bust: { x: 192, y: 214 }, crab: { x: 190, y: 282 }, star: { x: 360, y: 330 }, snail: { x: 300, y: 250 },
  octo: { x: 110, y: 440 }, fish: { x: 30, y: 90 }, troop: { x: 150, y: 330 },
  city: { x: [300, 412], y: [30, 80] }, reef: { x: [0, 96], y: [0, 515] }, pile: { x: [140, 300], y: [318, 420] },
  rift: { x: 290, y: 470, w: 150, h: 26 }, seam: { x: 268, y: [60, 515] }, boing: { x: 204, y: 250 },
  wob: { x: 200, y: 220, r: [130, 146] },
};
const VARIANTS = {
  bust: [
    { x: 192, y: 214, eye: 'open', mouth: 'o' },
    { x: 192, y: 214, eye: 'open', cybEye: 'shut', mEye: 'happy', mouth: 'smile' },
    { x: 236, y: 250, r: 46, rot: 24, sq: [1.12, 0.88], cybEye: 'violet', mEye: 'happy', mouth: 'smile' },
    { x: 192, y: 214, sq: [2, 0.2] },
  ],
  crab: [
    { x: 190, y: 282, rr: 60, dir: 1, eye: 'up' },
    { x: 250, y: 330, rr: 52, dir: -1, eye: 'open' },
    { x: 300, y: 440, rr: 40, dir: -1, eye: 'shut' },
  ],
  star: [{ x: 360, y: 330, r: 22, eye: 'up' }, { x: 360, y: 330, eye: 'shut' }],
  snail: [{ x: 300, y: 250, r: 16, eye: 'up' }],
  octo: [{ x: 110, y: 440, r: 20, eye: 'shut' }],
  fish: [{ x: 30, y: 90, sc: 0.5 }],
  troop: [{ x: 150, y: 330, r: 12, ph: 7 }],
  city: [{ x: [300, 412], y: [30, 80], dome: 2 }],
  reef: [{ x: [200, 412], y: [300, 515] }],
  pile: [{ x: [140, 300], y: [318, 420], n: 5, r: [18, 30], seed: 'roca-b' }],
  rift: [{ x: 40, y: 300, w: 60, h: 10 }],
  seam: [{ x: 268, y: [60, 515], gap: 40 }],
  boing: [{ x: 204, y: 250, n: 3, arc: 70 }],
  wob: [{ x: 200, y: 220, r: [130, 146], n: 6, arc: 30, ph: 45 }],
};

const allParams = (name) => [MINIMAL[name], ...(VARIANTS[name] || [])];
const clone = (value) => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function loadModule(file) {
  const label = file.split('/').pop();
  if (!existsSync(file)) return { error: 'falta ' + label };
  try { return { mod: require(file) }; } catch (e) { return { error: 'no carga ' + label + ': ' + e.message }; }
}
const BEST = loadModule(BESTIARY_PATH);
const WORLD = loadModule(WORLD_PATH);
const BEST_WORDS = (BEST.mod && BEST.mod.WORDS) || {};
const WORLD_WORDS = (WORLD.mod && WORLD.mod.WORDS) || {};
const WORDS = { ...BEST_WORDS, ...WORLD_WORDS };

// Devuelve el motivo si falta algun modulo o su WORDS; null si estan los dos.
function missing() {
  if (BEST.error) return BEST.error;
  if (WORLD.error) return WORLD.error;
  if (!BEST.mod.WORDS) return 'bubble_bestiary.js sin WORDS';
  if (!WORLD.mod.WORDS) return 'bubble_world.js sin WORDS';
  return null;
}

// Numeros finitos en todo el item (ni NaN ni Infinity): una coordenada rota no debe pasar en silencio.
function finiteProblems(value, path) {
  if (typeof value === 'number') return isFinite(value) ? [] : [path + ' no finito'];
  if (Array.isArray(value)) return value.flatMap((v, i) => finiteProblems(v, path + '[' + i + ']'));
  if (value && typeof value === 'object') return Object.keys(value).flatMap((k) => finiteProblems(value[k], path + '.' + k));
  return [];
}

// Problemas de un item: primitiva conocida, bandas permitidas, profundidad 0-2, ningun literal de color, numeros finitos.
function itemProblems(item) {
  if (!item || typeof item !== 'object') return ['no es un objeto'];
  const out = finiteProblems(item, 'item');
  if (!PRIMITIVES.includes(item.o)) out.push('primitiva ' + item.o);
  for (const key of ['f', 's']) {
    if (item[key] !== undefined && item[key] !== null && !BANDS.includes(item[key])) out.push(key + '=' + item[key]);
  }
  if (item.d !== undefined && ![0, 1, 2].includes(item.d)) out.push('d=' + item.d);
  for (const value of Object.values(item)) {
    if (typeof value === 'string' && COLOR_LITERAL.some((re) => re.test(value))) out.push('color literal ' + value);
  }
  return out;
}

const cases = [];
function check(name, fn) {
  let result;
  try { result = fn(); } catch (e) { result = { ok: false, detail: 'excepcion: ' + (e && e.message ? e.message : String(e)) }; }
  cases.push({ caso: name, ok: result.ok === true, detalle: result.detail === undefined ? '' : result.detail });
}

check('1 · WORDS de los dos modulos: exactamente las 14 palabras (7 criaturas, 7 lugares)', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const bestKeys = Object.keys(BEST_WORDS).sort();
  const worldKeys = Object.keys(WORLD_WORDS).sort();
  const okBest = same(bestKeys, [...CREATURES].sort());
  const okWorld = same(worldKeys, [...PLACES].sort());
  const total = new Set([...bestKeys, ...worldKeys]).size;
  const ok = okBest && okWorld && total === 14;
  return { ok, detail: ok ? 14 : { bestKeys, worldKeys, total } };
});

check('2 · cada palabra (minimos y variantes) devuelve solo primitivas y bandas permitidas', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const bad = [];
  for (const name of ALL_WORDS) {
    if (typeof WORDS[name] !== 'function') { bad.push(name + ': no es funcion'); continue; }
    for (const params of allParams(name)) {
      const items = WORDS[name](clone(params));
      if (!Array.isArray(items) || items.length === 0) { bad.push(name + ': sin items'); continue; }
      items.forEach((item, i) => { for (const p of itemProblems(item)) bad.push(name + '[' + i + ']: ' + p); });
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? { fallos: bad.length, muestra: bad.slice(0, 8) } : 'limpio' };
});

check('3 · determinismo: dos llamadas, JSON igual; no mutan sus parametros', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const bad = [];
  for (const name of ALL_WORDS) {
    for (const params of allParams(name)) {
      const first = clone(params), second = clone(params);
      if (JSON.stringify(WORDS[name](first)) !== JSON.stringify(WORDS[name](second))) bad.push(name + ': distinto');
      if (JSON.stringify(first) !== JSON.stringify(params)) bad.push(name + ': muta sus parametros');
    }
  }
  return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8) : 'determinista' };
});

check('4 · bust: FIRMADO.base solo en el ojo violeta; con shut no aparece', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const signed = (items) => items.filter((q) => q.f === 'FIRMADO.base' || q.s === 'FIRMADO.base');
  const violet = signed(WORDS.bust({ x: 192, y: 214, cybEye: 'violet' }));
  const shut = signed(WORDS.bust({ x: 192, y: 214, cybEye: 'shut' }));
  const shutWithOpenEye = signed(WORDS.bust({ x: 192, y: 214, eye: 'open', cybEye: 'shut' }));
  const eye = violet[0] || {};
  const onEye = violet.length === 1 && eye.o === 'wave' && eye.f === 'FIRMADO.base' && eye.x > 192 &&
    Math.abs(eye.x - 192) <= 64 && Math.abs(eye.y - 214) <= 64 && Array.isArray(eye.h) && eye.h[0][1] === 9;
  const ok = onEye && shut.length === 0 && shutWithOpenEye.length === 0;
  return { ok, detail: { violet: violet.length, shut: shut.length, shutWithOpenEye: shutWithOpenEye.length, onEye } };
});

check('5 · bust: sq se recorta a [0.88, 1.12] (alto y bajo)', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const bust = WORDS.bust;
  const high = same(bust({ x: 192, y: 214, sq: [2, 0.2] }), bust({ x: 192, y: 214, sq: [1.12, 0.88] }));
  const low = same(bust({ x: 192, y: 214, sq: [0.5, 1.5] }), bust({ x: 192, y: 214, sq: [0.88, 1.12] }));
  const identity = same(bust({ x: 192, y: 214, sq: [1, 1] }), bust({ x: 192, y: 214 }));
  const effect = !same(bust({ x: 192, y: 214, sq: [1.12, 0.88] }), bust({ x: 192, y: 214 }));
  return { ok: high && low && identity && effect, detail: { high, low, identity, effect } };
});

check('6 · pureza de los dos fuentes: sin document, Date, Math.random, performance, fetch, localStorage ni literales de color', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const found = [];
  for (const file of [BESTIARY_PATH, WORLD_PATH]) {
    const source = readFileSync(file, 'utf8');
    const label = file.split('/').pop();
    for (const re of IMPURE) if (re.test(source)) found.push(label + ': ' + re.source);
    for (const re of COLOR_LITERAL) if (re.test(source)) found.push(label + ': color ' + re.source);
  }
  return { ok: found.length === 0, detail: found.length ? found : 'limpio' };
});

check('7 · PEGI: ninguna palabra ni texto contiene teeth, blood, crack, fire, skull, fang, knife', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const found = [];
  for (const name of ALL_WORDS) {
    for (const params of allParams(name)) {
      const text = (name + JSON.stringify(WORDS[name](clone(params)))).toLowerCase();
      for (const banned of PEGI_BANNED) if (text.includes(banned)) found.push(name + ':' + banned);
    }
  }
  return { ok: found.length === 0, detail: found.length ? found.slice(0, 10) : 'limpio' };
});

check('8 · si AtlasBubble existe: compile de un fotograma con las 14 palabras no lanza (si no, NO_DATA)', () => {
  if (!existsSync(CORE_PATH)) {
    return { ok: true, detail: 'NO_DATA: bubble_language.js aun no existe (AtlasBubble ausente); compile sin verificar' };
  }
  let core;
  try { core = require(CORE_PATH); } catch (e) { return { ok: false, detail: 'bubble_language.js no carga: ' + e.message }; }
  if (!core || typeof core.compile !== 'function') {
    return { ok: true, detail: 'NO_DATA: AtlasBubble sin compile() (API incompleta)' };
  }
  const m = missing(); if (m) return { ok: false, detail: m };
  const registered = typeof core.words === 'function' ? core.words() : [];
  if (typeof core.define === 'function') {
    for (const name of ALL_WORDS) if (!registered.includes(name)) core.define(name, WORDS[name]);
  }
  const frame = {
    v: 'preceptoros.bubble/1', id: 'CASOS', t: 0, cv: [412, 515], light: [-0.35, -0.94], style: 'volume',
    atoms: [{ k: 'casos', r: 'the fourteen words, one of each', i: ALL_WORDS.map((name) => ({ o: name, ...MINIMAL[name] })) }],
    bands: ['ink', 'paper', 'ocean', 'cyan', 'FIRMADO.base'], change: ['casos de palabras'],
    sound: 'NO_DATA', soundCause: 'casos: sin sonido', motion: 'NO_DATA',
  };
  const bytes = Buffer.byteLength(JSON.stringify(frame), 'utf8');
  if (bytes >= 1024) return { ok: false, detail: 'fotograma de ' + bytes + ' B (>= 1024)' };
  const items = core.compile(clone(frame));
  if (!Array.isArray(items)) return { ok: false, detail: 'compile no devuelve lista' };
  return { ok: true, detail: 'compile sin excepcion: ' + items.length + ' items; fotograma ' + bytes + ' B' };
});

check('9 · defaults de bust: r 64, rot 0, sq [1,1], eye/cybEye/mEye shut, mouth closed', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const implicit = WORDS.bust({ x: 192, y: 214 });
  const explicit = WORDS.bust({ x: 192, y: 214, r: 64, rot: 0, sq: [1, 1], eye: 'shut', cybEye: 'shut', mEye: 'shut', mouth: 'closed' });
  return { ok: same(implicit, explicit), detail: same(implicit, explicit) ? 'iguales' : 'distintos' };
});

check('10 · defaults de pile: n 7, r [18,30]', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const implicit = WORDS.pile({ x: [140, 300], y: [318, 420] });
  const explicit = WORDS.pile({ x: [140, 300], y: [318, 420], n: 7, r: [18, 30] });
  return { ok: same(implicit, explicit) && implicit.length === 7, detail: { cantos: implicit.length } };
});

check('11 · defaults de boing: n 2, arc 50', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const implicit = WORDS.boing({ x: 204, y: 250 });
  const explicit = WORDS.boing({ x: 204, y: 250, n: 2, arc: 50 });
  const arcs = implicit[0] || {};
  return { ok: same(implicit, explicit) && arcs.n === 2 && arcs.arc === 50, detail: { n: arcs.n, arc: arcs.arc } };
});

check('12 · defaults de crab: rr 40, dir 1, eye open', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const implicit = WORDS.crab({ x: 190, y: 282 });
  const explicit = WORDS.crab({ x: 190, y: 282, rr: 40, dir: 1, eye: 'open' });
  return { ok: same(implicit, explicit), detail: same(implicit, explicit) ? 'iguales' : 'distintos' };
});

check('13 · defaults de troop: r 12, ph 0', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const implicit = WORDS.troop({ x: 150, y: 330 });
  const explicit = WORDS.troop({ x: 150, y: 330, r: 12, ph: 0 });
  return { ok: same(implicit, explicit), detail: same(implicit, explicit) ? 'iguales' : 'distintos' };
});

check('14 · reef: primero el fondo de agua (ocean, borde cian 2.5, vaiven de ±6 px) y luego los corales', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const items = WORDS.reef({ x: [0, 96], y: [0, 515] });
  const water = items[0] || {};
  const pts = water.pts || [];
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const right = xs.filter((x) => x > 1);
  const isWater = water.o === 'ribbon' && water.closed === true && water.f === 'ocean' && water.s === 'cyan' && water.lw === 2.5;
  const coversX = pts.length > 0 && Math.min(...xs) >= -1e-6 && Math.max(...xs) <= 96 + 6 + 1e-6;
  const wobbles = right.length > 0 && Math.max(...right) - Math.min(...right) >= 2 &&
    Math.min(...right) >= 90 - 1e-6 && Math.max(...right) <= 102 + 1e-6;
  const coversY = pts.length > 0 && Math.min(...ys) <= 1e-6 && Math.max(...ys) >= 515 - 1e-6;
  const ok = isWater && coversX && wobbles && coversY && items.length >= 2;
  return { ok, detail: { isWater, coversX, wobbles, coversY, corales: items.length - 1 } };
});

check('15 · pile con seed: el canto i usa seed:i (distintos entre si); mismo seed, mismo derrumbe; otro seed, otro', () => {
  const m = missing(); if (m) return { ok: false, detail: m };
  const pile = (seed) => WORDS.pile({ x: [140, 300], y: [318, 420], seed });
  const a = pile('roca-a'), again = pile('roca-a'), other = pile('roca-b');
  const stones = a.filter((q) => q.o === 'blob');
  const seeded = stones.length === 7 && stones.every((q, i) => q.seed === 'roca-a:' + i);
  const repeat = same(a, again);
  const differs = !same(a, other);
  return { ok: seeded && repeat && differs, detail: { cantos: stones.length, seeded, repeat, differs } };
});

const ok = cases.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos: cases }));
process.exitCode = ok ? 0 : 1;
