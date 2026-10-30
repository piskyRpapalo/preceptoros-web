// DE-1 · deterministic scenery relocation. Pure: no random source, clock, network, or persistence.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var F = common ? require('./state_frames.js') : root.AtlasStateFrames;
  var VERSION = 'preceptoros.decor-move/1';

  function fail(cause) { throw new Error('decor_mover: ' + cause); }
  function keysAre(value, names) {
    return value && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).sort().join(',') === names.slice().sort().join(',');
  }
  function cell(q, r) { return Number.isSafeInteger(q) && Number.isSafeInteger(r); }
  function coordKey(q, r) { return q + ',' + r; }

  // Bind only the nodes already exposed by the measured colony reader. The public verb
  // then keeps the planned MOVER(prop, destination, seed) signature.
  function inColony(nodes) {
    if (!Array.isArray(nodes) || !nodes.length) { fail('measured colony nodes are required'); }
    var ids = Object.create(null), cells = Object.create(null);
    nodes.forEach(function (node) {
      if (!keysAre(node, ['id', 'q', 'r']) || typeof node.id !== 'string' || !node.id || !cell(node.q, node.r)) {
        fail('colony node is malformed');
      }
      var xy = coordKey(node.q, node.r);
      if (ids[node.id] || cells[xy]) { fail('repeated colony id or cell'); }
      ids[node.id] = true;
      cells[xy] = true;
    });

    return function MOVER(prop, destination, seed) {
      if (!keysAre(destination, ['q', 'r']) || typeof destination.q !== 'number' ||
          typeof destination.r !== 'number' || !Number.isFinite(destination.q) || !Number.isFinite(destination.r)) {
        fail('destination must be finite');
      }
      if (!cell(destination.q, destination.r)) { fail('destination must be an axial integer cell'); }
      if (!cells[coordKey(destination.q, destination.r)]) { fail('destination is outside the measured colony'); }
      if (!Number.isSafeInteger(seed) || seed < 0) { fail('seed must be a non-negative safe integer'); }

      var props = Array.isArray(prop) ? prop : [prop];
      if (!props.length) { fail('at least one prop is required'); }
      var propIds = Object.create(null), moves = [], frames = [];
      props.forEach(function (item) {
        if (!keysAre(item, ['id', 'q', 'r']) || typeof item.id !== 'string' || !item.id || !cell(item.q, item.r)) {
          fail('prop needs id and integer source cell');
        }
        if (propIds[item.id]) { fail('repeated prop id'); }
        propIds[item.id] = true;
        if (!cells[coordKey(item.q, item.r)]) { fail('prop source is outside the measured colony'); }
        var sentence = item.id + ' moves to axial cell ' + destination.q + ',' + destination.r + ' · seed ' + seed;
        var frame = F.stateFrame({ id: item.id, sentence: sentence });
        frame.seal = 'SIMULATED';
        if (F.valida(frame).length) { fail('movement frame reaches or breaks the Bubble/1 law'); }
        moves.push({ id: item.id, from: { q: item.q, r: item.r }, to: { q: destination.q, r: destination.r } });
        frames.push(frame);
      });
      var script = {
        schema: VERSION,
        seed: seed,
        moves: moves,
        frames: frames
      };
      if (new TextEncoder().encode(JSON.stringify(script)).length >= 16384) { fail('movement script is too large'); }
      return script;
    };
  }

  var API = { VERSION: VERSION, inColony: inColony };
  if (common) { module.exports = API; }
  else { root.AtlasDecorMover = API; }
})(typeof globalThis === 'object' ? globalThis : this);
