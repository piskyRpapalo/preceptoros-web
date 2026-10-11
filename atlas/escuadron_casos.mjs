// Casos del ESCUADRON (P6, `public/game/escuadron.js`, firmado 2026-10-11): mas de cien unidades por persona,
// las unidades caen con la vida, los sitios son deterministas, y el combate NO cambia (sigue por tropa).
//   node atlas/escuadron_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const E = require('../public/game/escuadron.js');
const G = require('../public/game/gacha.js');
const K = require('../public/game/canon.js');
const A = require('../public/game/arena.js');
const V = require('../public/game/valores.js');
const sin = (f) => readFileSync(new URL('../public/game/' + f, import.meta.url), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : JSON.stringify(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
caso('escala: con la escuadra entera (6 tropas), mas de 100 unidades por persona en al menos el 90 % (2 000 escuadras, n=2)', () => {
  const mide = () => { const t = []; for (let k = 0; k < 2000; k++) { let s = 0; for (let i = 0; i < V.combate.tropas_max; i++) { s += E.cuantas(G.tirada(K.sha('esq' + k + ':' + i), 'tc' + (1 + k % 4)).aristas); } t.push(s); } return t; };
  const a = mide(), b = mide(), pct = a.filter((x) => x >= 100).length / a.length;
  return (JSON.stringify(a) === JSON.stringify(b) && pct >= 0.9) || { pct };
});
caso('aristas -> unidades: pocas aristas, muchas unidades; el Leviatan es UN coloso; con tope', () => {
  const l = [3, 4, 8, 12, 13, 16].map(E.cuantas);
  return (l[0] > l[1] && l[1] > l[2] && l[2] >= l[3] && l[4] === 1 && l[5] === 1 && l[0] <= V.escuadron.tope) || l;
});
caso('dinamica: las unidades caen con la vida (monotono; muerta, cero; viva, al menos una)', () => {
  const n = 24, l = [24, 18, 12, 6, 1, 0].map((v) => E.vivas(n, v, 24));
  return (l.every((x, i) => !i || x <= l[i - 1]) && l[0] === n && l[4] === 1 && l[5] === 0) || l;
});
caso('sitios: deterministas, uno por unidad, el lider en el centro, dentro del radio, y la formacion los cambia', () => {
  const s = K.sha('x'), a = E.sitios(24, s, 'agresiva'), b = E.sitios(24, s, 'agresiva'), d = E.sitios(24, s, 'defensiva');
  const lejos = a.concat(d).some((p) => Math.hypot(p[0], p[1]) > V.escuadron.radio * 1.5);
  return (JSON.stringify(a) === JSON.stringify(b) && a.length === 24 && a[0][0] === 0 && a[0][1] === 0 && !lejos && JSON.stringify(a) !== JSON.stringify(d)) || { lejos };
});
caso('el combate NO cambia: arena no conoce el escuadron y el escuadron no decide (sin azar, sin reloj, sin red)', () => {
  const malos = ['Math.random', 'Date.', 'fetch(', 'combate(', 'AtlasArena'].filter((m) => sin('escuadron.js').includes(m));
  return (!/escuadron/i.test(sin('arena.js')) && !malos.length && !('escuadron' in JSON.parse(JSON.stringify({ k: A.packSha() })))) || { malos };
});
console.log(JSON.stringify(casos));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
