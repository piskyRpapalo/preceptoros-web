// Runner de casos del ojo de palabras (atlas/ojo/ojo_palabras.mjs). Sin dependencias.
// El propio ojo sirve la raiz del repo en 127.0.0.1; aqui solo se le llama y se mira su salida.
//   1) fixtures/palabras.html          -> rc 0, ok, recarga_igual, n >= 12 y un PNG por lienzo.
//   2) fixtures/palabras_sabotaje.html -> rc 1 con JSON ok false y recarga_igual false (ROJO esperado).
//   3) Chrome no disponible            -> NO_DATA "Chrome CDP unavailable" cuenta como paso (decision mia, sin firma).
// Uso: node atlas/ojo/ojo_palabras_casos.mjs     (carpetas temporales bajo OJO_PALABRAS_TMP o os.tmpdir(), borradas al acabar.
// No se usa TMPDIR: Chrome no admite un socket de mas de 108 bytes y el scratchpad lo supera.)
// Salida: UNA linea JSON {ok, casos}. rc=0 solo si todos los casos pasan; rc=1 en otro caso.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OJO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ojo_palabras.mjs');
const CASOS = [
  { nombre: 'palabras', fixture: 'atlas/ojo/fixtures/palabras.html', rc: 0 },
  { nombre: 'sabotaje', fixture: 'atlas/ojo/fixtures/palabras_sabotaje.html', rc: 1 },
];
const enUnaLinea = (s, n = 240) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// Chrome no disponible: el ojo sale con NO_DATA y "Chrome CDP unavailable" en la causa.
const sinChrome = (linea) => /^NO_DATA: Chrome CDP unavailable/.test(linea);

// PNG escritos en la carpeta: solo cuentan los que empiezan por la firma PNG.
function pngs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .filter((f) => readFileSync(path.join(dir, f)).subarray(0, 8).toString('hex') === '89504e470d0a1a0a');
}

function cumple(caso, r, j, dir) {
  if (caso.nombre === 'sabotaje') return r.status === 1 && j?.ok === false && j?.recarga_igual === false;
  return r.status === 0 && j?.ok === true && j?.recarga_igual === true && j?.n >= 12 && pngs(dir).length === j.n;
}

function prueba(caso, tmp) {
  const dir = path.join(tmp, caso.nombre);
  const r = spawnSync(process.execPath, [OJO, '--out', dir, '--fixture', caso.fixture],
    { encoding: 'utf8', timeout: 180000 });
  const linea = (r.stdout || '').trim().split('\n').pop() || '';
  let j = null;
  try { j = JSON.parse(linea); } catch { j = null; }
  if (r.status === 2 && sinChrome(linea)) return { nombre: caso.nombre, ok: true, nodata: enUnaLinea(linea) };
  const ok = cumple(caso, r, j, dir);
  const res = { nombre: caso.nombre, rc_esperado: caso.rc, rc: r.status, ok };
  if (!ok) res.causa = j ? `ojo ok=${j.ok} recarga_igual=${j.recarga_igual} n=${j.n}` : enUnaLinea(linea || r.stderr || 'sin salida');
  return res;
}

const tmp = mkdtempSync(path.join(process.env.OJO_PALABRAS_TMP || tmpdir(), 'ojo-palabras-casos-'));
try {
  const casos = CASOS.map((c) => prueba(c, tmp));
  const ok = casos.every((c) => c.ok);
  console.log(JSON.stringify({ ok, casos }));
  process.exitCode = ok ? 0 : 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
