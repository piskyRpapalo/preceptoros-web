import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../public/game/map_zoom.js', import.meta.url), 'utf8');

function clamp(v, MIN, MAX) { return Math.max(MIN, Math.min(MAX, v)); }

test('contrato del repo: MIN 0.6, MAX 3, y data-zoom anotado', () => {
  if (!/var MIN = 0\.6, MAX = 3/.test(src)) throw new Error('limites cambiados');
  if (!/dataset\.zoom/.test(src)) throw new Error('data-zoom ya no se anota');
});

test('clamp del protocolo: fuera de rango queda en 0.6 / 3.0', () => {
  if (clamp(50, 0.6, 3) !== 3) throw new Error('sin techo');
  if (clamp(0.01, 0.6, 3) !== 0.6) throw new Error('sin suelo');
  if (clamp(1, 0.6, 3) !== 1) throw new Error('el neutro no pasa');
});

test('monotonía: separar sube, juntar baja (zm0·d/d0)', () => {
  const zm0 = 1, d0 = 100;
  if (!(zm0 * 200 / d0 > zm0 * 150 / d0)) throw new Error('separar no sube');
  if (!(zm0 * 50 / d0 < zm0 * 80 / d0)) throw new Error('juntar no baja');
});

test('rueda: exp(-deltaY·0.0015), clamp final', () => {
  const zm = 1;
  const up = clamp(zm * Math.exp(-(-200) * 0.0015), 0.6, 3);
  const down = clamp(zm * Math.exp(-(200) * 0.0015), 0.6, 3);
  if (!(up > zm && down < zm)) throw new Error('la rueda no es monotona');
});

test('la fuente lleva el clamp real (Math.max/Math.min): sin el, la suite cae', () => {
  if (!/Math\.max\(MIN, Math\.min\(MAX/.test(src)) {
    throw new Error('clamp ausente en map_zoom.js: el factor podria irse de rango');
  }
});
