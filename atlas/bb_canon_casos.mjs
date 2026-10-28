// Registro del canon del lenguaje de burbujas (docs/canon-bubble-math.md). Cada caso compara contra un vector
// generado EJECUTANDO el codigo original (atlas/fixtures/bb_canon_vectores.json), no contra mi reimplementacion.
// Uso: node atlas/bb_canon_casos.mjs  -> [{caso, ok, detalle}] ; exit 0 solo si todos pasan.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const C = require('../public/game/bb_canon.js');
const T = require('../public/game/tabla_semantica.js');
const V = JSON.parse(readFileSync(new URL('./fixtures/bb_canon_vectores.json', import.meta.url), 'utf8'));
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}

caso('hash canon = vectores del original (' + V.hash.length + ' entradas)', () => {
  for (const v of V.hash) if (C.hash(v.a, v.b, v.c) !== v.h) return `hash(${v.a},${v.b},${v.c}) = ${C.hash(v.a, v.b, v.c)} != ${v.h}`;
  return true;
});

caso('cosecha canon = vectores del original (' + V.cosecha.length + ' entradas, seed y outcome)', () => {
  for (const v of V.cosecha) {
    const r = C.cosecha({ vertices: v.vertices, spectrum: v.spectrum, valve: v.valve, selected: v.selected });
    if (r.seed !== v.seed || r.outcome !== v.outcome) return `${JSON.stringify(v)} -> ${JSON.stringify(r)}`;
  }
  return true;
});

caso('la cosecha reparte PENETRATES y FILTERED (ninguno de los dos vacio)', () => {
  const sal = V.cosecha.map((v) => v.outcome);
  return (sal.includes('PENETRATES') && sal.includes('FILTERED')) || 'un solo resultado en todas las entradas';
});

caso('la fuente de los vectores es el render_seed.js con el sha256 registrado', () => {
  return V.sha256 === 'b909dc1e41f0ca5cb81ed3adf220c9e0217fc4da892e7e457725e3b5a424765c' || 'sha256 distinto: ' + V.sha256;
});

const SIETE = ['LIVE', 'PROPUESTA', 'FIRMADO', 'ERROR', 'NO_DATA', 'SIMULATED', 'STALE'];
caso('la tabla visual tiene exactamente los siete estados', () => {
  const k = Object.keys(T.VISUAL).sort().join(',');
  return k === [...SIETE].sort().join(',') || 'estados: ' + k;
});

caso('los siete estados fisicos conservan su hue (extension aditiva, nada cambiado)', () => {
  const hues = { LIVE: 120, PROPUESTA: 45, FIRMADO: 270, ERROR: 0, NO_DATA: 240, SIMULATED: 30, STALE: 60 };
  for (const s of SIETE) if (T.hueDe(s) !== hues[s]) return `${s}: ${T.hueDe(s)} != ${hues[s]}`;
  return true;
});

caso('cada estado visual tiene saturation, lightness, waveAmplitude, feedbackAlpha y pulseActive', () => {
  for (const s of SIETE) {
    const v = T.visual(s);
    for (const campo of ['saturation', 'lightness', 'waveAmplitude', 'feedbackAlpha', 'pulseActive']) {
      if (!(campo in v)) return `${s} sin ${campo}`;
    }
  }
  return true;
});

caso('NO_DATA es silencio visual: onda 0 y sin pulso', () => {
  const v = T.visual('NO_DATA');
  return (v.waveAmplitude === 0 && v.pulseActive === false) || 'NO_DATA no es silencio: ' + JSON.stringify(v);
});

caso('un sello fuera de la tabla no tiene visual (nunca se inventa)', () => {
  return T.visual('INVENTADO') === null || 'invento visual para un sello desconocido';
});

caso('PROPUESTA es el nombre fisico; el alias del mockup no entra en la tabla', () => {
  return !('PROPUESTA_PENDIENTE_FIRMA' in T.VISUAL) || 'alias en la tabla';
});

caso('la formula de cosecha queda registrada como texto', () => {
  return C.FORMULA_COSECHA.includes('40 + 3v + 10·valve') || 'formula sin registrar';
});

caso('sin Math.random ni Date.now en el canon ni en la tabla', () => {
  for (const f of ['public/game/bb_canon.js', 'public/game/tabla_semantica.js', 'public/game/bb_det.js']) {
    const t = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    if (/Math\.random|Date\.now|performance\.now/.test(t)) return f + ' usa azar o reloj';
  }
  return true;
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
