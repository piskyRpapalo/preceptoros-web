// Art is a claim: one Acho frame, three readings, one id per drawn thing. Uso: node --test atlas/puros/acho_claim_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('../../public/game/acho_claim.js');
const E = require('../../public/game/acho_editor.js');
const S = require('../../public/game/acho_sonify.js');
const B = require('../../public/game/acho_language.js');
const at = (f) => new URL('../../public/game/' + f, import.meta.url);
const tide = JSON.parse(readFileSync(at('acho_low_tide.json'), 'utf8'));

test('the example drawing is a valid frame under 1 KiB and reads as nine things', () => {
  const c = C.claim(tide);
  assert.equal(c.ok, true);
  assert.ok(c.bytes < 1024 && c.bytes === statSync(at('acho_low_tide.json')).size);
  assert.equal(c.rows.length, 9);
});

test('one id: it comes from the frame bytes, and every row carries it with its place', () => {
  const c = C.claim(tide), id = 'acho:' + ('0000000' + B.hash32(E.serialize(tide)).toString(16)).slice(-8);
  assert.equal(c.id, id);
  assert.deepEqual(c.rows.map((r) => r.id), ['0.0', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.0'].map((p) => id + '#' + p));
  const moved = JSON.parse(JSON.stringify(tide)); moved.atoms[0].i[0].x += 1;
  assert.notEqual(C.claim(moved).id, c.id);
});

test('look: each row is exactly one compiled group of the same primitive, mark for mark', () => {
  const c = C.claim(tide), groups = E.compile(tide);
  assert.equal(groups.length, c.rows.length);
  c.rows.forEach((r, i) => { assert.equal(groups[i].o, r.primitive); assert.equal(groups[i].items.length, r.look); assert.ok(r.look > 0); });
});

test('listen: the rows that sound are exactly the voices acho_sonify.js plays, in order; the rest say why', () => {
  const c = C.claim(tide), voices = S.sonify(tide).voices;
  assert.deepEqual(c.rows.filter((r) => r.listen).map((r) => r.listen), voices.map((v) => v.recipe));
  assert.deepEqual(c.rows.filter((r) => r.listen).map((r) => r.id.split('#')[1]), ['0.0', '1.4']);
  c.rows.filter((r) => !r.listen).forEach((r) => assert.match(r.silent, /^this (ribbon|arcs|blob|text) carries no harmonics$/));
});

test('inspect: each row holds the frame\'s own item, untouched', () => {
  const c = C.claim(tide), items = tide.atoms.flatMap((a) => a.i);
  c.rows.forEach((r, i) => assert.equal(r.inspect, items[i]));
});

test('the same sentence for the screen, the reader and the log', () => {
  const c = C.claim(tide);
  assert.equal(C.line(c.rows[0]), c.id + '#0.0 · wave · drawn with ' + c.rows[0].look + ' marks · sounds at 110 Hz');
  assert.equal(C.line(c.rows[1]), c.id + '#1.0 · ribbon · drawn with 1 mark · silent: this ribbon carries no harmonics');
  assert.equal(C.summary(c, 'look'), c.id + ' · look · 9 things · 961 of 1024 bytes');
  assert.equal(C.summary(c, 'listen'), c.id + ' · listen · 2 of 9 sound: 0.0 at 110 Hz, 1.4 at 139 Hz');
  const ribbon = C.claim(E.create({ primitive: 'ribbon' }));
  assert.equal(C.summary(ribbon, 'listen'), ribbon.id + ' · listen · NO_DATA · silent: this ribbon carries no harmonics');
});

test('a frame declared silent stays silent with its own cause', () => {
  const f = E.create({ primitive: 'wave', sound: 'NO_DATA: the author muted it' }), c = C.claim(f);
  assert.equal(c.rows[0].listen, null);
  assert.equal(c.rows[0].silent, 'the author muted it');
});

test('fail closed: not a frame, too large, or a drawing that does not line up', () => {
  assert.deepEqual(C.claim(null), { ok: false, cause: 'NO_DATA: invalid Acho frame' });
  assert.deepEqual(C.claim({ v: 'other' }), { ok: false, cause: 'NO_DATA: invalid Acho frame' });
  const big = E.create({ primitive: 'text' }); big.atoms[0].i[0].tx = 'x'.repeat(1000);
  assert.deepEqual(C.claim(big), { ok: false, cause: 'NO_DATA: frame is 1024 bytes or larger' });
  assert.equal(C.summary(C.claim(big), 'look'), 'NO_DATA: frame is 1024 bytes or larger');
});

test('measured: eight of the nine primitives are claimable; keep draws its source and says NO_DATA', () => {
  const okays = E.PRIMITIVES.filter((p) => C.claim(E.create({ primitive: p })).ok);
  assert.deepEqual(okays, ['wave', 'blob', 'ribbon', 'arcs', 'field', 'wall', 'text', 'neck']);
  assert.match(C.claim(E.create({ primitive: 'keep' })).cause, /^NO_DATA: the drawing and the frame do not line up at 0\.0$/);
});

test('deterministic: the same frame reads the same twice', () => {
  assert.deepEqual(C.claim(tide), C.claim(tide));
});

test('the piece stays small', () => {
  assert.ok(statSync(at('acho_claim.js')).size <= 10240);
});
