// Predefined links: every link the site hands out (the app's shortcuts, the collaborators' first steps) is a known route.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const D = createRequire(import.meta.url)('../../public/game/map_links.js');
const read = (p) => readFileSync(new URL('../../public/' + p, import.meta.url), 'utf8');
test('parse keeps only known routes and real buildings; nothing is guessed', () => {
  assert.deepEqual(D.parse('?go=chat'), { go: 'chat', id: null, ask: null });
  assert.deepEqual(D.parse('?go=building&id=agora'), { go: 'building', id: 'agora', ask: null });
  assert.deepEqual(D.parse('?go=building&id=castle'), { go: null, id: null, ask: null });
  assert.deepEqual(D.parse('?go=sign&ask=%20'), { go: null, id: null, ask: null });
  assert.equal(D.parse('?ask=' + 'x'.repeat(601)).ask, null);
  assert.equal(D.parse('?go=guide&ask=How%20do%20I%20move%3F').ask, 'How do I move?');
});
test('the buildings a link may open are exactly the nine of the contract', () => {
  const ids = JSON.parse(read('game/building_interiors.json')).buildings.map((b) => b.id).sort();
  assert.deepEqual([...D.BUILDINGS].sort(), ids);
});
test('every shortcut of the Android app and every first-step link is a route the map knows', () => {
  const urls = JSON.parse(read('manifest.webmanifest')).shortcuts.map((s) => s.url);
  const page = read('get-the-app/index.html');
  for (const m of page.matchAll(/href="(\/openworld\/\?[^"]+)"/g)) { urls.push(m[1].replace(/&amp;/g, '&')); }
  assert.ok(urls.length >= 12, urls.length);
  urls.filter((u) => u.includes('?')).forEach((u) => { const r = D.parse(u.slice(u.indexOf('?'))); assert.ok(r.go || r.ask, u); });
});
test('a link never sends, signs or plays: no submit, no click on Play, no chance, no clock', () => {
  const src = read('game/map_links.js');
  assert.ok(!/requestSubmit|\.submit\(|welcome-play|play-now|Math\.random|Date\.now/.test(src));
});
