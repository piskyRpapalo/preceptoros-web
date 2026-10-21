// Discovery runner: every atlas/*_casos.mjs and questions/*_casos.mjs runs here, n=1 per file.
// A suite that does not exist, or fails, turns this red. Registered in gate.yml so the
// discovery itself is gated (a missing file must fail, never skip green).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const corredores = [path.join(aqui, '..', 'atlas'), path.join(aqui, '..', 'questions')];
const ficheros = [];
const yo = path.basename(fileURLToPath(import.meta.url));
for (const dir of corredores) {
  for (const nombre of readdirSync(dir)) {
    if (nombre === yo) continue;
    if (nombre.endsWith('_casos.mjs') || nombre.endsWith('_cases.mjs')) {
      ficheros.push(path.join(dir, nombre));
    }
  }
}
if (!ficheros.length) {
  console.error('ERROR: no *_casos.mjs suites discovered');
  process.exit(1);
}
let fallos = 0;
for (const fichero of ficheros.sort()) {
  const r = spawnSync(process.execPath, [fichero], { encoding: 'utf8', timeout: 60000 });
  const ok = r.status === 0;
  if (!ok) fallos++;
  console.log((ok ? 'PASS ' : 'FAIL ') + path.relative(aqui, fichero) + (ok ? '' : ' :: ' + (r.stdout || r.stderr || '').split('\n').slice(-3).join(' | ')));
}
console.log(fallos ? `ROJO · ${fallos}/${ficheros.length} suites failed` : `VERDE · ${ficheros.length}/${ficheros.length} suites pass`);
process.exit(fallos ? 1 : 0);
