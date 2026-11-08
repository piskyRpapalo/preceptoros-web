// K4c · the tower grows only with real seals: the ledger adds up and the line says only what the ledger holds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const T = require('../../public/game/tower.js');
const L = JSON.parse(readFileSync(new URL('../../public/game/tower_floors.json', import.meta.url), 'utf8'));
const SW = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');

test('the ledger adds up: one floor per seal, days in order', () => {
  assert.equal(L.days.reduce((n, d) => n + d[1], 0), L.floors);
  const days = L.days.map((d) => d[0]);
  assert.deepEqual(days, days.slice().sort());
});

test('the served seal is never older than the top floor', () => {
  const now = T.served(SW);
  assert.ok(now, 'sw.js names its seal');
  const k = (v) => T.key(v).join('.');
  assert.ok(T.key(now) && T.key(L.top));
  const a = T.key(now), b = T.key(L.top);
  const cmp = a.findIndex((x, i) => x !== b[i]);
  assert.ok(cmp === -1 || a[cmp] > b[cmp], k(now) + ' < ' + k(L.top));
});

test('the line says the floors, the first day, the tallest day and the top floor', () => {
  const r = T.model(L, L.top);
  assert.equal(r.ok, true);
  assert.match(r.line, new RegExp('^The tower has ' + L.floors + ' floors since ' + L.days[0][0]));
  assert.match(r.line, /is the seal you see now · it grows only with a real seal$/);
});

test('a newer served seal is one floor under construction, not a floor already built', () => {
  const r = T.model({ $id: 'x', floors: 2, first: 'preceptoros-2026-09-a', top: 'preceptoros-2026-09-b', days: [['2026-08-30', 2]] }, 'preceptoros-2026-09-c');
  assert.equal(r.building, true);
  assert.match(r.line, /floor 3 \(09-c\) is under construction/);
});

test('seal order: z < aa and week before letters', () => {
  const c = (a, b) => { const x = T.key(a), y = T.key(b); const i = x.findIndex((v, j) => v !== y[j]); return i === -1 ? 0 : (x[i] < y[i] ? -1 : 1); };
  assert.equal(c('preceptoros-2026-09-z', 'preceptoros-2026-09-aa'), -1);
  assert.equal(c('preceptoros-2026-24-zz', 'preceptoros-2026-25-a'), -1);
});

test('no ledger, no tower: NO_DATA with its cause', () => {
  assert.equal(T.model(null, null).line, 'NO_DATA · tower_ledger_unreadable');
  assert.equal(T.served('nothing here'), null);
});

test('pure: no clock, randomness or network in the piece', () => {
  const src = readFileSync(new URL('../../public/game/tower.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|fetch\(|XMLHttpRequest/);
});
