// T4 · fixture del caminante: pruebas de la tarjeta NORTE7-T4-PRECEPTORES-PERSONAJES (dictado web#387).
// Uso: node atlas/t4_caminante_casos.mjs -> [{caso, ok, detalle}] ; exit 0 solo si todos pasan.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const F = await import('./fixtures/t4_caminante.mjs');
const G = require('../public/game/bb_radio.js');
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}

const VIVOS = { Mesa: { estado: 'LIVE' }, Luna: { estado: 'PROPUESTA' }, Claude: { estado: 'HITL' } };

caso('determinismo: el mismo registro da la misma historia de 300 ticks', () => {
  return JSON.stringify(F.simula(VIVOS, 300)) === JSON.stringify(F.simula(VIVOS, 300)) || 'historias distintas';
});

caso('ningun par de carriles comparte celda en ningun tick (500 ticks)', () => {
  for (const tick of F.simula(VIVOS, 500)) {
    const celdas = tick.map((c) => c.x + ',' + c.y);
    if (new Set(celdas).size !== celdas.length) return 'solape en un tick: ' + celdas.join(' | ');
  }
  return true;
});

caso('el caminante no sale de la rejilla', () => {
  for (const tick of F.simula(VIVOS, 500)) for (const c of tick) {
    if (c.x < 0 || c.x >= F.GRID.W || c.y < 0 || c.y >= F.GRID.H) return `${c.carril} fuera en (${c.x},${c.y})`;
  }
  return true;
});

caso('cada tick mueve a lo sumo una celda (distancia de Manhattan <= 1)', () => {
  const h = F.simula(VIVOS, 300);
  for (let t = 1; t < h.length; t++) for (let i = 0; i < 3; i++) {
    const d = Math.abs(h[t][i].x - h[t - 1][i].x) + Math.abs(h[t][i].y - h[t - 1][i].y);
    if (d > 1) return `${h[t][i].carril} salta ${d} celdas en el tick ${t}`;
  }
  return true;
});

caso('un carril sin estado registrado queda congelado y dice NO_DATA con causa', () => {
  const sin = { Mesa: { estado: 'LIVE' }, Luna: { estado: 'LIVE' } };          // Claude sin registro
  const h = F.simula(sin, 200);
  const claude = h.map((t) => t[2]);
  const quieto = claude.every((c) => c.x === claude[0].x && c.y === claude[0].y);
  return (quieto && claude.every((c) => c.estado === 'NO_DATA' && c.causa)) || 'no quedo congelado o sin causa';
});

caso('el HITL («?») es un estado de verdad: un carril con HITL lo muestra, no NO_DATA', () => {
  const h = F.simula(VIVOS, 10);
  return h[9][2].estado === 'HITL' || `estado ${h[9][2].estado}`;
});

caso('los ocho estados (siete de la tabla + HITL) tienen destinos distintos para algun carril', () => {
  const destinos = new Set(F.ESTADOS.map((s) => {
    const d = F.destino(0, s, 3);
    return d.x + ',' + d.y;
  }));
  return destinos.size > 1 || 'todos los estados llevan al mismo destino';
});

caso('la posicion es funcion del estado registrado: cambiar el estado cambia el camino', () => {
  const a = F.simula({ Mesa: { estado: 'LIVE' } }, 80), b = F.simula({ Mesa: { estado: 'ERROR' } }, 80);
  return JSON.stringify(a.map((t) => t[0].x + ',' + t[0].y)) !== JSON.stringify(b.map((t) => t[0].x + ',' + t[0].y)) || 'mismo camino';
});

caso('los carriles son tres y Hexelion no es un cuerpo que camina', () => {
  return (F.CARRILES.length === 3 && !F.CARRILES.includes('Hexelion')) || 'carriles: ' + F.CARRILES.join(',');
});

caso('la proporcion cuerpo/celda queda entre 0.25 y 0.5 (legible, no dominante)', () => {
  const r = F.CUERPO.alto / F.CUERPO.celda;
  return (r >= 0.25 && r <= 0.5) || 'proporcion ' + r.toFixed(3);
});

caso('el gemelo estatico del HITL es una forma distinta de los siete estados de la tabla', () => {
  const formas = ['LIVE', 'PROPUESTA', 'FIRMADO', 'ERROR', 'NO_DATA', 'SIMULATED', 'STALE'].map((s) => G.gemelo(s).forma);
  return !formas.includes('question') || 'forma repetida';
});

caso('la fixture no usa Math.random, Date.now ni performance.now', () => {
  const t = readFileSync(new URL('./fixtures/t4_caminante.mjs', import.meta.url), 'utf8');
  return !/Math\.random|Date\.now|performance\.now/.test(t) || 'usa azar o reloj';
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
