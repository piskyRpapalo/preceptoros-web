// Dead-links cure (2026-10-26) · every house part and every place-card action points at something
// that exists. Measured before the cure in Chrome: Shell and Claws called the retired `taller` sheet,
// Buoy and Tombstones (and the inspector itself) clicked a `menu-<panel>` button that never existed,
// so a player who tapped a place saw nothing. Every case runs on the real sources (must be green) and
// on a sabotaged twin that puts one dead link back (must be red).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(join(RAIZ, r), 'utf8');
function carga(src, raiz) { const module = { exports: {} }; new Function('module', '__raiz', src.replace(/\}\)\(this\);\s*$/, '})(__raiz);'))(module, raiz || {}); return module.exports; }

const F = { shell: leer('public/assets/terminal_menu_shell.js'), medidas: leer('public/game/casa-medidas.js'),
  fichas: leer('public/game/reef_place_cards.js'), inspector: leer('public/game/piece_inspector.js') };
const SAB = { shell: F.shell, medidas: F.medidas.replace("['caparazon', '◉', 'ondas'", "['caparazon', '◉', 'taller'"),
  fichas: F.fichas.replace("{ id: 'receipts', label: 'Read tombstone receipts', panel: 'pliego-lapidas' }", "{ id: 'receipts', label: 'Read tombstone receipts', panel: 'pliego-tumbas' }"),
  inspector: F.inspector.replace("panel('pliego-ficha')", "panel('pliego-tarjeta')") };
const SAB2 = { ...F, fichas: F.fichas.replace('T = raiz.AtlasChatTerminal;', 'T = null;') };

// What the shell really builds: its sheets (hoja('id', ...)) and the panels inside each drawer group.
const hojas = (s) => [...s.matchAll(/hoja\('(\w+)'/g)].map((m) => m[1]);
const grupos = (s) => new Function('return ' + s.match(/var GRUPOS = (\{[\s\S]*?\});/)[1])();
const paneles = (s) => [].concat(...Object.values(grupos(s)));
const KINDS = ['boya', 'observatorio', 'lapidas', 'cristal', 'coral'];
const D = { centro: { x: 1, y: 2 }, coste: 8, medidas: 3, enlace: 'https://github.com/piskyRpapalo/lab/blob/main/x.md' };

function partes(S) {
  const M = carga(S.medidas), H = hojas(S.shell), malas = [];
  M.PARTES.forEach((p) => { const ok = p[2] === 'faro' || (p[2] === '' ? !!M.DENTRO[p[0]] : H.includes(p[2])); if (!ok) { malas.push(p[0] + ' -> ' + (p[2] || 'interior')); } });
  return malas.length ? 'dead: ' + malas.join(', ') : 'OK';
}
function acciones(S) {
  const C = carga(S.fichas), P = paneles(S.shell), malas = [];
  KINDS.forEach((k) => { const f = C.ficha(k, {}, D); if (!f.actions.length) { malas.push(k + ' has no action'); }
    f.actions.forEach((a) => { if (a.panel && !P.includes(a.panel)) { malas.push(k + '.' + a.id + ' -> ' + a.panel); } if (!a.panel && !a.href && !a.target && a.id !== 'measurements') { malas.push(k + '.' + a.id + ' has no target'); } }); });
  return malas.length ? 'dead: ' + malas.join(', ') : 'OK';
}
// Running the action opens its panel through the shell, not through a guessed menu button.
function ejecuta(S) {
  const abiertos = [], doc = { getElementById: (id) => (paneles(S.shell).includes(id) ? { id, hidden: true } : null) };
  const C = carga(S.fichas, { document: doc, AtlasChatTerminal: { panel: (id) => { abiertos.push(id); return true; } } });
  const malas = [];
  ['boya', 'lapidas'].forEach((k) => C.ficha(k, {}, D).actions.forEach((a) => { const r = C.ejecuta(a); if (!r.ok || abiertos.at(-1) !== a.panel) { malas.push(k + ': ' + (r.cause || 'panel not opened')); } }));
  return malas.length ? malas.join(', ') : 'OK';
}
function inspector(S) {
  const m = /AtlasChatTerminal/.test(S.inspector) && S.inspector.match(/\b\w+\.panel\('([\w-]+)'\)/), P = paneles(S.shell);
  if (/getElementById\('menu-/.test(S.inspector)) { return 'still guesses a menu-<panel> button'; }
  return m && P.includes(m[1]) && /panel\.id = '([\w-]+)'/.exec(S.inspector)[1] === m[1] ? 'OK' : 'the tapped card does not open its drawer';
}
function shell(S) { return /panel: function \(pid\)/.test(S.shell) && /abre\(g, false, true\)/.test(S.shell) ? 'OK' : 'the shell has no fixed open-by-panel'; }

const casos = [];
function caso(nombre, prueba, sab) {
  let real, rojo;
  try { real = prueba(F); } catch (e) { real = 'error: ' + e.message; }
  try { rojo = prueba(sab); } catch (e) { rojo = 'error: ' + e.message; }
  casos.push({ caso: nombre, ok: real === 'OK' && rojo !== 'OK', detalle: real + ' | sab ' + (rojo !== 'OK' ? 'ROJO' : 'VERDE?!') });
}
caso('every house part opens a sheet that exists, its interior, or the lighthouse', partes, SAB);
caso('every place-card action names a panel the drawer really holds, a link or a target', acciones, SAB);
caso('Buoy and Tombstones open their panel through the shell', ejecuta, SAB2);
caso('a tapped place opens the drawer that holds its card', inspector, SAB);
caso('the shell opens a panel by its id without toggling it shut', shell, { ...F, shell: F.shell.replace('abre(g, false, true)', 'abre(g, false)') });

console.log(JSON.stringify({ v: 'preceptoros.live_links/1', casos }, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
