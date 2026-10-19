// VT9 (2/2) · barrido de graficos antiguos como trinquete: todo lo visual se dice con el
// vocabulario de la casa (las bandas de comic_tokens, comic_accents y tabla_semantica).
// Un color crudo (#hex, rgb(), hsl()) fuera de esas piezas es un grafico heredado.
// El libro atlas/barrido_vocabulario.json fija la cuenta de hoy por pieza; solo puede bajar.
//   node atlas/barrido_casos.mjs -> {resumen, casos}
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('../', import.meta.url).pathname;
const CRUDO = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
const libro = JSON.parse(readFileSync(join(RAIZ, 'atlas/barrido_vocabulario.json'), 'utf8'));
const VOCAB = new Set(libro.vocabulario);

function medir() {
  const piezas = {};
  for (const [dir, ext] of [['public/game', /\.js$/], ['public/assets', /\.(js|css)$/]]) {
    for (const f of readdirSync(join(RAIZ, dir)).filter((x) => ext.test(x)).sort()) {
      if (VOCAB.has(f)) continue;
      const n = (readFileSync(join(RAIZ, dir, f), 'utf8').match(CRUDO) || []).length;
      if (n) piezas[dir + '/' + f] = n;
    }
  }
  return piezas;
}

// El trinquete: ninguna pieza nueva con color crudo, ninguna cuenta que suba,
// y ninguna entrada del libro por encima de lo medido (si bajo, el libro se rebaja).
function trinquete(medido, fijado) {
  const fallos = [];
  for (const [f, n] of Object.entries(medido)) {
    if (!(f in fijado)) fallos.push(f + ': pieza nueva con ' + n + ' colores crudos');
    else if (n > fijado[f]) fallos.push(f + ': sube de ' + fijado[f] + ' a ' + n);
  }
  for (const [f, n] of Object.entries(fijado)) {
    const m = medido[f] || 0;
    if (m < n) fallos.push(f + ': bajo a ' + m + ', rebaja el libro (estaba en ' + n + ')');
  }
  return fallos;
}

const casos = [];
const caso = (nombre, fn) => { let r; try { r = fn(); } catch (e) { r = 'excepcion: ' + e.message; } casos.push({ caso: nombre, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const medido = medir();

caso('el arbol servido coincide con el libro (ni sube ni queda caducado)', () => {
  const f = trinquete(medido, libro.piezas);
  return f.length === 0 || f;
});
caso('sabotaje: una pieza nueva con un color crudo sale en rojo', () => {
  const f = trinquete({ ...medido, 'public/game/nueva.js': 1 }, libro.piezas);
  return f.some((x) => x.includes('nueva.js')) || f;
});
caso('sabotaje: una pieza que gana un color crudo sale en rojo', () => {
  const [p] = Object.keys(medido);
  const f = trinquete({ ...medido, [p]: medido[p] + 1 }, libro.piezas);
  return f.some((x) => x.includes('sube')) || f;
});
caso('sabotaje: una pieza barrida sin rebajar el libro sale en rojo (libro caducado)', () => {
  const [p] = Object.keys(medido);
  const sin = { ...medido }; delete sin[p];
  const f = trinquete(sin, libro.piezas);
  return f.some((x) => x.includes('rebaja')) || f;
});
caso('las piezas del vocabulario no entran en la cuenta (ellas SON las bandas)', () =>
  libro.vocabulario.every((v) => !Object.keys(libro.piezas).some((k) => k.endsWith('/' + v))) || 'una pieza del vocabulario en el libro');
caso('el libro cabe en el mapa de un mini (< 8.192 B) y declara su regla', () => {
  const b = Buffer.byteLength(readFileSync(join(RAIZ, 'atlas/barrido_vocabulario.json')));
  return (b < 8192 && typeof libro.regla === 'string' && libro.regla.length > 20) || b;
});

const resumen = { piezas_con_color_crudo: Object.keys(medido).length, literales: Object.values(medido).reduce((a, b) => a + b, 0), vocabulario: libro.vocabulario.length };
console.log(JSON.stringify({ resumen, casos }, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
