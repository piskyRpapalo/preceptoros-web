import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('../', import.meta.url).pathname;

/* FUENTE DE LA LISTA: docs/INDEX_RENAMING.md §Lista española medida.
   La lista es DATO del doc, no una regex muda: se mantiene ahí, con su cifra. */
const PALABRAS_ES = [
  'monta', 'pinta', 'crea', 'abre', 'cierra', 'lee', 'escribe', 'calcula',
  'sirve', 'fija', 'dice', 'toca', 'precachear', 'rutasDelShell', 'sinRedireccion',
  'navegacion', 'idiomaDe', 'paginaSinRed', 'fuera', 'accion', 'adopcion',
  'peldano', 'grieta', 'cangrejo', 'arrecife', 'bandera', 'huella', 'ciclo',
  'sobres', 'taller', 'mar', 'cria', 'nodos', 'cuenta', 'valores', 'juez',
  'escena', 'casa', 'duelo', 'arena', 'niebla', 'tropa', 'nido', 'huevo'
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

/* El código servido SIN comentarios: los strings ('https://…') NO son
   comentario. La excepción de URLs vive AQUÍ explícita y en el doc, no
   implícita en una regex muda: un // dentro de un literal de string es
   parte del dato (URL), no comentario. */
function sinStrings(t) {
  return t.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
}
function comentariosBloque(t) { return sinStrings(t).match(/\/\*[\s\S]*?\*\//g) || []; }
function comentariosLinea(t) {
  return sinStrings(t).split('\n').filter(l => /(^|[^:'"])\/\//.test(l.replace(/https?:\/\//g, '')));
}

test('D1-ESTRICTO · SIN comentarios /* */ ni // (rojo hoy; verde tras D1)', { skip: process.env.D1_ESTRICTO !== '1' }, () => {
  const infractores = [];
  for (const f of jsServidos()) {
    const t = readFileSync(f, 'utf8');
    const bloques = comentariosBloque(t).length;
    const lineas = comentariosLinea(t).length;
    if (bloques || lineas) { infractores.push(`${f}: ${bloques} bloque(s), ${lineas} linea(s)`); }
  }
  if (infractores.length) {
    throw new Error(`comentarios presentes (canon a docs/, memoria muere):\n${infractores.join('\n')}`);
  }
});

test('D2-ESTRICTO · SIN palabras españolas por LISTA y sin tildes/ñ (rojo hoy; verde tras D2)', { skip: process.env.D2_ESTRICTO !== '1' }, () => {
  const infractores = [];
  for (const f of jsServidos()) {
    const t = sinStrings(readFileSync(f, 'utf8'));
    const ids = [...t.matchAll(/(?:function|var|const|let)\s+([^\s(=;]+)/g)].map(m => m[1]);
    const malos = ids.filter(i => /[áéíóúñÁÉÍÓÚÑ]/.test(i) || PALABRAS_ES.includes(i.toLowerCase()));
    if (malos.length) { infractores.push(`${f}: ${malos.join(', ')}`); }
  }
  if (infractores.length) { throw new Error(`identificadores en español (lista del doc):\n${infractores.join('\n')}`); }
});

test('el guardián puede ponerse ROJO (demostración viva): hoy DETECTA los comentarios — la ley no es falsa', () => {
  let conCom = 0, conEs = 0;
  for (const f of jsServidos()) {
    const t = readFileSync(f, 'utf8');
    if (comentariosBloque(t).length) { conCom++; }
    const ids = [...sinStrings(t).matchAll(/(?:function|var|const|let)\s+([^\s(=;]+)/g)].map(m => m[1]);
    if (ids.some(i => /[áéíóúñ]/.test(i) || PALABRAS_ES.includes(i.toLowerCase()))) { conEs++; }
  }
  if (conCom === 0) { throw new Error('D1 no detectaría nada: el guardián no puede ponerse rojo'); }
  if (conEs === 0) { throw new Error('D2 no detectaría nada: la lista no caza español vivo'); }
});

/* EXCEPCIONES cableada (grieta menor): sw.js declara strings i18n (DATO) — el
   guardián los trata como strings (sinStrings), no como comentarios. Los
   comentarios de sw.js migran como los de todos. La constante se usa: */
test('EXCEPCIONES declaradas se usan: sw.js i18n es DATO, no comentario', () => {
  const t = readFileSync(join(RAIZ, 'public/sw.js'), 'utf8');
  if (!/SIN_RED/.test(t)) { throw new Error('la excepción documentada (SIN_RED i18n) ya no vive en sw.js: doc desalineado'); }
});
