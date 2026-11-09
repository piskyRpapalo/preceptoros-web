// The mission map on the map (Sovereign, 2026-11-09: «puntos calientes esperando»). Each of the node's own buildings
// where a mission waits wears an ember with the mission codes; a tap opens that building's card (building_sheet.js).
// The places are exact, not invented: the gaps the buildings already declare (/game/building_interiors.json: J7, L12,
// K6c, J2, K2c) plus the night tanda (odd/tasks/noche-8nov-tanda.md), each set where its interactive will live.
// One map, no duplicate: the gap board (gap_board.js) says the same gaps in words; this only points at them.
// Picture plus a tap target; no clock, no chance, no request; the rectangles live only in page memory.
(function (root) {
  'use strict';
  var WAIT = {
    'visitor-house': ['H1', 'K2c'],   // Help is the hub: the visitor's own house answers who, what and of what
    coliseum: ['A1', 'K6c'],          // the army in three parts; arenas between nodes
    doctor: ['W1'],                   // wave life: the doctor heals a wave back to full
    agora: ['E1', 'J2'],              // the online chat (gated by Q-L1); connect your own AI
    choir: ['R1'],                    // the radio on top: sound and voice commands
    workshop: ['S1', 'L12', 'RS1'],   // the settings that serve; the agenda board; the Rust workspace
    customs: ['N1', 'J7']             // the node refresh at the border; your place has a measure
  }, hits = [];
  // Pure: spots(markList) → the node's buildings with missions waiting, one per kind, never a fogged NPC.
  function spots(list) {
    var seen = {};
    return (list || []).filter(function (m) {
      if (!m || m.fog || !WAIT[m.id] || seen[m.id]) { return false; }
      seen[m.id] = true; return true;
    }).map(function (m) { return { m: m, codes: WAIT[m.id].slice() }; });
  }
  // draw(g, V, dpr): called by map_aura.js on every map frame, after the names.
  function draw(g, V, dpr) {
    hits = []; if (!V || !V.world || !V.H) { return hits; }
    var k = V.G.k, ink = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.ink)), paper = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.paper));
    var hot = V.H.css(V.H.rgbOf(V.H.T.FRONT_DOOR['PROPUESTA.base'])), fs = Math.round(12 * dpr);
    g.save(); g.font = '800 ' + fs + 'px ui-rounded, system-ui, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    spots(V.world.markList).forEach(function (s) {
      var m = s.m, cell = V.world.cells.at[m.q + ',' + m.r], h0 = V.P(m.q, m.r), p = V.turn(h0.x, h0.y);
      var x = V.G.cx + p.x * k + 22 * k, y = V.G.cy + p.y * k - (cell ? V.height(cell) * V.HSTEP : 0) * k - 6 * k;
      var t = s.codes.join(' '), r = Math.max(7 * dpr, 9 * k), tw = g.measureText(t).width, w = r * 2 + tw + 10 * dpr, h = r * 2 + 4 * dpr;
      g.fillStyle = paper; g.strokeStyle = ink; g.lineWidth = Math.max(1.5, 2 * dpr);
      g.beginPath(); g.moveTo(x + h / 2, y - h / 2); g.arc(x + w - h / 2, y, h / 2, -Math.PI / 2, Math.PI / 2);
      g.arc(x + h / 2, y, h / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = hot; g.beginPath(); g.arc(x + h / 2, y, r * 0.72, 0, 2 * Math.PI); g.fill(); g.stroke(); // the ember
      g.fillStyle = ink; g.fillText(t, x + h / 2 + r + 2 * dpr, y + 0.5 * dpr);
      var pad = Math.max(0, 44 * dpr - h) / 2;   // a 44 px tap target, whatever the drawing size
      hits.push({ m: m, codes: s.codes, x0: x - pad, x1: x + Math.max(w, 44 * dpr) + pad, y0: y - h / 2 - pad, y1: y + h / 2 + pad });
    });
    g.restore(); return hits;
  }
  function hitAt(px, py) { for (var i = 0; i < hits.length; i++) { var h = hits[i]; if (px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) { return h; } } return null; }
  function listen(doc) {
    var sf = doc.getElementById && doc.getElementById('surface');
    if (!sf) { return; }
    sf.addEventListener('click', function (e) {
      var r = sf.getBoundingClientRect(), h = r.width ? hitAt((e.clientX - r.left) * (sf.width / r.width), (e.clientY - r.top) * (sf.height / r.height)) : null;
      var BS = root.AtlasBuildingSheet;
      if (!h || !BS || !BS.open || !BS.open(h.m.id)) { return; }
      e.stopImmediatePropagation();
      if (root.AtlasMapAura) { root.AtlasMapAura.select(doc, sf, h.m.q + ',' + h.m.r); }
      var sh = doc.getElementById('building-sheet'), old = sh && sh.querySelector('.mission-wait');
      if (old) { old.remove(); }
      if (sh) { var p = doc.createElement('p'); p.className = 'mission-wait'; p.setAttribute('role', 'status'); p.textContent = 'Missions waiting here: ' + h.codes.join(', ') + '. Each one is built first, then signed.'; sh.appendChild(p); }
    }, true);
  }
  var api = { WAIT: WAIT, spots: spots, draw: draw, hitAt: hitAt };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasMissionHotspots = api;
  if (root.document && root.document.getElementById) {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { listen(root.document); }); } else { listen(root.document); }
  }
})(globalThis);
