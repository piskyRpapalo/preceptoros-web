/* Guardián de citas del llms.txt, en cuatro familias:
   (1) todo CELEX citado vive en ACTS y con su letra de régimen (R/L);
   (2) la Directiva (UE) 2019/882 (accesibilidad) jamás se cita como R;
   (3) la Estrella lleva exactamente un sello de aplicabilidad por línea;
   (4) la cifra de tests web cuadra consigo misma (total = pasan + omiten).
   La ASIGNACIÓN applies/self-imposed es del carbono (FIRMO); el guardián
   exige presencia y forma, jamás decide el contenido del sello. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const texto = readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');

/* Dígitos del CELEX (sector + año + número, SIN la letra) -> letra que toca.
   Los nombres de los actos viven en el llms.txt; aquí solo la cuenta. La
   Directiva (UE) 2019/882 es L: citarla como R es el error de familia que
   este guardián cierra (revisión externa, 2026-10-16). */
const ACTS = {
  '320241689': 'R',
  '320232854': 'R',
  '320242847': 'R',
  '320222554': 'R',
  '320160679': 'R',
  '320190882': 'L'
};

const citaCELEX = /CELEX:(\d{4,5})([RL])(\d{4})/g;
const lineaEstrella = /^- [A-D]\d+: /;
function sellos(linea) { return linea.match(/\[(applies|self-imposed)\]/g) || []; }
function letraCorrecta(m) { return ACTS[m[1] + m[3]] === m[2]; }

test('todo CELEX citado está declarado en ACTS y con su letra', () => {
  const citas = Array.from(texto.matchAll(citaCELEX));
  assert.ok(citas.length >= 1, 'no hay ninguna cita CELEX que vigilar');
  for (const m of citas) {
    const clave = m[1] + m[3];
    assert.ok(ACTS[clave] !== undefined, 'CELEX sin declarar en ACTS: ' + clave);
    assert.equal(ACTS[clave], m[2], 'letra de régimen equivocada para ' + clave);
  }
});

test('la Directiva (UE) 2019/882 jamás se cita como reglamento', () => {
  assert.equal(/CELEX:32019R\d+/.test(texto), false,
    'el EAA es 32019L0882 (L); un 32019R0882 no existe');
});

test('la Estrella lleva exactamente un sello por línea (43 entradas)', () => {
  const lineas = texto.split('\n').filter(l => lineaEstrella.test(l));
  assert.equal(lineas.length, 43, 'se esperaban 43 entradas A1-D45');
  for (const l of lineas) {
    assert.equal(sellos(l).length, 1, 'línea sin un sello exacto: ' + l);
  }
});

test('la cifra de tests web cuadra (total = pasan + omiten)', () => {
  const m = texto.match(/(\d+) web tests: (\d+) passing and (\d+) skipped/);
  assert.ok(m !== null, 'no hay cifra de tests web que vigilar');
  assert.equal(Number(m[1]), Number(m[2]) + Number(m[3]), 'el total no cuadra con pasan + omiten');
});

test('SABOTAJE: una letra de régimen virada produce rojo', () => {
  const roto = texto.replace('CELEX:32024R1689', 'CELEX:32024L1689');
  if (roto === texto) { throw new Error('el sabotaje no cambió nada: el test no puede ponerse rojo'); }
  const mal = Array.from(roto.matchAll(citaCELEX)).some(m => !letraCorrecta(m));
  assert.equal(mal, true, 'el sabotaje no produciría rojo: la ley sería falsa');
});

test('SABOTAJE: un sello arrancado produce rojo', () => {
  const roto = texto.replace(' \u00B7 [applies]', '').replace(' \u00B7 [self-imposed]', '');
  if (roto === texto) { throw new Error('el sabotaje no cambió nada: el test no puede ponerse rojo'); }
  const desnuda = roto.split('\n').filter(l => lineaEstrella.test(l)).some(l => sellos(l).length !== 1);
  assert.equal(desnuda, true, 'el sabotaje no produciría rojo: la ley sería falsa');
});
