// atlas/bout_casos.mjs · viabilidad: cangrejo contra dormido en la misma arena (FIRMO 2026-10-18).
// Uso: node atlas/bout_casos.mjs · rc 0 solo si todos los casos pasan. Node 22, ESM, sin dependencias.
// La historia paralela (el Dia del Silencio) es una PIEL: la arena solo ve armonicos y un paquete < 1.024 B.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { checkFrame } from './param_gate.mjs';

const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const ESCENA = ruta('../public/assets/bout_scene.js'), JUEGO = ruta('../public/game/bubble_game.js');
const ORDEN = ['SILENCE', 'SLEEPERS', 'BOUT', 'WAKE'];
const VETADAS = ['death', 'dead', 'undead', 'die', 'fire', 'burn', 'monster', 'teeth', 'scream', 'blood', 'kill', 'fear',
  'skull', 'fang', 'knife', 'brain', 'bite', 'gore', 'token', 'currency', 'casino', 'bet'];
const casos = [];
const caso = (n, nombre, prueba) => {
  let r;
  try { r = prueba(); } catch (e) { r = { ok: false, medida: 'error: ' + e.message }; }
  casos.push({ caso: n, nombre, ok: r.ok === true, medida: r.medida });
};
const J = (x) => JSON.stringify(x);

let S = null, A = null, W = null, AR = null, causa = null;
if (existsSync(ESCENA)) {
  try {
    for (const m of ['bubble_light', 'bubble_bestiary', 'bubble_world', 'bubble_letters']) req(ruta('../public/game/' + m + '.js'));
    A = req(ruta('../public/game/bubble_language.js'));
    globalThis.AtlasBubble = A;
    W = req(JUEGO);
    AR = req(ruta('../public/game/arena.js'));
    S = req(ESCENA);
  } catch (e) { causa = 'no carga: ' + e.message; }
} else { causa = 'public/assets/bout_scene.js no existe todavia'; }
const falta = () => ({ ok: false, medida: 'NO_DATA: ' + causa });

caso(1, 'cuatro capitulos en orden', () => (S ? { ok: J(S.SECTIONS) === J(ORDEN) } : falta()));

caso(2, 'cada silaba pasa checkFrame (< 1.024 B, bandas nombradas)', () => {
  if (!S) return falta();
  const bytes = {};
  const ok = ORDEN.every((id) => { const r = checkFrame(S.frame(id)); bytes[id] = r.bytes; return r.ok; });
  return { ok, medida: bytes };
});

caso(3, 'el combate entero es un paquete de < 1.024 B con seis claves exactas', () => {
  if (!S) return falta();
  const k = Object.keys(S.BOUT).sort();
  return { ok: S.BYTES === J(S.BOUT).length && S.BYTES < 1024 && J(k) === J(['crab', 'seed', 'skin', 'sleeper', 'tc', 'v']), medida: S.BYTES };
});

caso(4, 'la arena es la de verdad: FIGHT = AtlasArena.combate(paquete) y la serie acaba en la vida medida', () => {
  if (!S) return falta();
  const B = S.BOUT, f = AR.combate([{ tc: B.tc, semilla: B.sleeper }], [{ tc: B.tc, semilla: B.crab }], B.seed);
  const fin = S.HP[S.HP.length - 1], ini = S.HP[0];
  const pm = [Math.floor(fin[0] * 1000 / ini[0]), Math.floor(fin[1] * 1000 / ini[1])];
  return { ok: J(f) === J(S.FIGHT) && J(pm) === J(S.FIGHT.vida_por_mil) && S.HP.length === S.FIGHT.rondas + 1, medida: { rondas: f.rondas, gana: f.gana, pm } };
});

caso(5, 'determinismo: mismo p, mismo dibujo; las silabas no mutan', () => {
  if (!S) return falta();
  const antes = J(ORDEN.map((id) => S.frame(id)));
  return { ok: ORDEN.every((id) => J(S.items(id, 0.4)) === J(S.items(id, 0.4))) && antes === J(ORDEN.map((id) => S.frame(id))) };
});

caso(6, 'capas: fondo + frente(p) pinta lo mismo que items(id, p)', () => {
  if (!S) return falta();
  const roto = [];
  ORDEN.forEach((id) => [0, 0.37, 0.99].forEach((p) => { if (J(S.fondo(id).concat(S.frente(id, p))) !== J(S.items(id, p))) roto.push(id + '@' + p); }));
  return { ok: roto.length === 0, medida: roto };
});

caso(7, 'cada capitulo se mueve con el scroll; los medidores de BOUT siguen el registro ronda a ronda', () => {
  if (!S) return falta();
  const quietos = ORDEN.filter((id) => J(S.items(id, 0)) === J(S.items(id, 0.37)));
  const v = (p) => S.pose('BOUT', p).atoms.find((a) => a.k === 'sleep').i[1].v;
  const ok = v(0) === S.HP[0][0] && v(0.999) === S.HP[S.HP.length - 1][0];
  return { ok: quietos.length === 0 && ok, medida: { quietos, inicio: v(0), fin: v(0.999) } };
});

caso(8, 'el dormido: dormido lleva zzz y pantalla negra; despierto, ojos abiertos y pantalla encendida', () => {
  if (!W) return falta();
  W.cast('t', [[1, 24, 24, 0], [-3, 10, 10, 8]]);
  const a = W.WORDS.sleeper({ as: 't', x: 0, y: 0, r: 60, awake: 0 }), b = W.WORDS.sleeper({ as: 't', x: 0, y: 0, r: 60, awake: 1 });
  const pantalla = (o) => o.find((x) => x.o === 'ribbon' && x.closed);
  const zzz = (o) => o.filter((x) => x.s === 'comic yellow.base').length;
  return { ok: pantalla(a).f === 'ink' && pantalla(b).f === 'cyan' && zzz(a) > 0 && zzz(b) === 0, medida: { dormido: pantalla(a).f, despierto: pantalla(b).f } };
});

caso(9, 'pieles: «apocalypse» viste las tropas del Codex de dormidos; la desconocida vuelve a atlantis', () => {
  if (!W) return falta();
  const C = req(ruta('../public/assets/codex_scene.js'));
  const tipos = () => C.pose('ARMY', 0.2).atoms.find((a) => a.k === 'waves').i.map((i) => i.o);
  W.useSkin('apocalypse'); const ap = tipos();
  const raro = W.useSkin('nope'); const at = tipos();
  return { ok: ap.every((t) => t === 'sleeper') && at.every((t) => t === 'troop') && raro === 'atlantis', medida: { ap, at } };
});

caso(10, 'PEGI 3: los dormidos no son monstruos; ni textos ni silabas usan palabras vetadas', () => {
  if (!S) return falta();
  const t = [];
  ['kids', 'tech'].forEach((m) => ORDEN.forEach((id) => { const x = S.TEXT[m][id]; t.push(x.h, x.sound, ...x.p); }));
  ORDEN.forEach((id) => S.frame(id).atoms.forEach((a) => t.push(a.r)));
  const malas = VETADAS.filter((w) => t.some((x) => new RegExp('\\b' + w + '\\b', 'i').test(x)));
  return { ok: malas.length === 0, medida: malas };
});

caso(11, 'pureza: sin DOM, reloj, azar, red, almacen ni colores; bubble_game sin comentarios', () => {
  if (!S) return falta();
  const f1 = readFileSync(ESCENA, 'utf8'), f2 = readFileSync(JUEGO, 'utf8'), malos = [];
  [[f1, 'escena'], [f2, 'palabras']].forEach(([f, n]) => {
    ['document', 'Date', 'Math.random', 'fetch', 'localStorage', 'setTimeout', 'requestAnimationFrame'].forEach((p) => { if (f.includes(p)) malos.push(n + ':' + p); });
    if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(f)) malos.push(n + ':color');
  });
  if (/\/\*|(^|[^:'])\/\//m.test(f1 + f2)) malos.push('comentario');
  return { ok: malos.length === 0, medida: malos };
});

caso(12, 'cada capitulo compila sin notas (compile.notes)', () => {
  if (!S) return falta();
  const notas = {};
  ORDEN.forEach((id) => { S.items(id, 0.5); const n = A.compile.notes || []; if (n.length) notas[id] = n.slice(0, 2); });
  return { ok: Object.keys(notas).length === 0, medida: notas };
});

const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
