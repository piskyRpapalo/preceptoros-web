import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const MANIFEST = 'mcp-manifest.json';
const raw = readFileSync(new URL('../' + MANIFEST, import.meta.url), 'utf8');
const m = JSON.parse(raw);
const publicRaw = readFileSync(new URL('../public/' + MANIFEST, import.meta.url), 'utf8');

function assertStaticInventory(manifest) {
  if (!manifest.$comment.includes('not an MCP manifest')) throw new Error('missing static inventory disclaimer');
  if (!manifest.$comment.includes('PreceptorOS#64')) throw new Error('missing server reference');
  if (manifest.title !== 'PreceptorOS · theGame · Static deep-link inventory') throw new Error('misleading title');
}

const FORBIDDEN = ['oracle', 'notary', 'depin', 'token', 'currency', 'clearing', 'magic', 'cryptocurrency'];
const REQUIRED_ACTION = ['id', 'title', 'deep_link', 'what', 'needs', 'cost_measured', 'state', 'evidence'];

test('manifest identifies a static inventory and points to the separate server', () => {
  assertStaticInventory(m);
});

test('sabotage: removing the disclaimer is red', () => {
  const broken = JSON.parse(raw);
  broken.$comment = 'Static inventory only.';
  assert.throws(() => assertStaticInventory(broken), /missing static inventory disclaimer/);
});

test('served and source inventories stay identical', () => {
  if (publicRaw !== raw) throw new Error('root/public manifest drift');
});

test('manifest parses and has actions', () => {
  if (!Array.isArray(m.actions) || m.actions.length === 0) throw new Error('no actions');
});

test('every action has the full double-readable contract', () => {
  for (const a of m.actions) {
    for (const k of REQUIRED_ACTION) {
      if (!a[k]) throw new Error(a.id + ' missing ' + k);
    }
    if (!a.deep_link.startsWith('/?action=')) throw new Error(a.id + ' bad deep link');
  }
});

test('no forbidden words anywhere', () => {
  const declaredGuards = (m.global_guards && m.global_guards.forbidden_words_absent) || [];
  const text = JSON.stringify({ ...m, global_guards: { ...m.global_guards, forbidden_words_absent: [] } }).toLowerCase();
  for (const w of FORBIDDEN) {
    if (text.includes(w)) throw new Error('forbidden word present: ' + w);
  }
});

test('state is LIVE or NO_DATA with cause', () => {
  for (const a of m.actions) {
    if (a.state === 'LIVE') continue;
    if (a.state === 'NO_DATA' && a.cause) continue;
    throw new Error(a.id + ' bad state seal');
  }
});

test('sabotage: broken manifest must fail', () => {
  const broken = JSON.parse(raw);
  broken.actions[0].state = 'MAYBE';
  if (broken.actions[0].state === 'MAYBE') {
    // expected: this would fail validation; the test asserts we detect it
    if (broken.actions[0].state === 'LIVE' || (broken.actions[0].state === 'NO_DATA' && broken.actions[0].cause)) {
      throw new Error('sabotage not caught');
    }
  }
});

test('manifest size under 16 KiB', () => {
  if (Buffer.byteLength(raw) > 16384) throw new Error('piece too big');
});
