// Casos de los NODOS COMO CUENTA (`public/game/nodos.js`): una cuenta = un nodo con su cedula, el
// duelo determinista desde una semilla, el equilibrio MEDIDO por simulacion y la puerta de envio.
// Los ejecuta atlas/test_atlas.py:   node atlas/nodos_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { identidad, verificador } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const N = require('../public/game/nodos.js');



const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${JSON.stringify(a)} != ${JSON.stringify(b)}`;
const todas = (...xs) => xs.find((x) => x !== true) ?? true;
const copia = (x) => JSON.parse(JSON.stringify(x));
const rechaza = (fn, re) => { try { fn(); return 'no rechazo'; } catch (e) { return re.test(e.message) || e.message; } };
// Re-sella una cedula tocada: asi la prueba cae por la REGLA que vigila, no por la integridad.
const resella = (c) => { delete c.sha256; c.sha256 = K.huella(c); return c; };




























// EQUILIBRIO MEDIDO: ningun perfil de la rejilla domina a otro. Banda fija AQUI, no en los datos:
// si viviera en la propuesta, la propuesta podria ensancharse su propio examen.
const BANDA = [350, 650], SEMILLAS = 200, NIVELES = [null, 0, 1, 2, 3, 4];






// LA PUERTA DE ENVIO: nada sale sin gesto, sin firma de la partida y sin la SEGUNDA firma (consent 1).
const yo = identidad('nodos');





process.stdout.write(JSON.stringify(casos, null, 1) + '\n');
process.exit(casos.every((c) => c.ok) ? 0 : 1);
