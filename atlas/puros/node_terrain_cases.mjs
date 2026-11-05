// Cases of NO-1 (atlas/puros/node_terrain.js): a node's terrain comes from its heartbeat, the same heartbeat gives the
// same tiles, every tile is a valid Acho frame that reads aloud, and water sounds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const T = require('./node_terrain.js');
const A = require('./acho.js');
const S = require('../../public/game/acho_sonify.js');
const NM = A.nombres(require('../../public/game/comic_tokens.js'), require('../../public/game/comic_accents.js').ACCENTS);

const latidos = [
  { id: 'primer-ancla', q: 0, r: 0, alive: true, seal: 'LIVE', since: '2026-11-02' },
  { id: 'nodo-rack', q: 1, r: 0, alive: true, seal: 'STALE', since: '2026-11-01' },
  { id: 'nodo-movil', q: 2, r: -1, alive: true, seal: 'LIVE', since: '2026-11-03' },
];
const todas = latidos.flatMap((n) => T.terreno(n).frames);

test('the house hash: FNV-1a vectors', () => {
  assert.equal(T.hash32('').toString(16), '811c9dc5');
  assert.equal(T.hash32('a').toString(16), 'e40c292c');
});

test('seven tiles per node, every one a valid Acho frame under 1,024 B', () => {
  for (const n of latidos) assert.equal(T.terreno(n).frames.length, 7);
  for (const f of todas) { const r = A.valida(f, NM); assert.equal(r.ok, true, f.id + ' ' + JSON.stringify(r.causes)); assert.ok(r.bytes < 1024); }
});

test('the same heartbeat gives the same tiles, byte by byte; another day gives other land', () => {
  assert.equal(JSON.stringify(T.terreno(latidos[0])), JSON.stringify(T.terreno({ ...latidos[0] })));
  const otro = T.terreno({ ...latidos[0], since: '2026-11-05' }).frames.map((f) => f.atoms[0].k).join();
  const este = T.terreno(latidos[0]).frames.map((f) => f.atoms[0].k).join();
  const varios = ['2026-11-05', '2026-11-06', '2026-11-07'].map((d) => T.terreno({ ...latidos[0], since: d }).frames.map((f) => f.atoms[0].k).join());
  assert.ok(varios.some((x) => x !== este), 'the day of birth must move the land: ' + otro);
});

test('the seal changes the sentence, never the land (a STALE node keeps its tiles)', () => {
  const vivo = T.terreno({ ...latidos[1], seal: 'LIVE' }).frames, viejo = T.terreno(latidos[1]).frames;
  assert.deepEqual(vivo.map((f) => f.atoms[0].k), viejo.map((f) => f.atoms[0].k));
  assert.match(A.lee(viejo[0]).alt, /^STALE · the home tile of nodo-rack at \(1,0\)/);
});

test('every tile reads aloud: its line names the node, the place, the kind and whether it sounds', () => {
  for (const f of todas) {
    const { alt } = A.lee(f);
    assert.ok(alt.length <= A.ALT_MAX);
    assert.match(alt, /(water|mountain|plain)/);
    assert.match(alt, /(Sound: 1 voice|Silent: (mountain|plain) declares no waves)/);
  }
});

test('water sounds, and the verdict agrees with the served sonify core', () => {
  const agua = todas.filter((f) => f.atoms[0].k === 'terrain.water');
  assert.ok(agua.length > 0, 'the three heartbeats must hold some water');
  for (const f of todas) {
    assert.equal(A.oye(f).ok, f.atoms[0].k === 'terrain.water', f.id);
    assert.equal(A.oye(f).ok, S.sonify(f).ok, f.id);
  }
});

test('fail-closed: an unreadable heartbeat draws nothing, never a guessed node', () => {
  for (const x of [null, {}, { id: 'X Y', q: 0, r: 0, since: '2026-11-02' }, { id: 'a', q: 0.5, r: 0, since: '2026-11-02' },
    { id: 'a', q: 0, r: 0, since: 'yesterday' }]) {
    assert.equal(T.terreno(x).ok, false, JSON.stringify(x));
  }
  assert.equal(T.terreno({ ...latidos[0], seal: 'PROBABLE' }).frames[0].seal, 'NO_DATA');
});

test('pure: no DOM, network, clock or random; no machine names', () => {
  const src = readFileSync(new URL('./node_terrain.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const p of [/Math\.random/, /Date\b/, /fetch\(/, /document\./, /require\(/]) assert.doesNotMatch(src, p);
});
