// Casos de «EL PRIMER ECO» (P11, `public/game/primer_eco.js`, firmado 2026-10-11): ondas sucias deterministas y
// de niebla, el orden obligatorio, las reglas del Taller de verdad sobre una cadena de ensayo, y nada de valor:
// ni firma, ni Army, ni cadena guardada; sale una Insignia (distintivo) y tu bandera.
//   node atlas/eco_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const P = require('../public/game/primer_eco.js');
const T = require('../public/game/taller.js');
const G = require('../public/game/gacha.js');
const fuente = readFileSync(new URL('../public/game/primer_eco.js', import.meta.url), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : JSON.stringify(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
caso('ondas sucias: tres, deterministas, de niebla (emulado), de 6 aristas o mas, y propias de cada cuenta', () => {
  const a = P.ondasSucias('ana'), b = P.ondasSucias('ana'), c = P.ondasSucias('bea');
  return (JSON.stringify(a) === JSON.stringify(b) && a.length === 3 && a.every((t) => t.campo_origen === 'emulado' && t.aristas >= 6 && G.aristas(t) === t.aristas) &&
    JSON.stringify(a) !== JSON.stringify(c)) || a.map((t) => [t.aristas, t.campo_origen]);
});
caso('el capitulo entero con las reglas de verdad: ping, desintegrar, pulir, pintar -> Insignia', () => {
  let e = P.empieza('ana');
  e = P.avanza(e, 'ping'); e = P.avanza(e, 'desintegra', 0); e = P.avanza(e, 'pule', { onda: 1, stat: 'velocidad' }); e = P.avanza(e, 'pinta', 'coral');
  const st = T.estado(e.cadena), i = e.insignia;
  return (!st.error && st.saldo >= 0 && e.paso === 'insignia' && i.esquema === 'atlas.insignia/1' && i.bandera === 'coral' && i.stat === 'velocidad' &&
    i.nivel === 1 && i.semilla === e.ondas[1].semilla && st.tintes[i.semilla] === 'coral') || { st, i };
});
caso('obligatorio: el orden no se salta, y no se pule lo que ya es residuo', () => {
  const m = [], e = P.empieza('ana');
  try { P.avanza(e, 'desintegra', 0); m.push('salto el ping'); } catch (x) { /* bien */ }
  try { P.avanza(e, 'pinta', 'oro'); m.push('pinto sin pulir'); } catch (x) { /* bien */ }
  const d = P.avanza(P.avanza(e, 'ping'), 'desintegra', 2);
  try { P.avanza(d, 'pule', { onda: 2, stat: 'vida' }); m.push('pulio el residuo'); } catch (x) { /* bien */ }
  return !m.length || m;
});
caso('nada de valor: sin firma, sin Army, sin guardar la cadena, sin boton de saltar', () => {
  const malos = ['retira(', 'adopta(', 'firmar(', 'Math.random', 'Date.', 'fetch(', 'salta', 'skip'].filter((x) => fuente.includes(x));
  const pons = (fuente.match(/caja\.pon\(/g) || []).length;
  return (!malos.length && pons === 1 && fuente.includes('caja.pon(est.insignia)')) || { malos, pons };
});
console.log(JSON.stringify(casos));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
