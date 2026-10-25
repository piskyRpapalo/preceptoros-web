// P2 · map integrity contract (public/game/map_integrity.js + its use in public/game/sea.js).
// Combat may change only a bounded battle record; the map draws nothing combat could make undefined.
// Every case runs on the real code (must be green) and on a sabotaged copy (must be red).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(join(RAIZ, r), 'utf8');
const MI = createRequire(import.meta.url)('../public/game/map_integrity.js');
const SEA = leer('public/game/sea.js'), JUEGO = leer('public/assets/thegame.js'), LISTAS = leer('public/sw-listas.js');
const PUERTA = leer('public/game/ui-arena.js') + leer('public/game/ui-arena-comun.js');

// Sabotaged twins: an integrity module that lets everything through, and sea.js without its guards.
const MI_SAB = { record: (r) => r || {}, punto: () => true, texto: (t) => t, jugador: () => true, TOPE: MI.TOPE };
const SEA_SAB = SEA.replace(/MI\.record\(([^;]*?), f\.lugares\(\)\)/g, '$1')
  .replace(/\n\s*if \(!MI\.punto\(a\) \|\| !MI\.punto\(b\)\) \{ return; \}/g, '')
  .replace(/\n\s*txt = MI\.texto\(txt\);\n\s*if \(!txt \|\| !MI\.punto\(\[x, y\]\)\) \{ return; \}/, '');
const JUEGO_SAB = JUEGO.replace("['/game/map_integrity.js'], ", '');
const PUERTA_SAB = PUERTA.replace('.filter(function (d) { return !MI || MI.jugador(d); })', '')
  .replace("(typeof l.pseudo === 'string' && l.pseudo.trim()) || 'Player ' + String(l.huella || '').slice(0, 8)", 'l.pseudo');

const lugares = [{ clave: 'npc:a' }, { clave: 'p:b' }];
const crudo = { 'npc:a': { g: 2, p: 1, extra: 'x' }, 'p:b': { g: NaN, p: -3 }, 'npc:fantasma': { g: 1, p: 0 },
  'npc:x': 'undefined', __proto__x: { g: 1 } };

const casos = [];
function caso(nombre, prueba) {
  let real, sab;
  try { real = prueba(MI, SEA, JUEGO, PUERTA); } catch (e) { real = 'error: ' + e.message; }
  try { sab = prueba(MI_SAB, SEA_SAB, JUEGO_SAB, PUERTA_SAB); } catch (e) { sab = 'error: ' + e.message; }
  casos.push({ caso: nombre, ok: real === true && sab !== true, detalle: (real === true ? 'OK' : 'ROJO ' + real) + ' | sab ' + (sab === true ? 'VERDE(mal)' : 'ROJO') });
}

caso('the record keeps only known places, as bounded integers {g, p}', (M) => {
  const r = M.record(crudo, lugares);
  return JSON.stringify(r) === JSON.stringify({ 'npc:a': { g: 2, p: 1 } }) || JSON.stringify(r);
});
caso('the record is frozen: drawing code cannot add to it', (M) => {
  const r = M.record(crudo, lugares);
  return (Object.isFrozen(r) && Object.isFrozen(r['npc:a'])) || 'mutable';
});
caso('out-of-range counts are not geometry: Infinity, floats, above the cap read as 0', (M) => {
  const r = M.record({ 'npc:a': { g: Infinity, p: 1.5 }, 'p:b': { g: M.TOPE + 1, p: 0 } }, lugares);
  return JSON.stringify(r) === '{}' || JSON.stringify(r);
});
caso('a point is two finite numbers, nothing else', (M) =>
  [[1, 2], [0, -5.5]].every(M.punto) &&
  [undefined, null, [NaN, 1], [1, Infinity], ['1', 2], [3], {}].every((p) => !M.punto(p)) || 'a bad point passes');
caso('a label is real text: never the spelling of a missing value', (M) =>
  M.texto(' Reef gate ') === 'Reef gate' &&
  [undefined, null, 7, '', '  ', 'undefined', 'NaN', 'null', '[object Object]', 'Rift · undefined', 'x NaN y']
    .every((t) => M.texto(t) === '') || 'a missing value would be drawn as text');
caso('sea.js reads the battle record ONLY through the contract (fog and places)', (_, S) => {
  const usos = (S.match(/f\.luchados/g) || []).length, guardados = (S.match(/MI\.record\([^;]*f\.luchados[^;]*\)/g) || []).length;
  return (usos === 4 && guardados === 2) || ('luchados uses ' + usos + ', through MI.record ' + guardados);
});
caso('sea.js draws lines only between finite points (enlace and pulso refuse the rest)', (_, S) =>
  (S.match(/if \(!MI\.punto\(a\) \|\| !MI\.punto\(b\)\) \{ return; \}/g) || []).length === 2 || 'a line primitive is unguarded');
caso('sea.js draws text through ONE guarded primitive (rotulo)', (_, S) => {
  const textos = (S.match(/\.fillText\(/g) || []).length;
  return (textos === 1 && /txt = MI\.texto\(txt\);\s*if \(!txt \|\| !MI\.punto\(\[x, y\]\)\) \{ return; \}/.test(S)) || 'fillText ' + textos + ' or rotulo unguarded';
});
caso('a player enters the map only as a well-formed envelope', (M) => {
  const bueno = { huella: 'f1', sobre: { de: 'k1', cuerpo: { tropas: [{ semilla: 's', tc: 'tc1' }] } } };
  const malos = [null, {}, { huella: 'f', sobre: { cuerpo: bueno.sobre.cuerpo } }, { huella: 'f', sobre: { de: 'k', cuerpo: { tropas: [] } } },
    { huella: 'f', sobre: { de: 'k', cuerpo: { tropas: [{ tc: 'tc1' }] } } }, { sobre: bueno.sobre }];
  return (M.jugador(bueno) && malos.every((d) => !M.jugador(d))) || 'a malformed player passes';
});
caso('the arena door admits only valid players and never names one by a missing value', (_, __, ___, A) =>
  (A.includes('.filter(function (d) { return !MI || MI.jugador(d); })') &&
   A.includes("(typeof l.pseudo === 'string' && l.pseudo.trim()) || 'Player ' + String(l.huella || '').slice(0, 8)")) || 'door or name unguarded');
caso('the contract loads before the map, and the shell caches it', (_, __, J) =>
  (J.indexOf("'/game/map_integrity.js'") > 0 && J.indexOf("'/game/map_integrity.js'") < J.indexOf("'/game/sea.js'") &&
   LISTAS.includes("'/game/map_integrity.js'")) || 'load order or cache');

console.log(JSON.stringify({ v: 'preceptoros.map_integrity/1', casos }, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
