// Motor 3.5D (= 2.5D + tiempo + elasticidad), sólo render (ley P5): el suelo horneado en bitmap por chunk con su caché
// (acierto e invalidación por zoom, ángulo y dpr), los edificios que respiran (deterministas, cero en movimiento
// reducido), las burbujas con volumen (ease elástico, retardo, colores de la casa) y la bruma de datos en el borde.
// Uso: node --test atlas/motor_35d_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
globalThis.AtlasComicTokens = req('../public/game/comic_tokens.js');
globalThis.AtlasPaletteCycle = req('../public/game/palette_cycle.js');
const M = req('../public/game/map_painter.js');
globalThis.AtlasMapPainter = M;
const CP = req('../public/game/colonia_pagina.js');
const H = req('../public/game/hitl_walkers.js');
const dir = new URL('../public/map/chunks/', import.meta.url);
const chunks = Object.fromEntries(readdirSync(dir).map((f) => { const c = JSON.parse(readFileSync(new URL(f, dir), 'utf8')); return [c.c.join('_'), c]; }));

const ctx = (ops, w = 390, h = 240) => new Proxy({ canvas: { width: w, height: h } }, { get: (o, k) => k in o ? o[k] : (...a) => { ops.push(k); }, set: (o, k, v) => { o[k] = v; return true; } });
const env = (extra = {}) => { const made = []; return { made, make: (w, h) => { made.push([w, h]); return { width: w, height: h, getContext: () => ctx([], w, h) }; }, angle: 0, dpr: 1, ...extra }; };
const world = () => ({ cells: M.cellsOf(chunks) });

test('horneado: un bitmap por chunk la primera vez; el segundo cuadro sólo acierta y blitea', () => {
  M.resetCache(); const w = world(), e = env(), ops = [];
  M.floorBaked(ctx(ops), { cx: 195, cy: 120, k: 0.6 }, w, 0, false, e);
  assert.equal(e.made.length, 14, 'siete chunks, día y noche: catorce hornadas');
  const ops2 = []; M.floorBaked(ctx(ops2), { cx: 195, cy: 120, k: 0.6 }, w, 0, false, e);
  assert.equal(e.made.length, 14, 'sin re-hornear');
  assert.ok(M.cacheStats().hits >= 7);
  const prismas = []; M.floor(ctx(prismas), { cx: 195, cy: 120, k: 0.6 }, w, 0, false);
  assert.ok(ops2.length * 3 < prismas.length, 'el cuadro horneado pinta mucho menos que el vivo: ' + ops2.length + ' vs ' + prismas.length);
  assert.ok(ops2.filter((o) => o === 'drawImage').length >= 1);
});

test('invalidación: cambiar zoom, ángulo o dpr re-hornea; el mismo cubo de zoom no', () => {
  M.resetCache(); const w = world(), e = env();
  const G = { cx: 195, cy: 120, k: 0.6 };
  M.floorBaked(ctx([]), G, w, 0, false, e); const n0 = e.made.length;
  M.floorBaked(ctx([]), { ...G, k: 0.6 + 1 / 1000 }, w, 0, false, e); assert.equal(e.made.length, n0, 'mismo cubo de zoom');
  M.floorBaked(ctx([]), { ...G, k: 0.75 }, w, 0, false, e); assert.equal(e.made.length, n0 + 14, 'zoom');
  e.angle = 60; M.floorBaked(ctx([]), { ...G, k: 0.75 }, w, 0, false, e); assert.equal(e.made.length, n0 + 28, 'ángulo');
  e.dpr = 2; M.floorBaked(ctx([]), { ...G, k: 0.75 }, w, 0, false, e); assert.equal(e.made.length, n0 + 42, 'dpr');
  assert.match(M.cacheStats().scope, /\|60\|2$/);
});

test('edificios que respiran: deterministas por id, ≥ 0, más altos con hover, cero en movimiento reducido', () => {
  const a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => CP.breathe('b-cabin', t, false, false));
  assert.deepEqual(a, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => CP.breathe('b-cabin', t, false, false)));
  assert.ok(a.every((y) => y >= 0 && y <= CP.BREATH.a) && new Set(a).size > 3, 'se mueve: ' + a);
  assert.notDeepEqual(a, a.map((_, t) => CP.breathe('b-ring-e', t, false, false)), 'fase propia por id');
  assert.ok(Math.max(...a.map((_, t) => CP.breathe('b-cabin', t, false, true))) > CP.BREATH.a, 'hover sube la amplitud');
  assert.ok(a.every((_, t) => CP.breathe('b-cabin', t, true, true) === 0), 'reducido: quieto');
});

test('burbujas con volumen: ease elástico que asienta en 1, retardo que converge, sin nada en reducido', () => {
  assert.equal(H.appearScale(0, false), 0); assert.equal(H.appearScale(H.EASE_FRAMES, false), 1);
  assert.ok([...Array(H.EASE_FRAMES).keys()].some((n) => H.appearScale(n, false) > 1), 'rebasa: es elástico');
  assert.equal(H.appearScale(0, true), 1, 'reducido: sin ease');
  let p = { x: 0, y: 0 }; for (let i = 0; i < 30; i++) { p = H.follow(p, { x: 100, y: 50 }, false); }
  assert.ok(Math.abs(p.x - 100) < 0.01 && H.follow({ x: 0, y: 0 }, { x: 100, y: 50 }, false).x < 100, 'retardo leve que llega');
  assert.deepEqual(H.follow({ x: 0, y: 0 }, { x: 100, y: 50 }, true), { x: 100, y: 50 });
  const st = H.sphereStops(globalThis.AtlasComicTokens, M);
  assert.ok(st.length === 3 && st.every((c) => /^#[0-9a-f]{6}$/.test(c)), 'stops calculados desde los tokens: ' + st);
});

test('bruma de datos: determinista por tick, sube y se apaga; quieta en reducido; nunca toca qué se revela', () => {
  const c = chunks['0_0'].cells.find((x) => M.hazeAt(x, 0, false));
  assert.deepEqual(M.hazeAt(c, 5, false), M.hazeAt(c, 5, false));
  const r = [...Array(12).keys()].map((t) => M.hazeAt(c, t, false).rise); assert.ok(new Set(r).size === 12, 'sube con el tick');
  assert.deepEqual(M.hazeAt(c, 3, true), M.hazeAt(c, 99, true)); assert.equal(M.hazeAt(c, 3, true).rise, 0);
  const w = world(), antes = JSON.stringify(w.cells.list); M.resetCache(); M.floorBaked(ctx([]), { cx: 195, cy: 120, k: 0.6 }, w, 7, false, env());
  assert.equal(JSON.stringify(w.cells.list), antes, 'el render no muta el mundo');
  assert.ok(w.edge.length > 0 && w.edge.length < w.cells.list.length);
});

test('sin azar ni reloj ni colores crudos en las piezas tocadas', () => {
  for (const f of ['map_painter.js', 'hitl_walkers.js', 'colonia_pagina.js']) {
    const src = readFileSync(new URL('../public/game/' + f, import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/Math\.random|Date\.now|new Date|performance\.now/.test(src), f);
    assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(src), f + ': color crudo');
  }
});
