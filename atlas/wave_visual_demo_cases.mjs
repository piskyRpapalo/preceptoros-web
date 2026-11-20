// WAVE-VISUAL-01 · Piece C cases: the isolated demo reuses the real modules and the measured claims hold.
// Static audit of the only served-by-hand page (atlas/demo, never public/). Run twice:
//   node atlas/wave_visual_demo_cases.mjs
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const G = require('../public/game/gacha.js');
const N = require('./puros/wave_names.js');

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, 'demo/wave_visual_01.html');
const html = readFileSync(file, 'utf8');
const results = [];
function check(name, ok, detail) {
  results.push(ok ? { caso: name, ok: true } : { caso: name, ok: false, detalle: detail == null ? '' : String(detail) });
}
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

// 1 · the page is a real, standalone document
check('doctype and lang', /^<!doctype html>/i.test(html) && /<html lang="en">/.test(html));
check('viewport is declared', /name="viewport"/.test(html) && /width=device-width/.test(html));
check('meta description is declared', /name="description"/.test(html) && /read-only prototype/.test(html));
check('title names the mission', /<title>WAVE-VISUAL-01/.test(html));
// 2 · it loads the real game modules and the two new pure pieces, and every source exists
const wanted = [
  ['../../public/game/values.js', 'public/game/values.js'],
  ['../../public/game/gacha.js', 'public/game/gacha.js'],
  ['../../public/game/wave_render.js', 'public/game/wave_render.js'],
  ['../puros/wave_names.js', 'atlas/puros/wave_names.js'],
  ['../puros/crab_invoke.js', 'atlas/puros/crab_invoke.js']
];
for (const [src, path] of wanted) {
  check('loads ' + path, scripts.some((s) => s.endsWith(src)), scripts.join(' | '));
  check('exists ' + path, existsSync(resolve(here, 'demo', src)), resolve(here, 'demo', src));
}
check('loads values before gacha', scripts.findIndex((s) => s.endsWith('values.js')) < scripts.findIndex((s) => s.endsWith('gacha.js')));
check('loads gacha before wave_render', scripts.findIndex((s) => s.endsWith('gacha.js')) < scripts.findIndex((s) => s.endsWith('wave_render.js')));
check('loads waves before the adapter', scripts.findIndex((s) => s.endsWith('gacha.js')) < scripts.findIndex((s) => s.endsWith('wave_names.js')));
// 3 · 44 px targets, keyboard shortcuts and an accessible name on every key
check('buttons are at least 44 px tall', /\.bar button\s*\{[^}]*min-height:\s*44px/.test(html));
check('buttons are at least 44 px wide', /\.bar button\s*\{[^}]*min-width:\s*44px/.test(html));
check('the bar is a labelled group', /role="group"[^>]*aria-label="Crab invocation/.test(html) || /aria-label="Crab invocation[^>]*role="group"/.test(html));
check('keys expose aria-keyshortcuts', html.includes("setAttribute('aria-keyshortcuts', a.key)"));
check('no aria-label overrides the visible key label', !html.includes("b.setAttribute('aria-label'"));
check('a visible NO_DATA badge is inside the key', html.includes("doc.createElement('small')") && html.includes("why.textContent = p.ok ? '' : 'NO_DATA'"));
check('an unavailable key speaks its cause', html.includes("sr.className = 'sr'") && html.includes("' unavailable: ' + p.cause") && /\.sr\s*\{[^}]*clip:/.test(html));
check('buttons are declared type=button', html.includes("b.type = 'button'"));
check('unavailable keys are still honest, not hidden', html.includes("aria-disabled") && !/\.bar button\s*\{[^}]*display:\s*none/.test(html));
check('unavailable keys say NO_DATA in words', html.includes("why.textContent = p.ok ? '' : 'NO_DATA'"));
check('the off state is not colour alone', /\.bar small\s*\{/.test(html) && html.includes("doc.createElement('small')"));
// 4 · the log is announced, not just coloured
check('the log is a polite status region', /id="log"[^>]*role="status"[^>]*aria-live="polite"/.test(html));
// 5 · reduced motion is honoured from the system and can be forced
check('CSS honours prefers-reduced-motion', html.includes('prefers-reduced-motion: reduce'));
check('JS reads the same media query', html.includes("matchMedia('(prefers-reduced-motion: reduce)')"));
check('reduced motion stops the loop', html.includes('cancelAnimationFrame') && /if \(still\(\)\)\s*\{\s*paint\(0\)/.test(html));
check('a visible switch can force stillness', /id="reduced"/.test(html) && html.includes('forced = reducedBox.checked'));
// 6 · no audio can exist before consent
for (const word of ['AudioContext', 'webkitAudioContext', 'new Audio', 'sonidos', 'suena(']) {
  check('no audio surface: ' + word, !html.includes(word));
}
// 7 · the page plans, it never executes a signed operation
check('the page uses the pure controller', html.includes('C.plan(') && html.includes('C.bar(ctx)'));
for (const forbidden of ['game.summon', 'game.hatch', 'adopta(', 'appendAdoption', '.sign(']) {
  check('no execution path: ' + forbidden, !html.includes(forbidden));
}
check('the press only logs the plan', /function run\(id\)\s*\{\s*var p = C\.plan\(id, ctx\);/.test(html));
// 8 · no network, storage or invented state
for (const word of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage']) {
  check('no side channel: ' + word, !html.includes(word));
}
check('the visit fixture is declared as a fixture', html.includes('not a signed visit'));
check('the demo never claims authority', !/firma|recibo|signature/i.test(html));
// 9 · the identity is read from the measured wave, not typed by hand
check('names come from the adapter', html.includes('N.nombre(w)') && html.includes('N.describe(w)'));
check('edges come from the roll', html.includes('w.aristas'));
check('the seed is shown as measured', html.includes('w.semilla.slice(0, 8)'));
// 9b · the four demo seeds are real: the engine still rolls their edges, and the names are distinct
const seeds = [...html.matchAll(/tc[1-4]: '([0-9a-f]{64})'/g)].map((m) => m[1]);
check('demo declares four measured seeds', seeds.length === 4, seeds.length);
if (seeds.length === 4) {
  const demoWaves = seeds.map((s, i) => G.tirada(s, 'tc' + (i + 1)));
  check('demo seeds roll 3/5/8/12 edges', JSON.stringify(demoWaves.map((w) => w.aristas)) === JSON.stringify([3, 5, 8, 12]),
    JSON.stringify(demoWaves.map((w) => w.aristas)));
  check('demo waves carry four distinct names', new Set(demoWaves.map((w) => N.describe(w).id)).size === 4,
    demoWaves.map((w) => N.describe(w).id).join(' '));
  check('demo names match the adapter', demoWaves.every((w) => N.nombre(w) && N.describe(w).ok === true));
}
// 10 · the artifact is small enough to hand over
const bytes = statSync(file).size;
check('demo is under 32 KiB', bytes < 32 * 1024, bytes + ' B');

const fail = results.filter((c) => !c.ok);
console.log('WAVE-VISUAL-DEMO ' + (fail.length ? 'ROJO' : 'VERDE') + ' · ' + results.length + ' cases · ' + fail.length + ' failures · ' + bytes + ' B');
console.log(JSON.stringify({ casos: results }));
process.exitCode = fail.length ? 1 : 0;
