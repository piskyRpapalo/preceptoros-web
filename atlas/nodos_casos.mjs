// Casos de los NODOS COMO CUENTA (`public/game/nodos.js`): una cuenta = un nodo con su cedula, el
// duelo determinista desde una semilla, el equilibrio MEDIDO por simulacion y la puerta de envio.
// Los ejecuta atlas/test_atlas.py:   node atlas/nodos_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { identidad, verificador } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const N = require('../public/game/nodos.js');
const C = require('../public/game/nodos-cedulas.js');
const P = require('../public/game/nodos-pesos.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${JSON.stringify(a)} != ${JSON.stringify(b)}`;
const todas = (...xs) => xs.find((x) => x !== true) ?? true;
const copia = (x) => JSON.parse(JSON.stringify(x));
const rechaza = (fn, re) => { try { fn(); return 'no rechazo'; } catch (e) { return re.test(e.message) || e.message; } };
// Re-sella una cedula tocada: asi la prueba cae por la REGLA que vigila, no por la integridad.
const resella = (c) => { delete c.sha256; c.sha256 = K.huella(c); return c; };
const [HEX, DOO] = C.cuentas.map((c) => c.cuenta);

caso('datos: las cedulas y los pesos pasan su forma', () =>
  todas(igual(N.validaCedulas(C), ''), igual(N.validaPesos(P), '')));

caso('pesos: son una PROPUESTA sin firma; otro estado se rechaza', () => {
  const p = copia(P); p.estado = 'FIRMADO';
  return todas(igual(P.estado, 'PROPUESTA'), igual(P.firma, null), /PROPUESTA/.test(N.validaPesos(p)) || N.validaPesos(p));
});

caso('cuenta = un nodo: dos cuentas, dos nodos, 1:1', () => {
  const c = copia(C); c.cuentas[1].nodo = c.cuentas[0].nodo;
  const d = copia(C); d.cuentas.push({ cuenta: 'casa-tercera', nodo: 'nodo.9.nadie' });
  return todas(igual(C.cuentas.length, 2), /un nodo/.test(N.validaCedulas(c)) || N.validaCedulas(c),
               /sin cedula/.test(N.validaCedulas(d)) || N.validaCedulas(d));
});

caso('cedula: hereda preceptoros.cedula-nodo/1, sin firma y con autenticidad NO_DATA', () =>
  todas(...C.nodos.map((n) => todas(igual(n.esquema, 'preceptoros.cedula-nodo/1'), igual(n.firma, null),
    /^NO_DATA/.test(n.autenticidad) || n.autenticidad))));

caso('cedula tocada sin re-sellar: FALLO_INTEGRIDAD', () => {
  const c = copia(C); c.nodos[0].aparato.medidas.ram_mib.valor += 1;
  return /FALLO_INTEGRIDAD/.test(N.validaCedulas(c)) || N.validaCedulas(c);
});

caso('un nodo sin medida que entra como NUMERO se rechaza', () => {
  const c = copia(C), n = c.nodos.find((x) => x.aparato.medidas.gen_cps.estado === 'NO_DATA');
  if (!n) { return 'no hay ningun eje NO_DATA que vigilar'; }
  n.aparato.medidas.gen_cps.valor = 2000; resella(n);
  const m = copia(C), b = m.nodos[0]; delete b.aparato.medidas.ram_mib.fuente; resella(b);
  return todas(/NO_DATA/.test(N.validaCedulas(c)) || N.validaCedulas(c),
               /fuente/.test(N.validaCedulas(m)) || N.validaCedulas(m));
});

caso('el Beelink es MEDIDO y el Doogee EMULADO o NO_DATA, nunca MEDIDO sin fuente', () => {
  const [h, d] = C.cuentas.map((c) => C.nodos.find((n) => n.nodo === c.nodo));
  const eh = Object.values(h.aparato.medidas).map((m) => m.estado);
  const ed = Object.values(d.aparato.medidas).map((m) => m.estado);
  return todas(eh.every((e) => e === 'MEDIDO') || eh.join(), ed.every((e) => e !== 'MEDIDO') || ed.join());
});

caso('niebla: un eje NO_DATA no mueve los rasgos y se declara', () => {
  const d = C.nodos.find((n) => n.nodo === C.cuentas[1].nodo), r = N.rasgos(d, P);
  const n = copia(d); n.aparato.medidas.gen_cps = { estado: 'NO_DATA', valor: null, causa: 'x' }; resella(n);
  return todas(igual(K.canon(r.niebla), '["gen_cps"]'), igual(r.niveles.gen_cps, null), igual(K.canon(N.rasgos(n, P)), K.canon(r)));
});

caso('sin datos personales en las cedulas (ni IP, ni correo, ni serie, ni ruta de usuario)', () => {
  const t = JSON.stringify(C);
  return todas(!/\b\d{1,3}(\.\d{1,3}){3}\b/.test(t) || 'IP', !/@/.test(t) || 'correo',
               !/\d{10,}/.test(t) || 'serie', !/\/home\/|\/Users\//.test(t) || 'ruta');
});

caso('misma semilla, mismo log (byte a byte), y el log es cerrado', () => {
  const a = N.partida(C, P, HEX, DOO, 7), b = N.partida(C, P, HEX, DOO, 7), c = N.partida(C, P, HEX, DOO, 8);
  return todas(igual(K.canon(a), K.canon(b)), igual(N.formaLog(a.log), ''), a.log.semilla !== c.log.semilla || 'semilla');
});

caso('el log cerrado rechaza un evento o una clave que no son del vocabulario', () => {
  const a = N.partida(C, P, HEX, DOO, 1).log, b = copia(a), c = copia(a);
  b.eventos[1].t = 'magia'; c.eventos[1].extra = 1;
  return todas(/evento/.test(N.formaLog(b)) || N.formaLog(b), /claves/.test(N.formaLog(c)) || N.formaLog(c));
});

caso('el render reproduce el log: el estado final sale del log y coincide con su fin', () => {
  for (let i = 0; i < 30; i++) {
    const { log } = N.partida(C, P, HEX, DOO, i), e = N.reproduce(log), fin = log.eventos[log.eventos.length - 1];
    const ult = e[e.length - 1];
    if (fin.t !== 'fin' || K.canon(ult.vida) !== K.canon(fin.vida)) { return 'semilla ' + i; }
  }
  return true;
});

caso('el registro de la partida ata semilla, pesos, cedulas y la huella del log', () => {
  const p = N.partida(C, P, HEX, DOO, 3), r = p.registro;
  return todas(igual(r.esquema, 'atlas.partida_nodos/1'), igual(r.log_sha, K.huella(p.log)), igual(r.pesos, P.version),
               igual(r.cedulas_sha, K.huella(C)), igual(r.semilla, p.log.semilla));
});

// EQUILIBRIO MEDIDO: ningun perfil de la rejilla domina a otro. Banda fija AQUI, no en los datos:
// si viviera en la propuesta, la propuesta podria ensancharse su propio examen.
const BANDA = [350, 650], SEMILLAS = 200, NIVELES = [null, 0, 1, 2, 3, 4];
function tasa(ra, rb, n, sal) {
  let g = 0;
  for (let i = 0; i < n; i++) {
    const log = N.combate(ra, rb, K.sha(sal + ':' + i), P), f = log.eventos[log.eventos.length - 1];
    g += f.gana === 0 ? 2 : f.gana === -1 ? 1 : 0;
  }
  return Math.floor(g * 500 / n);    // por mil, el empate cuenta medio
}
caso('equilibrio: toda pareja de perfiles de la rejilla gana entre el 35 y el 65 por ciento', () => {
  const perfiles = [];
  for (const m of NIVELES) for (const g of NIVELES) { perfiles.push(N.rasgosDeNiveles({ ram_mib: m, gen_cps: g }, P)); }
  let peor = null;
  for (let i = 0; i < perfiles.length; i++) {
    for (let j = i + 1; j < perfiles.length; j++) {
      const t = tasa(perfiles[i], perfiles[j], SEMILLAS, 'rejilla:' + i + ':' + j);
      if (t < BANDA[0] || t > BANDA[1]) { peor = `${i}v${j}=${t}`; break; }
    }
    if (peor) { break; }
  }
  return peor === null || peor;
});
caso('equilibrio: Hexelion contra Doogee entre el 40 y el 60 por ciento en 400 semillas', () => {
  const [h, d] = C.cuentas.map((c) => N.rasgos(C.nodos.find((n) => n.nodo === c.nodo), P));
  const t = tasa(h, d, 400, 'casa');
  return (t >= 400 && t <= 600) || 'tasa ' + t;
});

caso('el hardware modesto es personaje: el Doogee esquiva mas y el Beelink aguanta mas', () => {
  const [h, d] = C.cuentas.map((c) => N.rasgos(C.nodos.find((n) => n.nodo === c.nodo), P));
  return todas(d.esquiva_pm > h.esquiva_pm || 'esquiva', h.vida > d.vida || 'vida');
});

// LA PUERTA DE ENVIO: nada sale sin gesto, sin firma de la partida y sin la SEGUNDA firma (consent 1).
const yo = identidad('nodos');
function firmado() {
  const p = N.partida(C, P, HEX, DOO, 5), cs = N.consentimiento(p.registro);
  return { partida: p.registro, firma: yo.firma(JSON.stringify(p.registro)), consentimiento: cs,
           firma_consent: yo.firma(JSON.stringify(cs)), publica: yo.pub };
}
caso('envio: sin gesto no sale nada', () =>
  rechaza(() => N.envio(Object.assign({ gesto: false }, firmado())), /gesto/));
caso('envio: sin firma o sin consentimiento firmado no sale nada', () => {
  const a = Object.assign({ gesto: true }, firmado()); a.firma = null;
  const b = Object.assign({ gesto: true }, firmado()); b.firma_consent = null;
  const c = Object.assign({ gesto: true }, firmado()); c.consentimiento = Object.assign({}, c.consentimiento, { consent: 0 });
  return todas(rechaza(() => N.envio(a), /firma/), rechaza(() => N.envio(b), /consent/), rechaza(() => N.envio(c), /consent/));
});
caso('envio: con gesto y dos firmas sale UN par, y las firmas verifican', () => {
  const f = firmado(), pares = N.envio(Object.assign({ gesto: true }, f)), x = pares[0];
  return todas(igual(pares.length, 1), igual(x.partida.log_sha, f.partida.log_sha),
               verificador(JSON.stringify(x.partida), x.firma, x.publica) || 'firma',
               verificador(JSON.stringify(x.consentimiento), x.firma_consent, x.publica) || 'consent',
               igual(x.consentimiento.partida, x.partida.log_sha));
});

process.stdout.write(JSON.stringify(casos, null, 1) + '\n');
process.exit(casos.every((c) => c.ok) ? 0 : 1);
