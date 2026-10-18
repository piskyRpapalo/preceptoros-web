(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  function lib(name, file) { return root[name] || (node ? require(file) : null); }
  var G = lib('AtlasGacha', '../game/gacha.js');
  var V = 'preceptoros.bubble/1', TC = 'tc3';
  var SEEDS = {
    normal: 'f7b0f1c774f54b6f3efdfd51b2b6a9600380410f45449c38907e61846e4ef729',
    magico: 'a23d525508b2c6f0074aecea13737118b2729f9842c17a2d1161b3540a30e0e1',
    raro: '1d60dc3e11deee79b2c8836e7fdee51d9ac2a59767d852d5ee55b251ee0abb8c',
    unico: '9a342ec9292ec93c7a4de5450a402e2a2d74864e2d3aeb9d0747d9cbcf57ed1b'
  };
  var BAND = { normal: 'paper', magico: 'cyan', raro: 'comic yellow.base', unico: 'vermilion.base' };
  var NAME = { normal: 'Normal', magico: 'Magic', raro: 'Rare', unico: 'Leviathan' };
  var T = {};
  Object.keys(SEEDS).forEach(function (k) { T[k] = G.tirada(SEEDS[k], TC); });
  var ODDS = G.odds(TC);
  var W = lib('AtlasBubbleGame', '../game/bubble_game.js');
  W.cast('egg', G.HUEVO);
  Object.keys(T).forEach(function (k) { W.cast(k, T[k].armonicos); });

  var B4 = ['cyan', 'ink', 'ocean', 'paper'], B5 = ['comic yellow.base', 'cyan', 'ink', 'ocean', 'paper'], B6 = B5.concat(['vermilion.base']);
  function F(id, t, change, atoms, bands) {
    return { v: V, id: id, t: t, atoms: atoms, bands: bands || B4, change: change,
      sound: 'NO_DATA', soundCause: 'static-first: not served', motion: 'NO_DATA' };
  }
  function title(tx) { return { k: 'title', r: 'chapter name', i: [{ o: 'letters', tx: tx, x: 206, y: 46, sz: 30 }] }; }
  function word(tx, x, y, sz) { return { o: 'letters', tx: tx, x: x, y: y, sz: sz || 12 }; }
  var DOTS = { o: 'field', kind: 'halftone', y: [70, 300], r: '2.2|1.2|.6|0', step: 16, f: 'cyan' };
  var BED = { o: 'blob', x: 206, y: 560, rx: 280, ry: 110, seed: 'bed', rough: 0.1, f: 'ink', s: 'cyan' };

  var FRAMES = [
    F('REFUGE', 0, ['the refuge under the sea', 'your crab at home'], [
      title('refuge'),
      { k: 'light', r: 'soft light dots in deep water', i: [DOTS] },
      { k: 'seabed', r: 'the soft seabed', i: [BED] },
      { k: 'dome', r: 'the refuge: a round dome with a window', i: [{ o: 'blob', x: 206, y: 360, rx: 140, ry: 104, seed: 'refuge', vein: 2, f: 'paper', s: 'ink' },
        { o: 'blob', x: 206, y: 330, rx: 34, ry: 28, seed: 'window', rough: 0.05, f: 'ocean', s: 'ink' }] },
      { k: 'crab', r: 'your crab waits by the door', i: [{ o: 'crab', x: 318, y: 452, rr: 44, dir: -1, eye: 'open' }] }
    ]),
    F('SUMMON', 600, ['honest luck', 'egg to wave'], [
      title('summon'),
      { k: 'odds', r: 'every chance, printed', i: [{ o: 'odds', x: 36, y: 100, w: 340, chances: ODDS, bands: [BAND.normal, BAND.magico, BAND.raro, BAND.unico] }] },
      { k: 'egg', r: 'an egg becomes a wave', i: [{ o: 'troop', x: 206, y: 270, r: 92, f: BAND.unico, from: 'egg', as: 'unico' }] },
      { k: 'stats', r: 'life, armor, speed in dots', i: [
        word('life', 70, 404), { o: 'meter', x: 120, y: 404, w: 230, v: T.unico.stats.vida, max: 50 },
        word('armor', 70, 434), { o: 'meter', x: 120, y: 434, w: 230, v: T.unico.stats.armadura, max: 20 },
        word('speed', 70, 464), { o: 'meter', x: 120, y: 464, w: 230, v: T.unico.stats.velocidad, max: 12 }] }
    ], B6),
    F('ARMY', 1200, ['four waves, four rarities'], [
      title('army'),
      { k: 'waves', r: 'four waves: Normal, Magic, Rare, Leviathan', i: [
        { o: 'troop', x: 112, y: 180, r: 58, f: BAND.normal, as: 'normal' },
        { o: 'troop', x: 300, y: 180, r: 58, f: BAND.magico, as: 'magico' },
        { o: 'troop', x: 112, y: 370, r: 58, f: BAND.raro, as: 'raro' },
        { o: 'troop', x: 300, y: 370, r: 58, f: BAND.unico, as: 'unico' }] },
      { k: 'names', r: 'their names under them', i: [word(NAME.normal, 112, 262), word(NAME.magico, 300, 262), word(NAME.raro, 112, 452), word(NAME.unico, 300, 452)] }
    ], B6),
    F('BATTLE', 1800, ['two waves meet', 'life you can see'], [
      title('battle'),
      { k: 'seabed', r: 'the soft seabed', i: [BED] },
      { k: 'clash', r: 'lines and dots ripple', i: [{ o: 'clash', a: [150, 250], b: [262, 250], n: 3, amp: 16, k: 2 }] },
      { k: 'left', r: 'a Rare wave', i: [{ o: 'troop', x: 96, y: 250, r: 66, f: BAND.raro, as: 'raro' }] },
      { k: 'right', r: 'a Magic wave', i: [{ o: 'troop', x: 316, y: 250, r: 66, f: BAND.magico, as: 'magico' }] },
      { k: 'life left', r: 'Rare life in dots', i: [{ o: 'meter', x: 40, y: 360, w: 120, v: T.raro.stats.vida, max: 50, f: BAND.raro }] },
      { k: 'life right', r: 'Magic life in dots', i: [{ o: 'meter', x: 252, y: 360, w: 120, v: T.magico.stats.vida, max: 50 }] }
    ], B5),
    F('RIFT', 2400, ['the rift: what was proposed and what really happened', 'two doors'], [
      title('the rift'),
      { k: 'light', r: 'soft light dots in deep water', i: [DOTS] },
      { k: 'seabed', r: 'the soft seabed', i: [BED] },
      { k: 'rift', r: 'the rift: a wide smile in the seabed', i: [{ o: 'rift', x: 206, y: 470, w: 200, h: 30 }] },
      { k: 'crab', r: 'your crab offers its back', i: [{ o: 'crab', x: 300, y: 430, rr: 48, dir: -1, eye: 'up' }] },
      { k: 'doors', r: 'two doors: Check the rift opens the game; Create this device\'s account', i: [] }
    ])
  ];

  var MOTION = {
    REFUGE: { light: { a: 12 }, crab: { bob: [4, 2] } },
    SUMMON: { egg: { morph: 1, rot: 30 }, stats: { fill: 1.4 } },
    ARMY: { waves: { rot: 60 } },
    BATTLE: { clash: { ph: 720 }, left: { rot: 40, bob: [5, 2] }, right: { rot: -40, bob: [5, 2] }, 'life left': { drain: 0.2 }, 'life right': { drain: 0.6 } },
    RIFT: { light: { a: 12 }, crab: { bob: [4, 2] } }
  };

  var SECTIONS = FRAMES.map(function (f) { return f.id; });
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function find(id) {
    for (var i = 0; i < FRAMES.length; i++) { if (FRAMES[i].id === id) { return FRAMES[i]; } }
    throw new Error('unknown section: ' + id);
  }
  function frame(id) { var f = copy(find(id)); f.atoms.forEach(function (a) { a.i.forEach(function (it) { delete it.from; }); }); return f; }
  function pose(id, p) { return lib('AtlasBubbleGame', '../game/bubble_game.js').pulse(copy(find(id)), MOTION, p); }
  function build(f) {
    var A = lib('AtlasBubble', '../game/bubble_language.js');
    if (!A) { throw new Error('NO_DATA: AtlasBubble not loaded'); }
    return f.atoms.length ? A.compile(f) : [];
  }
  function cut(id) {
    var f = find(id), mv = MOTION[id] || {}, i;
    for (i = 0; i < f.atoms.length; i++) { if (mv[f.atoms[i].k]) { return i; } }
    return f.atoms.length;
  }
  function items(id, p) { return build(pose(id, p)); }
  function fondo(id) { var f = pose(id); f.atoms = f.atoms.slice(0, cut(id)); return build(f); }
  function frente(id, p) { var f = pose(id, p); f.atoms = f.atoms.slice(cut(id)); return build(f); }

  var TEXT = {
    kids: {
      REFUGE: { h: 'Your refuge', p: ['This is your home under the sea.', 'Your crab lives here. It is safe and cozy.'], sound: 'soft bubbles' },
      SUMMON: { h: 'Summon', p: ['Tap and an egg hatches into a wave.', 'Look at the bar: it shows every chance. Nothing is hidden.'], sound: 'a little pop' },
      ARMY: { h: 'Your army', p: ['Every wave has its own shape.', 'Normal, Magic, Rare and Leviathan: the rarer, the more curls.'], sound: 'four soft notes' },
      BATTLE: { h: 'Battle', p: ['Two waves meet and wiggle.', 'The dots under them are their life. You can see it go down.'], sound: 'a swish and a hum' },
      RIFT: { h: 'Ready?', p: ['The crab is waiting for you.', 'Tap the yellow button to play!'], sound: 'a gentle call' }
    },
    tech: {
      REFUGE: { h: 'The refuge', p: ['The refuge is the account: it lives on this device, and nothing leaves it without your signature.', 'Your crab is the piece you move on the map.'], sound: 'soft bubbles' },
      SUMMON: { h: 'Honest luck', p: ['A summon is a seeded draw. The four chances are printed above, straight from the game\'s own table: 62.5 %, 26.5 %, 8 % and 3 % at this level.', 'The egg becomes the wave by mixing two sets of harmonics as you scroll. The house never takes a cut, and time is counted in game cycles, never on a clock.'], sound: 'a little pop' },
      ARMY: { h: 'Waves are troops', p: ['Each troop is a sum of simple waves: a few harmonics, each with its own frequency, size and phase.', 'Rarity is how many curls the outline has, measured, not declared. These four are real draws from fixed seeds.'], sound: 'four soft notes' },
      BATTLE: { h: 'Life you can see', p: ['In the arena, life is never a hidden number: here it is drawn as dots. Its sound is not playing on this page yet.', 'Here the drain is only an illustration; in a real bout every change is measured and logged.'], sound: 'a swish and a hum' },
      RIFT: { h: 'Two doors', p: ['The rift is what gets measured: the gap between what was proposed and what really happened.', 'Check the rift opens the game. The face proposes; you sign.'], sound: 'a gentle call' }
    }
  };

  var AtlasCodexScene = Object.freeze({ SECTIONS: SECTIONS, PAGES: SECTIONS, CANVAS: { w: 412, h: 515 }, MOTION: MOTION,
    frame: frame, pose: pose, items: items, fondo: fondo, frente: frente, TEXT: TEXT, TROOPS: T, ODDS: ODDS });
  if (node) { module.exports = AtlasCodexScene; } else { root.AtlasCodexScene = AtlasCodexScene; }
})(typeof module === 'object' && module.exports ? this : (this || window));
