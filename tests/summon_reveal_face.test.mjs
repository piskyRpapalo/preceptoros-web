import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('..', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
test('summon_reveal passes face:true to AtlasOnda.dibuja', () => {
  const src = read('public/game/summon_reveal.js');
  assert.ok(src.includes('face: true'), 'summon_reveal passes face:true to AtlasOnda.dibuja');
  assert.ok(src.includes('window.AtlasOnda') || src.includes('raiz.AtlasOnda'), 'uses the live vocabulary module');
});
test('summon_reveal stays under the 16 KiB ceiling', () => {
  const bytes = readFileSync(new URL('public/game/summon_reveal.js', root)).length;
  assert.ok(bytes <= 16384, 'summon_reveal.js over ceiling: ' + bytes);
});
