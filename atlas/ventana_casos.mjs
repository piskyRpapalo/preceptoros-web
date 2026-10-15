// PR-1 (FIRMO 2026-10-12): la ventana como UNA entidad; el sello y la edad salen de lo MEDIDO (ciclos), nunca del reloj.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require(process.env.VENTANA || '../public/assets/terminal_window_frame.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
caso('LIVE si el panel cambio hace <= 120 ciclos; STALE si mas (lo viejo no se pinta como fresco)', () => {
  const a = V.cabecera('pliego-estado', 'Your crab', 100, 220), b = V.cabecera('pliego-estado', 'Your crab', 100, 221);
  return a.sello === 'LIVE' && a.edad === 'Δ 120 cycles since last change seen' && b.sello === 'STALE' || { a, b };
});
caso('sin ciclo medido: NO_DATA con causa, en sello y edad', () => { const c = V.cabecera('pliego-estado', 'x', null, null); return c.sello === 'NO_DATA' && /NO_DATA \(/.test(c.edad) || c; });
caso('panel sin fuente declarada o sin titulo: NO_DATA con causa (jamas undefined)', () => {
  const c = V.cabecera('panel-raro', '', 5, 6), j = JSON.stringify(c);
  return /NO_DATA \(source not declared\)/.test(c.fuente) && /NO_DATA \(untitled/.test(c.titulo) && !/undefined|NaN/.test(j) || c;
});
caso('cada panel conocido del cajon declara su fuente', () => ['pliego-estado', 'pliego-lugares', 'pliego-entrada', 'terminal-cangrejo', 'radio-estado', 'pliego-lapidas', 'pliego-skills', 'pliego-ficha', 'pliego-tutorial'].every((k) => V.FUENTES[k]));
for (const bad of [undefined, null, NaN, Infinity, -1, 1.5, '4', 1000000001]) {
  caso('invalid measured cycle stays NO_DATA: ' + String(bad), () => {
    const a = V.cabecera('pliego-estado', 'State', bad, 10);
    const b = V.cabecera('pliego-estado', 'State', 0, bad);
    return [a, b].every((x) => x.sello === 'NO_DATA' && /NO_DATA \(/.test(x.edad)) || { a, b };
  });
}
caso('a reset cannot turn a future observation into a fresh measurement', () => {
  const c = V.cabecera('pliego-estado', 'State', 20, 10);
  return c.sello === 'NO_DATA' && /NO_DATA \(/.test(c.edad) || c;
});
caso('zero and upper cycle boundary remain measured', () => {
  const a = V.cabecera('pliego-estado', 'State', 0, 0), b = V.cabecera('pliego-estado', 'State', 1000000000, 1000000000);
  return [a, b].every((x) => x.sello === 'LIVE' && x.edad === 'Δ 0 cycles since last change seen') || { a, b };
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
