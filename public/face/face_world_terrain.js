(function (root) {
  'use strict';
  var World = typeof module === 'object' && module.exports ? require('./face_world.js') : root.PreceptorWorld;
  var V = World.V, worldSize = World.worldSize, iso = World.iso, uniq = World.uniq;

  var isles = [
    { id: 'home', x: 500, y: 700, rx: 124, ry: 92, kind: 'sand' },
    { id: 'beacon', x: 300, y: 456, rx: 76, ry: 62, kind: 'sand' },
    { id: 'reef', x: 724, y: 428, rx: 92, ry: 74, kind: 'sand' },
    { id: 'rift', x: 486, y: 190, rx: 116, ry: 72, kind: 'rock' },
    { id: 'west', x: 196, y: 762, rx: 60, ry: 48, kind: 'forest' },
    { id: 'east', x: 824, y: 758, rx: 62, ry: 50, kind: 'rock' },
    { id: 'peak', x: 168, y: 230, rx: 84, ry: 64, kind: 'rock' },
    { id: 'wood', x: 820, y: 168, rx: 64, ry: 52, kind: 'forest' },
    { id: 'islet', x: 640, y: 588, rx: 40, ry: 30, kind: 'sand' }
  ];

  function islandItems(list, skin) {
    var out = [];
    list.forEach(function (s) {
      var top = s.kind === 'rock' ? skin.rock : s.kind === 'forest' ? skin.forest : skin.sand;
      out.push({ o: 'blob', x: s.x + 9, y: s.y + 9, rx: s.rx, ry: s.ry, seed: s.id, rough: 0.7, f: skin.cliff });
      out.push({ o: 'blob', x: s.x, y: s.y, rx: s.rx, ry: s.ry, seed: s.id, rough: 0.7, f: top });
    });
    return out;
  }

  function seaFrame(skin) {
    return { v: V, id: 'sea', t: 0, cv: [worldSize, worldSize], atoms: [
      { k: 'shelves', r: 'shelves on the shared seabed', i: isles.map(function (q) { return { o: 'blob', x: q.x + 4, y: q.y + 4, rx: Math.round(q.rx * 1.38), ry: Math.round(q.ry * 1.38), f: skin.shelf }; }) }],
      bands: [skin.shelf], change: ['rest'], sound: 'NO_DATA', soundCause: 'the sea is silent', motion: 'NO_DATA' };
  }

  var groups = [['home', 'beacon'], ['reef', 'rift'], ['west', 'east', 'peak'], ['wood', 'islet']];
  var groupNames = ['home and the beacon', 'the Reef and the rift', 'the west node, the east node and the peak', 'the wood and an islet'];

  function islesFrame(skin, part) {
    var list = isles.filter(function (s) { return groups[part].indexOf(s.id) >= 0; }), extra = [];
    var atoms = [{ k: 'isles', r: groupNames[part], i: islandItems(list, skin) }];
    if (part === 1) { atoms.push({ k: 'chasm', r: 'the rift opens', i: [{ o: 'ribbon', pts: [[420, 196], [486, 168], [552, 194], [486, 214]], closed: true, f: 'ink' }] }); extra = ['ink']; }
    if (part === 1) { atoms.push({ k: 'coral', r: 'coral of the Reef', i: [{ o: 'field', kind: 'phyllo', x: 724, y: 428, n: 30, c: 10, r: 8, f: skin.coral }] }); extra.push(skin.coral); }
    if (part === 3) { atoms.push({ k: 'woods', r: 'trees', i: [
      { o: 'field', kind: 'phyllo', x: 196, y: 760, n: 22, c: 9, r: 9, f: skin.leaf },
      { o: 'field', kind: 'phyllo', x: 820, y: 166, n: 26, c: 9, r: 9, f: skin.leaf }] }); extra = [skin.leaf]; }
    return { v: V, id: 'isles' + part, t: 0, cv: [worldSize, worldSize], atoms: atoms,
      bands: uniq([skin.cliff].concat(list.map(function (q) { return q.kind === 'rock' ? skin.rock : q.kind === 'forest' ? skin.forest : skin.sand; }), extra)), change: ['rest'], sound: 'NO_DATA', soundCause: 'the islands are silent', motion: 'NO_DATA' };
  }

  function standFrame(skin) {
    var p1 = iso(168, 224), p2 = iso(830, 752), p3 = iso(486, 176), h = iso(500, 690), w = iso(196, 756), e = iso(824, 750), small = [[1, 14, 14, 0], [-4, 4, 4, 0]];
    return { v: V, id: 'stand', t: 0, cv: [1420, 1420], atoms: [
      { k: 'peaks', r: 'mountains on the peak, the east node and the rift', i: [
        { o: 'blob', x: p1[0] - 22, y: p1[1] - 26, rx: 34, ry: 42, seed: 'm1', rough: 0.5, f: skin.mount },
        { o: 'blob', x: p1[0] + 20, y: p1[1] - 18, rx: 26, ry: 32, seed: 'm2', rough: 0.5, f: skin.mount },
        { o: 'blob', x: p2[0], y: p2[1] - 22, rx: 26, ry: 32, seed: 'm3', rough: 0.5, f: skin.mount },
        { o: 'blob', x: p3[0] - 70, y: p3[1] - 20, rx: 24, ry: 30, seed: 'm4', rough: 0.5, f: skin.mount }] },
      { k: 'town', r: 'the home town, domes', i: [{ o: 'city', x: [h[0] - 54, h[0] + 54], y: [h[1] - 58, h[1] - 8], dome: 3 }] },
      { k: 'nodes', r: 'two other nodes, each on its island', i: [{ o: 'wave', x: w[0], y: w[1] - 30, h: small, f: skin.star }, { o: 'wave', x: e[0] + 30, y: e[1] - 30, h: small, f: skin.star }] }],
      bands: uniq([skin.mount, skin.star, 'cyan']), change: ['rest'], sound: 'NO_DATA', soundCause: 'the map is silent', motion: 'NO_DATA' };
  }

  World.isles = isles; World.groups = groups; World.seaFrame = seaFrame; World.islesFrame = islesFrame; World.standFrame = standFrame;
  if (typeof module === 'object' && module.exports) { module.exports = World; }
})(typeof module === 'object' && module.exports ? this : window);
