// atlas/codex_casos.mjs · V9: la estructura basica del juego en la lengua de burbuja (FIRMO 2026-10-18, ronda 346-347).
// Uso: node atlas/codex_casos.mjs · rc 0 solo si todos los casos pasan. Node 22, ESM, sin dependencias.
// Cinco capitulos (REFUGE, SUMMON, ARMY, BATTLE, RIFT) dibujados con datos REALES de la gacha (semillas fijas, tc3).
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { checkFrame } from './param_gate.mjs';

const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const ESCENA = ruta('../public/assets/codex_scene.js'), JUEGO = ruta('../public/game/bubble_game.js');
const ORDEN = ['REFUGE', 'SUMMON', 'ARMY', 'BATTLE', 'RIFT'];
// PEGI 3. 'magic' NO se veta aqui: «Magic» es el nombre canonico de la rareza en el juego (atlas-en.json, rar_magico).
const VETADAS = ['death', 'dead', 'die', 'fire', 'burn', 'monster', 'teeth', 'scream', 'blood', 'kill', 'fear',
  'skull', 'fang', 'knife', 'oracle', 'notary', 'token', 'currency', 'clearing', 'casino', 'jackpot', 'bet'];
const casos = [];
const caso = (n, nombre, prueba) => {
  let r;
  try { r = prueba(); } catch (e) { r = { ok: false, medida: 'error: ' + e.message }; }
  casos.push({ caso: n, nombre, ok: r.ok === true, medida: r.medida });
};
const J = (x) => JSON.stringify(x);

let S = null, G = null, A = null, W = null, causa = null;
if (existsSync(ESCENA) && existsSync(JUEGO)) {
  try {
    for (const m of ['bubble_light', 'bubble_bestiary', 'bubble_world', 'bubble_letters']) req(ruta('../public/game/' + m + '.js'));
    A = req(ruta('../public/game/bubble_language.js'));
    globalThis.AtlasBubble = A;
    W = req(JUEGO);
    G = req(ruta('../public/game/gacha.js'));
    S = req(ESCENA);
  } catch (e) { causa = 'no carga: ' + e.message; }
} else { causa = 'falta codex_scene.js o bubble_game.js'; }
const falta = () => ({ ok: false, medida: 'NO_DATA: ' + causa });

caso(1, 'cinco capitulos en orden y lienzo 412x515', () => {
  if (!S) return falta();
  return { ok: J(S.SECTIONS) === J(ORDEN) && S.CANVAS.w === 412 && S.CANVAS.h === 515 };
});

caso(2, 'cada silaba pasa checkFrame (< 1.024 B, bandas nombradas)', () => {
  if (!S) return falta();
  const bytes = {};
  const ok = ORDEN.every((id) => { const r = checkFrame(S.frame(id)); bytes[id] = r.bytes; return r.ok; });
  return { ok, medida: bytes };
});

caso(3, 'datos reales: cada tropa es tirada(semilla, tc3) con su rareza; las odds son odds(tc3)', () => {
  if (!S) return falta();
  const bien = ['normal', 'magico', 'raro', 'unico'].every((k) => S.TROOPS[k].rareza === k
    && J(S.TROOPS[k]) === J(G.tirada(S.TROOPS[k].semilla, 'tc3')));
  return { ok: bien && J(S.ODDS) === J(G.odds('tc3')), medida: S.ODDS };
});

caso(4, 'el texto dice las mismas probabilidades que la tabla (suerte honesta)', () => {
  if (!S) return falta();
  const total = S.ODDS.reduce((a, b) => a + b, 0);
  const pc = S.ODDS.map((v) => String(Math.round(v / total * 1000) / 10).replace(/\.0$/, '') + ' %');
  const txt = S.TEXT.tech.SUMMON.p.join(' ');
  const faltan = pc.filter((x) => !txt.includes(x));
  return { ok: faltan.length === 0, medida: { pc, faltan } };
});

caso(5, 'determinismo: mismo p, mismo dibujo; las silabas no mutan', () => {
  if (!S) return falta();
  const antes = J(ORDEN.map((id) => S.frame(id)));
  const dos = ORDEN.every((id) => J(S.items(id, 0.4)) === J(S.items(id, 0.4)));
  return { ok: dos && antes === J(ORDEN.map((id) => S.frame(id))) };
});

caso(6, 'capas: fondo + frente(p) pinta lo mismo que items(id, p)', () => {
  if (!S) return falta();
  const roto = [];
  ORDEN.forEach((id) => [0, 0.37, 0.99].forEach((p) => { if (J(S.fondo(id).concat(S.frente(id, p))) !== J(S.items(id, p))) roto.push(id + '@' + p); }));
  return { ok: roto.length === 0, medida: roto };
});

caso(7, 'cada capitulo se mueve con el scroll', () => {
  if (!S) return falta();
  const quietos = ORDEN.filter((id) => J(S.items(id, 0)) === J(S.items(id, 0.37)));
  return { ok: quietos.length === 0, medida: quietos };
});

caso(8, 'el huevo se vuelve la onda: p=0 es mezcla(HUEVO, onda, 0), p=1 la onda; sin p, la onda (reduced motion)', () => {
  if (!S) return falta();
  const huevo = (p) => S.pose('SUMMON', p).atoms.find((a) => a.k === 'egg').i[0].arm;
  const onda = S.TROOPS.unico.armonicos;
  const r2 = (a) => a.map((h) => h.map((v) => Math.round(v * 100) / 100));
  const quieto = S.pose('SUMMON').atoms.find((a) => a.k === 'egg').i[0];
  const ok = J(huevo(0)) === J(r2(G.mezcla(G.HUEVO, onda, 0))) && J(huevo(1)) === J(r2(G.mezcla(G.HUEVO, onda, 1)))
    && quieto.as === 'unico' && quieto.from === undefined && quieto.arm === undefined;
  return { ok, medida: { p0: huevo(0).length, p1: huevo(1).length } };
});

caso(9, 'pureza: escena y palabras sin DOM, reloj, azar, red, almacen ni colores; bubble_game sin comentarios (D1)', () => {
  if (!S) return falta();
  const f1 = readFileSync(ESCENA, 'utf8'), f2 = readFileSync(JUEGO, 'utf8');
  const malos = [];
  [[f1, 'escena'], [f2, 'palabras']].forEach(([f, n]) => {
    ['document', 'Date', 'Math.random', 'fetch', 'localStorage', 'setTimeout', 'requestAnimationFrame'].forEach((p) => { if (f.includes(p)) malos.push(n + ':' + p); });
    if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(f)) malos.push(n + ':color');
  });
  if (/\/\*|(^|[^:'])\/\//m.test(f2)) malos.push('palabras:comentario');
  return { ok: malos.length === 0, medida: malos };
});

caso(10, 'PEGI 3: ni en los textos ni en las silabas hay palabras vetadas', () => {
  if (!S) return falta();
  const t = [];
  ['kids', 'tech'].forEach((m) => ORDEN.forEach((id) => { const x = S.TEXT[m][id]; t.push(x.h, x.sound, ...x.p); }));
  ORDEN.forEach((id) => S.frame(id).atoms.forEach((a) => t.push(a.r)));
  const malas = VETADAS.filter((w) => t.some((x) => new RegExp('\\b' + w + '\\b', 'i').test(x)));
  return { ok: malas.length === 0, medida: malas };
});

caso(11, 'palabras: meter llena en proporcion; odds parte la barra en proporcion; clash dibuja n lineas', () => {
  if (!W) return falta();
  const m = W.WORDS.meter({ x: 0, y: 0, w: 120, v: 25, max: 50 });
  const llenos = m.filter((o) => o.o === 'wave' && o.f).length, todos = m.filter((o) => o.o === 'wave').length;
  // Suerte honesta: 100 puntos, uno por cada 1 % (resto mayor), y la leyenda con la cifra exacta.
  const o = W.WORDS.odds({ x: 0, y: 0, w: 400, chances: [625, 265, 80, 30], bands: ['paper', 'cyan', 'ink', 'ocean'] }).filter((x) => x.o === 'wave');
  const cuenta = (b) => o.slice(0, 100).filter((d) => d.f === b).length;
  const prop = o.length === 104 && J(['paper', 'cyan', 'ink', 'ocean'].map(cuenta)) === J([63, 26, 8, 3]);
  const c = W.WORDS.clash({ a: [0, 0], b: [100, 0], n: 4 }).filter((x) => x.o === 'ribbon').length;
  return { ok: llenos === todos / 2 && prop && c === 4, medida: { llenos, todos, prop, c } };
});

caso(12, 'el dibujo solo pinta literales de banda', () => {
  if (!S) return falta();
  const K = req(ruta('../public/game/comic_tokens.js')), C = req(ruta('../public/game/comic_accents.js')), T = req(ruta('../public/game/tabla_semantica.js'));
  const ok = new Set(Object.values(K.NEUTRAL));
  Object.values(C.ACCENTS).forEach((a) => Object.values(a.bands).forEach((v) => ok.add(v)));
  Object.keys(T.TABLA).forEach((k) => Object.values(T.bandas(T.TABLA[k], T.SAT, T.LUZ)).forEach((v) => ok.add(v)));
  const fuera = [];
  const mira = (xs) => xs.forEach((it) => {
    ['fill', 'stroke', 'shadowFill'].forEach((k) => { if (it[k] != null && !ok.has(it[k])) fuera.push(String(it[k])); });
    if (it.items) mira(it.items);
  });
  ORDEN.forEach((id) => mira(S.items(id, 0.5)));
  return { ok: fuera.length === 0, medida: [...new Set(fuera)].slice(0, 5) };
});

caso(13, 'sabotaje: un color crudo en meter hace lanzar a compile', () => {
  if (!A || !W) return falta();
  const f = { v: 'preceptoros.bubble/1', id: 'S', t: 0, bands: ['paper'], change: ['x'], sound: 'NO_DATA', soundCause: 'x', motion: 'NO_DATA',
    atoms: [{ k: 'x', r: 'x', i: [{ o: 'meter', x: 0, y: 0, w: 60, v: 1, max: 1, f: '#123456' }] }] };
  try { A.compile(f); return { ok: false, medida: 'no lanzo' }; } catch (e) { return { ok: /unknown band/.test(e.message), medida: e.message }; }
});

caso(14, 'cada capitulo compila sin notas (ninguna palabra desconocida ni parametro pisado)', () => {
  if (!S) return falta();
  const notas = {};
  // Las notas viven en compile.notes (propiedad de la funcion), no en el array devuelto.
  ORDEN.forEach((id) => { S.items(id, 0.5); const n = A.compile.notes || []; if (n.length) notas[id] = n.slice(0, 2); });
  const odds = S.frame('SUMMON').atoms.find((a) => a.k === 'odds').i[0];
  return { ok: Object.keys(notas).length === 0 && odds.o === 'odds', medida: notas };
});

const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
