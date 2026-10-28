// Lote 1 del lenguaje de burbujas: primitivas deterministas (bb_det.js) y forma de Fourier (bb_forma.js).
// Cada caso compara contra una referencia INDEPENDIENTE (BigInt), no contra el mismo codigo.
// Uso: node atlas/bb_lote1_casos.mjs   -> [{caso, ok, detalle}] ; exit 0 solo si todos pasan.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const D = require('../public/game/bb_det.js');
const F = require('../public/game/bb_forma.js');
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}

// Referencia independiente: xorshift32 con BigInt y mascara de 32 bits.
function xorshiftRef(semilla, n) {
  const M = (1n << 32n) - 1n;
  let x = BigInt(semilla >>> 0) || 0x9E3779B9n, salida = [];
  for (let i = 0; i < n; i++) {
    x = (x ^ ((x << 13n) & M)) & M;
    x = (x ^ (x >> 17n)) & M;
    x = (x ^ ((x << 5n) & M)) & M;
    salida.push(Number(x));
  }
  return salida;
}
// Referencia independiente del hash CANON (a ^ b*73856093 ^ c*19349663, luego xorshift 13,17,5), en BigInt.
function hashRef(a, b, c = 0) {
  const M = (1n << 32n) - 1n;
  let x = (BigInt(a) & M) ^ ((BigInt(b) * 73856093n) & M) ^ ((BigInt(c) * 19349663n) & M);
  x = (x ^ ((x << 13n) & M)) & M;
  x = (x ^ (x >> 17n)) & M;
  x = (x ^ ((x << 5n) & M)) & M;
  return Number(x);
}

caso('xorshift32 coincide con la referencia BigInt en 1000 pasos (semilla 1 y 0xDEADBEEF)', () => {
  for (const s of [1, 0xDEADBEEF]) {
    const st = D.crea(s), ref = xorshiftRef(s, 1000);
    for (let i = 0; i < 1000; i++) { const v = D.siguiente(st); if (v !== ref[i]) return `semilla ${s} paso ${i}: ${v} != ${ref[i]}`; }
  }
  return true;
});

caso('semilla 0 se sustituye por la fija (xorshift no sale de 0)', () => {
  const st = D.crea(0);
  return st.x === D.SEMILLA_CERO && D.siguiente(st) !== 0 || 'la semilla 0 quedo atascada';
});

caso('misma semilla, misma secuencia (determinismo)', () => {
  const a = D.crea(42), b = D.crea(42);
  for (let i = 0; i < 500; i++) if (D.siguiente(a) !== D.siguiente(b)) return 'divergen en paso ' + i;
  return true;
});

caso('uniforme cae en [0,1) y su media esta cerca de 0.5 (10000 muestras)', () => {
  const st = D.crea(7); let suma = 0;
  for (let i = 0; i < 10000; i++) { const u = D.uniforme(st); if (!(u >= 0 && u < 1)) return 'fuera de [0,1): ' + u; suma += u; }
  const media = suma / 10000;
  return Math.abs(media - 0.5) < 0.01 || `media ${media.toFixed(4)}`;
});

caso('hash canon coincide con la referencia BigInt en una rejilla 64x64 (c=0 y c=7)', () => {
  for (let a = 0; a < 64; a++) for (let b = 0; b < 64; b++) for (const c of [0, 7]) {
    if (D.hash(a, b, c) !== hashRef(a, b, c)) return `celda (${a},${b},${c}): ${D.hash(a, b, c)} != ${hashRef(a, b, c)}`;
  }
  return true;
});

caso('hash canon casi no colisiona en una rejilla 100x100 (>= 99.9% distintos)', () => {
  const vistos = new Set(); let n = 0;
  for (let a = 0; a < 100; a++) for (let b = 0; b < 100; b++) { vistos.add(D.hash(a, b, 0)); n++; }
  const frac = vistos.size / n;
  return frac >= 0.999 || `solo ${(frac * 100).toFixed(2)}% distintos`;
});

caso('elige: frecuencias ~ pesos (1,3) -> 25% / 75% en 40000 tiradas (tolerancia 1.5 puntos)', () => {
  const st = D.crea(99); const c = [0, 0];
  for (let i = 0; i < 40000; i++) c[D.elige(st, [1, 3])]++;
  const p0 = c[0] / 40000;
  return Math.abs(p0 - 0.25) < 0.015 || `p0=${p0.toFixed(4)}`;
});

caso('elige sin peso positivo devuelve -1 (NO_DATA, no se inventa indice)', () => {
  const st = D.crea(1);
  return D.elige(st, [0, 0, 0]) === -1 && D.elige(st, []) === -1 || 'devolvio un indice sin peso';
});

caso('forma de Fourier: un solo termino k=1, a=1, fase 0 es r(theta)=sin(theta)', () => {
  for (const th of [0, 0.5, 1.2, 2.9, 4.4]) {
    const r = F.radio([[1, 1, 0]], th);
    if (Math.abs(r - Math.sin(th)) > 1e-12) return `theta=${th}: ${r}`;
  }
  return true;
});

caso('forma de Fourier: el primer punto es (r(0),0) y el contorno cierra (k enteros: periodico en 2pi)', () => {
  const T = [[2, 0.3, 0.1], [3, 0.2, 1.0]];
  const pts = F.contorno(T, 64);
  if (pts.length !== 64) return `puntos ${pts.length}`;
  const r0 = F.radio(T, 0);
  if (Math.abs(pts[0].x - r0) > 1e-12 || Math.abs(pts[0].y) > 1e-12) return `primer punto ${pts[0].x},${pts[0].y} != (${r0},0)`;
  const cierre = Math.abs(F.radio(T, 2 * Math.PI) - r0);
  return cierre < 1e-9 || `no cierra: diferencia ${cierre}`;
});

caso('sin terminos con amplitud > 0 no hay forma: contorno devuelve null (NO_DATA)', () => {
  return F.contorno([], 16) === null && F.contorno([[1, 0, 0]], 16) === null || 'invento una forma sin datos';
});

caso('el color sale de la tabla fisica: LIVE hue 120', () => {
  const c = F.colorDe('LIVE');
  return (c && c.hue === 120) || 'LIVE no dio hue 120: ' + JSON.stringify(c);
});

caso('un sello fuera de la tabla no tiene color (nunca se inventa)', () => {
  return F.colorDe('INVENTADO') === null || 'invento color para un sello desconocido';
});

caso('no hay Math.random ni Date.now en el lote (canon 2026-10-03)', () => {
  for (const f of ['public/game/bb_det.js', 'public/game/bb_forma.js']) {
    const t = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    if (/Math\.random|Date\.now|performance\.now/.test(t)) return f + ' usa azar o reloj';
  }
  return true;
});

caso('cada fichero del lote <= 16384 B', () => {
  for (const f of ['public/game/bb_det.js', 'public/game/bb_forma.js']) {
    const n = readFileSync(new URL('../' + f, import.meta.url)).byteLength;
    if (n > 16384) return f + ' pesa ' + n;
  }
  return true;
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
