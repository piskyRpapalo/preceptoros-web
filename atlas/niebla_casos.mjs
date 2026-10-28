// NIEBLA · pruebas de la mecanica propuesta. Uso: node atlas/niebla_casos.mjs ; exit 0 solo si todas pasan.
import { readFileSync } from 'node:fs';
const N = await import('./fixtures/niebla.mjs');
const T4 = await import('./fixtures/t4_caminante.mjs');
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const VIVOS = { Mesa: { estado: 'LIVE' }, Luna: { estado: 'PROPUESTA' }, Claude: { estado: 'HITL' } };
const hist = T4.simula(VIVOS, 200);

caso('determinismo: el mapa en el mismo tick sale igual dos veces', () => {
  return JSON.stringify(N.mapa(hist, 120)) === JSON.stringify(N.mapa(hist, 120)) || 'mapas distintos';
});

caso('antes del primer tick (t=-1) todo esta en niebla, con causa, y ninguna celda levantada', () => {
  return N.mapa(hist, -1).every((c) => c.estado === 'NO_DATA' && c.causa === 'celda no visitada (niebla)') || 'hay celdas levantadas en t=0';
});

caso('cada estado de una celda pertenece a la tabla (T4.ESTADOS) o es NO_DATA: no hay canal nuevo', () => {
  const validos = new Set([...T4.ESTADOS, 'NO_DATA']);
  for (const c of N.mapa(hist, 200)) if (!validos.has(c.estado)) return `estado fuera de tabla: ${c.estado}`;
  return true;
});

caso('levantar es monotono: una celda levantada no vuelve a niebla', () => {
  let previas = new Set();
  for (let t = 0; t <= 200; t += 10) {
    const ahora = new Set(N.mapa(hist, t).filter((c) => c.estado !== 'NO_DATA').map((c) => c.x + ',' + c.y));
    for (const k of previas) if (!ahora.has(k)) return `celda ${k} vuelve a niebla en t=${t}`;
    previas = ahora;
  }
  return true;
});

caso('las celdas levantadas son exactamente las visitadas por algun carril', () => {
  const visitadas = new Set();
  for (let k = 0; k < hist.length; k++) for (const c of hist[k]) visitadas.add(c.x + ',' + c.y);
  const levantadas = new Set(N.mapa(hist, 200).filter((c) => c.estado !== 'NO_DATA').map((c) => c.x + ',' + c.y));
  return (visitadas.size === levantadas.size && [...visitadas].every((k) => levantadas.has(k))) || `visitadas ${visitadas.size} levantadas ${levantadas.size}`;
});

caso('la regla de levantar es PROPUESTA: otra regla no aprobada da NO_DATA con causa, no una celda', () => {
  const c = N.celda(hist, 200, 0, 0, 'proximidad');
  return (c.estado === 'NO_DATA' && /no aprobada/.test(c.causa)) || `regla ajena: ${JSON.stringify(c)}`;
});

caso('niebla y HITL son estados distintos: la niebla es NO_DATA, el HITL es un estado de la tabla', () => {
  return (T4.ESTADOS.includes('HITL') && !T4.ESTADOS.includes('NIEBLA') && N.celda(hist, -1, 0, 0).estado === 'NO_DATA') || 'confundidos';
});

caso('el fixture no usa azar del sistema ni reloj', () => {
  const t = readFileSync(new URL('./fixtures/niebla.mjs', import.meta.url), 'utf8');
  return !/Math\.random|Date\.now|performance\.now/.test(t) || 'usa azar o reloj';
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
