// P4 catalogue checks: stable public IDs, exact signed anchors, safe omissions and a compact glyph per entry.
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (p) => path.join(root, p);
const read = (p) => JSON.parse(readFileSync(file(p), 'utf8'));
const doc = read('public/dictionary.json');
const en = read('public/dictionary-en.json');
const ids = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12',
  'B13','B14','B15','B16','B17','B18','B19',
  'C22','C23','C24','C25','C26','C27','C28','C29','C30','C31','C32',
  'D33','D34','D35','D36','D37','D38','D39','D40','D41','D42','D43','D44','D45'];
const colors = { A: '#E6A817', B: '#00D2FF', C: '#2ECC71', D: '#9B59B6' };
const lines = ['double', 'dotted', 'spiral', 'star6'];
const failures = [];
function check(ok, note) { if (!ok) failures.push(note); }
function validate(d, e) {
  const out = [];
  const test = (ok, note) => { if (!ok) out.push(note); };
  test(d.schema === 'preceptoros.dictionary/1', 'dictionary schema');
  test(d.entries.length === 43 && d.public_entries === 43, '43 public entries');
  test(JSON.stringify(d.entries.map((x) => x.id_interno)) === JSON.stringify(ids), 'canonical ordered IDs');
  test(new Set(d.entries.map((x) => x.id_interno)).size === d.entries.length, 'unique IDs');
  test(JSON.stringify(d.withheld_ids) === JSON.stringify(['B20', 'B21']), 'held records');
  test(d.total_status.startsWith('NO_DATA (') && d.total_status.includes('42-entry table'), 'count cause');
  test(JSON.stringify(Object.keys(e.entries).sort()) === JSON.stringify(ids.slice().sort()), 'English text parity');
  for (const x of d.entries) {
    const block = x.id_interno[0], sem = x.semiotica;
    test(x.id_interno && x.nombre_juego && x.estandar_humano && Array.isArray(x.anclaje_abierto) && x.anclaje_abierto.length, `required text ${x.id_interno}`);
    test(sem.color === colors[block] && JSON.stringify(sem.onda_hz) === '[432,528]', `signed color and sound ${x.id_interno}`);
    test(lines.includes(sem.trazo) && sem.movimiento === 'static_vibration', `line and unverified language motion ${x.id_interno}`);
    test(Array.isArray(x.glyph) && x.glyph.length === 4 && x.glyph[0] === { A:0, B:1, C:2, D:3 }[block] && x.glyph[2] === lines.indexOf(sem.trazo) && x.glyph[3] === 1, `4D glyph tuple ${x.id_interno}`);
    test(Buffer.byteLength(JSON.stringify(x.glyph)) < 64, `glyph tuple under 64 bytes ${x.id_interno}`);
    test(x.archivo_verificador === 'atlas/dictionary_cases.mjs', `verifier path ${x.id_interno}`);
    test(x.anclaje_abierto.every((a) => typeof a === 'string' && !/^[a-z]+:\/\//i.test(a)), `plain-text anchors ${x.id_interno}`);
    test(typeof e.entries[x.id_interno] === 'string' && e.entries[x.id_interno].length >= 12, `simple English explanation ${x.id_interno}`);
  }
  test(JSON.stringify(d.destination_groups) === JSON.stringify({ A:'Workshop', B:'Frontier Gate', C:'Forest Commons', D:'Signing Table' }), 'signed destination groups');
  test(d.movement_cause.includes('other eight language versions have not been verified'), 'honest English-first status');
  return out;
}
const bad = process.argv.includes('--sabotage-duplicate');
const candidate = structuredClone(doc);
if (bad) { candidate.entries[1].id_interno = candidate.entries[0].id_interno; }
failures.push(...validate(candidate, en));
check(statSync(file('public/dictionary.json')).size < 16384, 'dictionary JSON under 16 KiB');
check(statSync(file('public/dictionary-en.json')).size < 16384, 'English explanations under 16 KiB');
check(readFileSync(file('public/dictionary.json'), 'utf8').includes('Wikidata:Q104889869'), 'open anchors present as text');
check(!readFileSync(file('public/dictionary.json'), 'utf8').includes('https://'), 'no anchor URLs');
const require = createRequire(import.meta.url);
const star = require('../public/game/hexelion_dictionary.js');
globalThis.AtlasMapNodes = { casas: () => [{ nodo: 'nodo.0.hexelion', x: 10, y: 20 }] };
let placed = null;
const drawn = star.pinta({}, (x, y) => [x, y], { pon: (x, y, paint, ficha) => { placed = { x, y, paint, ficha }; }, dpr: 1 });
check(drawn && placed && placed.x === 120 && placed.y === 110 && placed.ficha().kind === 'hexelion-star', 'star has a deterministic map coordinate and inspector card');
let label = '';
const canvas = { save(){}, restore(){}, beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, fill(){}, stroke(){}, arc(){}, fillText(t){ label = t; } };
placed = null;
star.pinta(canvas, (x, y) => [x, y], { pon: (x, y, paint, ficha) => { placed = { x, y, paint, ficha }; }, dpr: 1 });
placed.paint();
check(label === 'HEXELION STAR', 'star painter renders its English map label');
// T_CRT §8.2 (FIRMO 2026-10-19, Comando #15): mesuras por pieza. No caben en dictionary.json (techo 16.384 B), asi que viven
// en el catalogo del orquestador (deploy_building.js); las pieles heredan las mesuras de su base o son NO_DATA con causa.
const DB = require('../public/game/deploy_building.js');
check(statSync(file('public/dictionary.json')).size <= 16384, 'dictionary.json stays under the 16,384 B piece ceiling');
for (const k of DB.KINDS) {
  const m = DB.measurements(k);
  check(m.base === k && m.touch_px >= 44 && m.piece_ceiling_b === 16384 && m.packet_ceiling_b === 1024 && m.tiles[0] === 1 && m.tiles[1] === 4,
    'measures declared for ' + k);
  check(m.contrast.sello === 'NO_DATA' && m.contrast.causa && m.ram.sello === 'NO_DATA' && m.ram.causa, 'unmeasured measures carry a cause for ' + k);
}
for (const s of DB.SKINS) {
  const m = DB.measurements(s), b = DB.measurements(m.base);
  check(m.base === s.split(' ').pop(), 'skin ' + s + ' names its base last');
  check(m.skin === s && JSON.stringify({ ...m, skin: null }) === JSON.stringify({ ...b, skin: null }), 'skin ' + s + ' inherits its base measures');
}
for (const x of ['pirate tv', 'tv', 'castle']) {
  const m = DB.measurements(x);
  check(m.sello === 'NO_DATA' && typeof m.causa === 'string' && m.causa.length > 0, 'missing measures are NO_DATA with cause: ' + x);
}
console.log(JSON.stringify({ entries: doc.entries.length, glyph_max_bytes: 9, dictionary_bytes: statSync(file('public/dictionary.json')).size,
  english_bytes: statSync(file('public/dictionary-en.json')).size, failures }, null, 2));
if (failures.length) process.exitCode = 1;
