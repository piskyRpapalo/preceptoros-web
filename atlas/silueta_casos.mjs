// VT4 · taller de siluetas matriciales: silhouette_hex 64..256 caracteres, solo [0-9a-f], esquema preceptoros.silueta/1.
// Se ejecuta con: node atlas/silueta_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

const esquema = JSON.parse(readFileSync(new URL('../data/atlas_siluetas_schema.json', import.meta.url), 'utf8'));

const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const rechaza = (r, re) => (r.ok === false && re.test(r.motivo)) || `no rechazo con ${re}: ${JSON.stringify(r)}`;

const buena = 'ab'.repeat(40);   // 80 caracteres, solo [0-9a-f]



















const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
