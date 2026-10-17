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
function comentarios(t) {
  const s = sinStrings(t), bloques = [], lineas = [];
  let i = 0, regex = true, word = '';
  const prefixWords = new Set(['await', 'case', 'delete', 'do', 'else', 'in', 'instanceof', 'new', 'of', 'return', 'throw', 'typeof', 'void', 'yield']);
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && n === '*') {
      const end = s.indexOf('*/', i + 2);
      const stop = end < 0 ? s.length : end + 2;
      bloques.push(s.slice(i, stop)); i = stop; continue;
    }
    if (c === '/' && n === '/') {
      const end = s.indexOf('\n', i + 2);
      const stop = end < 0 ? s.length : end;
      lineas.push(s.slice(i, stop)); i = stop; continue;
    }
    if (c === '/' && regex) {
      i++; let escaped = false, inClass = false;
      while (i < s.length) {
        const x = s[i++];
        if (escaped) { escaped = false; continue; }
        if (x === '\\') { escaped = true; continue; }
        if (x === '[') { inClass = true; continue; }
        if (x === ']') { inClass = false; continue; }
        if (x === '/' && !inClass) { while (/[a-z]/i.test(s[i] || '')) { i++; } break; }
        if (x === '\n') { break; }
      }
      regex = false; word = ''; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      const start = i++;
      while (/[\w$]/.test(s[i] || '')) { i++; }
      word = s.slice(start, i); regex = prefixWords.has(word); continue;
    }
    if (/[0-9]/.test(c)) {
      i++; while (/[\w.]/.test(s[i] || '')) { i++; }
      regex = false; word = ''; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c; i++;
      while (i < s.length && s[i] !== quote) { if (s[i] === '\\') { i++; } i++; }
      i++; regex = false; word = ''; continue;
    }
    if (c === '`') {
      i++; while (i < s.length && s[i] !== '`') { if (s[i] === '\\') { i++; } i++; }
      i++; regex = false; word = ''; continue;
    }
    if (c === '(' || c === '[' || c === '{' || c === ',' || c === ';' || c === ':' || c === '?' || c === '=' || c === '!' || c === '~' || c === '+' || c === '-' || c === '*' || c === '%' || c === '&' || c === '|' || c === '^' || c === '<' || c === '>') {
      if ((c === '+' && n === '+') || (c === '-' && n === '-')) { i += 2; regex = false; }
      else { i++; regex = true; }
      word = ''; continue;
    }
    if (c === ')' || c === ']' || c === '.') { i++; regex = false; word = ''; continue; }
    if (c === '}') { i++; regex = true; word = ''; continue; }
    if (c === '/') { i += n === '=' ? 2 : 1; regex = true; word = ''; continue; }
    i++; regex = false; word = '';
  }
  return { bloques, lineas };
}

test('D1-ESTRICTO · SIN comentarios /* */ ni // (rojo hoy; verde tras D1)', { skip: process.env.D1_ESTRICTO !== '1' }, () => {
  const infractores = [];
  for (const f of jsServidos()) {
    const t = readFileSync(f, 'utf8');
    const detectados = comentarios(t);
    const bloques = detectados.bloques.length;
    const lineas = detectados.lineas.length;
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
  const fixture = comentarios('const url = /https?:\\/\\//; /* block fixture */ // line fixture');
  let conEs = 0;
  for (const f of jsServidos()) {
    const t = readFileSync(f, 'utf8');
    const ids = [...sinStrings(t).matchAll(/(?:function|var|const|let)\s+([^\s(=;]+)/g)].map(m => m[1]);
    if (ids.some(i => /[áéíóúñ]/.test(i) || PALABRAS_ES.includes(i.toLowerCase()))) { conEs++; }
  }
  if (fixture.bloques.length !== 1 || fixture.lineas.length !== 1) { throw new Error('D1 fixture must detect one block and one line comment while ignoring regex delimiters'); }
  if (conEs === 0) { throw new Error('D2 no detectaría nada: la lista no caza español vivo'); }
});

/* EXCEPCIONES cableada (grieta menor): sw.js declara strings i18n (DATO) — el
   guardián los trata como strings (sinStrings), no como comentarios. Los
   comentarios de sw.js migran como los de todos. La constante se usa: */
test('EXCEPCIONES declaradas se usan: sw.js i18n es DATO, no comentario', () => {
  const t = readFileSync(join(RAIZ, 'public/sw.js'), 'utf8');
  if (!/SIN_RED/.test(t)) { throw new Error('la excepción documentada (SIN_RED i18n) ya no vive en sw.js: doc desalineado'); }
});
