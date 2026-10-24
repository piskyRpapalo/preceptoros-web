import { readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import Bubble from '../../../public/game/bubble_language.js';
const names = ['basic', 'atlantis', 'zombie'];
let reference;
const palettes = [];
function geometry(value) {
  if (Array.isArray(value)) return value.map(geometry);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([k]) => !['fill', 'stroke', 'shadow', 'shadowFill'].includes(k)).map(([k, v]) => [k, geometry(v)]));
  }
  return value;
}
for (const name of names) {
  const file = `docs/rebuild/examples/${name}.html`;
  const html = readFileSync(file, 'utf8');
  assert.ok(statSync(file).size < 16384, `${name} page exceeds piece ceiling`);
  assert.doesNotMatch(html, /\b(?:src|href)=["']https?:\/\//i, `${name} has a remote request`);
  assert.doesNotMatch(html, /<img\b|data:image\/(?:png|jpeg)/i, `${name} contains raster imagery`);
  const match = html.match(/var frame=(\{.*?\});try/s);
  assert.ok(match, `${name} frame missing`);
  const frame = JSON.parse(match[1]);
  const bytes = Buffer.byteLength(JSON.stringify(frame), 'utf8');
  assert.ok(bytes < 1024, `${name} frame is ${bytes} bytes`);
  assert.equal(frame.v, 'preceptoros.bubble/1');
  palettes.push(frame.bands);
  const compiled = Bubble.compile(frame);
  assert.ok(compiled.length > 0);
  const shape = JSON.stringify(geometry(compiled));
  if (reference === undefined) reference = shape;
  else assert.equal(shape, reference, `${name} geometry differs from basic`);
  console.log(`${name}: ${bytes} UTF-8 frame bytes; ${compiled.length} primitives; PASS`);
}
assert.notDeepEqual(palettes[0], palettes[1]);
assert.notDeepEqual(palettes[1], palettes[2]);
const index = readFileSync('docs/rebuild/examples/index.html', 'utf8');
for (const name of names) assert.match(index, new RegExp(`src="${name}\\.html"`));
console.log('launcher: all three themes; zero remote resources; PASS');
