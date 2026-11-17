// Casos del gate del lexicon (NORTE 8 · mandato 2). Cada caso sabotea a proposito y el gate DEBE caer:
// un gate que no puede ponerse rojo no demuestra nada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { escanea, compara } from './lexicon_gate.mjs';

const LISTA = JSON.stringify({ palabras: ['monta', 'sinredireccion', 'cria'] });
function arbol(archivos, permitidas = [], por_fichero = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'lexicon-'));
  mkdirSync(join(raiz, 'public', 'game'), { recursive: true });
  mkdirSync(join(raiz, 'atlas'), { recursive: true });
  writeFileSync(join(raiz, 'atlas', 'lexicon_es.json'), LISTA);
  writeFileSync(join(raiz, 'atlas', 'lexicon_allowed.json'), JSON.stringify({ palabras: permitidas, por_fichero }));
  for (const [ruta, texto] of Object.entries(archivos)) writeFileSync(join(raiz, 'public', ruta), texto);
  return raiz;
}

test('un fichero limpio no da hallazgos', () => {
  const r = arbol({ 'game/limpio.js': 'export const mount = 1; // english only' });
  try { assert.deepEqual(escanea(r), {}); } finally { rmSync(r, { recursive: true, force: true }); }
});

test('sabotaje: una palabra española nueva en public/ es hallazgo', () => {
  const r = arbol({ 'game/nuevo.js': 'function monta() { return 1; }' });
  try {
    const h = escanea(r);
    assert.deepEqual(h['public/game/nuevo.js'], ['monta']);
    const { nuevos } = compara(h, {});
    assert.equal(nuevos.length, 1, 'con base vacia tiene que haber un hallazgo NUEVO (rojo)');
  } finally { rmSync(r, { recursive: true, force: true }); }
});

test('sabotaje: la forma camelCase tambien cae (sinRedireccion)', () => {
  const r = arbol({ 'game/cc.js': 'const sinRedireccion = true;' });
  try { assert.ok(escanea(r)['public/game/cc.js'].includes('sinredireccion')); } finally { rmSync(r, { recursive: true, force: true }); }
});

test('una URL con una palabra española NO cuenta', () => {
  const r = arbol({ 'game/url.js': "fetch('https://ejemplo.org/monta/cria');" });
  try { assert.deepEqual(escanea(r), {}); } finally { rmSync(r, { recursive: true, force: true }); }
});

test('una excepcion declarada (lista blanca) permite la palabra', () => {
  const r = arbol({ 'game/arte.js': 'const cria = 2;' }, ['cria']);
  try { assert.deepEqual(escanea(r), {}); } finally { rmSync(r, { recursive: true, force: true }); }
});

test('excepciones de protocolo son por ruta exacta: otra copia sigue roja', () => {
  const r = arbol({
    'game/legacy.js': 'const monta = 1;',
    'game/new.js': 'const monta = 1;'
  }, [], { 'public/game/legacy.js': ['monta'] });
  try {
    const found = escanea(r);
    assert.equal(found['public/game/legacy.js'], undefined, 'the scoped legacy exception is honored');
    assert.deepEqual(found['public/game/new.js'], ['monta'], 'same Spanish word in another file is still detected');
    const { nuevos } = compara(found, {});
    assert.equal(nuevos.length, 1, 'global exemption would silently weaken the ratchet');
  } finally { rmSync(r, { recursive: true, force: true }); }
});

test('sabotaje: la base no puede quedar por encima de lo medido (ratchet hacia abajo)', () => {
  const r = arbol({ 'game/limpio.js': 'const x = 1;' });
  try {
    const { resueltos } = compara(escanea(r), { 'public/game/viejo.js': ['monta'] });
    assert.equal(resueltos.length, 1, 'una base que ya no coincide tiene que caer (BAJAR)');
  } finally { rmSync(r, { recursive: true, force: true }); }
});

test('la base real del repo cuadra con lo medido hoy', () => {
  const raizReal = new URL('..', import.meta.url).pathname;
  const base = JSON.parse(JSON.stringify(escanea(raizReal)));
  const { nuevos, resueltos } = compara(escanea(raizReal), base);
  assert.deepEqual([nuevos, resueltos], [[], []]);
});
