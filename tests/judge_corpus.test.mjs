// The web judge quotes or stays silent (F0 plan, slice i).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const req = createRequire(import.meta.url);
const J = req('../public/game/judge_corpus.js');
const F = req('../public/game/state_frames.js');
const ROOT = new URL('../', import.meta.url);
const RAW = readFileSync(new URL('public/openworld/judge-corpus.json', ROOT));
const C = JSON.parse(RAW);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const bytes = (s) => Buffer.byteLength(s, 'utf8');

test('corpus is under the house ceiling and rebuilds byte-identical', () => {
  assert.ok(RAW.length < 16384, RAW.length + ' B');
  execFileSync(process.execPath, ['tools/build_judge_corpus.mjs', '--check'], { cwd: ROOT });
});

test('every passage is bounded, hashed and private-free; every source doc exists and matches', () => {
  assert.equal(C.schema, 'preceptoros.judge-corpus/1');
  assert.ok(C.passages.length > 0);
  for (const p of C.passages) {
    assert.ok(bytes(p.text) <= 768, 'passage ' + p.id);
    assert.equal(sha(p.text), p.sha256, 'passage ' + p.id);
    assert.ok(!/\/home\/|\b\d{1,3}(\.\d{1,3}){3}\b|:\d{4,5}\b/.test(p.text), 'passage ' + p.id);
    assert.ok(C.sources.some((s) => s.doc === p.doc));
  }
  for (const s of C.sources) {
    assert.ok(existsSync(new URL(s.doc, ROOT)), s.doc);
    assert.equal(sha(readFileSync(new URL(s.doc, ROOT))), s.sha256, s.doc);
  }
});

test('a canon question gets exact quotes, at most 3, within 320 bytes', () => {
  const p = C.passages[0];
  const words = J.tokens(p.text).slice(0, 4).join(' ');
  const r = J.search(C, words);
  assert.equal(r.estado, 'MEASURED');
  assert.ok(r.fuentes.length >= 1 && r.fuentes.length <= 3);
  assert.ok(r.fuentes.reduce((n, f) => n + bytes(f.quote), 0) <= 320);
  for (const f of r.fuentes) {
    const src = C.passages.find((x) => x.id === f.id);
    assert.ok(src.text.includes(f.quote), 'quote is an exact substring of passage ' + f.id);
    assert.equal(f.sha256, src.sha256);
  }
});

test('no shared words means silence with cause, never an answer', () => {
  assert.deepEqual(J.search(C, 'zzzqx wwwvk'), { estado: 'NO_DATA', causa: 'no_cited_source' });
  for (const q of ['', '   ', 42, null, 'x'.repeat(1024)]) assert.equal(J.search(C, q).causa, 'question_invalid');
  assert.equal(J.search({}, 'waves canon').causa, 'corpus_unavailable');
});

test('the verdict is an acho frame that obeys the frame law', () => {
  const q = J.tokens(C.passages[0].text).slice(0, 4).join(' ');
  for (const r of [J.search(C, q), J.search(C, 'zzzqx wwwvk')]) assert.deepEqual(F.valida(J.frame(r)), []);
  assert.match(J.frame(J.search(C, 'zzzqx wwwvk')).atoms[0].r, /^NO_DATA · no_cited_source$/);
});

test('the module is deterministic and offline', () => {
  const src = readFileSync(new URL('public/game/judge_corpus.js', ROOT), 'utf8');
  for (const bad of ['Math.random', 'Date', 'fetch(', 'XMLHttpRequest']) assert.ok(!src.includes(bad), bad);
});
