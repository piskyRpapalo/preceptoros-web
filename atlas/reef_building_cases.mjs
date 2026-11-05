// LOS 9 OBJETOS · ciclo de vida en tics (FIRMO 2026-10-12): puro, replay-safe, NO_DATA con causa y ∇C como telemetria.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const casos = [];
function caso(nombre, f) {
  try { const r = f(); casos.push({ caso: nombre, ok: r === true, detalle: r === true ? '' : JSON.stringify(r).slice(0, 300) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: String(e && e.message || e) }); }
}
const base = { esquema: 'preceptoros.edificio/1', id: 'boya-1', tipo: 'boya', col: 3, fila: 2, huella: 1, nace_tic: 100, madura_tics: 10, desgaste_por_tic: 5, carga: 400, escudo: 200 };









// La capa: la boya se ancla a tu casa y su cuidado es la ultima noticia LIVE (o ya STALE) de la Radio.




// EL OBSERVATORIO: mirar cuesta tics, lo visto envejece por tramos y al NO_DATA la niebla vuelve.



// EL ARRECIFE DE LAS LAPIDAS: lo desintegrado deja un recibo legible y determinista.



// PIEZA DE AMOR 4: la tropa disuelta en el Taller deja su lapida con el recibo firmado; su nacimiento es NO_DATA.

// EL CRISTAL DE LATENCIA: mide tu hierro con los cuadros del mapa; NO_DATA sin cuadros, nunca «0 fps».






console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
