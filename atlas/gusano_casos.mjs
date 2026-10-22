// PR-2 (FIRMO 2026-10-12): la trayectoria del gusano ES el dato. Pura de S_t; revela, no decide.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const RUTA = process.env.GUSANO || '../public/assets/worm_transition.js';
const W = require(RUTA);
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const S = { ciclo: 40, de: 'pliego-estado', a: 'pliego-lugares', delta: 300, intentos: 3, sello: 'LIVE' }, A = [20, 100], B = [20, 300];
caso('SABOTAJE 1 · mismo S_t, mismo gusano: el gusano no decide su rumbo (determinista, puro)', () =>
  JSON.stringify(W.gusano(S, A, B)) === JSON.stringify(W.gusano(Object.assign({}, S), A, B)) && JSON.stringify(W.gusano(S, A, B)) === JSON.stringify(W.gusano(Object.assign({ ajeno: 99 }, S), A, B)));
caso('neck: el progreso de scroll controla la curva; el ciclo elige el lado y las aperturas el cuerpo', () => {
  const a = W.gusano(S, A, B, 0.5), b = W.gusano(Object.assign({}, S, { delta: 1200 }), A, B, 0.5), c = W.gusano(Object.assign({}, S, { intentos: 7 }), A, B, 0.5), d = W.gusano(Object.assign({}, S, { ciclo: 41 }), A, B, 0.5);
  const desvio = (g) => Math.abs(g.puntos[12][0] - 20);
  return desvio(b) > desvio(a) && c.segmentos > a.segmentos && Math.sign(d.puntos[12][0] - 20) === -Math.sign(a.puntos[12][0] - 20) || { a: desvio(a), b: desvio(b), c: c.segmentos };
});
caso('SABOTAJE 2 · el color es el del sello de S_t (TABLA_SEMANTICA) o ninguno: sin la tabla cargada, null; no se inventa', () => W.gusano(S, A, B).hue === null);
caso('el gusano empieza en el origen y acaba en el destino', () => { const g = W.gusano(S, A, B); return g.puntos[0].join() === '20,100' && g.puntos[24].join() === '20,300' || g.puntos; });
caso('REVELA, NO DECIDE: la curva depende del scroll y el fichero no navega ni usa reloj de animacion', () => {
  const src = readFileSync(new URL(RUTA, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return !/\.click\(|\.hidden\s*=|Math\.random|Date\.|new Date|requestAnimationFrame/.test(src) || src.match(/\.click\(|\.hidden\s*=|Math\.random|Date\.|new Date|requestAnimationFrame/)[0];
});
caso('missing or invalid cycles use a neutral path instead of the parity of zero', () => {
  for (const ciclo of [null, undefined, NaN, Infinity, -1, 0.5, '40', 1000000001]) {
    const g = W.gusano({ ...S, ciclo }, A, B, 0.5);
    if (g.puntos[12].join() !== '20,200') { return { ciclo, midpoint: g.puntos[12] }; }
  }
  return W.gusano({ ...S, ciclo: 0 }, A, B, 0.5).puntos[12][0] !== 20;
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
