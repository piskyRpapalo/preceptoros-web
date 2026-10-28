// Casos de «EL PRIMER ECO» (P11, `public/game/primer_eco.js`, firmado 2026-10-11): ondas sucias deterministas y
// de niebla, el orden obligatorio, las reglas del Taller de verdad sobre una cadena de ensayo, y nada de valor:
// ni firma, ni Army, ni cadena guardada; sale una Insignia (distintivo) y tu bandera.
//   node atlas/eco_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);

const T = require('../public/game/taller.js');
const G = require('../public/game/gacha.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : JSON.stringify(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}




console.log(JSON.stringify(casos));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
