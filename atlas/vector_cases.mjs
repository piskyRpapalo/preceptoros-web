// EL VECTOR DEL JUEGO (FIRMO 2026-10-12, «piensa vectorialmente»): todo el estado visible en < 1 KB, leible por un LLM pequeno.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require(process.env.VECTOR || '../public/game/state_vector.js');
const C = require('../public/game/vector_contract.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const lleno = {
  instantanea: { ciclo: 1234, recursos: { cobre: 22, luz: 0, biomasa: 1, oxigeno: 244 } },
  cangrejo: { dx: -94.4, dy: -355.2, army: 2, swim: 1, reach: null },
  panel: { id: 'pliego-estado', sello: 'LIVE', edadN: 3 }, tutorial: { paso: 'summon', competencia: 3 },
  edificios: [{ id: 'boya-estado', fase: 'vivo', vida: 936 }, { id: 'vista-1', fase: 'NO_DATA', vida: null }],
  lugares: [{ nombre: 'Reef Patrol', g: 1, p: 0 }], nodos: [{ id: 'nodo.0.hexelion', med: 2, tot: 2 }], lapidas: 1,
  radio: [{ quien: 'Map', sello: 'LIVE', ciclo: 1230 }, { quien: 'Radio', sello: 'NO_DATA', ciclo: 0 }, { quien: 'Your crab', sello: 'LIVE', ciclo: 1233 }, { quien: 'Battle', sello: 'LIVE', ciclo: 1234 }]
};
caso('cabe en el TOPE (1 KB) con un estado completo', () => { const s = JSON.stringify(V.arma(lleno)); return s.length < V.TOPE || s.length; });
caso('lee lo que hay: ciclo, recursos, cangrejo (desplazamiento redondeado), panel, tutorial, edificios, lugares, nodos', () => {
  const v = V.arma(lleno);
  return v.c === 1234 && v.r.join() === '22,0,1,244' && v.k.join() === '-94,-355,2,1,' && v.p.join() === 'pliego-estado,LIVE,3' && v.t.join() === 'summon,3'
    && v.e.length === 2 && v.l[0].join() === 'Reef Patrol,1,0' && v.n[0].join() === 'nodo.0.hexelion,2/2' && v.z === 1 && v.q.length === 3 || v;
});
caso('vacio: cada hueco va a nd CON SU CAUSA (nunca un cero inventado, nunca undefined)', () => {
  const v = V.arma({}), j = JSON.stringify(v);
  return v.c === null && v.r === null && v.k === null && v.z === null && ['c', 'r', 'k', 't', 'z', 'e', 'l'].every((k) => typeof v.nd[k] === 'string' && v.nd[k].length > 5) && !/undefined|NaN/.test(j) || v;
});
caso('el esquema explica cada clave del vector (lo que lee un LLM pequeno)', () => { const e = V.esquema(), v = V.arma(lleno); return Object.keys(v).every((k) => e[k]) || Object.keys(v).filter((k) => !e[k]); });
caso('solo LEE: armar dos veces el mismo estado da el mismo vector (determinista, sin reloj)', () => JSON.stringify(V.arma(lleno)) === JSON.stringify(V.arma(lleno)));
caso('acota por bytes UTF-8 reales y vuelve a medir tras el recorte (unicode)', () => {
  if (typeof V.acota !== 'function') { return 'falta el contrato acota'; }
  const input = V.arma({ ...lleno, radio: [{ quien: 'é'.repeat(400), sello: 'LIVE', ciclo: 1 }] });
  const out = V.acota(input), bytes = Buffer.byteLength(JSON.stringify(out.vector), 'utf8');
  return out.estado === 'recortado' && out.bytes === bytes && bytes < V.TOPE
    && out.vector.q.length === 0 && typeof out.vector.nd.recorte === 'string' || out;
});
caso('si el recorte normal no basta, fail-closed conserva contrato y causa', () => {
  if (typeof V.acota !== 'function') { return 'falta el contrato acota'; }
  const input = V.arma({ ...lleno, edificios: Array.from({ length: 80 }, (_, n) => ({ id: 'estructura-' + n, fase: 'vivo', vida: 1000 })) });
  const out = V.acota(input), bytes = Buffer.byteLength(JSON.stringify(out.vector), 'utf8');
  return out.estado === 'fail-closed' && out.bytes === bytes && bytes < V.TOPE
    && out.vector.e.length === 0 && typeof out.vector.nd.recorte === 'string' || out;
});
caso('el contrato cerrado admite el vector medido y rechaza claves o ausencias sin causa', () => {
  const bueno = V.arma(lleno), extra = { ...bueno, sorpresa: true };
  const sinCausa = { ...bueno, r: null, nd: { ...bueno.nd } }; delete sinCausa.nd.r;
  return C.valida(bueno) && !C.valida(extra) && !C.valida(sinCausa) || { bueno: C.valida(bueno), extra: C.valida(extra), sinCausa: C.valida(sinCausa) };
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
