// A1B8 · un estado, muchos renders: las unidades de la carta son las del Army (las mismas semillas), y sin Army, NO_DATA.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require(process.env.CARTA || '../public/assets/atlas-carta.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const tropas = [{ tc: 'tc1', rareza: 'comun', semilla: 'aaaaaaaa11' }, { tc: 'tc3', rareza: 'rara', semilla: 'bbbbbbbb22' }];
caso('sin Army cargado: NO_DATA con causa, nunca una lista vacia muda', () => { const u = C.unidades(null); return u.valor === null && /army/.test(u.causa) || u; });
caso('con Army: una unidad por tropa, mismas semillas, sin undefined', () => {
  const u = C.unidades(tropas), j = JSON.stringify(u);
  return u.length === 2 && u[0].semilla === 'aaaaaaaa' && u[1].tc === 'tc3' && !/undefined|null/.test(j) || u;
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
