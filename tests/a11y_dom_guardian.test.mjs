import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
// English canon until MVP (2026-10-25): the game shell lives at /play/; the root is the door (checked below).
const LENS = ['play/'];

function page(l) { return readFileSync(ROOT + 'public/' + l + 'index.html', 'utf8'); }

test('skip-link exists in every portada, visible-on-focus, points to the game panel', () => {
  for (const l of LENS) {
    const t = page(l);
    if (!/class="skip-link" href="#juego-panel"/.test(t)) {
      throw new Error('skip-link ausente en la portada ' + (l || 'raíz'));
    }
  }
});

test('one h1 per portada, inside main, visually quiet (cab-h1)', () => {
  for (const l of LENS) {
    const t = page(l);
    const n = (t.match(/<h1\b/g) || []).length;
    if (n !== 1) { throw new Error('portada ' + (l || 'raíz') + ' tiene ' + n + ' h1 (esperado 1)'); }
    if (!/aria-label="theGame"><h1 class="cab-h1">theGame<\/h1>/.test(t)) {
      throw new Error('h1 no está en el main con cab-h1 en ' + (l || 'raíz'));
    }
  }
});

test('the landing door: skip-link to the doors, one h1 inside main', () => {
  const t = page('');
  if (!/class="skip" href="#doors"/.test(t) || !/<nav id="doors"/.test(t)) { throw new Error('landing: skip-link to #doors missing'); }
  const n = (t.match(/<h1\b/g) || []).length;
  if (n !== 1) { throw new Error('landing has ' + n + ' h1 (expected 1)'); }
  if (!/<main>[\s\S]*<h1>[\s\S]*<\/main>/.test(t)) { throw new Error('landing h1 is not inside main'); }
});

test('SABOTAJE: removing the skip-link from the template breaks this guardian', () => {
  let sinSkip = false;
  try {
    const t = readFileSync(ROOT + 'local_first_surface_build.py', 'utf8');
    sinSkip = !t.includes('skip-link');
  } catch (e) { sinSkip = true; }
  if (sinSkip) { throw new Error('skip-link ausente de la plantilla: el guardián se pone rojo'); }
});
