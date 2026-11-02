// Free walk (odd/tasks/mapa-25d-aldea.md): the visitor's crab walks the baked 2.5D floor one cell at a time, not only
// node to node. Pure core: the cells come from AtlasMapPainter.world(); no Math.random, no clock, no network.
// A step onto water, a keepout cell or a cell that is not loaded is refused with its cause (NO_DATA), and nothing moves.
(function (root) {
  'use strict';
  var DIRS = {
    east: [1, 0], 'north-east': [1, -1], 'north-west': [0, -1],
    west: [-1, 0], 'south-west': [-1, 1], 'south-east': [0, 1]
  };
  var BANDS = ['water', 'sand', 'moss', 'rock'];
  function band(cell) { return cell[3] === 'water' ? 'water' : cell[3] === 'keepout' ? 'keepout' : BANDS[Math.max(1, Math.min(3, cell[2]))]; }

  // create(cells, start) → a walker over cells ({ at: { 'q,r': [q, r, h, kind] } }), at start (default the cabin, 0,0).
  function create(cells, start) {
    var at = (cells && cells.at) || {}, q = start ? start[0] : 0, r = start ? start[1] : 0, steps = 0;
    function here() {
      var c = at[q + ',' + r];
      return { q: q, r: r, kind: c ? band(c) : 'NO_DATA', h: c && c[3] !== 'water' ? c[2] : 0, steps: steps };
    }
    function step(dir) {
      var d = DIRS[dir], out;
      if (!d) { out = here(); out.ok = false; out.sentence = 'NO_DATA: unknown direction ' + JSON.stringify(dir); return out; }
      var nq = q + d[0], nr = r + d[1], c = at[nq + ',' + nr];
      var cause = !c ? 'the map ends' : c[3] === 'water' ? 'water blocks' : c[3] === 'keepout' ? 'a keepout cell blocks' : '';
      if (cause) { out = here(); out.ok = false; out.sentence = 'NO_DATA: ' + cause + ' the way ' + dir; return out; }
      q = nq; r = nr; steps++;
      out = here(); out.ok = true;
      out.sentence = 'You walk ' + dir + ' to ' + q + ',' + r + ' · ' + out.kind + ' · step ' + steps;
      return out;
    }
    return { step: step, here: here };
  }

  var api = { DIRS: DIRS, create: create, band: band };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasVisitorWalk = api; }
})(typeof globalThis === 'object' ? globalThis : this);
