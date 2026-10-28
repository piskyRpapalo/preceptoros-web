// Casos del DUELO entre personas por paquetes (`public/game/duelo.js`) y de los LUGARES NPC de la Arena.
// Dos "aparatos" (A y B) con identidades de prueba se pasan los paquetes como texto, igual que por
// Send o Copy. Los ejecuta atlas/test_atlas.py:   node atlas/duelo_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { identidad, verificador, azar } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');


const V = require('../public/game/valores.js');

const casos = [];
async function caso(nombre, fn) {
  try { const d = await fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${JSON.stringify(a)} != ${JSON.stringify(b)}`;
const todas = (...xs) => xs.find((x) => x !== true) ?? true;
const rechaza = async (p, re) => { try { await p; return 'no rechazo'; } catch (e) { return re.test(e.message) || e.message; } };
const viaja = (p) => JSON.stringify(p);   // lo que cruza: texto, como por Send o Copy


const tropas = (quien, tc, k) => Array.from({ length: k }, (_, i) => ({ tc, semilla: azar(quien + '-tropa-' + i) }));












