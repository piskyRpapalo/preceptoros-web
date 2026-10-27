import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
// NORTE 5 [3] (2026-10-27, decree ·6452880777): /play/ left; its two shell guards (skip-link to #juego-panel, the theGame h1)
// are retired to docs/pruebas-retiradas/norte5-eliminacion.py. The landing door stays guarded here.

function page(l) { return readFileSync(ROOT + 'public/' + l + 'index.html', 'utf8'); }

test('the landing door: skip-link to the doors, one h1 inside main', () => {
  const t = page('');
  if (!/class="skip" href="#doors"/.test(t) || !/<nav id="doors"/.test(t)) { throw new Error('landing: skip-link to #doors missing'); }
  const n = (t.match(/<h1\b/g) || []).length;
  if (n !== 1) { throw new Error('landing has ' + n + ' h1 (expected 1)'); }
  if (!/<main>[\s\S]*<h1>[\s\S]*<\/main>/.test(t)) { throw new Error('landing h1 is not inside main'); }
});

test('SABOTAJE: removing the landing skip-link from the template breaks this guardian', () => {
  let sinSkip = false;
  try {
    const t = readFileSync(ROOT + 'local_first_surface_build.py', 'utf8');
    sinSkip = !t.includes('<a class="skip" href="#doors">');
  } catch (e) { sinSkip = true; }
  if (sinSkip) { throw new Error('skip-link ausente de la plantilla: el guardián se pone rojo'); }
});
