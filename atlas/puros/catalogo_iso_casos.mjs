// Cases for the catalogue core (ODD isometric-colony, IC3). The frames are born from the state rows: a kind without a
// lexicon key is an orphan_visual_node, a value that is not measured is NO_DATA with its cause, a fallen row is not drawn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('./catalogo_iso.js');
const F = require('./state_frames.js');
const S = require('../../public/game/bubble_sonify.js');

const FILAS = [
  { id: 'second-1', tipo: 'second', medida: { nombre: 'mana', valor: 60 } },
  { id: 'cabin', tipo: 'cabin', medida: { nombre: 'mana', valor: 100 } },
  { id: 'sea-1', tipo: 'sea', sintetico: true, causa: 'no mana source wired for this creature yet' }
];

test('the catalogue is born from the rows: one frame per living row, sorted by id, each under the law', () => {
  const out = C.catalogo({ t: 30, filas: FILAS });
  assert.deepEqual(out.map((f) => f.id), ['cabin', 'sea-1', 'second-1']);
  for (const f of out) assert.deepEqual(F.valida(f), [], `frame ${f.id} obeys the law`);
  assert.equal(out[0].atoms[0].k, 'sprite.cabin');
  assert.equal(out[2].atoms[0].k, 'sprite.second');
});

test('a measured value is drawn and sounds from the kind’s own waves, scaled by the value', () => {
  const [cabin] = C.catalogo({ filas: [FILAS[1]] });
  assert.equal(cabin.sound, 'ok');
  assert.match(cabin.atoms[0].r, /mana 100/);
  const r = S.sonify(cabin);
  assert.equal(r.ok, true);
});

test('a value that is not measured says NO_DATA in its sentence and in its sound, with its cause', () => {
  const [sea] = C.catalogo({ filas: [FILAS[2]] });
  assert.match(sea.sound, /^NO_DATA: /);
  assert.match(sea.atoms[0].r, /NO_DATA \(no mana source wired/);
  assert.equal(S.sonify(sea).ok, false, 'nothing sounds without a measured value');
});

test('a row marked sintetico says SYNTHETIC in its sentence, so no fixture reads as a live measurement', () => {
  const [sea] = C.catalogo({ filas: [FILAS[2]] });
  assert.match(sea.atoms[0].r, /· SYNTHETIC ·/);
});

test('a fallen row (vivo: false) is not drawn: it leaves with no error and no placeholder', () => {
  const out = C.catalogo({ filas: [...FILAS, { id: 'tower-1', tipo: 'tower', vivo: false }] });
  assert.equal(out.some((f) => f.id === 'tower-1'), false);
  assert.equal(out.length, 3);
});

test('the same state gives byte-identical frames, two runs and across any number of calls', () => {
  const a = JSON.stringify(C.catalogo({ t: 90, filas: FILAS }));
  const b = JSON.stringify(C.catalogo({ t: 90, filas: FILAS }));
  assert.equal(a, b);
});

test('the lexicon keys are unique and every kind names one', () => {
  assert.equal(new Set(C.CLAVES).size, C.CLAVES.length);
  for (const k of Object.keys(C.TIPOS)) assert.match(C.TIPOS[k].clave, /^sprite\.[a-z]+$/);
});

test('sabotage: a sprite whose kind is not in the catalogue is refused as orphan_visual_node', () => {
  assert.throws(() => C.catalogo({ filas: [{ id: 'ghost-1', tipo: 'ghost' }] }), /orphan_visual_node: ghost-1/);
});

test('sabotage: a row with no id is refused as orphan_visual_node, not drawn as an empty sprite', () => {
  assert.throws(() => C.catalogo({ filas: [{ tipo: 'second' }] }), /orphan_visual_node/);
});

test('sabotage: a measured value out of 0-100 or not a whole number is NO_DATA, never drawn', () => {
  assert.match(C.medida({ medida: { nombre: 'mana', valor: 101 } }).frase, /NO_DATA/);
  assert.match(C.medida({ medida: { nombre: 'mana', valor: 3.5 } }).frase, /NO_DATA/);
  assert.match(C.medida({ medida: { nombre: 'mana', valor: '40' } }).frase, /NO_DATA/);
});

test('sabotage: a frame over 1,024 bytes is refused by the frame law, not shipped', () => {
  const long = { id: 'x', tipo: 'sea', causa: 'c'.repeat(1100) };
  assert.throws(() => C.catalogo({ filas: [long] }), /frame_law: x · frame of \d+ bytes/);
});

test('the catalogue core reads no random number, no clock and no network', () => {
  const src = readFileSync(new URL('./catalogo_iso.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest/);
});
