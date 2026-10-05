// Casos de la REPETICION tipo RTS (`public/game/battle_choreography.js`): la coreografia es una
// funcion pura del registro y la semilla, y nunca ensena ganar a quien el registro dice que pierde.
// Los ejecuta atlas/test_atlas.py:   node atlas/replay_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const A = require('../public/game/arena.js');
const G = require('../public/game/gacha.js');
const Co = require(process.env.COREO || '../public/game/battle_choreography.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const tropas = (lista) => lista.map((x) => { const s = G.tirada(x.semilla, x.tc).stats; return { max: s.vida, vel: s.velocidad, inercia: s.inercia }; });
const escuadra = (q, tc, k) => Array.from({ length: k }, (_, i) => ({ tc, semilla: K.sha(`replay:${q}:${i}`) }));

// Un banco de peleas reales: cada lugar NPC contra varias escuadras, con semillas de partida.
const peleas = [];
A.lugares().forEach((l) => {
  [['tc1', 3], ['tc2', 2], ['tc3', 4], ['tc4', 5]].forEach(([tc, k], j) => {
    const asa = escuadra(l.id + j, tc, k), semilla = K.sha(['atlas.pve/1', l.id, K.huella(asa), j].join(':'));
    peleas.push({ id: `${l.id}/${tc}x${k}`, def: l.defensa.tropas, asa, semilla, c: A.combate(l.defensa.tropas, asa, semilla) });
  });
});
const coreo = (p, s) => Co.coreografia(p.c.registro, [tropas(p.def), tropas(p.asa)], s || p.semilla, p.c.gana);
const hechas = peleas.map((p) => ({ p, k: coreo(p) }));

caso('hay peleas de los tres desenlaces o al menos de dos', () => {
  const g = new Set(peleas.map((p) => p.c.gana));
  return g.size >= 2 || [...g].join();
});

caso('misma partida, misma coreografia (hash igual)', () => {
  const malas = hechas.filter(({ p, k }) => coreo(p).hash !== k.hash).map(({ p }) => p.id);
  return !malas.length || malas.join();
});

caso('otra semilla, otra coreografia (el hash la distingue)', () => {
  const p = peleas[0], a = coreo(p).hash, b = coreo(p, K.sha('otra')).hash;
  return a !== b || 'mismo hash con semillas distintas';
});

caso('el ganador que se ve es el del registro, en todas', () => {
  const malas = hechas.filter(({ p, k }) => Co.ganadorVisual(k) !== p.c.gana).map(({ p, k }) => `${p.id}: ve ${Co.ganadorVisual(k)}, registro ${p.c.gana}`);
  return !malas.length || malas.join('; ');
});

caso('al final, quien gana va por delante de quien pierde', () => {
  const malas = [];
  hechas.forEach(({ p, k }) => {
    if (p.c.gana === 'empate') { return; }
    const c = Co.centro(k, k.frames.length - 1), b = k.mapa.bases, w = p.c.gana === 'asalto' ? 1 : 0;
    const avance = (l) => Math.abs(c[l] - b[l].x), medio = Math.abs(500 - b[w].x);
    // Quien gana toma el campo: cruza el centro hacia la base de quien pierde...
    if (!(avance(w) > medio)) { malas.push(`${p.id}: quien gana se queda en ${c[w].toFixed(0)}`); }
    // ...y si a quien pierde le queda alguien, va por detras.
    if (c[1 - w] !== null && !(avance(w) > avance(1 - w))) { malas.push(`${p.id}: gana ${avance(w).toFixed(0)} pierde ${avance(1 - w).toFixed(0)}`); }
  });
  return !malas.length || malas.join('; ');
});

caso('cada golpe del registro es un tiro, en orden y con su dano', () => {
  const malas = hechas.filter(({ p, k }) => k.tiros.length !== p.c.registro.length ||
    k.tiros.some((t, i) => t.dano !== p.c.registro[i][4] || t.lado !== p.c.registro[i][1] || t.de !== p.c.registro[i][2] || t.a !== p.c.registro[i][3]))
    .map(({ p }) => p.id);
  return !malas.length || malas.join();
});

caso('caen exactamente las tropas que el registro deja sin vida', () => {
  const malas = [];
  hechas.forEach(({ p, k }) => {
    const vida = [tropas(p.def).map((t) => t.max), tropas(p.asa).map((t) => t.max)];
    p.c.registro.forEach((e) => { if (e[4] > 0) { vida[1 - e[1]][e[3]] = Math.max(0, vida[1 - e[1]][e[3]] - e[4]); } });
    const muertos = vida.flatMap((l, lado) => l.map((v, i) => (v ? null : `${lado}:${i}`))).filter(Boolean).sort().join();
    const vistos = k.momentos.filter((m) => m.tipo === 'cae').map((m) => `${m.lado}:${m.i}`).sort().join();
    if (muertos !== vistos) { malas.push(`${p.id}: ${muertos} != ${vistos}`); }
  });
  return !malas.length || malas.join('; ');
});

caso('todas las unidades se quedan dentro del mapa', () => {
  const malas = hechas.filter(({ k }) => k.frames.some((f) => f.some((v, i) => i % 3 === 0 ? v < 0 || v > 1000 : i % 3 === 1 ? v < 0 || v > 600 : false)))
    .map(({ p }) => p.id);
  return !malas.length || malas.join();
});

caso('hay movimiento de verdad: las tropas cruzan el campo', () => {
  const quietas = hechas.filter(({ k }) => {
    const a = k.frames[0], b = k.frames[Math.floor(k.frames.length / 2)];
    let s = 0; for (let i = 0; i < a.length; i += 3) { s += Math.abs(b[i] - a[i]); }
    return s / (a.length / 3) < 120;
  }).map(({ p }) => p.id);
  return !quietas.length || quietas.join();
});

caso('los momentos clave van en orden: marcha, choque, caidas y fin', () => {
  const malas = hechas.filter(({ k }) => k.momentos[0].tipo !== 'marcha' || k.momentos[k.momentos.length - 1].tipo !== 'fin' ||
    k.momentos.some((m, i) => i && m.t < k.momentos[i - 1].t)).map(({ p }) => p.id);
  return !malas.length || malas.join();
});

caso('las formaciones cambian la coreografia, nunca el registro ni el ganador', () => {
  const malas = [];
  hechas.slice(0, 12).forEach(({ p, k }) => {
    const hashes = new Set([k.hash]);
    Co.FORMAS.forEach((f) => {
      const c2 = A.combate(p.def, p.asa, p.semilla);
      if (JSON.stringify(c2.registro) !== JSON.stringify(p.c.registro)) { malas.push(p.id + ': el registro cambia'); }
      const kf = Co.coreografia(p.c.registro, [tropas(p.def), tropas(p.asa)], p.semilla, p.c.gana, { lado: 1, formacion: f });
      hashes.add(kf.hash);
      if (Co.ganadorVisual(kf) !== p.c.gana) { malas.push(`${p.id}/${f}: se ve ganar a otro`); }
      if (kf.tiros.length !== p.c.registro.length) { malas.push(`${p.id}/${f}: faltan tiros`); }
    });
    if (hashes.size < 3) { malas.push(p.id + ': las formaciones no se distinguen'); }
  });
  return !malas.length || malas.join('; ');
});

caso('una semilla que no es hex se rechaza', () => {
  try { Co.coreografia([], [[], []], 'no-hex', 'empate'); return 'acepto'; } catch (e) { return /semilla/.test(e.message) || e.message; }
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
