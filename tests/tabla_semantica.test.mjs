import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';
import AtlasSemantica from '../public/game/tabla_semantica.js';
import AtlasToon from '../public/game/crab_render_hd.js';

const src = readFileSync(new URL('../public/game/tabla_semantica.js', import.meta.url), 'utf8');
const MEDIDA = { LIVE: 120, PROPUESTA: 45, FIRMADO: 270, ERROR: 0, NO_DATA: 240, SIMULATED: 30, STALE: 60 };

test('TABLA CONGELADA: los 7 sellos medidos, ni uno más ni uno menos', () => {
  const claves = Object.keys(AtlasSemantica.TABLA).sort();
  const esperadas = Object.keys(MEDIDA).sort();
  if (JSON.stringify(claves) !== JSON.stringify(esperadas)) throw new Error('tabla diverge: ' + claves);
  for (const k of claves) {
    if (AtlasSemantica.TABLA[k] !== MEDIDA[k]) throw new Error('hue medido cambiado: ' + k + ' → ' + AtlasSemantica.TABLA[k]);
  }
});

test('CONSOLIDACIÓN (F305): una sola fuente física — crab_render_hd lee de la tabla y coincide', () => {
  for (const k of Object.keys(MEDIDA)) {
    if (AtlasToon.SELLOS[k] !== MEDIDA[k]) throw new Error('crab_render_hd no lee de la fuente única: ' + k);
  }
  if (/var SELLOS = \{ LIVE: 120/.test(src.replace(/^[^]*\/\*/, '') + '')) throw new Error('tabla duplicada');
  const crabSrc = readFileSync(new URL('../public/game/crab_render_hd.js', import.meta.url), 'utf8');
  if (/var SELLOS = \{ LIVE: 120/.test(crabSrc)) throw new Error('F305: la tabla sigue duplicada en crab_render_hd.js');
});

test('DERIVADOS del spec, por sello: flujo/pulso/escala/feedback; NO_DATA = silencio visual', () => {
  const d = AtlasSemantica.de('LIVE');
  if (d.hue !== 120 || d.escala !== 1.0 || d.feedback !== 'flow') throw new Error('derivados LIVE rotos: ' + JSON.stringify(d));
  const nd = AtlasSemantica.de('NO_DATA');
  if (nd.flujo !== 0 || nd.pulso_hz !== 0 || nd.feedback !== 'silent-field') {
    throw new Error('NO_DATA debe ser campo detenido: ' + JSON.stringify(nd));
  }
  const fir = AtlasSemantica.de('FIRMADO');
  if (fir.escala <= 1 || fir.feedback !== 'bloom') throw new Error('FIRMADO debe expandir/florecer: ' + JSON.stringify(fir));
});

test('sello desconocido = null: no se inventa NI color NI derivado (tabla congelada)', () => {
  if (AtlasSemantica.de('INVENTADO') !== null) throw new Error('se inventó un sello');
  if (AtlasSemantica.hueDe('OTRO') !== null) throw new Error('se inventó un hue');
});

test('W2: el color nunca es el único canal — cada derivado lleva su sello textual', () => {
  const d = AtlasSemantica.de('ERROR');
  if (d.sello !== 'ERROR') throw new Error('sin etiqueta textual del sello');
  if (typeof d.feedback !== 'string' || !d.feedback.length) throw new Error('sin feedback legible');
});

test('determinista (gate maestro): mismo sello = mismos derivados, llamada a llamada', () => {
  const a = JSON.stringify(AtlasSemantica.de('STALE'));
  const b = JSON.stringify(AtlasSemantica.de('STALE'));
  if (a !== b) throw new Error('derivados no deterministas');
});

test('pieza <16 KiB, vanilla, cero red, cero assets', () => {
  if (statSync(new URL('../public/game/tabla_semantica.js', import.meta.url)).size > 16384) throw new Error('pieza demasiado grande');
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource|\.mp3|\.png|\.jpg/.test(src)) throw new Error('red o assets en la pieza');
});

test('SABOTAJE: tabla corrupta = suite ROJA (como en la (c))', () => {
  const original = Object.assign({}, AtlasSemantica.TABLA);
  try { AtlasSemantica.TABLA.LIVE = 999; } catch (e) { /* congelada: perfecto */ }
  if (AtlasSemantica.TABLA.LIVE !== MEDIDA.LIVE) {
    throw new Error('SABOTAJE DETECTADO: la tabla se dejó corromper (LIVE=' + AtlasSemantica.TABLA.LIVE + ')');
  }
});
