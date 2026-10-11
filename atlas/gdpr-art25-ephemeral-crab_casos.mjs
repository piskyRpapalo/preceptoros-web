// Casos del CANGREJO (`public/game/gdpr-art25-ephemeral-crab.js`, J1/C5, plan de ronda 2026-10-11).
// El oraculo, no la palabra del agente: misma semilla -> mismo paseo (huella fijada); el tamano y la
// clase son DATO (army, nodo); sin latido el brillo es NO_DATA; y el cangrejo NO toca motor ni combate.
//   node atlas/gdpr-art25-ephemeral-crab_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const C = require('../public/game/gdpr-art25-ephemeral-crab.js');
const FUENTE = readFileSync(new URL('../public/game/gdpr-art25-ephemeral-crab.js', import.meta.url), 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : JSON.stringify(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const S1 = 'visitante', S2 = 'otra-semilla';
// Huella MEDIDA el 2026-10-11 (Beelink, node 22): si cambia, el paseo cambio en todos los aparatos.
const HUELLA_S1_240 = 'd9e3cc907982974a3e2ffc3cc1c47c2f10e50007c28386a6908163edb18443a1';

caso('paseo: misma semilla y ciclo, misma posicion (dos corridas)', () =>
  JSON.stringify(C.paseo(S1, 137, 0.3)) === JSON.stringify(C.paseo(S1, 137, 0.3)) || 'difiere');
caso('paseo: la huella de 240 ciclos es la medida (determinismo entre aparatos)', () =>
  C.huellaPaseo(S1, 240) === HUELLA_S1_240 || C.huellaPaseo(S1, 240));
caso('paseo: otra semilla, otro paseo', () => C.huellaPaseo(S1, 240) !== C.huellaPaseo(S2, 240) || 'iguales');
caso('paseo: anda dentro del lecho y es continuo (sin saltos entre ciclos)', () => {
  let prev = C.paseo(S1, 0, 0).x, peor = 0;
  for (let c = 0; c < 600; c++) {
    for (const f of [0, 0.5]) {
      const p = C.paseo(S1, c, f);
      if (p.x < 0.06 || p.x > 0.94) { return { fuera: c, x: p.x }; }
      peor = Math.max(peor, Math.abs(p.x - prev)); prev = p.x;
    }
  }
  return peor < 0.1 || { salto: peor };
});
caso('forma: el tamano crece con la army y tiene tope', () => {
  const t = [0, 1, 5, 10, 99].map((n) => C.forma(n, false, null).escala);
  return (t.every((v, i) => !i || v >= t[i - 1]) && t[0] === 1 && t[4] <= 2.2) || t;
});
caso('forma: sin nodo es cangrejo de mar; con nodo, coral (clase, no adorno)', () =>
  (C.forma(0, false, null).clase === 'mar' && C.forma(0, true, 0.5).clase === 'coral') || 'clases');
caso('forma: sin nodo no hay latido -> brillo NO_DATA (null), nunca un cero inventado', () =>
  (C.forma(3, false, 0.9).brillo === null && C.forma(3, true, null).brillo === null && C.forma(3, true, 0.7).brillo === 0.7) || 'brillo');
caso('pureza: ni azar, ni reloj, ni red, ni almacen', () => {
  const malos = ['Math.random', 'Date', 'fetch', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'sendBeacon', 'WebSocket'].filter((m) => FUENTE.includes(m));
  return !malos.length || malos;
});
caso('no toca la decision: ni motor, ni combate, ni juez', () => {
  const malos = ['arena', 'AtlasArena', 'atlas-motor', 'AtlasMotor', 'combate', 'AtlasJuez', 'aplica'].filter((m) => FUENTE.includes(m));
  return !malos.length || malos;
});
caso('espejo: andar al otro lado es el mismo sprite con la x negada (sin onda nueva)', () =>
  (FUENTE.includes('g.scale(-1, 1)') && JSON.stringify(C.onda(1)) === JSON.stringify(C.onda(1))) || 'espejo');
console.log(JSON.stringify(casos));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
