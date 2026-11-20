// WAVE-VISUAL-01 · Piece A cases: the measured wave gets one deterministic mathematical name.
// The source of edges is gacha.tirada; this adapter only reads. Run twice for the mission receipt:
//   node atlas/wave_names_cases.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const N = require('./puros/wave_names.js');
const G = require('../public/game/gacha.js');
const K = require('../public/game/canon.js');

const results = [];
function check(name, ok, detail) {
  results.push(ok ? { caso: name, ok: true } : { caso: name, ok: false, detalle: detail == null ? '' : String(detail) });
}
const sha = (s) => K.sha('wave-visual-01:names:' + s);
const waves = ['tc1', 'tc2', 'tc3', 'tc4'].map((tc, i) => G.tirada(sha(tc + ':' + i), tc));
const clone = (x) => JSON.parse(JSON.stringify(x));

// 1 · every live wave is named from its own measured edge count, never from geometry or a recount
for (const w of waves) {
  const s = N.shape(w), want = w.aristas > 12 ? 'Leviathan' : N.TABLE[w.aristas];
  check('shape is ok for ' + w.tc, s.ok === true, JSON.stringify(s));
  check('shape has no re-rolled edges for ' + w.tc, s.edges === w.aristas, s.edges + ' != ' + w.aristas);
  check('name follows the declared table for ' + w.tc, s.name === want, s.name + ' != ' + want);
  check('id is a stable machine word for ' + w.tc,
    s.id === (w.aristas > 12 ? 'wave.leviathan' : 'wave.' + want.toLowerCase()) + '.' + w.aristas, s.id);
  check('short title names the edges for ' + w.tc, N.nombre(w) === want + ' · ' + w.aristas + ' edges', N.nombre(w));
}
// 2 · deterministic: two calls give byte-identical records
for (const w of waves) {
  check('shape is deterministic for ' + w.tc, JSON.stringify(N.shape(w)) === JSON.stringify(N.shape(w)));
  check('describe is deterministic for ' + w.tc, JSON.stringify(N.describe(w)) === JSON.stringify(N.describe(w)));
  check('label is deterministic for ' + w.tc, N.label(w) === N.label(w));
}
// 3 · provenance and affixes are conserved, not re-rolled or translated
for (const w of waves) {
  const d = N.describe(w);
  check('describe keeps tier for ' + w.tc, d.tc === w.tc);
  check('describe keeps rarity for ' + w.tc, d.rarity === w.rareza);
  check('describe keeps prefix for ' + w.tc, d.prefix === (w.prefijo || null));
  check('describe keeps suffix for ' + w.tc, d.suffix === (w.sufijo || null));
  if (w.prefijo || w.sufijo) {
    check('label keeps the affixes for ' + w.tc, w.prefijo ? N.label(w).includes(w.prefijo) : N.label(w).includes(w.sufijo), N.label(w));
  }
}
// 4 · the whole measured band reaches the live tables (3..16); 3..12 are distinct, 13..16 distinct Leviathans
const ids = new Set();
for (let n = 3; n <= 16; n++) {
  const w = { aristas: n, semilla: sha('band:' + n), tc: 'tc1', rareza: 'normal', prefijo: null, sufijo: null };
  const d = N.describe(w);
  check('band ' + n + ' is named', d.ok === true && typeof d.name === 'string' && d.name.length > 0, JSON.stringify(d));
  check('band ' + n + ' has a unique id', !ids.has(d.id), d.id);
  ids.add(d.id);
  if (n <= 12) { check('band ' + n + ' keeps its own name', d.name === N.TABLE[n], d.name); }
  else { check('band ' + n + ' is a Leviathan', d.name === 'Leviathan', d.name); }
}
// 5 · negatives: absent or out-of-band edges never invent a name
for (const bad of [null, {}, { aristas: 2 }, { aristas: 17 }, { aristas: '4' }, { aristas: 4.5 }, []]) {
  const s = N.shape(bad);
  check('bad wave is refused: ' + JSON.stringify(bad), s.ok === false && typeof s.cause === 'string', JSON.stringify(s));
  check('bad wave has no title: ' + JSON.stringify(bad), N.nombre(bad) === null);
}
check('missing edges says edges_missing', N.shape({}).cause === 'edges_missing');
check('out-of-range edges says edges_out_of_range', N.shape({ aristas: 17 }).cause === 'edges_out_of_range');
check('missing troop says troop_missing', N.shape(null).cause === 'troop_missing');
// 6 · provenance negatives: shape may exist, but no identity is claimed without a measured seed/tier/rarity
for (const patch of [{ semilla: '' }, { semilla: 'f'.repeat(63) }, { tc: 'tc9' }, { rareza: '' }]) {
  const w = Object.assign(clone(waves[1]), patch), d = N.describe(w);
  check('provenance refused: ' + JSON.stringify(patch), d.ok === false && d.cause === 'provenance_missing', JSON.stringify(d));
  check('provenance refused has no label: ' + JSON.stringify(patch), N.label(w) === null);
}
// 7 · sabotage: a tampered wave degrades honestly; a non-string affix is null, not a made-up word
const tampered = clone(waves[0]); delete tampered.aristas;
check('sabotage: deleted aristas is refused', N.shape(tampered).ok === false && N.label(tampered) === null);
const weird = clone(waves[0]); weird.prefijo = { renamed: 'atlante' };
check('sabotage: an object affix is not printed', N.describe(weird).prefix === null, JSON.stringify(N.describe(weird)));
// 8 · purity and vocabulary
const src = readFileSync(new URL('./puros/wave_names.js', import.meta.url), 'utf8');
for (const word of ['Math.random', 'Date', 'performance', 'fetch(', 'XMLHttpRequest', 'document', 'localStorage', 'AudioContext']) {
  check('pure source: no ' + word, !src.includes(word));
}
for (const banned of ['oraculo', 'notario', 'depin', 'token', 'moneda', 'clearing', 'magia']) {
  check('vocabulary: no ' + banned, !src.toLowerCase().includes(banned));
}
// 9 · the existing display hook keeps working: army-wave-panel asks renderOnda.nombre(t)
const panel = readFileSync(new URL('../public/game/army-wave-panel.js', import.meta.url), 'utf8');
check('panel still asks renderOnda.nombre', panel.includes('renderOnda.nombre'));
const onda = { nombre: N.nombre };
check('adapter fills the panel hook', typeof onda.nombre === 'function' && onda.nombre(waves[0]) === N.nombre(waves[0]) && onda.nombre(waves[0]) !== null);

const fail = results.filter((c) => !c.ok);
console.log('WAVE-NAMES ' + (fail.length ? 'ROJO' : 'VERDE') + ' · ' + results.length + ' cases · ' + fail.length + ' failures');
console.log(JSON.stringify({ casos: results }));
process.exitCode = fail.length ? 1 : 0;
