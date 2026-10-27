// P2 · combat as its own screen (public/game/combat_screen.js, wired in ui-arena.js).
// Combat leaves the map page: own route, entered from the map, back to the map, lifecycle closed
// exactly once. Every case runs on the real code (must be green) and on a sabotaged copy (must be red).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(join(RAIZ, r), 'utf8');
const FUENTE = leer('public/game/combat_screen.js'), ARENA = leer('public/game/ui-arena.js');
const CSS = leer('public/assets/terminal_menu_shell.css'), JUEGO = leer('public/assets/thegame.js');

function carga(src) { const module = { exports: {} }; new Function('module', src)(module); return module.exports; }
const REAL = carga(FUENTE);
// The sabotaged twin forgets to settle the fight, never pushes its own route, and stays on an empty battle route.
const SAB = carga(FUENTE.replace('if (a.alSalir) { a.alSalir(); }', '')
  .replace("env.hist.pushState(null, '', RUTA); empujado = true;", 'empujado = false;')
  .replace("function alCargar() { if (!activo && env.loc.hash === RUTA) { env.hist.replaceState(null, '', MAPA); } }", 'function alCargar() {}'));
const ARENA_SAB = ARENA.replace('liquida(x);', 'if (info.alFin) { info.alFin(x); }');
const CSS_SAB = CSS.replace('html.con-combate .thegame-mapa,', '');

// A browser in miniature: a hash, a history stack whose Back fires hashchange, a class list, a log of sheets.
function navegador(API, hash) {
  const clases = new Set(), pila = [], vistas = [];
  const env = { doc: { documentElement: { classList: { add: (c) => clases.add(c), remove: (c) => clases.delete(c) } } },
    loc: { hash: hash || '#thegame/map' }, ve: (id) => vistas.push(id),
    hist: { pushState: (_, __, h) => { pila.push(env.loc.hash); env.loc.hash = h; },
            replaceState: (_, __, h) => { env.loc.hash = h; },
            back: () => { env.loc.hash = pila.pop(); s.alCambiarRuta(); } } };
  const s = API.crea(env);
  return { s, env, clases, pila, vistas };
}

const casos = [];
function caso(nombre, prueba) {
  let real, sab;
  try { real = prueba(REAL, ARENA, CSS); } catch (e) { real = 'error: ' + e.message; }
  try { sab = prueba(SAB, ARENA_SAB, CSS_SAB); } catch (e) { sab = 'error: ' + e.message; }
  casos.push({ caso: nombre, ok: real === true && sab !== true, detalle: (real === true ? 'OK' : 'ROJO ' + real) + ' | sab ' + (sab === true ? 'VERDE(mal)' : 'ROJO') });
}

caso('entering combat pushes its own route and shows the battle screen, not the map', (A) => {
  const b = navegador(A); b.s.entra({ alSalir: () => {} });
  return (b.env.loc.hash === A.RUTA && b.clases.has(A.CLASE) && b.vistas.join() === 'batalla' && b.pila.join() === '#thegame/map') ||
    [b.env.loc.hash, [...b.clases].join(), b.vistas.join()].join(' | ');
});
caso('the screen\'s own exit returns to the map and closes the fight exactly once', (A) => {
  const b = navegador(A); let n = 0; b.s.entra({ alSalir: () => n++ });
  b.s.sale(); b.s.sale(); b.s.alOcultarse({ hidden: true });
  return (n === 1 && b.env.loc.hash === '#thegame/map' && !b.clases.has(A.CLASE) && b.vistas.join() === 'batalla,') || [n, b.env.loc.hash].join(' | ');
});
caso('the browser\'s Back leaves combat the same way', (A) => {
  const b = navegador(A); let n = 0; b.s.entra({ alSalir: () => n++ });
  b.env.hist.back();
  return (n === 1 && b.env.loc.hash === '#thegame/map' && !b.clases.has(A.CLASE) && !b.s.activo()) || [n, b.env.loc.hash].join(' | ');
});
caso('closing the sheet (its button, Escape, a tap outside) leaves combat and the route', (A) => {
  const b = navegador(A); let n = 0; b.s.entra({ alSalir: () => n++ });
  b.s.alOcultarse({ hidden: true });
  return (n === 1 && b.env.loc.hash === '#thegame/map' && !b.clases.has(A.CLASE)) || [n, b.env.loc.hash].join(' | ');
});
caso('a new fight on screen settles the old one first and keeps ONE route entry', (A) => {
  const b = navegador(A); const log = []; b.s.entra({ alSalir: () => log.push('a') }); b.s.entra({ alSalir: () => log.push('b') });
  b.s.sale();
  return (log.join() === 'a,b' && b.pila.length === 0 && b.env.loc.hash === '#thegame/map') || [log.join(), b.pila.length, b.env.loc.hash].join(' | ');
});
caso('opening the battle route with no fight lands on the map', (A) => {
  const b = navegador(A, A.RUTA || '#thegame/battle'); b.s.alCargar();
  return b.env.loc.hash === '#thegame/map' && !b.clases.has(A.CLASE) || b.env.loc.hash;
});
caso('the arena settles a fight once: end, skip, replay or leaving early never count twice', (_, S) => {
  const juega = S.slice(S.indexOf('function juega('), S.indexOf('function monta('));
  return (/var aplicado = false, liquida = function \(x\) \{ if \(!aplicado && info\.alFin\) \{ aplicado = true; info\.alFin\(x\); \} \};/.test(juega) &&
    /pantalla\(function \(\) \{ liquida\(c\); if \(actual\) \{ actual\.para\(\); actual = null; \} \}\);/.test(juega) &&
    !/info\.alFin\(x\)/.test(juega.replace('liquida = function (x) { if (!aplicado && info.alFin) { aplicado = true; info.alFin(x); } };', ''))) || 'record can be applied twice';
});
caso('while a fight is on, the map, menu and drawer are not shown at all', (_, __, C) =>
  /html\.con-combate \.thegame-mapa,html\.con-combate \.thegame-menu,html\.con-combate \.thegame-terminal\{display:none\}/.test(C) || 'map still visible under combat');
caso('the screen loads with the arena, before the arena UI uses it', () =>
  (JUEGO.indexOf("'/game/combat_screen.js'") > 0 && JUEGO.indexOf("'/game/combat_screen.js'") < JUEGO.indexOf("'/game/ui-arena.js'")) || 'load order');

// The load-order case does not depend on the sabotaged inputs: it is checked once, without a twin.
const orden = casos.pop(); orden.ok = orden.detalle.startsWith('OK'); orden.detalle = orden.detalle.split(' | ')[0];
casos.push(orden);
console.log(JSON.stringify({ v: 'preceptoros.combat_screen/1', casos }, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
