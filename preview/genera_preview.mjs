// Vista previa NORTE 7 · genera preview/index.html a partir de los FIXTURES REALES (t4, t1, t2).
// No reimplementa nada: ejecuta simula/siguiente/altura y vuelca sus salidas en el HTML. El navegador solo dibuja.
// Uso: node preview/genera_preview.mjs   (escribe preview/index.html). PREVIEW ONLY: no toca public/.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const DIR = dirname(fileURLToPath(import.meta.url));
const T4 = await import('../atlas/fixtures/t4_caminante.mjs');
const K = await import('../atlas/fixtures/t1_keepout.mjs');
const T2 = await import('../atlas/fixtures/t2_altura.mjs');
const N = await import('../atlas/fixtures/niebla.mjs');

const VIVOS = { Mesa: { estado: 'LIVE' }, Luna: { estado: 'PROPUESTA' }, Claude: { estado: 'HITL' } };
const TICKS = 300;

// --- T4: historia real de los tres carriles
const hist4 = T4.simula(VIVOS, TICKS);
const esperas = T4.CARRILES.map((carril, i) => {
  let max = 0, q = 0, prev = null;
  for (const fila of hist4) {
    const k = fila[i].x + ',' + fila[i].y;
    q = k === prev ? q + 1 : 0; max = Math.max(max, q); prev = k;
  }
  return { carril, estado: VIVOS[carril].estado, quietoMax: max };
});

// --- T1: keep-out real y ejemplo recta vs desvio con el BFS real
const lados = ['atlantis', 'risen'];
const t1 = K.simula(VIVOS, TICKS, lados);
const bloq = [...t1.bloq];
const straight = (s, g) => { const p = [s]; let { x, y } = s; while (x !== g.x || y !== g.y) { if (x !== g.x) x += g.x > x ? 1 : -1; else y += g.y > y ? 1 : -1; p.push({ x, y }); } return p; };
const blq = (c) => t1.bloq.has(c.x + ',' + c.y);
const libres = [];
for (let y = 0; y < T4.GRID.H; y++) for (let x = 0; x < T4.GRID.W; x++) if (!blq({ x, y })) libres.push({ x, y });
let ejemplo = null;
for (const s of libres) for (const g of libres) {
  if (s.x === g.x && s.y === g.y) continue;
  const st = straight(s, g);
  if (!st.some(blq)) continue;
  const d = [s]; let c = s;
  for (let i = 0; i < 60; i++) { const n = K.siguiente(c, g, t1.bloq); if (!n) break; d.push(n); c = n; if (n.x === g.x && n.y === g.y) break; }
  if (!(c.x === g.x && c.y === g.y)) continue;
  if (!ejemplo || st.length > ejemplo.recta.length) ejemplo = { s, g, recta: st, desvio: d };
}
const libresMed = { celdasLibres: libres.length, celdasBloqueadas: t1.bloq.size, total: T4.GRID.W * T4.GRID.H };

// --- T2: alturas reales del fixture
const manas = [0, 10, 25, 50, 75, 90, 100];
const alturas = manas.map((m) => ({ mana: m, ...T2.altura(m) }));
const sinDato = T2.altura(null);

const datos = {
  constantes: { H0: T2.H0, K: T2.K, RADIO: 1.0, LEAN: K.LEAN, EPOCA: T4.EPOCA, GRID: T4.GRID, CUERPO: T4.CUERPO, ZOOM_MIN: 0.6 },
  carriles: T4.CARRILES, estados: T4.ESTADOS,
  hist4: hist4.map((f) => f.map((c) => ({ x: c.x, y: c.y, e: c.estado }))),
  esperas,
  t1: { inter: t1.inter, bloq: bloq, ejemplo, conteo: libresMed, lados },
  t2: { alturas, sinDato },
  forma: { nombre: 'interrogacion-punteada', estado: 'PROPUESTA' },
  niebla: { tickDespues: 120, antes: N.mapa(hist4, -1), despues: N.mapa(hist4, 120), regla: N.REGLA_LEVANTAR },
};

const plantilla = readFileSync(join(DIR, 'plantilla.html'), 'utf8');
const html = plantilla.replace('__DATOS__', JSON.stringify(datos));
writeFileSync(join(DIR, 'index.html'), html);
console.log(JSON.stringify({ escrito: 'preview/index.html', bytes: html.length, ejemplo: !!ejemplo, ticks: TICKS, esperas }));
