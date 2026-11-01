// La Arena del Laboratorio (public/game/bench_lab.js). Uso: node --test atlas/arena_lab_casos.mjs
// Altura monótona en tok/s; NO_DATA cuando falta una medida o su máquina; marcos < 1.024 B; celdas de suelo horneado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const A = require('../public/game/bench_lab.js');
const F = require('../public/game/state_frames.js');
const C = require('../public/game/building_chat.js');
const fichero = JSON.parse(readFileSync(new URL('../public/cerebros.json', import.meta.url), 'utf8'));

test('la altura es monótona en la velocidad de generación medida', () => {
  let prev = -1;
  for (let g = 0.5; g < 200; g += 0.5) { const h = A.height(g); assert.ok(h > prev, 'altura no crece en ' + g); prev = h; }
  const bs = A.buildings(fichero).sort((a, b) => a.ms.gen - b.ms.gen);
  for (let i = 1; i < bs.length; i++) { assert.ok(A.shape(bs[i].ms).h >= A.shape(bs[i - 1].ms).h, bs[i].ms.id); }
  assert.ok(A.width(2) > A.width(1) && A.halo(2) > A.halo(1));
});

test('NO_DATA cuando falta la medida o la máquina, con su causa', () => {
  const m = { ...fichero.cerebros[0], generacion: null };
  const ms = A.measure(m, fichero);
  assert.equal(A.shape(ms).h, null);
  assert.equal(A.frame(ms, 0).seal, 'NO_DATA');
  assert.match(A.frame(ms, 0).atoms[0].r, /NO_DATA: generation speed not measured/);
  const sinMaquina = A.measure(fichero.cerebros[0], { ...fichero, backend: undefined });
  assert.deepEqual(A.shape(sinMaquina), { h: null, w: null, a: null });
  assert.match(A.frame(sinMaquina, 0).atoms[0].r, /names no machine/);
  assert.match(A.bars(10, null, 'model_not_installed')[1], /NO_DATA · model_not_installed/);
  for (const b of A.buildings(fichero)) { assert.equal(b.ms.missing.length, 0, b.ms.id); }
});

test('cada marco y cada línea de chat < 1.024 B y válidos', () => {
  const casos = A.buildings(fichero).map((b) => b.ms);
  casos.push(A.measure({ id: 'x', modelo: 'qwen3-coder:30b' }, { ...fichero, backend: '' }));
  for (const ms of casos) {
    const f = A.frame(ms, 0);
    assert.deepEqual(F.valida(f), [], ms.id);
    assert.ok(Buffer.byteLength(JSON.stringify(f), 'utf8') < 1024, ms.id);
    assert.match(f.atoms[0].r, /cerebros\.json/);
    const b = { id: 'lab-' + ms.id, node: 'lab-' + ms.id, lab: A.script(ms, fichero) };
    assert.equal(C.kindOf(b), 'lab');
    for (const m of [...C.opening(b), C.reply(b, 'status', null)]) {
      assert.deepEqual(F.valida(m), []);
      assert.ok(Buffer.byteLength(JSON.stringify(m), 'utf8') < 1024);
    }
  }
});

test('las celdas son suelo en el chunk horneado 0_0, sin repetir', () => {
  const dir = new URL('../public/map/chunks/', import.meta.url);
  const n = readdirSync(dir).find((x) => x.startsWith('0_0.'));
  const at = new Map(JSON.parse(readFileSync(new URL(n, dir), 'utf8')).cells.map((c) => [c[0] + ',' + c[1], c[3]]));
  assert.equal(new Set(A.CELLS.map(String)).size, A.CELLS.length);
  for (const c of A.CELLS) { assert.equal(at.get(c.join(',')), 'floor', c.join(',')); }
  assert.ok(A.buildings(fichero).length === fichero.cerebros.length);
});

test('determinismo: sin Math.random ni Date; sin la palabra prohibida en lo servido', () => {
  assert.deepEqual(A.buildings(fichero), A.buildings(fichero));
  const src = readFileSync(new URL('../public/game/bench_lab.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|Date\b/.test(src));
  assert.ok(!/\b(token|tokens|moneda)\b/i.test(src));
  assert.ok(!/https?:\/\//.test(src));
});
