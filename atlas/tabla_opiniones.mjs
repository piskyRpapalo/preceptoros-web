// preceptoros.org · theGame · la TABLA de las opiniones firmadas de `opiniones/`.
//
//     node atlas/tabla_opiniones.mjs              # la escribe por la salida
//     node atlas/tabla_opiniones.mjs --escribe    # la guarda en opiniones/TABLA.md
//     node atlas/tabla_opiniones.mjs --comprueba  # sale con 1 si TABLA.md no esta al dia
//
// DETERMINISTA: los ficheros por nombre, sin fecha de reloj, sin red, sin LLM. Cada opinion pasa por
// `verificaOpinion` (forma, nota y firma). La que no verifica NO entra en la cuenta y sale aparte con
// su motivo: un rechazo que se calla es un sensor que miente. Los `ejemplo-*.json` verifican pero
// tampoco cuentan: los firmo una maquina para probar la cadena, no una persona.
//
// Es lo que el piloto puede leer: donde la persona dijo Right / Wrong / Not sure, sobre que y en que
// ciclo. La huella del estado sigue siendo NO_DATA hasta casarla con la partida exportada.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verificaOpinion } from './verifica_opinion.mjs';

const CARPETA = join(dirname(fileURLToPath(import.meta.url)), '..', 'opiniones');
const SOBRES = ['sugerencia', 'veredicto', 'grieta'];
const ELECCIONES = [['de_acuerdo', 'Right'], ['en_desacuerdo', 'Wrong'], ['no_se', 'Not sure']];

// Una celda de Markdown: una sola linea y sin caracteres que abran formato, enlaces ni HTML.
function celda(x, max) {
  let s = String(x).replace(/\s+/g, ' ').trim();
  if (max && s.length > max) { s = s.slice(0, max - 1) + '…'; }
  return s.replace(/[\\|`*_<>[\]#]/g, (c) => '\\' + c) || '—';
}
const etiqueta = (e) => ELECCIONES.find((x) => x[0] === e)[1];
const cuantas = (lista, sb, el) => lista.filter((x) => (!sb || x.s.opinion.sobre === sb) &&
  (!el || x.s.opinion.eleccion === el)).length;

export function tabla(carpeta = CARPETA) {
  const entran = [], ejemplos = [], fuera = [];
  for (const n of readdirSync(carpeta).filter((f) => f.endsWith('.json')).sort()) {
    let s = null, r;
    try { s = JSON.parse(readFileSync(join(carpeta, n), 'utf8')); r = verificaOpinion(s); }
    catch (x) { r = { ok: false, motivo: 'lectura: ' + x.message }; }
    (!r.ok ? fuera : n.startsWith('ejemplo-') ? ejemplos : entran).push({ n, s, r });
  }
  const L = ['# Tabla de opiniones firmadas', '',
    'La genera `node atlas/tabla_opiniones.mjs --escribe` y la comprueba el CI: no se edita a mano.',
    'Solo cuentan las que verifican (forma, nota y firma Ed25519) y no son de ejemplo. La huella del',
    'estado es NO_DATA hasta casarla con la partida exportada.', '',
    '## Cuenta', '', '| sobre | ' + ELECCIONES.map((e) => e[1]).join(' | ') + ' | total |', '|---|---:|---:|---:|---:|'];
  for (const sb of [...SOBRES, '']) {
    L.push(`| ${sb || '**total**'} | ` + ELECCIONES.map((e) => cuantas(entran, sb, e[0])).join(' | ') +
      ` | ${cuantas(entran, sb, '')} |`);
  }
  L.push('', '## Opiniones', '');
  if (!entran.length) { L.push('NO_DATA · ninguna opinion de una persona verificada todavia.'); }
  else {
    L.push('| fichero | pseudónimo | clave | sobre | ciclo | respuesta | lo que leyó | nota |',
      '|---|---|---|---|---:|---|---|---|');
    for (const { n, s } of entran) {
      const o = s.opinion;
      L.push(`| ${celda(n)} | ${celda(s.pseudonimo)} | ${s.clave_publica.slice(0, 8)} | ${o.sobre} | ${o.ciclo} | ` +
        `${etiqueta(o.eleccion)} | ${celda(o.mostrado, 80)} | ${celda(o.nota)} |`);
    }
  }
  L.push('', '## Ejemplos (verifican, no cuentan)', '');
  if (!ejemplos.length) { L.push('Ninguno.'); }
  for (const { n, s } of ejemplos) { L.push(`- ${celda(n)}: ${celda(s.pseudonimo)}, ${etiqueta(s.opinion.eleccion)}`); }
  L.push('', '## Rechazadas', '');
  if (!fuera.length) { L.push('Ninguna.'); }
  for (const { n, r } of fuera) { L.push(`- ${celda(n)}: ${celda(r.motivo)}`); }
  return { texto: L.join('\n') + '\n', entran: entran.length, ejemplos: ejemplos.length, fuera: fuera.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const modo = process.argv[2] || '', salida = join(CARPETA, 'TABLA.md'), t = tabla();
  const cuenta = `entran ${t.entran} · ejemplos ${t.ejemplos} · rechazadas ${t.fuera}`;
  if (modo === '--escribe') { writeFileSync(salida, t.texto); console.log('opiniones/TABLA.md · ' + cuenta); }
  else if (modo === '--comprueba') {
    let hay = '';
    try { hay = readFileSync(salida, 'utf8'); } catch (x) { hay = ''; }
    const ok = hay === t.texto;
    console.log(ok ? 'opiniones/TABLA.md al dia · ' + cuenta
      : 'opiniones/TABLA.md NO esta al dia: node atlas/tabla_opiniones.mjs --escribe');
    process.exit(ok ? 0 : 1);
  } else if (!modo) { process.stdout.write(t.texto); }
  else { console.error('uso: node atlas/tabla_opiniones.mjs [--escribe | --comprueba]'); process.exit(2); }
}
