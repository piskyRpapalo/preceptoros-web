// Cases for version_sw_gate (R-INVESTIGATION L4, 2026-10-25). Fixtures are copied from
// measured main history, not invented: web#311 (b23a512a) changed face/face_tutorial.js
// and kept abjc; web#320 (c5c62c57) changed only network-passthrough JSON and kept abjc.
// Sabotage: VERSION_SW_SABOTAGE=1 makes cached() answer false for everything; every case
// that must be red then turns green and the run fails, which proves the cases bite.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as gate from './version_sw_gate.mjs';

const listas = readFileSync(new URL('../public/sw-listas.js', import.meta.url), 'utf8');
const lists = gate.listsOf(listas);
const sabotage = process.env.VERSION_SW_SABOTAGE === '1';
const decide = (a) => (sabotage ? gate.decide({ ...a, lists: { contenidoJson: [], redPrimero: [] }, changed: [] }) : gate.decide(a));

const ABJC = 'preceptoros-2026-17-abjc';
const ABJD = 'preceptoros-2026-17-abjd';
const PR311 = ['public/atlas-mundo.json', 'public/counters.json', 'public/face/face_tutorial.js'];
const PR320 = ['public/atlas-mundo.json', 'public/counters.json', 'public/mcp-manifest.json', 'public/release.json'];
const base = { lists, waiversBase: '', waiversHead: '' };

let total = 0;
function check(name, run) {
  try { run(); total++; } catch (e) { console.error('FAIL ' + name + '\n' + e.message); process.exit(1); }
}

check('the lists come from the served sw-listas.js', () => {
  assert.ok(lists.contenidoJson.includes('/atlas-en.json'));
  assert.ok(lists.redPrimero.includes('/manifest.webmanifest'));
});
check('cached(): same rule as the fetch handler of sw.js', () => {
  assert.equal(gate.cached('public/counters.json', lists), false);      // passthrough json
  assert.equal(gate.cached('public/atlas-en.json', lists), true);       // CONTENIDO_JSON
  assert.equal(gate.cached('public/manifest.webmanifest', lists), false); // RED_PRIMERO
  assert.equal(gate.cached('public/game/sea.js', lists), true);
  assert.equal(gate.cached('public/sw.js', lists), true);
  assert.equal(gate.cached('docs/x.md', lists), false);
});
check('RED · web#311 replayed: cached module changed, VERSION kept', () => {
  const v = decide({ ...base, changed: PR311, versionBase: ABJC, versionHead: ABJC });
  assert.equal(v.ok, false);
  assert.deepEqual(v.blocking, ['public/face/face_tutorial.js']);
  assert.match(gate.message(v), /RED · 1 cached path/);
  assert.match(gate.message(v), /bin\/sellar\.py --sellar/);
});
check('GREEN · web#311 with the bump it lacked', () => {
  assert.equal(decide({ ...base, changed: PR311, versionBase: ABJC, versionHead: ABJD }).ok, true);
});
check('GREEN · web#320 replayed: only passthrough JSON, no bump needed', () => {
  const v = decide({ ...base, changed: PR320, versionBase: ABJC, versionHead: ABJC });
  assert.equal(v.ok, true);
  assert.equal(v.hits.length, 0);
});
check('RED · a missing VERSION is never green', () => {
  assert.equal(decide({ ...base, changed: [], versionBase: ABJC, versionHead: null }).ok, false);
});
const W = 'public/face/face_tutorial.js | 2026-10-25 | copy-only change, old copy is harmless';
check('GREEN · waiver added in this diff, exact path', () => {
  const v = decide({ ...base, changed: PR311, versionBase: ABJC, versionHead: ABJC, waiversHead: W + '\n' });
  assert.equal(v.ok, true);
  assert.deepEqual(v.waived, ['public/face/face_tutorial.js']);
});
check('RED · a waiver already at base does not leak into a later diff', () => {
  assert.equal(decide({ ...base, changed: PR311, versionBase: ABJC, versionHead: ABJC, waiversBase: W, waiversHead: W }).ok, false);
});
check('RED · a waiver for another path does not cover this one', () => {
  const other = 'public/face/face.css | 2026-10-25 | reason';
  assert.equal(decide({ ...base, changed: PR311, versionBase: ABJC, versionHead: ABJC, waiversHead: other }).ok, false);
});
check('RED · a waiver without date or reason is ignored', () => {
  for (const bad of ['public/face/face_tutorial.js', 'public/face/face_tutorial.js | 25-10-2026 | r', 'public/face/face_tutorial.js | 2026-10-25 |']) {
    assert.equal(decide({ ...base, changed: PR311, versionBase: ABJC, versionHead: ABJC, waiversHead: bad }).ok, false, bad);
  }
});

console.log(JSON.stringify({ v: 'preceptoros.version_sw/1', casos: total, ok: true }));
