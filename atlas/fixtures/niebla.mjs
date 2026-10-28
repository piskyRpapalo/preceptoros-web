// NIEBLA · mecanica propuesta para OpenWorld (fixture, PROPUESTA; no es produccion).
// Decreto del Soberano (ojos, preview ciclo 4, 2026-10-28): el hexagono es lo que el usuario ENCUENTRA cuando la niebla se levanta.
// Reglas de esta pieza:
//   - La niebla NO es un canal nuevo: es el estado NO_DATA de la tabla existente, con causa «celda no visitada».
//   - Una celda levantada muestra el estado de la tabla que dejo el carril que la visito (LIVE, PROPUESTA, ..., HITL).
//   - La REGLA de levantar (visitar un carril) es PROPUESTA: aqui se implementa como parametro, no se decide.
//   - Sin azar del sistema ni reloj.
import * as T4 from './t4_caminante.mjs';

// Regla de levantar, PROPUESTA: por defecto, una celda se levanta cuando un carril ha estado en ella.
export const REGLA_LEVANTAR = 'visita';

// Estado de una celda en el instante t de la historia del caminante.
// Devuelve { estado, causa, carril, origen } con estado siempre dentro de la tabla (T4.ESTADOS + NO_DATA).
export function celda(hist, t, x, y, regla = REGLA_LEVANTAR) {
  if (regla !== 'visita') { return { estado: 'NO_DATA', causa: 'regla de levantar no aprobada: ' + regla, carril: null }; }
  let ultimo = null;
  for (let k = 0; k <= t && k < hist.length; k++) {
    for (const c of hist[k]) if (c.x === x && c.y === y) ultimo = c;
  }
  if (!ultimo) { return { estado: 'NO_DATA', causa: 'celda no visitada (niebla)', carril: null }; }
  return { estado: ultimo.estado, causa: null, carril: ultimo.carril };
}

// Recorre la rejilla completa en el tick t. Orden fijo (y, x) para que la salida sea determinista.
export function mapa(hist, t, regla = REGLA_LEVANTAR) {
  const out = [];
  for (let y = 0; y < T4.GRID.H; y++) for (let x = 0; x < T4.GRID.W; x++) out.push({ x, y, ...celda(hist, t, x, y, regla) });
  return out;
}
