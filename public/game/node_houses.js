// Every node its own house on the one floor (Sovereign 2026-11-24: Beelink, Tank 3 and the Doogee S110, each with its
// crab and its building; S stays the main one). The gateway's /api/world-state already lists each building with its node
// (colonia.buildings, persisted in D1); a building stands on its node's cell (colony_buildings.js does the same). This
// file only draws what that list says: a house in the map's own building canon (map_chunks.building, cone roof, cyan),
// over the cell of a LIVE node. A node that talks (Node 0) or has a published principal building keeps the town hall
// (node_beacon.js) and gets no second house: S is the only tower. No data, no house: never a placeholder.
(function (root) {
  'use strict';
  var doc = root.document, NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]], houses = [];
  // pick(detail, talks) → [{ id, node, q, r }]: one house per building of a LIVE node that is not drawn as the hall. Pure.
  function pick(d, talks) {
    if (!d || !d.ok || !Array.isArray(d.nodes) || !Array.isArray(d.buildings)) { return []; }
    var at = {}, halls = {}; (d.principalBuildings || []).forEach(function (b) { if (b && b.node) { halls[b.node] = true; } });
    d.nodes.forEach(function (n) { if (n && n.alive === true && n.seal === 'LIVE' && Number.isSafeInteger(n.q) && Number.isSafeInteger(n.r) && !(talks && talks[n.id]) && !halls[n.id]) { at[n.id] = n; } });
    var seen = {};
    return d.buildings.filter(function (b) { return b && typeof b.id === 'string' && at[b.node] && !seen[b.node] && (seen[b.node] = true); })
      .map(function (b) { return { id: b.id, node: b.node, q: at[b.node].q, r: at[b.node].r }; });
  }
  function paint() {
    var MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(), LM = root.AtlasMapChunks || root.AtlasLandmarks, s = doc.getElementById('surface');
    if (!houses.length || !V || !s || !LM || !LM.building) { return; }
    var g = s.getContext('2d'), k = V.G.k, turn = V.turn;
    var corner = NB.map(function (d, i) { var e = NB[(i + 1) % 6], p = V.P(d[0] + e[0], d[1] + e[1]), r = turn(p.x, p.y); return [r.x / 3 * k, r.y / 3 * k]; });
    var o = { k: k * 1.3, corner: corner.map(function (q) { return [q[0] * 1.3, q[1] * 1.3]; }), lit: 1 }; // the big node building: 1.3× with a spire (Sovereign 2026-11-24: node = big, a visitor's conquest = white «html»)
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.lineJoin = 'round';
    houses.forEach(function (h) {
      var c = V.world.cells.at[h.q + ',' + h.r], h0 = V.P(h.q, h.r), p = turn(h0.x, h0.y);
      var x = V.G.cx + p.x * k, top = V.G.cy + p.y * k - (c ? V.height(c) * V.HSTEP : 0) * k;
      if (x < -60 || x > s.width + 60 || top < -80 || top > s.height + 80) { return; }
      LM.building(g, { id: h.id, tone: 'cyan', roof: 'spire' }, x, top, o, V.H);
    });
    g.restore();
  }
  if (doc) {
    var hook = function () { var s = doc.getElementById('surface'); if (s && !s.dataset.nh) { s.dataset.nh = '1'; s.addEventListener('visitor:draw', paint); } };
    var take = function (d) { var B = root.AtlasNodeBeacon; houses = pick(d, B ? B.TALKS : { 'primer-ancla': 1 }); var v = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (v && v.redraw) { v.redraw(); } };
    doc.addEventListener('world:nodes', function (ev) { hook(); take(ev.detail); });
    var O = root.AtlasOnlineNodes; if (O && O.last) { hook(); take(O.last); } /* loaded late by gamepad.js: the last world:nodes online_nodes kept */
    hook(); if (root.MutationObserver && doc.body) { new root.MutationObserver(hook).observe(doc.body, { childList: true }); }
  }
  var api = { pick: pick, houses: function () { return houses.slice(); } };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasNodeHouses = api;
})(typeof window !== 'undefined' ? window : globalThis);
