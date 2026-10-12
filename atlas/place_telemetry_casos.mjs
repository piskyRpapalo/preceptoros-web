// ∇C de los lugares (opcion A): del registro de combate {g, p}; sin combate, NO_DATA translucido (nunca 0).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Z = require(process.env.NABLA || '../public/game/place_telemetry.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const lider = (a) => ({ stats: { armadura: a } });
caso('sin combate: null y color gris translucido; la ficha dice NO_DATA con causa', () => {
  const v = Z.vector({ g: 0, p: 0 }, lider(5)), c = Z.color(v);
  return v === null && Z.vector(undefined, lider(5)) === null && c.nd && c.a < 1 && /NO_DATA \(not fought/.test(Z.estado(v)) || { v, c };
});
caso('3-0 mas verde que 0-3 (Hue = cuota de victorias)', () => Z.color(Z.vector({ g: 3, p: 0 }, lider(5))).h > Z.color(Z.vector({ g: 0, p: 3 }, lider(5))).h);
caso('mas combates, mas saturado (tope 10)', () => Z.color(Z.vector({ g: 5, p: 5 }, lider(5))).s > Z.color(Z.vector({ g: 1, p: 1 }, lider(5))).s && Z.vector({ g: 40, p: 0 }, lider(5)).carga === 1000);
caso('mas armadura, mas claro; sin stat de armadura, el escudo es NO_DATA en la ficha', () => {
  const a = Z.color(Z.vector({ g: 1, p: 1 }, lider(18))).l > Z.color(Z.vector({ g: 1, p: 1 }, lider(2))).l, sin = Z.estado(Z.vector({ g: 1, p: 0 }, {}));
  return a && /shield NO_DATA/.test(sin) || sin;
});
caso('entero y determinista, sin undefined ni NaN', () => { const v = Z.vector({ g: 2, p: 1 }, lider(7)), j = JSON.stringify([v, Z.color(v), Z.estado(v)]);
  return Number.isInteger(v.vida) && !/undefined|NaN/.test(j) && j === JSON.stringify([Z.vector({ g: 2, p: 1 }, lider(7)), Z.color(v), Z.estado(v)]) || j; });
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
