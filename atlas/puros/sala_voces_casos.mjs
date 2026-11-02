// Cases of SALA-C (atlas/puros/sala_voces.js): every voice card is an Acho frame; the rule of each seat holds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const S = require('./sala_voces.js');
const Acho = require('./acho.js');
const NM = Acho.nombres(require('../../public/game/comic_tokens.js'), require('../../public/game/comic_accents.js').ACCENTS);

test('every voice has one card, and every card passes Acho.valida under 1,024 B', () => {
  for (const id of S.ids()) {
    const f = S.ficha(id), r = Acho.valida(f, NM);
    assert.equal(r.ok, true, id + ': ' + JSON.stringify(r.causes));
    assert.ok(r.bytes < 1024, id + ' ' + r.bytes);
  }
});

test('ids are unique (one voice never speaks for another)', () => {
  assert.equal(new Set(S.ids()).size, S.ids().length);
});

test('live voices speak with their own seal; the empty sage seat is refused with its cause', () => {
  assert.deepEqual(S.regla('escriba'), { puede: true, sello: null, causa: '' });
  const sabio = S.regla('sabio');
  assert.equal(sabio.puede, false);
  assert.match(sabio.causa, /fabricated its identity/);
});

test('the private voice is refused and carries no name and no path: only «private by decree»', () => {
  const r = S.regla('privada-1');
  assert.equal(r.puede, false);
  assert.equal(r.causa, 'private by decree');
  const v = S.VOCES.find((x) => x.id === 'privada-1');
  assert.deepEqual(Object.keys(v).sort(), ['causa', 'estado', 'id', 'rol']);
  assert.equal(v.rol, 'NO_DATA');
});

test('unmeasured device voices and unknown voices are refused, never invented', () => {
  for (const id of ['nodo-sdr', 'nodo-git', 'nodo-movil']) assert.equal(S.regla(id).puede, false, id);
  assert.match(S.regla('quien-sea').causa, /unknown voice/);
  assert.equal(S.ficha('quien-sea'), null);
});

test('a voice without a benchcard may speak, but always sealed NO_DATA', () => {
  // No seat is in that state today; the rule is pinned on a copy so it cannot drift.
  const src = readFileSync(new URL('./sala_voces.js', import.meta.url), 'utf8');
  assert.match(src, /SIN_BENCHCARD'\) \{ return \{ puede: true, sello: 'NO_DATA'/);
});

test('the register names no machine, address or home path (SCRUB)', () => {
  const src = readFileSync(new URL('./sala_voces.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\/home\/|~\/|beelink|onexstation|jetson|torre|vigia|doogee/i);
});

test('pure: no DOM, network, clock or random', () => {
  const src = readFileSync(new URL('./sala_voces.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const p of [/Math\.random/, /Date\b/, /fetch\(/, /document\./, /require\(/]) assert.doesNotMatch(src, p);
});
