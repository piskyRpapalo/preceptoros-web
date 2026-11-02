// Cases of SALA-B (atlas/puros/sala_log.js): messages are Acho frames; the log is append-only and chained.
// The register is a stub with the SALA-C rule shape, so this piece does not wait for SALA-C to merge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const L = require('./sala_log.js');
const Acho = require('./acho.js');
const NM = Acho.nombres(require('../../public/game/comic_tokens.js'), require('../../public/game/comic_accents.js').ACCENTS);
const juez = (f) => Acho.valida(f, NM);
const ESTADOS = { soberano: 'VIVA', escriba: 'VIVA', novato: 'SIN_BENCHCARD', sabio: 'VACANTE' };
const voces = { regla: (id) => {
  const e = ESTADOS[id];
  if (e === 'VIVA') return { puede: true, sello: null, causa: '' };
  if (e === 'SIN_BENCHCARD') return { puede: true, sello: 'NO_DATA', causa: 'no benchcard' };
  return { puede: false, sello: 'NO_DATA', causa: e ? 'seat ' + e : 'unknown voice: ' + id };
} };
const di = (log, voz, texto, sello = 'LIVE') => L.asienta(log, L.mensaje(log, { voz, texto, sello }, voces), voz, voces, juez);
const conversa = () => {
  let log = [];
  for (const [v, t] of [['soberano', 'open the room'], ['escriba', 'I write the first page'], ['novato', 'I can only guess']]) {
    const r = di(log, v, t); assert.equal(r.ok, true, r.causa); log = r.log;
  }
  return log;
};

test('the house hash: FNV-1a vectors', () => {
  assert.equal(L.hash32(''), '811c9dc5');
  assert.equal(L.hash32('a'), 'e40c292c');
  assert.equal(L.hash32('foobar'), 'bf9cf968');
});

test('three voices speak in turn: every message is an Acho frame under 1,024 B, chained to the one before', () => {
  const log = conversa();
  assert.deepEqual(log.map((f) => f.turno), [0, 1, 2]);
  assert.equal(log[0].prev, L.RAIZ);
  for (let i = 1; i < log.length; i++) assert.equal(log[i].prev, L.hash32(JSON.stringify(log[i - 1])));
  for (const f of log) { const r = juez(f); assert.equal(r.ok, true, JSON.stringify(r.causes)); assert.ok(r.bytes < 1024); }
  assert.deepEqual(L.verifica(log, voces, juez), { ok: true, roto: -1, causa: '' });
});

test('a voice without a benchcard speaks, sealed NO_DATA whatever it asks', () => {
  assert.equal(conversa()[2].seal, 'NO_DATA');
});

test('append-only: asienta returns a new log and never touches the old one', () => {
  const log = conversa(), copia = JSON.stringify(log);
  const r = di(log, 'escriba', 'one more');
  assert.equal(r.ok, true); assert.equal(r.log.length, 4); assert.equal(JSON.stringify(log), copia);
});

test('a rewritten past breaks the chain at the next turn', () => {
  const log = conversa();
  const falso = log.map((f) => ({ ...f, atoms: f.atoms.map((a) => ({ ...a })) }));
  falso[0].atoms[0].r = 'close the room'; falso[0].change = ['close the room'];
  const v = L.verifica(falso, voces, juez);
  assert.equal(v.ok, false); assert.equal(v.roto, 1); assert.match(v.causa, /broken chain/);
});

test('fail-closed: a vacant seat, an unknown voice, speaking for another, wrong turn, wrong seal, oversize', () => {
  const log = conversa();
  assert.match(di(log, 'sabio', 'hello').causa, /seat VACANTE/);
  assert.match(di(log, 'quien', 'hello').causa, /unknown voice/);
  const m = L.mensaje(log, { voz: 'escriba', texto: 'hi', sello: 'LIVE' }, voces);
  assert.match(L.asienta(log, m, 'soberano', voces, juez).causa, /never speaks for another/);
  assert.match(L.asienta(log, { ...m, turno: 7, t: 7, id: 'sala-7' }, 'escriba', voces, juez).causa, /turn out of order/);
  const n = L.mensaje(log, { voz: 'novato', texto: 'hi' }, voces);
  assert.match(L.asienta(log, { ...n, seal: 'LIVE' }, 'novato', voces, juez).causa, /seal must be NO_DATA/);
  assert.match(di(log, 'escriba', 'x'.repeat(1100)).causa, /judge: .*over TOPE/);
  assert.match(di(log, 'escriba', '   ').causa, /empty message/);
});

test('pure: same messages, same log, byte by byte; no DOM, network, clock or random', () => {
  assert.equal(JSON.stringify(conversa()), JSON.stringify(conversa()));
  const src = readFileSync(new URL('./sala_log.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const p of [/Math\.random/, /Date\b/, /fetch\(/, /document\./, /require\(/]) assert.doesNotMatch(src, p);
});
