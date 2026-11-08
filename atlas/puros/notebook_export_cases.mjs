// Notebook export cases (K8c, Workshop). Offline, synthetic. Store is a fake localStorage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync as rd } from 'node:fs';
const require = createRequire(import.meta.url);
const N = require('../../public/game/notebook_export.js');
const SRC = rd(new URL('../../public/game/notebook_export.js', import.meta.url), 'utf8');

function store(obj) {
  const ks = Object.keys(obj);
  return {
    get length() { return ks.length; },
    key(i) { return i < ks.length ? ks[i] : null; },
    getItem(k) { return Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : null; },
  };
}
function fakeWin() {
  const calls = { clicked: 0, created: 0, revoked: [], attrs: null, tag: null };
  const a = {
    href: '', download: '',
    click() { calls.clicked++; calls.attrs = { href: this.href, download: this.download }; },
  };
  const win = {
    Blob: function Blob(parts, o) { this.parts = parts; this.type = o.type; },
    URL: {
      createObjectURL() { calls.created++; return 'blob:fake-1'; },
      revokeObjectURL(u) { calls.revoked.push(u); },
    },
    document: {
      createElement(t) { calls.tag = t; return a; },
      body: { appendChild() {}, removeChild() {} },
    },
  };
  return { win, calls };
}

test('keys: only prefixed keys, sorted', () => {
  const s = store({ 'preceptoros.zeta': '1', other: 'x', 'preceptoros.alpha': '2', 'preceptoros.mid': '3' });
  assert.deepEqual(N.keys(s), ['preceptoros.alpha', 'preceptoros.mid', 'preceptoros.zeta']);
});

test('keys: null store and throwing store give []', () => {
  assert.deepEqual(N.keys(null), []);
  const bad = { get length() { throw new Error('denied'); }, key() { return null; }, getItem() { return null; } };
  assert.deepEqual(N.keys(bad), []);
});

test('record: JSON value is parsed, plain text stays text', () => {
  const j = N.record('preceptoros.a', '{"x":1}');
  assert.deepEqual(j.value, { x: 1 });
  assert.equal(j.key, 'preceptoros.a');
  assert.equal(j.bytes, Buffer.byteLength(JSON.stringify({ key: 'preceptoros.a', value: { x: 1 } }), 'utf8'));
  const t = N.record('preceptoros.b', 'hola');
  assert.equal(t.value, 'hola');
});

test('record: UTF-8 bytes are counted, not UTF-16 units', () => {
  const r = N.record('preceptoros.n', 'ñ'.repeat(600));
  assert.equal(r.estado, 'NO_DATA');
  assert.equal(r.causa, 'notebook_record_over_mold');
  assert.ok(r.bytes > 1024);
});

test('secret key or secret value is dropped, its text never appears in the doc', () => {
  const s = store({ 'preceptoros.api_key': 'plain-value', 'preceptoros.note': '"ghp_xxxSECRETVALUE"', 'preceptoros.ok': '"fine"' });
  const doc = N.build(s, '2026-11-08T03:00:00Z');
  const dropped = doc.records.filter((r) => r.estado === 'NO_DATA');
  assert.equal(dropped.length, 2);
  for (const r of dropped) {
    assert.equal(r.causa, 'notebook_secret_dropped');
    assert.equal('value' in r, false);
  }
  assert.equal(doc.counts.kept, 1);
  assert.equal(doc.counts.dropped, 2);
  assert.equal(N.text(doc).includes('ghp_xxxSECRETVALUE'), false);
  assert.equal(N.text(doc).includes('plain-value'), false);
});

test('value over 1024 UTF-8 bytes: notebook_record_over_mold, no value', () => {
  const r = N.record('preceptoros.big', 'a'.repeat(2000));
  assert.equal(r.estado, 'NO_DATA');
  assert.equal(r.causa, 'notebook_record_over_mold');
  assert.ok(r.bytes > 2000);
  assert.equal('value' in r, false);
});

test('70 keys: 64 kept, 6 dropped with notebook_over_count', () => {
  const obj = {};
  for (let i = 0; i < 70; i++) obj['preceptoros.k' + String(i).padStart(2, '0')] = String(i);
  const doc = N.build(store(obj), '2026-11-08T03:00:00Z');
  assert.equal(doc.counts.kept, 64);
  assert.equal(doc.counts.dropped, 6);
  const over = doc.records.filter((r) => r.causa === 'notebook_over_count');
  assert.equal(over.length, 6);
  assert.equal(doc.records.filter((r) => r.value !== undefined).length, 64);
});

test('build: envelope fields and device scope', () => {
  const doc = N.build(store({ 'preceptoros.a': '1' }), '2026-11-08T03:00:00Z');
  assert.equal(doc.v, 'preceptoros.notebook/1');
  assert.equal(doc.made, '2026-11-08T03:00:00Z');
  assert.equal(doc.device, 'this device only');
  assert.equal(doc.note, undefined);
});

test('empty store: no records, zero counts, note NO_DATA notebook_empty', () => {
  const doc = N.build(store({ other: '1' }), '2026-11-08T03:00:00Z');
  assert.deepEqual(doc.records, []);
  assert.deepEqual(doc.counts, { kept: 0, dropped: 0 });
  assert.equal(doc.note, 'NO_DATA · notebook_empty');
});

test('fileName keeps the first 10 characters of the timestamp', () => {
  assert.equal(N.fileName('2026-11-08T03:00:00Z'), 'preceptoros-notebook-2026-11-08.json');
});

test('line: under 120 characters in both cases, exact wording', () => {
  const full = N.build(store({ 'preceptoros.a': '1', 'preceptoros.b': '"x"', 'preceptoros.api_key': 'z' }), '2026-11-08T03:00:00Z');
  const empty = N.build(store({}), '2026-11-08T03:00:00Z');
  assert.equal(N.line(full), 'Notebook · 2 kept · 1 dropped · ready to save');
  assert.equal(N.line(empty), 'Notebook · NO_DATA · notebook_empty');
  assert.ok(N.line(full).length < 120);
  assert.ok(N.line(empty).length < 120);
});

test('text: pretty JSON with one-space indent', () => {
  const doc = N.build(store({ 'preceptoros.a': '1' }), '2026-11-08T03:00:00Z');
  assert.equal(N.text(doc), JSON.stringify(doc, null, 1));
});

test('download without Blob returns false and does not throw', () => {
  const { win } = fakeWin();
  delete win.Blob;
  const doc = N.build(store({}), '2026-11-08T03:00:00Z');
  assert.equal(N.download(win, doc), false);
  assert.equal(N.download({}, doc), false);
});

test('download with fakes: link gets name, is clicked, URL revoked, returns true', () => {
  const { win, calls } = fakeWin();
  const doc = N.build(store({ 'preceptoros.a': '1' }), '2026-11-08T03:00:00Z');
  assert.equal(N.download(win, doc), true);
  assert.equal(calls.tag, 'a');
  assert.equal(calls.created, 1);
  assert.equal(calls.clicked, 1);
  assert.equal(calls.attrs.download, 'preceptoros-notebook-2026-11-08.json');
  assert.equal(calls.attrs.href, 'blob:fake-1');
  assert.deepEqual(calls.revoked, ['blob:fake-1']);
});

test('module source: no Math.random, no Date, no network, small', () => {
  assert.doesNotMatch(SRC, /Math\.random|\bDate\b|fetch\(|XMLHttpRequest|https?:/);
  assert.ok(Buffer.byteLength(SRC, 'utf8') <= 5000);
});
