// The selected building's aura (Sovereign, 2026-11-08): a building tapped on the map (map_chunks.js listen) or chosen in
// the Town list (building:enter) glows on the map while its card is open: a warm light over it and a gold ring on its
// ground that breathes outward; the camera brings it into view (the open sheet shrinks the map) and, on close, goes
// back to the crab. Projection only (canvas dataset.sel): no state, no result. Reduced motion: a steady ring.
(function (root) {
  'use strict';
  var breath = 0;
  // Pure: the breath of the outer ring at time t (ms) → { grow 0..1, alpha }. Tested in atlas/puros/map_aura_cases.mjs.
  function phase(t, still) { var p = still ? 0.5 : (t % 1600) / 1600; return { grow: p, alpha: still ? 0.55 : 0.7 * (1 - p) }; }
  function hexDist(a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // draw(g, V, s, still, oval, ow): called by map_chunks.js youLayer before the names and the crab.
  // near(): the node's buildings next to the crab (hex distance <= 1) wear their name 50 % larger, and that name answers a
  // direct tap (Sovereign, 2026-11-08, Q-01). Picture plus a tap target; the rectangles live only in page memory.
  var NAMES = { hostel: 'Hostel', coliseum: 'Coliseum', choir: 'Choir', workshop: 'Workshop', tower: 'Model tower', agora: 'Agora',
    customs: 'Customs', lottery: 'Lottery', 'visitor-house': 'Visitor house', doctor: 'Doctor' }, hits = [];
  function near(g, V, w, dpr) {
    hits = []; if (!w || !V.world.markList) { return hits; }
    var k = V.G.k, ink = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.ink)), paper = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.paper)), fs = Math.round(16.5 * dpr);
    g.save(); g.font = '800 ' + fs + 'px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    V.world.markList.forEach(function (m) {
      if (m.fog || hexDist([m.q, m.r], [w.q, w.r]) > 1) { return; }
      var cell = V.world.cells.at[m.q + ',' + m.r], h0 = V.P(m.q, m.r), p = V.turn(h0.x, h0.y), t = NAMES[m.id] || m.id;
      var x = V.G.cx + p.x * k, y = V.G.cy + p.y * k - ((cell ? V.height(cell) * V.HSTEP : 0) + (m.roof === 'spire' ? 58 : 44)) * k;
      var tw = g.measureText(t).width + 18 * dpr, th = Math.max(fs + 10 * dpr, 44 * dpr * 0.6);
      g.fillStyle = paper; g.strokeStyle = ink; g.lineWidth = Math.max(1.5, 2.2 * dpr);
      g.beginPath(); g.moveTo(x - tw / 2 + th / 2, y - th / 2); g.arc(x + tw / 2 - th / 2, y, th / 2, -Math.PI / 2, Math.PI / 2);
      g.arc(x - tw / 2 + th / 2, y, th / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = ink; g.fillText(t, x, y + 0.5 * dpr);
      hits.push({ m: m, x0: x - Math.max(tw, 44 * dpr) / 2, x1: x + Math.max(tw, 44 * dpr) / 2, y0: y - 22 * dpr, y1: y + 22 * dpr });
    });
    g.restore(); return hits;
  }
  function hitAt(px, py) { for (var i = 0; i < hits.length; i++) { var h = hits[i]; if (px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) { return h.m; } } return null; }
  function draw(g, V, s, still, oval, ow) {
    var wk = ow && ow.controls && ow.controls.walker && ow.controls.walker(); near(g, V, wk, s.width / (s.getBoundingClientRect ? (s.getBoundingClientRect().width || s.width) : s.width));
    var key = s.dataset.sel, c = key && V.world.cells.at[key];
    if (!c) { return false; }
    var q = key.split(','), h0 = V.P(+q[0], +q[1]), p = V.turn(h0.x, h0.y), k = V.G.k, sq = 0.433 * (V.G.tilt || 1), R = 30 * k;
    var x = V.G.cx + p.x * k, y = V.G.cy + p.y * k - V.height(c) * V.HSTEP * k;
    if (s.dataset.selc) {                     // once: the camera brings the building into the (smaller) map; picture only
      delete s.dataset.selc; s.dataset.look = 'aura';
      s.dataset.panx = String(Math.round((Number(s.dataset.panx) || 0) + s.width / 2 - x)); s.dataset.pany = String(Math.round((Number(s.dataset.pany) || 0) + s.height / 2 - y + 20 * k));
      if (ow && ow.redraw && root.requestAnimationFrame) { root.requestAnimationFrame(function () { ow.redraw(); }); }
    }
    var gold = V.H.rgbOf(V.H.T.FRONT_DOOR['PROPUESTA.base']);
    var tint = function (a) { return V.H.css(gold) + ('0' + Math.round(a * 255).toString(16)).slice(-2); }, P = phase(Date.now(), still), r2 = R * (1 + 0.5 * P.grow);
    g.save(); g.globalCompositeOperation = 'lighter';
    var gr = g.createRadialGradient(x, y - 24 * k, 4 * k, x, y - 24 * k, 56 * k); gr.addColorStop(0, tint(0.42)); gr.addColorStop(1, tint(0));
    g.fillStyle = gr; g.fillRect(x - 56 * k, y - 80 * k, 112 * k, 112 * k);
    g.globalCompositeOperation = 'source-over'; g.lineWidth = Math.max(2, 3.4 * k); g.strokeStyle = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.ink)); g.globalAlpha = 0.55;
    g.beginPath(); oval(g, x, y, R, R * sq, 0, 2 * Math.PI); g.stroke(); g.globalAlpha = 1; g.lineWidth = Math.max(1.5, 2.2 * k);
    g.strokeStyle = tint(0.95); g.beginPath(); oval(g, x, y, R, R * sq, 0, 2 * Math.PI); g.stroke();
    g.strokeStyle = tint(P.alpha); g.beginPath(); oval(g, x, y, r2, r2 * sq, 0, 2 * Math.PI); g.stroke();
    g.restore();
    if (!still && !breath && ow && ow.redraw) { breath = root.setTimeout(function () { breath = 0; if (s.dataset.sel) { ow.redraw(); } }, 90); }
    return true;
  }
  // select(doc, s, key): light a building (null clears it); the aura lives only while the Town sheet is open.
  function select(doc, s, key) {
    if (key) { s.dataset.sel = key; s.dataset.selc = '1'; } else { delete s.dataset.sel; if (s.dataset.look === 'aura') { delete s.dataset.look; } } // closed: the crab's camera again
    var sh = doc.getElementById('building-sheet'), ow = root.AtlasOpenworldView && root.AtlasOpenworldView();
    if (sh && !sh.dataset.aura && root.MutationObserver) {
      sh.dataset.aura = '1';
      new root.MutationObserver(function () { if (sh.hidden && s.dataset.sel) { select(doc, s, null); } }).observe(sh, { attributes: true, attributeFilter: ['hidden'] });
    }
    if (ow && ow.redraw) { ow.redraw(); }
  }
  // A card chosen in the Town list lights the nearest building of its kind (to the crab) on the map.
  function listen(doc) {
    var sf = doc.getElementById && doc.getElementById('surface');
    if (sf) {
      sf.addEventListener('click', function (e) {
        var r = sf.getBoundingClientRect(), m = r.width ? hitAt((e.clientX - r.left) * (sf.width / r.width), (e.clientY - r.top) * (sf.height / r.height)) : null;
        var BS = root.AtlasBuildingSheet;
        if (m && BS && BS.open && BS.open(m.id)) { e.stopImmediatePropagation(); select(doc, sf, m.q + ',' + m.r); }
      }, true);
    }
    doc.addEventListener('building:enter', function (e) {
      var s = doc.getElementById('surface'), MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(), MC = root.AtlasMapChunks;
      var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), w = ow && ow.controls && ow.controls.walker && ow.controls.walker();
      if (!s || !V || !e.detail || s.dataset.sel) { return; }
      if (!V.world.markList && MC && MC.landmarks) { MC.landmarks(V.world); }
      var best = null, bd = 1e9;
      (V.world.markList || []).forEach(function (m) { var d = w ? hexDist([m.q, m.r], [w.q, w.r]) : 0; if (m.id === e.detail.id && d < bd) { bd = d; best = m; } });
      if (best) { select(doc, s, best.q + ',' + best.r); }
    });
  }
  var api = { phase: phase, draw: draw, select: select, near: near, hitAt: hitAt, NAMES: NAMES };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasMapAura = api;
  if (root.document && root.document.addEventListener) { listen(root.document); }
})(typeof window !== 'undefined' ? window : globalThis);
