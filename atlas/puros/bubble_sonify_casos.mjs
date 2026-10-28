// Casos del sonido nativo del fotograma (NORTE 8 · mandato 3, rebanada 1, rehecha).
// La fuente de verdad es public/game/core.js: el test de deriva EXTRAE su función vozDe y la ejecuta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const S = require('./bubble_sonify.js');
const AQUI = fileURLToPath(new URL('.', import.meta.url));
const CORE = fileURLToPath(new URL('../../public/game/core.js', import.meta.url));

// Extrae la función vozDe de core.js y la compila con su PENTA_V. Si el texto cambia de forma, devuelve null.
function vozDeDeCore(texto) {
  const penta = texto.match(/var PENTA_V = \[([0-9, ]+)\];/);
  const ini = texto.indexOf('function vozDe(t) {');
  if (!penta || ini < 0) { return null; }
  const fin = texto.indexOf('\n  }\n', ini);
  if (fin < 0) { return null; }
  const cuerpo = texto.slice(ini, fin + 5);
  const pv = penta[1].split(',').map((x) => Number(x.trim()));
  return new Function('PENTA_V', 'return (' + cuerpo + ');')(pv);
}

// Tablas de armónicos de prueba: varias formas, incluido el caso de más de 12 armónicos.
const TABLAS = [
  [[1, 40, 10, 0]],
  [[1, 40, 10, 0], [3, 20, 5, 4]],
  [[1, 40, 10, 0], [6, 12, 3, 2], [2, 8, 4, 1], [5, 3, 1, 0]],
  [[1, 40, 10, 0], [14, 22, 9, 3], [2, 5, 2, 1], [4, 7, 0, 6], [9, 2, 1, 0]],
  [[1, 40, 10, 0], [9, 30, 12, 1]],
  [[1, 40, 10, 0], [8, 25, 6, 2]],   // grado 4 de PENTA_V: sin esta tabla el sabotaje de la escala pasa sin verse
];

function deriva(texto) {
  const vozDe = vozDeDeCore(texto);
  if (!vozDe) { return ['core.js ya no tiene vozDe con la forma esperada']; }
  const r = [];
  TABLAS.forEach((t, i) => {
    const fuente = vozDe({ armonicos: t });
    const nuestra = S.receta(t);
    if (JSON.stringify(fuente) !== JSON.stringify(nuestra)) { r.push('tabla ' + i + ': core ' + JSON.stringify(fuente) + ' vs ' + JSON.stringify(nuestra)); }
  });
  return r;
}

const CON_SONIDO = {
  v: 'preceptoros.bubble/1', sound: 'ok',
  atoms: [{ k: 'creature', r: 'a wave creature', i: [{ o: 'wave', x: 100, y: 100, h: [[1, 40, 10, 0], [3, 20, 5, 4]] }] },
          { k: 'rock', r: 'a blob rock', i: [{ o: 'blob', x: 200, y: 200, rx: 60, ry: 40, h: [[1, 30, 8, 0], [6, 12, 3, 2]] }] }]
};

test('deriva: la receta del núcleo es la vozDe de core.js, tabla a tabla', () => {
  assert.deepEqual(deriva(readFileSync(CORE, 'utf8')), []);
});

test('sabotaje: cambiar la modulación de core.js (ax × 8 → ax × 9) tiene que dar deriva', () => {
  const original = readFileSync(CORE, 'utf8');
  const mutado = original.replace('moduladora: Math.round(f * (8 + a1) / 8)', 'moduladora: Math.round(f * (9 + a1) / 8)');
  assert.notEqual(mutado, original, 'el sabotaje no cambió nada: el test no prueba nada');
  assert.ok(deriva(mutado).length > 0, 'una modulación distinta debe caer en la deriva');
});

test('sabotaje: cambiar la escala de core.js (PENTA_V) tiene que dar deriva', () => {
  const mutado = readFileSync(CORE, 'utf8').replace('var PENTA_V = [0, 2, 4, 7, 9];', 'var PENTA_V = [0, 2, 4, 7, 11];');
  assert.ok(deriva(mutado).length > 0);
});

test('sonido nativo: una onda y un blob con armónicos dan dos voces, en orden', () => {
  const r = S.sonifica(CON_SONIDO);
  assert.equal(r.ok, true);
  assert.deepEqual(r.voces.map((v) => v.primitivo), ['wave', 'blob']);
  assert.deepEqual(r.voces.map((v) => v.at_ms), [0, 180]);
  assert.deepEqual(r.voces[0].receta, S.receta([[1, 40, 10, 0], [3, 20, 5, 4]]));
});

test('determinismo: el mismo fotograma da siempre las mismas voces', () => {
  assert.deepEqual(S.sonifica(CON_SONIDO), S.sonifica(CON_SONIDO));
});

test('lo que no suena lo dice con su causa: sound NO_DATA → ok:false, sin voces', () => {
  const r = S.sonifica({ sound: 'NO_DATA: static-first: sound planned, not served', atoms: CON_SONIDO.atoms });
  assert.equal(r.ok, false);
  assert.match(r.causa, /static-first/);
});

test('fallo cerrado: un fotograma sin ondas ni armónicos no suena nada inventado', () => {
  const r = S.sonifica({ sound: 'ok', atoms: [{ k: 'label', r: 'a title', i: [{ o: 'text', tx: 'hola' }] }] });
  assert.equal(r.ok, false);
  assert.match(r.causa, /NO_DATA/);
});

test('fallo cerrado: sin fotograma no hay sonido', () => {
  assert.equal(S.sonifica(null).ok, false);
});

test('el núcleo cabe en 16 KiB, sin azar, sin reloj y sin red', () => {
  const ruta = AQUI + 'bubble_sonify.js';
  const texto = readFileSync(ruta, 'utf8');
  assert.ok(statSync(ruta).size <= 16384, 'el núcleo pasa de 16 KiB');
  const codigo = texto.replace(/\/\/[^\n]*/g, '');   // solo el código: la prosa de los comentarios no cuenta
  assert.ok(!/Math\.random|Date\.|fetch\(|XMLHttp|WebSocket/.test(codigo), 'el núcleo usa azar, reloj o red');
});
