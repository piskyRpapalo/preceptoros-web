// A (FIRMO 2026-10-12): los corales del rack pintan ESTADO MEDIDO (cuantas medidas en MEDIDO), jamas adorno.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const K = require(process.env.CORAL || '../public/game/reef_corals.js');
const Ce = require('../public/game/nodos-cedulas.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
caso('Hexelion (2 MEDIDO) es un coral alto; el Doogee (EMULADO + NO_DATA) es NO_DATA: lo emulado no cuenta', () => {
  const h = K.coral(Ce.nodos.find((n) => n.nodo === 'nodo.0.hexelion')), d = K.coral(Ce.nodos.find((n) => n.nodo === 'nodo.1.doogee'));
  return h.medidas === 2 && !h.nd && d.medidas === 0 && d.nd && d.emuladas === 1 && h.altura > d.altura || { h, d };
});
caso('la forma sale del nombre (determinista), nunca del azar', () => JSON.stringify(K.coral({ nodo: 'x', aparato: { medidas: {} } })) === JSON.stringify(K.coral({ nodo: 'x', aparato: { medidas: {} } })));
caso('nodo sin cedula: NO_DATA, sin romper', () => { const k = K.coral(null); return k.nd && k.total === 0 || k; });
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
