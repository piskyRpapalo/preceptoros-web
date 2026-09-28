// preceptoros.org · theGame v1.5 · casos del GACHA, el ARMY y la SINTESIS.
//
//     node atlas/gacha_casos.mjs     # imprime [{caso, ok, detalle}, ...]
//
// Los ejecuta `test_web.py` (la directiva v1.5 pide sus pruebas alli). Como
// los otros corredores: deterministas y diciendo por que fallan. Los dos que
// mas importan: una tropa NO entra en el Army con una firma falsa ni con la
// tropa tocada despues de firmar, y el piloto NO puede invocar.
import { createRequire } from 'node:module';
import { createHash, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { verifica } from './verifica_partida.mjs';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = require(join(RAIZ, 'public/assets/atlas-motor.js'));
const P = require(join(RAIZ, 'public/assets/atlas-piloto.js'));
const G = require(join(RAIZ, 'public/game/gacha.js'));
const A = require(join(RAIZ, 'public/game/db.js'));
const S = require(join(RAIZ, 'public/game/core.js'));

const casos = [];
async function caso(nombre, f) {
  let ok = false, detalle = '';
  try { const r = await f(); ok = r === true; if (!ok) { detalle = JSON.stringify(r); } }
  catch (e) { detalle = e.message; }
  casos.push({ caso: nombre, ok, detalle });
}
const sha = (t) => createHash('sha256').update(String(t)).digest('hex');
const LEY = M.leyes({ pruebas_web: 171, arnes_sw: '24/24', gzip_juego_b: 95000 });

/* --- gacha ---------------------------------------------------------------- */
// 300 semillas y las cuatro TC: con una sola, un azar escondido puede
// coincidir por suerte (medido: el sabotaje con Math.random paso con una).
await caso('gacha: misma semilla, misma tropa (300 semillas x 4 TC)', () => {
  for (let i = 0; i < 300; i++) {
    const tc = 'tc' + (1 + i % 4), a = G.tirada(sha('a' + i), tc), b = G.tirada(sha('a' + i), tc);
    if (JSON.stringify(a) !== JSON.stringify(b)) { return i; }
  }
  return true;
});
await caso('gacha: semilla o TC invalidas -> error, nunca una tropa inventada', () => {
  let n = 0;
  for (const f of [() => G.tirada('xyz', 'tc1'), () => G.tirada(sha('a'), 'tc9')]) { try { f(); } catch (e) { n++; } }
  return n === 2 || n;
});
function reparto(tc, n) {
  const r = { normal: 0, magico: 0, raro: 0, unico: 0 };
  for (let i = 0; i < n; i++) { r[G.tirada(sha(tc + i), tc).rareza]++; }
  return r;
}
await caso('gacha: el reparto de rareza sigue la tabla de la TC (10 000 tiradas)', () => {
  const r = reparto('tc1', 10000), q = G.TCS.tc1.calidad;
  const cerca = (x, esperado) => Math.abs(x - esperado * 10) <= Math.max(25, esperado * 10 * 0.15);
  return (cerca(r.unico, q[0]) && cerca(r.raro, q[1]) && cerca(r.magico, q[2])) || r;
});
await caso('gacha: el Abismo da mejor loot que el Arrecife', () => {
  const a = reparto('tc1', 4000), b = reparto('tc4', 4000);
  return (b.unico > a.unico && b.raro > a.raro) || { tc1: a, tc4: b };
});
await caso('gacha: cada tropa cabe en menos de 200 B', () => {
  let peor = 0;
  for (let i = 0; i < 3000; i++) { peor = Math.max(peor, G.compacta(G.tirada(sha('b' + i), 'tc' + (1 + i % 4))).length); }
  return peor < 200 || peor;
});
await caso('gacha: la rareza pone la simetria (k = 1 mod s)', () => {
  const s = { normal: 2, magico: 3, raro: 5, unico: 7 };
  for (let i = 0; i < 400; i++) {
    const t = G.tirada(sha('c' + i), 'tc4');
    if (!t.armonicos.every((h) => (((h[0] - 1) % s[t.rareza]) + s[t.rareza]) % s[t.rareza] === 0)) { return t; }
  }
  return true;
});
await caso('gacha: unico = Atlante Legendario, con sus dos afijos', () => {
  for (let i = 0; i < 5000; i++) {
    const t = G.tirada(sha('d' + i), 'tc4');
    if (t.rareza === 'unico') { return (t.prefijo === 'atlante' && t.sufijo === 'abismo') || t; }
  }
  return 'ningun unico en 5000';
});
await caso('morfismo: mezcla(a, b, 0) es a y mezcla(a, b, 1) es b', () => {
  const t = G.tirada(sha('e'), 'tc3');
  const cero = G.mezcla(G.HUEVO, t.armonicos, 0), uno = G.mezcla(G.HUEVO, t.armonicos, 1);
  const p = (arm) => G.punto(arm, 1.234).map((x) => x.toFixed(9)).join();
  return (p(cero) === p(G.HUEVO) && p(uno) === p(t.armonicos)) || { cero: p(cero), huevo: p(G.HUEVO) };
});

/* --- motor: invocar -------------------------------------------------------- */
await caso('motor: invocar sin recursos -> fallo y nada cambia', () => {
  const e = M.inicial(LEY), d = M.invocar(e, G.TCS.tc1.coste);
  return (d.cobre === e.cobre && d.eventos.at(-1).tipo === 'invocar' && d.eventos.at(-1).resultado === 'fallo') || d.eventos.at(-1);
});
await caso('motor: invocar con recursos -> paga Cobre y Luz', () => {
  const e = M.inicial(LEY); e.cobre = 700; e.luz = 400;
  const d = M.invocar(e, G.TCS.tc3.coste);
  return (d.cobre === 100 && d.luz === 100 && d.eventos.at(-1).resultado === 'ok') || { cobre: d.cobre, luz: d.luz };
});
await caso('motor: coste invalido -> error, nunca un gasto raro', () => {
  try { M.invocar(M.inicial(LEY), { cobre: -1, luz: 0 }); return 'paso'; } catch (e) { return true; }
});
await caso('piloto: no puede invocar (fuera del enum)', () =>
  !P.valida({ esquema: 'atlas.accion/1', accion: 'invocar', origen: 'piloto_base' }));

/* --- partida con invocacion: se graba, se reproduce y se verifica ---------- */
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pub = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
const firmaDe = (texto, clave = privateKey) => 'ed25519:' + sign(null, Buffer.from(texto), clave).toString('hex');
await caso('partida: una invocacion se graba y la partida verifica', () => {
  const w = {}; vm.createContext(w);
  vm.runInContext(readFileSync(join(RAIZ, 'public/assets/atlas-motor.js'), 'utf8'), w);
  vm.runInContext(readFileSync(join(RAIZ, 'public/assets/atlas-partida.js'), 'utf8'), w);
  let E = w.AtlasMotor.inicial(LEY);
  for (let i = 0; i < 200; i++) { E = w.AtlasMotor.ciclo(E, LEY); }
  E = w.AtlasMotor.invocar(E, G.TCS.tc1.coste);
  for (let i = 0; i < 5; i++) { E = w.AtlasMotor.ciclo(E, LEY); }
  const p = w.AtlasPartida.partida(E, w.AtlasMotor);
  const inv = p.pasos.find((s) => s.accion === 'invocar');
  const r = verifica({ esquema: 'atlas.partida.firmada/1', partida: p, algoritmo: 'Ed25519',
    firma: firmaDe(JSON.stringify(p)), pseudonimo: 'caso', clave_publica: pub });
  return (inv && inv.coste.cobre === 50 && inv.origen === 'humano' && r.ok) || { inv, r };
});

/* --- army: sin firma verificada no entra nada ------------------------------- */
function verificaNode(texto, firmaHex, claveHex) {
  const k = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(claveHex, 'hex')]), format: 'der', type: 'spki' });
  return verify(null, Buffer.from(texto), k, Buffer.from(firmaHex, 'hex'));
}
const tropa = G.tirada(sha('army'), 'tc2');
await caso('army: con firma verificada, entra', async () => {
  const army = A.crea(verificaNode), ad = A.adopcion(tropa, 'caso', pub);
  const u = await army.adopta(ad, firmaDe(JSON.stringify(ad)));
  return (army.lista().length === 1 && u.adopcion.tropa.semilla === tropa.semilla) || army.lista();
});
async function rechazo(f) { try { await f(); return 'entro'; } catch (e) { return e.message; } }
await caso('army: sin firma -> fuera', async () => {
  const army = A.crea(verificaNode);
  const m = await rechazo(() => army.adopta(A.adopcion(tropa, 'caso', pub), undefined));
  return (m === 'sin firma' && army.lista().length === 0) || m;
});
await caso('army: firma de OTRA clave -> fuera (no basta con que haya firma)', async () => {
  const otra = generateKeyPairSync('ed25519').privateKey, army = A.crea(verificaNode);
  const ad = A.adopcion(tropa, 'caso', pub);
  const m = await rechazo(() => army.adopta(ad, firmaDe(JSON.stringify(ad), otra)));
  return (m === 'firma: no verifica' && army.lista().length === 0) || m;
});
await caso('army: tropa tocada despues de firmar -> fuera', async () => {
  const army = A.crea(verificaNode), ad = A.adopcion(JSON.parse(JSON.stringify(tropa)), 'caso', pub);
  const f = firmaDe(JSON.stringify(ad)); ad.tropa.rareza = 'unico';
  const m = await rechazo(() => army.adopta(ad, f));
  return (m === 'firma: no verifica' && army.lista().length === 0) || m;
});
await caso('army: la misma tropa no entra dos veces', async () => {
  const army = A.crea(verificaNode), ad = A.adopcion(tropa, 'caso', pub), f = firmaDe(JSON.stringify(ad));
  await army.adopta(ad, f);
  const m = await rechazo(() => army.adopta(ad, f));
  return (m === 'ya adoptada' && army.lista().length === 1) || m;
});

/* --- sintesis --------------------------------------------------------------- */
await caso('sintesis: receta determinista y sin ficheros', () =>
  JSON.stringify(S.receta('pop', 0.3)) === JSON.stringify(S.receta('pop', 0.3)) && S.receta('mp3', 0) === null);
await caso('sintesis: el calor del Nucleo hace el sonido mas grave y aspero', () => {
  const f = S.receta('eclosion', 0), c = S.receta('eclosion', 1);
  return (c.portadora < f.portadora && c.indice > f.indice) || { frio: f, caliente: c };
});
await caso('sintesis: el calor sale de la instantanea (presion del Nucleo), no se inventa', () =>
  S.calorDe({ integridad: 50, integridad_max: 100 }) === 0.5 && S.calorDe(null) === 0);

process.stdout.write(JSON.stringify(casos));
