// bubble_language · casos del nucleo, preceptoros.bubble/1 (decision mia, sin firma).
// Rojo primero: sin public/game/bubble_language.js todos los casos fallan y rc=1.
// Salida: una linea JSON {ok, casos}; rc=0 solo si todos pasan.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const DIR = fileURLToPath(new URL('../public/game/', import.meta.url));
const V = 'preceptoros.bubble/1';
const casos = [];
let nota = '';
let B = null;
let cargaError = '';
try { B = require(DIR + 'bubble_language.js'); } catch (e) { cargaError = String(e.message).split('\n')[0]; }

const json = (x) => JSON.stringify(x);
const marco = (atoms, extra) => ({ v: V, id: 'T', atoms, ...(extra || {}) });
const ROCA = { o: 'blob', x: 200, y: 220, rx: 118, ry: 100, seed: 'rock', f: 'paper', s: 'ink', d: 0 };
const BLOB = (extra) => marco([{ k: 'roca', i: [{ ...ROCA, ...(extra || {}) }] }]);
const TEXTO = (tx) => ({ o: 'text', x: 50, y: 50, tx, sz: 16, f: 'ink' });
const grupo = (lista, o) => lista.find((g) => g.o === o);

function recorre(lista, fn) {
  for (const it of lista) { fn(it); if (Array.isArray(it.items)) recorre(it.items, fn); }
}
function textos(lista) {
  const out = [];
  recorre(lista, (it) => { if (it.op === 'text') out.push(it.text); });
  return out;
}
// Prueba de punto en poligono y distancia al contorno, escritas aqui de nuevo a proposito (independientes).
function dentro(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  }
  return c;
}
function distancia(x, y, p) {
  let mejor = Infinity;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [ax, ay] = p[j];
    const [bx, by] = p[i];
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    const t = l > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0;
    mejor = Math.min(mejor, Math.hypot(ax + t * dx - x, ay + t * dy - y));
  }
  return mejor;
}
// Mezcla con las primitivas de la seccion 3: wave, blob, ribbon, arcs, cuatro campos, wall y text.
function mezcla() {
  return marco([
    { k: 'roca', r: 'a stone', i: [{ o: 'wave', x: 60, y: 90, sc: 0.5, rot: 10, h: [[1, 24, 24, 0], [5, 2, 2, 3]], f: 'paper', s: 'ink', d: 0 }] },
    { k: 'piedra', r: 'a rock', i: [{ ...ROCA, rough: 0.4, rot: 15 }] },
    { k: 'alga', r: 'kelp', i: [{ o: 'ribbon', pts: [[20, 300], [60, 260], [30, 220], [70, 180]], s: 'cyan', lw: 2, d: 1 }] },
    { k: 'arcos', r: 'boing', i: [{ o: 'arcs', x: 300, y: 120, r: [14, 26], n: 3, arc: 50, ph: 200, s: 'ink', d: 1 }] },
    { k: 'agua', r: 'water', i: [
      { o: 'field', kind: 'halftone', x: [0, 412], y: [260, 515], r: '5|3|1.5|0', step: 12, a: 45, f: 'cyan' },
      { o: 'field', kind: 'bubbles', x: 340, y: 480, n: 3, h: 200, r: [4, 10], seed: 'b' },
      { o: 'field', kind: 'snow', n: 20, f: 'paper' },
      { o: 'field', kind: 'school', x: [20, 380], y: [60, 200], n: 3, s: 'cyan' }] },
    { k: 'muro', r: 'cliff', i: [{ o: 'wall', x: [0, 412], y: [0, 515], side: 'left', tilt: 8, seed: 'mu', per: 120, vein: 3, lip: 'round', f: 'paper', s: 'ink', d: 0 }] },
    { k: 'rotulo', r: 'label', i: [{ o: 'text', x: 200, y: 40, tx: 'ABKU', sz: 22, w: 120, rot: -4, sh: [2, 2, 'ink'], f: 'vermilion.base' }] },
  ], { id: 'MEZCLA' });
}

function check(nombre, fn) {
  let res;
  nota = '';
  if (!B) { res = 'modulo ausente: ' + cargaError; }
  else { try { res = fn(); } catch (e) { res = 'excepcion: ' + (e && e.message ? e.message : e); } }
  casos.push({ caso: nombre, ok: res === true, detalle: res === true ? nota : String(res) });
}

check('hash32: vectores FNV-1a; rng en [0,1), repetible por clave y distinto entre claves', () => {
  if (B.hash32('') !== 0x811c9dc5) return 'hash32("") = ' + B.hash32('');
  if (B.hash32('a') !== 0xe40c292c) return 'hash32("a") = ' + B.hash32('a').toString(16);
  const seq = (k) => { const r = B.rng(k); return Array.from({ length: 1000 }, () => r()); };
  const s1 = seq('clave');
  if (!s1.every((v) => v >= 0 && v < 1)) return 'rng fuera de [0,1)';
  if (json(s1) !== json(seq('clave'))) return 'misma clave, secuencia distinta';
  if (json(s1) === json(seq('otra'))) return 'claves distintas, misma secuencia';
  return true;
});

check('wavePoints: usa AtlasGacha.punto; punto 0 de [[1,24,24,0]] = [24,0]; n por defecto 96', () => {
  const G = require(DIR + 'gacha.js');
  const h = [[1, 24, 24, 0]];
  const p = B.wavePoints(h);
  if (p.length !== 96) return 'n por defecto = ' + p.length;
  if (json(p[0]) !== json([24, 0])) return 'punto 0 = ' + json(p[0]);
  for (let i = 0; i < 96; i++) {
    if (json(p[i]) !== json(G.punto(h, (2 * Math.PI * i) / 96))) return 'difiere de punto en i=' + i;
  }
  return true;
});

check('blob: rough 10 cumple sum k*a_k <= 0.45*min(rx,ry) y no se pliega (medido)', () => {
  const g = grupo(B.compile(BLOB({ rough: 10 })), 'blob');
  if (!g || !g.bound) return 'sin grupo blob con bound';
  const { sum, limit } = g.bound;
  nota = `suma=${sum} techo=${limit} (min(rx,ry)=100)`;
  if (!(sum <= 0.45 * 100 + 1e-9) || Math.abs(limit - 45) > 1e-9) return 'cota: ' + json(g.bound);
  const minR = Math.min(...g.contour.map((p) => Math.hypot(p[0] - 200, p[1] - 220)));
  nota += ` radio_min=${minR.toFixed(2)}`;
  return minR >= 55 - 1e-6 || 'radio minimo ' + minR;
});

check('determinismo: dos compilaciones del mismo marco dan JSON identico, sin notas', () => {
  const fr = mezcla();
  const a = B.compile(fr);
  if (B.compile.notes.length) return 'notas: ' + json(B.compile.notes);
  const b = B.compile(fr);
  if (json(a) !== json(b)) return 'compilaciones distintas';
  nota = `bytes=${json(a).length} grupos=${a.length}`;
  return true;
});

check('campos: los cinco tipos compilan sin NO_DATA y son deterministas', () => {
  const fr = marco([{ k: 'agua', i: [
    { o: 'field', kind: 'halftone', f: 'cyan' },
    { o: 'field', kind: 'bubbles', x: 300, y: 400, seed: 'b' },
    { o: 'field', kind: 'snow', n: 30, seed: 's', f: 'paper' },
    { o: 'field', kind: 'phyllo', x: 200, y: 300, n: 40, c: 5, r: 4, f: 'paper' },
    { o: 'field', kind: 'school', x: [20, 380], y: [60, 200], n: 4, seed: 'f' }] }]);
  const out = B.compile(fr);
  if (B.compile.notes.length) return 'notas: ' + json(B.compile.notes);
  if (out.length !== 5 || out.some((g) => g.o !== 'field')) return 'grupos: ' + out.length;
  if (json(out) !== json(B.compile(fr))) return 'no determinista';
  return true;
});

check('colores: todo fill/stroke es literal de band(); band("nope") lanza unknown band', () => {
  const permitidos = new Set();
  const add = (n) => permitidos.add(B.band(n));
  ['ink', 'paper', 'ocean', 'cyan'].forEach(add);
  const SUB = ['brillo', 'base', 'sombra', 'contorno'];
  const SEM = require(DIR + 'tabla_semantica.js');
  const ACC = require(DIR + 'comic_accents.js').ACCENTS;
  ['vermilion', 'comic yellow', ...Object.keys(SEM.TABLA)].forEach((h) => SUB.forEach((s) => add(h + '.' + s)));
  let n = 0;
  const malos = [];
  recorre(B.compile(mezcla()), (it) => {
    for (const c of ['fill', 'stroke']) {
      if (typeof it[c] === 'string') { n++; if (!permitidos.has(it[c])) malos.push(it[c]); }
    }
  });
  if (malos.length) return 'fuera de band(): ' + malos.slice(0, 3).join(' | ');
  if (n < 20) return 'pocos colores (' + n + '): caso vacuo';
  if (B.band('FIRMADO.base') !== SEM.bandas(SEM.TABLA.FIRMADO, SEM.SAT, SEM.LUZ).base) return 'FIRMADO.base no es la banda semantica';
  if (B.band('comic yellow.brillo') !== ACC['comic yellow'].bands.brillo) return 'comic yellow.brillo no es el acento';
  let lanza = false;
  try { B.band('nope'); } catch (e) { lanza = /unknown band: nope/.test(e.message); }
  return lanza || 'band("nope") no lanza unknown band';
});

check('luz: volume con medio tono dentro y a >= 3 px del contorno; clear sin puntos; etch con rayado y sin puntos', () => {
  const g = (style) => grupo(B.compile(marco([{ k: 'roca', i: [{ ...ROCA }] }], { style })), 'blob');
  const v = g('volume');
  const puntos = v.items.filter((it) => it.tag === 'dot');
  if (!puntos.length) return 'volume sin puntos de medio tono';
  const malos = puntos.filter((p) => !dentro(p.x, p.y, v.contour) || distancia(p.x, p.y, v.contour) < 3);
  if (malos.length) return malos.length + ' puntos fuera del contorno o a menos de 3 px';
  if (g('clear').items.some((it) => it.tag === 'dot')) return 'clear tiene puntos';
  const e = g('etch');
  if (e.items.some((it) => it.tag === 'dot')) return 'etch tiene puntos';
  const rayas = e.items.filter((it) => it.tag === 'hatch').length;
  if (!rayas) return 'etch sin rayado';
  nota = `puntos=${puntos.length} rayas_etch=${rayas}`;
  return true;
});

check('profundidad 2: sin relleno ni luz, trazo cyan 2.5', () => {
  const gr = grupo(B.compile(BLOB({ d: 2 })), 'blob');
  if (!gr || !gr.items.length) return 'sin items';
  const cian = B.band('cyan');
  const malos = gr.items.filter((it) => it.fill != null || it.stroke !== cian || it.lw !== 2.5 || it.tag);
  return malos.length ? 'no conformes: ' + json(malos).slice(0, 160) : true;
});

check('pureza: los dos fuentes sin document, Date, Math.random, performance, fetch, localStorage ni literales de color', () => {
  const PROHIBIDOS = [
    [/\bdocument\b/, 'document'], [/\bDate\b/, 'Date'], [/Math\.random/, 'Math.random'],
    [/\bperformance\b/, 'performance'], [/\bfetch\b/, 'fetch'], [/\blocalStorage\b/, 'localStorage'],
    [/#[0-9a-fA-F]{3,8}\b/, 'literal hex'], [/\brgb\s*\(/, 'rgb('], [/\bhsl\s*\(/, 'hsl('],
  ];
  const malos = [];
  for (const f of ['bubble_language.js', 'bubble_light.js']) {
    const src = readFileSync(DIR + f, 'utf8');
    for (const [re, nombre] of PROHIBIDOS) if (re.test(src)) malos.push(f + ':' + nombre);
  }
  return malos.length ? malos.join(', ') : true;
});

check('sabotaje: f "#123456" hace lanzar a compile; blob con rough 50 cumple la cota', () => {
  let lanza = false;
  try { B.compile(BLOB({ f: '#123456' })); } catch (e) { lanza = /unknown band/.test(e.message); }
  if (!lanza) return 'no lanzo con banda desconocida';
  const g = grupo(B.compile(BLOB({ rough: 50 })), 'blob');
  if (!g || !g.bound) return 'sin bound';
  nota = `suma=${g.bound.sum} techo=${g.bound.limit}`;
  if (g.bound.sum > g.bound.limit + 1e-9) return 'cota rota con rough 50';
  const minR = Math.min(...g.contour.map((p) => Math.hypot(p[0] - 200, p[1] - 220)));
  return minR >= 55 - 1e-6 || 'se pliega: radio minimo ' + minR;
});

check('semilla: con item.seed la clave es solo la semilla; la misma roca en dos secciones da la misma forma antes de x/y', () => {
  const A = marco([{ k: 'roca', i: [{ ...ROCA, x: 200, y: 220 }] }], { id: 'CLIFF' });
  const S = marco([{ k: 'x', i: [TEXTO('x')] }, { k: 'roca', i: [{ ...ROCA, x: 300, y: 100 }] }], { id: 'OTRA' });
  const ga = grupo(B.compile(A), 'blob'), gs = grupo(B.compile(S), 'blob');
  // Sin rot, el contorno es la forma base trasladada: restar (x, y) debe dar la misma forma.
  const base = (g, x, y) => g.contour.map((p) => [p[0] - x, p[1] - y]);
  const ba = base(ga, 200, 220), bs = base(gs, 300, 100);
  const dif = Math.max(...ba.map((p, i) => Math.max(Math.abs(p[0] - bs[i][0]), Math.abs(p[1] - bs[i][1]))));
  nota = 'dif_max=' + dif.toExponential(2);
  if (!(dif < 1e-6)) return 'misma semilla, forma distinta entre secciones (dif ' + dif + ')';
  if (json(ga.bound) !== json(gs.bound)) return 'bound distinto entre secciones';
  const gc = grupo(B.compile(BLOB({ seed: 'otra' })), 'blob');
  if (json(base(gc, 200, 220)) === json(ba)) return 'semillas distintas, misma forma';
  return true;
});

check('defectos: marco (cv, light, style), d=0, halftone, bubbles y wall como en la spec y el coordinador', () => {
  const sinDef = { v: V, id: 'T', atoms: [{ k: 'roca', i: [{ o: 'blob', x: 200, y: 220, rx: 118, ry: 100, seed: 'rock', f: 'paper', s: 'ink' }] }] };
  const conDef = { v: V, id: 'T', cv: [412, 515], light: [-0.35, -0.94], style: 'volume', atoms: [{ k: 'roca', i: [{ o: 'blob', x: 200, y: 220, rx: 118, ry: 100, seed: 'rock', f: 'paper', s: 'ink', d: 0, rough: 0.25 }] }] };
  const en = (it) => ({ v: V, id: 'T', atoms: [{ k: 'f', i: [it] }] });
  const pares = {
    'marco y blob': [sinDef, conDef],
    halftone: [
      en({ o: 'field', kind: 'halftone', f: 'cyan' }),
      en({ o: 'field', kind: 'halftone', x: [0, 412], y: [0, 515], r: '5|3|1.5|0', step: 12, a: 45, f: 'cyan' })],
    bubbles: [
      en({ o: 'field', kind: 'bubbles', x: 300, y: 400, seed: 'b' }),
      en({ o: 'field', kind: 'bubbles', x: 300, y: 400, seed: 'b', n: 3, h: 200, r: [4, 10] })],
    wall: [
      en({ o: 'wall', x: [0, 412], y: [0, 515], seed: 'mu', f: 'paper', s: 'ink' }),
      en({ o: 'wall', x: [0, 412], y: [0, 515], seed: 'mu', f: 'paper', s: 'ink', side: 'right', lip: 'round', tilt: 0, per: 0, vein: 0 })],
  };
  for (const [nombre, [a, b]] of Object.entries(pares)) {
    if (json(B.compile(a)) !== json(B.compile(b))) return 'defecto distinto en ' + nombre;
  }
  return true;
});

const SECCION_A = marco([{ k: 'x', i: [TEXTO('X')] }, { k: 'z', i: [TEXTO('Z')] }, { k: 'y', i: [TEXTO('Y')] }], { id: 'A' });
const MAIN = (k) => ({ v: V, id: 'MAIN', prev: { A: SECCION_A }, atoms: [{ k: 'mix', i: [{ o: 'keep', k }] }] });

check('keep "A:x|y" repite solo esos atomos, en su orden original', () => {
  const t = textos(B.compile(MAIN('A:x|y')));
  return json(t) === json(['X', 'Y']) || 'da ' + json(t);
});

check('keep "A" repite la seccion entera, identica a compilarla sola', () => {
  const todo = B.compile(MAIN('A'));
  if (json(textos(todo)) !== json(['X', 'Z', 'Y'])) return 'textos ' + json(textos(todo));
  return json(todo) === json(B.compile(SECCION_A)) || 'no identica a la compilacion propia';
});

check('keep anidado: un atomo reusado con keep propio tambien se resuelve', () => {
  const prev = {
    A: { v: V, id: 'A', atoms: [{ k: 'x', i: [{ o: 'keep', k: 'B' }] }] },
    B: { v: V, id: 'B', atoms: [{ k: 'b', i: [TEXTO('BB')] }] },
  };
  const t = textos(B.compile({ v: V, id: 'MAIN', prev, atoms: [{ k: 'mix', i: [{ o: 'keep', k: 'A:x' }] }] }));
  return json(t) === json(['BB']) || 'da ' + json(t);
});

check('keep sin prev o con seccion desconocida: no pinta y anota NO_DATA en compile.notes', () => {
  const sinPrev = B.compile({ v: V, id: 'MAIN', atoms: [{ k: 'mix', i: [{ o: 'keep', k: 'A' }] }] });
  if (sinPrev.length || !B.compile.notes.some((n) => /NO_DATA/.test(n.cause))) return 'sin prev pinto ' + sinPrev.length;
  const desconocida = B.compile(MAIN('Q'));
  if (desconocida.length || !B.compile.notes.some((n) => n.o === 'keep' && /NO_DATA/.test(n.cause))) return 'seccion Q pinto ' + desconocida.length;
  return true;
});

check('define/words: una palabra expande a primitivas; las primitivas no se redefinen', () => {
  B.define('pareja', (it) => [
    { o: 'arcs', x: it.x, y: it.y, r: [10, 10], n: 2, arc: 60, ph: 0, s: 'ink', d: 0 },
    { o: 'arcs', x: it.x, y: it.y, r: [20, 20], n: 2, arc: 60, ph: 180, s: 'ink', d: 0 },
  ]);
  if (!B.words().includes('pareja')) return 'words() sin pareja';
  const out = B.compile(marco([{ k: 'p', i: [{ o: 'pareja', x: 100, y: 100 }] }]));
  if (out.length !== 2 || out.some((g) => g.o !== 'arcs')) return 'expansion: ' + out.length + ' grupos';
  let lanza = false;
  try { B.define('wave', () => []); } catch (e) { lanza = true; }
  return lanza || 'define("wave") no lanzo';
});

check('smoothPath: cerrado acaba en Z con n curvas C; abierto no', () => {
  const p = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const c = B.smoothPath(p, true);
  const o = B.smoothPath(p, false);
  const cuenta = (s, ch) => s.split(ch).length - 1;
  if (!c.endsWith('Z') || cuenta(c, 'C') !== 4) return 'cerrado: ' + c;
  if (o.endsWith('Z') || cuenta(o, 'C') !== 3) return 'abierto: ' + o;
  return true;
});

const ok = casos.length > 0 && casos.every((c) => c.ok);
console.log(json({ ok, casos }));
process.exitCode = ok ? 0 : 1;
