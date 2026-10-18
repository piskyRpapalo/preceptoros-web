(function (raiz) {
  'use strict';
  var V = 'preceptoros.bubble/1', LUZ = [-0.35, -0.94], CV = [412, 515];
  var SIN_SONIDO = 'static-first: not served';
  function F(id, t, bands, change, atoms, extra) {

    var f = { v: V, id: id, t: t, atoms: atoms, bands: bands,
      change: change, sound: 'NO_DATA', soundCause: SIN_SONIDO, motion: 'NO_DATA' };
    if (extra) { Object.keys(extra).forEach(function (k) { f[k] = extra[k]; }); }
    return f;
  }
  var B4 = ['cyan', 'ink', 'ocean', 'paper'], B5 = ['FIRMADO.base', 'cyan', 'ink', 'ocean', 'paper'];
  var DOTS = { o: 'field', kind: 'halftone', r: '2.5|1.5|.8|0', step: 15, f: 'cyan' };
  var CLIFF = { o: 'wall', x: [270, 412], y: [80, 515], seed: 'cliff', vein: 3, f: 'paper', s: 'ink' };
  var CITY = { o: 'city', x: [300, 412], y: [30, 80], dome: 3 };

  var FRAMES = [
    F('OPEN', 0, B4, ['first page: the name of the house'], [
      { k: 'light', r: 'soft light dots in deep water', i: [{ o: 'field', kind: 'halftone', x: [150, 412], y: [0, 515], r: '2.5|1.2|0', step: 15, f: 'cyan' }] },
      { k: 'logo', r: 'the word preceptoros, big, along the left edge', i: [{ o: 'text', tx: 'preceptoros', x: 96, y: 268, rot: -90, sz: 78, w: 700, f: 'paper', sh: [4, 4, 'cyan'] }] },
      { k: 'cliff', r: 'the round edge of a cliff peeks in', i: [{ o: 'wall', x: [340, 412], y: [90, 515], seed: 'cliff', vein: 2, f: 'paper', s: 'ink' }] },
      { k: 'bubbles', r: 'three bubbles rise', i: [{ o: 'field', kind: 'bubbles', x: 236, y: 420, seed: 'open', r: [6, 11] }] }
    ]),
    F('CLIFF', 500, B4, ['the logo leaves', 'the rock and the sleeping face arrive'], [
      { k: 'light', r: 'light dots, denser near the top', i: [DOTS] },
      { k: 'city', r: 'far away, the domes of the sleeping city', i: [CITY] },
      { k: 'cliff', r: 'a tall marble cliff under the deep sea', i: [CLIFF] },
      { k: 'rock', r: 'a big marble rock juts from the cliff', i: [{ o: 'blob', x: 200, y: 220, rx: 118, ry: 100, seed: 'rock', vein: 4, f: 'paper', s: 'ink' }] },
      { k: 'face', r: 'a stone face in the rock, eyes shut, asleep', i: [{ o: 'bust', x: 192, y: 214 }] },
      { k: 'rockfall', r: 'seven round stones hold the rock up', i: [{ o: 'pile', x: [140, 300], y: [318, 420], seed: 'pile' }] }
    ]),
    F('START', 1100, B4, ['sea life arrives and climbs', 'everyone looks at the face'], [
      { k: 'before', r: 'the cliff, the rock and the face stay', i: [{ o: 'keep', k: 'CLIFF' }] },
      { k: 'crab', r: 'a friendly crab climbs and looks up', i: [{ o: 'crab', x: 322, y: 452, rr: 46, dir: -1, eye: 'up' }] },
      { k: 'star', r: 'a starfish climbs and looks up', i: [{ o: 'star', x: 356, y: 328, r: 30, eye: 'up' }] },
      { k: 'snail', r: 'a snail climbs too', i: [{ o: 'snail', x: 300, y: 252, r: 22, eye: 'up' }] },
      { k: 'octopus', r: 'a little octopus with curly arms watches', i: [{ o: 'octo', x: 104, y: 436, r: 28, eye: 'up' }] },
      { k: 'fish', r: 'three fish far away', i: [{ o: 'fish', x: 44, y: 100, sc: 1.3 }, { o: 'fish', x: 100, y: 132, sc: 1.05 }, { o: 'fish', x: 146, y: 94, sc: 0.9 }] }
    ]),
    F('TREMOR', 1700, B5, ['the eyes open; the violet eye means signed', 'tiny waves come out', 'the sea wobbles a little'], [
      { k: 'before', r: 'the cliff, the rock and the climbers stay', i: [{ o: 'keep', k: 'START' }] },
      { k: 'face', r: 'the face opens its eyes; one eye is violet: signed, a first signature', i: [{ o: 'bust', x: 192, y: 214, eye: 'open', cybEye: 'violet', mEye: 'open', mouth: 'o' }] },
      { k: 'wobble', r: 'soft wobble rings around the rock', i: [{ o: 'wob', x: 200, y: 220, r: [130, 146], n: 4, arc: 40 }] },
      { k: 'tiny waves', r: 'four tiny waves wiggle out, curious', i: [{ o: 'troop', x: 170, y: 440 }, { o: 'troop', x: 215, y: 470, ph: 16 }, { o: 'troop', x: 260, y: 448, ph: 32 }, { o: 'troop', x: 150, y: 478, ph: 48 }] }
    ]),
    F('SPLIT', 2400, B5, ['the rock comes loose', 'the rift opens', 'the stones roll'], [
      { k: 'before', r: 'the light, the far city and the cliff stay', i: [{ o: 'keep', k: 'CLIFF:light|city|cliff' }] },
      { k: 'rift', r: 'a soft S-gap opens in the wall: the rift', i: [{ o: 'seam', x: 268, y: [60, 515], gap: 40 }] },
      { k: 'rock', r: 'the rock tips away from the wall', i: [{ o: 'blob', x: 166, y: 230, rx: 118, ry: 100, rot: -14, seed: 'rock', vein: 4, f: 'paper', s: 'ink' }] },
      { k: 'face', r: 'the face tips with it, violet eye open', i: [{ o: 'bust', x: 160, y: 222, rot: -14, eye: 'open', cybEye: 'violet', mEye: 'open', mouth: 'o' }] },
      { k: 'stones', r: 'the round stones roll away like balls', i: [{ o: 'pile', x: [40, 220], y: [400, 480], seed: 'pile' }] },
      { k: 'tiny waves', r: 'the tiny waves stay close', i: [{ o: 'keep', k: 'TREMOR:tiny waves' }] }
    ]),
    F('FALL', 3000, B5, ['the fall begins and loops until you enter'], [
      { k: 'wall', r: 'a steep marble wall with round ledges', i: [{ o: 'wall', x: [200, 200], y: [0, 515], side: 'left', tilt: 4, per: 260, seed: 'fall', vein: 3, f: 'paper', s: 'ink' }] },
      { k: 'reef', r: 'deep water with soft corals, fans and anemones', i: [{ o: 'reef', x: [0, 96], y: [0, 515] }] },
      { k: 'head', r: 'the head, violet eye open, bounces like a rubber ball; nothing hurts', i: [{ o: 'bust', x: 236, y: 250, r: 46, rot: 12, eye: 'open', cybEye: 'violet', mEye: 'happy', mouth: 'o' }] },
      { k: 'boing', r: 'two boing marks where it bounced', i: [{ o: 'boing', x: 204, y: 250 }] },
      { k: 'bubbles', r: 'bubbles rise in the open water', i: [{ o: 'field', kind: 'bubbles', x: 320, y: 480, h: 300, seed: 'fall' }] }
    ], { loop: 600 }),
    F('GATE', 4800, B5, ['the seabed and the rift appear', 'the crab waits', 'two doors'], [
      { k: 'fall', r: 'the fall goes on above, the violet eye still open', i: [{ o: 'keep', k: 'FALL' }] },
      { k: 'seabed', r: 'the soft seabed at the bottom', i: [{ o: 'blob', x: 206, y: 540, rx: 270, ry: 80, seed: 'bed', rough: 0.1, f: 'ink', s: 'cyan' }] },
      { k: 'rift', r: 'the rift: a wide smile in the seabed', i: [{ o: 'rift', x: 290, y: 482, w: 150, h: 26 }] },
      { k: 'crab', r: 'the friendly crab waits and offers its back', i: [{ o: 'crab', x: 296, y: 444, rr: 52, dir: -1, eye: 'up' }] },
      { k: 'doors', r: 'two doors: Check the rift opens the game; Create this device\'s account', i: [] }
    ])
  ];

  var SECTIONS = FRAMES.map(function (f) { return f.id; });
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function busca(id) {
    for (var i = 0; i < FRAMES.length; i++) { if (FRAMES[i].id === id) { return FRAMES[i]; } }
    throw new Error('unknown section: ' + id);
  }
  function frame(id) { return copia(busca(id)); }

  var MOTION = {
    OPEN: { light: { a: 14 }, bubbles: { dy: -150 } },
    CLIFF: { face: { breathe: 2 } },
    START: { crab: { dy: -26 }, star: { dy: -30, rot: 40 }, snail: { dy: -12 }, octopus: { bob: [5, 2] }, fish: { dx: 70, bob: [4, 3] } },
    TREMOR: { face: { shake: [2.5, 7] }, wobble: { ph: 120, grow: 10 }, 'tiny waves': { ph: 64, bob: [6, 3] } },
    SPLIT: { rift: { gap: 18 }, rock: { rot: -9, dx: -10 }, face: { rot: -9, dx: -10 }, stones: { dx: -60 } },
    FALL: { head: { bounce: [70, 3] }, boing: { contact: 3 }, bubbles: { dy: -260 } },
    GATE: { rift: { w: 30 }, crab: { bob: [4, 2] } }
  };
  var TAU = 2 * Math.PI;
  function r2(v) { return Math.round(v * 100) / 100; }
  function mas(it, k, v) { it[k] = Array.isArray(it[k]) ? it[k].map(function (q) { return r2(q + v); }) : r2(it[k] + v); }

  function mueveItem(it, m, p) {
    var s;
    if (m.dx) { mas(it, 'x', m.dx * p); }
    if (m.dy) { mas(it, 'y', m.dy * p); }
    if (m.bob) { mas(it, 'y', m.bob[0] * Math.sin(TAU * m.bob[1] * p)); }
    if (m.shake) { mas(it, 'x', m.shake[0] * Math.sin(TAU * m.shake[1] * p)); }
    if (m.rot) { it.rot = r2((it.rot || 0) + m.rot * p); }
    if (m.ph) { it.ph = r2((it.ph || 0) + m.ph * p); }
    if (m.a) { it.a = r2((it.a === undefined ? 45 : it.a) + m.a * p); }
    if (m.grow) { mas(it, 'r', m.grow * p); }
    if (m.gap) { mas(it, 'gap', m.gap * p); }
    if (m.w) { mas(it, 'w', m.w * p); }
    if (m.breathe) { s = 0.02 * Math.sin(TAU * m.breathe * p); it.sq = [r2(1 - s), r2(1 + s)]; }
    if (m.bounce) {
      s = Math.abs(Math.sin(Math.PI * m.bounce[1] * p));
      mas(it, 'x', m.bounce[0] * s);
      it.rot = r2((it.rot || 0) + 30 * m.bounce[1] * p);
      s = Math.max(0, 1 - s / 0.25);
      it.sq = [r2(1 - 0.12 * s), r2(1 + 0.12 * s)];
    }
  }

  function mueve(f, p) {
    var mv = MOTION[f.id] || {};
    if (typeof p !== 'number' || !isFinite(p)) { return f; }
    p = Math.min(Math.max(p, 0), 1);
    f.atoms.forEach(function (a) {
      var m = mv[a.k];
      if (!m) { return; }
      if (m.contact && Math.abs(Math.sin(Math.PI * m.contact * p)) > 0.25) { a.i = []; return; }
      a.i.forEach(function (it) { if (it.o !== 'keep') { mueveItem(it, m, p); } });
    });
    return f;
  }

  function compila(f) {
    var A = raiz.AtlasBubble || (typeof module === 'object' && module.exports ? require('../game/bubble_language.js') : null);
    if (!A) { throw new Error('NO_DATA: AtlasBubble not loaded'); }
    var prev = {};
    if (!f.atoms.length) { return []; }
    FRAMES.forEach(function (x) { prev[x.id] = copia(x); });
    f.prev = prev;
    return A.compile(f);
  }

  function corte(id) {
    var f = busca(id), mv = MOTION[id] || {}, i;
    for (i = 0; i < f.atoms.length; i++) { if (mv[f.atoms[i].k]) { return i; } }
    return f.atoms.length;
  }
  function pose(id, p) { return mueve(frame(id), p); }
  function items(id, p) { return compila(pose(id, p)); }
  function fondo(id) { var f = frame(id); f.atoms = f.atoms.slice(0, corte(id)); return compila(f); }
  function frente(id, p) { var f = mueve(frame(id), p); f.atoms = f.atoms.slice(corte(id)); return compila(f); }

  var TEXT = {
    kids: {
      OPEN: { h: 'preceptoros', p: ['Hello! This is a story.', 'Scroll down. Let\'s go deep, deep down.'], sound: 'quiet deep water' },
      CLIFF: { h: 'Deep down', p: ['Deep, deep in the sea there is a big rock.', 'The rock has a face! The face is asleep.', 'Old round stones hold it up.'], sound: 'a slow, low hum of the deep' },
      START: { h: 'Look!', p: ['Look! A crab climbs. A star climbs. A snail climbs too.', 'Everyone looks up at the sleepy face.'], sound: 'tiny tapping feet' },
      TREMOR: { h: 'Wobble!', p: ['Wobble, wobble! The sea shakes a little.', 'The eye opens. It is purple!', 'Purple means: signed. It is the face\'s first yes.', 'Tiny waves wiggle out. Hello, tiny waves!'], sound: 'a soft purr, then a bright little chime' },
      SPLIT: { h: 'Roll, roll', p: ['Creak! The rock comes loose.', 'The round stones roll away. Roll, roll, roll.'], sound: 'a creak, and stones rolling like marbles' },
      FALL: { h: 'Boing!', p: ['Oops! Down goes the head.', 'Boing! Boing! It bounces like a ball.', 'It does not hurt. It giggles! Down, down, down.'], sound: 'boing, boing, and a giggle' },
      GATE: { h: 'Ready?', p: ['Far below, a little crab waits.', 'It wants to give the head a ride.', 'Ready? Tap the yellow button!'], sound: 'a gentle call' }
    },
    tech: {
      OPEN: { h: 'preceptoros', p: ['PreceptorOS is a learning game where a model proposes and a person signs.', 'Scroll at your own pace: nothing moves unless you do. Every picture here is drawn in code.'], sound: 'quiet deep water' },
      CLIFF: { h: 'A model at rest', p: ['Under the deep sea, a sleeping city keeps its square at the edge of a cliff.', 'A marble face rests there, held up by an old rockfall.', 'The face is a model at rest: it has proposed nothing yet.'], sound: 'a slow, low hum of the deep' },
      START: { h: 'Watching is free', p: ['Sea life climbs the wall to look.', 'Watching costs nothing and asks nothing: nobody signs anything just to look.'], sound: 'tiny tapping feet' },
      TREMOR: { h: 'A first signature', p: ['A tremor. The eye opens in violet, and in this house violet means one thing only: signed.', 'This is a first signature.', 'The tiny waves are the creatures of the arena: shapes made by adding simple waves together. Nobody fights them here: they only come out to see.'], sound: 'a soft purr, then a bright little chime' },
      SPLIT: { h: 'The rift', p: ['Slowly the rock comes away from the wall.', 'A gap opens where the two pieces met: that gap is the rift.', 'The rift is what gets measured: the distance between what was proposed and what really happened.'], sound: 'a creak, and stones rolling like marbles' },
      FALL: { h: 'Until you choose', p: ['The head falls along the wall, bouncing like rubber, and keeps falling until you choose.', 'That is how a model works here: it keeps proposing, and nothing becomes true until a person signs. Nothing breaks.'], sound: 'boing, boing, and a giggle' },
      GATE: { h: 'Two doors', p: ['Check the rift opens the game.', 'Or create the account for this device: the city is the account, and it stays on your device.', 'The face proposes; you sign.'], sound: 'a gentle call' }
    }
  };

  var AtlasDescentScene = Object.freeze({ SECTIONS: SECTIONS, PAGES: SECTIONS, CANVAS: { w: CV[0], h: CV[1] },
    frame: frame, items: items, pose: pose, fondo: fondo, frente: frente, MOTION: MOTION, TEXT: TEXT });
  if (typeof module === 'object' && module.exports) { module.exports = AtlasDescentScene; }
  else { raiz.AtlasDescentScene = AtlasDescentScene; }
})(typeof module === 'object' && module.exports ? this : (this || window));
