// Casos de la CASA (`public/game/home_buildings.js`): la forma de la personalizacion (sin datos
// personales) y que personalizar NO da ventaja de combate. Los ejecuta atlas/test_atlas.py:
//   node atlas/casa_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

const K = require('../public/game/canon.js');


const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}









console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
