// The duel's face: the crab's side near, low and left; the opponent far, high and right; a hit detunes the struck creature.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const F = createRequire(import.meta.url)('../../public/game/duel_face.js');
test('the middle line: even at the start, leaning toward the side losing life, pushed into the loser\'s corner at the end', () => {
  assert.equal(F.front(1, 1, false, null), 0.5);
  assert.ok(F.front(0.4, 1, false, null) > 0.5, 'the opponent losing life: the line moves toward its corner');
  assert.ok(F.front(1, 0.4, false, null) < 0.5);
  assert.ok(F.front(0.5, 0.5, true, 'asalto') > 0.9 && F.front(0.5, 0.5, true, 'defensa') < 0.1);
  assert.equal(F.front(0.5, 0.5, true, 'empate'), 0.5);
});
test('each row stands on its own side of the line, fanned across it', () => {
  const A = { x: 0, y: 100 }, B = { x: 100, y: 0 };
  const me = F.spot(1, 0, 1, 0.5, A, B, 0.1), them = F.spot(0, 0, 1, 0.5, A, B, 0.1);
  assert.ok(me.x < 50 && me.y > 50 && them.x > 50 && them.y < 50, JSON.stringify([me, them]));
  const a = F.spot(1, 0, 3, 0.5, A, B, 0.1), c3 = F.spot(1, 2, 3, 0.5, A, B, 0.1);
  assert.ok(Math.hypot(a.x - c3.x, a.y - c3.y) > 10, 'a row fans out across the line');
});
test('each side comes out of its own corner: the crab near-left-low, the opponent (ghost) far-right-high', () => {
  assert.ok(F.CORNER[1][0] < 0.5 && F.CORNER[1][1] > 0.5 && F.CORNER[0][0] > 0.5 && F.CORNER[0][1] < 0.5);
});
test('a creature is at most 80 % of the crab, and nothing is fired', () => {
  const src = readFileSync(new URL('../../public/game/duel_face.js', import.meta.url), 'utf8');
  assert.match(src, /rMax = 0\.8 \* CRAB \* ck \/ 2/);
  assert.match(src, /Math\.min\(rMax,/);
  assert.ok(!/function front\(a, b, colour/.test(src) && !/strokeStyle = colour/.test(src), 'no wave fired between the corners');
});
test('the live crab leaves the map for the duel and comes back after it', () => {
  const src = readFileSync(new URL('../../public/game/duel_face.js', import.meta.url), 'utf8');
  const map = readFileSync(new URL('../../public/game/map_chunks.js', import.meta.url), 'utf8');
  assert.match(map, /if \(B && !s\.dataset\.duel\) \{ B\.draw\(/, 'the map skips its crab during a duel');
  assert.match(src, /surf\.dataset\.duel = '1'/);
  assert.match(src, /para: function \(\) \{[^}]*release\(\)/, 'stopping the duel gives the crab back');
});
test('a wound detunes, a fresh hit shivers, and both stay within 0..1', () => {
  assert.equal(F.detune({ vida: 10, max: 10 }, 0), 0);
  assert.ok(F.detune({ vida: 5, max: 10 }, 0) > 0.4);
  assert.ok(F.detune({ vida: 10, max: 10 }, 1) > 0.3);
  assert.equal(F.detune({ vida: 0, max: 10 }, 1), 1);
});
test('the face carries no raw colour, no chance and no squad drawing', () => {
  const src = readFileSync(new URL('../../public/game/duel_face.js', import.meta.url), 'utf8');
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(src));
  assert.ok(!/Math\.random|Date\.now/.test(src));
  assert.ok(!/escuadr|squadron|AtlasP6/.test(src.replace(/^\/\/.*$/gm, '')));
});
test('the fight ends when the beaten side\'s last wave is gone, and says Win, Defeat or Draw from the crab\'s side', () => {
  const src = readFileSync(new URL('../../public/game/duel_face.js', import.meta.url), 'utf8');
  assert.match(src, /U\[loser\]\.every\(function \(u\) \{ return u\.gone >= 1; \}\)/);
  assert.match(src, /loser < 0 \? 'Draw' : loser === 0 \? 'Win' : 'Defeat'/);
  assert.match(src, /combate\.gana === 'asalto' \? 0 : combate\.gana === 'defensa' \? 1 : -1/, 'asalto is the crab\'s side winning: the opponent (side 0) loses');
});
test('the eyes: like the crab\'s, an iris in the wave\'s colour, and a pupil by rarity (round, ringed, slit, star)', async () => {
  const vm = await import('node:vm');
  const src = readFileSync(new URL('../../public/game/wave_render.js', import.meta.url), 'utf8');
  const box = { AtlasGacha: { RAREZAS: ['normal', 'magico', 'raro', 'unico'], punto: () => ({ x: 0, y: 0 }) }, AtlasComicTokens: { NEUTRAL: { ink: 'I', paper: 'P' } }, Math };
  box.window = box; vm.createContext(box); vm.runInContext(src, box);
  const O = box.AtlasOnda;
  assert.deepEqual(['normal', 'magico', 'raro', 'unico', 'x'].map((r) => O.eyeKind({ rareza: r })), [0, 1, 2, 3, 0]);
  const calls = (kind) => { const log = []; const g = new Proxy({ globalAlpha: 1 }, { get: (t, k) => k in t ? t[k] : (...a) => log.push([k, ...a]), set: (t, k, v) => { t[k] = v; log.push(['set', k, v]); return true; } }); O.drawFace(g, 50, 50, 40, { eye: kind, color: [35, 80, 62] }); return log; };
  const iris = calls(2).filter((c) => c[0] === 'set' && c[1] === 'fillStyle' && !['I', 'P'].includes(c[2]));
  assert.ok(iris.length >= 2, 'both eyes get an iris in the wave colour');
  assert.ok(calls(2).some((c) => c[0] === 'ellipse'), 'a rare eye has a slit pupil');
  assert.ok(calls(3).filter((c) => c[0] === 'lineTo').length >= 24, 'a unique eye has a star pupil');
  assert.ok(!calls(0).some((c) => c[0] === 'ellipse'), 'a normal eye is round');
  const counts = new Set(); for (let s = 1; s < 60; s++) { const arm = [[1, s * 0.013, s * 0.007, 0], [3, 0.2, s * 0.011, 0]]; const n = O.eyeCount({ armonicos: arm }); assert.ok(n >= 1 && n <= 5); assert.equal(O.eyeCount({ armonicos: arm }), n, 'the same wave keeps its eyes'); counts.add(n); }
  assert.equal(counts.size, 5, 'all five counts occur');
  for (const n of [1, 3, 5]) { const log = []; const g = new Proxy({ globalAlpha: 1 }, { get: (t, k) => k in t ? t[k] : (...a) => log.push([k, ...a]), set: (t, k, v) => { t[k] = v; return true; } }); O.drawFace(g, 50, 50, 40, { eye: 0, eyes: n, color: [35, 80, 62] });
    assert.equal(log.filter((c) => c[0] === 'arc').length, n * 4, n + ' eyes: white, iris, pupil and glint each'); }
});
test('a hit sparks where the waves touch, and still wounds (no comment may swallow the damage)', () => {
  const src = readFileSync(new URL('../../public/game/duel_face.js', import.meta.url), 'utf8');
  const golpe = src.split('\n').filter((l) => /function golpe\(e\)|sparks\.push/.test(l)).join('\n') + '\n' + src.slice(src.indexOf('sparks.push'), src.indexOf('function size()'));
  assert.match(golpe, /sparks\.push\(/);
  const wound = src.slice(src.indexOf('function golpe(e)'), src.indexOf('function size()')).split('\n').find((l) => l.includes('t.vida = Math.max(0, t.vida - e[4])'));
  assert.ok(wound && !/\/\/.*t\.vida = Math/.test(wound), 'the wound line is code, not a comment');
  assert.ok(!/Math\.random/.test(src), 'the sparks are deterministic');
});
test('the eyes sit inside the wave\'s core, from the centre: one eye is the centre itself, and none strays outside', async () => {
  const vm = await import('node:vm');
  const box = { AtlasGacha: { RAREZAS: ['normal', 'magico', 'raro', 'unico'] }, AtlasComicTokens: { NEUTRAL: { ink: 'I', paper: 'P' } }, Math };
  box.window = box; vm.createContext(box); vm.runInContext(readFileSync(new URL('../../public/game/wave_render.js', import.meta.url), 'utf8'), box);
  for (const n of [1, 2, 3, 4, 5]) for (const seed of [0, 0.37, 0.81]) {
    const whites = []; let fill = null;
    const g = new Proxy({ globalAlpha: 1 }, { get: (t, k) => k in t ? t[k] : (...a) => { if (k === 'arc' && fill === 'P' && a[2] > 3) whites.push(a); }, set: (t, k, v) => { t[k] = v; if (k === 'fillStyle') fill = v; return true; } });
    box.AtlasOnda.drawFace(g, 100, 100, 50, { eye: 0, eyes: n, eyeSeed: seed, color: [35, 80, 62] });
    assert.equal(whites.length, n);
    for (const [x, y, rr] of whites) assert.ok(Math.hypot(x - 100, y - 100) + rr <= 50 * 0.45, `n=${n} eye at ${x},${y} r ${rr} stays in the core`);
    if (n === 1 || n >= 4) assert.ok(whites.some(([x, y]) => x === 100 && y === 100), 'one eye is the centre');
  }
});
