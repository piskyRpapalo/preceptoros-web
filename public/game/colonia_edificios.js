// Buildings and birth growth (ODD isometric-colony, IC4/M2). Pure: no random numbers, no clock reads, no I/O.
// Every building is an Acho-native hexagonal prism. T2 mana changes height only; absent or invalid data keeps the
// measured floor height and carries NO_DATA with its cause. Width never depends on mana.
// Units are not drawn here: IC4 is buildings only, and a unit needs its own slice.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var F = common ? require('./state_frames.js') : root.AtlasStateFrames;
  var proyecta = common ? require('./hex_projection.js') : root.HexProjection;

  var BOX = [120, 110];              // one building's Acho box, in its own units
  var BASE = [60, 84];               // where a building stands on its module
  var H0 = 27, K = 0.325, MANA_MAX = 100; // NORTE7-T2, derived and recorded in atlas/fixtures/constantes.json
  var LIGHT = [-0.35, -0.94];        // Acho canon light vector; do not override the renderer's signed default
  var PASOS = 6;                     // birth frames, from the first sprout to the whole building
  var ESCALA = 2;                    // the axial step is 48 x 24 units; a module is 100 wide, so the scene is spaced by 2
  var MODULOS = ['vermilion.base', 'comic yellow.base', 'ocean', 'cyan', 'paper', 'ink'];
  var FORMAS = ['hex-prism'];        // retained as the catalog API; former hash-picked dome/tower/block art is retired

  // FNV-1a over the id: modules keep their stable house-band colour.
  function hash(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  function fail(causa) { throw new Error('colonia_edificios: ' + causa); }

  // The module colour of a node comes from its id, never from a clock.
  function colorDe(id) { return MODULOS[hash('module:' + id) % MODULOS.length]; }
  function formaDe() { return 'hex-prism'; }

  // NORTE7-T2-ALTURA-LOG: h(mana) = h0 * (1 + k * ln(1 + mana)); invalid data never invents a measure.
  function altura(mana) {
    if (mana === null || mana === undefined) { return { h: H0, estado: 'NO_DATA', causa: 'no mana measurement declared' }; }
    if (!Number.isInteger(mana) || mana < 0 || mana > MANA_MAX) {
      return { h: H0, estado: 'NO_DATA', causa: 'mana outside integer range 0-' + MANA_MAX };
    }
    return { h: H0 * (1 + K * Math.log(1 + mana)), estado: 'MEDIDO', causa: null };
  }

  // The hex module: a flat hexagon squashed by the iso angle, centred on the box base.
  // Each corner is given twice: the Acho smoothing rounds a corner less when its point is doubled, so the hex keeps its edges.
  function moduloPts() {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var q = [Math.round(BASE[0] + 50 * Math.cos(i * Math.PI / 3)), Math.round(BASE[1] + 24 * Math.sin(i * Math.PI / 3))];
      pts.push(q, q);
    }
    return pts;
  }

  function doubled(pts) {
    return pts.reduce(function (acc, q) { acc.push(q, q); return acc; }, []);
  }

  // A prism has the same six-corner footprint at its floor and roof. Only the roof y changes with measured height.
  function prismItems(height) {
    var floor = [];
    for (var i = 0; i < 6; i++) {
      floor.push([Math.round(BASE[0] + 50 * Math.cos(i * Math.PI / 3)), Math.round(BASE[1] + 24 * Math.sin(i * Math.PI / 3))]);
    }
    var roof = floor.map(function (q) { return [q[0], q[1] - height]; });
    var items = [];
    // The three lower-facing sides are the visible walls in this fixed axonometric view; all are native Acho ribbons.
    for (var edge = 0; edge < 3; edge++) {
      var next = edge + 1;
      items.push({ o: 'ribbon', pts: doubled([roof[edge], roof[next], floor[next], floor[edge]]), closed: true,
        f: sideBand(floor[edge], floor[next]), s: 'ink', lw: 2 });
    }
    // Roof is painted last so the six edges remain legible after the walls.
    items.push({ o: 'ribbon', pts: doubled(roof), closed: true, f: 'paper', s: 'ink', lw: 2 });
    return items;
  }

  // The declared light points up-left. Projected side normals facing farther away use ink; the other visible sides use ocean.
  function sideBand(a, b) {
    var nx = b[1] - a[1], ny = a[0] - b[0];
    return nx * LIGHT[0] + ny * LIGHT[1] < -36 ? 'ink' : 'ocean';
  }

  // The frame of one building at growth p. Its sentence says what is drawn and how far it has grown; no value is invented.
  // The module under it is drawn by its own tile frame, so the colour is never drawn twice.
  function marcoEdificio(edificio, p, paso, seal) {
    var measured = altura(edificio.mana), h = Math.round(measured.h * p);
    var causa = measured.causa ? ' · NO_DATA height: ' + measured.causa : ' · mana ' + edificio.mana + ' MEDIDO';
    var frase = edificio.id + ' on ' + edificio.node + ' · hex-prism · h=' + h + 'px' + causa + ' · ' + paso + '/' + PASOS + ' · seal ' + (seal || 'NO_DATA');
    return {
      v: 'preceptoros.acho/1', id: edificio.id, t: paso, cv: BOX, seal: seal || 'NO_DATA',
      light: LIGHT,
      atoms: [{ k: 'building.hex-prism', r: frase, i: prismItems(h) }],
      bands: ['paper', 'ink', 'cyan', 'ocean'],
      change: ['height'],
      sound: 'NO_DATA: buildings declare no waves; nothing is invented',
      soundCause: 'no harmonic table declared'
    };
  }

  // The hex module of a node, drawn at its projected place. The frame names the node and its colour.
  function marcoModulo(node) {
    var frase = 'module ' + node.id + ' · colour ' + colorDe(node.id);
    return {
      v: 'preceptoros.acho/1', id: node.id, t: 0, cv: BOX,
      atoms: [{ k: 'module.' + node.id, r: frase, i: [{ o: 'ribbon', pts: moduloPts(), closed: true, f: colorDe(node.id), s: 'ink', lw: 2 }] }],
      bands: ['paper', 'ink', 'cyan'],
      change: [frase],
      sound: 'NO_DATA: modules declare no waves; nothing is invented',
      soundCause: 'a module has no measured value in this slice'
    };
  }

  // scene(colonia, p, reducido) → the scene: one tile per node and one building frame per building, placed on the
  // hex projection (x, y in the reference units). p is the growth of every building; reducido makes it 1 at once.
  function scene(colonia, p, reducido, seals, manaByNode) {
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
      var frame = marcoEdificio({ id: b.id, node: b.node, mana: manaByNode && manaByNode[b.node] }, g, paso, seals ? seals[b.node] : undefined);
      var frameProblems = F.valida(frame);
      if (frameProblems.length) { fail('building frame of ' + b.id + ' breaks the frame law: ' + frameProblems.join('; ')); }
      return Object.freeze({ id: b.id, node: b.node, forma: formaDe(), altura: altura(manaByNode && manaByNode[b.node]), x: pos[b.node].x * ESCALA, y: pos[b.node].y * ESCALA, paso: paso, frame: frame });
    });
    // back to front: a building further down the screen is drawn over the ones behind it.
    buildings.sort(function (a, b) { return a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    return Object.freeze({ tiles: Object.freeze(tiles), buildings: Object.freeze(buildings), p: g, paso: paso, pasos: PASOS });
  }

  // nacimiento(colonia, reducido) → the birth frames of every building, one scene per growth step, in order.
  // reducido gives one scene only: the building arrives whole.
  function nacimiento(colonia, reducido, seals, manaByNode) {
    if (reducido === true) { return [scene(colonia, 1, true, seals, manaByNode)]; }
    var out = [];
    for (var k = 1; k <= PASOS; k++) { out.push(scene(colonia, k / PASOS, false, seals, manaByNode)); }
    return out;
  }

  var AtlasEdificios = {
    PASOS: PASOS, MODULOS: MODULOS, FORMAS: FORMAS, H0: H0, K: K,
    hash: hash, colorDe: colorDe, formaDe: formaDe, altura: altura, scene: scene, nacimiento: nacimiento
  };
  if (common) { module.exports = AtlasEdificios; }
  else { root.AtlasEdificios = AtlasEdificios; }
})(this);
