// atlas/lexical_projector_casos.mjs · V1: el modelo léxico lee la pantalla (FIRMO 2026-10-20, Plan Mode B).
// Uso: node atlas/lexical_projector_casos.mjs · rc 0 solo si todos los casos pasan. Node 22, ESM, sin dependencias.
// Prueba central: un paquete léxico < 1.024 B describe la escena mejor que un píxel para un mini-modelo.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const J = (x) => JSON.stringify(x);
const casos = [];
const caso = (n, nombre, prueba) => {
  let r;
  try { r = prueba(); } catch (e) { r = { ok: false, medida: 'error: ' + e.message }; }
  casos.push({ caso: n, nombre, ok: r.ok === true, medida: r.medida });
};
const ESCENA = ruta('../public/assets/codex_scene.js');
const PROY = ruta('../public/game/lexical_projector.js');
let S = null, L = null, causa = null;
if (existsSync(ESCENA) && existsSync(PROY)) {
  try { S = req(ESCENA); L = req(PROY); } catch (e) { causa = 'no carga: ' + e.message; }
} else { causa = 'falta codex_scene.js o lexical_projector.js'; }
const falta = () => ({ ok: false, medida: 'NO_DATA: ' + causa });

caso(1, 'existe, <= 16.384 B, sin comentarios, puro stdlib, sin literales de color', () => {
  if (!L) return falta();
  const src = readFileSync(PROY, 'utf8');
  const bytes = Buffer.byteLength(src, 'utf8');
  const comentarios = /\/\/|\/\*/.test(src);
  const impuro = /document|Date|Math\.random|performance|fetch|localStorage/.test(src.replace(/\/\/[^\n]*/g, ''));
  const colores = /#[0-9a-fA-F]{3,8}\b/.test(src);
  return { ok: bytes <= 16384 && !comentarios && !impuro && !colores,
    medida: { bytes, comentarios, impuro, colores } };
});

caso(2, 'los 6 capítulos proyectan a LIVE y cada paquete < 1.024 B', () => {
  if (!S || !L) return falta();
  const res = {};
  const ok = S.SECTIONS.every((id) => {
    const r = L.proyectarEscena(S, id, { ciclo: 7, st: 'MEASURED', modo: 'tech' });
    res[id] = r.bytes;
    return r.st === 'LIVE' && r.bytes < 1024;
  });
  return { ok, medida: res };
});

caso(3, 'el paquete lleva el sonido de la escena (el lenguaje se escucha)', () => {
  if (!S || !L) return falta();
  const r = L.proyectarEscena(S, 'ARMY', { ciclo: 7, st: 'MEASURED', modo: 'tech' });
  return { ok: r.st === 'LIVE' && r.p.sound === 'four soft notes', medida: r.p && r.p.sound };
});

caso(4, 'el paquete lleva el ciclo de juego (el ciclo ES el tiempo)', () => {
  if (!S || !L) return falta();
  const r = L.proyectarEscena(S, 'BATTLE', { ciclo: 1234, st: 'MEASURED' });
  return { ok: r.st === 'LIVE' && r.p.ciclo === 1234, medida: r.p && r.p.ciclo };
});

caso(5, 'los objetos tienen identidad léxica (o, x, y, f, as) legible por máquina', () => {
  if (!S || !L) return falta();
  const r = L.proyectarEscena(S, 'ARMY', { ciclo: 1, st: 'MEASURED' });
  if (r.st !== 'LIVE') return { ok: false, medida: r.causa };
  const tropas = [];
  r.p.a.forEach((atom) => atom.i.forEach((it) => { if (it.o === 'troop') tropas.push(it); }));
  const ok = tropas.length === 4
    && tropas.every((t) => typeof t.x === 'number' && typeof t.y === 'number'
      && typeof t.f === 'string' && typeof t.as === 'string');
  return { ok, medida: { tropas: tropas.length, ejemplo: tropas[0] } };
});

caso(6, 'determinismo: misma escena, mismo paquete byte a byte', () => {
  if (!S || !L) return falta();
  const a = J(L.proyectarEscena(S, 'SUMMON', { ciclo: 9, st: 'MEASURED' }));
  const b = J(L.proyectarEscena(S, 'SUMMON', { ciclo: 9, st: 'MEASURED' }));
  return { ok: a === b, medida: a === b ? 'idéntico' : 'difieren' };
});

caso(7, 'escena inexistente -> NO_DATA con causa, nunca inventa', () => {
  if (!S || !L) return falta();
  const r = L.proyectarEscena(S, 'NO_EXISTE', {});
  return { ok: r.st === 'NO_DATA' && typeof r.causa === 'string', medida: r };
});

caso(8, 'sabotaje: un paquete sobre 1.024 B se declara NO_DATA, nunca se trunca', () => {
  if (!L) return falta();
  const frameGrande = { id: 'X', atoms: [] };
  for (let i = 0; i < 500; i++) {
    frameGrande.atoms.push({ k: 'a' + i, i: [{ o: 'letters', tx: 'x'.repeat(20), x: i, y: i }] });
  }
  const r = L.proyectar(frameGrande, {});
  return { ok: r.st === 'NO_DATA' && /over 1024/.test(r.causa), medida: { st: r.st, causa: r.causa, bytes: r.bytes } };
});

caso(9, 'dos modos de texto (kids/tech) enriquecen el mismo paquete', () => {
  if (!S || !L) return falta();
  const kids = L.proyectarEscena(S, 'REFUGE', { ciclo: 1, st: 'LIVE', modo: 'kids' });
  const tech = L.proyectarEscena(S, 'REFUGE', { ciclo: 1, st: 'LIVE', modo: 'tech' });
  return { ok: kids.p.h !== tech.p.h && kids.p.sound === tech.p.sound,
    medida: { kids: kids.p.h, tech: tech.p.h, sound: kids.p.sound } };
});

let fallos = 0;
for (const c of casos) {
  console.log((c.ok ? 'ok  ' : 'FAIL') + '  caso ' + c.caso + ' · ' + c.nombre + (c.ok ? '' : ' · ' + J(c.medida)));
  if (!c.ok) fallos++;
}
console.log('\n' + (casos.length - fallos) + '/' + casos.length + (fallos ? ' · ROJO' : ' · verde'));
process.exit(fallos ? 1 : 0);
