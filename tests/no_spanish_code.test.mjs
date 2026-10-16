import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('../', import.meta.url).pathname;
const EXCEPCIONES = [
  'sw.js', /* SIN_RED: strings UI i18n que el worker sintetiza por lengua — DATO, no comentario (docs/INDEX_RENAMING.md) */
];

function jsServidos() {
  const out = [];
  for (const d of ['public', 'public/game']) {
    for (const f of readdirSync(join(RAIZ, d))) {
      if (f.endsWith('.js') && statSync(join(RAIZ, d, f)).isFile()) { out.push(join(RAIZ, d, f)); }
    }
  }
  return out;
}

const COMENTARIO_BLOQUE = /\/\*[\s\S]*?\*\//;
const COMENTARIO_LINEA = /(^|[^:'"`])\/\/(?![^{]*`)/;

test('D1-MODO-ESTRICTO · falla si hay comentarios (para ejecutar tras D1): ROJO hoy', { skip: process.env.D1_ESTRICTO !== '1' }, () => {
  const infractores = [];
  for (const f of jsServidos()) {
    const t = readFileSync(f, 'utf8');
    if (COMENTARIO_BLOQUE.test(t)) { infractores.push(f + ' (bloque /* */)'); }
  }
  if (infractores.length) {
    throw new Error('comentarios /* */ presentes (migrar canon a docs/ o borrar memoria):\n' + infractores.join('\n'));
  }
});

test('D2-MODO-ESTRICTO · falla si hay identificadores españoles (tras D2): ROJO hoy', { skip: process.env.D2_ESTRICTO !== '1' }, () => {
  const infractores = [];
  for (const f of jsServidos()) {
    const t = readFileSync(f, 'utf8').replace(COMENTARIO_BLOQUE, '');
    const ids = [...t.matchAll(/(?:function|var|const|let)\s+([^\s(=;]+)/g)].map(m => m[1]);
    const malos = ids.filter(i => /[áéíóúñÁÉÍÓÚÑ]/.test(i));
    if (malos.length) { infractores.push(f + ': ' + malos.join(', ')); }
  }
  if (infractores.length) { throw new Error('identificadores en español:\n' + infractores.join('\n')); }
});

test('el guardián puede ponerse ROJO (demostración viva): un fichero con comentario debe fallar este escaneo', () => {
  let detectados = 0;
  for (const f of jsServidos()) {
    const t = readFileSync(f, 'utf8');
    if (COMENTARIO_BLOQUE.test(t)) { detectados++; }
  }
  if (detectados === 0) {
    throw new Error('el guardián no detectaría nada: no puede ponerse rojo. La ley no está hecha prueba.');
  }
  /* HOY (pre-D1) el guardián DETECTA los 63+ ficheros con comentarios: eso es el ROJO medido.
     Cuando D1 se ejecute, este test se invierte (detectados === 0) y el de arriba pierde su skip. */
});
