// Cases of Acho AC-3 (odd/tasks/acho-interpreter.md): every frame gives one plain line for a person who cannot see or
// a small local model (`lee`), and an honest sound verdict (`oye`) that agrees with the served sonify core.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const A = require('./acho.js');
const S = require('../../public/game/acho_sonify.js');
const SF = require('./state_frames.js');
const CP = require('../../public/game/colony_page.js');
const W = require('../../public/game/hitl_walkers.js');

const estado = JSON.parse(readFileSync(new URL('../../public/openworld/state.json', import.meta.url), 'utf8'));
const ola = [[1, 9, 9, 0], [-4, 3, 3, 0]];
const mapa = [
  ...estado.colonia.nodes.map((n) => CP.botFrame(n, 0, true)),
  CP.youFrame({ q: 0, r: 0 }, 0, true),
  ...Object.keys(W.STATES).map((s) => W.walkerFrame({ id: 'w', state: s, path: ['pier', 'reef'], at: 'pier' }, 0)),
  SF.stateFrame({ id: 'pier', sentence: 'the pier is lit' }),
];
const suenan = [
  SF.stateFrame({ id: 'reef', sentence: 'the reef sings', waves: [ola] }),
  SF.stateFrame({ id: 'choir', sentence: 'two waves answer', waves: [ola, [[1, 6, 6, 0], [-6, 2, 2, 1]]] }),
];
const raros = [
  { v: 'preceptoros.acho/1', id: 'x', t: 0, atoms: [{ k: 'a', r: 'a rock', i: [] }], sound: 'ok' },
  { v: 'preceptoros.acho/1', id: 'y', t: 0, atoms: [{ k: 'a', r: 'a rock', i: [] }] },
  { v: 'preceptoros.acho/1', id: 'z', t: 0, atoms: [], sound: 'NO_DATA', soundCause: 'nothing here' },
];

test('the sound verdict agrees with the served sonify core on every frame (ok and number of voices)', () => {
  for (const f of [...mapa, ...suenan, ...raros]) {
    const o = A.oye(f), s = S.sonify(f);
    assert.equal(o.ok, s.ok, f.id);
    if (o.ok) assert.equal(o.voces, s.voices.length, f.id);
  }
});

test('a frame that sounds says how many voices; a silent one keeps its own cause', () => {
  assert.match(A.lee(suenan[1]).alt, /Sound: 2 voices$/);
  assert.match(A.lee(mapa[mapa.length - 1]).alt, /Silent: no waves declared for this state$/);
  assert.match(A.lee(raros[0]).alt, /Silent: it says it sounds, but it carries no harmonics/);
  assert.match(A.lee(raros[1]).alt, /Silent: sound not declared/);
  assert.match(A.lee(raros[2]).alt, /Silent: nothing here/);
});

test('the line starts with the seal as a word, never a colour; an absent seal reads NO_DATA', () => {
  assert.match(A.lee({ ...suenan[0], seal: 'LIVE' }).alt, /^LIVE · the reef sings/);
  assert.match(A.lee(suenan[0]).alt, /^NO_DATA · /);
  assert.match(A.lee({ ...suenan[0], seal: '#43F5A0' }).alt, /^NO_DATA · /);
});

test('every line of the map is non-empty, at most 280 characters, and names its sentence', () => {
  for (const f of mapa) {
    const { alt } = A.lee(f);
    assert.ok(alt.length > 0 && alt.length <= A.ALT_MAX, f.id + ' ' + alt.length);
    assert.ok(alt.includes(f.atoms[0].r.slice(0, 20)), f.id);
  }
  const largo = SF.stateFrame({ id: 'long', sentence: 'w'.repeat(400) });
  assert.equal(A.lee(largo).alt.length, A.ALT_MAX);
  assert.ok(A.lee(largo).alt.endsWith('…'));
});

test('a change already said by a sentence is not repeated', () => {
  const { alt } = A.lee(SF.stateFrame({ id: 'c', sentence: 'the door opens' }));
  assert.equal(alt.split('the door opens').length - 1, 1);
});

test('no frame → a line that says so, never a throw', () => {
  for (const x of [null, undefined, 3, 'frame']) assert.equal(A.lee(x).alt, 'NO_DATA: no frame.');
});

test('measured, not a target: the map frames that sound today (AC-3 coverage reading)', () => {
  const n = mapa.filter((f) => A.oye(f).ok).length;
  // 2026-11-02: 0 of 10. Bots, the visitor, the walkers and the state frames declare no waves. This case records the
  // reading; a future piece that gives the map its voice changes this number on purpose, with its own receipt.
  assert.equal(mapa.length, 6);   // 2026-11-07: the served colony is empty (cabin retired; the web without nodes), so no bot frame
  assert.equal(n, 0);
});

test('pure: same frame, same line, twice', () => {
  assert.equal(JSON.stringify(mapa.map(A.lee)), JSON.stringify(mapa.map(A.lee)));
});
