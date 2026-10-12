// REALISMO ANIME HONESTO (R1, FIRMO 2026-10-12): cel cuantizado del MISMO hue, morf armonico, sellos de una sola tabla.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require(process.env.TOON || '../public/game/crab_render_hd.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const hue = (c) => +String(c).match(/^hsl\((\d+) /)[1];
caso('ESTRELLA · las bandas (brillo, base, sombra, contorno) tienen TODAS el hue de su fuente: ningun color inventado', () => {
  const b = T.bandas(196, 62, 58);
  return [b.brillo, b.base, b.sombra, b.contorno].every((c) => hue(c) === 196) || b;
});
caso('ESTRELLA · los sellos salen de la TABLA_SEMANTICA (LIVE 120, PROPUESTA 45, FIRMADO 270, ERROR 0, NO_DATA 240, SIMULATED 30, STALE 60)', () => {
  const esperado = { LIVE: 120, PROPUESTA: 45, FIRMADO: 270, ERROR: 0, NO_DATA: 240, SIMULATED: 30, STALE: 60 };
  return Object.keys(esperado).every((s) => hue(T.deSello(s).base) === esperado[s] && hue(T.deSello(s).sombra) === esperado[s]) && JSON.stringify(T.SELLOS) === JSON.stringify(esperado) || T.SELLOS;
});
caso('un sello que no esta en la tabla no tiene color (null): no se inventa', () => T.deSello('MAGIC') === null);
caso('bandas DURAS: tres luminosidades distintas y ordenadas (brillo > base > sombra > contorno), sin degradado', () => {
  const b = T.bandas(12, 82, 60), L = (c) => +String(c).match(/ (\d+)%\)$/)[1];
  return L(b.brillo) > L(b.base) && L(b.base) > L(b.sombra) && L(b.sombra) > L(b.contorno) || b;
});
caso('MORF armonico: p=0 es la onda vieja, p=1 la nueva, p=0,5 el punto medio de cada termino', () => {
  const a = [[1, 40, 26, 0], [6, 7, 7, 0]], b = [[1, 60, 40, 0], [6, 7, 7, 0], [2, 18, 8, 1]];
  const m0 = T.morf(a, b, 0), m1 = T.morf(a, b, 1), mm = T.morf(a, b, 0.5);
  return m0[0][1] === 40 && m1[0][1] === 60 && mm[0][1] === 50 && mm[2][1] === 9 && m1[2][2] === 8 || { m0, m1, mm };
});
caso('la onda vista no SALTA: tras un cambio, a 1 s va a medio camino; a 2 s llega; con movimiento reducido, llega en el acto', () => {
  const a = [[1, 40, 26, 0]], b = [[1, 80, 26, 0]];
  T.ondaVista('caso', a, 1000, false); const v1 = T.ondaVista('caso', b, 1000, false)[0][1], v2 = T.ondaVista('caso', b, 2000, false)[0][1], v3 = T.ondaVista('caso', b, 3000, false)[0][1];
  T.ondaVista('quieto', a, 1000, true); const q = T.ondaVista('quieto', b, 1001, true)[0][1];
  return v1 === 40 && v2 > 40 && v2 < 80 && v3 === 80 && q === 80 || { v1, v2, v3, q };
});
caso('parpadeo determinista del ciclo: mismo ciclo y instante, mismo ojo; quieto, nunca parpadea', () =>
  T.parpadea(4, 1100, false) === true && T.parpadea(4, 1100, false) === true && T.parpadea(5, 1100, false) === false && T.parpadea(4, 1100, true) === false);
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
