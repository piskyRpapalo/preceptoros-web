// Cases of Acho AC-1 (odd/tasks/acho-interpreter.md): the pure validator gives the same verdict as checkFrame.
// Parity table: every frame below goes through both judges; ok, bytes, causes and fields must be deep-equal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Acho = require('./acho.js');
const { checkFrame, bandNames, TOPE } = await import('../param_gate.mjs');
const TOKENS = require('../../public/game/comic_tokens.js');
const { ACCENTS } = require('../../public/game/comic_accents.js');
const SF = require('./state_frames.js');
const CP = require('../../public/game/colonia_pagina.js');

const NM = Acho.nombres(TOKENS, ACCENTS);
// Where Acho inserts the seal cause: after the serialization, size and doctrine-seal causes, before everything else.
const sinSello = (cs) => cs.filter((x) => /^(not serializable|NO_DATA: frame over|seal outside)/.test(x)).length;
const base = () => ({ v: 'preceptoros.acho/1', id: 'x', t: 0, cv: [120, 110],
  atoms: [{ k: 'k', r: 'a sentence', i: [{ o: 'ribbon', pts: [[1, 1], [50, 1], [50, 50]], closed: true, f: 'paper', s: 'ink', lw: 2 }] }],
  bands: ['paper', 'ink', 'cyan'], change: ['a sentence'], sound: 'NO_DATA', soundCause: 'no waves' });
const relleno = (n, c) => ({ ...base(), change: [c.repeat(n)] });
const ciclo = () => { const f = base(); f.yo = f; return f; };
const sinR = () => { const f = base(); f.atoms[0].r = ''; f.atoms[0].i[0].f = 'LIVE.base'; f.bands.push('LIVE.base'); return f; };

const corpus = {
  'base': base(),
  ...Object.fromEntries(Acho.SELLOS.map((s) => ['seal ' + s, { ...base(), seal: s }])),
  'seal outside': { ...base(), seal: 'PROBABLE' },
  'seal lower case': { ...base(), seal: 'live' },
  'colour literal': (() => { const f = base(); f.atoms[0].i[0].f = '#17131f'; return f; })(),
  'band not declared': (() => { const f = base(); f.bands = ['ink']; return f; })(),
  'unknown declared band': { ...base(), bands: ['paper', 'ink', 'cyan', 'mauve'] },
  'accent band': (() => { const f = base(); const a = Object.keys(ACCENTS)[0] + '.base'; f.atoms[0].i[0].f = a; f.bands.push(a); return f; })(),
  'colour without text': sinR(),
  'no atoms': { ...base(), atoms: [] },
  'bands not array': { ...base(), bands: 'paper' },
  't not numeric': { ...base(), t: '0' },
  't NaN': { ...base(), t: NaN },
  'bare NO_DATA sound': { ...base(), soundCause: '' },
  'sound ok': { ...base(), sound: 'ok' },
  'atom sounds only': (() => { const f = base(); delete f.sound; delete f.soundCause; f.atoms[0].sound = 'ok'; return f; })(),
  'schema seal: historical alias (D5 window)': { ...base(), v: 'preceptoros.bubble/1' },
  'schema seal: wrong': { ...base(), v: 'preceptoros.burbuja/1' },
  'schema seal: absent': (() => { const f = base(); delete f.v; return f; })(),
  'cycle': ciclo(),
  'undefined inside': { ...base(), extra: [undefined] },
  'not an object': [1, 2],
  'null': null,
  'ascii at 1023': null, 'ascii at 1024': null,
  'two-byte letters': relleno(300, 'ñ'),
  'middle dots (two bytes)': relleno(300, '·'),
  'three-byte letters': relleno(300, '€'),
  'emoji pairs': relleno(200, '🦀'),
  'state frame, no waves': SF.stateFrame({ id: 'cabin', sentence: 'the cabin is lit' }),
  'state frame, waves': SF.stateFrame({ id: 'reef', sentence: 'the reef sings', waves: [[[1, 9, 9, 0], [-4, 3, 3, 0]]] }),
  'state frame, accents in sentence': SF.stateFrame({ id: 'niño', sentence: 'el niño mira la grieta · ¡hola!' }),
  'colony bot': CP.botFrame({ id: 'cabin', q: -1, r: 0, alive: true, seal: 'LIVE', look: 'basic' }, 0, true),
  'colony bot, no seal': CP.botFrame({ id: 'doggee-a', q: 2, r: 0, alive: true, look: 'flat' }, 3, false),
  'colony you': CP.youFrame({ q: 0, r: 0 }, 1, false),
};
// The two frames that sit on the ceiling: exactly TOPE − 1 and TOPE bytes of ASCII.
for (const [k, n] of [['ascii at 1023', TOPE - 1], ['ascii at 1024', TOPE]]) {
  const f = relleno(1, 'a'); const sobra = n - Buffer.byteLength(JSON.stringify(f), 'utf8');
  corpus[k] = relleno(1 + sobra, 'a');
}

test('the band names are the same set as param_gate builds', () => {
  assert.deepEqual(Object.keys(NM).sort(), [...bandNames().porNombre.keys()].sort());
});

test('the schema seal is load-bearing: Acho and its alias pass, anything else is refused', () => {
  assert.equal(Acho.valida(corpus['base'], NM).ok, true);
  assert.equal(Acho.valida(corpus['schema seal: historical alias (D5 window)'], NM).ok, true);
  for (const k of ['schema seal: wrong', 'schema seal: absent']) assert.ok(Acho.valida(corpus[k], NM).causes.some((c) => /schema seal is not Acho/.test(c)), k);
});

test('the ceiling is the house one', () => { assert.equal(Acho.TOPE, TOPE); });

for (const [nombre, frame] of Object.entries(corpus)) {
  test(`parity: ${nombre}`, () => {
    // Acho = checkFrame + the schema seal (AC-0). checkFrame is the shared legibility contract and stays seal-blind.
    const a = Acho.valida(frame, NM), c = checkFrame(frame);
    const sello = a.causes.filter((x) => /^schema seal is not Acho/.test(x));
    const esperado = sello.length ? { ...c, ok: false, causes: [...c.causes.slice(0, sinSello(c.causes)), ...sello, ...c.causes.slice(sinSello(c.causes))] } : c;
    assert.deepEqual(a, esperado);
  });
}

test('the byte count matches node on every corpus frame', () => {
  for (const f of Object.values(corpus)) {
    let json; try { json = JSON.stringify(f); } catch { continue; }
    if (typeof json === 'string') { assert.equal(Acho.bytesUtf8(json), Buffer.byteLength(json, 'utf8')); }
  }
  for (const s of ['', 'a', 'ñ', '·', '€', '🦀', '\ud83e', 'a\udd80b']) {
    assert.equal(Acho.bytesUtf8(s), Buffer.byteLength(s, 'utf8'), JSON.stringify(s));
  }
});

test('the ceiling cuts at 1,024: 1,023 passes, 1,024 is refused', () => {
  assert.equal(Acho.valida(corpus['ascii at 1023'], NM).ok, true);
  assert.ok(Acho.valida(corpus['ascii at 1024'], NM).causes.includes('NO_DATA: frame over TOPE bytes'));
});

test('the corpus has both verdicts (a parity of only passes would prove nothing)', () => {
  const v = Object.values(corpus).map((f) => Acho.valida(f, NM).ok);
  assert.ok(v.filter(Boolean).length >= 10 && v.filter((x) => !x).length >= 10, JSON.stringify(v));
});

test('pure: two passes give the same answer, byte by byte', () => {
  const a = JSON.stringify(Object.values(corpus).map((f) => Acho.valida(f, NM)));
  const b = JSON.stringify(Object.values(corpus).map((f) => Acho.valida(f, NM)));
  assert.equal(a, b);
});

test('the core reads no DOM, network, clock or random', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('./acho.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const p of [/Math\.random/, /Date\b/, /fetch\(/, /document\./, /performance\./, /require\(/, /Buffer/]) assert.doesNotMatch(src, p);
});
