// Casos del DUELO entre personas por paquetes (`public/game/duelo.js`) y de los LUGARES NPC de la Arena.
// Dos "aparatos" (A y B) con identidades de prueba se pasan los paquetes como texto, igual que por
// Send o Copy. Los ejecuta atlas/test_atlas.py:   node atlas/duelo_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { identidad, verificador, azar } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const A = require('../public/game/arena.js');
const Du = require('../public/game/duelo.js');
const V = require('../public/game/valores.js');

const casos = [];
async function caso(nombre, fn) {
  try { const d = await fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${JSON.stringify(a)} != ${JSON.stringify(b)}`;
const todas = (...xs) => xs.find((x) => x !== true) ?? true;
const rechaza = async (p, re) => { try { await p; return 'no rechazo'; } catch (e) { return re.test(e.message) || e.message; } };
const viaja = (p) => JSON.stringify(p);   // lo que cruza: texto, como por Send o Copy

function aparato(nombre) {
  const id = identidad(nombre); let n = 0; const reloj = { ciclo: 100 };
  const c = Du.crea({ pub: id.pub, pseudonimo: id.pseudonimo, contenido_v: '2026-09-27.1',
    firma: (t) => Promise.resolve(id.firma(t)), verifica: (t, f, k) => Promise.resolve(verificador(t, f, k)),
    azar: () => azar(nombre + ':' + (n++)), azar32: () => azar(nombre + ':n:' + (n++)).slice(0, 32), ciclo: () => reloj.ciclo });
  return { id, c, reloj };
}
const tropas = (quien, tc, k) => Array.from({ length: k }, (_, i) => ({ tc, semilla: azar(quien + '-tropa-' + i) }));

await caso('lugares NPC: seis, iguales en todos los aparatos y cada uno una defensa valida', () => {
  const a = A.lugares(), b = A.lugares();
  return todas(igual(a.length, 6), igual(K.canon(a), K.canon(b)), a.every((l) => A.formaDefensa(l.defensa) === '') || 'forma');
});
await caso('lugares NPC: la escuadra de practica gana en el arrecife y pierde con el Guardian', () => {
  const [arrecife, , , , , nucleo] = A.lugares(), practica = tropas('practica', 'tc1', 3);
  let g = 0, p = 0;
  for (let i = 0; i < 40; i++) {
    const s = K.sha('pve:' + i);
    if (A.combate(arrecife.defensa.tropas, practica, s).gana === 'asalto') { g++; }
    if (A.combate(nucleo.defensa.tropas, practica, s).gana === 'defensa') { p++; }
  }
  return (g >= 24 && p >= 36) || `arrecife ganadas ${g}/40 · nucleo perdidas ${p}/40`;
});

await caso('duelo completo A contra la defensa de B: los dos sacan el MISMO resultado', async () => {
  const a = aparato('a1'), b = aparato('b1');
  const def = await b.c.publica(tropas('b1', 'tc2', 3), { cobre: 50, luz: 0 });
  const ia = await a.c.importa(viaja(def));
  const reto = await a.c.reta(ia.huella, tropas('a1', 'tc2', 3));
  const ib = await b.c.importa(viaja(reto.paquete));
  const resp = await b.c.acepta(ib.sesion);
  const ia2 = await a.c.importa(viaja(resp));
  const rev = await a.c.revela(ia2.sesion);
  const ib2 = await b.c.importa(viaja(rev.paquete));
  return todas(igual(ia.tipo, 'defensa'), igual(ib.tipo, 'desafio'), igual(ia2.tipo, 'respuesta'), igual(ib2.tipo, 'revelacion'),
               igual(K.canon(rev.resultado), K.canon(ib2.resultado)), igual(rev.resultado.final, 'combate'),
               igual(K.canon(a.c.rating()), K.canon({ rating: a.c.rating().rating, partidas: 1 })));
});
await caso('duelo: el rating local de los dos sale igual para cada uno', async () => {
  const a = aparato('a2'), b = aparato('b2');
  const def = await b.c.publica(tropas('b2', 'tc1', 2));
  const h = (await a.c.importa(viaja(def))).huella;
  const reto = await a.c.reta(h, tropas('a2', 'tc3', 2));
  const s = (await b.c.importa(viaja(reto.paquete))).sesion;
  await a.c.importa(viaja(await b.c.acepta(s)));
  const rev = await a.c.revela(s);
  await b.c.importa(viaja(rev.paquete));
  const t = A.tabla(a.c.resultados()), u = A.tabla(b.c.resultados());
  return todas(igual(K.canon(t), K.canon(u)), igual(t.ratings[a.id.pub] + t.ratings[b.id.pub], 2 * V.combate.rating_inicial));
});
await caso('abandono: si A no revela, B lo reclama al pasar el plazo, y A lo comprueba', async () => {
  const a = aparato('a3'), b = aparato('b3');
  const def = await b.c.publica(tropas('b3', 'tc2', 2));
  const h = (await a.c.importa(viaja(def))).huella;
  const reto = await a.c.reta(h, tropas('a3', 'tc2', 2));
  const s = (await b.c.importa(viaja(reto.paquete))).sesion;
  await a.c.importa(viaja(await b.c.acepta(s)));
  const pronto = await rechaza(b.c.abandona(s), /aun no: faltan 900 ciclos/);
  b.reloj.ciclo += V.combate.abandono_ciclos;
  const ab = await b.c.abandona(s);
  const ia = await a.c.importa(viaja(ab.paquete));
  return todas(pronto, igual(b.c.plazo(s), null), igual(ab.resultado.final, 'abandono'), igual(ab.resultado.gana, 'defensa'),
               igual(ia.tipo, 'resultado'), igual(K.canon(ia.resultado), K.canon(ab.resultado)));
});
await caso('abandono: no se reclama si el otro ya revelo', async () => {
  const a = aparato('a4'), b = aparato('b4');
  const def = await b.c.publica(tropas('b4', 'tc1', 2));
  const h = (await a.c.importa(viaja(def))).huella;
  const reto = await a.c.reta(h, tropas('a4', 'tc1', 2));
  const s = (await b.c.importa(viaja(reto.paquete))).sesion;
  await a.c.importa(viaja(await b.c.acepta(s)));
  await b.c.importa(viaja((await a.c.revela(s)).paquete));
  b.reloj.ciclo += 5000;
  return rechaza(b.c.abandona(s), /no espero/);
});
await caso('importar no es creer: firma alterada, replica y desafio a otra defensa, fuera', async () => {
  const a = aparato('a5'), b = aparato('b5'), c = aparato('c5');
  const def = await b.c.publica(tropas('b5', 'tc1', 2));
  const alterada = JSON.parse(viaja(def)); alterada.sobres[0].cuerpo.en_juego.cobre = 999999;
  const replica = JSON.parse(viaja(def)); replica.politica = { ...replica.politica, nonce: 'f'.repeat(32) };
  const h = (await a.c.importa(viaja(def))).huella;
  const reto = await a.c.reta(h, tropas('a5', 'tc1', 2));
  await c.c.publica(tropas('c5', 'tc1', 2));
  return todas(await rechaza(a.c.importa(viaja(alterada)), /firma no verifica/),
               await rechaza(a.c.importa(viaja(replica)), /otra sesion/),
               await rechaza(c.c.importa(viaja(reto.paquete)), /no es a tu defensa/),
               await rechaza(b.c.importa(viaja(def)), /propia defensa/),
               await rechaza(a.c.importa('{roto'), /no es JSON/));
});
await caso('duelo: las cifras de la escuadra no viajan (tropa con stats propias, fuera)', async () => {
  const a = aparato('a6'), b = aparato('b6');
  const h = (await a.c.importa(viaja(await b.c.publica(tropas('b6', 'tc1', 2))))).huella;
  return rechaza(a.c.reta(h, [{ tc: 'tc1', semilla: azar('x'), stats: { vida: 9999 } }]), /tropa/);
});

if (process.argv.includes('--muestras')) {
  const a = aparato('m1'), b = aparato('m2');
  const def = await b.c.publica(tropas('m2', 'tc1', 2));
  const h = (await a.c.importa(viaja(def))).huella;
  const reto = await a.c.reta(h, tropas('m1', 'tc1', 2));
  process.stdout.write(JSON.stringify({ paquete_defensa: def, paquete_desafio: reto.paquete }) + '\n');
} else {
  process.stdout.write(JSON.stringify(casos) + '\n');
}
