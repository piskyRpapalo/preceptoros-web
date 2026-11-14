// Land art (BEAUTY-02, 2026-11-14): the one flat floor (Sovereign, 2026-11-14) gains places without losing its calm.
// Called by map_chunks.js shadow() for every cell while a chunk is baked; projection only, no state, no chance, no clock.
// - A district (the land around one of the node's own buildings) gets a firm edge where it meets other land.
// - Each district tone wears its own small mark (dots, ring, hatch, wave), so colour is never the only cue.
// - The open floor varies a touch from stone to stone (seeded by q, r) and a few stones carry a small wave, the house line.
(function (root) {
  'use strict';
  var MOTIF = { 'LIVE.base': 'dots', 'FIRMADO.base': 'ring', 'PROPUESTA.base': 'hatch', cyan: 'wave' };
  function seed(q, r) { var x = (Math.imul(q, 374761393) ^ Math.imul(r, 668265263) ^ 20261114) >>> 0; x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0; return (x ^ (x >>> 16)) >>> 0; }
  function wave(g, x, y, s) { g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s / 2, y - s * 0.55, x, y); g.quadraticCurveTo(x + s / 2, y + s * 0.55, x + s, y); g.stroke(); }
  function motif(g, kind, x, y, s) {
    if (kind === 'dots') { [[-0.55, -0.1], [0.5, -0.1], [0, 0.32]].forEach(function (d) { g.beginPath(); g.arc(x + d[0] * s, y + d[1] * s, s * 0.13, 0, 6.283); g.fill(); }); }
    else if (kind === 'ring') { g.beginPath(); g.arc(x, y, s * 0.36, 0, 6.283); g.stroke(); }
    else if (kind === 'hatch') { [-0.3, 0.3].forEach(function (d) { g.beginPath(); g.moveTo(x + (d - 0.25) * s, y + 0.2 * s); g.lineTo(x + (d + 0.25) * s, y - 0.2 * s); g.stroke(); }); }
    else { wave(g, x, y, s * 0.55); }
  }
  // kind(c, city): what a cell is for the art: a district tone (string), the cabin (1) or open floor (undefined).
  function kindOf(city, q, r) { return city ? city[q + ',' + r] : undefined; }
  // cell(g, c, x, top, o, H, city): drawn on the cell's top face, after its fill.
  function cell(g, c, x, top, o, H, city) {
    var k = o.k || 1, corner = o.corner, here = kindOf(city, c[0], c[1]), n = seed(c[0], c[1]), F = H.T.FRONT_DOOR;
    g.save();
    if (here) {
      var rgb = H.rgbOf(F[here === 1 ? 'PROPUESTA.base' : here]), deep = H.mix(rgb, H.rgbOf(H.T.NEUTRAL.ink), 0.45);
      g.strokeStyle = H.css(H.shade(deep, o.lit)); g.lineWidth = Math.max(1.4, 2.4 * k); g.lineCap = 'round';
      for (var s = 0; s < 6; s++) { // the edge toward NB[s] runs corner[s-1] → corner[s]
        var d = H.NB[s], other = kindOf(city, c[0] + d[0], c[1] + d[1]);
        if (other === here) { continue; }
        var p0 = corner[(s + 5) % 6], p1 = corner[s];
        g.beginPath(); g.moveTo(x + p0[0], top + p0[1]); g.lineTo(x + p1[0], top + p1[1]); g.stroke();
      }
      if (here !== 1 && k >= 0.35 && n % 3 === 0) {
        g.globalAlpha = 0.55; g.fillStyle = g.strokeStyle; g.lineWidth = Math.max(0.8, 1.2 * k);
        motif(g, MOTIF[here] || 'wave', x, top, 9 * k);
      }
    } else if (o.B && o.B[1]) {
      var j = n % 5 - 2, base = o.B[1].base; // -2..2: a stone a touch darker or lighter
      if (j) { g.globalAlpha = 0.025 * Math.abs(j); g.fillStyle = j < 0 ? H.css(H.rgbOf(H.T.NEUTRAL.ink)) : H.css(H.rgbOf(H.T.NEUTRAL.paper));
        g.beginPath(); corner.forEach(function (q, i) { g[i ? 'lineTo' : 'moveTo'](x + q[0], top + q[1]); }); g.closePath(); g.fill(); }
      if (k >= 0.35 && n % 13 === 0) { g.globalAlpha = 0.5; g.strokeStyle = H.css(H.shade(base, 0.62 * o.lit)); g.lineWidth = Math.max(0.8, 1.3 * k); g.lineCap = 'round'; wave(g, x, top, 6 * k); }
    }
    g.restore();
  }
  // Buildings invite: a soft ground shadow under each of the node's buildings and a lit door on its front face. The door
  // is light, never a state: it says «a place you can enter», as the building's card already does.
  function ground(g, x, top, k, H) {
    g.save(); g.globalAlpha = 0.2; g.fillStyle = H.css(H.rgbOf(H.T.NEUTRAL.ink));
    g.beginPath(); g.ellipse(x, top + 1 * k, 15 * k, 6 * k, 0, 0, 6.283); g.fill(); g.restore();
  }
  function door(g, m, x, top, o, H) {
    var k = o.k, ring = o.corner.map(function (q) { return [q[0] * 0.5, q[1] * 0.5]; }), y0 = top - 2 * k, best = -1, bi = 0;
    for (var i = 0; i < 6; i++) { var e = ring[(i + 1) % 6], my = (ring[i][1] + e[1]) / 2; if (my > best) { best = my; bi = i; } }
    var a = ring[bi], e2 = ring[(bi + 1) % 6], dx = x + (a[0] + e2[0]) / 2, dy = y0 + best, w = 3.2 * k, h = 8 * k;
    var lamp = H.mix(H.rgbOf(H.T.NEUTRAL.paper), H.rgbOf(H.T.FRONT_DOOR['PROPUESTA.base']), 0.55);
    g.save(); g.fillStyle = H.css(H.shade(lamp, Math.max(0.85, o.lit))); g.strokeStyle = H.css(H.rgbOf(H.T.NEUTRAL.ink)); g.lineWidth = Math.max(0.8, 1.3 * k);
    g.beginPath(); g.moveTo(dx - w, dy); g.lineTo(dx - w, dy - h + w); g.arc(dx, dy - h + w, w, Math.PI, 0); g.lineTo(dx + w, dy); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  var MC = root.AtlasMapChunks;
  if (MC && MC.building && !MC.building.landArt) {
    var plain = MC.building;
    MC.building = function (g, m, x, top, o, H) { var big = o.k * 48 > 12; if (big) { ground(g, x, top, o.k, H); } plain(g, m, x, top, o, H); if (big) { door(g, m, x, top, o, H); } };
    MC.building.landArt = true;
  }
  var api = { cell: cell, seed: seed, MOTIF: MOTIF, door: door };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasLandArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
