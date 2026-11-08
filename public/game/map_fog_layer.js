// Fog of war on the floor (Sovereign, 2026-11-08; odd/tasks/mundo-grande.md G4 + G5). The node shows one building of
// each kind in colour (the nearest to the cabin, map_chunks.js landmarks); the others are grey and held by NPCs. The fog
// covers the floor except around the cabin, the node's own buildings and every hex the crab has walked this visit:
// walking clears it. An NPC stands by each grey building; in the fog it is only a shape. A tap on a building still in
// the fog does not open its card: the crab's bubble says an NPC holds it. Projection only: no state, no result, nothing
// stored or sent; the clearings live in this page's memory for the visit. No chance, no clock.
(function (root) {
  'use strict';
  var CABIN = 4, OWN = 2, STEP = 2, seen = {}, centres = [], fc = null;
  function hexDist(a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // Pure: is the hex (q, r) clear for these clearings [{q, r, r0}]? Tested in atlas/puros/map_fog_cases.mjs.
  function clear(list, q, r) { return list.some(function (c) { return hexDist([c.q, c.r], [q, r]) <= c.r0; }); }
  function add(q, r, r0) { var k = q + ',' + r; if (seen[k] >= r0) { return; } seen[k] = r0; centres.push({ q: q, r: r, r0: r0 }); }
  function seed(V) {
    if (centres.length) { return; }
    add(0, 0, CABIN); // the cabin is seen to radius 4; the city (radius 2 around the cabin and each own building) is always seen
    (V.world.markList || []).forEach(function (m) { if (!m.fog) { add(m.q, m.r, OWN); } });
  }
  function hidden(m) { return !clear(centres, m.q, m.r); }
  // won(m): a building conquered in this visit (visitor_battle_ui.js) opens a wide clearing (radius 4) and flies a flag.
  function won(m) { add(m.q, m.r, 4); }
  // flag(g, x, y, k, H): an ink pole and a pennant in the LIVE token, over a building the account controls.
  function flag(g, x, y, k, H) {
    var ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), h = 30 * k;
    g.save(); g.lineWidth = Math.max(1.2, 2 * k); g.strokeStyle = ink; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke();
    g.fillStyle = H.css(H.rgbOf(H.T.FRONT_DOOR['LIVE.base'])); g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + 13 * k, y - h + 5 * k); g.lineTo(x, y - h + 10 * k); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  function tell(m) {
    var T = root.AtlasPreceptorTalk && root.AtlasPreceptorTalk.view, name = String(m.id).replace(/-/g, ' ');
    if (T && T.news) { T.news('An NPC holds this ' + name + ' in the fog. Walk closer to clear it.', 'NPC'); }
  }
  // npc(g, x, y, k, H): a small wave creature in Acho (body, two eyes, a wave under it); its colour is the duel's other side.
  function npc(g, x, y, k, H) {
    var F = H.T.FRONT_DOOR, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.css(H.rgbOf(H.T.NEUTRAL.paper)), r = 7 * k;
    g.save(); g.lineWidth = Math.max(1, 1.5 * k); g.strokeStyle = ink; g.fillStyle = H.css(H.rgbOf(F['FIRMADO.base']));
    g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x - r, y - 2.2 * r, x, y - 2.2 * r); g.quadraticCurveTo(x + r, y - 2.2 * r, x + r, y);
    for (var i = 0; i < 4; i++) { g.quadraticCurveTo(x + r - (i + 0.5) * r / 2, y + (i % 2 ? -0.35 : 0.35) * r, x + r - (i + 1) * r / 2, y); }
    g.closePath(); g.fill(); g.stroke();
    [-1, 1].forEach(function (s) { g.fillStyle = paper; g.beginPath(); g.arc(x + s * 0.38 * r, y - 1.25 * r, 0.32 * r, 0, 7); g.fill(); g.stroke();
      g.fillStyle = ink; g.beginPath(); g.arc(x + s * 0.38 * r + 0.08 * r, y - 1.2 * r, 0.13 * r, 0, 7); g.fill(); });
    g.restore();
  }
  // draw(g, V, s, w, oval): called by map_chunks.js youLayer before the names, the aura and the crab.
  function draw(g, V, s, w) {
    seed(V); add(w.q, w.r, STEP);
    var k = V.G.k, P = function (q, r) { var h = V.P(q, r), p = V.turn(h.x, h.y), c = V.world.cells.at[q + ',' + r];
      return { x: V.G.cx + p.x * k, y: V.G.cy + p.y * k - (c ? V.height(c) * V.HSTEP : 0) * k }; };
    var o = P(0, 0), e = P(1, 0), step = Math.max(4, Math.hypot(e.x - o.x, e.y - o.y)), W = s.width, Hh = s.height, sq = 0.433 * (V.G.tilt || 1) * 2;
    (V.world.markList || []).forEach(function (m) {
      var p = P(m.q, m.r);
      if (m.won) { flag(g, p.x + 0.35 * step, p.y - 0.2 * step, Math.max(k, 0.5), V.H); return; }
      if (!m.fog) { return; }
      if (p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < Hh + 60) { npc(g, p.x + 0.55 * step, p.y + 0.15 * step, Math.max(k, 0.5), V.H); }
    });
    if (!fc) { fc = (root.document || {}).createElement ? root.document.createElement('canvas') : null; }
    if (!fc) { return; }
    if (fc.width !== W || fc.height !== Hh) { fc.width = W; fc.height = Hh; }
    var f = fc.getContext('2d'), fog = V.H.mix(V.H.rgbOf(V.H.T.NEUTRAL.paper), V.H.rgbOf(V.H.T.NEUTRAL.ink), 0.42);
    f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, W, Hh); f.fillStyle = V.H.css(fog) + '9e'; f.fillRect(0, 0, W, Hh); // the token fog at 62 % (#rrggbbaa)
    f.globalCompositeOperation = 'destination-out';
    centres.forEach(function (c) {
      var p = P(c.q, c.r), R = (c.r0 + 0.7) * step;
      if (p.x < -R || p.x > W + R || p.y < -R || p.y > Hh + R) { return; }
      f.save(); f.translate(p.x, p.y); f.scale(1, Math.min(1, sq));
      var gr = f.createRadialGradient(0, 0, R * 0.6, 0, 0, R); var ink = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.ink)); gr.addColorStop(0, ink); gr.addColorStop(1, ink + '00');
      f.fillStyle = gr; f.beginPath(); f.arc(0, 0, R, 0, 7); f.fill(); f.restore();
    });
    g.drawImage(fc, 0, 0);
  }
  var api = { clear: clear, hidden: hidden, won: won, tell: tell, draw: draw, CABIN: CABIN, OWN: OWN, STEP: STEP };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasMapFog = api;
})(typeof window !== 'undefined' ? window : globalThis);
