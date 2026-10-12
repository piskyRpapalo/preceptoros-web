// LOS 9 OBJETOS · ciclo de vida en tics (FIRMO 2026-10-12): puro, replay-safe, NO_DATA con causa y ∇C como telemetria.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require(process.env.EDIF || '../public/game/reef_building_lifecycle.js');
const casos = [];
function caso(nombre, f) {
  try { const r = f(); casos.push({ caso: nombre, ok: r === true, detalle: r === true ? '' : JSON.stringify(r).slice(0, 300) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: String(e && e.message || e) }); }
}
const base = { esquema: 'preceptoros.edificio/1', id: 'boya-1', tipo: 'boya', col: 3, fila: 2, huella: 1, nace_tic: 100, madura_tics: 10, desgaste_por_tic: 5, carga: 400, escudo: 200 };
caso('nace en ciclos: antes de nacer es NO_DATA con causa; luego «naciendo» y despues «vivo»', () => {
  const a = L.estado(base, 50), b = L.estado(base, 105), c = L.estado(base, 115);
  return a.fase === 'NO_DATA' && /nacido/.test(a.causa) && b.fase === 'naciendo' && b.edad === 5 && c.fase === 'vivo' || { a, b, c };
});
caso('lo desatendido se DESPINTA hasta NO_DATA con causa (nunca «0»)', () => {
  const g = L.estado(base, 100 + 130), m = L.estado(base, 100 + 200);
  return g.fase === 'gastado' && g.desgaste === 650 && m.fase === 'NO_DATA' && /desatendido 200 tics/.test(m.causa) && m.vida === 0 || { g, m };
});
caso('cuidar devuelve la vida (manifiesto nuevo, puro: el viejo no cambia)', () => {
  const c = L.cuida(base, 250), e = L.estado(c, 260);
  return e.fase === 'vivo' && e.desgaste === 50 && base.cuidado_tic === undefined || e;
});
caso('lo caducado es NO_DATA «caducado», no un edificio vacio', () => {
  const e = L.estado(Object.assign({}, base, { caduca_tic: 120 }), 130);
  return e.fase === 'NO_DATA' && /caducado en el tic 120/.test(e.causa) || e;
});
caso('replay: el mismo tic da el mismo vector en cualquier aparato', () => {
  return JSON.stringify(L.vector(base, 140)) === JSON.stringify(L.vector(JSON.parse(JSON.stringify(base)), 140));
});
caso('∇C es telemetria: mas vida = mas verde (Hue), mas carga = mas saturado, mas escudo = mas claro', () => {
  const sano = L.color(base, 112), gastado = L.color(base, 230);
  const cargado = L.color(Object.assign({}, base, { carga: 1000 }), 112), blindado = L.color(Object.assign({}, base, { escudo: 1000 }), 112);
  return sano.h > gastado.h && cargado.s > sano.s && blindado.l > sano.l || { sano, gastado, cargado, blindado };
});
caso('lo NO_DATA no tiene color de dato: gris translucido', () => {
  const c = L.color(base, 400);
  return c.nd === true && c.s === 0 && c.a < 1 || c;
});
caso('el manifiesto se valida: tipo, celda, huella y tiempos enteros; si no, NO_DATA con la causa', () => {
  const malos = [Object.assign({}, base, { tipo: 'casino' }), Object.assign({}, base, { huella: 9 }), Object.assign({}, base, { nace_tic: 1.5 }), Object.assign({}, base, { id: 'Con Espacios' })];
  return malos.every((m) => L.estado(m, 200).fase === 'NO_DATA' && /manifiesto/.test(L.estado(m, 200).causa)) || malos.map((m) => L.estado(m, 200));
});
caso('los 9 tipos del canon, y solo esos', () => JSON.stringify(L.TIPOS) === JSON.stringify(['boya', 'observatorio', 'lapidas', 'cristal', 'botella', 'monumento', 'vivero', 'baliza', 'nombres']));
// La capa: la boya se ancla a tu casa y su cuidado es la ultima noticia LIVE (o ya STALE) de la Radio.
const A = require(process.env.CAPA || '../public/game/reef_buildings_layer.js').AtlasArrecife;
caso('la boya nace junto a tu casa (entera, valida) y sin casa no hay boya', () => {
  const m = A.manifiestoBoya({ x: 120.4, y: -33.6 });
  return A.manifiestoBoya(null) === null && m.col === 190 && m.fila === -84 && L.valida(m) === '' && m.tipo === 'boya' || m;
});
caso('su cuidado es la noticia LIVE/STALE mas reciente; NO_DATA y SIMULATED no la cuidan; sin noticias, null', () => {
  const r = [{ sello: 'LIVE', ciclo: 4 }, { sello: 'STALE', ciclo: 9 }, { sello: 'NO_DATA', ciclo: 30 }, { sello: 'SIMULATED', ciclo: 40 }];
  return A.cuidadoDe(r) === 9 && A.cuidadoDe([]) === null && A.cuidadoDe([{ sello: 'NO_DATA', ciclo: 3 }]) === null || A.cuidadoDe(r);
});
caso('un solo reloj: la boya cae a NO_DATA justo despues del STALE del chat (120 ciclos), no antes', () => {
  const m = Object.assign(A.manifiestoBoya({ x: 0, y: 0 }), { cuidado_tic: 100 });
  return L.estado(m, 100 + 120).fase !== 'NO_DATA' && L.estado(m, 100 + 125).fase === 'NO_DATA' || [L.estado(m, 220), L.estado(m, 225)];
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
