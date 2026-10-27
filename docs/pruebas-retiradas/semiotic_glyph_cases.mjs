// Compact-glyph contract: four deterministic coordinates, no remote assets or hidden sound.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const glyphFile = process.env.SEMIOTIC_GLYPH_MODULE || path.join(root, 'public/game/semiotic_glyph.js');
const glyph = require(glyphFile);
const colors = ['#E6A817', '#00D2FF', '#2ECC71', '#9B59B6', '#7F8C8D'];
assert.deepEqual(glyph.colores, colors);
let casos = 0;
for (let c = 0; c < 5; c++) for (let s = 0; s < 3; s++) for (let l = 0; l < 4; l++) for (let m = 0; m < 3; m++) {
  const v = [c, s, l, m], compact = JSON.stringify(v);
  assert.ok(compact.length < 64, compact);
  assert.deepEqual(glyph.normaliza(v), v);
  assert.ok(glyph.describe(v).length > 0);
  casos++;
}
for (const bad of [null, [], [0, 0, 0], [5, 0, 0, 0], [0, 3, 0, 0], [0, 0, 4, 0], [0, 0, 0, 3], ['0', 0, 0, 0]]) {
  assert.equal(glyph.normaliza(bad), null, JSON.stringify(bad));
}
class Element {
  constructor(tag) { this.tagName = tag; this.attributes = {}; this.children = []; this.handlers = {}; this.dataset = {}; this._text = ''; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  appendChild(n) { this.children.push(n); return n; }
  addEventListener(k, f) { this.handlers[k] = f; }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text; }
  querySelector(selector) { if (selector === '[role=status]') return this.find(n => n.attributes?.role === 'status'); return null; }
  find(f) { for (const n of this.children) { if (f(n)) return n; const q = n.find?.(f); if (q) return q; } return null; }
}
globalThis.document = { createElement: tag => new Element(tag), createElementNS: (_ns, tag) => new Element(tag) };
let audioCreated = 0;
globalThis.AudioContext = class {
  constructor() { audioCreated++; this.currentTime = 0; this.destination = {}; }
  createGain() { return { gain: { value: 0, setValueAtTime() {} }, connect() {} }; }
  createOscillator() { return { frequency: { value: 0, linearRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
};
const target = new Element('section'), mounted = glyph.monta(target, [1, 0, 0, 2], 'A cyan shield protects the boundary.');
assert.equal(mounted.estado, 'MEDIDO');
const box = target.children[0], svg = box.children[0], button = box.children.find(n => n.tagName === 'button');
assert.equal(svg.attributes.role, 'img');
assert.match(svg.attributes['aria-label'], /signal cyan.*transport vector/i);
assert.equal(audioCreated, 0, 'sound must stay off before a tap');
button.handlers.click();
assert.equal(audioCreated, 1, 'sound starts only from the button');
assert.match(box.querySelector('[role=status]').textContent, /432 to 528 Hz/i);
const src = readFileSync(glyphFile, 'utf8');
const audio = src.match(/function sound\(kind\) \{[\s\S]*?\n  \}/)?.[0];
assert.ok(audio && Buffer.byteLength(audio) < 1024, `audio source ${Buffer.byteLength(audio || '')} B`);
for (const remote of ['fetch(', 'WebSocket', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'indexedDB']) assert.ok(!src.includes(remote), remote);
console.log(JSON.stringify({ casos, invalidos: 8, tonos_b: Buffer.byteLength(audio), compacto_max_b: 9, rendered: true, audio_opt_in: audioCreated === 1 }));
