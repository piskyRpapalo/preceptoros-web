// The colony page of /openworld/ (ODD isometric-colony, IC6). One more render of the state: the colony (IC1, validated
// by colony_state.js), its hex projection (IC2), its buildings (IC4) on the day and night sky of its tick (IC5). Each
// building has one bot with a face beside it. Bots bob by the tick alone (a whole-number cycle); with reduced motion
// they stand still. No random numbers, no clock reads, no network. Without a colony in the state, nothing is drawn here: the
// door says NO_DATA with its cause.
(function (root) {
  'use strict';

  var K = 1.6, S = 1.4;                       // K spaces the hex positions, S scales one bubble box in the page
  var BX = 60, BY = 84;                       // the base of a building inside its box (the same as the core)
  var BOT_DX = 22, BOT_DY = 8;               // a bot stands just beside its building
  var ANCHO = 480, ALTO = 320;                // the canvas the page draws on, in its own units
  var RONDA = [0, 1, 2, 1];
  var SQUASH = Math.sqrt(3) / 4;              // the ground-to-screen squash of HexProjection (x 48q, y 12q+24r)                   // one bob cycle, whole numbers only

  function hash(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // The bot: a body, two eyes and a mouth, all bubble ribbons. The face says the state, not a feeling.
  // crabPts(C) → 24 integer points of the crab outline, scaled so its widest harmonic sum is 9 px (the walker's box).
  function crabPts(C) {
    var arm = C.onda(C.forma(0, false).escala, null, 'cupula'), lim = 0, pts = [];
    arm.forEach(function (h) { lim += Math.max(Math.abs(h[1]), Math.abs(h[2])); });
    for (var i = 0; i < 24; i++) {
      var u = i * 2 * Math.PI / 24, x = 0, y = 0;
      arm.forEach(function (h) { var f = h[0] * u + h[3] * Math.PI / 32; x += h[1] * Math.cos(f); y += h[2] * Math.sin(f); });
      pts.push([Math.round(9 * x / lim), Math.round(9 * y / lim)]);
    }
    return pts;
  }
  function cuerpoPts(r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      pts.push([Math.round(r * Math.cos(i * Math.PI / 5)), Math.round(r * 0.9 * Math.sin(i * Math.PI / 5))]);
    }
    return pts;
  }
  // The face of a node follows its look (IC7-S4, D11). basic and atlantis: smiling face on paper. zombie: flat eyes and a
  // straight mouth on the cyan family. Only house bands are used; the look is data of the state, never a fixed skin.
  function botFrame(node, t, reducido) {
    var dy = reducido === true ? 0 : RONDA[((t % 4) + 4) % 4];
    var look = node.look === 'zombie' ? 'zombie' : 'basic';
    var frase = 'bot of ' + node.id + ' · ' + look + ' face · seal ' + (node.seal || 'NO_DATA') + ' · tick ' + t + (reducido === true ? ' · still (reduced motion)' : '');
    var cuerpo = cuerpoPts(9).map(function (q) { return [q[0] + BX, q[1] + BY - 14 - dy]; });
    var cara = look === 'zombie' ? [
      { o: 'ribbon', pts: [[BX - 6, BY - 18 - dy], [BX - 2, BY - 18 - dy], [BX - 2, BY - 16 - dy], [BX - 6, BY - 16 - dy]], closed: true, f: 'ink', s: 'ink', lw: 1 },
      { o: 'ribbon', pts: [[BX + 2, BY - 18 - dy], [BX + 6, BY - 18 - dy], [BX + 6, BY - 16 - dy], [BX + 2, BY - 16 - dy]], closed: true, f: 'ink', s: 'ink', lw: 1 },
      { o: 'ribbon', pts: [[BX - 5, BY - 9 - dy], [BX + 5, BY - 9 - dy], [BX + 5, BY - 8 - dy], [BX - 5, BY - 8 - dy]], closed: true, f: 'ink', s: 'ink', lw: 1 }
    ] : [
      { o: 'ribbon', pts: [[BX - 4, BY - 18 - dy], [BX - 2, BY - 16 - dy], [BX - 4, BY - 14 - dy]], closed: true, f: 'ink', s: 'ink', lw: 1 },
      { o: 'ribbon', pts: [[BX + 4, BY - 18 - dy], [BX + 6, BY - 16 - dy], [BX + 4, BY - 14 - dy]], closed: true, f: 'ink', s: 'ink', lw: 1 },
      { o: 'ribbon', pts: [[BX - 4, BY - 10 - dy], [BX, BY - 8 - dy], [BX + 4, BY - 10 - dy]], closed: false, f: 'ink', s: 'ink', lw: 1 }
    ];
    return {
      v: 'preceptoros.bubble/1', id: 'bot-' + node.id, t: t, cv: [120, 110], seal: node.seal || 'NO_DATA',
      atoms: [{ k: 'bot.' + node.id, r: frase, i: [{ o: 'ribbon', pts: cuerpo, closed: true, f: look === 'zombie' ? 'cyan' : 'paper', s: 'ink', lw: 2 }].concat(cara) }],
      bands: ['paper', 'ink', 'cyan'],
      change: [frase],
      sound: 'NO_DATA: bots declare no waves; nothing is invented',
      soundCause: 'a bot has no measured value in this slice'
    };
  }

  // The colony as it is drawn: validated state in, scene out. Throws on any invalid state (no invented row).
  function scene(estado, t, reducido, looks, seals) {
    var validar = root.AtlasColonyState || root.colony;   // the browser: colony_state.js is a classic script, so colony is global
    var colonia = validar(estado);
    var AE = root.AtlasEdificios, PC = root.AtlasPaletteCycle;
    var sc = AE.scene(colonia, 1, reducido === true, seals);
    var cielo = PC.palette(t, reducido === true).cielo;
    // One bot per live node, beside the node's hex (IC7-S3). Buildings are drawn separately, as before.
    var bots = sc.tiles.map(function (n) {
      return { id: 'bot-' + n.id, x: n.x + BOT_DX * ESCALA_SALA, y: n.y + BOT_DY * ESCALA_SALA, frame: botFrame({ id: n.id, look: looks ? looks[n.id] : undefined, seal: seals ? seals[n.id] : undefined }, t, reducido === true) };
    });
    return { tiles: sc.tiles, buildings: sc.buildings, bots: bots, cielo: cielo, nodes: colonia.nodes.length, edificios: colonia.buildings.length };
  }
  var ESCALA_SALA = 2;   // the same spacing as the core: the scene is placed at twice the axial positions

  // draw(canvas, estado, t, reducido) → the scene drawn on canvas, with the sky of its tick under it.
  // TA-3 · the user's ephemeral walker (D15): not node state, so its seal is NO_DATA and its sentence says so.
  function youFrame(walker, t, reducido) {
    var dy = reducido === true ? 0 : RONDA[((t % 4) + 4) % 4];
    // H1b: the visitor is one more bot, drawn as the ephemeral crab of the sea class (gdpr-art25-ephemeral-crab.js): its
    // outline is the crab's own Fourier series (shell k=1, scallops, claws k=2), sampled the way gacha.js samples a wave.
    var C = root.AtlasCrab, crab = !!(C && C.onda && C.forma);
    var on = walker.free ? 'on cell ' + walker.q + ',' + walker.r : 'on node ' + walker.node;
    var frase = 'you · ephemeral ' + (crab ? 'crab (sea)' : 'walker') + ' ' + on + ' · not node state · seal NO_DATA · tick ' + t;
    var ring = (crab ? crabPts(C) : cuerpoPts(7)).map(function (q) { return [q[0] + BX, q[1] + BY - 12 - dy]; });
    return {
      v: 'preceptoros.bubble/1', id: 'you', t: t, cv: [120, 110], seal: 'NO_DATA',
      atoms: [{ k: 'you', r: frase, i: [{ o: 'ribbon', pts: ring, closed: true, f: 'vermilion.base', s: 'ink', lw: 2 }] }],
      bands: ['paper', 'ink', 'cyan'], change: [frase],
      sound: 'NO_DATA: the walker declares no waves; nothing is invented',
      soundCause: 'the walker has no measured value in this slice'
    };
  }

  // geometry(sc, canvas) → { cx, cy, k }: the one place where the scene is placed on the canvas. Drawing and the click
  // test both read it, so a click lands on the drawn hex.
  // IC7-S4: the spacing shrinks when the widest node would leave the canvas; it never grows past K.
  function geometry(sc, canvas) {
    var reach = sc.tiles.reduce(function (m, n) { return Math.max(m, Math.abs(n.x)); }, 1);
    // H1b: the pinch/wheel factor of map_zoom.js (canvas.dataset.zoom) scales the one placement, so drawing and the click test agree.
    var zoom = Number(canvas.dataset && canvas.dataset.zoom) || 1;
    // Free walk: the camera pan (canvas pixels, canvas.dataset.panx/pany) keeps the crab in view; clicks read it too.
    var px = Number(canvas.dataset && canvas.dataset.panx) || 0, py = Number(canvas.dataset && canvas.dataset.pany) || 0;
    // Orbit: the view angle (canvas.dataset.angle, whole degrees) turns the projected floor around the scene origin.
    // Only the picture turns (law P5): the state, the fog and every result stay where they are.
    var deg = Math.round(Number(canvas.dataset && canvas.dataset.angle) || 0), a = deg * Math.PI / 180;
    var G = { cx: canvas.width / 2 + px, cy: canvas.height / 2 + py, k: Math.min(K, (canvas.width / 2 - 80) / reach) * zoom,
      angle: ((deg % 360) + 360) % 360, cos: Math.cos(a), sin: Math.sin(a) };
    // turn(x, y) → the projected point after the view rotation (still in scene units; depth is its y). The turn is on the
    // ground: HexProjection squashes y by SQUASH (√3/4 makes its hex regular), so y is unsquashed, turned and squashed
    // again. A hex stays a hex at every angle and 60° lands each cell on a neighbour's place.
    G.turn = function (x, y) { var u = y / SQUASH; return { x: x * G.cos - u * G.sin, y: (x * G.sin + u * G.cos) * SQUASH }; };
    // at(x, y) → canvas pixels of a scene point: the one formula drawing and the click test share.
    G.at = function (x, y) { var r = G.turn(x, y); return { x: G.cx + r.x * G.k, y: G.cy + r.y * G.k }; };
    return G;
  }

  // nodeAt(canvas, estado, t, looks, seals, px, py) → the id of the node drawn under the point (canvas pixels), or null.
  // The anchor of a node is the point where its hex is drawn; the test radius is one bubble box at its own scale.
  function nodeAt(canvas, estado, t, looks, seals, px, py) {
    var sc = scene(estado, t, false, looks, seals), G = geometry(sc, canvas), best = null, bestD = 36 * S;
    sc.tiles.forEach(function (n) {
      var p = G.at(n.x, n.y), dx = p.x - px, dy = p.y - py, d = Math.sqrt(dx * dx + dy * dy);
      if (d <= bestD) { best = n.id; bestD = d; }
    });
    return best;
  }

  function tileOf(sc, id) { return sc.tiles.filter(function (n) { return n.id === id; })[0] || null; }

  // anchorOf(canvas, estado, t, looks, seals, id) → { x, y } in canvas pixels where the hex of node id is drawn, or null.
  function anchorOf(canvas, estado, t, looks, seals, id) {
    var sc = scene(estado, t, false, looks, seals), G = geometry(sc, canvas), n = tileOf(sc, id);
    return n ? G.at(n.x, n.y) : null;
  }

  // follow(canvas, sc, you): when the crab leaves the upper band of the canvas (the joystick panel covers the lower half
  // at phone width), pan so it stands at mid width, a quarter down. A jump, never a tween, so reduced motion needs
  // nothing more. The pan is written on canvas.dataset, beside dataset.zoom, and geometry() reads it.
  function follow(canvas, sc, you) {
    var G = geometry(sc, canvas), p = G.at(you.x, you.y), x = p.x, y = p.y - (you.lift || 0) * G.k, W = canvas.width, H = canvas.height;
    if (x < W * 0.15 || x > W * 0.85 || y < H * 0.12 || y > H * 0.42) {
      canvas.dataset.panx = String(Math.round(G.cx - W / 2 - (x - W / 2)));
      canvas.dataset.pany = String(Math.round(G.cy - H / 2 - (y - H / 4)));
    }
  }

  function draw(canvas, estado, t, reducido, looks, seals, walker) {
    var B = root.AtlasBubble, P = root.AtlasComicAtoms;
    var sc = scene(estado, t, reducido, looks, seals);
    var you = walker ? tileOf(sc, walker.node) : null;
    // W-3: while the walker walks, it stands between the two hexes by the fraction of its step.
    if (you && walker.to && walker.fraction > 0) {
      var nxt = tileOf(sc, walker.to);
      if (nxt) { you = { id: you.id, x: you.x + (nxt.x - you.x) * walker.fraction, y: you.y + (nxt.y - you.y) * walker.fraction }; }
    }
    // Free walk: the crab stands on its own floor cell, raised by the cell height (map_painter HSTEP), same placement.
    var MP = root.AtlasMapPainter, HP = root.HexProjection;
    if (you && walker.free && HP) {
      var cell = HP(walker.q, walker.r);
      you = { id: you.id, x: cell.x, y: cell.y, lift: (walker.h || 0) * (MP ? MP.HSTEP : 7), free: true };
      follow(canvas, sc, you);
    }
    sc.you = you ? youFrame(walker, t, reducido === true) : null;
    var g = canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = sc.cielo; g.fillRect(0, 0, canvas.width, canvas.height);
    var G = geometry(sc, canvas), cx = G.cx, cy = G.cy, k = G.k;
    // P4: the 2.5D floor of the baked chunks, under every layer, by this same placement (map_painter.js).
    if (root.AtlasMapPainter) { root.AtlasMapPainter.draw(g, G, t, reducido === true); }
    // M1-2: one deterministic depth order for every layer of this same map.
    var layers = sc.tiles.map(function (n, i) { return { id: 'tile-' + i, item: n }; })
      .concat(sc.buildings.map(function (n, i) { return { id: 'building-' + i, item: n }; }))
      .concat(sc.bots.map(function (n, i) { return { id: 'bot-' + i, item: n }; }));
    if (you) { layers.push({ id: 'walker', item: you.free ? { x: you.x, y: you.y, lift: you.lift, frame: sc.you } : { x: you.x - BOT_DX * ESCALA_SALA, y: you.y - 22, frame: sc.you } }); }
    // Orbit: each layer is turned with the floor, then sorted back to front by its TURNED depth (floor law step 3).
    var turned = layers.map(function (layer) {
      var r = G.turn(layer.item.x, layer.item.y);
      return { id: layer.id, x: r.x, y: r.y, lift: layer.item.lift || 0, frame: layer.item.frame };
    });
    var drawn = root.AtlasMapScene ? root.AtlasMapScene.compose(turned.map(function (l) { return { id: l.id, x: l.x, y: l.y, frame: l.frame }; }))
      .map(function (l) { return turned.filter(function (o) { return o.id === l.id; })[0]; })
      : turned.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : 1); });
    sc.order = drawn.map(function (l) { return l.id; });
    drawn.forEach(function (nd) {
      g.save();
      g.translate(cx + nd.x * k - BX * S, cy + (nd.y - nd.lift) * k - BY * S);
      g.scale(S, S);
      P.paint(g, B.compile(nd.frame));
      g.restore();
    });
    return sc;
  }

  // The sentence the door shows under the picture: what is drawn, and what is not.
  function texto(sc) {
    return 'Colony: ' + sc.nodes + ' nodes · ' + sc.edificios + ' buildings · ' + sc.bots.length + ' bots with faces · sky ' + sc.cielo;
  }

  // The sentences a visitor reads under the picture (HUECO 1): every bot and building says what it is and its seal.
  function frases(sc) {
    var out = sc.bots.concat(sc.buildings).map(function (f) { return f.frame.atoms[0].r; });
    if (sc.you) { out.push(sc.you.atoms[0].r); }
    return out;
  }

  var AtlasColoniaPagina = { ANCHO: ANCHO, ALTO: ALTO, scene: scene, draw: draw, geometry: geometry, SQUASH: SQUASH, nodeAt: nodeAt, anchorOf: anchorOf, texto: texto, frases: frases, botFrame: botFrame, youFrame: youFrame, hash: hash };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasColoniaPagina; }
  else { root.AtlasColoniaPagina = AtlasColoniaPagina; }
})(typeof globalThis === 'object' ? globalThis : this);
