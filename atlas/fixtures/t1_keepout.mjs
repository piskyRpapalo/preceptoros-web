// T1 · fixture del radio de respeto (keep-out) por interactivo. Tarjeta NORTE7-T1-KEEPOUT. FIXTURE, no produccion.
// Reglas (dictado web#387, firmado): radio POR TIPO con override por instancia; la cabina es origen Y tiene radio;
// cero exenciones; un tipo sin radio medido se rechaza (NO_DATA, no radio por defecto invisible).
// Usa el caminante de T4 (solo sus funciones exportadas; T4 no se modifica).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import * as T4 from './t4_caminante.mjs';
const require = createRequire(import.meta.url);

const REG = JSON.parse(readFileSync(new URL('./constantes.json', import.meta.url), 'utf8')).constantes;
const valor = (nombre) => REG.find((c) => c.nombre === nombre).valor;
export const LEAN = valor('LEAN');
const RADIO_POR_TIPO = { cabin: valor('RADIO_CUERPO'), node: valor('RADIO_CUERPO') };

// Posiciones en celdas: el origen de la rejilla (3,2) es la cabina; los nodos llegan por su reco (global_map.js:22-26).
const ORIGEN = { x: 3, y: 2 };
const RECO = { atlantis: [-2, 1], risen: [2, -1] };

// Radio de un interactivo: override por instancia si lo hay; si no, el del tipo. Sin radio medido -> error (NO_DATA).
export function radioDe(tipo, override) {
  if (override !== undefined) {
    if (!(Number.isFinite(override) && override > 0)) { throw new Error('radio invalido (debe ser > 0): ' + override); }
    return override;
  }
  const r = RADIO_POR_TIPO[tipo];
  if (r === undefined || r === null) { throw new Error('NO_DATA: sin radio medido para el tipo ' + tipo); }
  return r;
}

// Interactivos vivos: la cabina siempre; atlantis y risen solo si su nodo esta vivo (dictado Norte 7).
export function interactivos(vivos) {
  const out = [{ id: 'cabin', tipo: 'cabin', x: ORIGEN.x, y: ORIGEN.y, radio: radioDe('cabin') }];
  for (const id of ['atlantis', 'risen']) {
    if (vivos && vivos.includes(id)) {
      out.push({ id, tipo: 'node', x: ORIGEN.x + RECO[id][0], y: ORIGEN.y + RECO[id][1], radio: radioDe('node') });
    }
  }
  return out;
}

// Celdas prohibidas: las que estan a menos de radio de algun interactivo (distancia euclidea en celdas).
export function celdasBloqueadas(inter) {
  const set = new Set();
  for (let x = 0; x < T4.GRID.W; x++) for (let y = 0; y < T4.GRID.H; y++) {
    for (const it of inter) {
      if (Math.hypot(x - it.x, y - it.y) < it.radio) { set.add(x + ',' + y); break; }
    }
  }
  return set;
}

// Primer paso del camino mas corto de p a m por celdas libres (BFS; vecinos en orden fijo +x,-x,+y,-y).
// Devuelve la celda siguiente, o null si ya esta en el destino o no hay camino libre.
export function siguiente(p, m, bloq) {
  const k0 = p.x + ',' + p.y, kf = m.x + ',' + m.y;
  if (k0 === kf) { return null; }
  const padre = new Map([[k0, null]]);
  const cola = [k0];
  const orden = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (cola.length) {
    const c = cola.shift();
    if (c === kf) {
      let cur = c;
      while (padre.get(cur) !== k0) { cur = padre.get(cur); }   // retrocede hasta el primer paso
      const [x, y] = cur.split(',').map(Number);
      return { x, y };
    }
    const [cx, cy] = c.split(',').map(Number);
    for (const [dx, dy] of orden) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= T4.GRID.W || ny >= T4.GRID.H) { continue; }
      const k = nx + ',' + ny;
      if (padre.has(k) || bloq.has(k)) { continue; }
      padre.set(k, c);
      cola.push(k);
    }
  }
  return null;
}

// Simula con keep-out. Registros de carril como en T4. Devuelve historia y el interactivo mas cercano por carril/tick.
export function simula(registros, ticks, vivos) {
  const inter = interactivos(vivos);
  const bloq = celdasBloqueadas(inter);
  // Arranque: primera celda libre en orden (y, x), una por carril, en orden de carril.
  const libres = [];
  for (let y = 0; y < T4.GRID.H; y++) for (let x = 0; x < T4.GRID.W; x++) if (!bloq.has(x + ',' + y)) libres.push({ x, y });
  const pos = T4.CARRILES.map((_, i) => libres[i]);
  const meta = T4.CARRILES.map((_, i) => T4.destino(i, 'LIVE', 0));
  const historia = [];
  for (let t = 0; t < ticks; t++) {
    const estados = T4.CARRILES.map((c) => T4.estadoDe(registros[c]));
    if (t % T4.EPOCA === 0) {
      T4.CARRILES.forEach((_, i) => {
        if (estados[i].estado === 'NO_DATA') { return; }
        for (let k = 0; k < 9; k++) {                       // si el destino cae en keep-out, se re-elige (determinista)
          const d = T4.destino(i, estados[i].estado, t / T4.EPOCA + 1000 * k);
          if (!bloq.has(d.x + ',' + d.y)) { meta[i] = d; break; }
        }
      });
    }
    const ocupadas = new Set(pos.map((p) => p.x + ',' + p.y));
    const fila = [];
    T4.CARRILES.forEach((c, i) => {
      let bloqueadoPorKeepOut = false;
      if (estados[i].estado !== 'NO_DATA') {
        ocupadas.delete(pos[i].x + ',' + pos[i].y);
        const p = pos[i], m = meta[i];
        if (!(p.x === m.x && p.y === m.y)) {
          const sig = siguiente(p, m, bloq);                  // primer paso del camino libre mas corto
          if (sig === null) { bloqueadoPorKeepOut = true; }   // sin camino libre: espera (medido)
          else if (!ocupadas.has(sig.x + ',' + sig.y)) { pos[i] = sig; }
          // otro carril en la celda: espera (regla de separacion, aceptada)
        }
        ocupadas.add(pos[i].x + ',' + pos[i].y);
      }
      const dmin = Math.min(...inter.map((it) => Math.hypot(pos[i].x - it.x, pos[i].y - it.y) - it.radio));
      fila.push({ carril: c, x: pos[i].x, y: pos[i].y, estado: estados[i].estado, bloqueadoPorKeepOut, distBorde: dmin });
    });
    historia.push(fila);
  }
  return { historia, inter, bloq };
}
