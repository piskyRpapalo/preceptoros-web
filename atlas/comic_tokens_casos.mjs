// W1 · tokens comic (decision mia, sin firma): modulo puro; tonos solo desde AtlasSemantica.bandas; sabotajes --sabotage-hex, --sabotage-label y --sabotage-newcolor deben dar rojo.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const RUTA = fileURLToPath(new URL('../public/game/comic_tokens.js', import.meta.url));
const RAIZ_PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const FUENTE_ORIGINAL = readFileSync(RUTA, 'utf8');
const T = require(RUTA);
const A = require(fileURLToPath(new URL('../public/game/tabla_semantica.js', import.meta.url)));
const SAB_HEX = process.argv.includes('--sabotage-hex');
const SAB_LABEL = process.argv.includes('--sabotage-label');
const SAB_NEWCOLOR = process.argv.includes('--sabotage-newcolor');
const fuente = SAB_HEX ? FUENTE_ORIGINAL + "\nconst colorIntruso = '#00b7d4';\n" : FUENTE_ORIGINAL;
const tone = (s) => T.tone(s);
const ENVOLTORIO_FIN = "})(typeof module === 'object' && module.exports ? this : (this || window));";
const PROHIBIDOS = [
  [/\bdocument\b/, 'document'], [/\bwindow\b/, 'window'], [/\bDate\b/, 'Date'], [/Math\.random/, 'Math.random'],
  [/\bperformance\b/, 'performance'], [/\bfetch\b/, 'fetch'], [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\blocalStorage\b/, 'localStorage'], [/\bsetTimeout\b/, 'setTimeout'], [/\bcyan\b(?!\s*:)/i, 'cyan'], [/00b7d4/i, '00b7d4'],
];
// Corpus servido: css/js/html bajo public/, sin el propio modulo de tokens (decision mia: solo lectura, sin cache).
function ficherosServidos(dir) {
  const out = [];
  for (const nombre of readdirSync(dir)) {
    const p = join(dir, nombre);
    if (statSync(p).isDirectory()) { out.push(...ficherosServidos(p)); }
    else if (/\.(css|js|html)$/.test(nombre) && resolve(p) !== resolve(RUTA)) { out.push(p); }
  }
  return out;
}
const CORPUS = ficherosServidos(RAIZ_PUBLIC).map((p) => readFileSync(p, 'utf8').toLowerCase());
const VALORES_NEUTRAL = SAB_NEWCOLOR ? [...Object.values(T.NEUTRAL), '#123456'] : Object.values(T.NEUTRAL);
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };

caso('los 7 sellos devuelven las bandas de AtlasSemantica.bandas para su hue', () => {
  if (T.SEALS.length !== 7) { return { sellos: T.SEALS }; }
  const malos = [];
  for (const s of T.SEALS) {
    const r = tone(s);
    const ref = A.bandas(A.TABLA[s], A.SAT, A.LUZ);
    for (const k of ['h', 'brillo', 'base', 'sombra', 'contorno']) {
      if (!r.bands || r.bands[k] !== ref[k]) { malos.push(s + '.' + k); }
    }
  }
  return malos.length === 0 || { malos };
});

caso("tone('XYZ') devuelve NO_DATA con causa y bands null", () => {
  const r = tone('XYZ');
  return (r.seal === 'NO_DATA' && r.label === 'NO_DATA' && typeof r.cause === 'string' && r.cause.length > 0 && r.bands === null) || r;
});

caso('todo tone() trae label no vacio', () => {
  const emite = SAB_LABEL ? (s) => ({ ...tone(s), label: '' }) : tone;
  const sinLabel = [...T.SEALS, 'XYZ'].filter((s) => {
    const l = emite(s).label;
    return typeof l !== 'string' || l.length === 0;
  });
  return sinLabel.length === 0 || { sinLabel };
});

caso('pureza: el fuente no contiene ningun token prohibido', () => {
  const n = FUENTE_ORIGINAL.split(ENVOLTORIO_FIN).length - 1;
  if (n !== 1) { return { envoltorio_veces: n }; }
  const cuerpo = FUENTE_ORIGINAL.replace(ENVOLTORIO_FIN, '');
  const hallados = PROHIBIDOS.filter(([re]) => re.test(cuerpo)).map(([, nombre]) => nombre);
  return hallados.length === 0 || { hallados };
});

caso('solo cuatro literales de color, los de NEUTRAL (hex o rgb)', () => {
  const lits = fuente.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/gi) || [];
  const hallados = lits.map((v) => v.toLowerCase()).sort();
  const esperados = ['#00d2ff', '#1e1826', '#f2f5f7', 'rgb(5,8,18)'];
  return (lits.length === 4 && JSON.stringify(hallados) === JSON.stringify(esperados)) || { literales: lits };
});

caso('sin color nuevo: cada valor de NEUTRAL aparece en public/ (css/js/html) fuera de comic_tokens.js', () => {
  const sinHallar = VALORES_NEUTRAL.filter((v) => !CORPUS.some((t) => t.includes(v.toLowerCase())));
  return sinHallar.length === 0 || { sinHallar };
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
