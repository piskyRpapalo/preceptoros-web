// Route over the visible colony nodes (unified walk map, W-2). Pure: no DOM, no clock, no random numbers, no network.
// A node is walkable only when its seal is LIVE or STALE (W-D1). A hex without a visible node is never on a route.
// Neighbours are the six axial directions, in a fixed order, so the same input always gives the same route.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;

  var STEPS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

  function visible(seals, id) { var s = (seals || {})[id]; return s === 'LIVE' || s === 'STALE'; }

  function byId(nodes, id) { return (nodes || []).filter(function (n) { return n.id === id; })[0]; }

  function adjacent(a, b) {
    var dq = b.q - a.q, dr = b.r - a.r;
    return STEPS.some(function (s) { return s[0] === dq && s[1] === dr; });
  }

  // route(nodes, seals, from, to) → { ok, path, cause }. path is the list of node ids, from first, to last.
  function route(nodes, seals, from, to) {
    var a = byId(nodes, from), b = byId(nodes, to);
    if (!a) { return { ok: false, path: [], cause: 'unknown node ' + JSON.stringify(from) }; }
    if (!b) { return { ok: false, path: [], cause: 'unknown node ' + JSON.stringify(to) }; }
    if (!visible(seals, from)) { return { ok: false, path: [], cause: 'NO_DATA: ' + from + ' is not alive' }; }
    if (!visible(seals, to)) { return { ok: false, path: [], cause: 'NO_DATA: ' + to + ' is not alive' }; }
    var prev = {}, queue = [from], seen = {};
    seen[from] = true;
    while (queue.length) {
      var cur = queue.shift();
      if (cur === to) { break; }
      var c = byId(nodes, cur);
      nodes.forEach(function (n) {
        if (seen[n.id] || !visible(seals, n.id) || !adjacent(c, n)) { return; }
        seen[n.id] = true; prev[n.id] = cur; queue.push(n.id);
      });
    }
    if (!seen[to]) { return { ok: false, path: [], cause: 'NO_DATA: ' + to + ' cannot be reached over alive nodes' }; }
    var path = [to];
    while (path[0] !== from) { path.unshift(prev[path[0]]); }
    return { ok: true, path: path, cause: '' };
  }

  // checkPath(nodes, seals, path) → { ok, cause }. Refuses any path that leaves visible nodes or jumps between hexes.
  function checkPath(nodes, seals, path) {
    if (!path || path.length < 1) { return { ok: false, cause: 'empty path' }; }
    for (var i = 0; i < path.length; i++) {
      var n = byId(nodes, path[i]);
      if (!n) { return { ok: false, cause: 'hex without a node: ' + JSON.stringify(path[i]) }; }
      if (!visible(seals, path[i])) { return { ok: false, cause: 'NO_DATA: ' + path[i] + ' is not alive' }; }
      if (i > 0 && !adjacent(byId(nodes, path[i - 1]), n)) { return { ok: false, cause: 'not adjacent: ' + path[i - 1] + ' → ' + path[i] }; }
    }
    return { ok: true, cause: '' };
  }

  var AtlasWalkRoute = { STEPS: STEPS, route: route, checkPath: checkPath, adjacent: adjacent, visible: visible };
  if (common) { module.exports = AtlasWalkRoute; }
  else { root.AtlasWalkRoute = AtlasWalkRoute; }
})(typeof globalThis === 'object' ? globalThis : this);
