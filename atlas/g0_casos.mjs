// G0 · LA CADENA DE INVOCACIONES (aceptada por el Soberano el 2026-10-11, con el bug del huevo dentro).
// Cada invocacion es un eslabon firmado {esquema, tc, seq, prev, clave_publica}: seq monotono por clave y prev =
// la semilla del anterior (sha256 de su firma). Se guarda en el aparato, y con ella los huevos: recargar ya no
// pierde el huevo con el cobre gastado. Sin cadena entera no hay piedad verificable. Ed25519 REAL (node:crypto).
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign, verify, createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const R = new URL('..', import.meta.url).pathname;
const A = require(R + 'public/game/db.js');
const G = require(R + 'public/game/gacha.js');

const casos = [];
async function caso(nombre, f) {
  try { const r = await f(); casos.push({ caso: nombre, ok: r === true, detalle: r === true ? '' : JSON.stringify(r).slice(0, 300) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: String(e && e.message || e).slice(0, 300) }); }
}
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const PUB = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
const firmar = (obj) => 'ed25519:' + sign(null, Buffer.from(JSON.stringify(obj)), privateKey).toString('hex');
const semilla = (f) => createHash('sha256').update(f).digest('hex');
const verifica = (texto, fHex, clave) => verify(null, Buffer.from(texto),
  { key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(clave, 'hex')]), format: 'der', type: 'spki' }, Buffer.from(fHex, 'hex'));
function invoca(cadena, tc, desde) {
  const o = A.eslabon(cadena, tc, PUB), f = firmar(o);
  return A.anexa(cadena, o, f, semilla(f), desde, desde + G.TCS[tc].incuba);
}

await caso('G0: el primer eslabon es seq 1, prev genesis, y solo firma lo que fija la semilla', () => {
  const o = A.eslabon([], 'tc1', PUB);
  return JSON.stringify(Object.keys(o)) === '["esquema","tc","seq","prev","clave_publica"]' &&
    o.esquema === 'atlas.invocacion/2' && o.seq === 1 && o.prev === 'genesis' || o;
});
await caso('G0: la cadena enlaza (seq+1 y prev = semilla del anterior)', () => {
  let c = invoca([], 'tc1', 0); c = invoca(c, 'tc2', 5); c = invoca(c, 'tc1', 9);
  return c.length === 3 && c[2].obj.seq === 3 && c[2].obj.prev === c[1].semilla && A.compruebaCadena(c) === '' || c.map(e => e.obj);
});
await caso('G0: sin pesca de semilla, mismo puesto + misma TC = misma semilla (sin pseudonimo ni ciclo firmados)', () => {
  const a = A.eslabon([], 'tc1', PUB), b = A.eslabon([], 'tc1', PUB);
  return JSON.stringify(a) === JSON.stringify(b) && semilla(firmar(a)) === semilla(firmar(b)) && !('pseudonimo' in a) && !('ciclo' in a);
});
await caso('G0: un eslabon fuera de orden no se anexa', () => {
  const c = invoca([], 'tc1', 0), o = Object.assign(A.eslabon(c, 'tc1', PUB), { seq: 5 }), f = firmar(o);
  try { A.anexa(c, o, f, semilla(f), 1, 2); return 'se anexo'; } catch (e) { return /seq/.test(e.message) || e.message; }
});
await caso('G0: un hueco en la cadena se DETECTA (esconder un eslabon no se puede)', () => {
  let c = invoca([], 'tc1', 0); c = invoca(c, 'tc1', 1); c = invoca(c, 'tc1', 2);
  const sin = [c[0], c[2]], causa = A.compruebaCadena(sin);
  return /seq|prev/.test(causa) || causa;
});
await caso('G0: firma y semilla se re-verifican al volver (Ed25519 real); una alterada sale NO_DATA con causa', async () => {
  let c = invoca([], 'tc1', 0); c = invoca(c, 'tc3', 4);
  const bien = await A.verificaCadena(c, PUB, verifica, async (f) => semilla(f));
  const mala = JSON.parse(JSON.stringify(c)); mala[1].obj.tc = 'tc1';
  const mal = await A.verificaCadena(mala, PUB, verifica, async (f) => semilla(f));
  return bien === '' && /firma/.test(mal) || { bien, mal };
});

await caso('G0: abrir un huevo lo marca en la cadena (no se borra: la cronica lo guarda)', () => {
  let c = invoca([], 'tc1', 0); c = invoca(c, 'tc2', 3);
  const d = A.abre(c, 1);
  return d.length === 2 && A.huevos(d).length === 1 && A.huevos(d)[0].seq === 2 && d[0].abierto === true && A.compruebaCadena(d) === '';
});

await caso('1+2 · PIEDAD: cuenta desde el ultimo raro o mejor, solo lo ABIERTO; con hueco, NO_DATA', () => {
  let c = []; for (let i = 0; i < 6; i++) { c = invoca(c, 'tc1', i * 30); }
  const rz = (e) => G.tirada(e.semilla, e.obj.tc).rareza;
  let abierta = c; for (const e of c.slice(0, 4)) { abierta = A.abre(abierta, e.obj.seq); }
  const p = A.piedad(abierta, rz), r = abierta.filter(e => e.abierto).map(rz);
  let esperado = 0; for (let i = r.length - 1; i >= 0 && r[i] !== 'raro' && r[i] !== 'unico'; i--) { esperado++; }
  const hueco = A.piedad([abierta[0], abierta[2]], rz);
  return p.desde_raro === esperado && p.abiertos === 4 && p.incubando === 2 && !!hueco.nd && !('desde_raro' in hueco) || { p, r, hueco };
});
await caso('3 · CRONICA: cada capsula ABIERTA con su puesto, ciclo, sello y lo que salio (lo que incuba no se destripa)', () => {
  let c = invoca([], 'tc2', 10); c = invoca(c, 'tc1', 40); c = A.abre(c, 1);
  const k = A.cronica(c, G.tirada), t = G.tirada(c[0].semilla, 'tc2');
  return k.length === 1 && k[0].seq === 1 && k[0].ciclo === 10 && k[0].aristas === t.aristas && k[0].rareza === t.rareza && k[0].sello === c[0].semilla.slice(0, 8) || k;
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every(c => c.ok) ? 0 : 1;
