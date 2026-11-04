import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('./cerebro_frame.js');
const A = require('./acho.js');
const TOKENS = require('../../public/game/comic_tokens.js');
const ACCENTS = require('../../public/game/comic_accents.js').ACCENTS;
const source = JSON.parse(readFileSync(new URL('../../public/cerebros.json', import.meta.url), 'utf8'));
const names = A.nombres(TOKENS, ACCENTS);

test('the catalogue projects one deterministic Acho frame per declared model', () => {
  const a = C.project(source), b = C.project(source);
  assert.equal(a.ok, true);
  assert.deepEqual(a, b);
  assert.equal(a.frames.length, source.cerebros.length);
  assert.deepEqual(a.frames.map((f) => f.id), source.cerebros.map((m) => 'brain-' + m.id).sort());
});

test('every frame keeps absent model facts and live residency as caused NO_DATA', () => {
  const out = C.project(source);
  for (const f of out.frames) {
    const text = f.atoms[0].r;
    for (const field of ['base NO_DATA', 'adapter NO_DATA', 'permissions NO_DATA', 'requires signature NO_DATA', 'residency NO_DATA']) {
      assert.ok(text.includes(field), `${f.id} must say ${field}`);
    }
    assert.equal(f.seal, 'NO_DATA');
    assert.equal(f.atoms[0].k, 'NO_DATA');
    assert.equal(A.valida(f, names).ok, true, JSON.stringify(A.valida(f, names).causes));
    assert.ok(Buffer.byteLength(JSON.stringify(f), 'utf8') < 1024);
  }
});

test('only source flags are projected; model figures and hardware identifiers never enter frames', () => {
  const out = C.project(source).frames;
  const mini = out.find((f) => f.id === 'brain-mini').atoms[0].r;
  assert.match(mini, /door yes/);
  assert.match(mini, /signature unsigned/);
  assert.doesNotMatch(out.map((f) => f.atoms[0].r).join(' '), /Radeon|Vulkan|1017\.39|1359293444/);
});

test('bad, duplicate and empty catalogues fail closed', () => {
  assert.equal(C.project(null).ok, false);
  assert.equal(C.project({ esquema: 2, cerebros: [] }).ok, false);
  assert.equal(C.project({ esquema: 1, cerebros: [{ id: 'x' }, { id: 'x' }] }).ok, false);
  assert.deepEqual(C.project({ esquema: 1, cerebros: [] }), { ok: true, frames: [] });
});

test('pure projection contains no clock, randomness, network or DOM access', () => {
  const code = readFileSync(new URL('./cerebro_frame.js', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /Math\.random|Date\b|fetch\(|XMLHttpRequest|document\./);
});
