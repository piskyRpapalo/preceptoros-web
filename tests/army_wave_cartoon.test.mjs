import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');

test('wave_render exports drawFace and dibuja honors face flag', () => {
  const src = read('public/game/wave_render.js');
  assert.ok(/function drawFace\(/.test(src), 'drawFace defined');
  assert.ok(/drawFace: drawFace/.test(src), 'drawFace exported in AtlasOnda');
  assert.ok(/if \(o\.face\)/.test(src), 'dibuja calls drawFace when face:true');
  assert.ok(/arc\(x \+ s \* ex/.test(src), 'two eyes as arcs');
  assert.ok(/0\.15 \* Math\.PI, 0\.85 \* Math\.PI/.test(src), 'smile arc from 0.15pi to 0.85pi');
});

test('ui-ficha traza draws with rarity band and face', () => {
  const src = read('public/game/ui-ficha.js');
  assert.ok(src.includes('BANDA'), 'rarity bands declared');
  assert.ok(src.includes('face: true'), 'traza passes face:true to AtlasOnda.dibuja');
  assert.ok(src.includes('window.AtlasOnda'), 'uses the live vocabulary module');
});

test('both files stay under the 16 KiB ceiling', () => {
  for (const f of ['public/game/wave_render.js', 'public/game/ui-ficha.js']) {
    const bytes = readFileSync(new URL(f, root)).length;
    assert.ok(bytes <= 16384, f + ' over ceiling: ' + bytes);
  }
});
