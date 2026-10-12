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
  return a.fase === 'NO_DATA' && /not born yet/.test(a.causa) && b.fase === 'naciendo' && b.edad === 5 && c.fase === 'vivo' || { a, b, c };
});
caso('lo desatendido se DESPINTA hasta NO_DATA con causa (nunca «0»)', () => {
  const g = L.estado(base, 100 + 130), m = L.estado(base, 100 + 200);
  return g.fase === 'gastado' && g.desgaste === 650 && m.fase === 'NO_DATA' && /unattended 200 cycles/.test(m.causa) && m.vida === 0 || { g, m };
});
caso('cuidar devuelve la vida (manifiesto nuevo, puro: el viejo no cambia)', () => {
  const c = L.cuida(base, 250), e = L.estado(c, 260);
  return e.fase === 'vivo' && e.desgaste === 50 && base.cuidado_tic === undefined || e;
});
caso('lo caducado es NO_DATA «caducado», no un edificio vacio', () => {
  const e = L.estado(Object.assign({}, base, { caduca_tic: 120 }), 130);
  return e.fase === 'NO_DATA' && /expired at cycle 120/.test(e.causa) || e;
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
  return malos.every((m) => L.estado(m, 200).fase === 'NO_DATA' && /manifest/.test(L.estado(m, 200).causa)) || malos.map((m) => L.estado(m, 200));
});
caso('los 9 tipos del canon, y solo esos', () => JSON.stringify(L.TIPOS) === JSON.stringify(['boya', 'observatorio', 'lapidas', 'cristal', 'botella', 'monumento', 'vivero', 'baliza', 'nombres']));
// La capa: la boya se ancla a tu casa y su cuidado es la ultima noticia LIVE (o ya STALE) de la Radio.
const A = require(process.env.CAPA || '../public/game/reef_buildings_layer.js').AtlasArrecife;
caso('la boya nace junto a tu casa (entera, valida) y sin casa no hay boya', () => {
  const m = A.manifiestoBoya({ x: 120.4, y: -33.6 });
  return A.manifiestoBoya(null) === null && m.col === 220 && m.fila === -134 && L.valida(m) === '' && m.tipo === 'boya' || m;
});
caso('su cuidado es la noticia LIVE/STALE mas reciente; NO_DATA y SIMULATED no la cuidan; sin noticias, null', () => {
  const r = [{ sello: 'LIVE', ciclo: 4 }, { sello: 'STALE', ciclo: 9 }, { sello: 'NO_DATA', ciclo: 30 }, { sello: 'SIMULATED', ciclo: 40 }];
  return A.cuidadoDe(r) === 9 && A.cuidadoDe([]) === null && A.cuidadoDe([{ sello: 'NO_DATA', ciclo: 3 }]) === null || A.cuidadoDe(r);
});
caso('un solo reloj: la boya cae a NO_DATA justo despues del STALE del chat (120 ciclos), no antes', () => {
  const m = Object.assign(A.manifiestoBoya({ x: 0, y: 0 }), { cuidado_tic: 100 });
  return L.estado(m, 100 + 120).fase !== 'NO_DATA' && L.estado(m, 100 + 125).fase === 'NO_DATA' || [L.estado(m, 220), L.estado(m, 225)];
});
// EL OBSERVATORIO: mirar cuesta tics, lo visto envejece por tramos y al NO_DATA la niebla vuelve.
caso('mirar CUESTA tics: durante COSTE ciclos no se despeja nada; al ciclo COSTE, si', () => {
  const v = A.manifiestoVista(500, -200, 40, 1), n = A.COSTE;
  const antes = A.circulosDe([v], 40 + n - 1, L), despues = A.circulosDe([v], 40 + n, L);
  return L.valida(v) === '' && antes.length === 0 && despues.length === 1 && despues[0].x === 500 && despues[0].r > 0 || { antes, despues };
});
caso('lo visto ENVEJECE por tramos: el radio no sube nunca y la huella de niebla cambia <= 5 veces en toda su vida', () => {
  const v = A.manifiestoVista(0, 0, 0, 1); let previo = Infinity, cambios = 0, huella = null;
  for (let t = A.COSTE; t < 400; t++) {
    const c = A.circulosDe([v], t, L), r = c.length ? c[0].r : 0, h = JSON.stringify(c);
    if (r > previo) { return 'el radio subio en el tic ' + t; }
    if (h !== huella) { cambios++; huella = h; } previo = r;
  }
  return cambios <= 5 || 'la niebla se rehace ' + cambios + ' veces';
});
caso('al NO_DATA la niebla vuelve (sin circulo) y lo gastado sigue despejado pero mas pequeno', () => {
  const v = A.manifiestoVista(0, 0, 0, 1), e1 = L.estado(v, 120), e2 = L.estado(v, 200);
  return e1.fase === 'gastado' && A.circulosDe([v], 120, L)[0].r < A.circulosDe([v], A.COSTE, L)[0].r && e2.fase === 'NO_DATA' && A.circulosDe([v], 200, L).length === 0 || { e1, e2 };
});
// EL ARRECIFE DE LAS LAPIDAS: lo desintegrado deja un recibo legible y determinista.
caso('FNV-1a de 32 bits con sus vectores conocidos ("" y "a")', () => A.fnv('') === '811c9dc5' && A.fnv('a') === 'e40c292c' || [A.fnv(''), A.fnv('a')]);
caso('el recibo dice que era, cuando nacio y murio, cuanto vivio, por que, y su huella (la misma en cualquier aparato)', () => {
  const v = A.manifiestoVista(0, 0, 10, 3), ult = L.vector(v, 150), r = A.recibo(v, 177, 'unattended 167 cycles', ult), r2 = A.recibo(JSON.parse(JSON.stringify(v)), 177, 'unattended 167 cycles', JSON.parse(JSON.stringify(ult)));
  return r.id === 'vista-3' && r.tipo === 'observatorio' && r.nace === 10 && r.muere === 177 && r.edad === 167 && /unattended/.test(r.causa) && /^[0-9a-f]{8}$/.test(r.huella) && JSON.stringify(r) === JSON.stringify(r2) || r;
});
caso('la huella CAMBIA si cambia el ultimo vector (no es decorativa)', () => {
  const v = A.manifiestoVista(0, 0, 10, 3);
  return A.recibo(v, 177, 'x', L.vector(v, 150)).huella !== A.recibo(v, 177, 'x', L.vector(v, 151)).huella;
});
// EL CRISTAL DE LATENCIA: mide tu hierro con los cuadros del mapa; NO_DATA sin cuadros, nunca «0 fps».
const K = require(process.env.CRISTAL || '../public/game/latency_crystal.js');
caso('sin cuadros suficientes no hay medida (NO_DATA, no «0»): con menos de MIN, null', () => K.resume(new Array(K.MIN - 1).fill(16.7)) === null && K.sello(null, 50) === 'NO_DATA');
caso('p50 y p10 (la banda): 90 % de cuadros a 60 fps y 10 % a 20 fps -> p50 60, p10 20', () => {
  const ds = new Array(90).fill(1000 / 60).concat(new Array(10).fill(50)), r = K.resume(ds);
  return r.cuadros === 100 && r.p50 === 60 && r.p10 === 20 || r;
});
caso('los niveles salen del p50: oro >= 55, plata >= 40, bronce >= 25, y dithering por debajo', () =>
  [58, 55, 54, 40, 39, 25, 24, 3].map((f) => K.nivel(f)[0]).join() === 'oro,oro,plata,plata,bronce,bronce,dithering,dithering' || [58, 55, 54, 40, 39, 25, 24, 3].map((f) => K.nivel(f)[0]));
caso('un hueco (pestana oculta, mapa en pausa) NO es un cuadro: no entra en la ventana', () => {
  const n0 = K.enVentana(); K.anota(1000); K.anota(1016); K.anota(1032); K.anota(5032); K.anota(5048);
  return K.enVentana() - n0 === 3 || K.enVentana() - n0;
});
caso('el evento envejece: LIVE hasta VIEJO ciclos, luego STALE', () => K.sello({ ciclo: 10 }, 10 + K.VIEJO) === 'LIVE' && K.sello({ ciclo: 10 }, 11 + K.VIEJO) === 'STALE');
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
