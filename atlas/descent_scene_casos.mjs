// atlas/descent_scene_casos.mjs · la historia de la Estatua escrita en la lengua de burbuja (v2).
// Uso: node atlas/descent_scene_casos.mjs · rc 0 solo si todos los casos pasan. Node 22, ESM, sin dependencias.
// Si el nucleo de la lengua (public/game/bubble_language.js) aun no esta, los casos de dibujo salen
// NO_DATA con su causa y no cuentan como verdes: la entrega exige que pasen con el nucleo presente.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { checkFrame } from './param_gate.mjs';

const req = createRequire(import.meta.url);
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const ORDEN = ['OPEN', 'CLIFF', 'START', 'TREMOR', 'SPLIT', 'FALL', 'GATE'];
const VETADAS = ['death', 'dead', 'die', 'fire', 'burn', 'monster', 'teeth', 'scream', 'blood', 'kill', 'fear',
  'skull', 'fang', 'knife', 'oracle', 'notary', 'depin', 'token', 'currency', 'clearing', 'magic'];
const casos = [];
const caso = (n, nombre, ok, medida) => casos.push(medida === undefined ? { caso: n, nombre, ok: !!ok } : { caso: n, nombre, ok: !!ok, medida });

const S = req(ruta('../public/assets/descent_scene.js'));
const NUCLEO = ruta('../public/game/bubble_language.js');
let A = null, causaNucleo = null;
if (existsSync(NUCLEO)) {
  try {
    for (const m of ['../public/game/bubble_light.js', '../public/game/bubble_bestiary.js', '../public/game/bubble_world.js', '../public/game/bubble_letters.js']) {
      if (existsSync(ruta(m))) req(ruta(m));
    }
    A = req(NUCLEO);
  } catch (e) { causaNucleo = 'el nucleo no carga: ' + e.message; }
} else { causaNucleo = 'public/game/bubble_language.js no existe todavia'; }
globalThis.AtlasBubble = A || undefined;

// 1 · las siete secciones, en orden, con su lienzo
caso(1, 'SECTIONS = las 7 del acantilado y CANVAS 412x515', JSON.stringify(S.SECTIONS) === JSON.stringify(ORDEN)
  && S.CANVAS.w === 412 && S.CANVAS.h === 515 && S.PAGES === S.SECTIONS);

// 2 · cada silaba pasa el gate de parametros
const bytes = {};
caso(2, 'cada fotograma pasa checkFrame (< 1.024 B, bandas nombradas)', ORDEN.every((id) => {
  const r = checkFrame(S.frame(id)); bytes[id] = r.bytes; return r.ok;
}), bytes);

// 3 · determinismo del fotograma y del dibujo
const igualF = ORDEN.every((id) => JSON.stringify(S.frame(id)) === JSON.stringify(S.frame(id)));
let igualI = null, items = {};
if (A) {
  try {
    igualI = ORDEN.every((id) => { const a = JSON.stringify(S.items(id)); items[id] = JSON.parse(a); return a === JSON.stringify(S.items(id)); });
  } catch (e) { igualI = false; causaNucleo = 'compile lanza: ' + e.message; }
}
caso(3, 'determinismo: frame() y items() dos veces dan el mismo JSON', igualF && igualI === true,
  igualI === null ? 'NO_DATA: ' + causaNucleo : undefined);

// 4 · colores del dibujo: solo literales de banda
if (A) {
  /* Una banda base declarada cubre las cuatro de su familia (la luz pone brillo y sombra de esa familia; §4). */
  const fam = (b) => ['base', 'brillo', 'sombra', 'contorno'].map((x) => b + '.' + x);
  const ok = new Set(['ink', 'paper', 'ocean', 'cyan', ...fam('vermilion'), ...fam('comic yellow'), ...fam('FIRMADO')]
    .map((n) => { try { return A.band(n); } catch (e) { return null; } }).filter(Boolean));
  const fuera = [];
  const mira = (lista) => lista.forEach((it) => {
    ['fill', 'stroke', 'shadowFill'].forEach((k) => { if (it[k] != null && !ok.has(it[k])) fuera.push(String(it[k])); });
    if (it.items) mira(it.items);
  });
  Object.values(items).forEach(mira);
  caso(4, 'el dibujo solo pinta literales de banda', fuera.length === 0 && Object.keys(items).length === 7, fuera.slice(0, 5));
} else { caso(4, 'el dibujo solo pinta literales de banda', false, 'NO_DATA: ' + causaNucleo); }

// 5 · dos intros completas y sin palabras vetadas
const texto = [];
const intros = ['kids', 'tech'].every((m) => ORDEN.every((id) => {
  const t = S.TEXT[m] && S.TEXT[m][id];
  if (!t || !t.h || !Array.isArray(t.p) || !t.p.length || !t.sound) return false;
  texto.push(t.h, t.sound, ...t.p); return true;
}));
ORDEN.forEach((id) => S.frame(id).atoms.forEach((a) => texto.push(a.r)));
const malas = VETADAS.filter((w) => texto.some((x) => new RegExp('\\b' + w + '\\b', 'i').test(x)));
caso(5, 'dos intros completas (kids y tech) y sin palabras vetadas', intros && malas.length === 0, malas);

// 6 · pureza del fuente
const fuente = readFileSync(ruta('../public/assets/descent_scene.js'), 'utf8');
const impuro = ['document', 'Date', 'Math.random', 'fetch', 'localStorage'].filter((p) => fuente.includes(p))
  .concat(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(fuente) ? ['literal de color'] : []);
caso(6, 'el fuente es puro (sin DOM, reloj, azar, red, almacen ni colores)', impuro.length === 0, impuro);

// 7 · el violeta solo con su texto
const violeta = ORDEN.filter((id) => S.frame(id).bands.includes('FIRMADO.base'))
  .every((id) => S.frame(id).atoms.some((a) => /violet|signed/i.test(a.r)));
caso(7, 'todo fotograma con FIRMADO.base lo explica en su texto (violet / signed)', violeta);

// 8 · sabotaje: un color crudo no pasa el gate
const sab = S.frame('CLIFF'); sab.atoms[3].i[0].f = '#123456';
caso(8, 'sabotaje: un color crudo no pasa checkFrame', !checkFrame(sab).ok);

// 9 · keep reusa: START dibuja todo CLIFF y algo mas
caso(9, 'keep: START contiene el dibujo de CLIFF y mas', A ? (items.START || []).length > (items.CLIFF || []).length : false,
  A ? { CLIFF: (items.CLIFF || []).length, START: (items.START || []).length } : 'NO_DATA: ' + causaNucleo);

// 10 · las dos puertas estan dichas en GATE
caso(10, 'GATE nombra las dos puertas', S.frame('GATE').atoms.some((a) => /Check the rift/.test(a.r) && /account/.test(a.r)));

// 11-15 · el pulso (pulido, FIRMO 2026-10-18): el dibujo se mueve con el scroll, p en [0, 1).
const J = (x) => JSON.stringify(x);
const PS = [0, 0.37, 0.99];
if (A) {
  const roto = [];
  ORDEN.forEach((id) => PS.forEach((p) => { if (J(S.fondo(id).concat(S.frente(id, p))) !== J(S.items(id, p))) roto.push(id + '@' + p); }));
  caso(11, 'capas: fondo + frente(p) pinta lo mismo que items(id, p)', roto.length === 0, roto);
  const quietas = ORDEN.filter((id) => J(S.items(id, 0)) === J(S.items(id, 0.37)));
  caso(12, 'cada seccion se mueve: items(id, 0) distinto de items(id, 0.37)', quietas.length === 0, quietas);
  const antes = J(ORDEN.map((id) => S.frame(id)));
  const dos = ORDEN.every((id) => J(S.items(id, 0.37)) === J(S.items(id, 0.37)));
  caso(13, 'determinismo: mismo p, mismo dibujo; las silabas no mutan', dos && antes === J(ORDEN.map((id) => S.frame(id))));
  const sq = [];
  for (let k = 0; k < 48; k++) {
    J(S.pose('FALL', k / 48)).replace(/"sq":\[([-\d.]+),([-\d.]+)\]/g, (_, a, b) => { sq.push(+a, +b); return ''; });
  }
  caso(14, 'FALL: el bote aplasta como mucho 1.12 x 0.88 y nada se rompe', sq.every((v) => v >= 0.88 && v <= 1.12),
    { min: Math.min(...sq, 1), max: Math.max(...sq, 1), n: sq.length });
  caso(15, 'sin p (reduced motion) sale el fotograma estatico', ORDEN.every((id) => J(S.items(id)) === J(S.items(id, undefined))
    && J(S.items(id, 'x')) === J(S.items(id))));
} else {
  [11, 12, 13, 14, 15].forEach((n) => caso(n, 'el pulso', false, 'NO_DATA: ' + causaNucleo));
}

const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
