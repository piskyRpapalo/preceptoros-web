// VT5 · tutorial «De Onda a Nodo Soberano» (F0-F3): doble puerta, orden de fases, 3 huevos medidos,
// primer edificio con NO_DATA con causa cuando no hay medida, y la red solo tras el cruce humano.
// Se ejecuta con: node atlas/tutorial_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);


const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const ok = (r) => r.ok === true;
const rechaza = (r, re) => (r.ok === false && re.test(r.motivo)) || `no rechazo con ${re}: ${JSON.stringify(r)}`;

// recorrido completo por la niebla: pulso -> disipa (NO_DATA: sin medida) -> arena101 -> recompensa -> F2 -> F3 -> humano cruza


















const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
