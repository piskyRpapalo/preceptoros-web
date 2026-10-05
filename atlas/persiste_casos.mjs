// preceptoros.org · theGame · casos de la PERSISTENCIA (plan firmado 2026-10-05, capa C1).
//
//     node atlas/persiste_casos.mjs     # imprime [{caso, ok, detalle}, ...] y sale 1 si alguno falla
//
// «Salir del juego hace perder recursos y army: eso se arregla.» Lo que se guarda no se CREE al
// volver: la partida se REPRODUCE con el motor puro (`atlas-guardado.js`) y cada tropa vuelve a
// entrar POR `adopta`, que re-verifica su firma (`db.js`). Aqui se prueba en node, con el mismo
// codigo de la pestana y un almacen en memoria que copia como IndexedDB (clon estructurado ~ JSON).
import { createRequire } from 'node:module';
import { createHash, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const G = require(join(RAIZ, 'public/game/gacha.js'));
const A = require(join(RAIZ, 'public/game/db.js'));
const casos = [];
async function caso(nombre, f) {
  let ok = false, detalle = '';
  try { const r = await f(); ok = r === true; if (!ok) { detalle = JSON.stringify(r); } }
  catch (e) { detalle = e.message; }
  casos.push({ caso: nombre, ok, detalle });
}
const sha = (t) => createHash('sha256').update(String(t)).digest('hex');
const clon = (x) => JSON.parse(JSON.stringify(x));

/* --- recursos: la partida guardada vuelve a jugarse y da el mismo estado --------------------- */
const w = {}; vm.createContext(w);
vm.runInContext(readFileSync(join(RAIZ, 'public/assets/atlas-motor.js'), 'utf8'), w);
vm.runInContext(readFileSync(join(RAIZ, 'public/assets/atlas-partida.js'), 'utf8'), w);
const LEY = w.AtlasMotor.leyes({ pruebas_web: 171, arnes_sw: '24/24', gzip_juego_b: 95000 });
let E = w.AtlasMotor.inicial(LEY);
for (let i = 0; i < 300; i++) { E = w.AtlasMotor.ciclo(E, LEY); }
E = w.AtlasMotor.invocar(E, G.TCS.tc1.coste);
for (let i = 0; i < 40; i++) { E = w.AtlasMotor.ciclo(E, LEY); }
/* El estado ENTERO, no una seleccion de campos (un campo que no existe compara igual en falso).
   Solo se quita `eventos[].dia`: la partida no guarda fechas de reloj, por construccion. */
const RECURSOS = (e) => Object.assign({}, e, { eventos: e.eventos.map((v) => Object.assign({}, v, { dia: null })) });

await caso('recarga: la partida guardada se reproduce y conserva los recursos', () => {
  const guardada = clon(w.AtlasPartida.partida(E, w.AtlasMotor));
  const vuelta = w.AtlasPartida.retoma(guardada, w.AtlasMotor);
  return JSON.stringify(RECURSOS(vuelta)) === JSON.stringify(RECURSOS(E)) || { antes: RECURSOS(E), despues: RECURSOS(vuelta) };
});
await caso('recarga: una partida guardada y tocada NO vuelve a entrar', () => {
  const t = clon(w.AtlasPartida.partida(E, w.AtlasMotor)); t.final.ciclo += 1;
  try { w.AtlasPartida.retoma(t, w.AtlasMotor); return 'aceptada'; } catch (e) { return true; }
});

/* --- army: se guarda solo {adopcion, firma} y vuelve POR adopta ------------------------------ */
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pub = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
const firmaDe = (texto) => 'ed25519:' + sign(null, Buffer.from(texto), privateKey).toString('hex');
function verificaNode(texto, firmaHex, claveHex) {
  const k = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(claveHex, 'hex')]), format: 'der', type: 'spki' });
  return verify(null, Buffer.from(texto), k, Buffer.from(firmaHex, 'hex'));
}
function memoria() { let dato; return { lee: () => Promise.resolve(dato === undefined ? [] : clon(dato)), pon: (l) => { dato = clon(l); }, ve: () => dato }; }
async function armyCon(alm, n) {
  const army = A.crea(verificaNode, alm);
  for (let i = 0; i < n; i++) {
    const ad = A.adopcion(G.tirada(sha('persiste' + i), 'tc2'), 'caso', pub);
    await army.adopta(ad, firmaDe(JSON.stringify(ad)));
  }
  return army;
}

await caso('recarga: el army adoptado vuelve entero y re-verificado', async () => {
  const alm = memoria(), antes = await armyCon(alm, 3);
  const despues = A.crea(verificaNode, alm), r = await despues.restaura();
  const s = (a) => a.lista().map((u) => u.adopcion.tropa.semilla).join();
  return (r.entran === 3 && r.fuera.length === 0 && s(despues) === s(antes)) || { r, antes: s(antes), despues: s(despues) };
});
await caso('recarga: una firma tocada en el almacen deja esa tropa FUERA, con su causa', async () => {
  const alm = memoria(); await armyCon(alm, 2);
  const l = alm.ve(); l[1].firma = 'ed25519:' + '0'.repeat(128); alm.pon(l);
  const r = await A.crea(verificaNode, alm).restaura();
  return (r.entran === 1 && r.fuera.length === 1 && /firma/.test(r.fuera[0]) && alm.ve().length === 1) || { r, quedan: alm.ve().length };
});
await caso('recarga: una tropa tocada despues de firmar no vuelve a entrar', async () => {
  const alm = memoria(); await armyCon(alm, 1);
  const l = alm.ve(); l[0].adopcion.tropa.rareza = 'unico'; alm.pon(l);
  const r = await A.crea(verificaNode, alm).restaura();
  return (r.entran === 0 && r.fuera.length === 1) || r;
});
await caso('recarga: el almacen solo guarda {adopcion, firma}, nada de la maquina', async () => {
  const alm = memoria(); await armyCon(alm, 1);
  const k = Object.keys(alm.ve()[0]).sort().join();
  return k === 'adopcion,firma' || k;
});
await caso('recarga: sin almacen, el army sigue viviendo en memoria como antes', async () => {
  const army = await armyCon(undefined, 1), r = await army.restaura();
  return (army.lista().length === 1 && r.entran === 0) || r;
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
