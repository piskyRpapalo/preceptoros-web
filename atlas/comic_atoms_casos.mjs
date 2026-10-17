// W2 · atomos comic (decision mia, sin firma): modulo puro; colores solo desde AtlasComicTokens; sabotajes --sabotage-random, --sabotage-loop y --sabotage-color deben dar rojo.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const RUTA = fileURLToPath(new URL('../public/game/comic_atoms.js', import.meta.url));
const FUENTE_ORIGINAL = readFileSync(RUTA, 'utf8');
const K = require(fileURLToPath(new URL('../public/game/comic_tokens.js', import.meta.url)));
const M = require(RUTA);
const SAB_RANDOM = process.argv.includes('--sabotage-random');
const SAB_LOOP = process.argv.includes('--sabotage-loop');
const SAB_COLOR = process.argv.includes('--sabotage-color');
const fuente = SAB_RANDOM ? FUENTE_ORIGINAL + '\nMath.random();\n' : FUENTE_ORIGINAL;
const PERIODO = SAB_LOOP ? 15 : undefined;
const ENVOLTORIO_FIN = "})(typeof module === 'object' && module.exports ? this : (this || window));";
const PROHIBIDOS = [
  [/\bdocument\b/, 'document'], [/\bwindow\b/, 'window'], [/\bDate\b/, 'Date'], [/Math\.random/, 'Math.random'],
  [/\bperformance\b/, 'performance'], [/requestAnimationFrame/, 'requestAnimationFrame'], [/setTimeout/, 'setTimeout'],
  [/\bfetch\b/, 'fetch'], [/localStorage/, 'localStorage'], [/create(Linear|Radial)Gradient/, 'gradiente'],
  [/#[0-9a-fA-F]{3,8}\b/, 'hex'], [/rgba?\(/i, 'rgb('], [/magic/i, 'magic'],
];
const EJEMPLOS = [
  ['stamp', { seal: 'LIVE', text: 'Hola', x: 10, y: 10 }],
  ['badge', { seal: 'FIRMADO', value: 3, x: 40, y: 40, r: 24 }],
  ['button', { label: 'Ir', x: 0, y: 0, w: 120, h: 48, pressed: false }],
  ['chip', { seal: 'ERROR', label: 'v1', x: 5, y: 5 }],
];
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };

caso('1 cada kind conocido: items, read y sound NO_DATA con causa', () => {
  if (JSON.stringify(M.KINDS) !== JSON.stringify(['stamp', 'badge', 'button', 'chip'])) { return { KINDS: M.KINDS }; }
  const malos = EJEMPLOS.filter(([k, p]) => {
    const r = M.atom(k, p, 0);
    return !(r.kind === k && r.items.length > 0 && r.read.length > 0 && r.sound === 'NO_DATA' && typeof r.soundCause === 'string' && r.soundCause.length > 0);
  }).map(([k]) => k);
  return malos.length === 0 || { malos };
});

caso("2 kind 'xyz' -> NO_DATA con items y soundCause", () => {
  const r = M.atom('xyz', {}, 0);
  return (r.kind === 'NO_DATA' && r.items.length > 0 && typeof r.soundCause === 'string' && r.soundCause.length > 0) || r;
});

caso("3 button h=30 -> NO_DATA 'target < 44px'", () => {
  const r = M.atom('button', { label: 'Ir', x: 0, y: 0, w: 120, h: 30, pressed: false }, 0);
  return (r.kind === 'NO_DATA' && r.cause === 'target < 44px' && r.items.length > 0) || r;
});

caso('4 bucle: stamp LIVE cierra a t=16 y late (t=0 distinto de t=8); todos los kinds cierran a t=16', () => {
  const p = { seal: 'LIVE', text: 'Hola', x: 10, y: 10, _period: PERIODO };
  const j = (t) => JSON.stringify(M.atom('stamp', p, t));
  if (j(0) !== j(16)) { return { stamp_t0_t16: 'distinto' }; }
  if (j(0) === j(8)) { return { stamp_t0_t8: 'igual, no late' }; }
  const malos = EJEMPLOS.filter(([k, q]) => JSON.stringify(M.atom(k, { ...q, _period: PERIODO }, 0)) !== JSON.stringify(M.atom(k, { ...q, _period: PERIODO }, 16))).map(([k]) => k);
  return malos.length === 0 || { malos };
});

caso('5 reducedMotion: stamp LIVE queda fijo entre t=0 y t=8', () => {
  const p = { seal: 'LIVE', text: 'Hola', x: 10, y: 10, reducedMotion: true };
  return JSON.stringify(M.atom('stamp', p, 0)) === JSON.stringify(M.atom('stamp', p, 8)) || { t0_t8: 'distinto' };
});

caso('6 colores: todo fill/stroke sale de NEUTRAL o de bands de los 7 sellos', () => {
  const permitidos = [...Object.values(K.NEUTRAL), ...K.SEALS.flatMap((s) => Object.values(K.tone(s).bands))];
  const todos = [];
  for (const s of K.SEALS) {
    todos.push(...M.atom('stamp', { seal: s, text: 'x', x: 0, y: 0 }, 0).items);
    todos.push(...M.atom('badge', { seal: s, value: 1, x: 0, y: 0, r: 20 }, 0).items);
    todos.push(...M.atom('chip', { seal: s, label: 'x', x: 0, y: 0 }, 0).items);
  }
  todos.push(...M.atom('stamp', { seal: 'LIVE', text: 'x', x: 0, y: 0 }, 8).items);
  todos.push(...M.atom('button', { label: 'x', x: 0, y: 0, w: 80, h: 48, pressed: true }, 0).items);
  if (SAB_COLOR) { todos.push({ op: 'rect', x: 0, y: 0, w: 1, h: 1, fill: '#123456', stroke: null, lw: 0, shadow: null }); }
  const malos = todos.filter((it) => !permitidos.includes(it.fill) || (it.stroke != null && !permitidos.includes(it.stroke)));
  return malos.length === 0 || { malos: malos.map((it) => [it.op, it.fill, it.stroke]) };
});

caso('7 pureza: el fuente no contiene prohibidos (envoltorio UMD permitido una vez)', () => {
  const n = fuente.split(ENVOLTORIO_FIN).length - 1;
  if (n !== 1) { return { envoltorio_veces: n }; }
  const cuerpo = fuente.replace(ENVOLTORIO_FIN, '');
  const hallados = PROHIBIDOS.filter(([re]) => re.test(cuerpo)).map(([, nombre]) => nombre);
  return hallados.length === 0 || { hallados };
});

caso('8 boton: el texto queda en el centro de su caja', () => {
  const p = { label: 'Ir', x: 7, y: 9, w: 120, h: 48, pressed: false };
  const textos = M.atom('button', p, 0).items.filter((it) => it.op === 'text');
  if (textos.length !== 1) { return { textos: textos.length }; }
  const t = textos[0];
  return (t.x === p.x + p.w / 2 && t.y === p.y + p.h / 2 && t.align === 'center') || { x: t.x, y: t.y, align: t.align };
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
