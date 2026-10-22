// Runner de casos del ojo de descenso (atlas/ojo/ojo_descenso.mjs).
// Sirve atlas/ojo/fixtures en 127.0.0.1 y ejecuta el ojo en tres casos:
//   1) descenso_ok.html            -> rc 0: la pagina es determinista
//   2) descenso_sabotaje.html      -> rc 1: ROJO del sabotaje (el reloj mueve el fotograma)
//   3) descenso_ok.html --reduced  -> rc 0 y estatico_declarado true
// Uso: node atlas/ojo/ojo_descenso_casos.mjs
// Salida: UNA linea JSON {ok, casos}. rc=0 solo si los tres casos cumplen; rc=2 si Chrome
// no esta o una pagina no es medible (NO_DATA con causa); rc=1 en cualquier otro caso.
// Solo 127.0.0.1, sin dependencias. El servidor se mata siempre.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const OJO = path.join(AQUI, 'ojo_descenso.mjs');
const FIXTURES = path.join(AQUI, 'fixtures');
const PUERTO = 8700 + (process.pid % 90);
const BASE = `http://127.0.0.1:${PUERTO}`;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const enUnaLinea = (s, n = 240) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

const CASOS = [
  { nombre: 'ok', fixture: 'descenso_ok.html', args: [], rc: 0 },
  { nombre: 'sabotaje', fixture: 'descenso_sabotaje.html', args: [], rc: 1 },
  { nombre: 'ok_reducido', fixture: 'descenso_ok.html', args: ['--reduced'], rc: 0, estatico: true },
  { nombre: 'viewport_sensor', fixture: 'viewport_mismatch.html', args: [], rc: 0 },
];

// Un caso cumple con el rc esperado Y con una linea JSON del ojo que lo confirme.
// Un rc=1 sin JSON (ojo ausente: node sale con 1) NO cuenta como sabotaje detectado.
function cumple(caso, j) {
  if (!j || typeof j.ok !== 'boolean') return false;
  if (caso.nombre === 'sabotaje') return j.ok === false && (j.recarga_igual === false || j.direccion_igual === false);
  if (caso.estatico) return j.ok === true && j.estatico_declarado === true;
  return j.ok === true;
}

async function esperaServidor() {
  for (let i = 0; i < 50; i++) {
    try { await (await fetch(`${BASE}/`)).text(); return true; } catch { await espera(100); }
  }
  return false;
}

// Comprueba que el fixture responde 200: una 404 no debe pasar por pagina "estable".
async function sirve(url) {
  try {
    const r = await fetch(url);
    await r.text();
    return r.status === 200 ? null : `NO_DATA: ${url} responde HTTP ${r.status}`;
  } catch (e) {
    return `NO_DATA: ${url} no responde (${enUnaLinea(e.cause?.code || e.message)})`;
  }
}

async function main() {
  const casos = [];
  let servidor = null;
  let causaServidor = null;
  try {
    if (!existsSync(FIXTURES)) {
      causaServidor = 'NO_DATA: falta atlas/ojo/fixtures/, no hay nada que servir';
    } else {
      servidor = spawn('python3', ['-m', 'http.server', String(PUERTO), '--bind', '127.0.0.1'], { cwd: FIXTURES, stdio: 'ignore' });
      servidor.on('error', () => {}); // python3 ausente: esperaServidor lo registra como falta de servidor
      if (!(await esperaServidor())) causaServidor = `NO_DATA: servidor de fixtures no responde en 127.0.0.1:${PUERTO}`;
    }
    for (const caso of CASOS) {
      const url = `${BASE}/${caso.fixture}`;
      const causaFixture = causaServidor || (await sirve(url));
      const r = spawnSync(process.execPath, [OJO, url, ...caso.args], { encoding: 'utf8', timeout: 180000 });
      const linea = (r.stdout || '').trim().split('\n').pop() || '';
      let j = null;
      try { j = JSON.parse(linea); } catch { j = null; }
      const ok = !causaFixture && r.status === caso.rc && cumple(caso, j);
      const res = { nombre: caso.nombre, args: caso.args, rc_esperado: caso.rc, rc: r.status, ok };
      if (j) res.medida = { recarga_igual: j.recarga_igual, direccion_igual: j.direccion_igual, estatico_declarado: j.estatico_declarado };
      if (!ok) {
        const motivos = [causaFixture];
        if (!j) motivos.push(enUnaLinea(linea || `sin salida JSON del ojo; stderr: ${r.stderr}`));
        else if (!cumple(caso, j)) motivos.push(`expectativa no cumplida (ojo ok=${j.ok})`);
        if (r.status !== caso.rc) motivos.push(`rc=${r.status}, se esperaba ${caso.rc}`);
        res.causa = motivos.filter(Boolean).join(' | ');
      }
      casos.push(res);
    }
  } finally {
    if (servidor && servidor.exitCode === null) {
      const salida = new Promise((r) => servidor.once('exit', r));
      servidor.kill('SIGTERM');
      await Promise.race([salida, espera(2000)]);
    }
  }
  const ok = casos.length === CASOS.length && casos.every((c) => c.ok);
  console.log(JSON.stringify({ ok, casos }));
  process.exitCode = ok ? 0 : casos.some((c) => c.rc === 2) ? 2 : 1;
}

main();
