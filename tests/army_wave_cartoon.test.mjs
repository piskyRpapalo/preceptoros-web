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

test('face uses named paper and ink bands and preserves canvas state', async () => {
  const { runInNewContext } = await import('node:vm');
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const palette = require('../public/game/comic_tokens.js');
  const scope = { AtlasComicTokens: palette };
  runInNewContext(read('public/game/wave_render.js'), scope);
  const marks = [], stack = [];
  const g = {
    globalAlpha: 0.5, fillStyle: 'previous', strokeStyle: 'previous', lineWidth: 2,
    save() { stack.push([this.globalAlpha, this.fillStyle, this.strokeStyle, this.lineWidth]); },
    restore() { [this.globalAlpha, this.fillStyle, this.strokeStyle, this.lineWidth] = stack.pop(); },
    beginPath() {}, arc() {},
    fill() { marks.push(['fill', this.fillStyle, this.globalAlpha]); },
    stroke() { marks.push(['stroke', this.strokeStyle, this.globalAlpha]); }
  };
  scope.AtlasOnda.drawFace(g, 50, 50, 30, {});
  assert.equal(marks.length, 7);
  assert.deepEqual(marks.filter(m => m[0] === 'fill').map(m => m[1]),
    [palette.NEUTRAL.paper, palette.NEUTRAL.ink, palette.NEUTRAL.paper, palette.NEUTRAL.ink]);
  assert.ok(marks.filter(m => m[0] === 'stroke').every(m => m[1] === palette.NEUTRAL.ink));
  assert.ok(marks.every(m => m[2] > 0 && m[2] <= 0.5));
  assert.deepEqual([g.globalAlpha, g.fillStyle, g.strokeStyle, g.lineWidth], [0.5, 'previous', 'previous', 2]);
});
