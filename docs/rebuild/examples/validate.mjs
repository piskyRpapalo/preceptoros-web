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
require('./face_world_terrain.js');
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

for (const f of ['face.js', 'face_world.js', 'face_world_terrain.js', 'face_hero.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face_hud.js', 'face_army.js', 'face_eggs.js', 'face_workshop.js', 'face_tutorial.js', 'face.css', 'face_views.css', 'face_canon.css', 'index.html', ...names.map((n) => n + '.html')]) {
  const size = statSync(join(dir, f)).size;
  assert.ok(size <= 16384, `${f} is ${size} B, over the 16,384 B piece ceiling`);
}
const code = ['face.js', 'face_world.js', 'face_world_terrain.js', 'face_hero.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face_hud.js', 'face_army.js', 'face_eggs.js', 'face_workshop.js', 'face_tutorial.js'].map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
assert.doesNotMatch(code, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|localStorage|XMLHttpRequest|WebSocket/, 'face code uses a forbidden source of authority or network');
assert.doesNotMatch(code, /\/\/ |\/\*/, 'served face code carries comments');
const served = [code, readFileSync(join(dir, 'face.css'), 'utf8'), readFileSync(join(dir, 'tools/face.tpl.html'), 'utf8'), readFileSync(join(dir, 'index.html'), 'utf8')].join('\n');
assert.doesNotMatch(served, /oraculo|notario|depin|\btoken\b|moneda|clearing|magia/i, 'banned word in served text');
assert.doesNotMatch(served, /\b(?:src|href)=["']https?:\/\//i, 'remote request in served text');
assert.doesNotMatch(served, /<img\b|data:image\/(?:png|jpeg)/i, 'raster imagery in served text');
assert.doesNotMatch(served, /([0-9]{1,3}\.){3}[0-9]{1,3}|\/h[o]me\/|d[o]ogee|S1[1]0\b/i, 'address, user path or device name in served text');

const tpl = readFileSync(join(dir, 'tools/face.tpl.html'), 'utf8');
for (const b of tpl.match(/<button\b[^>]*>.*?<\/button>/g)) assert.ok(/aria-label="[^"]+"/.test(b) || /\w/.test(b.replace(/<span aria-hidden="true">.*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim()), 'button without a name: ' + b);
for (const c of tpl.match(/<canvas\b[^>]*>/g)) assert.match(c, /aria-label="[^"]+"|aria-hidden="true"/, 'canvas without a label: ' + c);
assert.match(tpl, /id="mapwin" role="img" aria-label="[^"]+"/, 'the map window has no label');
for (const id of ['packet', 'say', 'machine', 'machine-map', 'log', 'joy', 'map', 'mapwin', 'head', 'skin', 'start', 'follow', 'counter', 'whole', 'tab-map', 'tab-battle', 'tab-profile', 'tab-info', 'sheet-battle', 'sheet-profile', 'sheet-info', 'b-pause', 'b-step', 'b-back', 'b-life', 'b-receipt', 'army', 'foes', 'eggs', 'purse', 'tut', 'tut-skip', 'tut-steps', 'nodes', 'node-hexelion', 'node-doggee', 'tut-away', 'ws-waves', 'ws-acts', 'identity', 'me-art']) assert.match(tpl, new RegExp(`id="${id}"`), 'missing #' + id);
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
assert.match(css, /\.chatbox \.log\{[^}]*overflow:auto/, 'the chat log must be the internal scroll area');
assert.match(css, /#map\{position:fixed;inset:0;/, 'the map is not the wallpaper behind the window');
let tabsTpl = tpl;
if (sabotage === 'tabs') tabsTpl = tabsTpl.replace('aria-label="Profile" ', '');
if (sabotage === 'chatalways') tabsTpl = tabsTpl.replace('<div class="chatbox">', '<section id="sheet-chat" role="tabpanel" hidden><div class="chatbox">');
const tabBtns = tabsTpl.match(/<button[^>]*role="tab"[^>]*>.*?<\/button>/g) || [];
assert.deepEqual(tabBtns.map((b) => (/aria-label="([^"]+)"/.exec(b) || [])[1]), ['Map', 'Battle', 'Profile', 'Info'], 'the view icons must be Map, Battle, Profile and Info, each with its name');
for (const b of tabBtns) assert.equal(b.replace(/<canvas data-icon="tab-[a-z]+" aria-hidden="true"><\/canvas>/, '').replace(/<[^>]+>/g, '').trim(), '', 'a view button shows text: it must be an icon');
assert.ok(!/id="tab-chat"/.test(tabsTpl), 'Chat must not be a tab: the chat is always present');
const chatAt = tabsTpl.indexOf('id="log"'), sideAt = tabsTpl.indexOf('<section class="side'), panelOpen = tabsTpl.lastIndexOf('role="tabpanel"', chatAt);
assert.ok(chatAt > sideAt && (panelOpen < sideAt), 'the chat must live in the always-visible lower half, not inside a view');
const hudTxt = readFileSync(join(dir, 'face_hud.js'), 'utf8');
assert.match(hudTxt, /Map, Battle, Profile and Info/, 'the radio does not announce the view names');
assert.match(hudTxt, /'View: ' \+ t\('sheet-title'\)/, 'the radio does not say which view is on screen');
console.log('views: four icon tabs (Map, Battle, Profile, Info) with names for the reader, the radio announces them, the chat is always the lower half; PASS');
const armyCode = readFileSync(join(dir, 'face_army.js'), 'utf8').replace(sabotage === 'army' ? 'AtlasArmyWavePanel.abre(t)' : '\u0000', 'void 0');
assert.match(armyCode, /A\.crea\(A\.verificaWeb, A\.almacenWeb/, 'the Army is not the canon verified Army');
assert.match(armyCode, /AtlasArmyWavePanel\.abre\(t\)/, 'a wave does not open the canon wave panel');
assert.match(armyCode, /NO_DATA \(no waves adopted yet\)/, 'the empty Army is not honest');
assert.match(armyCode, /A\.TOPE/, 'the Army cap is not the canon cap');
const Val = require('../../../public/game/valores.js'), ArmyM = require('./face_army.js'), G = require('../../../public/game/gacha.js');
assert.equal(Val.army_tope, 30, 'army cap is not 30');
const eggCode0 = readFileSync(join(dir, 'face_eggs.js'), 'utf8');
const eggCode = sabotage === 'adopt' ? eggCode0.replace('return H.army.adopt(t)', 'return Promise.resolve(t)') : eggCode0;
assert.match(armyCode, /army\.adopta\(ad, f\.firma\)/, 'the adoption is not signed');
assert.match(eggCode, /A\.eslabon\(chain, tc, pub\)[\s\S]*I\.firmar\(o\)[\s\S]*A\.semillaWeb\(f\.firma\)[\s\S]*A\.anexa\(chain, o, f\.firma, seed, E\.ciclo, E\.ciclo \+ TC\.incuba\)/, 'the egg is not the canon signed chain link with its cycles');
assert.match(eggCode, /G\.tirada\(e\.semilla, e\.obj\.tc\)/, 'the hatched wave is not the canon roll of the egg seed');
assert.match(eggCode, /AtlasRevela\.muestra\(t/, 'no canon reveal at hatch');
assert.match(eggCode, /return H\.army\.adopt\(t\)/, 'hatching does not adopt in the same tap');
assert.match(eggCode, /A\.cadenaWeb\(pub\)/, 'the egg chain is not kept in the canon store');
assert.match(eggCode, /A\.verificaCadena\(/, 'the egg chain is not verified on load');
for (const tc of Object.keys(G.TCS)) {
  const o = G.odds(tc), txt = ArmyM.oddsText(G, sabotage === 'gacha' && tc === 'tc2' ? 'tc1' : tc);
  assert.equal(o.reduce((x, y) => x + y, 0), 1000, `${tc} odds do not sum to 100%`);
  G.RAREZAS.forEach((r, i) => assert.ok(txt.includes(ArmyM.names[r] + ' ' + (o[i] / 10).toFixed(1) + '%'), `${tc} shown odds differ from the canon table`));
  assert.match(txt, /No hidden odds\./);
}
const seed = 'ab'.repeat(32), w1 = G.tirada(seed, 'tc3'), w2 = G.tirada(seed, 'tc3');
assert.deepEqual(w1, w2, 'the roll is not deterministic');
const Eggs = require('./face_eggs.js'), motor = readFileSync('public/assets/atlas-motor.js', 'utf8');
assert.equal(Eggs.cycleMs, Number(/CICLO_MS = (\d+)/.exec(motor)[1]), 'the egg cycle is not the canon game cycle');
const incuba = { tc1: 20, tc2: 40, tc3: 60, tc4: 90 };
if (sabotage === 'eggs') Val.tcs.tc1.incuba = 19;
for (const tc of Object.keys(incuba)) assert.equal(Val.tcs[tc].incuba, incuba[tc], `incubation of ${tc} is not the canon ${incuba[tc]} cycles`);
if (sabotage === 'eggs') Val.tcs.tc1.incuba = 20;
const ev = Eggs.eggView({ seq: 1, tc: 'tc1', desde: 10, hasta: 30 }, 25, 20);
assert.deepEqual([ev.left, ev.pct, ev.ready], [5, 75, false], 'the egg counter does not count cycles');
assert.ok(!/Date|setTimeout|countdown|timer:/i.test(eggCode.replace('root.setInterval(tick, cycleMs)', '')), 'the egg code carries a clock field');
for (const k of ['huevo', 'eclosion']) assert.match(eggCode, new RegExp(`sound\\('${k}'\\)`), `the canon ${k} sound is not played`);
assert.match(armyCode, /suena\('adopcion'\)/, 'the canon adoption sound is not played');
console.log(`army + eggs: canon verified Army (cap ${Val.army_tope}), canon wave panel; egg = canon signed chain link (desde/hasta in cycles, ${Eggs.cycleMs} ms canon cycle), incubation L1 20 / L2 40 / L3 60 / L4 90 cycles, hatch -> canon roll -> canon reveal -> signed adoption in one tap; odds shown; canon sounds; PASS`);
const ws0 = readFileSync(join(dir, 'face_workshop.js'), 'utf8'), ws = sabotage === 'workshop' ? ws0.replace('TL.recibo(est, o, pub)', '({ op: o.op })') : ws0;
assert.match(ws, /TL\.recibo\(est, o, pub\)/, 'the Workshop does not use the canon receipt');
assert.match(ws, /TL\.estado\(next\)/, 'the Workshop chain is not re-verified');
for (const o of ["op: 'lija'", "op: 'tinte'", "op: 'desintegra'"]) assert.ok(ws.includes(o), `the Workshop lacks ${o}`);
assert.match(ws, /H\.army\.retire\(rec, f\)/, 'dissolving does not retire the wave from the Army');
console.log('workshop: canon AtlasTaller receipts (improve, tint, dissolve) signed and chain-verified; dissolve retires the wave; PASS');
assert.match(tpl, /role="tablist"/, 'the panel categories are not a tablist');
const Battle = require('./face_battle.js'), Arena = require('../../../public/game/arena.js');
const Ticks = require('../../../public/game/combate_ticks.js');
const pats = Battle.patrols();
if (sabotage === 'patrol') pats[0].tropas = pats[0].tropas.slice(1);
assert.equal(JSON.stringify(pats.map((x) => x.tropas)), JSON.stringify(Arena.lugares().map((l) => l.defensa.tropas)), 'the opponents are not the canon patrols');
let battleWorst = 0, battles = 0;
const squads = [[{ semilla: 'ab'.repeat(32), tc: 'tc1' }], [{ semilla: 'ab'.repeat(32), tc: 'tc1', lija: { velocidad: 1 } }, { semilla: 'cd'.repeat(32), tc: 'tc2' }]];
for (const p of pats) for (const sq of squads) for (const w of [null, 0]) {
  const x = Battle.create(); x.begin(p, sq);
  const frames = [x.frame()];
  while (!x.done()) { if (w !== null && x.b.st.ronda === 1) x.withdraw(w); x.step(); frames.push(x.frame()); }
  for (const fr of frames) {
    const n = bytes(fr); battleWorst = Math.max(battleWorst, n);
    assert.ok(n < 1024, `battle frame is ${n} UTF-8 bytes`);
    assert.ok(Bubble.compile(fr).length > 0 && Bubble.compile.notes.length === 0, 'battle frame did not compile cleanly');
  }
  const s = x.summary(), ref = Ticks.recibo(p.tropas, sq, Battle.seedFor(p, sq), s.orders);
  assert.ok(ref.ok && s.receipt === ref.texto, 'the stepped battle drifted from combate_ticks.recibo');
  assert.ok(s.receipt.length <= 200, `receipt is ${s.receipt.length} B`);
  let rec = JSON.parse(s.receipt);
  if (sabotage === 'battle') rec = Object.assign({}, rec, { v: Object.assign({}, rec.v, { g: rec.v.g === 'defensa' ? 'asalto' : 'defensa' }) });
  assert.ok(Ticks.verifica(rec, p.tropas, sq).ok, 'the receipt does not verify by replay from tick 0');
  battles++;
}
assert.equal(Val.combate.tropas_max, 10, 'the squad cap is not the canon 10');
assert.match(readFileSync(join(dir, 'face_battle.js'), 'utf8'), /\.slice\(0, V\.combate\.tropas_max\)/, 'the squad is not capped by the canon');
console.log(`battle: opponents are the 6 canon patrols; ${battles} battles stepped tick by tick equal combate_ticks (improved waves included); receipts <= 200 B verify by replay; worst frame ${battleWorst} B; PASS`);
let cssV = readFileSync(join(dir, 'face_views.css'), 'utf8');
if (sabotage === 'order') cssV = cssV.replace('body[data-battle=on] #sheet-battle .prep,', '');
assert.match(cssV, /body\[data-battle=on\] #sheet-battle \.prep,body:not\(\[data-battle=on\]\) #sheet-battle \.fight\{display:none\}/, 'the battle is not a reordering of one panel (preparation and fight must replace each other)');
const bsheet = tpl.slice(tpl.indexOf('<section id="sheet-battle"'), tpl.indexOf('</section>', tpl.indexOf('<section id="sheet-battle"')));
assert.ok(bsheet.indexOf('id="army"') < bsheet.indexOf('id="foes"') && bsheet.indexOf('id="foes"') < bsheet.indexOf('data-form'), 'the battle panel is not ordered Army -> Opponents -> Formation');
console.log('order: Battle is one panel ordered Army -> Opponents -> Formation; during a fight it folds into the fight strip; PASS');
const Tut = require('./face_tutorial.js'), tutCode0 = readFileSync(join(dir, 'face_tutorial.js'), 'utf8');
const tutCode = sabotage === 'tutorial' ? tutCode0.replace("start = skin.layout === 'quiet'", "start = true") : tutCode0;
assert.deepEqual(Tut.steps.map((x) => x.id), ['key', 'beacon', 'egg', 'hatch', 'fight', 'node'], 'tutorial steps out of order');
assert.match(tutCode, /start = skin\.layout === 'quiet'/, 'the tutorial must start only on the Neutral map');
assert.deepEqual(Tut.nodes.map((n) => [n.id, n.page]), [['hexelion', 'atlantis.html'], ['doggee', 'zombie.html']], 'the node choice must lead to Hexelion (Atlantis) and Doggee (Zombie)');
assert.match(tutCode, /H\.say\(x\.say\)/, 'the radio does not announce the step');
assert.match(tutCode, /H\.bubble\(x\.say\)/, 'the chat does not guide the step');
assert.match(tutCode, /classList\.add\('tut-target'\)/, 'the next button is not highlighted');
assert.ok(Tut.steps.some((x) => x.reward), 'the tutorial gives no resources');
assert.match(cssV, /body\[data-tut=on\] \.face button:not\(\.tut-target\)[^{]*\{opacity:\.35;pointer-events:none\}/, 'other controls do not wait during a step');
assert.match(tpl, /id="tut-skip"[^>]*class="tut-free/, 'the tutorial is not skippable at every step');
assert.match(tpl, /id="tut-steps"/, 'the user cannot see done and remaining steps');
console.log('tutorial: Neutral-only start, 6 gated steps (key, beacon, egg, hatch, fight, node), highlighted next button, others wait, radio + chat guidance, checklist, skippable, rewards; node choice Hexelion / Doggee; PASS');
const paintCode = readFileSync(join(dir, 'face_paint.js'), 'utf8'), faceCode = readFileSync(join(dir, 'face.js'), 'utf8'), build = readFileSync(join(dir, 'tools/build.mjs'), 'utf8');
assert.match(paintCode, /AtlasMarFondo\.pintor\(\)/, 'the ground between islands is not the canon seafloor painter');
assert.match(paintCode, /floor\.tierra\(/, 'the canon seafloor tiles are not painted');
assert.match(build, /'escena', 'sea-floor'/, 'the canon seafloor scripts are not loaded');
for (const name of names) {
  const sea = World.seaFrame(Object.assign({ name }, SKINS[name])), shelves = sea.atoms[0].i.slice();
  if (sabotage === 'shelf') shelves.pop();
  assert.equal(shelves.length, World.isles.length, `${name}: an island floats without a shelf on the seabed`);
  const shown = World.isles.map((q) => { const k = SKINS[name].isleScale; return k ? Object.assign({}, q, { rx: Math.round(q.rx * k), ry: Math.round(q.ry * k) }) : q; });
  shown.forEach((q, i) => { const sh = shelves[i]; assert.ok(sh.rx >= 1.3 * q.rx && sh.ry >= 1.3 * q.ry && Math.abs(sh.x - q.x) <= 10 && Math.abs(sh.y - q.y) <= 10, `${name}: island ${q.id} has no shelf around it`); });
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
const sheetHead = tplx.slice(tplx.indexOf('<div class="viewbar">'), tplx.indexOf('</div>', tplx.indexOf('id="radio"')));
const spkx = sabotage === 'speaker' ? sheetHead.replace('id="speaker"', 'id="speakr"') : sheetHead;
assert.match(spkx, /<b id="sheet-title"[^>]*>[^<]*<\/b>[\s\S]*<button[^>]*id="speaker"[^>]*aria-pressed="false"/, 'no speaker button beside the view title');
assert.match(spkx, /id="radio"[^>]*role="region"[^>]*hidden/, 'no radio beside the speaker');
assert.match(hud, /iconFrame\(on \? 'speaker-on' : 'speaker', skin\)/, 'the speaker is not drawn crossed out when off');
assert.match(hud, /name: kind === 'speaker' \? 'sound-off' : 'sound-on'/, 'the speaker is not the canon icon word');
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
    // Declared exception (R3 atlantis terrain, 2026-10-25): a skin with isleScale owns its terrain frames
    // (shelves and isles); they must still be the canon shapes, scaled. Every other frame stays shared with basic.
    if (SKINS[name].isleScale && f.atoms.some((a) => a.k === 'shelves' || a.k === 'isles')) {
      if (kind === 'isles0') assert.ok(JSON.stringify(f).includes(`"rx":${Math.round(124 * SKINS[name].isleScale)}`), `${name}: home isle is not at isleScale`);
      return;
    }
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
  for (const f of ['face.js', 'face_world.js', 'face_world_terrain.js', 'face_hero.js', 'face_paint.js', 'face_battle.js', 'face_panel.js', 'face_fight.js', 'face_hud.js', 'face_army.js', 'face_eggs.js', 'face_workshop.js', 'face_tutorial.js', 'face.css', 'face_views.css', 'face_canon.css', 'skins.json']) assert.equal(readFileSync(join(app, f), 'utf8'), readFileSync(join(dir, f), 'utf8'), `app ${f} differs from web`);
  for (const name of names) assert.equal(readFileSync(join(app, name + '.html'), 'utf8'), page(name, APP_PREFIX, APP_BASE), `app ${name}.html differs from the shared template`);
  console.log('app parity: face.js, face_world.js, face_paint.js, face.css, skins and three pages byte-identical to the web template; PASS');
}
