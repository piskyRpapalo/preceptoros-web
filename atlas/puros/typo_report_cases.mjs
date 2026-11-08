// Cases for the typo report (public/game/typo_report.js, mission J4). Offline: fake stores and windows, no clock, no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
const require = createRequire(import.meta.url);
const FILE = new URL('../../public/game/typo_report.js', import.meta.url);
const T = require(FILE.pathname);
const PAGE = '/openworld/workshop/';

// A localStorage-like double over a Map: getItem, setItem, key(i), length.
function fakeStore(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
    _map: m,
  };
}
const rep = (i) => T.envelope('misspelt word ' + i, PAGE, '', 'when-' + i).report;

test('envelope valid: fields kept, quote normalised, under the mould', () => {
  const env = T.envelope('  the   wrnog \n word ', PAGE, ' typo here ', '2026-11-08T10:00:00Z');
  assert.equal(env.ok, true);
  assert.equal(env.report.v, 'preceptoros.typo/1');
  assert.equal(env.report.page, PAGE);
  assert.equal(env.report.quote, 'the wrnog word');
  assert.equal(env.report.note, 'typo here');
  assert.equal(env.report.when, '2026-11-08T10:00:00Z');
  assert.ok(Buffer.byteLength(JSON.stringify(env.report), 'utf8') < T.MOLD);
});

test('envelope: nothing_selected, quote_too_long (201) and note_too_long (201) at the edge, page_invalid', () => {
  assert.deepEqual(T.envelope('', PAGE, '', 'w'), { ok: false, cause: 'nothing_selected' });
  assert.deepEqual(T.envelope(' \n\t ', PAGE, '', 'w'), { ok: false, cause: 'nothing_selected' });
  assert.deepEqual(T.envelope(null, PAGE, '', 'w'), { ok: false, cause: 'nothing_selected' });
  assert.deepEqual(T.envelope('a'.repeat(201), PAGE, '', 'w'), { ok: false, cause: 'quote_too_long' });
  assert.equal(T.envelope('a'.repeat(200), PAGE, '', 'w').ok, true);
  assert.deepEqual(T.envelope('ok', PAGE, 'n'.repeat(201), 'w'), { ok: false, cause: 'note_too_long' });
  assert.deepEqual(T.envelope('ok', 'workshop/', '', 'w'), { ok: false, cause: 'page_invalid' });
  assert.deepEqual(T.envelope('ok', undefined, '', 'w'), { ok: false, cause: 'page_invalid' });
});

test('envelope: over_mold when the page makes the record reach 1024 bytes', () => {
  assert.deepEqual(T.envelope('ok', '/' + 'p'.repeat(1100), '', 'w'), { ok: false, cause: 'over_mold' });
});

test('looks_like_a_secret: a sk- key in the quote or in the note', () => {
  const key = 'sk-' + 'a'.repeat(20);
  assert.deepEqual(T.envelope('my ' + key, PAGE, '', 'w'), { ok: false, cause: 'looks_like_a_secret' });
  assert.deepEqual(T.envelope('ok', PAGE, key, 'w'), { ok: false, cause: 'looks_like_a_secret' });
});

test('save numbers 001, 002, 003 and list returns them in key order', () => {
  const s = fakeStore();
  const a = T.save(s, rep(1)), b = T.save(s, rep(2)), c = T.save(s, rep(3));
  assert.deepEqual([a.key, b.key, c.key], ['preceptoros.typo.001', 'preceptoros.typo.002', 'preceptoros.typo.003']);
  assert.deepEqual([a.count, b.count, c.count], [1, 2, 3]);
  assert.equal(a.ok, true);
  assert.deepEqual(T.list(s).map((r) => r.when), ['when-1', 'when-2', 'when-3']);
});

test('save takes the lowest free number after a gap', () => {
  const s = fakeStore({ 'preceptoros.typo.002': JSON.stringify(rep(2)) });
  assert.equal(T.save(s, rep(9)).key, 'preceptoros.typo.001');
});

test('notebook_full at 16: the 17th save is refused and nothing is written', () => {
  const s = fakeStore();
  for (let i = 1; i <= 16; i++) { assert.equal(T.save(s, rep(i)).ok, true); }
  assert.equal(s._map.size, 16);
  assert.deepEqual(T.save(s, rep(17)), { ok: false, cause: 'notebook_full' });
  assert.equal(s._map.size, 16);
  assert.equal(T.list(s).length, 16);
});

test('storage_unavailable: store null, store whose length throws, store whose setItem throws', () => {
  assert.deepEqual(T.save(null, rep(1)), { ok: false, cause: 'storage_unavailable' });
  const blocked = { get length() { throw new Error('blocked'); }, key() { throw new Error('blocked'); } };
  assert.deepEqual(T.save(blocked, rep(1)), { ok: false, cause: 'storage_unavailable' });
  const full = { ...fakeStore(), setItem() { throw new Error('QuotaExceededError'); } };
  assert.deepEqual(T.save(full, rep(1)), { ok: false, cause: 'storage_unavailable' });
  assert.deepEqual(T.list(null), []);
  assert.deepEqual(T.list(blocked), []);
});

test('list ignores keys without the prefix and values that are not a valid record', () => {
  const s = fakeStore({
    'preceptoros.typo.001': JSON.stringify(rep(1)),
    'preceptoros.typo.002': 'not json at all',
    'preceptoros.typo.003': JSON.stringify({ v: 'other/1', page: '/', quote: 'x', note: '', when: 'w' }),
    'other.app.001': JSON.stringify(rep(4)),
    'preceptoros.letters': '1.15',
  });
  assert.deepEqual(T.list(s).map((r) => r.when), ['when-1']);
});

test('line: the saved sentence with the count, and NO_DATA with the cause', () => {
  assert.equal(T.line({ ok: true, key: 'k', count: 3 }), 'Saved for the Mesa · 3 of 16 · export your notebook to send it');
  assert.equal(T.line({ ok: true, key: 'k', count: 9 }, 4), 'Saved for the Mesa · 4 of 16 · export your notebook to send it');
  assert.equal(T.line({ ok: false, cause: 'notebook_full' }), 'NO_DATA · notebook_full');
});

test('selection: the text of a fake window, trimmed; a throwing or missing window gives empty text', () => {
  const win = { getSelection: () => ({ toString: () => '  the quick  fox ' }) };
  assert.equal(T.selection(win), 'the quick  fox');
  assert.equal(T.selection({ getSelection: () => { throw new Error('no'); } }), '');
  assert.equal(T.selection({ getSelection: () => null }), '');
  assert.equal(T.selection({}), '');
  assert.equal(T.selection(null), '');
});

test('source: no Math.random, Date.now, fetch(; file at most 4096 bytes', () => {
  const src = readFileSync(FILE, 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|fetch\(/);
  assert.ok(statSync(FILE).size <= 4096, String(statSync(FILE).size));
});
