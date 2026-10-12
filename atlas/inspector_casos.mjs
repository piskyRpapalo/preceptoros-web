// 0d · EL INSPECTOR HONESTO: toda ficha dice que es, estado, coordenada y sonido; lo ausente es NO_DATA con causa.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const I = require(process.env.INSP || '../public/game/piece_inspector.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const malo = (lin) => /\bundefined\b|\bNaN\b|\bnull\b/.test(JSON.stringify(lin));
caso('ficha vacia: cinco campos... y todos NO_DATA con causa, ninguno undefined', () => {
  const l = I.lineas({}, undefined, NaN);
  return l.length === 4 && l.every((x) => /NO_DATA \(/.test(x[1])) && !malo(l) || l;
});
caso('texto armado con un ausente («army undefined») sale «army NO_DATA»', () => {
  const l = I.lineas({ que: 'Your crab', estado: 'army ' + undefined + ' · cycle ' + NaN }, 10, 20);
  return l[1][1] === 'army NO_DATA · cycle NO_DATA' && !malo(l) || l;
});
caso('la coordenada es la del mundo y su profundidad; el sonido declarado se respeta', () => {
  const l = I.lineas({ que: 'State buoy', estado: 'vivo', sonido: 'ADSR beep 880 Hz' }, 120.4, -33.6);
  return l[2][1] === 'world (120, -34) · depth 87' && l[3][1] === 'ADSR beep 880 Hz' || l;
});
caso('lo que no suena es NO_DATA sonoro, declarado (no un hueco)', () => /^NO_DATA \(.+\)$/.test(I.lineas({ que: 'x', estado: 'y' }, 0, 0)[3][1]));
caso('las notas (causas) tambien pasan por el formateo honesto', () => { const l = I.lineas({ que: 'a', estado: 'b', causas: [undefined, 'ok'] }, 0, 0); return l.length === 6 && !malo(l) || l; });
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
