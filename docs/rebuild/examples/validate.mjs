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

for (const f of ['face.js', 'face_world.js', 'face_hero.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face_hud.js', 'face.css', 'index.html', ...names.map((n) => n + '.html')]) {
  const size = statSync(join(dir, f)).size;
  assert.ok(size <= 16384, `${f} is ${size} B, over the 16,384 B piece ceiling`);
}
const code = ['face.js', 'face_world.js', 'face_hero.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face_hud.js'].map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
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
if (sabotage === 'chat') css = css.replace('grid-template-areas:"hello" "map" "side"}', 'grid-template-areas:"hello" "side" "map"}');
const layoutSig = {};
const cut1 = css.indexOf('@media (max-width:760px) and (orientation:portrait)'), cut2 = css.indexOf('@media (orientation:landscape) and (max-height:560px)');
const wideCss = css.slice(0, cut1), portraitCss = css.slice(cut1, cut2), landscapeCss = css.slice(cut2);
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
const paintCode = readFileSync(join(dir, 'face_paint.js'), 'utf8'), faceCode = readFileSync(join(dir, 'face.js'), 'utf8'), build = readFileSync(join(dir, 'tools/build.mjs'), 'utf8');
assert.match(paintCode, /AtlasMarFondo\.pintor\(\)/, 'the ground between islands is not the canon seafloor painter');
assert.match(paintCode, /floor\.tierra\(/, 'the canon seafloor tiles are not painted');
assert.match(build, /'escena', 'sea-floor'/, 'the canon seafloor scripts are not loaded');
for (const name of names) {
  const sea = World.seaFrame(Object.assign({ name }, SKINS[name])), shelves = sea.atoms[0].i.slice();
  if (sabotage === 'shelf') shelves.pop();
  assert.equal(shelves.length, World.isles.length, `${name}: an island floats without a shelf on the seabed`);
  World.isles.forEach((q, i) => { const sh = shelves[i]; assert.ok(sh.rx >= 1.3 * q.rx && sh.ry >= 1.3 * q.ry && Math.abs(sh.x - q.x) <= 10 && Math.abs(sh.y - q.y) <= 10, `${name}: island ${q.id} has no shelf around it`); });
}
console.log(`seafloor: canon sea-floor tiles under the map; ${World.isles.length} islands each stand on a shelf 1.38x their size; PASS`);
const Crab = require('../../../public/game/gdpr-art25-ephemeral-crab.js');
assert.match(faceCode, /CJ\.forma\(cs\.army, cs\.node/, 'the crab does not grow by the canon forma rule');
assert.match(paintCode, /AtlasToon\.cangrejo\(/, 'the crab is not drawn by the canon toon crab');
let prev = 0;
for (let task = 0; task <= World.places.length; task++) for (const won of [false, true]) {
  const cs = World.crabState(sabotage === 'crab' ? 0 : task, won), fo = Crab.forma(cs.army, cs.node, null);
  const fr = World.stateFrame(Object.assign({ name: 'basic' }, SKINS.basic), { at: World.homeAt, task, won, forma: { escala: Math.round(fo.escala * 100) / 100, clase: fo.clase } });
  const r = fr.atoms.find((a) => a.k === 'crab').r;
  assert.match(r, new RegExp('a ' + fo.clase + ' crab, size ' + Math.round(fo.escala * 100) / 100), 'the frame does not say the crab phase');
  if (!won) { assert.ok(fo.escala >= prev, 'the crab shrank along the journey'); prev = fo.escala; }
  assert.equal(fo.clase, task >= World.places.length ? 'coral' : 'mar', `crab colour phase wrong at task ${task}`);
}
assert.ok(prev > 1, 'the crab never grows along the journey');
console.log(`crab: canon AtlasCangrejo.forma grows it (size up to ${prev}) and turns it mar -> coral when the tutorial ends; the frame says each phase; PASS`);
let tplx = tpl;
if (sabotage === 'joystick') tplx = tplx.replace('<div class="pad">', '</section><div class="pad">');
if (sabotage === 'icons') tplx = tplx.replace('<span class="vh">Follow the path</span>', '<span>Follow the path</span>');
const mapSec = tplx.slice(tplx.indexOf('<section class="map"'), tplx.indexOf('</section>', tplx.indexOf('<section class="map"')));
assert.match(mapSec, /<div class="pad"><canvas id="joy"/, 'the joystick is not inside the map panel');
assert.match(css, /\.pad\{position:absolute;right:\d+px;bottom:\d+px/, 'the joystick is not on the bottom-right corner of the map');
for (const v of css.match(/--joy:[^;}]+/g)) { const px = Math.max(...(v.match(/\d+px/g) || ['999px']).map((x) => parseInt(x, 10))); assert.ok(px <= 96 && px >= 44, `joystick size ${v} is not small and thumb-usable (44..96 px)`); }
const btns = mapSec.slice(mapSec.indexOf('<div class="mapbtns"'));
assert.match(css, /\.mapbtns\{position:absolute;left:\d+px;bottom:\d+px/, 'the map buttons are not on the bottom-left corner');
for (const id of ['start', 'follow', 'whole']) {
  const m = new RegExp(`<button[^>]*id="${id}"[^>]*>(.*?)</button>`).exec(btns);
  assert.ok(m, `#${id} is not in the map corner group`);
  assert.equal(m[1].replace(/<canvas data-icon="[a-z]+" aria-hidden="true"><\/canvas>/, '').replace(/<span class="vh">[^<]*<\/span>/, '').trim(), '', `#${id} shows written text: it must be an icon`);
  assert.match(m[1], /<span class="vh">[^<]+<\/span>/, `#${id} has no accessible name`);
}
const hud = readFileSync(join(dir, 'face_hud.js'), 'utf8');
assert.match(tplx, /id="toast" class="toast" role="status" aria-live="polite"/, 'the transient label is not nameable by the voice channel');
assert.match(tplx, /id="offer"[^>]*role="dialog"[\s\S]*id="offer-yes"[^>]*>Accept<[\s\S]*id="offer-no"[^>]*>Decline</, 'the task offer has no Accept and Decline');
assert.match(hud, /if \(quiet\(\)\) \{ return; \}/, 'reduced motion must keep the label without the fade');
assert.match(hud, /function voice\(text\) \{ if \(soundOn\(\)\) \{ say\(\[text\]\); \} \}/, 'the label is not spoken when Sound is on');
assert.match(faceCode, /tell\('Follow the path'\)/, 'the follow icon does not say its label');
assert.match(faceCode, /tell\(st\.whole \? 'Whole map' : 'Near view'\)/, 'the whole-map icon does not say its label');
console.log('map HUD: joystick small on the bottom-right of the map; three icon-only buttons bottom-left that say their names (voice with Sound on), task offer with Accept and Decline; PASS');
for (const name of names) {
  const sk = Object.assign({ name }, SKINS[name]);
  const all = [World.seaFrame(sk), World.islesFrame(sk, 0), World.islesFrame(sk, 1), World.islesFrame(sk, 2), World.islesFrame(sk, 3), World.standFrame(sk), World.namesFrame(sk), World.castFrame(sk, { at: World.homeAt, moves: 0 })].filter(Boolean);
  if (sabotage === 'bust' && name === 'atlantis') all.push({ atoms: [{ i: [{ o: 'bust' }] }] });
  for (const f of all) assert.ok(!JSON.stringify(f).includes('"o":"bust"'), `${name}: the Preceptor's head is still on the map`);
}
console.log("no bust on the map in any proposal (kept for later, elsewhere); PASS");
const sheetHead = tplx.slice(tplx.indexOf('<div class="sheet-head">'), tplx.indexOf('</div>', tplx.indexOf('id="radio"')));
const spkx = sabotage === 'speaker' ? sheetHead.replace('id="speaker"', 'id="speakr"') : sheetHead;
assert.match(spkx, /<b id="sheet-title">[^<]*<\/b>[\s\S]*<button[^>]*id="speaker"[^>]*aria-pressed="false"/, 'no speaker button beside the panel title');
assert.match(spkx, /id="radio"[^>]*role="region"[^>]*hidden/, 'no radio beside the speaker');
assert.match(hud, /iconFrame\(on \? 'speaker-on' : 'speaker', skin\)/, 'the speaker is not drawn crossed out when off');
assert.match(hud, /speechSynthesis/, 'the radio does not use the native web reader');
assert.match(hud, /Voice: NO_DATA, cause: no local voice on this device/, 'the radio must say NO_DATA when no local voice exists');
console.log('speaker: crossed out beside the panel title; on, a radio reads the screen (native reader, transcript, NO_DATA without a local voice); PASS');
const Hero = require('./face_hero.js');
let heroWorst = 0;
for (const name of names) {
  const sk = SKINS[name];
  if (name === 'zombie') assert.ok(sk.hero && (sabotage !== 'hero'), 'the zombie protagonist is not the space soldier');
  else assert.ok(!sk.hero, `${name} must keep the crab`);
}
for (const cl of ['mar', 'coral']) for (const dd of [1, -1]) {
  const f = Hero.heroFrame(SKINS.zombie, cl, dd), n = bytes(f); heroWorst = Math.max(heroWorst, n);
  assert.ok(n < 1024 && Bubble.compile(f).length > 0 && Bubble.compile.notes.length === 0, 'soldier frame over the ceiling or not compiling');
  assert.ok(JSON.stringify(f).includes(cl === 'coral' ? 'vermilion.base' : '"cyan"'), 'the soldier visor does not follow the canon colour phase');
}
assert.match(paintCode, /PreceptorHero\.heroFrame\(skin, state\.crab\.forma\.clase/, 'the soldier is not painted with the canon phase');
console.log(`hero: zombie walks a space soldier (helmet, visor, uniform), growing with the canon scale, visor mar -> coral; worst frame ${heroWorst} B; PASS`);
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
  for (const [ctx, part] of [['wide', wideCss], ['portrait', portraitCss], ['landscape', landscapeCss]]) {
    const m = new RegExp(`\\[data-layout=${skin.layout}\\] \\.face\\{[^}]*grid-template-areas:((?:"[^"]*"\\s*)+)`).exec(part);
    assert.ok(m, `face.css has no ${ctx} distribution for ${skin.layout}`);
    const rows = m[1].match(/"[^"]*"/g).map((r) => r.slice(1, -1).trim().split(/\s+/));
    const mi = rows.findIndex((r) => r.includes('map')), cols = (r, k) => r.map((x, i) => (x === k ? i : -1)).filter((i) => i >= 0);
    const under = rows[mi + 1] && cols(rows[mi + 1], 'side').some((i) => rows[mi][i] === 'map');
    assert.ok(under || (rows[mi + 1] && rows[mi + 1].includes('map') && rows[mi + 2] && cols(rows[mi + 2], 'side').some((i) => rows[mi + 1][i] === 'map')), `${skin.layout} ${ctx}: the chat panel is not directly under the map`);
    assert.ok(!rows.flat().some((x) => x === 'pad' || x === 'task'), `${skin.layout} ${ctx}: the joystick or the buttons still take their own row`);
    layoutSig[skin.layout] = (layoutSig[skin.layout] || '') + ctx + m[1];
  }
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
    console.log(`${name}: canon creatures are the Codex RIFT words (octo, star, snail), scale ${World.codexScale}; PROVENANCE PASS`);
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
assert.equal(new Set(Object.values(layoutSig)).size, 3, 'two proposals share the same spatial distribution');
const pal = names.map((n) => JSON.stringify(World.islesFrame(Object.assign({ name: n }, SKINS[n]), 0).bands));
assert.equal(new Set(pal).size, 3, 'two skins share the same palette');
const index = readFileSync(join(dir, 'index.html'), 'utf8');
for (const name of names) assert.match(index, new RegExp(`src="${name}\\.html"`));
console.log(`${states.length} reachable states per skin; worst frame ${worst} UTF-8 bytes of 1,024; three distinct layouts; launcher lists all three; zero remote resources; PASS`);

if (process.env.APP_DIR) {
  const app = join(process.env.APP_DIR, 'interface', 'face');
  assert.ok(existsSync(app), 'APP_DIR has no interface/face');
  for (const f of ['face.js', 'face_world.js', 'face_hero.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face_hud.js', 'face.css', 'skins.json']) assert.equal(readFileSync(join(app, f), 'utf8'), readFileSync(join(dir, f), 'utf8'), `app ${f} differs from web`);
  for (const name of names) assert.equal(readFileSync(join(app, name + '.html'), 'utf8'), page(name, APP_PREFIX, APP_BASE), `app ${name}.html differs from the shared template`);
  console.log('app parity: face.js, face_world.js, face_paint.js, face.css, skins and three pages byte-identical to the web template; PASS');
}
