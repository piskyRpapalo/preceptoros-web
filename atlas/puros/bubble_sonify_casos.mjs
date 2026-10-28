// Casos del núcleo puro de sonificación de burbujas (NORTE 8 · mandato 3, rebanada 1).
// El test de deriva lee public/game/core.js: si la escala del juego cambia, este núcleo tiene que cambiar con ella.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const S = require('./bubble_sonify.js');
const AQUI = fileURLToPath(new URL('.', import.meta.url));
const CORE = fileURLToPath(new URL('../../public/game/core.js', import.meta.url));

// Extrae del texto de core.js el portador y PENTA_V, y calcula sus frecuencias con SU fórmula literal.
function escalaDeCore(texto) {
  const portador = texto.match(/Math\.round\((\d+) \* Math\.pow\(2, \(PENTA_V\[g % 5\] \+ 12 \* Math\.floor\(g \/ 5\)\) \/ 12\)\)/);
  const penta = texto.match(/var PENTA_V = \[([0-9, ]+)\];/);
  if (!portador || !penta) { return null; }
  const pv = penta[1].split(',').map((x) => Number(x.trim()));
  return { portador: Number(portador[1]), pv, hz: (g) => Math.round(Number(portador[1]) * Math.pow(2, (pv[g % 5] + 12 * Math.floor(g / 5)) / 12)) };
}

// Devuelve las diferencias entre el núcleo y core.js para los grados 0..14. Vacío = sin deriva.
function deriva(texto) {
  const c = escalaDeCore(texto);
  if (!c) { return ['core.js ya no tiene la fórmula de la escala (PENTA_V o el portador)']; }
  const r = [];
  if (JSON.stringify(c.pv) !== JSON.stringify(S.PENTA_V)) { r.push('PENTA_V distinto'); }
  if (c.portador !== S.PORTADOR_HZ) { r.push('portador distinto: core ' + c.portador + ' vs ' + S.PORTADOR_HZ); }
  for (let g = 0; g <= 14; g++) { if (c.hz(g) !== S.hzDeGrado(g)) { r.push('grado ' + g + ': core ' + c.hz(g) + ' vs ' + S.hzDeGrado(g)); } }
  return r;
}

const MARCO = { v: 'preceptoros.bubble/1', atoms: [{ k: 'bubble' }, { k: 'sea' }, { k: 'title' }] };

test('deriva: la escala del núcleo es la de core.js (grados 0-14)', () => {
  assert.deepEqual(deriva(readFileSync(CORE, 'utf8')), []);
});

test('sabotaje: cambiar el portador de core.js (110 → 111) tiene que dar deriva', () => {
  const mutado = readFileSync(CORE, 'utf8').replace('Math.round(110 * Math.pow(2', 'Math.round(111 * Math.pow(2');
  assert.notEqual(mutado, readFileSync(CORE, 'utf8'), 'el sabotaje no cambió nada: el test no prueba nada');
  assert.ok(deriva(mutado).length > 0, 'un portador distinto debe caer en la deriva');
});

test('sabotaje: cambiar PENTA_V en core.js tiene que dar deriva', () => {
  const mutado = readFileSync(CORE, 'utf8').replace('var PENTA_V = [0, 2, 4, 7, 9];', 'var PENTA_V = [0, 2, 4, 7, 11];');
  assert.ok(deriva(mutado).length > 0);
});

test('hzDeGrado: el portador es 110 Hz y una octava son 220 Hz', () => {
  assert.equal(S.hzDeGrado(0), 110);
  assert.equal(S.hzDeGrado(5), 220);
});

test('determinismo: el mismo fotograma da siempre las mismas notas', () => {
  assert.deepEqual(S.sonifica(MARCO), S.sonifica(MARCO));
});

test('orden temporal: cada átomo suena en su paso, en orden', () => {
  const r = S.sonifica(MARCO);
  assert.equal(r.ok, true);
  assert.deepEqual(r.notas.map((n) => n.at_ms), [0, 180, 360]);
  assert.equal(r.total_ms, 360 + 150);
});

test('fallo cerrado: un átomo de clase desconocida no suena nada inventado', () => {
  const r = S.sonifica({ atoms: [{ k: 'bubble' }, { k: 'dragon' }] });
  assert.equal(r.ok, false);
  assert.match(r.causa, /dragon/);
});

test('fallo cerrado: sin átomos no hay sonido', () => {
  assert.equal(S.sonifica({ atoms: [] }).ok, false);
  assert.equal(S.sonifica(null).ok, false);
});

test('el núcleo cabe en 16 KiB, sin azar, sin reloj y sin red', () => {
  const ruta = AQUI + 'bubble_sonify.js';
  const texto = readFileSync(ruta, 'utf8');
  assert.ok(statSync(ruta).size <= 16384, 'el núcleo pasa de 16 KiB');
  const codigo = texto.replace(/\/\/[^\n]*/g, '');   // solo el código: la prosa del comentario no cuenta
  assert.ok(!/Math\.random|Date\.|fetch\(|XMLHttp|WebSocket/.test(codigo), 'el núcleo usa azar, reloj o red');
});
