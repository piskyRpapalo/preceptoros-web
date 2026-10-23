// Casos del POLVO DE TALLER (P9, `public/game/taller.js`, firmado 2026-10-11). El oraculo, no la palabra:
// el residuo sale de las aristas; lijar sube stats y JAMAS aristas; la cadena de recibos se comprueba entera
// (enlace, cuentas, clave y firmas); el Army solo suelta una tropa con su recibo firmado por quien la adopto;
// lo lijado cuenta en la practica y un duelo no puede traerlo.
//   node atlas/taller_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { identidad, verificador } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const T = require('../public/game/taller.js');
const G = require('../public/game/gacha.js');
const K = require('../public/game/canon.js');
const A = require('../public/game/arena.js');
const D = require('../public/game/db.js');
const V = require('../public/game/valores.js');
const sin = (f) => readFileSync(new URL('../public/game/' + f, import.meta.url), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const casos = [];
async function caso(nombre, fn) {
  try { const d = await fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : JSON.stringify(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const ANA = identidad('ana'), BEA = identidad('bea');
function tropaDe(n, tc) { for (let i = 0; ; i++) { const t = G.tirada(K.sha('taller:' + n + ':' + i), tc || 'tc4'); if (t.aristas === n) { return t; } } }
const firma = (yo, r) => 'ed25519:' + yo.firma(JSON.stringify(r));
function eslabon(cadena, op, yo) {
  const r = T.recibo(T.estado(cadena), op, yo.pub);
  cadena.push({ recibo: r, firma: firma(yo, r) });
  return r;
}

await caso('residuo: una cuadrada da 4 g; un Leviatan de 13 aristas, 39 g (x3); el valor sale de las aristas', () => {
  const r4 = T.residuo(tropaDe(4)), r13 = T.residuo(tropaDe(13)), vieja = Object.assign({}, tropaDe(5)); delete vieja.aristas;
  return (r4 === 4 && r13 === 39 && T.residuo(vieja) === 5) || { r4, r13, vieja: T.residuo(vieja) };
});
await caso('lijar sube SOLO el stat lijado y JAMAS toca aristas ni armonicos', () => {
  const t = tropaDe(7), l = T.aplica(t, { velocidad: 3, armadura: 1, aristas: 9, inventado: 5 });
  return (l.aristas === t.aristas && JSON.stringify(l.armonicos) === JSON.stringify(t.armonicos) && G.aristas(l) === t.aristas &&
    l.stats.velocidad === t.stats.velocidad + 3 && l.stats.armadura === t.stats.armadura + 1 && l.stats.vida === t.stats.vida && !('inventado' in l.stats) &&
    t.stats.velocidad === G.tirada(t.semilla, t.tc).stats.velocidad) || { l: l.stats, t: t.stats };
});
await caso('cadena: desintegrar suma, lijar cuesta mas en cada nivel, y el estado sale de recorrerla', () => {
  const c = [], a = tropaDe(13), b = tropaDe(4);
  eslabon(c, { op: 'desintegra', tropa: a }, ANA);
  eslabon(c, { op: 'lija', semilla: b.semilla, stat: 'velocidad' }, ANA);
  eslabon(c, { op: 'lija', semilla: b.semilla, stat: 'velocidad' }, ANA);
  const e = T.estado(c), esperado = 39 - V.taller.lija.base * 1 - V.taller.lija.base * 2;
  return (e.saldo === esperado && e.lijas[b.semilla].velocidad === 2 && e.disueltas[a.semilla] && e.n === 3) || e;
});
await caso('cadena: un eslabon tocado, desenlazado, de otra clave o fuera de regla se dice y para', () => {
  const base = [], a = tropaDe(13), b = tropaDe(4);
  eslabon(base, { op: 'desintegra', tropa: a }, ANA); eslabon(base, { op: 'lija', semilla: b.semilla, stat: 'vida' }, ANA);
  const copia = () => JSON.parse(JSON.stringify(base));
  const m = {}, mas = copia(); mas[0].recibo.saldo += 100; m.saldo = T.estado(mas).error;
  const gr = copia(); gr[0].recibo.gramos = 1000; gr[0].recibo.saldo = 1000; m.gramos = T.estado(gr).error;
  const en = copia(); en[1].recibo.prev = T.CERO; m.enlace = T.estado(en).error;
  const ot = copia(); ot[1].recibo.clave_publica = BEA.pub; m.clave = T.estado(ot).error;
  const dos = copia(); dos.push(JSON.parse(JSON.stringify(dos[0]))); dos[2].recibo.prev = K.sha(JSON.stringify(dos[1].recibo)); m.doble = T.estado(dos).error;
  const fuera = Object.keys(m).filter((k) => !m[k]);
  return !fuera.length || { pasan_sin_error: fuera, m };
});
await caso('regla: sin residuo no se lija, hay tope de nivel y no se lija lo desintegrado', () => {
  const b = tropaDe(4), c = [], m = [];
  try { T.recibo(T.estado([]), { op: 'lija', semilla: b.semilla, stat: 'velocidad' }, ANA.pub); m.push('lijo sin residuo'); } catch (e) { /* bien */ }
  eslabon(c, { op: 'desintegra', tropa: tropaDe(16) }, ANA); eslabon(c, { op: 'desintegra', tropa: tropaDe(15) }, ANA);
  for (let i = 0; i < V.taller.lija.max; i++) { eslabon(c, { op: 'lija', semilla: b.semilla, stat: 'sigilo' }, ANA); }
  try { T.recibo(T.estado(c), { op: 'lija', semilla: b.semilla, stat: 'sigilo' }, ANA.pub); m.push('paso el tope'); } catch (e) { /* bien */ }
  const d = tropaDe(13); eslabon(c, { op: 'desintegra', tropa: d }, ANA);
  try { T.recibo(T.estado(c), { op: 'lija', semilla: d.semilla, stat: 'vida' }, ANA.pub); m.push('lijo lo desintegrado'); } catch (e) { /* bien */ }
  try { T.recibo(T.estado(c), { op: 'lija', semilla: b.semilla, stat: 'aristas' }, ANA.pub); m.push('lijo aristas'); } catch (e) { /* bien */ }
  return !m.length || m;
});
await caso('firmas: la cadena firmada verifica; un recibo con firma de otra persona, no', async () => {
  const c = []; eslabon(c, { op: 'desintegra', tropa: tropaDe(4) }, ANA);
  const mala = JSON.parse(JSON.stringify(c)); mala[0].firma = firma(BEA, mala[0].recibo);
  return ((await T.verificaFirmas(c, verificador)) === true && (await T.verificaFirmas(mala, verificador)) === false) || 'firmas';
});
await caso('Army: solo suelta una tropa con su recibo firmado por QUIEN LA ADOPTO', async () => {
  const t = tropaDe(6), alm = { l: [], lee() { return this.l; }, pon(x) { this.l = x; } }, army = D.crea(verificador, alm);
  const ad = D.adopcion(t, ANA.pseudonimo, ANA.pub);
  await army.adopta(ad, 'ed25519:' + ANA.firma(JSON.stringify(ad)));
  const r = T.recibo(T.estado([]), { op: 'desintegra', tropa: t }, ANA.pub), mal = [];
  const rb = T.recibo(T.estado([]), { op: 'desintegra', tropa: t }, BEA.pub);
  await army.retira(rb, firma(BEA, rb)).then(() => mal.push('otra clave la saco'), () => {});
  await army.retira(r, firma(BEA, r)).then(() => mal.push('firma ajena valio'), () => {});
  await army.retira(r, firma(ANA, r));
  if (army.lista().length !== 0 || alm.l.length !== 0) { mal.push('no salio'); }
  return !mal.length || mal;
});
await caso('combate: lo lijado cuenta en la practica; un duelo NO puede traer lija (forma {tc, semilla})', () => {
  const t = tropaDe(4, 'tc1'), npc = [{ tc: 'tc4', semilla: K.sha('npc') }], s = K.sha('semilla-de-practica');
  const sin = A.combate(npc, [{ tc: t.tc, semilla: t.semilla }], s), con = A.combate(npc, [{ tc: t.tc, semilla: t.semilla, lija: { vida: 5, armadura: 5 } }], s);
  const def = (tropas) => A.formaDefensa({ esquema: 'atlas.defensa/1', pack_sha: A.packSha(), tropas, en_juego: { cobre: 0, luz: 0 } });
  const limpia = def([{ tc: t.tc, semilla: t.semilla }]), lijada = def([{ tc: t.tc, semilla: t.semilla, lija: { vida: 1 } }]);
  return (JSON.stringify(sin.registro) !== JSON.stringify(con.registro) && limpia === '' && /tropa/.test(lijada)) || { limpia, lijada };
});
// P10 · PRISMA DE BANDERA: tenir es otra operacion de la MISMA cadena, de una paleta CERRADA, solo aspecto.
const C = require('../public/game/home_buildings.js');
await caso('P10: tenir cuesta residuo, solo con colores de la paleta cerrada, y no se tine lo desintegrado ni dos veces igual', () => {
  const c = [], a = tropaDe(13), b = tropaDe(4), m = [];
  eslabon(c, { op: 'desintegra', tropa: a }, ANA);
  const r = eslabon(c, { op: 'tinte', semilla: b.semilla, bandera: 'teal' }, ANA), e = T.estado(c);
  if (r.gramos !== -V.taller.tinte.coste || e.tintes[b.semilla] !== 'teal' || e.saldo !== 39 - V.taller.tinte.coste) { m.push('cuentas'); }
  for (const [op, que] of [[{ op: 'tinte', semilla: b.semilla, bandera: '#39ff14' }, 'color libre'], [{ op: 'tinte', semilla: b.semilla, bandera: 'teal' }, 'mismo color'],
                           [{ op: 'tinte', semilla: a.semilla, bandera: 'oro' }, 'desintegrada']]) {
    try { T.recibo(e, op, ANA.pub); m.push('paso: ' + que); } catch (x) { /* bien */ }
  }
  try { T.recibo(T.estado([]), { op: 'tinte', semilla: b.semilla, bandera: 'oro' }, ANA.pub); m.push('tino sin residuo'); } catch (x) { /* bien */ }
  return !m.length || m;
});
await caso('P10: la paleta es UNA (la casa ofrece exactamente los colores de valores) y el tinte no toca el combate', () => {
  const casa = C.OPCIONES.bandera.filter(Boolean).join(), val = Object.keys(V.banderas).join();
  const t = tropaDe(5, 'tc1'), lt = T.aplica(t, { bandera: 'teal' });
  const ciego = !/bandera|tinte|tintes/.test(sin('arena.js')) && JSON.stringify(lt.stats) === JSON.stringify(t.stats);
  return (casa === val && ciego) || { casa, val, ciego };
});
await caso('P10: una casa guardada antes de P10 entra sin bandera (null), no se pierde; un color libre no entra', () => {
  const vieja = C.base(); delete vieja.bandera;
  const migrada = C.migra(JSON.parse(JSON.stringify(vieja))), libre = Object.assign(C.base(), { bandera: '#39ff14' });
  return (C.forma(vieja) !== '' && C.forma(migrada) === '' && migrada.bandera === null && C.forma(libre) === 'bandera') || { v: C.forma(vieja), m: C.forma(migrada), l: C.forma(libre) };
});
await caso('pureza: el Taller no usa azar, reloj, red ni almacen directo (la caja es db.js)', () => {
  const malos = [];
  for (const f of ['taller.js', 'ui-taller.js', 'sea-anchors.js']) {
    for (const m of ['Math.random', 'Date.', 'fetch(', 'localStorage', 'indexedDB', 'XMLHttpRequest', 'sendBeacon']) { if (sin(f).includes(m)) { malos.push(f + ': ' + m); } }
  }
  return !malos.length || malos;
});
console.log(JSON.stringify(casos));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
