import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';
import AtlasTarjetaCantada from '../public/game/tarjeta_cantada.js';
import AtlasToon from '../public/game/crab_render_hd.js';

const src = readFileSync(new URL('../public/game/tarjeta_cantada.js', import.meta.url), 'utf8');

test('W3: Web Audio pura — cero archivos de audio, cero red, pieza <16 KiB', () => {
  if (statSync(new URL('../public/game/tarjeta_cantada.js', import.meta.url)).size > 16384) throw new Error('pieza demasiado grande');
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource|\.mp3|\.ogg|\.wav/.test(src)) throw new Error('red o archivos de audio en la pieza');
});

test('tabla semántica MEDIDA usada, no reinventada: los números viven en AtlasToon.SELLOS', () => {
  const esperada = { LIVE: 120, PROPUESTA: 45, FIRMADO: 270, ERROR: 0, NO_DATA: 240, SIMULATED: 30, STALE: 60 };
  const claves = Object.keys(esperada);
  for (const k of claves) {
    if (AtlasToon.SELLOS[k] !== esperada[k]) throw new Error('SELLOS diverge de la tabla medida: ' + k);
  }
  if (!/SELLOS/.test(src)) throw new Error('la pieza no usa la tabla semántica');
});

test('W1: FNV-1a determinista → base 220–660 Hz; mismo id = misma frecuencia', () => {
  const a = AtlasTarjetaCantada.frecuenciaBase('nodo.0.hexelion');
  const b = AtlasTarjetaCantada.frecuenciaBase('nodo.0.hexelion');
  if (a !== b) throw new Error('FNV-1a no determinista');
  if (a < 220 || a > 660) throw new Error('fuera de rango W1: ' + a);
});

test('VOZ=FORMA (M14): f_base = 220 + (hue/360)·660, medido contra la fórmula', () => {
  const f0 = AtlasTarjetaCantada.vozDeForma(0);
  const f180 = AtlasTarjetaCantada.vozDeForma(180);
  const f360 = AtlasTarjetaCantada.vozDeForma(360);
  if (f0 !== 220) throw new Error('hue 0 debe ser 220: ' + f0);
  if (f360 !== 220 || f180 !== 550) throw new Error('fórmula rota (hue normalizado a [0,360)): ' + f180 + '/' + f360);
  if (f360 !== f0) throw new Error('hue 360 = hue 0 (círculo de color)');
  if (AtlasTarjetaCantada.vozDeForma(null) !== null) throw new Error('sin hue debe devolver null');
});

test('melodía determinista: mismo término y sello = mismas notas; sello desconocido = NO_DATA con causa', () => {
  const t = { id: 'nodo.0.hexelion', sello: 'LIVE', hue: 196 };
  const m1 = AtlasTarjetaCantada.melodía(t);
  const m2 = AtlasTarjetaCantada.melodía(t);
  if (m1.estado !== 'MEDIDO' || JSON.stringify(m1.notas) !== JSON.stringify(m2.notas)) {
    throw new Error('melodía no determinista o no medida: ' + JSON.stringify(m1));
  }
  if (m1.notas.length !== 3) throw new Error('la melodía debe tener 3 notas');
  const nd = AtlasTarjetaCantada.melodía({ id: 'x', sello: 'INVENTADO' });
  if (nd.estado !== 'NO_DATA' || !/calla/.test(nd.causa)) throw new Error('sello desconocido debe callar con causa: ' + JSON.stringify(nd));
});

test('SIN GESTO NO SUENA (reduced-motion: corte limpio): canta sin melodía/no medida = NO_DATA, nunca sonido', () => {
  const sin = AtlasTarjetaCantada.canta(null);
  if (sin.estado !== 'NO_DATA' || !sin.causa) throw new Error('sin melodía debe ser NO_DATA con causa');
  const ndm = AtlasTarjetaCantada.canta({ estado: 'NO_DATA', causa: 'sello sin frecuencia' });
  if (ndm.estado !== 'NO_DATA') throw new Error('lo no medido debe callar');
  /* Sin AtlasSintesis en node, una melodía MEDIDA también devuelve NO_DATA con causa (Web Audio no disponible) */
  const m = AtlasTarjetaCantada.melodía({ id: 'x', sello: 'LIVE', hue: 12 });
  const c = AtlasTarjetaCantada.canta(m);
  if (c.estado !== 'NO_DATA' || !/Web Audio|opt-in/.test(c.causa)) throw new Error('sin sintetizador debe ser NO_DATA con causa: ' + JSON.stringify(c));
});

test('SABOTAJE OLA1-P1: la tabla congelada resiste la corrupcion; si se dejara corromper, la melodía deriva', () => {
  let corrompio = false;
  try { AtlasToon.SELLOS.LIVE = 999; corrompio = AtlasToon.SELLOS.LIVE === 999; }
  catch (e) { corrompio = false; }
  finally { if (corrompio) { AtlasToon.SELLOS.LIVE = 120; } }
  if (corrompio) {
    throw new Error('SABOTAJE DETECTADO: la tabla se dejo corromper (LIVE=' + AtlasToon.SELLOS.LIVE + ')');
  }
  if (AtlasToon.SELLOS.LIVE !== 120) throw new Error('la tabla medida cambio');
});
