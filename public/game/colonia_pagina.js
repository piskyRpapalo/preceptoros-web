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
  var RONDA = [0, 1, 2, 1];                   // one bob cycle, whole numbers only

  function hash(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // The bot: a body, two eyes and a mouth, all bubble ribbons. The face says the state, not a feeling.
  function cuerpoPts(r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      pts.push([Math.round(r * Math.cos(i * Math.PI / 5)), Math.round(r * 0.9 * Math.sin(i * Math.PI / 5))]);
    }
    return pts;
  }
  function botFrame(node, t, reducido) {
    var dy = reducido === true ? 0 : RONDA[((t % 4) + 4) % 4];
    var frase = 'bot of ' + node.id + ' · face · tick ' + t + (reducido === true ? ' · still (reduced motion)' : '');
    var cuerpo = cuerpoPts(9).map(function (q) { return [q[0] + BX, q[1] + BY - 14 - dy]; });
    return {
      v: 'preceptoros.bubble/1', id: 'bot-' + node.id, t: t, cv: [120, 110],
      atoms: [{ k: 'bot.' + node.id, r: frase, i: [
        { o: 'ribbon', pts: cuerpo, closed: true, f: 'paper', s: 'ink', lw: 2 },
        { o: 'ribbon', pts: [[BX - 4, BY - 18 - dy], [BX - 2, BY - 16 - dy], [BX - 4, BY - 14 - dy]], closed: true, f: 'ink', s: 'ink', lw: 1 },
        { o: 'ribbon', pts: [[BX + 4, BY - 18 - dy], [BX + 6, BY - 16 - dy], [BX + 4, BY - 14 - dy]], closed: true, f: 'ink', s: 'ink', lw: 1 },
        { o: 'ribbon', pts: [[BX - 4, BY - 10 - dy], [BX, BY - 8 - dy], [BX + 4, BY - 10 - dy]], closed: false, f: 'ink', s: 'ink', lw: 1 }
      ] }],
      bands: ['paper', 'ink', 'cyan'],
      change: [frase],
      sound: 'NO_DATA: bots declare no waves; nothing is invented',
      soundCause: 'a bot has no measured value in this slice'
    };
  }

  // The colony as it is drawn: validated state in, scene out. Throws on any invalid state (no invented row).
  function scene(estado, t, reducido) {
    var validar = root.AtlasColonyState || root.colony;   // the browser: colony_state.js is a classic script, so colony is global
    var colonia = validar(estado);
    var AE = root.AtlasEdificios, PC = root.AtlasPaletteCycle;
    var sc = AE.scene(colonia, 1, reducido === true);
    var cielo = PC.palette(t, reducido === true).cielo;
    // One bot per live node, beside the node's hex (IC7-S3). Buildings are drawn separately, as before.
    var bots = sc.tiles.map(function (n) {
      return { id: 'bot-' + n.id, x: n.x + BOT_DX * ESCALA_SALA, y: n.y + BOT_DY * ESCALA_SALA, frame: botFrame({ id: n.id }, t, reducido === true) };
    });
    return { tiles: sc.tiles, buildings: sc.buildings, bots: bots, cielo: cielo, nodes: colonia.nodes.length, edificios: colonia.buildings.length };
  }
  var ESCALA_SALA = 2;   // the same spacing as the core: the scene is placed at twice the axial positions

  // draw(canvas, estado, t, reducido) → the scene drawn on canvas, with the sky of its tick under it.
  function draw(canvas, estado, t, reducido) {
    var B = root.AtlasBubble, P = root.AtlasComicAtoms;
    var sc = scene(estado, t, reducido);
    var g = canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = sc.cielo; g.fillRect(0, 0, canvas.width, canvas.height);
    var cx = canvas.width / 2, cy = canvas.height / 2;
    sc.tiles.concat(sc.buildings, sc.bots).forEach(function (nd) {
      g.save();
      g.translate(cx + nd.x * K - BX * S, cy + nd.y * K - BY * S);
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

  var AtlasColoniaPagina = { ANCHO: ANCHO, ALTO: ALTO, scene: scene, draw: draw, texto: texto, botFrame: botFrame, hash: hash };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasColoniaPagina; }
  else { root.AtlasColoniaPagina = AtlasColoniaPagina; }
})(typeof globalThis === 'object' ? globalThis : this);
