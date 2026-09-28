// Casos del MERITO y del TESORO (`atlas/verifica_tesoro.mjs`), enmienda del Soberano del 2026-09-29.
// Los numeros de la nota (§10) van en cada caso. El 7 (geolocalizacion en el codigo), el 8 (el balance en el
// precache) y el 9 (anuncio sin camino medido) viven en atlas/test_atlas.py, porque miran ficheros servidos.
// Los ejecuta atlas/test_atlas.py:   node atlas/tesoro_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { identidad, verificador, cadena } from './mp_firma.mjs';
import { verificaMerito, verificaTesoro, verificaOferta, claveHash, mensajeTesoro } from './verifica_tesoro.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const S = require('../public/game/sobres.js');
const M = require('../public/game/mercado.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const rechaza = (r, re) => (!r.ok && re.test(r.motivo)) || 'no rechaza como debe: ' + JSON.stringify(r);
// Estricta: un fallo que vale `undefined` o `null` es un fallo (la version con `?? true` los daba por buenos).
const todas = (...xs) => { const i = xs.findIndex((x) => x !== true); return i < 0 ? true : 'fallo: ' + String(xs[i]); };
const copia = (x) => JSON.parse(JSON.stringify(x));
const cero = () => ({ luz: 0, biomasa: 0, cobre: 0, flujo: 0, oxigeno: 0 });
const cesta = (c) => ({ ...cero(), ...c });

const ANA = identidad('ana'), BEA = identidad('bea'), SOB = identidad('soberano'), TES = identidad('testigo');
const TEMP = '2026-09-27.1';
const ficha = (i) => K.sha('atlas.ficha/1:' + i);

function merito(extra = {}) {
  return { esquema: 'atlas.merito/1', clave_hash: claveHash(ANA.pub), temporada: TEMP, meritos: 2, techo_temporada: 10,
           medido_el: '2026-09-29',
           por_paquete: [{ hash_ficha: ficha(1), aceptado: true, ciclo: 10, procedencia: 'humano' },
                         { hash_ficha: ficha(2), aceptado: true, ciclo: 12, procedencia: 'humano' },
                         { hash_ficha: ficha(3), aceptado: false, ciclo: 15, procedencia: 'humano' }], ...extra };
}
function tesoro(reclamos, extra = {}, firmar = true) {
  let prev = 'genesis';
  const rs = reclamos.map((r) => { const x = { ...r, prev_hash: prev }; prev = K.sha(K.canon(x)); return x; });
  const reclamada = cero();
  rs.forEach((r) => Object.keys(reclamada).forEach((k) => { reclamada[k] += r.bolsa_entregada[k]; }));
  const t = { esquema: 'atlas.tesoro/1', temporada: TEMP, bolsa_total: cesta({ cobre: 100, biomasa: 50, luz: 20 }),
              bolsa_reclamada: reclamada, reclamos: rs, clave_soberano: SOB.pub, clave_testigo: TES.pub,
              firma_soberano: '', firma_testigo: '', ...extra };
  if (firmar) { const m = mensajeTesoro(t); t.firma_soberano = 'ed25519:' + SOB.firma(m); t.firma_testigo = 'ed25519:' + TES.firma(m); }
  return t;
}
const reclamo = (quien, n, c, ciclo = 20) => ({ clave_hash: claveHash(quien.pub), meritos_presentados: n, bolsa_entregada: cesta(c), ciclo });

caso('merito: el bueno pasa, y cuenta los ACEPTADOS (2), no los presentados (3)', () => {
  const r = verificaMerito(merito(), { [TEMP]: 10 });
  return todas(r.ok || r.motivo, r.meritos === 2 || 'cuenta ' + r.meritos);
});
caso('§10.1 · merito de procedencia no humana (piloto_base, lora, denso, sisil): rojo', () => {
  const x = ['piloto_base', 'lora', 'denso', 'sisil'].map((p) => {
    const m = merito(); m.por_paquete[0].procedencia = p; return rechaza(verificaMerito(m), new RegExp('no humana: ' + p));
  });
  return todas(...x);
});
caso('merito: no cuadra, pasa del techo, techo retocado, paquete contado dos veces', () => {
  const doble = merito(); doble.por_paquete[1].hash_ficha = ficha(1);
  return todas(rechaza(verificaMerito(merito({ meritos: 3 })), /no cuadran/),
               rechaza(verificaMerito(merito({ techo_temporada: 1 })), /techo de la temporada/),
               rechaza(verificaMerito(merito(), { [TEMP]: 20 }), /techo retocado/),
               rechaza(verificaMerito(doble), /contado dos veces/));
});
caso('§10.2 · el merito no se transfiere: ni en una oferta ni en un asiento', () => {
  const oferta = { esquema: 'atlas.oferta/1', da: { merito: 1 }, pide: { cobre: 5 }, expira_ciclo: 300, nonce: '1'.repeat(32),
                   para: 'cualquiera', procedencia: 'humano' };
  const asiento = { esquema: 'atlas.asiento/1', merito: 1 };
  return todas(rechaza(verificaOferta(oferta), /merito transferido/), rechaza(verificaMerito(asiento), /merito transferido/));
});
caso('tesoro: el bueno pasa (dos firmas humanas, testigo que no cobra, cadena enlazada)', () => {
  const r = verificaTesoro(tesoro([reclamo(ANA, 2, { cobre: 30 }), reclamo(BEA, 1, { biomasa: 10 }, 25)]),
                           { [claveHash(ANA.pub)]: 2, [claveHash(BEA.pub)]: 1 });
  return r.ok || r.motivo;
});
caso('§10.3 · bolsa reclamada = total + 1: rojo', () => {
  const t = tesoro([reclamo(ANA, 2, { cobre: 101 })]);
  return rechaza(verificaTesoro(t), /pasa de la total en cobre/);
});
caso('§10.4 · el testigo es el beneficiario: rojo (y el testigo no puede ser el Soberano)', () =>
  todas(rechaza(verificaTesoro(tesoro([reclamo(TES, 1, { cobre: 5 })])), /testigo igual al beneficiario/),
        rechaza(verificaTesoro(tesoro([], { clave_testigo: SOB.pub })), /no puede ser el Soberano/)));
caso('tesoro: sin firma del Soberano, retocado tras firmar, o presentando mas meritos de los que tiene: rojo', () => {
  const sin = tesoro([reclamo(ANA, 1, { cobre: 5 })]); sin.firma_soberano = '';
  const tocado = tesoro([reclamo(ANA, 1, { cobre: 5 })]); tocado.bolsa_total.cobre = 999;
  return todas(rechaza(verificaTesoro(sin), /sin firma del Soberano/), rechaza(verificaTesoro(tocado), /sin firma del Soberano/),
               rechaza(verificaTesoro(tesoro([reclamo(ANA, 5, { cobre: 5 })]), { [claveHash(ANA.pub)]: 2 }), /mas meritos/));
});
const oferta = (extra = {}) => ({ esquema: 'atlas.oferta/1', da: { cobre: 20 }, pide: { biomasa: 11 }, expira_ciclo: 300,
                                   nonce: '2'.repeat(32), para: 'cualquiera', procedencia: 'humano', ...extra });
caso('oferta: 20 cobre por 11 biomasa pasa; la tasa se deriva, no se guarda', () => verificaOferta(oferta()).ok || 'no pasa');
caso('§10.5 · oferta con la tasa guardada como decimal (1.1): rojo', () => rechaza(verificaOferta(oferta({ tasa: 1.1 })), /decimal/));
caso('§10.6 · oferta que caduca en fecha de reloj: rojo', () => rechaza(verificaOferta(oferta({ caduca_el: '2026-12-31' })), /fecha de reloj/));
caso('§10.7 · vecindad por geolocalizacion dentro de un sobre: rojo', () =>
  rechaza(verificaOferta(oferta({ cerca: { lat: 40, lon: -3 } })), /geolocalizacion/));
caso('§10.10 · la misma oferta dos veces (nonce) y liquidar sin la firma del otro lado: rojo', () => {
  const SM = K.sha('atlas.sesion/1:mercado-tesoro');
  const trato = (o) => {
    const so = cadena(S, ANA, SM)('oferta', o);
    const sa = cadena(S, BEA, SM)('aceptacion', { esquema: 'atlas.aceptacion_oferta/1', oferta: S.huella(so), ciclo: 120 });
    return { so, sa };
  };
  const LM = M.libro(), a = trato(oferta()), b = trato(oferta({ da: { cobre: 21 } }));
  const primero = M.liquida(LM, a.so, a.sa), repetida = M.liquida(LM, b.so, b.sa);
  const falsa = trato(oferta({ nonce: '3'.repeat(32) }));
  falsa.sa = copia(falsa.sa); falsa.sa.firma = 'ed25519:' + '0'.repeat(128);
  const firmaOtro = verificador(S.mensaje(falsa.sa), falsa.sa.firma.slice(8), falsa.sa.de);
  const buena = verificador(S.mensaje(a.sa), a.sa.firma.slice(8), a.sa.de);
  return todas(primero.ok || primero.motivo, repetida.motivo === 'nonce reutilizado' || repetida.motivo,
               buena === true || 'la firma buena no verifica', firmaOtro === false || 'la firma falsa del otro lado verifica');
});

if (process.argv.includes('--muestras')) {
  process.stdout.write(JSON.stringify({ merito: merito(), tesoro: tesoro([reclamo(ANA, 2, { cobre: 30 })]) }) + '\n');
} else {
  process.stdout.write(JSON.stringify(casos) + '\n');
}
