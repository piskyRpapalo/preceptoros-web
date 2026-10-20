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
test('summon scene loads comic_tokens before wave_render and summon_reveal', () => {
  const src = read('public/assets/thegame.js');
  const casa = src.match(/var CASA = \[\[([\s\S]*?)\]\];/);
  assert.ok(casa, 'CASA script list found');
  const scripts = casa[1];
  const iTokens = scripts.indexOf('/game/comic_tokens.js');
  const iWave = scripts.indexOf('/game/wave_render.js');
  const iReveal = scripts.indexOf('/game/summon_reveal.js');
  assert.ok(iTokens !== -1, 'comic_tokens.js in CASA');
  assert.ok(iWave !== -1, 'wave_render.js in CASA');
  assert.ok(iReveal !== -1, 'summon_reveal.js in CASA');
  assert.ok(iTokens < iWave, 'comic_tokens loads before wave_render');
  assert.ok(iWave < iReveal, 'wave_render loads before summon_reveal');
});
