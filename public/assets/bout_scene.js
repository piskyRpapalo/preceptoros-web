(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  function lib(name, file) { return root[name] || (node ? require(file) : null); }
  var G = lib('AtlasGacha', '../game/gacha.js');
  var AR = lib('AtlasArena', '../game/arena.js');
  var W = lib('AtlasBubbleGame', '../game/bubble_game.js');
  var V = 'preceptoros.bubble/1';

  var BOUT = Object.freeze({
    v: 'preceptoros.bout/1', skin: 'apocalypse', tc: 'tc3',
    crab: '015e3e34d4fd0dbd0bf4923a2c764e5f409770bfdf1b603e9e44f9d34b4933bc',
    sleeper: 'b571c80138df80737fcf513f72695fe867f74f83cbc0e95b6b30f6f7c72fbd44',
    seed: '57f6105fb4bd8d5fea548fa020b52f90e1c01ce15169c96aabd814317455e454'
  });
  var BYTES = JSON.stringify(BOUT).length;
  var CRAB = G.tirada(BOUT.crab, BOUT.tc), SLEEPER = G.tirada(BOUT.sleeper, BOUT.tc);
  var FIGHT = AR.combate([{ tc: BOUT.tc, semilla: BOUT.sleeper }], [{ tc: BOUT.tc, semilla: BOUT.crab }], BOUT.seed);
  var NEIGHBORS = [G.tirada('a23d525508b2c6f0074aecea13737118b2729f9842c17a2d1161b3540a30e0e1', 'tc3'),
    G.tirada('f7b0f1c774f54b6f3efdfd51b2b6a9600380410f45449c38907e61846e4ef729', 'tc3')];
  W.cast('bout-crab', CRAB.armonicos);
  W.cast('bout-sleeper', SLEEPER.armonicos);
  W.cast('n1', NEIGHBORS[0].armonicos);
  W.cast('n2', NEIGHBORS[1].armonicos);

  function series() {
    var hp = [SLEEPER.stats.vida, CRAB.stats.vida], out = [hp.slice()], round = 1;
    FIGHT.registro.forEach(function (e) {
      if (e[0] !== round) { out.push(hp.slice()); round = e[0]; }
      if (e[4] > 0) { hp[1 - e[1]] = Math.max(0, hp[1 - e[1]] - e[4]); }
    });
    out.push(hp.slice());
    return out;
  }
  var HP = series();

  var B4 = ['cyan', 'ink', 'ocean', 'paper'], B5 = ['comic yellow.base', 'cyan', 'ink', 'ocean', 'paper'];
  function F(id, t, change, atoms, bands) {
    return { v: V, id: id, t: t, atoms: atoms, bands: bands || B4, change: change,
      sound: 'NO_DATA', soundCause: 'static-first: not served', motion: 'NO_DATA' };
  }
  function title(tx) { return { k: 'title', r: 'chapter name', i: [{ o: 'letters', tx: tx, x: 206, y: 46, sz: 30 }] }; }
  var DIM = { o: 'field', kind: 'halftone', y: [70, 260], r: '1.4|.8|.4|0', step: 18, f: 'cyan' };
  var BED = { o: 'blob', x: 206, y: 560, rx: 280, ry: 110, seed: 'bed', rough: 0.1, f: 'ink', s: 'cyan' };

  var FRAMES = [
    F('SILENCE', 0, ['the cloud went quiet'], [
      title('the silence'),
      { k: 'sky', r: 'a dim night sky', i: [DIM] },
      { k: 'roofs', r: 'one workshop still glows', i: [
        { o: 'blob', x: 80, y: 360, rx: 90, ry: 60, seed: 'roof1', rough: 0.05, f: 'ink', s: 'cyan' },
        { o: 'blob', x: 206, y: 330, rx: 96, ry: 76, seed: 'workshop', vein: 2, f: 'paper', s: 'ink' },
        { o: 'blob', x: 206, y: 312, rx: 26, ry: 20, seed: 'window', rough: 0.05, f: 'comic yellow.base', s: 'ink' }] },
      { k: 'phone', r: 'the last phone with power', i: [
        { o: 'ribbon', closed: true, pts: [[268, 440], [300, 440], [300, 492], [268, 492]], f: 'cyan', s: 'paper', lw: 2.5 },
        { o: 'crab', x: 330, y: 470, rr: 30, dir: -1, eye: 'up' }] }
    ], B5),
    F('SLEEPERS', 600, ['people staring at black screens', 'they are asleep, not bad'], [
      title('sleepers'),
      { k: 'seabed', r: 'the ground', i: [BED] },
      { k: 'sleepers', r: 'three sleepers hold dark screens and snore', i: [
        { o: 'sleeper', x: 100, y: 300, r: 58, as: 'n1', awake: 0 },
        { o: 'sleeper', x: 310, y: 280, r: 58, as: 'n2', awake: 0 },
        { o: 'sleeper', x: 206, y: 420, r: 62, as: 'bout-sleeper', awake: 0 }] }
    ]),
    F('BOUT', 1200, ['crab meets sleeper'], [
      title('wake up!'),
      { k: 'clash', r: 'wave song', i: [{ o: 'clash', a: [150, 260], b: [270, 260], n: 3, amp: 18, k: 3 }] },
      { k: 'sleeper', r: 'the sleeper', i: [{ o: 'sleeper', x: 96, y: 260, r: 64, as: 'bout-sleeper', awake: 0 }] },
      { k: 'crab', r: 'the crab', i: [{ o: 'crab', x: 320, y: 290, rr: 46, dir: -1, eye: 'open' }] },
      { k: 'sleep', r: 'sleep left', i: [{ o: 'letters', tx: 'sleep', x: 110, y: 372, sz: 12 }, { o: 'meter', x: 40, y: 392, w: 140, v: HP[0][0], max: SLEEPER.stats.vida }] },
      { k: 'crab life', r: 'crab life', i: [{ o: 'letters', tx: 'crab', x: 322, y: 372, sz: 12 }, { o: 'meter', x: 252, y: 392, w: 140, v: HP[0][1], max: CRAB.stats.vida, f: 'comic yellow.base' }] }
    ], B5),
    F('WAKE', 1800, ['the sleeper wakes up', 'its screen lights again'], [
      title('awake'),
      { k: 'sky', r: 'the sky clears a little', i: [DIM] },
      { k: 'seabed', r: 'the ground', i: [BED] },
      { k: 'friends', r: 'the sleeper is awake; its screen glows; the crab waves', i: [
        { o: 'sleeper', x: 140, y: 330, r: 70, as: 'bout-sleeper', awake: 1 },
        { o: 'crab', x: 300, y: 380, rr: 44, dir: -1, eye: 'up' }] }
    ])
  ];

  var MOTION = {
    SILENCE: { sky: { a: 10 }, phone: { bob: [3, 2] } },
    SLEEPERS: { sleepers: { bob: [4, 2], rot: 10 } },
    BOUT: { clash: { ph: 720 }, sleeper: { rot: 20, wake: 0.5 }, crab: { bob: [5, 3] },
      sleep: { series: HP.map(function (h) { return h[0]; }) }, 'crab life': { series: HP.map(function (h) { return h[1]; }) } },
    WAKE: { sky: { a: 10 }, friends: { bob: [4, 2] } }
  };

  var SECTIONS = FRAMES.map(function (f) { return f.id; });
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function find(id) {
    for (var i = 0; i < FRAMES.length; i++) { if (FRAMES[i].id === id) { return FRAMES[i]; } }
    throw new Error('unknown section: ' + id);
  }
  function frame(id) { return copy(find(id)); }
  function pose(id, p) { return W.pulse(copy(find(id)), MOTION, p); }
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

  var won = FIGHT.gana === 'asalto';
  var TEXT = {
    kids: {
      SILENCE: { h: 'The silence', p: ['One night the big cloud went quiet.', 'Only one little phone still had power. A crab held it.'], sound: 'a soft hum' },
      SLEEPERS: { h: 'Sleepers', p: ['Some people kept looking at black screens.', 'Kids call them zombies. They are not bad. They are just asleep!'], sound: 'snoring, zzz' },
      BOUT: { h: 'Wake up!', p: ['The crab sings a wave song.', 'The dots show how much sleep is left. Watch them go down.'], sound: 'a wave song' },
      WAKE: { h: 'Good morning!', p: [won ? 'The sleeper wakes up. Its screen lights up again.' : 'Not this time. The sleeper keeps snoring. Try again tomorrow!', 'Now the crab has a new friend.'], sound: 'a happy chime' }
    },
    tech: {
      SILENCE: { h: 'The Day of Silence', p: ['A parallel story to Atlantis, from the house lore «Killswitch Apocalypse»: the cloud closed and only local machines kept working.', 'This node, the phone with the last charge, wears the «apocalypse» skin. The data underneath is the same game.'], sound: 'a soft hum' },
      SLEEPERS: { h: 'Same math, other skin', p: ['A sleeper is an ordinary troop: its body is drawn from its own harmonics, exactly the spectrum the arena reads.', 'The skin only changes the face and the props. Nothing in the rules changes.'], sound: 'snoring, zzz' },
      BOUT: { h: 'A real bout in ' + BYTES + ' bytes', p: ['The whole fight is one packet of ' + BYTES + ' bytes: two troop seeds, a level and a bout seed, under the 1,024-byte channel ceiling.', 'The arena resolves it with AtlasArena.combate: ' + FIGHT.rondas + ' rounds, measured. The dots follow the real log, round by round.'], sound: 'a wave song' },
      WAKE: { h: won ? 'Awake' : 'Still asleep', p: ['Winner: ' + (won ? 'the crab' : FIGHT.gana === 'empate' ? 'nobody (draw)' : 'the sleeper') + '. Life left per thousand: sleeper ' + FIGHT.vida_por_mil[0] + ', crab ' + FIGHT.vida_por_mil[1] + '.', 'Same packet, same result, on any node: that is what lets a crab and a sleeper share one arena.'], sound: 'a happy chime' }
    }
  };

  var AtlasBoutScene = Object.freeze({ SECTIONS: SECTIONS, PAGES: SECTIONS, CANVAS: { w: 412, h: 515 }, MOTION: MOTION, ST: 'SIMULATED',
    frame: frame, pose: pose, items: items, fondo: fondo, frente: frente, TEXT: TEXT,
    BOUT: BOUT, BYTES: BYTES, FIGHT: FIGHT, HP: HP });
  if (node) { module.exports = AtlasBoutScene; } else { root.AtlasBoutScene = AtlasBoutScene; }
})(typeof module === 'object' && module.exports ? this : (this || window));
