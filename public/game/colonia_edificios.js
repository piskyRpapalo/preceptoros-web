// Buildings and birth growth (ODD isometric-colony, IC4). Pure: no random numbers, no clock reads, no I/O.
// The input is a colony from colony_state.js. Every node is a hex module, coloured from a hash of its id (the same
// colour every run). Every building is a bubble-language frame, its shape chosen by a hash of its id. The growth
// progress p (0 to 1) scales the building from its base; reduced motion arrives in one step, p = 1.
// Units are not drawn here: IC4 is buildings only, and a unit needs its own slice.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var F = common ? require('./state_frames.js') : root.AtlasStateFrames;
  var proyecta = common ? require('./hex_projection.js') : root.HexProjection;

  var BOX = [120, 110];              // one building's bubble box, in its own units
  var BASE = [60, 84];               // where a building stands on its module
  var PASOS = 6;                     // birth frames, from the first sprout to the whole building
  var ESCALA = 2;                    // the axial step is 48 x 24 units; a module is 100 wide, so the scene is spaced by 2
  var MODULOS = ['vermilion.base', 'comic yellow.base', 'ocean', 'cyan', 'paper', 'ink'];
  var FORMAS = ['dome', 'tower', 'block'];

  // FNV-1a over the id: the same id gives the same number in every run and in every browser.
  function hash(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  function fail(causa) { throw new Error('colonia_edificios: ' + causa); }

  // The module colour of a node, and the shape of a building: both from the id, never from a clock.
  function colorDe(id) { return MODULOS[hash('module:' + id) % MODULOS.length]; }
  function formaDe(id) { return FORMAS[hash('building:' + id) % FORMAS.length]; }

  // The hex module: a flat hexagon squashed by the iso angle, centred on the box base.
  // Each corner is given twice: the bubble smoothing rounds a corner less when its point is doubled, so the hex keeps its edges.
  function moduloPts() {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var q = [Math.round(BASE[0] + 50 * Math.cos(i * Math.PI / 3)), Math.round(BASE[1] + 24 * Math.sin(i * Math.PI / 3))];
      pts.push(q, q);
    }
    return pts;
  }

  // The outline of a shape at full growth, in box units. Growth scales each point toward BASE.
  function contorno(forma) {
    var cx = BASE[0], cy = BASE[1], pts = [];
    if (forma === 'dome') {
      for (var a = Math.PI; a >= 0; a -= Math.PI / 8) { pts.push([Math.round(cx + 22 * Math.cos(a)), Math.round(cy - 6 - 22 * Math.sin(a))]); }
      pts.push([cx + 22, cy - 6], [cx - 22, cy - 6]);
    } else if (forma === 'tower') {
      pts = [[cx - 12, cy - 6], [cx + 12, cy - 6], [cx + 12, cy - 46], [cx - 12, cy - 46]];
    } else {
      pts = [[cx - 20, cy - 26], [cx, cy - 36], [cx + 20, cy - 26], [cx + 20, cy - 6], [cx, cy + 4], [cx - 20, cy - 6]];
    }
    return pts.reduce(function (acc, q) { acc.push(q, q); return acc; }, []);
  }

  // Growth: a point moves from BASE toward its full place by p. p = 1 is the whole building.
  function crece(pts, p) {
    return pts.map(function (q) { return [Math.round(BASE[0] + (q[0] - BASE[0]) * p), Math.round(BASE[1] + (q[1] - BASE[1]) * p)]; });
  }

  // The frame of one building at growth p. Its sentence says what is drawn and how far it has grown; no value is invented.
  // The module under it is drawn by its own tile frame, so the colour is never drawn twice.
  function marcoEdificio(edificio, p, paso) {
    var forma = formaDe(edificio.id);
    var base = crece(contorno(forma), p);
    var frase = 'building ' + edificio.id + ' on ' + edificio.node + ' · ' + forma + ' · growth ' + paso + '/' + PASOS;
    var items = [{ o: 'ribbon', pts: base, closed: true, f: 'paper', s: 'ink', lw: 2 }];
    return {
      v: 'preceptoros.bubble/1', id: edificio.id, t: paso, cv: BOX,
      atoms: [{ k: 'building.' + forma, r: frase, i: items }],
      bands: ['paper', 'ink', 'cyan'],
      change: [frase],
      sound: 'NO_DATA: buildings declare no waves; nothing is invented',
      soundCause: 'a building has no measured value in this slice'
    };
  }

  // The hex module of a node, drawn at its projected place. The frame names the node and its colour.
  function marcoModulo(node) {
    var frase = 'module ' + node.id + ' · colour ' + colorDe(node.id);
    return {
      v: 'preceptoros.bubble/1', id: node.id, t: 0, cv: BOX,
      atoms: [{ k: 'module.' + node.id, r: frase, i: [{ o: 'ribbon', pts: moduloPts(), closed: true, f: colorDe(node.id), s: 'ink', lw: 2 }] }],
      bands: ['paper', 'ink', 'cyan'],
      change: [frase],
      sound: 'NO_DATA: modules declare no waves; nothing is invented',
      soundCause: 'a module has no measured value in this slice'
    };
  }

  // scene(colonia, p, reducido) → the scene: one tile per node and one building frame per building, placed on the
  // hex projection (x, y in the reference units). p is the growth of every building; reducido makes it 1 at once.
  function scene(colonia, p, reducido) {
    if (!colonia || !Array.isArray(colonia.nodes) || !Array.isArray(colonia.buildings)) { fail('a colony with nodes and buildings is required'); }
    var g = reducido === true ? 1 : Math.max(0, Math.min(1, typeof p === 'number' && isFinite(p) ? p : 1));
    var paso = Math.max(1, Math.min(PASOS, Math.ceil(g * PASOS)));
    var pos = {};
    colonia.nodes.forEach(function (n) { pos[n.id] = proyecta(n.q, n.r); });
    var tiles = colonia.nodes.map(function (n) {
      var frame = marcoModulo(n);
      if (F.valida(frame).length) { fail('module frame of ' + n.id + ' breaks the frame law'); }
      return Object.freeze({ id: n.id, q: n.q, r: n.r, x: pos[n.id].x * ESCALA, y: pos[n.id].y * ESCALA, color: colorDe(n.id), frame: frame });
    });
    var buildings = colonia.buildings.map(function (b) {
      if (!pos[b.node]) { fail('building ' + b.id + ' stands on an unknown node'); }
      var frame = marcoEdificio(b, g, paso);
      if (F.valida(frame).length) { fail('building frame of ' + b.id + ' breaks the frame law'); }
      return Object.freeze({ id: b.id, node: b.node, forma: formaDe(b.id), x: pos[b.node].x * ESCALA, y: pos[b.node].y * ESCALA, paso: paso, frame: frame });
    });
    // back to front: a building further down the screen is drawn over the ones behind it.
    buildings.sort(function (a, b) { return a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    return Object.freeze({ tiles: Object.freeze(tiles), buildings: Object.freeze(buildings), p: g, paso: paso, pasos: PASOS });
  }

  // nacimiento(colonia, reducido) → the birth frames of every building, one scene per growth step, in order.
  // reducido gives one scene only: the building arrives whole.
  function nacimiento(colonia, reducido) {
    if (reducido === true) { return [scene(colonia, 1, true)]; }
    var out = [];
    for (var k = 1; k <= PASOS; k++) { out.push(scene(colonia, k / PASOS, false)); }
    return out;
  }

  var AtlasEdificios = {
    PASOS: PASOS, MODULOS: MODULOS, FORMAS: FORMAS,
    hash: hash, colorDe: colorDe, formaDe: formaDe, scene: scene, nacimiento: nacimiento
  };
  if (common) { module.exports = AtlasEdificios; }
  else { root.AtlasEdificios = AtlasEdificios; }
})(this);
