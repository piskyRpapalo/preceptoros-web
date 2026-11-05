// Pieza 2 · el mapa vivo (odd/tasks/mapa-vivo.md): live_heartbeat.js, pure. Every frame under 1,024 B with its sentence and
// declared sound; LIVE beats and STALE never does; the tutorial cabin and hidden nodes get nothing; the State buoy is a
// Proof of Tick: replayed from { nace, cuidado, t } it gives the same frame, and unattended it dies to NO_DATA, never «0».
// Sabotages (each must turn this file red): SABOTAJE=desatendida (the buoy never wears), SABOTAJE=stale-late (STALE beats).
// Uso: node atlas/live_heartbeat_cases.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
['semantic_table', 'comic_tokens', 'comic_accents', 'gacha', 'acho_language'].forEach((m) => require('../public/game/' + m + '.js'));
const LV = require('../public/game/live_heartbeat.js');
const B = globalThis.AtlasAcho || require('../public/game/acho_language.js');
const S = require('../public/game/acho_sonify.js');

const SAB = process.env.SABOTAJE || '';
if (SAB === 'desatendida') { LV.BOYA.desgaste_por_tic = 0; }
const stamp = SAB === 'stale-late' ? (id, seal, t) => LV.stampFrame(id, seal === 'STALE' ? 'LIVE' : seal, t, false) : LV.stampFrame;

const casos = [];
function caso(nombre, f) {
  try { const r = f(); casos.push({ caso: nombre, ok: r === true, detalle: r === true ? '' : JSON.stringify(r).slice(0, 300) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: String(e && e.message || e) }); }
}
const compila = (f) => { B.compile(f); return B.compile.notes.length === 0 || B.compile.notes; };
const G = { cx: 1000, cy: 900, k: 3, turn: (x, y) => ({ x, y }) };
const LARGO = 'x'.repeat(40);

caso('every frame is under 1,024 B and compiles clean, at the worst on-screen case', () => {
  const fs = [LV.stampFrame(LARGO, 'LIVE', 99999, false), LV.stampFrame(LARGO, 'STALE', 99999, false),
    LV.groundFrame({ id: LARGO, q: 2, r: 3, seal: 'LIVE' }, G, {}, 7), LV.groundFrame({ id: LARGO, q: 2, r: 3, seal: 'STALE' }, G, {}, 7),
    LV.buoyFrame({ t: 999999999, nace: 999999990, cuidado: 999999990 }), LV.buoyFrame({ t: 5, nace: 1, cuidado: 1 })];
  const mal = fs.filter((f) => LV.size(f) >= 1024 || compila(f) !== true || typeof f.atoms[0].r !== 'string' || typeof f.sound !== 'string');
  return mal.length === 0 || mal.map((f) => f.id + ' ' + LV.size(f));
});
caso('LIVE beats with motion and stands still under reduced motion', () => {
  const y = (t, red) => LV.stampFrame('a', 'LIVE', t, red).atoms[0].i[0].pts[0][1];
  return (y(1, false) !== y(2, false) && y(1, true) === y(2, true)) || [y(1, false), y(2, false), y(1, true), y(2, true)];
});
caso('STALE never beats and declares why it does not sound', () => {
  const a = stamp('a', 'STALE', 1), b = stamp('a', 'STALE', 2);
  return (a.atoms[0].i[0].pts[0][1] === b.atoms[0].i[0].pts[0][1] && /^NO_DATA: /.test(a.sound) && a.seal === 'STALE') || a.sound;
});
caso('the LIVE seal sounds through its own wave (acho_sonify)', () => {
  const r = S.sonify(LV.stampFrame('a', 'LIVE', 1, false));
  return (r.ok === true && r.voices.length === 1) || r;
});
caso('the tutorial cabin and hidden nodes get no seal and no ground', () => {
  const tiles = [{ id: 'cabin', q: -1, r: 0, x: -96, y: -24 }, { id: 'a', q: 0, r: 0, x: 0, y: 0 }, { id: 'b', q: 1, r: 0, x: 96, y: 24 }];
  const sc = LV.scene(tiles, { cabin: 'LIVE', a: 'LIVE', b: 'NO_DATA' }, 1, false, null);
  return (sc.marks.map((m) => m.id).join() === 'seal-a' && sc.ground.map((n) => n.id).join() === 'a' && sc.frases.length === 2) || sc;
});
caso('the woken ground is the outline of seven cells (18 corners) on their own heights', () => {
  const f = LV.groundFrame({ id: 'a', q: 1, r: 0, seal: 'LIVE' }, G, { '2,0': [2, 0, 3, 'land'] }, 7), i = f.atoms[0].i;
  return (i[0].pts.length === 18 && i[0].closed === true && i[1].pts.length === 6) || i.map((x) => x.pts.length);
});
caso('the State buoy is a Proof of Tick: the same three integers replay the same frame', () => {
  const a = JSON.stringify(LV.buoyFrame({ t: 7, nace: 3, cuidado: 6 })), b = JSON.stringify(LV.buoyFrame({ t: 7, nace: 3, cuidado: 6 }));
  const p = LV.buoyFrame({ t: 7, nace: 3, cuidado: 6 }).prueba;
  return (a === b && p.nace_tic === 3 && p.cuidado_tic === 6 && p.t === 7) || p;
});
caso('unattended, the buoy wears to NO_DATA with its cause, never «0»', () => {
  const fase = (t) => LV.estado({ esquema: 'preceptoros.edificio/1', nace_tic: 1, cuidado_tic: 1, madura_tics: LV.BOYA.madura_tics, desgaste_por_tic: LV.BOYA.desgaste_por_tic }, t);
  const seq = [1, 2, 3, 5].map((t) => fase(t).fase).join(), fin = LV.buoyFrame({ t: 5, nace: 1, cuidado: 1 });
  return (seq === 'naciendo,vivo,gastado,NO_DATA' && /NO_DATA · unattended 4 cycles/.test(fin.atoms[0].r) && !/life 0\b/.test(fin.atoms[0].r) && fin.seal === 'NO_DATA') || [seq, fin.atoms[0].r];
});
caso('a good read cares for the buoy again', () => {
  const f = LV.buoyFrame({ t: 9, nace: 1, cuidado: 9 });
  return /^State buoy · vivo · life 1000\/1000/.test(f.atoms[0].r) || f.atoms[0].r;
});
caso('a frame over the law is NO_DATA in the scene, never painted and never a crash', () => {
  const sc = LV.scene([{ id: 'z'.repeat(40) + 'y'.repeat(400), q: 0, r: 0, x: 0, y: 0 }], { ['z'.repeat(40) + 'y'.repeat(400)]: 'LIVE' }, 1, false, null);
  return (sc.marks.length === 0 && /NO_DATA · frame seal-/.test(sc.frases[0])) || sc.frases;
});

const rojos = casos.filter((c) => !c.ok);
console.log(JSON.stringify({ pieza: 'latido-vivo', sabotaje: SAB || null, casos: casos.length, rojos: rojos.length, detalle: rojos }));
process.exitCode = rojos.length ? 1 : 0;
