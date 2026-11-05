// T4 · fixture del caminante (tarjeta NORTE7-T4-PRECEPTORES-PERSONAJES, dictado del Soberano).
// Fixture, NO produccion: vive en atlas/fixtures y no se sirve. Lo que se prueba aqui es lo que luego se cablea.
// Reglas:
//   - Carriles vivos (tres hoy: Mesa, Luna, Claude). Hexelion es la figura del orquestador, no un cuerpo que camina.
//   - La posicion la decide el CARRIL, de forma determinista, a partir de su estado REGISTRADO (nunca en vivo).
//   - Estados: los siete de la tabla fisica + «?» (HITL), que es un estado mas, con el mismo pipeline de hash.
//   - Sin azar del sistema ni reloj: el azar sale del hash canon (public/game/bb_canon.js, solo lectura).
//   - Un carril sin estado registrado queda congelado y se muestra como NO_DATA con causa.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CANON = require('../../public/game/bb_canon.js');

export const CARRILES = ['Mesa', 'Luna', 'Claude'];           // conteo = carriles vivos (decreto, web#387)
export const ESTADOS = ['LIVE', 'PROPUESTA', 'FIRMADO', 'ERROR', 'NO_DATA', 'SIMULATED', 'STALE', 'HITL'];
export const GRID = { W: 7, H: 5 };                            // rejilla de celdas en unidades de celda
export const EPOCA = 32;                                       // ticks entre elecciones de destino
export const CUERPO = { alto: 24, celda: 56 };                 // px de referencia: CELDA = 56 (global_map.js:14)

// Estado registrado de un carril: { estado } o nada. Sin registro => NO_DATA con causa.
export function estadoDe(registro) {
  if (!registro || typeof registro.estado !== 'string' || !ESTADOS.includes(registro.estado)) {
    return { estado: 'NO_DATA', causa: 'sin estado registrado para este carril' };
  }
  return { estado: registro.estado, causa: null };
}

// Destino de la epoca: hash canon de (carril, estado, epoca). Mismo pipeline para todos los estados.
export function destino(indiceCarril, estado, epoca) {
  const k = ESTADOS.indexOf(estado);
  const hx = CANON.hash(indiceCarril, k, epoca) % GRID.W;
  const hy = CANON.hash(indiceCarril, k, epoca + 1) % GRID.H;
  return { x: hx, y: hy };
}

// Paso de un tick: avanza una celda hacia el destino (x primero, luego y). Si la celda esta ocupada por un
// carril de menor indice, se espera un tick (determinista: el orden de carriles decide).
function paso(pos, meta, ocupadas) {
  if (pos.x === meta.x && pos.y === meta.y) { return pos; }
  let nx = pos.x, ny = pos.y;
  if (pos.x !== meta.x) { nx += meta.x > pos.x ? 1 : -1; } else { ny += meta.y > pos.y ? 1 : -1; }
  const clave = nx + ',' + ny;
  return ocupadas.has(clave) ? pos : { x: nx, y: ny };
}

// Simula n ticks. registros: { Mesa: {estado}, Luna: {...}, ... } fijos (estado registrado, no en vivo).
// Devuelve, por tick, la posicion y el estado de cada carril. Sin azar ni reloj.
export function simula(registros, ticks) {
  const pos = CARRILES.map((_, i) => ({ x: i * 2, y: 0 }));
  const meta = CARRILES.map((_, i) => destino(i, 'LIVE', 0));
  const historia = [];
  for (let t = 0; t < ticks; t++) {
    const estados = CARRILES.map((c) => estadoDe(registros[c]));
    if (t % EPOCA === 0) {
      CARRILES.forEach((_, i) => { if (estados[i].estado !== 'NO_DATA') { meta[i] = destino(i, estados[i].estado, t / EPOCA); } });
    }
    // Todas las posiciones actuales ocupan su celda antes de mover: ningun carril entra en la celda de otro.
    const ocupadas = new Set(pos.map((p) => p.x + ',' + p.y));
    CARRILES.forEach((_, i) => {
      if (estados[i].estado === 'NO_DATA') { return; }             // congelado: su celda sigue ocupada
      ocupadas.delete(pos[i].x + ',' + pos[i].y);                  // libera su propia celda antes de decidir
      pos[i] = paso(pos[i], meta[i], ocupadas);
      ocupadas.add(pos[i].x + ',' + pos[i].y);
    });
    historia.push(CARRILES.map((c, i) => ({ carril: c, x: pos[i].x, y: pos[i].y, estado: estados[i].estado, causa: estados[i].causa })));
  }
  return historia;
}
