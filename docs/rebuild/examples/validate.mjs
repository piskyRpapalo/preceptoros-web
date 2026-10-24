import { readFileSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { page, SKINS, WEB_PREFIX, APP_PREFIX, APP_BASE } from './tools/build.mjs';
const require = createRequire(import.meta.url);
const Bubble = require('../../../public/game/bubble_language.js');
require('../../../public/game/bubble_bestiary.js');
require('../../../public/game/bubble_world.js');
const Iso = require('../../../public/game/isometric_floor_projection.js');
const Codex = require('../../../public/assets/codex_scene.js');
const World = require('./face_world.js');
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

for (const f of ['face.js', 'face_world.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face.css', 'index.html', ...names.map((n) => n + '.html')]) {
  const size = statSync(join(dir, f)).size;
  assert.ok(size <= 16384, `${f} is ${size} B, over the 16,384 B piece ceiling`);
}
const code = ['face.js', 'face_world.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js'].map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
assert.doesNotMatch(code, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|localStorage|XMLHttpRequest|WebSocket/, 'face code uses a forbidden source of authority or network');
assert.doesNotMatch(code, /\/\/ |\/\*/, 'served face code carries comments');
const served = [code, readFileSync(join(dir, 'face.css'), 'utf8'), readFileSync(join(dir, 'tools/face.tpl.html'), 'utf8'), readFileSync(join(dir, 'index.html'), 'utf8')].join('\n');
assert.doesNotMatch(served, /oraculo|notario|depin|\btoken\b|moneda|clearing|magia/i, 'banned word in served text');
assert.doesNotMatch(served, /\b(?:src|href)=["']https?:\/\//i, 'remote request in served text');
assert.doesNotMatch(served, /<img\b|data:image\/(?:png|jpeg)/i, 'raster imagery in served text');
assert.doesNotMatch(served, /([0-9]{1,3}\.){3}[0-9]{1,3}|\/h[o]me\/|d[o]ogee|S1[1]0\b/i, 'address, user path or device name in served text');

const tpl = readFileSync(join(dir, 'tools/face.tpl.html'), 'utf8');
for (const b of tpl.match(/<button\b[^>]*>.*?<\/button>/g)) assert.match(b.replace(/<span aria-hidden="true">.*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim(), /\w/, 'button without a text label: ' + b);
for (const c of tpl.match(/<canvas\b[^>]*>/g)) assert.match(c, /aria-label="[^"]+"|aria-hidden="true"/, 'canvas without a label: ' + c);
assert.match(tpl, /id="mapwin" role="img" aria-label="[^"]+"/, 'the map window has no label');
for (const id of ['packet', 'say', 'machine', 'machine-map', 'log', 'joy', 'map', 'mapwin', 'head', 'skin', 'start', 'follow', 'counter', 'whole', 'tab-chat', 'tab-battle', 'tab-info', 'sheet-chat', 'sheet-battle', 'sheet-info', 'sheet-seal', 'b-start', 'b-step', 'b-play', 'b-withdraw', 'b-receipt']) assert.match(tpl, new RegExp(`id="${id}"`), 'missing #' + id);
assert.match(tpl, /role="status" aria-live="polite"/, 'no live narration');

const starts = [World.homeAt, [20, 20], [980, 20], [20, 980], [980, 980], [500, 500]].concat(World.places.map((p) => p.at));
const longTrail = Array.from({ length: 160 }, (_, i) => [20 + i * 6, 980 - i * 6]);
for (const [x, y] of [[0, 0], [306, 462], [980, 20], [20, 980], [517, 233]]) { const q = Iso.proyecta(x, y, Math.SQRT2); assert.deepEqual(World.iso(x, y), [Math.round(q.x), Math.round(q.y)], 'face_world.iso drifted from isometric_floor_projection.proyecta'); }
console.log('projection: face_world.iso equals the living map proyecta(col, fila, W = sqrt 2); PASS');
const states = [];
for (let task = 0; task <= World.places.length; task++) {
  for (const from of starts) {
    for (const sound of [false, true]) {
      if (task === World.places.length) { states.push({ at: from, task, step: 0, path: null, trail: longTrail, change: 'free text', sound }); continue; }
      const path = World.route(from, World.places[task]);
      const wk = World.walk(path);
      for (let step = 0; step <= wk.steps; step++) states.push({ at: wk.at[step], task, step, path, trail: longTrail, change: `step ${wk.steps} of ${wk.steps}`, sound, walking: true, dir: 1 });
    }
  }
}
const LAYOUTS = ['quiet', 'zones', 'terminal'];
let css = readFileSync(join(dir, 'face.css'), 'utf8');
if (sabotage === 'scroll') css = css.replace('html,body{height:100%;overflow:hidden;', 'html,body{height:100%;');
assert.match(css, /html,body\{height:100%;overflow:hidden;/, 'the page can scroll: one fixed window is the decree');
assert.match(css, /\.face\{[^}]*height:100dvh;[^}]*overflow:hidden/, 'the face is not one viewport-sized window');
assert.match(css, /\.sheets\{[^}]*overflow:auto/, 'the panel sheets must be the internal scroll area');
assert.match(css, /#map\{position:fixed;inset:0;/, 'the map is not the wallpaper behind the window');
assert.equal((tpl.match(/role="tab"/g) || []).length, 3, 'the panel must offer its categories as tabs');
assert.match(tpl, /role="tablist"/, 'the panel categories are not a tablist');
const Battle = require('./face_battle.js');
const Ticks = require('../../../public/game/combate_ticks.js');
let battleWorst = 0, battles = 0;
for (const w of [null, 0, 1, 2]) for (const f of Battle.forms) {
  const x = Battle.create(); x.form(f); x.begin();
  const frames = [x.frame()];
  while (!x.done()) { if (w !== null && x.b.st.ronda === 2) x.withdraw(w); x.step(); frames.push(x.frame()); }
  for (const fr of frames) {
    const n = bytes(fr); battleWorst = Math.max(battleWorst, n);
    assert.ok(n < 1024, `battle frame is ${n} UTF-8 bytes`);
    assert.ok(Bubble.compile(fr).length > 0 && Bubble.compile.notes.length === 0, 'battle frame did not compile cleanly');
  }
  const s = x.summary(), t = Battle.teams();
  const ref = Ticks.recibo(t.def, t.asa, Battle.seed, s.orders);
  assert.ok(ref.ok && s.receipt === ref.texto, 'the stepped battle drifted from combate_ticks.recibo');
  assert.ok(s.receipt.length <= 200, `receipt is ${s.receipt.length} B`);
  let rec = JSON.parse(s.receipt);
  if (sabotage === 'battle') rec = Object.assign({}, rec, { v: Object.assign({}, rec.v, { g: rec.v.g === 'defensa' ? 'asalto' : 'defensa' }) });
  assert.ok(Ticks.verifica(rec, t.def, t.asa).ok, 'the receipt does not verify by replay from tick 0');
  battles++;
}
console.log(`battle: ${battles} battles (4 order plans x 3 formations) stepped tick by tick equal combate_ticks; receipts <= 200 B verify by replay; worst frame ${battleWorst} B; PASS`);
console.log('one window: the page never scrolls, the chat scrolls inside, the map is the wallpaper; PASS');
let worst = 0;
const ref = {};
const seen = new Set();
for (const name of names) {
  const html = readFileSync(join(dir, name + '.html'), 'utf8');
  assert.equal(html, page(name, WEB_PREFIX), `${name}.html drifted from the shared template; run node tools/build.mjs`);
  const skin = Object.assign({ name }, SKINS[name]);
  if (sabotage === 'layout' && name === 'zombie') skin.layout = 'quiet';
  assert.ok(LAYOUTS.includes(skin.layout), `${name} has no known layout`);
  assert.ok(!seen.has(skin.layout), `${name} repeats the ${skin.layout} layout: three proposals need three distributions`);
  seen.add(skin.layout);
  assert.match(css, new RegExp(`\\[data-layout=${skin.layout}\\] \\.face\\{grid-template-columns:[^}]*grid-template-areas:`), `face.css has no wide distribution for ${skin.layout}`);
  assert.match(css.slice(css.indexOf('@media (max-width:760px)')), new RegExp(`\\[data-layout=${skin.layout}\\] \\.face\\{[^}]*grid-template-areas:`), `face.css has no phone distribution for ${skin.layout}`);
  assert.match(html, new RegExp(`<body data-layout="${skin.layout}">`), `${name}.html does not declare its layout`);
  if (sabotage === 'geometry' && name === 'zombie') World.isles[0].rx = 125;
  const frames = [['sea', World.seaFrame(skin)], ['isles0', World.islesFrame(skin, 0)], ['isles1', World.islesFrame(skin, 1)], ['isles2', World.islesFrame(skin, 2)], ['isles3', World.islesFrame(skin, 3)], ['stand', World.standFrame(skin)], ['names', World.namesFrame(skin)], ['head', World.headFrame(skin)], ['joy', World.joyFrame(skin, -40, 0)], ['joy0', World.joyFrame(skin, 0, 0)]]
    .concat(states.map((st) => ['state', World.stateFrame(skin, st)]));
  if (sabotage === 'size' && name === 'atlantis') frames[2][1].change = ['x'.repeat(400)];
  const cast = [];
  if (skin.cast !== 'none') {
    for (let moves = 0; moves < 36; moves++) for (const at of [World.homeAt].concat(World.canon.map((c) => [c.x, c.y]), [World.wanderAt(moves).slice(0, 2)])) cast.push(World.castFrame(skin, { at, moves, step: 99, change: 'step 99 of 99' }));
  }
  if (sabotage === 'canon' && name === 'atlantis') World.canon[0].r = 30;
  if (skin.cast === 'canon') {
    const rift = {};
    Codex.frame('RIFT').atoms.forEach((a) => (a.i || []).forEach((it) => { rift[it.o] = it; }));
    for (const c of World.canon) {
      const src = rift[c.o];
      assert.ok(src, `${c.o} is not a creature of the Codex RIFT frame`);
      for (const k of Object.keys(src)) {
        if (k === 'x' || k === 'y') continue;
        if (k === 'r' || k === 'rr') assert.equal(c[k], Math.round(src[k] * World.codexScale), `${c.o}.${k} is not the Codex size × ${World.codexScale}`);
        else assert.equal(c[k], src[k], `${c.o}.${k} differs from the Codex RIFT frame`);
      }
    }
    assert.equal(rift.crab.o, 'crab', 'the Codex RIFT crab is missing');
    assert.ok(JSON.stringify(World.standFrame(skin)).includes('"o":"city"'), 'the home town is not the canon city word');
    console.log(`${name}: canon creatures are the Codex RIFT words (octo, star, snail, bust; crab as your unit), scale ${World.codexScale}; PROVENANCE PASS`);
  }
  cast.forEach((f, i) => {
    const n = bytes(f);
    worst = Math.max(worst, n);
    assert.ok(n < 1024, `${name} cast frame ${i} is ${n} UTF-8 bytes`);
    assert.ok(Bubble.compile(f).length > 0 && Bubble.compile.notes.length === 0, `${name} cast frame ${i} did not compile cleanly`);
    for (const b of f.bands) Bubble.band(b);
  });
  frames.forEach(([kind, f], i) => {
    const n = bytes(f);
    worst = Math.max(worst, n);
    assert.ok(n < 1024, `${name} ${kind} frame ${i} is ${n} UTF-8 bytes`);
    assert.equal(f.v, 'preceptoros.bubble/1');
    const items = Bubble.compile(f);
    assert.ok(items.length > 0 && Bubble.compile.notes.length === 0, `${name} ${kind} frame ${i} did not compile cleanly: ${JSON.stringify(Bubble.compile.notes)}`);
    for (const b of f.bands) Bubble.band(b);
    const shape = JSON.stringify(strip(kind === 'state' ? Bubble.compile(Object.assign({}, f, { atoms: f.atoms.filter((a) => a.k !== 'crab') })) : items));
    if (!(i in ref)) ref[i] = shape;
    else assert.equal(shape, ref[i], `${name} ${kind} frame ${i} geometry differs from basic`);
  });
  if (sabotage === 'geometry') World.isles[0].rx = 124;
  const u = SKINS[name].ui;
  for (const [a, b, min] of [['fg', 'bg', 4.5], ['fg', 'panel', 4.5], ['onAccent', 'accent', 4.5], ['edge', 'bg', 3]]) {
    const r = contrast(u[a], u[b]);
    assert.ok(r >= min, `${name} contrast ${a}/${b} is ${r.toFixed(2)}, below ${min}`);
  }
  console.log(`${name} (${skin.layout}): ${frames.length} shared frames + ${cast.length} cast frames < 1,024 B; map scenes identical to basic (the crab and the cast are each proposal's own); contrast fg/bg ${contrast(u.fg, u.bg).toFixed(2)}, accent ${contrast(u.onAccent, u.accent).toFixed(2)}; PASS`);
}
const pal = names.map((n) => JSON.stringify(World.islesFrame(Object.assign({ name: n }, SKINS[n]), 0).bands));
assert.equal(new Set(pal).size, 3, 'two skins share the same palette');
const index = readFileSync(join(dir, 'index.html'), 'utf8');
for (const name of names) assert.match(index, new RegExp(`src="${name}\\.html"`));
console.log(`${states.length} reachable states per skin; worst frame ${worst} UTF-8 bytes of 1,024; three distinct layouts; launcher lists all three; zero remote resources; PASS`);

if (process.env.APP_DIR) {
  const app = join(process.env.APP_DIR, 'interface', 'face');
  assert.ok(existsSync(app), 'APP_DIR has no interface/face');
  for (const f of ['face.js', 'face_world.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face.css', 'skins.json']) assert.equal(readFileSync(join(app, f), 'utf8'), readFileSync(join(dir, f), 'utf8'), `app ${f} differs from web`);
  for (const name of names) assert.equal(readFileSync(join(app, name + '.html'), 'utf8'), page(name, APP_PREFIX, APP_BASE), `app ${name}.html differs from the shared template`);
  console.log('app parity: face.js, face_world.js, face_paint.js, face.css, skins and three pages byte-identical to the web template; PASS');
}
