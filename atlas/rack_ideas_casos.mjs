// LA VOZ DEL RACK · pure cases of public/game/rack_ideas.js and the title/ask helpers of building_chat.js.
// Uso: node --test atlas/rack_ideas_casos.mjs
// Laws: nothing is requested on load; only the index's entries become ideas (never decoys or canaries); every failure is
// NO_DATA with its cause; each line stays far under 1,024 B; the ideas are said one by one and stop when the visitor leaves.
// Fixture: atlas/fixtures/ai-index-muestra.json = the study index of 2026-11-02 cut to 3 entries (decoys and canaries kept).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let fetchesOnLoad = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = () => { fetchesOnLoad++; return Promise.reject(new Error('no')); };
const R = require('../public/game/rack_ideas.js');
const C = require('../public/game/building_chat.js');
globalThis.fetch = realFetch;
const MUESTRA = readFileSync(new URL('./fixtures/ai-index-muestra.json', import.meta.url), 'utf8');
const bytes = (s) => Buffer.byteLength(s, 'utf8');
const res = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(body) });

test('loading the bridge asks nothing (zero requests on load)', () => {
  assert.equal(fetchesOnLoad, 0);
  assert.match(R.SOURCE, /^https:\/\/raw\.githubusercontent\.com\/piskyRpapalo\/study\/main\/ai-index\.json$/);
});

test('only entries become ideas: decoys and canaries never show', () => {
  const r = R.parse(MUESTRA), d = JSON.parse(MUESTRA);
  assert.equal(r.ok, true);
  assert.deepEqual(r.ideas.map((x) => x.path), d.entries.map((e) => e.path));
  const todo = JSON.stringify(r);
  for (const x of d.decoys) { assert.ok(!todo.includes(x.path), 'decoy shown: ' + x.path); }
  assert.ok(!todo.includes('canary'), 'a canary reason leaked');
});

test('a broken answer is NO_DATA with its cause, never an invented idea', () => {
  const d = JSON.parse(MUESTRA);
  const casos = [
    ['<html>', 'not_json'],
    [JSON.stringify({ ...d, esquema: 'other/1' }), 'schema_unknown'],
    [JSON.stringify({ ...d, entries: null }), 'no_entries'],
    [JSON.stringify({ ...d, entries: [{ path: 'x.md', one_liner: 'x', sha256: 'zz' }] }), 'no_ideas']
  ];
  for (const [txt, causa] of casos) {
    const r = R.parse(txt);
    assert.equal(r.ok, false); assert.ok(r.causa.startsWith('NO_DATA · ' + causa + ':'), r.causa);
  }
});

test('every line stays short and names where the idea lives', () => {
  const d = JSON.parse(MUESTRA); d.entries[0].one_liner = 'ω'.repeat(5000);
  const r = R.parse(JSON.stringify(d));
  r.ideas.forEach((x, i) => {
    const l = R.lineOf(x, i, r.ideas.length);
    assert.ok(bytes(l) < 1024, 'line over 1 KiB: ' + bytes(l));
    assert.match(l, new RegExp('^Rack idea ' + (i + 1) + '/3 · .* · study/' + x.path.replace('.', '\\.') + ' · sha256 [0-9a-f]{12}$'));
  });
  assert.ok(bytes(R.header('Tutorial cabin', r)) < 1024);
});

test('fetchIdeas: offline, HTTP error, network error and timeout are causes; the request carries no credentials', async () => {
  let llamadas = 0;
  const off = await R.fetchIdeas({ online: false, fetch: () => { llamadas++; } });
  assert.equal(llamadas, 0); assert.match(off.causa, /^NO_DATA · offline:/);
  assert.match((await R.fetchIdeas({ fetch: () => res(404, '') })).causa, /^NO_DATA · http_404:/);
  assert.match((await R.fetchIdeas({ fetch: () => Promise.reject(new Error('x')) })).causa, /^NO_DATA · network_error:/);
  let fire = null;
  const t = R.fetchIdeas({ fetch: () => new Promise(() => {}), timer: (f) => { fire = f; return 1; }, clear: () => {} });
  fire(); assert.match((await t).causa, /^NO_DATA · timeout:/);
  let visto = null;
  const ok = await R.fetchIdeas({ fetch: (u, o) => { visto = { u, o }; return res(200, MUESTRA); } });
  assert.equal(ok.ok, true); assert.equal(ok.ideas.length, 3);
  assert.equal(visto.u, R.SOURCE); assert.equal(visto.o.credentials, 'omit'); assert.equal(visto.o.cache, 'no-store');
});

test('stream says one line per step and stops when the visitor leaves', () => {
  const dichos = [], pasos = [];
  R.stream(['a', 'b', 'c'], (t) => dichos.push(t), () => true, (f, ms) => pasos.push([f, ms]));
  assert.deepEqual(dichos, ['a']);
  pasos.shift()[0](); assert.deepEqual(dichos, ['a', 'b']);
  let dentro = true; const d2 = [], p2 = [];
  R.stream(['a', 'b', 'c'], (t) => d2.push(t), () => dentro, (f) => p2.push(f));
  dentro = false; p2.shift()(); assert.deepEqual(d2, ['a']);
});

test('the chat title names the building; ideas are asked by whole word', () => {
  assert.equal(C.titleOf({ id: 'b-cabin', node: 'cabin' }), 'Tutorial cabin · b-cabin · chat');
  assert.equal(C.titleOf(null), 'Chat');
  for (const s of ['ideas', 'show me the rack', 'Study?', 'one idea please']) { assert.ok(C.wantsIdeas(s), s); }
  for (const s of ['racket', 'studying', 'hello', 'status']) { assert.ok(!C.wantsIdeas(s), s); }
});

test('jewels: headings and their «Dónde» are read live; a foreign file is NO_DATA', () => {
  const md = '# JOYAS · x\n\n### J1 · El **hexágono** (YA VIVE)\n- **Dónde:** `public/game/hex_projection.js`: x = 48q\n### J2 · Sin dónde\ntexto\n';
  const r = R.parseJewels(md);
  assert.equal(r.ok, true); assert.equal(r.jewels.length, 2);
  assert.deepEqual(r.jewels[0], { id: 'J1', title: 'El hexágono (YA VIVE)', where: 'public/game/hex_projection.js: x = 48q' });
  assert.equal(r.jewels[1].where, 'NO_DATA');
  assert.match(R.jewelLine(r.jewels[0], 0, 2), /^Jewel 1\/2 · J1 · El hexágono \(YA VIVE\) · where: .* · odd\/JOYAS\.md \(es\)$/);
  assert.match(R.parseJewels('<html>').causa, /^NO_DATA · not_jewels:/);
  assert.match(R.parseJewels('# JOYAS\nnada').causa, /^NO_DATA · no_jewels:/);
  const vivas = R.parseJewels(readFileSync(new URL('../odd/JOYAS.md', import.meta.url), 'utf8'));
  assert.ok(vivas.ok && vivas.jewels.length >= 7, 'the repo JOYAS.md does not parse');
  for (const [i, j] of vivas.jewels.entries()) { assert.ok(bytes(R.jewelLine(j, i, vivas.jewels.length)) < 1024); }
  assert.match(R.JEWELS, /^https:\/\/raw\.githubusercontent\.com\/piskyRpapalo\/preceptoros-web\/main\/odd\/JOYAS\.md$/);
});

test('jewels are asked by whole word, in English or Spanish', () => {
  for (const s of ['jewels', 'show me a joya', 'Joyas!']) { assert.ok(C.wantsJewels(s), s); }
  for (const s of ['jewelry', 'joyería', 'ideas']) { assert.ok(!C.wantsJewels(s), s); }
});
