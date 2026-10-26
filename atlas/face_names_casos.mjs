// P3 [1a] · world names at half size, in the comic letters of the bubble language, with the skin's
// own bands. Every case runs on the real sources (must be green) and on a sabotaged twin (must be red).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(join(RAIZ, r), 'utf8');
const req = createRequire(import.meta.url);
const B = req('../public/game/bubble_language.js');
const L = req('../public/game/bubble_letters.js');
const MUNDOS = ['basic', 'atlantis', 'zombie'];
const BASE = 24;   // measured size of the names before this piece (main 0478edc)

function carga(src) { const module = { exports: {} }; new Function('module', 'require', src)(module, req); return module.exports; }
const FUENTE = leer('public/face/face_world.js');
const REAL = { W: carga(FUENTE), pages: MUNDOS.map((m) => leer(`public/face/${m}.html`)) };
const SAB = {
  W: carga(FUENTE.replace("o: 'letters', x: p[0], y: p[1], tx: tx, sz: 12, f: skin.label, s: skin.halo, sh: [1, 1, skin.halo]",
    "o: 'text', x: p[0], y: p[1], tx: tx, sz: 24, f: skin.label, s: 'comic yellow.base', sh: [2, 2, skin.halo]").replace("n('the rift', 540, 270)", "n('the rift ☂', 540, 270)")),
  pages: REAL.pages.map((t, i) => i ? t : t.replace('<script src="/game/bubble_letters.js"></script>', '')),
};
const skin = (t) => JSON.parse(t.match(/id="skin"[^>]*>([^<]+)</)[1]);
const nombres = (W, t) => W.namesFrame(skin(t)).atoms[0].i;

const casos = [];
function caso(nombre, prueba) {
  let real, sab;
  try { real = prueba(REAL); } catch (e) { real = 'error: ' + e.message; }
  try { sab = prueba(SAB); } catch (e) { sab = 'error: ' + e.message; }
  casos.push({ caso: nombre, ok: real === true && sab !== true, detalle: (real === true ? 'OK' : 'ROJO ' + real) + ' | sab ' + (sab === true ? 'VERDE(mal)' : 'ROJO') });
}

caso('every world name is drawn in comic letters, never as plain text', (S) =>
  S.pages.every((t) => nombres(S.W, t).every((n) => n.o === 'letters')) || 'a name is plain text');
caso('names are at half the measured size (24 -> 12)', (S) =>
  S.pages.every((t) => nombres(S.W, t).every((n) => n.sz === BASE / 2)) || 'size is not half');
caso('letters use only the skin\'s own bands (no new palette)', (S) => S.pages.every((t) => {
  const f = S.W.namesFrame(skin(t));
  return f.atoms[0].i.every((n) => [n.f, n.s, n.sh[2]].every((b) => f.bands.includes(b)));
}) || 'a band outside the skin');
caso('every character of every name has a comic glyph', (S) =>
  S.pages.every((t) => nombres(S.W, t).every((n) => L.missing(n.tx).length === 0)) || 'a glyph is missing');
caso('the names frame compiles in the three worlds and stays under 1,024 B', (S) => S.pages.every((t) => {
  const f = S.W.namesFrame(skin(t));
  return Buffer.byteLength(JSON.stringify(f)) < 1024 && B.compile(f) && f.atoms[0].i.every((n) => n.o === 'letters');
}) || 'compile or size');
caso('the three worlds load the comic letters right after the bubble language', (S) =>
  S.pages.every((t) => t.indexOf('/game/bubble_letters.js') > t.indexOf('/game/bubble_language.js') && t.indexOf('/game/bubble_language.js') > 0) || 'load order');

console.log(JSON.stringify({ v: 'preceptoros.face_names/1', casos }, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
