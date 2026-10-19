// T_CRT (FIRMO 2026-10-19, Comando #15): la rueda Z recorta por sello. Regla: se ve si Z >= profundidad del sello
// (MEDIDO 0,20 · EMULADO 0,50 · NO_DATA 0,80). Cumple las paradas de §2 al pie de la letra; los bordes de §4 se declaran (RC-20).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Z = require(process.env.ZCUTOFF || '../public/game/z_cutoff.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const ve = (s, z) => Z.visibleAt(s, z);

caso('§2 Z=1.00: se ve todo (MEDIDO, EMULADO, NO_DATA)', () => ['MEDIDO', 'EMULADO', 'NO_DATA', 'LIVE', 'SIMULATED'].every((s) => ve(s, 100)) || 'algo oculto');
caso('§2 Z=0.50: fuera NO_DATA; quedan EMULADO y MEDIDO', () => (!ve('NO_DATA', 50) && ve('EMULADO', 50) && ve('MEDIDO', 50)) || 'mal');
caso('§2 Z=0.25: solo MEDIDO y firma humana', () => (ve('MEDIDO', 25) && ve('FIRMADO', 25) && ve('REQUIERE_FIRMA', 25) && !ve('EMULADO', 25) && !ve('NO_DATA', 25) && !ve('STALE', 25)) || 'mal');
caso('§4: NO_DATA solo por encima de 0,8; EMULADO solo desde 0,5', () => {
  const nd = [79, 80, 81, 100].map((z) => ve('NO_DATA', z)), em = [49, 50, 51].map((z) => ve('SIMULATED', z));
  return (JSON.stringify(nd) === '[false,true,true,true]' && JSON.stringify(em) === '[false,true,true]') || { nd, em };
});
caso('§4: MEDIDO jamas oculto en todo el rango [0,20..1,00] (y LIVE, ERROR)', () => {
  for (let z = 0; z <= 120; z++) for (const s of ['MEDIDO', 'LIVE', 'ERROR', 'STATIC']) if (!ve(s, z)) return { s, z };
  return true;
});
caso('sello desconocido se trata como NO_DATA (nunca se cuela a Z bajo)', () => (!ve('INVENTADO', 79) && ve('INVENTADO', 80)) || 'mal');
caso('clamp entero en [20, 100]; basura vuelve a 100', () => (Z.clamp(5) === 20 && Z.clamp(140) === 100 && Z.clamp('x') === 100 && Z.clamp(49.6) === 50) || 'mal');
caso('rotulo legible por el mini y por el lector de pantalla', () => {
  const r = [Z.label(100), Z.label(50), Z.label(25)];
  return JSON.stringify(r) === JSON.stringify(['Depth 1.00: everything', 'Depth 0.50: without NO_DATA', 'Depth 0.25: measured only']) || r;
});
caso('set avisa a quien escucha una vez por cambio, y no si no cambia', () => {
  const vistos = []; Z.listen((z) => vistos.push(z)); Z.set(100); Z.set(50); Z.set(50); Z.set(10); Z.set(100);
  return JSON.stringify(vistos) === '[50,20,100]' || vistos;
});
caso('paradas declaradas = §2', () => JSON.stringify(Z.DETENTS) === '[100,50,25]' || Z.DETENTS);

const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos: casos.length, fallos: casos.filter((c) => !c.ok) }));
process.exitCode = ok ? 0 : 1;
