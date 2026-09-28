// preceptoros.org · theGame · casos del PILOTO y de la PARTIDA, en node.
//
//     node atlas/piloto_casos.mjs     # imprime [{caso, ok, detalle}, ...]
//
// Los ejecuta `atlas/test_atlas.py`. Como `motor_casos.mjs`: cada caso es
// determinista y dice por que falla. El mas importante es el de la partida
// INVENTADA: firmada con una clave valida, pasa la firma y solo la caza la
// reproduccion. Si alguien quita la reproduccion del verificador, ese caso se
// pone rojo: es la prueba de que la puerta sirve, no solo de que existe.
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { verifica } from './verifica_partida.mjs';
import { juega } from './arnes_piloto.mjs';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = (f) => join(RAIZ, 'public/assets', f);
const M = require(A('atlas-motor.js'));
const P = require(A('atlas-piloto.js'));
const Pa = require(A('atlas-partida.js'));

const casos = [];
function caso(nombre, f) {
  let ok = false, detalle = '';
  try { const r = f(); ok = r === true; if (!ok) { detalle = JSON.stringify(r); } }
  catch (e) { detalle = e.message; }
  casos.push({ caso: nombre, ok, detalle });
}
const LEY = M.leyes({ pruebas_web: 171, arnes_sw: '24/24', gzip_juego_b: 95000 });
const hasta = (e, n) => { for (let i = 0; i < n; i++) { e = M.ciclo(e, LEY); } return e; };

/* --- el piloto base ------------------------------------------------------ */
caso('piloto: misma instantanea, misma accion', () => {
  const i = Pa.instantanea(hasta(M.inicial(LEY), 57), M);
  return JSON.stringify(P.decide(i, M)) === JSON.stringify(P.decide(JSON.parse(JSON.stringify(i)), M));
});
caso('piloto: sin instantanea o sin constantes -> null', () =>
  P.decide(null, M) === null && P.decide(Pa.instantanea(M.inicial(LEY), M), null) === null);
caso('piloto: grieta abierta y cobre -> reparar', () => {
  const e = hasta(M.inicial(LEY), 40); e.cobre = M.COBRE_REPARAR;
  return P.decide(Pa.instantanea(e, M), M).accion === 'reparar';
});
caso('piloto: grieta abierta sin cobre fuera del arrecife -> sube', () => {
  const a = P.decide(Pa.instantanea(M.inicial(LEY), M), M);
  return a.accion === 'bajar_a' && a.banda === 'arrecife';
});
caso('piloto: pendiente de dormir -> recoger', () => {
  const e = M.dormir(M.inicial(LEY), 60000); e.abierta = false;
  return P.decide(Pa.instantanea(e, M), M).accion === 'recoger';
});
caso('piloto: Nucleo solo con Ingenieria 60', () => {
  const e = M.bajarA(M.inicial(LEY), 'arrecife'); e.abierta = false;
  const sin = P.decide(Pa.instantanea(e, M), M).banda;
  e.xp[M.OFICIOS.indexOf('ingenieria')] = M.xpParaNivel(M.INGENIERIA_NUCLEO);
  return sin === 'bosque' && P.decide(Pa.instantanea(e, M), M).banda === 'nucleo';
});
caso('piloto: valida rechaza lo que no es del enum', () =>
  !P.valida({ esquema: 'atlas.accion/1', accion: 'firmar', origen: 'piloto_base' }) &&
  !P.valida({ esquema: 'atlas.accion/1', accion: 'bajar_a', origen: 'piloto_base' }) &&
  !P.valida({ esquema: 'atlas.accion/1', accion: 'reparar', banda: 'nucleo', origen: 'piloto_base' }) &&
  !P.valida({ accion: 'reparar' }) && P.valida({ esquema: 'atlas.accion/1', accion: 'esperar', origen: 'piloto_base' }));
caso('piloto: 5000 ciclos jugando, cero invalidas y cero fallos', () => {
  const r = juega(LEY, true, 5000);
  return (r.invalidas === 0 && r.fallos === 0) || r;
});
caso('piloto: le gana a no hacer nada (integridad minima)', () => {
  const con = juega(LEY, true, 5000), sin = juega(LEY, false, 5000);
  return con.integridad_min > sin.integridad_min || { con: con.integridad_min, sin: sin.integridad_min };
});

/* --- la grabadora, como en la pestana: el motor envuelto en memoria ------ */
function pestana() {
  const raiz = {};
  vm.createContext(raiz);
  vm.runInContext(readFileSync(A('atlas-motor.js'), 'utf8'), raiz);
  vm.runInContext(readFileSync(A('atlas-partida.js'), 'utf8'), raiz);
  return raiz;
}
function sesion() {
  const w = pestana(), Mw = w.AtlasMotor, Pw = w.AtlasPartida;
  let E = Mw.inicial(LEY);
  for (let i = 0; i < 300; i++) { E = Mw.ciclo(E, LEY); }
  E = Mw.dormir(E, 5000); E = Mw.recoger(E);
  E = Pw.como('piloto_base', () => Mw.reparar(E));
  E = Mw.bajarA(E, 'arrecife');
  for (let i = 0; i < 50; i++) { E = Mw.ciclo(E, LEY); }
  return { p: Pw.partida(E, Mw), E, Mw };
}
caso('grabadora: ley y pasos, con su origen', () => {
  const { p } = sesion();
  const forma = p.pasos.map((s) => ('ciclos' in s ? 'c' + s.ciclos : 'dormir_ms' in s ? 'd' : s.accion + ':' + s.origen));
  return JSON.stringify(forma) === JSON.stringify(['c300', 'd', 'recoger:humano', 'reparar:piloto_base', 'bajar_a:humano', 'c50']) || forma;
});
caso('grabadora: la partida vuelve a jugarse igual', () => {
  const { p } = sesion();
  return JSON.stringify(Pa.final(Pa.reproduce(p, M), M)) === JSON.stringify(p.final);
});
// `contenido_v` es la version del contenido (p. ej. 2026-09-26.1), no un reloj:
// se quita antes de buscar fechas, y el `dia` de los eventos no puede viajar.
caso('grabadora: sin fechas de reloj en la partida', () => {
  const t = JSON.stringify(sesion().p).replace(/"contenido_v":"[^"]*"/g, '');
  return (!/\d{4}-\d{2}-\d{2}/.test(t) && !/"dia"/.test(t)) || t.slice(0, 200);
});

/* --- la firma y la verificacion ------------------------------------------ */
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pub = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
function sobre(p, clave = privateKey) {
  return {
    esquema: 'atlas.partida.firmada/1', partida: p, algoritmo: 'Ed25519',
    firma: 'ed25519:' + sign(null, Buffer.from(JSON.stringify(p)), clave).toString('hex'),
    pseudonimo: 'caso', clave_publica: pub
  };
}
caso('verifica: una partida de verdad entra', () => {
  const r = verifica(sobre(sesion().p)); return r.ok || r;
});
caso('verifica: tocada despues de firmar -> firma', () => {
  const s = sobre(sesion().p); s.partida.final.integridad += 1;
  const r = verifica(s); return r.motivo === 'firma: no verifica' || r;
});
caso('verifica: INVENTADA y bien firmada -> solo la caza la reproduccion', () => {
  const p = sesion().p; p.final.fase = 5; p.final.nivel_nucleo = 70;
  const r = verifica(sobre(p)); return r.motivo === 'reproduccion: el final no coincide' || r;
});
caso('verifica: truncada -> no reproducible y se dice', () => {
  const p = sesion().p; p.truncada = true;
  const r = verifica(sobre(p)); return r.motivo === 'reproduccion: partida truncada' || r;
});
caso('verifica: paso desconocido -> rechazo', () => {
  const p = sesion().p; p.pasos.splice(1, 0, { accion: 'firmar', origen: 'humano' });
  const r = verifica(sobre(p)); return /reproduccion: paso 1/.test(r.motivo) || r;
});
caso('verifica: sin firma -> forma', () => {
  const s = sobre(sesion().p); delete s.firma;
  const r = verifica(s); return r.motivo === 'forma: firma' || r;
});

caso('humano + piloto: se anota lo propuesto y lo respondido, y no cambia la partida', () => {
  const w = pestana(), Mw = w.AtlasMotor, Pw = w.AtlasPartida;
  let E = Mw.inicial(LEY);
  for (let i = 0; i < 40; i++) { E = Mw.ciclo(E, LEY); }
  Pw.anota({ accion: 'bajar_a', banda: 'arrecife' }, 'ignorada');
  E.cobre = 0;
  Pw.anota({ accion: 'reparar' }, 'hecha'); E = Mw.reparar(E);
  const p = Pw.partida(E, Mw);
  const s = p.pasos.filter((x) => 'sugerencia' in x).map((x) => x.sugerencia.accion + ':' + x.respuesta);
  const orden = p.pasos.map((x) => Object.keys(x)[0]);
  return (JSON.stringify(s) === JSON.stringify(['bajar_a:ignorada', 'reparar:hecha']) &&
    JSON.stringify(orden) === JSON.stringify(['ciclos', 'sugerencia', 'sugerencia', 'accion']) &&
    p.pasos[3].origen === 'humano') || { s, orden };
});
caso('humano + piloto: la partida con sugerencias se verifica', () => {
  const w = pestana(), Mw = w.AtlasMotor, Pw = w.AtlasPartida;
  let E = Mw.inicial(LEY);
  for (let i = 0; i < 60; i++) { E = Mw.ciclo(E, LEY); }
  Pw.anota({ accion: 'reparar' }, 'hecha'); E = Mw.reparar(E);
  for (let i = 0; i < 10; i++) { E = Mw.ciclo(E, LEY); }
  const r = verifica(sobre(Pw.partida(E, Mw))); return r.ok || r;
});

process.stdout.write(JSON.stringify(casos));
