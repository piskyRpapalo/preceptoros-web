// C3 · the Conquest sheet: flags on the buildings held, the building types with their customisation level, and Build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../../public/game/conquest_sheet.js');
const MC = { KINDS: [['hostel', 'cone', 'PROPUESTA.base'], ['coliseum', 'arch', 'LIVE.base'], ['tower', 'spire', 'cyan']] };
const sand = [5, 0, 1, 'sand'], water = [5, 0, 0, 'water'];
test('the web does not build: an ephemeral account only conquers; building belongs to nodes, in the app', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../../public/game/conquest_sheet.js', import.meta.url), 'utf8');
  assert.ok(!/set-build-|Build here|function build\(|localStorage\.setItem/.test(src), 'no build button, no build, no write');
  assert.equal(C.why, undefined);
  assert.equal(C.KEY, 'preceptoros.built', 'what was built before is still read, so its flag stays');
  assert.deepEqual(C.read({ localStorage: { getItem: () => 'not json' } }), []);
});
test('flags: the node\'s own, the ones built here and this visit\'s conquests; never a building still held by an NPC', () => {
  const list = [{ id: 'hostel', q: 3, r: 0 }, { id: 'doctor', q: 4, r: -4, fog: true }, { id: 'agora', q: 6, r: 1, fog: true, won: true }, { id: 'tower', q: 5, r: 2, own: 1 }];
  const F = C.flags(list);
  assert.deepEqual(F.map((f) => f.id), ['hostel', 'agora', 'tower']);
  assert.deepEqual(F.map((f) => f.how), ["the node's own", 'conquered this visit', 'built on this device']);
  assert.equal(F[0].name, 'Hostel');
  assert.deepEqual(C.flags(null), []);
});
test('types: every map kind with its roof and tone; the level is honest (none), the next one says NO_DATA with its cause', () => {
  const T = C.types(MC.KINDS, [{ id: 'hostel' }, { id: 'hostel' }]);
  assert.equal(T.length, 3);
  assert.deepEqual(T.map((t) => [t.roof, t.tone]), [['cone', 'PROPUESTA.base'], ['arch', 'LIVE.base'], ['spire', 'cyan']]);
  assert.equal(T[0].placed, 2);
  assert.ok(T.every((t) => t.level === 'none' && t.next === 'name' && /not built yet/.test(t.cause)));
  assert.deepEqual(C.LEVELS, ['none', 'name', 'skin', 'speech']);
  assert.ok(T.every((t) => t.about && !/NO_DATA/.test(t.about) && t.about.length < 70), 'each building has a short family-friendly line');
});
test('each building is a cream bubble that folds: the map colour and the title closed, what it does open, Technical folded inside', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../../public/game/conquest_sheet.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../../public/game/talk.css', import.meta.url), 'utf8');
  assert.match(src, /bub = doc\.createElement\('details'\), top = doc\.createElement\('summary'\)/);
  assert.match(src, /top\.appendChild\(sw\); top\.appendChild\(ti\)/, 'the colour circle and the title sit in the bubble\'s summary');
  assert.match(src, /bub\.appendChild\(ab\); bub\.appendChild\(tech\)/, 'what it does, then Technical, inside the bubble');
  assert.match(css, /\.cq-bubble\{[^}]*background:var\(--afffdf6\)/, 'the bubble is cream (the paper token)');
  assert.match(css, /\.cq-bubble>summary\{[^}]*min-height:44px/);
});
