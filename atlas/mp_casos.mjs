// Casos deterministas del MULTIJUGADOR de theGame (auditoria MGNO §3). Los ejecuta atlas/test_atlas.py:
//     node atlas/mp_casos.mjs              -> una linea JSON: [{caso, ok, detalle}]
//     node atlas/mp_casos.mjs --muestras   -> objetos de muestra para validarlos contra data/*.json
// Sin red, sin reloj, sin azar del sistema: identidades de prueba deterministas (mp_firma.mjs).
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { identidad, verificador, cadena, azar } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const S = require('../public/game/sobres.js');
const A = require('../public/game/arena.js');
const M = require('../public/game/mercado.js');
const N = require('../public/game/narragrafo.js');
const V = require('../public/game/valores.js');

const casos = [];
async function caso(nombre, fn) {
  try { const d = await fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${JSON.stringify(a)} != ${JSON.stringify(b)}`;
const lanza = (fn) => { try { fn(); return 'no lanzo'; } catch (e) { return true; } };
const todas = (...xs) => xs.find((x) => x !== true) ?? true;
const copia = (x) => JSON.parse(JSON.stringify(x));

const ANA = identidad('ana'), BEA = identidad('bea'), CRIS = identidad('cris');
const pares = (...ids) => ids.map((i) => i.pub).sort();
const politica = (modo, ids, extra = {}) => ({
  esquema: 'atlas.mp_sesion/1', modo, pares: pares(...ids), quorum: extra.quorum ?? ids.length,
  max_bytes: extra.max_bytes ?? 8192, max_ops: extra.max_ops ?? 200, semilla: 'commit_reveal',
  conflicto: 'poda_gana', contenido_v: '2026-09-27.1', nonce: extra.nonce ?? '0'.repeat(31) + '1'
});
const muestras = {};

// ---------------------------------------------------------------- canonico, huella, PRNG, loteria
await caso('canon: mismo objeto con otro orden de claves, mismos bytes', () =>
  igual(K.canon({ b: 1, a: { d: [1, 2], c: 'x' } }), K.canon({ a: { c: 'x', d: [1, 2] }, b: 1 })));
await caso('canon: sin espacios y lo no ASCII escapado', () =>
  igual(K.canon({ t: 'ñandú ✦', n: -3 }), '{"n":-3,"t":"\\u00f1and\\u00fa \\u2726"}'));
await caso('canon: rechaza decimales, NaN y undefined', () =>
  todas(lanza(() => K.canon({ x: 0.5 })), lanza(() => K.canon({ x: NaN })), lanza(() => K.canon({ x: undefined }))));
await caso('huella: el SHA-256 puro coincide con el de node', () => {
  const t = K.canon({ a: 1, b: ['x', 2] });
  return igual(K.huella({ b: ['x', 2], a: 1 }), createHash('sha256').update(t).digest('hex'));
});
await caso('PRNG: misma semilla, misma secuencia; fijada para cualquier motor', () => {
  const g = K.generador('ab'.repeat(32)), h = K.generador('ab'.repeat(32));
  const a = [0, 1, 2, 3, 4, 5].map(() => g.u32()), b = [0, 1, 2, 3, 4, 5].map(() => h.u32());
  return todas(igual(a.join(), b.join()), igual(K.generador('0'.repeat(64)).u32(), 1144304738));
});
await caso('PRNG: uniforme siempre dentro del rango (con rechazo)', () => {
  const g = K.generador('cd'.repeat(32));
  for (const n of [1, 2, 3, 7, 1000, 3 * 2 ** 30, 2 ** 32]) {
    for (let i = 0; i < 200; i++) { const x = g.uniforme(n); if (!(x >= 0 && x < n && Number.isInteger(x))) { return 'fuera: ' + n; } }
  }
  return true;
});
await caso('loteria: frecuencias pegadas a los pesos enteros (20 000 sorteos)', () => {
  const g = K.generador('ef'.repeat(32)), p = [1, 3, 6], c = [0, 0, 0];
  for (let i = 0; i < 20000; i++) { c[K.loteria(p, g)]++; }
  const ok = c.every((x, i) => Math.abs(x - 20000 * p[i] / 10) < 400);
  return ok || c.join();
});
await caso('odds en puntos basicos: exactas y el resto se dice', () => {
  const o = K.puntosBasicos([5, 40, 250, 705]);
  return todas(igual(o.pb.join(), '50,400,2500,7050'), igual(o.resto, 0), igual(K.puntosBasicos([1, 1, 1]).resto, 1));
});

// ---------------------------------------------------------------- sobres y libro
const PD = politica('duelo', [ANA, BEA]), SD = S.sesion(PD);
await caso('sesion: la politica se valida y su huella es la sesion', () =>
  todas(igual(SD, K.huella(PD)), lanza(() => S.sesion({ ...PD, pares: [PD.pares[1], PD.pares[0]] })),
        lanza(() => S.sesion({ ...PD, semilla: 'firma' })), lanza(() => S.sesion({ ...PD, extra: 1 }))));

await caso('sobre: firma buena verifica; alterado o con otra clave, no', async () => {
  const s = cadena(S, ANA, SD)('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  const alterado = copia(s); alterado.cuerpo.c = 'b'.repeat(64);
  const otraClave = copia(s); otraClave.de = BEA.pub;
  return todas(igual(await S.verifica(s, verificador), true), igual(await S.verifica(alterado, verificador), false),
               igual(await S.verifica(otraClave, verificador), false));
});
await caso('sobre: la forma rechaza campo de mas, tipo, prev, pseudonimo con enlace, sin firma', () => {
  const s = cadena(S, ANA, SD)('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  muestras.sobre = s;
  const malos = [{ ...s, extra: 1 }, { ...s, tipo: 'firmar_por_ti' }, { ...s, prev: 'a'.repeat(64) },
                 { ...s, pseudonimo: 'ana@correo' }, { ...s, pseudonimo: 'https:x' }, { ...s, firma: '' },
                 { ...s, cuerpo: { esquema: 'atlas.oferta/1' } }];
  return todas(igual(S.forma(s), ''), ...malos.map((m, i) => S.forma(m) ? true : 'pasa el malo ' + i));
});
await caso('libro: en orden entra; el viejo repetido, el hueco y el prev roto no', () => {
  const L = S.libro(PD), c = cadena(S, ANA, SD);
  const s1 = c('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  const s2 = c('revelacion', { esquema: 'atlas.revelacion/1', r: 'b'.repeat(64), compromisos: 'c'.repeat(64) });
  const s3 = c('revelacion', { esquema: 'atlas.revelacion/1', r: 'd'.repeat(64), compromisos: 'c'.repeat(64) });
  const roto = { esquema: 'atlas.sobre/1', tipo: 'revelacion', sesion: SD, de: ANA.pub, pseudonimo: ANA.pseudonimo, seq: 3,
                 prev: 'f'.repeat(64), contenido_v: '2026-09-27.1', cuerpo: s3.cuerpo };
  roto.firma = 'ed25519:' + ANA.firma(S.mensaje(roto));
  return todas(igual(S.anota(L, s1), ''), igual(S.anota(L, s1), 'duplicado'), igual(S.anota(L, s3), 'falta el seq 2'),
               igual(S.anota(L, s2), ''), igual(S.anota(L, roto), 'prev no enlaza'), igual(S.anota(L, s3), ''));
});
await caso('libro: replica de otra sesion y quien no es par, fuera', () => {
  const otra = S.sesion(politica('duelo', [ANA, BEA], { nonce: '0'.repeat(31) + '2' }));
  const L = S.libro(PD);
  const r = cadena(S, ANA, otra)('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  const x = cadena(S, CRIS, SD)('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  return todas(igual(S.anota(L, r), 'sesion ajena: replica de otra sesion'), igual(S.anota(L, x), 'no es par de la sesion'));
});
await caso('libro: doble gasto (mismo seq, otro cuerpo) = prueba de fraude y el par queda fuera', () => {
  const L = S.libro(PD);
  const a = cadena(S, ANA, SD)('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  const b = cadena(S, ANA, SD)('compromiso', { esquema: 'atlas.compromiso/1', c: 'e'.repeat(64) });
  S.anota(L, a); S.anota(L, b);
  const tras = cadena(S, ANA, SD); tras('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  const s2 = tras('revelacion', { esquema: 'atlas.revelacion/1', r: 'b'.repeat(64), compromisos: 'c'.repeat(64) });
  return todas(igual(L.fraudes.length, 1), igual(L.fraudes[0].a, S.huella(a)), igual(L.fraudes[0].b, S.huella(b)),
               igual(S.anota(L, s2), 'par con fraude probado'));
});
await caso('libro: topes de bytes y de operaciones de la politica', () => {
  const P = politica('duelo', [ANA, BEA], { max_ops: 1, max_bytes: 512 }), s = S.sesion(P), L = S.libro(P), c = cadena(S, ANA, s);
  const s1 = c('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) });
  const L2 = S.libro(politica('duelo', [ANA, BEA], { max_ops: 1, max_bytes: 4096 }));
  return todas(igual(S.anota(L, s1), 'pasa de los bytes de la politica'),
               igual(S.anota(L2, cadena(S, ANA, L2.sesion)('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) })), ''));
});

// ---------------------------------------------------------------- commit-reveal
function ronda(L, ids, rs, opciones = {}) {
  const cs = opciones.cadenas || ids.map((id) => cadena(S, id, L.sesion));
  const com = ids.map((id, i) => cs[i]('compromiso', { esquema: 'atlas.compromiso/1', c: S.compromiso(rs[i], id.pub, L.sesion) }));
  const conj = {};
  ids.forEach((id, i) => { conj[id.pub] = com[i].cuerpo.c; });
  const hc = S.huellaConjunto(conj);
  const rev = ids.map((id, i) => cs[i]('revelacion', { esquema: 'atlas.revelacion/1', r: opciones.falsa === i ? azar('otra') : rs[i], compromisos: hc }));
  return { com, rev, cs };
}
await caso('commit-reveal: semilla igual llegue en el orden que llegue', () => {
  const rs = [azar('a1'), azar('b1')];
  const L1 = S.libro(PD), { com, rev } = ronda(L1, [ANA, BEA], rs);
  S.anotaTodos(L1, [...com, ...rev]);
  const L2 = S.libro(PD);
  S.anotaTodos(L2, [rev[1], com[0], rev[0], com[1]]);
  const a = S.semilla(L1), b = S.semilla(L2);
  return todas(igual(a.ok, true), igual(a.semilla, b.semilla));
});
await caso('commit-reveal: sin todas las revelaciones no hay semilla (NO_DATA)', () => {
  const L = S.libro(PD), { com, rev } = ronda(L, [ANA, BEA], [azar('a2'), azar('b2')]);
  S.anotaTodos(L, [...com, rev[0]]);
  const x = S.semilla(L);
  return todas(igual(x.ok, false), /falta la revelacion/.test(x.motivo) || x.motivo);
});
await caso('commit-reveal: revelacion falsa, rechazada', () => {
  const L = S.libro(PD), { com, rev } = ronda(L, [ANA, BEA], [azar('a3'), azar('b3')], { falsa: 1 });
  S.anotaTodos(L, [...com, ...rev]);
  return /revelacion falsa/.test(S.semilla(L).motivo) || S.semilla(L).motivo;
});
await caso('commit-reveal: compromiso duplicado, rechazado', () => {
  const L = S.libro(PD), c = cadena(S, ANA, SD);
  S.anota(L, c('compromiso', { esquema: 'atlas.compromiso/1', c: 'a'.repeat(64) }));
  S.anota(L, c('compromiso', { esquema: 'atlas.compromiso/1', c: 'b'.repeat(64) }));
  return /compromiso duplicado/.test(S.semilla(L).motivo) || S.semilla(L).motivo;
});
await caso('commit-reveal: un compromiso tardio (tras ver una revelacion) bloquea, no elige', () => {
  const P = politica('cooperativo', [ANA, BEA, CRIS], { quorum: 2 }), L = S.libro(P);
  const { com, rev } = ronda(L, [ANA, BEA], [azar('a4'), azar('b4')]);
  S.anotaTodos(L, [...com, ...rev]);
  const antes = S.semilla(L);
  S.anota(L, cadena(S, CRIS, L.sesion)('compromiso', { esquema: 'atlas.compromiso/1', c: 'f'.repeat(64) }));
  const tras = S.semilla(L);
  return todas(igual(antes.ok, true), igual(tras.ok, false), /tardio/.test(tras.motivo) || tras.motivo);
});
await caso('commit-reveal: el ultimo en revelar no puede elegir (50 r distintos, todos falsos)', () => {
  for (let i = 0; i < 50; i++) {
    const L = S.libro(PD), { com, rev } = ronda(L, [ANA, BEA], [azar('a5'), azar('b5')]);
    const cb = cadena(S, BEA, SD);
    cb('compromiso', com[1].cuerpo);
    const trampa = cb('revelacion', { esquema: 'atlas.revelacion/1', r: azar('trampa' + i), compromisos: rev[1].cuerpo.compromisos });
    S.anotaTodos(L, [...com, rev[0], trampa]);
    if (S.semilla(L).ok) { return 'elegida con r ' + i; }
  }
  return true;
});
await caso('commit-reveal: sin quorum de compromisos, NO_DATA', () => {
  const L = S.libro(politica('cooperativo', [ANA, BEA, CRIS], { quorum: 3 }));
  const { com } = ronda(L, [ANA, BEA], [azar('a6'), azar('b6')]);
  S.anotaTodos(L, com);
  return /faltan compromisos/.test(S.semilla(L).motivo) || S.semilla(L).motivo;
});

// ---------------------------------------------------------------- arena: duelo fantasma
const PACK = A.packSha();
const tropasAna = [0, 1, 2].map((i) => ({ tc: 'tc2', semilla: azar('tropa-ana-' + i) }));
const tropasBea = [0, 1, 2].map((i) => ({ tc: 'tc2', semilla: azar('tropa-bea-' + i) }));
const PT = politica('tablon', [BEA], { quorum: 1 }), ST = S.sesion(PT);
const defensa = cadena(S, BEA, ST)('defensa', { esquema: 'atlas.defensa/1', pack_sha: PACK, tropas: tropasBea, en_juego: { cobre: 100, luz: 0 } });
function duelo(opciones = {}) {
  const L = S.libro(PD);
  const ca = cadena(S, ANA, SD), cb = cadena(S, BEA, SD);
  const ra = azar('ra' + (opciones.sal || '')), rb = azar('rb' + (opciones.sal || ''));
  const asalto = ca('asalto', { esquema: 'atlas.asalto/1', defensa: S.huella(opciones.defensa || defensa), pack_sha: opciones.pack || PACK, tropas: tropasAna });
  const comA = ca('compromiso', { esquema: 'atlas.compromiso/1', c: S.compromiso(ra, ANA.pub, SD) });
  const comB = cb('compromiso', { esquema: 'atlas.compromiso/1', c: S.compromiso(rb, BEA.pub, SD) });
  const hc = S.huellaConjunto({ [ANA.pub]: comA.cuerpo.c, [BEA.pub]: comB.cuerpo.c });
  const revA = ca('revelacion', { esquema: 'atlas.revelacion/1', r: ra, compromisos: hc });
  const revB = cb('revelacion', { esquema: 'atlas.revelacion/1', r: rb, compromisos: hc });
  S.anotaTodos(L, [asalto, comA, comB, revA, revB]);
  return { L, asalto };
}
await caso('arena: abandono solo si el otro se comprometio y NO revelo, y lo reclama quien si revelo', () => {
  const L = S.libro(PD), ca = cadena(S, ANA, SD), cb = cadena(S, BEA, SD), ra = azar('ab-a'), rb = azar('ab-b');
  const as = ca('asalto', { esquema: 'atlas.asalto/1', defensa: S.huella(defensa), pack_sha: PACK, tropas: tropasAna });
  const cA = ca('compromiso', { esquema: 'atlas.compromiso/1', c: S.compromiso(ra, ANA.pub, SD) });
  const cB = cb('compromiso', { esquema: 'atlas.compromiso/1', c: S.compromiso(rb, BEA.pub, SD) });
  const hc = S.huellaConjunto({ [ANA.pub]: cA.cuerpo.c, [BEA.pub]: cB.cuerpo.c });
  const rB = cb('revelacion', { esquema: 'atlas.revelacion/1', r: rb, compromisos: hc });
  S.anotaTodos(L, [as, cA, cB, rB]);
  const ok = A.abandono(L, defensa, BEA.pub), mal = A.abandono(L, defensa, ANA.pub);
  S.anota(L, ca('revelacion', { esquema: 'atlas.revelacion/1', r: ra, compromisos: hc }));
  const tarde = A.abandono(L, defensa, BEA.pub);
  return todas(igual(ok.ok, true), igual(ok.resultado.gana, 'defensa'), igual(ok.resultado.final, 'abandono'),
               igual(A.compruebaResultado(L, defensa, ok.resultado), 'el otro ya revelo: no hay abandono'),
               /no se comprometio y revelo/.test(mal.motivo) || mal.motivo, igual(tarde.motivo, 'el otro ya revelo: no hay abandono'));
});
await caso('arena: pack_sha estable y distinto si cambian los valores', () => {
  const V2 = copia(V); V2.combate.k = 33;
  return todas(igual(A.packSha(), A.packSha(copia(V))), A.packSha(V2) !== PACK || 'mismo pack');
});
await caso('arena: el combate es determinista y entero', () => {
  const s = azar('semilla-combate'), a = A.combate(tropasBea, tropasAna, s), b = A.combate(tropasBea, tropasAna, s);
  const enteros = a.registro.every((r) => r.every(Number.isInteger));
  return todas(igual(K.canon(a), K.canon(b)), enteros || 'decimal en el registro', a.rondas >= 1 || 'sin rondas');
});
await caso('arena: duelo completo por sobres, y cualquiera lo comprueba', () => {
  const { L } = duelo(), x = A.resuelve(L, defensa, 'humano');
  if (!x.ok) { return x.motivo; }
  muestras.resultado = x.resultado; muestras.defensa = defensa.cuerpo; muestras.asalto = S.aceptados(L, 'asalto')[0].cuerpo;
  const trucado = { ...x.resultado, gana: x.resultado.gana === 'asalto' ? 'defensa' : 'asalto' };
  return todas(igual(A.compruebaResultado(L, defensa, x.resultado), ''),
               igual(A.compruebaResultado(L, defensa, trucado), 'el resultado no sale al volver a jugarlo'));
});
await caso('arena: con otros valores (pack distinto) el duelo no se resuelve', () => {
  const { L } = duelo({ pack: 'f'.repeat(64) });
  return igual(A.resuelve(L, defensa, 'humano').motivo, 'pack distinto: no es el mismo juego');
});
await caso('arena: una tropa con cifras propias no pasa (solo tc y semilla)', () => {
  const c = copia(muestras.asalto); c.tropas[0].stats = { vida: 9999 };
  const d = copia(defensa.cuerpo); d.tropas[0].tc = 'tc9';
  return todas(A.formaAsalto(c) ? true : 'pasa con stats', A.formaDefensa(d) ? true : 'pasa con tc9');
});
await caso('arena: sin asalto no hay duelo, y nadie se asalta a si mismo', () => {
  const L = S.libro(PD);
  const propia = cadena(S, ANA, ST)('defensa', defensa.cuerpo);
  return todas(/sin asalto/.test(A.resuelve(L, defensa, 'humano').motivo),
               /no es par|asalto/.test(A.resuelve(duelo().L, propia, 'humano').motivo) || 'se asalta a si misma');
});
await caso('arena: patrulla (PvE) determinista y etiquetada sintetico', () => {
  const p1 = A.patrulla(azar('sector-1'), 3, 'tc1'), p2 = A.patrulla(azar('sector-1'), 3, 'tc1');
  const c = A.combate(p1.tropas, tropasAna, azar('pve'));
  return todas(igual(K.canon(p1), K.canon(p2)), igual(A.formaDefensa(p1), ''), igual(typeof c.gana, 'string'));
});
await caso('rating: entero, simetrico y con K provisional', () => {
  const e = A.esperado(1200, 1000), e2 = A.esperado(1000, 1200);
  const u = A.actualiza(1000, 1000, 1000, 0), w = A.actualiza(1000, 1000, 0, 0), x = A.actualiza(1000, 1000, 1000, 20);
  return todas(igual(e + e2, 1000), igual(u.despues - 1000, 1000 - w.despues), igual(u.k, V.combate.k_provisional),
               igual(x.k, V.combate.k), [e, u.despues, w.despues].every(Number.isInteger) || 'decimal');
});
await caso('rating: la tabla local no depende del orden y no cuenta lo sintetico', () => {
  const base = muestras.resultado;
  const r2 = { ...base, gana: 'defensa', semilla: 'e'.repeat(64) }, r3 = { ...base, procedencia: 'sintetico', semilla: 'd'.repeat(64) };
  const t1 = A.tabla([base, r2, r3]), t2 = A.tabla([r3, r2, base]);
  return todas(igual(K.canon(t1), K.canon(t2)), igual(t1.partidas[ANA.pub], 2));
});

// ---------------------------------------------------------------- mercado A2A
const PM = politica('mercado', [ANA, BEA]), SM = S.sesion(PM);
const oferta = (extra = {}) => ({ esquema: 'atlas.oferta/1', da: { cobre: 50 }, pide: { luz: 20 }, expira_ciclo: 300,
                                   nonce: '1'.repeat(32), para: 'cualquiera', procedencia: 'humano', ...extra });
function trato(o, ciclo = 120, quien = BEA) {
  const so = cadena(S, ANA, SM)('oferta', o);
  const sa = cadena(S, quien, SM)('aceptacion', { esquema: 'atlas.aceptacion_oferta/1', oferta: S.huella(so), ciclo });
  return { so, sa };
}
await caso('mercado: oferta + aceptacion = asiento encadenado', () => {
  const LM = M.libro(), { so, sa } = trato(oferta());
  const x = M.liquida(LM, so, sa);
  if (!x.ok) { return x.motivo; }
  muestras.oferta = so.cuerpo; muestras.asiento = x.asiento;
  return todas(igual(M.compruebaCadena(LM.asientos), ''), igual(x.asiento.prev, 'genesis'), igual(x.asiento.a, BEA.pub));
});
await caso('mercado: caducada por ciclo, rechazada', () => {
  const { so, sa } = trato(oferta(), 301);
  return igual(M.liquida(M.libro(), so, sa).motivo, 'caducada: ciclo 301 > 300');
});
await caso('mercado: doble liquidacion y nonce reutilizado, rechazados', () => {
  const LM = M.libro(), t = trato(oferta());
  M.liquida(LM, t.so, t.sa);
  const u = trato(oferta({ da: { cobre: 51 } }));
  return todas(igual(M.liquida(LM, t.so, t.sa).motivo, 'doble liquidacion'), igual(M.liquida(LM, u.so, u.sa).motivo, 'nonce reutilizado'));
});
await caso('mercado: un borrador de agente no es final sin firma humana', () => {
  const { so, sa } = trato(oferta({ procedencia: 'agente_borrador' }));
  return igual(M.liquida(M.libro(), so, sa).motivo, 'borrador de agente: no es final sin firma humana');
});
await caso('mercado: sin dinero real ni cripto (campo o recurso)', () =>
  todas(/valor real/.test(M.formaOferta(oferta({ wallet: 'x' }))) || M.formaOferta(oferta({ wallet: 'x' })),
        M.formaOferta(oferta({ da: { eur: 5 } })) ? true : 'pasa eur',
        M.formaOferta(oferta({ da: { cobre: 1.5 } })) ? true : 'pasa un decimal'));
await caso('mercado: nadie acepta lo suyo, ni una oferta que era para otra persona', () => {
  const a = trato(oferta(), 120, ANA), b = trato(oferta({ para: CRIS.pub }));
  return todas(igual(M.liquida(M.libro(), a.so, a.sa).motivo, 'nadie acepta su propia oferta'),
               igual(M.liquida(M.libro(), b.so, b.sa).motivo, 'la oferta era para otra persona'));
});
await caso('mercado: una cadena de asientos trucada se descubre', () => {
  const LM = M.libro(), t = trato(oferta()), u = trato(oferta({ nonce: '2'.repeat(32) }));
  M.liquida(LM, t.so, t.sa); M.liquida(LM, u.so, u.sa);
  const tr = copia(LM.asientos); tr[0].da = { cobre: 5000 };
  return todas(igual(M.compruebaCadena(LM.asientos), ''), igual(M.compruebaCadena(tr), 'asiento 2: la cadena se rompe'));
});

// ---------------------------------------------------------------- narragrafo (MGNO)
const PN = politica('cooperativo', [ANA, BEA, CRIS], { quorum: 3 }), SN = S.sesion(PN);
const nodo = (texto, af) => ({ esquema: 'atlas.mgno_nodo/1', texto, etiquetas: ['bosque'], afinidad: af });
const n0 = nodo('The Core hums under the ruins.', [100, 20, 90, 40, 60, 50, 80, 70]);
const n1 = nodo('A patrol of glass eels circles the rift.', [30, 200, 60, 180, 90, 70, 40, 60]);
const n2 = nodo('An old Atlantean map glows in the silt.', [150, 10, 220, 60, 40, 90, 120, 230]);
const id = (n) => K.huella(n);
function operaciones() {
  const a = cadena(S, ANA, SN), b = cadena(S, BEA, SN), c = cadena(S, CRIS, SN);
  const op = (f, o) => f('mgno_op', { esquema: 'atlas.mgno_operacion/1', ...o });
  const ops = [
    op(a, { op: 'nodo', nodo: n0 }), op(a, { op: 'nodo', nodo: n1 }), op(b, { op: 'nodo', nodo: n2 }),
    op(a, { op: 'arco', arco: { de: id(n0), a: id(n1), peso: 10 } }), op(b, { op: 'arco', arco: { de: id(n0), a: id(n2), peso: 10 } }),
    op(c, { op: 'voto', voto: { de: id(n0), a: id(n2), delta: 1 } }), op(b, { op: 'arco', arco: { de: id(n0), a: id(n1), peso: 30 } }),
    op(c, { op: 'voto', voto: { de: id(n0), a: id(n2), delta: -1 } })
  ];
  ops.cadenas = [a, b, c];
  return ops;
}
await caso('mgno: la forma del nodo rechaza enlaces, etiquetas, codigo, rutas e IPs', () => {
  muestras.mgno_nodo = n0;
  const malos = ['<b>x</b>', 'see https:example', 'javascript:alert(1)', '{{prompt}}', 'go to /etc/passwd',
                 'ping ' + ['10', '0', '0', '1'].join('.'), 'x'.repeat(281), '() => 1'];
  return todas(igual(N.formaNodo(n0), ''), ...malos.map((t) => N.formaNodo({ ...n0, texto: t }) ? true : 'pasa: ' + t),
               N.formaNodo({ ...n0, afinidad: [1, 2] }) ? true : 'pasa afinidad corta');
});
await caso('mgno: dos pares con los mismos sobres en otro orden sacan el mismo grafo', () => {
  const ops = operaciones();
  muestras.mgno_operacion = ops[3].cuerpo;
  const L1 = S.libro(PN), L2 = S.libro(PN);
  S.anotaTodos(L1, ops); S.anotaTodos(L2, ops.slice().reverse());
  const e1 = N.funde(L1), e2 = N.funde(L2);
  return todas(igual(e1.huella, e2.huella), igual(e1.grafo.nodos.length, 3), igual(e1.grafo.arcos.length, 2));
});
await caso('mgno: flujo sin conexion: A exporta, B importa, funde, reexporta y sale igual', () => {
  const ops = operaciones(), fichero = JSON.stringify(ops);
  const LA = S.libro(PN); S.anotaTodos(LA, ops);
  const LB = S.libro(PN); S.anotaTodos(LB, JSON.parse(fichero));
  const reexporta = JSON.stringify(S.aceptados(LB));
  const LC = S.libro(PN); S.anotaTodos(LC, JSON.parse(reexporta));
  return todas(igual(N.funde(LA).huella, N.funde(LB).huella), igual(N.funde(LB).huella, N.funde(LC).huella));
});
await caso('mgno: la poda gana llegue cuando llegue, y un voto por par (el ultimo)', () => {
  const L = S.libro(PN); S.anotaTodos(L, operaciones());
  const e = N.funde(L), arco02 = e.grafo.arcos.find((a) => a[1] === id(n2)), arco01 = e.grafo.arcos.find((a) => a[1] === id(n1));
  const P2 = politica('cooperativo', [ANA, BEA, CRIS], { nonce: '0'.repeat(31) + '3' }), S2 = S.sesion(P2);
  const pa = cadena(S, CRIS, S2), aa = cadena(S, ANA, S2);
  const podar = pa('mgno_op', { esquema: 'atlas.mgno_operacion/1', op: 'poda', poda: id(n1) });
  const anadir = aa('mgno_op', { esquema: 'atlas.mgno_operacion/1', op: 'nodo', nodo: n1 });
  const La = S.libro(P2), Lb = S.libro(P2);
  S.anota(La, podar); S.anota(La, anadir); S.anota(Lb, anadir); S.anota(Lb, podar);
  return todas(igual(arco02[2], 9), igual(arco01[2], 30), igual(N.funde(La).grafo.nodos.length, 0),
               igual(N.funde(La).huella, N.funde(Lb).huella));
});
await caso('mgno: Phi entera por modo (cooperativo, competitivo, hibrido)', () => {
  const prefs = [[200, 0, 0, 0, 0, 0, 0, 0], [100, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]];
  const af = [255, 0, 0, 0, 0, 0, 0, 0], w = [10, 0, 0, 0, 0, 0, 0, 0];
  const co = N.phi('cooperativo', prefs, af, w), cp = N.phi('competitivo', prefs, af, w), hi = N.phi('hibrido', prefs, af, w);
  return todas(igual(co, 1000), igual(cp, 2000), igual(hi, 1500), lanza(() => N.phi('duelo', prefs, af, w)));
});
await caso('mgno: elegir el siguiente nodo con la semilla del commit-reveal es determinista', () => {
  const L = S.libro(PN), ops = operaciones(); S.anotaTodos(L, ops);
  const e = N.funde(L), rs = [azar('n-a'), azar('n-b'), azar('n-c')];
  const { com, rev } = ronda(L, [ANA, BEA, CRIS], rs, { cadenas: ops.cadenas });
  S.anotaTodos(L, [...com, ...rev]);
  const sm = S.semilla(L);
  if (!sm.ok) { return sm.motivo; }
  const prefs = [ANA, BEA, CRIS].map((_, i) => ({ esquema: 'atlas.mgno_preferencia/1', vector: [100 + i, 50, 60, 70, 80, 90, 100, 110], procedencia: 'declarada' }));
  const w = [10, 10, 10, 10, 10, 10, 10, 10];
  const x = N.elige(e, id(n0), prefs, 'cooperativo', w, sm.semilla), y = N.elige(e, id(n0), prefs, 'cooperativo', w, sm.semilla);
  return todas(igual(x.ok, true), igual(x.nodo, y.nodo), igual(x.odds.pb.reduce((s, p) => s + p, 0) + x.odds.resto, 10000));
});
await caso('mgno: preferencias solo declaradas o firmadas (nada inferido del puntero)', () =>
  todas(igual(N.formaPreferencia({ esquema: 'atlas.mgno_preferencia/1', vector: [1, 2, 3, 4, 5, 6, 7, 8], procedencia: 'declarada' }), ''),
        N.formaPreferencia({ esquema: 'atlas.mgno_preferencia/1', vector: [1, 2, 3, 4, 5, 6, 7, 8], procedencia: 'inferida_del_puntero' }) ? true : 'pasa inferida'));

// ---------------------------------------------------------------- aislamiento y privacidad
const MODULOS = ['canon', 'sobres', 'arena', 'mercado', 'narragrafo'];
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
await caso('pureza: los modulos del multijugador no tocan red, reloj, azar, DOM ni el motor', () => {
  const malos = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'RTCPeerConnection', 'sendBeacon', 'Date', 'performance.',
                 'Math.random', 'document.', 'localStorage', 'indexedDB', 'eval(', 'Function(', 'AtlasMotor', 'AtlasJuego', 'innerHTML'];
  for (const m of MODULOS) {
    const cod = sinComentarios(readFileSync(new URL(`../public/game/${m}.js`, import.meta.url), 'utf8'));
    const hay = malos.filter((x) => cod.includes(x));
    if (hay.length) { return m + ': ' + hay.join(', '); }
  }
  return true;
});
await caso('motor: sigue sin saber nada de sobres, arena, mercado, grafo, red ni reloj', () => {
  const cod = sinComentarios(readFileSync(new URL('../public/assets/atlas-motor.js', import.meta.url), 'utf8'));
  const hay = ['Sobres', 'Arena', 'Mercado', 'Narragrafo', 'Canon', 'fetch(', 'Date.now', 'performance.', 'document.',
               'require(', 'import ', 'Math.random'].filter((x) => cod.includes(x));
  return hay.length ? hay.join(', ') : true;
});
await caso('privacidad: los sobres no llevan puntero, tecleo, latencia, huella de navegador ni hora', () => {
  const PROHIBIDAS = /puntero|pointer|tecla|keystroke|latencia|latency|userAgent|navegador|fingerprint|ip$|email|correo|hora|timestamp|fecha/i;
  const claves = [];
  (function mira(x) { if (Array.isArray(x)) { x.forEach(mira); } else if (x && typeof x === 'object') { Object.keys(x).forEach((k) => { claves.push(k); mira(x[k]); }); } })(
    [muestras.sobre, defensa, ...operaciones(), muestras.resultado, muestras.asiento]);
  const hay = claves.filter((k) => PROHIBIDAS.test(k));
  return hay.length ? hay.join(', ') : true;
});

if (process.argv.includes('--muestras')) {
  muestras.mp_sesion = PD;
  process.stdout.write(JSON.stringify(muestras) + '\n');
} else {
  process.stdout.write(JSON.stringify(casos) + '\n');
}
