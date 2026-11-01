// P3 [1b] · preserved face worlds keep combat in their own panel; the neutral terminal is not a face.
// Every case runs on the real sources (must be green) and on a sabotaged twin (must be red).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(join(RAIZ, r), 'utf8');
const FACE_WORLDS = ['atlantis', 'zombie'];
const REAL = {
  fight: leer('public/face/face_fight.js'), stage: leer('public/face/face_fight_stage.js'), css: leer('public/face/face_views.css'),
  pages: FACE_WORLDS.map((m) => leer(`public/face/${m}.html`)), basic: leer('public/face/basic.html'), listas: leer('public/sw-listas.js'),
};
const SAB = {
  fight: REAL.fight.replace('H.extra(null, null);', 'H.extra(function (g, toScreen, z) { fight.paint(g, toScreen, z, quiet()); }, null);')
    .replace("if (H.sound()) {", 'H.focus(Bt.field);\n    if (H.sound()) {'),
  stage: REAL.stage.replace("lienzo.id = 'b-stage';", "lienzo.id = 'mapa';").replace("doc.querySelectorAll('.stage-sheet .sheet-head')", "doc.querySelectorAll('#sheet-battle .sheet-head')"),
  css: REAL.css.replace('body[data-battle=on] #sheet-battle{inset:0;max-height:none}', 'body[data-battle=on] #sheet-battle{top:auto;max-height:48%}')
    .replace('#sheet-battle .fight-stage{grid-column:2;grid-row:1/span 4', '#sheet-battle .fight-stage{grid-column:1;grid-row:auto'),
  pages: REAL.pages.map((t, i) => i ? t : t.replace('<script src="/face/face_fight_stage.js"></script>', '')),
  basic: REAL.basic.replace('/game/colony_controls.js', '/game/missing_colony_controls.js'),
  listas: REAL.listas.replace("'/face/face_fight_stage.js',", ''),
};

const casos = [];
function caso(nombre, prueba) {
  let real, sab;
  try { real = prueba(REAL); } catch (e) { real = 'error: ' + e.message; }
  try { sab = prueba(SAB); } catch (e) { sab = 'error: ' + e.message; }
  casos.push({ caso: nombre, ok: real === true && sab !== true, detalle: (real === true ? 'OK' : 'ROJO ' + real) + ' | sab ' + (sab === true ? 'VERDE(mal)' : 'ROJO') });
}

caso('the fight registers NO painter on the world map', (S) =>
  (S.fight.includes('H.extra(null, null);') && !/H\.extra\(function/.test(S.fight)) || 'a map painter is registered');
caso('starting a fight does not move the world camera', (S) => !S.fight.includes('H.focus(Bt.field)') || 'the map camera jumps to the field');
// [W] O1b (2026-10-27): the stage no longer paints by itself; it mounts the ONE combat face, the wave duel, live.
caso('the fight paints only on its own canvas (#b-stage), through the wave duel (H.battle.duel)', (S) =>
  (S.stage.includes("lienzo.id = 'b-stage';") && S.stage.includes('W.escena(lienzo, d.def, d.asa, d.combate,') && S.fight.includes('duel: function () { return fight.b.on ? fight.duel() : null; }')) || 'stage canvas or paint hook missing');
caso('during a fight the battle panel covers the whole map area', (S) =>
  (S.css.includes('body[data-battle=on] #sheet-battle{inset:0;max-height:none}') && !S.css.includes('max-height:48%')) || 'panel still in half of the map');
caso('texts on the left, the fight on the right (one column on a phone)', (S) =>
  (/#sheet-battle \.fight-stage\{grid-column:2;grid-row:1\/span 4/.test(S.css) && /@media \(max-width:640px\)/.test(S.css)) || 'layout');
caso('every panel that covers the map gets an "×" back to the map', (S) =>
  (S.stage.includes("doc.querySelectorAll('.stage-sheet .sheet-head')") && S.stage.includes("doc.getElementById('tab-map')") &&
   S.stage.includes("x.setAttribute('aria-label', 'Close and return to the map')")) || '× missing on some panel');
caso('the two face worlds load the stage after the fight, and the shell caches it', (S) =>
  (S.pages.every((t) => t.indexOf('/face/face_fight_stage.js') > t.indexOf('/face/face_fight.js') && t.indexOf('/face/face_fight.js') > 0) &&
   S.listas.includes("'/face/face_fight_stage.js'")) || 'load order or cache');
caso('the neutral terminal loads shared controls without face combat assets', (S) =>
  (S.basic.includes('/game/colony_controls.js') && S.basic.includes('/face/face_openworld_terminal.js') &&
   !S.basic.includes('/face/face_fight.js') && !S.basic.includes('/face/face_fight_stage.js')) || 'neutral terminal control or face isolation');

console.log(JSON.stringify({ v: 'preceptoros.face_battle_screen/1', casos }, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
