import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const figures = require('../public/game/map_bubble_figures.js');
const bubble = require('../public/game/bubble_language.js');
require('../public/game/bubble_bestiary.js');
const names = ['star', 'octo'];
for (const name of names) {
  for (const eye of ['open', 'shut']) {
    const frame = figures.frame(name, 24, 31, 12, eye);
    assert.ok(frame, name + ' frame is valid');
    assert.ok(Buffer.byteLength(JSON.stringify(frame), 'utf8') < 1024, name + ' frame exceeds channel ceiling');
    assert.ok(bubble.compile(frame).length > 0, name + ' resolves to bestiary drawing');
    assert.equal(frame.atoms[0].i[0].eye, eye, name + ' preserves map state');
  }
}
console.log('map bubble cases: 8/8');
