import { readFileSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { page, SKINS, WEB_PREFIX, APP_PREFIX } from './tools/build.mjs';
const require = createRequire(import.meta.url);
const Bubble = require('../../../public/game/bubble_language.js');
const Face = require('./face.js');
const dir = 'docs/rebuild/examples';
const sabotage = process.env.VALIDATE_SABOTAGE || '';
const names = Object.keys(SKINS);
assert.deepEqual(names, ['basic', 'atlantis', 'zombie']);
const strip = (v) => Array.isArray(v) ? v.filter((x) => !(x && x.tag === 'highlight')).map(strip) : v && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).filter(([k]) => !['fill', 'stroke', 'shadow', 'shadowFill'].includes(k)).map(([k, x]) => [k, strip(x)])) : v;
const bytes = (o) => Buffer.byteLength(JSON.stringify(o), 'utf8');
function rgb(c) {
  let m;
  if ((m = /^#([0-9a-f]{6})$/i.exec(c))) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  if ((m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(c))) return m.slice(1, 4).map(Number);
  if ((m = /^hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)$/.exec(c))) {
    const h = +m[1], s = m[2] / 100, l = m[3] / 100, a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map((n) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); });
  }
  throw new Error('colour not parsed: ' + c);
}
const lum = (c) => { const [r, g, b] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(Bubble.band(a)), y = lum(Bubble.band(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

for (const f of ['face.js', 'face.css', 'index.html', ...names.map((n) => n + '.html')]) {
  const size = statSync(join(dir, f)).size;
  assert.ok(size <= 16384, `${f} is ${size} B, over the 16,384 B piece ceiling`);
}
const code = readFileSync(join(dir, 'face.js'), 'utf8');
assert.doesNotMatch(code, /Math\.random|Date\.now|new Date|fetch\(|localStorage|XMLHttpRequest|WebSocket/, 'face.js uses a forbidden source of authority or network');
assert.doesNotMatch(code, /\/\/ |\/\*/, 'served face.js carries comments');
const served = [code, readFileSync(join(dir, 'face.css'), 'utf8'), readFileSync(join(dir, 'tools/face.tpl.html'), 'utf8'), readFileSync(join(dir, 'index.html'), 'utf8')].join('\n');
assert.doesNotMatch(served, /oraculo|notario|depin|\btoken\b|moneda|clearing|magia/i, 'banned word in served text');
assert.doesNotMatch(served, /\b(?:src|href)=["']https?:\/\//i, 'remote request in served text');
assert.doesNotMatch(served, /<img\b|data:image\/(?:png|jpeg)/i, 'raster imagery in served text');
assert.doesNotMatch(served, /([0-9]{1,3}\.){3}[0-9]{1,3}|\/h[o]me\/|d[o]ogee|S1[1]0\b/i, 'address, user path or device name in served text');

const tpl = readFileSync(join(dir, 'tools/face.tpl.html'), 'utf8');
for (const b of tpl.match(/<button\b[^>]*>.*?<\/button>/g)) assert.match(b.replace(/<span aria-hidden="true">.*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim(), /\w/, 'button without a text label: ' + b);
for (const c of tpl.match(/<canvas\b[^>]*>/g)) assert.match(c, /aria-label="[^"]+"/, 'canvas without a label: ' + c);
for (const id of ['packet', 'say', 'machine', 'log', 'joy', 'scene', 'head', 'skin']) assert.match(tpl, new RegExp(`id="${id}"`), 'missing #' + id);
assert.match(tpl, /role="status" aria-live="polite"/, 'no live narration');

const states = [];
for (let stop = 0; stop < Face.STOPS.length; stop++) for (const sound of [false, true]) for (const change of Face.CHANGES) states.push({ stop, sound, change });
let worst = 0;
const ref = {};
for (const name of names) {
  const html = readFileSync(join(dir, name + '.html'), 'utf8');
  assert.equal(html, page(name, WEB_PREFIX), `${name}.html drifted from the shared template; run node tools/build.mjs`);
  const skin = Object.assign({ name }, SKINS[name]);
  if (sabotage === 'geometry' && name === 'zombie') Face.STOPS[0] = [61, 376];
  const frames = states.map((st) => ['scene', Face.sceneFrame(skin, st)]).concat([['head', Face.headFrame(skin)], ['joy', Face.joyFrame(skin, -40, 0)], ['joy0', Face.joyFrame(skin, 0, 0)]]);
  if (sabotage === 'size' && name === 'atlantis') frames[0][1].change = ['x'.repeat(200)];
  frames.forEach(([kind, f], i) => {
    const n = bytes(f);
    worst = Math.max(worst, n);
    assert.ok(n < 1024, `${name} ${kind} frame ${i} is ${n} UTF-8 bytes`);
    assert.equal(f.v, 'preceptoros.bubble/1');
    const items = Bubble.compile(f);
    assert.ok(items.length > 0 && Bubble.compile.notes.length === 0, `${name} ${kind} frame ${i} did not compile cleanly: ${JSON.stringify(Bubble.compile.notes)}`);
    for (const b of f.bands) Bubble.band(b);
    const shape = JSON.stringify(strip(items));
    if (!(i in ref)) ref[i] = shape;
    else assert.equal(shape, ref[i], `${name} ${kind} frame ${i} geometry differs from basic`);
  });
  if (sabotage === 'geometry') Face.STOPS[0] = [62, 376];
  const u = SKINS[name].ui;
  for (const [a, b, min] of [['fg', 'bg', 4.5], ['fg', 'panel', 4.5], ['onAccent', 'accent', 4.5], ['edge', 'bg', 3]]) {
    const r = contrast(u[a], u[b]);
    assert.ok(r >= min, `${name} contrast ${a}/${b} is ${r.toFixed(2)}, below ${min}`);
  }
  console.log(`${name}: ${frames.length} frames < 1,024 B; geometry identical; contrast fg/bg ${contrast(u.fg, u.bg).toFixed(2)}, accent ${contrast(u.onAccent, u.accent).toFixed(2)}; PASS`);
}
const pal = names.map((n) => JSON.stringify(Face.sceneFrame(Object.assign({ name: n }, SKINS[n]), { stop: 2 }).bands));
assert.equal(new Set(pal).size, 3, 'two skins share the same palette');
const index = readFileSync(join(dir, 'index.html'), 'utf8');
for (const name of names) assert.match(index, new RegExp(`src="${name}\\.html"`));
console.log(`worst frame ${worst} UTF-8 bytes of 1,024; launcher lists all three skins; zero remote resources; PASS`);

if (process.env.APP_DIR) {
  const app = join(process.env.APP_DIR, 'interface', 'face');
  assert.ok(existsSync(app), 'APP_DIR has no interface/face');
  for (const f of ['face.js', 'face.css', 'skins.json']) assert.equal(readFileSync(join(app, f), 'utf8'), readFileSync(join(dir, f), 'utf8'), `app ${f} differs from web`);
  for (const name of names) assert.equal(readFileSync(join(app, name + '.html'), 'utf8'), page(name, APP_PREFIX), `app ${name}.html differs from the shared template`);
  console.log('app parity: face.js, face.css, skins and three pages byte-identical to the web template; PASS');
}
