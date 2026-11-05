// Casos del gate de parametros (atlas/param_gate.mjs) · decision mia (sin firma).
// Ejecuta los 9 casos y sale con una linea JSON {ok, casos:[{caso, nombre, ok}]}; rc 0 solo si todos pasan.
// Un caso que lanza cuenta como fallo. El CLI se comprueba por stdout JSON ademas de por rc:
// un gate que no carga (rc 1 de node) no debe pasar como sabotaje detectado.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const DATASET = ruta('./legibilidad/escena_w2_fotogramas.json');
const GATE = ruta('./param_gate.mjs');

let G = null;
try { G = await import('./param_gate.mjs'); } catch (e) { process.stderr.write(`param_gate.mjs no carga: ${e.code || e.message}\n`); }
let AV = null;
try { AV = req(ruta('../public/game/state_vector.js')); } catch (e) { process.stderr.write(`state_vector.js no carga: ${e.message}\n`); }

const f0 = () => structuredClone(JSON.parse(readFileSync(DATASET, 'utf8')).frames[0]);
const cli = (extra) => spawnSync(process.execPath, [GATE, DATASET, ...extra], { encoding: 'utf8' });
const json = (texto) => { try { return JSON.parse(String(texto).trim()); } catch { return null; } };
const VECTOR_MINIMO = { v: 'preceptoros.vector/1', c: null, r: null, k: null, p: null, t: null, e: [], l: [], n: [], z: null, q: [], g: null, nd: { c: 'x', r: 'x', k: 'x', e: 'x', l: 'x', z: 'x' } };

const CASOS = [
  { caso: 1, nombre: 'dataset W2 pasa entero: 4 fotogramas ok, todos < TOPE', fn: () => {
    const d = G.checkDataset(DATASET);
    return d.ok === true && d.frames.length === 4 && d.frames.every((f) => f.ok && f.bytes < G.TOPE);
  } },
  { caso: 2, nombre: 'TOPE === 1024 y === AtlasVector.TOPE', fn: () => G.TOPE === 1024 && G.TOPE === AV.TOPE },
  { caso: 3, nombre: 'sabotaje banda: literal #123456 no ok', fn: () => {
    const f = f0(); f.atoms[0].i[0].f = '#123456';
    const r = G.checkFrame(f);
    return r.ok === false && r.causes.includes('color without named band: #123456');
  } },
  { caso: 4, nombre: 'sabotaje banda no declarada: ERROR.base fuera de frame.bands no ok', fn: () => {
    const f = f0(); f.atoms[1].i[1].f = 'ERROR.base';
    const r = G.checkFrame(f);
    return r.ok === false && r.causes.includes('band not declared in frame.bands: ERROR.base');
  } },
  { caso: 5, nombre: 'sabotaje serial: NaN, funcion y ciclo no ok, sin lanzar', fn: () => {
    const nan = f0(); nan.atoms[0].i[0].sz = NaN;
    const conFuncion = f0(); conFuncion.atoms[0].i[0].sz = () => 1;
    const ciclo = f0(); ciclo.self = ciclo;
    return [nan, conFuncion, ciclo].every((x) => {
      const r = G.checkFrame(x);
      return r.ok === false && r.causes.some((c) => c.startsWith('not serializable'));
    });
  } },
  { caso: 6, nombre: 'sabotaje tamano: pad de 1100 no ok con causa NO_DATA', fn: () => {
    const f = f0(); f.pad = 'x'.repeat(1100);
    const r = G.checkFrame(f);
    return r.ok === false && r.causes.some((c) => c.startsWith('NO_DATA'));
  } },
  { caso: 7, nombre: 'color sin texto: LIVE.base con r vacio no ok', fn: () => {
    const f = { t: 0, sound: 'NO_DATA', soundCause: 'caso 7', bands: ['LIVE.base'], change: [],
      atoms: [{ k: 'stamp', r: '', i: [{ o: 'rect', x: 10, y: 10, w: 8, h: 48, f: 'LIVE.base', lw: 0 }] }] };
    const r = G.checkFrame(f);
    return r.ok === false && r.causes.includes('color without text: atom 0');
  } },
  { caso: 8, nombre: 'vector minimo valido ok; con clave extra no ok', fn: () =>
    G.checkVector(VECTOR_MINIMO).ok === true && G.checkVector({ ...VECTOR_MINIMO, extra: 1 }).ok === false },
  { caso: 9, nombre: 'CLI: rc 0 sobre W2 y rc 1 con cada sabotaje', fn: () => {
    const base = cli([]);
    if (base.status !== 0 || json(base.stdout)?.ok !== true) return false;
    return ['--sabotage-band', '--sabotage-serial', '--sabotage-size'].every((flag) => {
      const r = cli([flag]);
      const j = json(r.stdout);
      return r.status === 1 && j !== null && j.ok === false && j.sabotaje === flag;
    });
  } },
];

const resultados = CASOS.map(({ caso, nombre, fn }) => {
  let ok = false;
  try { ok = fn() === true; } catch (e) { process.stderr.write(`caso ${caso} lanza: ${e.message}\n`); }
  return { caso, nombre, ok };
});
const todos = resultados.every((r) => r.ok);
process.stdout.write(JSON.stringify({ ok: todos, casos: resultados }) + '\n');
process.exitCode = todos ? 0 : 1;
