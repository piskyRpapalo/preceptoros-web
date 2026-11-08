// W-04 · CI runs every case (odd/tasks/ci-every-case.md). Every atlas/*_cases.mjs that gate.yml does not name is run
// here, and its own verdict is read, not just its exit code: a JSON list with any ok:false, a node:test «ℹ fail N» with
// N > 0, a JSON object with a non-empty fallos/failures list, or a non-zero exit is RED. A suite that reports zero cases
// is EMPTY: it is red too, unless its cause is declared in VACIAS below. Honest denominator: run = present.
//   node atlas/every_case.mjs            → {corridas, verdes, rojos, vacias}; exit 1 on any red or undeclared empty
//   node atlas/every_case.mjs --sabotage → checks that a fake failing suite and a fake empty suite are caught
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ATLAS = dirname(fileURLToPath(import.meta.url)), RAIZ = join(ATLAS, '..');
// Empty on purpose (cause written): a suite here may report zero cases without turning the gate red.
const SHELL = 'cases emptied in #655 (33fdc745, native renames); ';
const VACIAS = {
  'echo_cases.mjs': SHELL + 'its piece public/game/primer_eco.js is retired',
  'house_cases.mjs': SHELL + 'its piece public/game/home_buildings.js is retired',
  'label_cases.mjs': SHELL + 'VT2 label: no served piece named',
  'reef_building_cases.mjs': SHELL + 'the nine objects: no served piece named',
  'silhouette_cases.mjs': SHELL + 'VT4 silhouettes: no served piece named',
  'tutorial_phases_cases.mjs': SHELL + 'VT5 tutorial: no served piece named',
  'ui_tutorial_cases.mjs': SHELL + 'VT5 screens: no served piece named',
  'nodes_cases.mjs': SHELL + 'DEBT: public/game/nodes.js is still served and has no cases (odd/tasks/ci-every-case.md)',
  'star_capture_cases.mjs': SHELL + 'DEBT: public/game/star_capture.js is still served and has no cases (odd/tasks/ci-every-case.md)'
};

// verdict(code, out) → 'verde' | 'rojo:<cause>' | 'vacia'. Pure, used by the sabotage check.
export function verdict(code, out) {
  if (code !== 0) { return 'rojo:exit ' + code; }
  const fails = [...out.matchAll(/ℹ fail (\d+)/g)].map((m) => Number(m[1]));
  if (fails.some((n) => n > 0)) { return 'rojo:node:test fail ' + Math.max(...fails); }
  if (/ℹ pass (\d+)/.test(out)) { return Number(out.match(/ℹ pass (\d+)/)[1]) > 0 ? 'verde' : 'vacia'; }
  let data = null;
  for (const text of [out.trim(), out.trim().split('\n').pop()]) { try { data = JSON.parse(text); break; } catch { /* next */ } }
  if (Array.isArray(data)) {
    if (!data.length) { return 'vacia'; }
    const bad = data.filter((c) => c && c.ok === false);
    return bad.length ? 'rojo:' + bad.length + ' case(s) ok:false · ' + String(bad[0].caso || bad[0].case || '').slice(0, 80) : 'verde';
  }
  if (data && typeof data === 'object') {
    const list = data.fallos || data.failures;
    if (Array.isArray(list) && list.length) { return 'rojo:' + String(list[0]).slice(0, 100); }
    if (Array.isArray(data.casos)) { return verdict(0, JSON.stringify(data.casos)); }
    return 'verde';
  }
  return out.trim() ? 'verde' : 'vacia';
}

function run(file) {
  try { return { code: 0, out: execFileSync(process.execPath, [file], { cwd: RAIZ, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }) }; }
  catch (e) { return { code: e.status == null ? 1 : e.status, out: String(e.stdout || '') }; }
}

if (process.argv.includes('--sabotage')) {
  const dir = mkdtempSync(join(tmpdir(), 'every-case-')), red = join(dir, 'red_cases.mjs'), empty = join(dir, 'empty_cases.mjs');
  writeFileSync(red, 'console.log(JSON.stringify([{caso:"sabotage",ok:false}]));\n');
  writeFileSync(empty, 'console.log("[]");\n');
  const a = run(red), b = run(empty), ok = verdict(a.code, a.out).startsWith('rojo') && verdict(b.code, b.out) === 'vacia';
  console.log(JSON.stringify({ sabotage: ok ? 'caught' : 'MISSED' }));
  process.exit(ok ? 0 : 1);
}

const named = readFileSync(join(RAIZ, '.github/workflows/gate.yml'), 'utf8');
const files = readdirSync(ATLAS).filter((f) => f.endsWith('_cases.mjs') && !named.includes(f)).sort();
const rojos = [], vacias = [];
let verdes = 0;
for (const f of files) {
  const r = run(join(ATLAS, f)), v = verdict(r.code, r.out);
  if (v === 'verde') { verdes++; } else if (v === 'vacia') { if (!VACIAS[f]) { vacias.push(f); } } else { rojos.push(f + ' · ' + v.slice(5)); }
}
console.log(JSON.stringify({ corridas: files.length, verdes, rojos, vacias }, null, 1));
process.exit(rojos.length || vacias.length ? 1 : 0);
