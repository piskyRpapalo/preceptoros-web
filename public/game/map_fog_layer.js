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
    var TP = root.AtlasTownPlan; add(0, 0, TP ? TP.TERR : CABIN); // the node's territory (town_plan.js) is always seen; the fog starts at its edge
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
  function npc(g, x, y, k, H, L) {
    var F = H.T.FRONT_DOOR, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.css(H.rgbOf(H.T.NEUTRAL.paper)), r = 7 * k;
    g.save(); g.lineWidth = Math.max(1, 1.5 * k); g.strokeStyle = ink; g.fillStyle = H.css(H.rgbOf(F['FIRMADO.base']));
    g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x - r, y - 2.2 * r, x, y - 2.2 * r); g.quadraticCurveTo(x + r, y - 2.2 * r, x + r, y);
    for (var i = 0; i < 4; i++) { g.quadraticCurveTo(x + r - (i + 0.5) * r / 2, y + (i % 2 ? -0.35 : 0.35) * r, x + r - (i + 1) * r / 2, y); }
    g.closePath(); g.fill(); g.stroke();
    [-1, 1].forEach(function (s) { g.fillStyle = paper; g.beginPath(); g.arc(x + s * 0.38 * r, y - 1.25 * r, 0.32 * r, 0, 7); g.fill(); g.stroke();
      g.fillStyle = ink; g.beginPath(); g.arc(x + s * 0.38 * r + (L ? L[0] * 0.14 : 0.08) * r, y - 1.2 * r + (L ? L[1] * 0.14 * r : 0), 0.13 * r, 0, 7); g.fill(); });
    g.restore();
  }
  // Q-02 (Sovereign, 2026-11-08): each guardian walks a loop inside the hexagon it guards. [deprecated 2026-11-16: the pace is
  // now a clock, guardian_pressure.js; `spot` stays only as the fallback if that piece does not load] The pace is a frame count and the
  // offset comes from the building's key: no chance, no clock; reduced motion keeps it still. Near the crab (<= 3 hexes) a «?»
  // floats over its head: a tap opens the guardian's profile (difficulty and reward; never its army).
  var tick = 0, asks = [], timer = 0;
  function spot(m, t, step, sq) { var a = t * 0.035 + (((m.q * 73856093) ^ (m.r * 19349663)) >>> 0) % 628 / 100; return [Math.cos(a) * 0.5 * step, Math.sin(a) * 0.5 * step * sq]; }
  function ask(g, x, y, k, H) {
    var ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.css(H.rgbOf(H.T.NEUTRAL.paper)), r = 8 * k;
    g.save(); g.lineWidth = Math.max(1, 1.6 * k); g.strokeStyle = ink; g.fillStyle = paper; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke();
    g.fillStyle = ink; g.font = '900 ' + Math.round(12 * k) + 'px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x, y + 0.5 * k);
    g.restore();
  }
  function profile(m) {
    var T = root.AtlasPreceptorTalk && root.AtlasPreceptorTalk.view, B = root.AtlasVisitorBattle, name = String(m.id).replace(/-/g, ' ');
    var pl = B && B.npcPlace ? B.npcPlace('b:' + m.id + ':' + m.q + ',' + m.r) : null, n = pl ? pl.troops.length : 0;
    var hard = !pl ? 'NO_DATA: the battle rules are not loaded' : n <= 2 ? 'easy' : n <= 4 ? 'steady' : 'hard';
    var GP = root.AtlasGuardianPressure, k = m.id + ':' + m.q + ',' + m.r, seen = GP && GP.read ? GP.read().some(function (x) { return x.key === k && x.state === 'alert'; }) : false;
    var text = 'Guardian of this ' + name + (seen ? ' · it has seen you and stands its ground' : '') + ' · difficulty: ' + hard + ' · reward: NO_DATA until holdings (C8). Clear the fog and challenge it from its card.';
    if (T && T.news) { T.news(text, 'Guardian', true); }
    return text;
  }
  // The way to the nearest guardian (Sovereign 2026-11-15: the fog and its NPCs are the tutorial's enemy and the map's own
  // guidance). Off screen, an ink arrow at the map's edge points to it; a tap (or «Walk to the nearest guardian») walks the
  // crab there with real steps (controls.step: the walker still decides every hex), and its card opens beside it.
  var DIRS = [['east', 1, 0], ['north-east', 1, -1], ['north-west', 0, -1], ['west', -1, 0], ['south-west', -1, 1], ['south-east', 0, 1]];
  // Pure: nearest(list, w) → { m, d } for the nearest NPC building not won in this visit, or null (ties: lower q, then r).
  function nearest(list, w) {
    var b = null; (list || []).forEach(function (m) { if (!m.fog || m.won) { return; } var d = hexDist([m.q, m.r], [w.q, w.r]);
      if (!b || d < b.d || (d === b.d && (m.q < b.m.q || (m.q === b.m.q && m.r < b.m.r)))) { b = { m: m, d: d }; } });
    return b;
  }
  // Pure: toward(w, t) → the six direction names, the ones that bring the crab nearest to t first (ties keep DIRS order).
  function toward(w, t) {
    return DIRS.map(function (D, i) { return { n: D[0], d: hexDist([w.q + D[1], w.r + D[2]], [t.q, t.r]), i: i }; })
      .sort(function (a, b) { return a.d - b.d || a.i - b.i; }).map(function (x) { return x.n; });
  }
  var going = 0, guideHit = null;
  function say(text) { var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (ow && ow.controls && ow.controls.say) { ow.controls.say(text); } return text; }
  function stop(text) { root.clearInterval(going); going = 0; if (text) { say(text); } }
  function arrive(m) {
    var doc = root.document, s = doc.getElementById('surface'), BS = root.AtlasBuildingSheet, A = root.AtlasMapAura, key = m.q + ',' + m.r;
    say('You reach the guardian of this ' + String(m.id).replace(/-/g, ' ') + '. Its card is open: challenge it.');
    if (BS && BS.open) { BS.open(m.id); }
    root.setTimeout(function () { if (A && A.select && s && s.dataset.sel !== key) { A.select(doc, s, key); } }, 60);
  }
  function go() {
    if (going) { stop('Walk to the guardian: stopped.'); return 'stopped'; }
    var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), MP = root.AtlasMapPainter, V = MP && MP.view && MP.view();
    var c = ow && ow.controls, w = c && c.walker && c.walker();
    if (!c || !c.step || !w || !V) { return say('NO_DATA: press Play first; the crab is not on the map yet.'); }
    var n = nearest(V.world.markList, w);
    if (!n) { return say('No guardian is left in the fog: every NPC building is yours for this visit.'); }
    var m = n.m, stuck = 0, s = root.document.getElementById('surface'); if (s) { delete s.dataset.look; } // the camera follows the walk
    say('Walking to the guardian of this ' + String(m.id).replace(/-/g, ' ') + ' · ' + n.d + ' hexes. Tap the arrow again to stop.');
    going = root.setInterval(function () {
      var a = c.walker(), here = a.q + ',' + a.r;
      if (hexDist([a.q, a.r], [m.q, m.r]) <= 1) { stop(); arrive(m); return; }
      var dirs = toward(a, m);
      for (var i = 0; i < 3; i++) { c.step(dirs[i]); var b = c.walker(); if (b.q + ',' + b.r !== here) { break; } }
      var now = c.walker(); stuck = now.q + ',' + now.r === here ? stuck + 1 : 0;
      if (stuck > 2) { stop('NO_DATA: the way to the guardian is blocked here; walk around it with the stick.'); }
    }, 260);
    return 'walking';
  }
  // pointer(g, V, w, P, W, Hh): the arrow at the edge toward the nearest guardian when it is off the map view.
  function pointer(g, V, w, P, W, Hh) {
    guideHit = null; var C = root.AtlasOwCalm; if (C && !C.shows('arrow', C.now())) { return; } // ow_calm.js: from the visit on
    var n = nearest(V.world.markList, w); if (!n) { return; }
    var p = P(n.m.q, n.m.r), pad = 34; if (p.x > pad && p.x < W - pad && p.y > pad && p.y < Hh - pad) { return; }
    var cx = W / 2, cy = Hh / 2, dx = p.x - cx, dy = p.y - cy, sc = Math.min((W / 2 - pad) / (Math.abs(dx) || 1), (Hh / 2 - pad) / (Math.abs(dy) || 1));
    var x = cx + dx * sc, y = cy + dy * sc, a = Math.atan2(dy, dx), H = V.H, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.css(H.rgbOf(H.T.NEUTRAL.paper));
    var sf = root.document.getElementById('surface') || {}, dpr = W / (sf.clientWidth || W), r = 22 * dpr, t = going ? 'Stop' : n.d + ' hexes';
    if (y < 64 * dpr + r) { y = 64 * dpr + r; } // below the top bar (ow_topbar.js, 2026-11-24): Talk · Sound · Echoes keep their row
    var yx = Number((sf.dataset || {}).youx), yy = Number((sf.dataset || {}).youy), far = 3.4 * r; // never on the crab (2026-11-15): slide along the edge
    if (isFinite(yx) && isFinite(yy) && Math.hypot(x - yx, y - yy) < far) {
      if (y <= pad + 1 || y >= Hh - pad - 1) { x = Math.max(pad, Math.min(W - pad, yx + (x >= yx ? far : -far))); } else { y = Math.max(pad, Math.min(Hh - pad, yy + (y >= yy ? far : -far))); }
    }
    g.save(); g.lineWidth = Math.max(1.5, 2.4 * dpr); g.strokeStyle = ink;
    g.fillStyle = H.css(H.rgbOf(H.T.FRONT_DOOR['FIRMADO.base'])); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); // the guardians' colour
    g.fillStyle = ink; g.beginPath(); g.moveTo(x + Math.cos(a) * (r + 12 * dpr), y + Math.sin(a) * (r + 12 * dpr));
    g.lineTo(x + Math.cos(a + 0.5) * r, y + Math.sin(a + 0.5) * r); g.lineTo(x + Math.cos(a - 0.5) * r, y + Math.sin(a - 0.5) * r); g.closePath(); g.fill();
    g.fillStyle = paper; g.font = '900 ' + Math.round(17 * dpr) + 'px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚔', x, y + dpr);
    g.font = '800 ' + Math.round(13 * dpr) + 'px ui-rounded, system-ui, sans-serif'; var tw = g.measureText(t).width + 14 * dpr, ty = y + (y > Hh / 2 ? -r - 14 * dpr : r + 14 * dpr);
    var tx = Math.max(tw / 2 + 4, Math.min(W - tw / 2 - 4, x)); g.fillStyle = paper; g.fillRect(tx - tw / 2, ty - 11 * dpr, tw, 22 * dpr); g.strokeRect(tx - tw / 2, ty - 11 * dpr, tw, 22 * dpr);
    g.fillStyle = ink; g.fillText(t, tx, ty + dpr); g.restore();
    guideHit = { x0: x - r - 6 * dpr, x1: x + r + 6 * dpr, y0: Math.min(y - r, ty - 11 * dpr) - 6 * dpr, y1: Math.max(y + r, ty + 11 * dpr) + 6 * dpr };
  }
  function askAt(px, py) { for (var i = 0; i < asks.length; i++) { var h = asks[i]; if (px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) { return h.m; } } return null; }
  // draw(g, V, s, w, oval): called by map_chunks.js youLayer before the names, the aura and the crab.
  function draw(g, V, s, w) {
    seed(V); add(w.q, w.r, STEP);
    var still = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches), moving = false; if (!still) { tick++; } asks = [];
    var k = V.G.k, P = function (q, r) { var h = V.P(q, r), p = V.turn(h.x, h.y), c = V.world.cells.at[q + ',' + r];
      return { x: V.G.cx + p.x * k, y: V.G.cy + p.y * k - (c ? V.height(c) * V.HSTEP : 0) * k }; };
    var o = P(0, 0), e = P(1, 0), step = Math.max(4, Math.hypot(e.x - o.x, e.y - o.y)), W = s.width, Hh = s.height, sq = 0.433 * (V.G.tilt || 1) * 2;
    var GP = root.AtlasGuardianPressure, cw = P(w.q, w.r); if (GP) { GP.frame(); } // guardian_pressure.js: clock pace, the crab is noticed
    var gp = function (m, p) { if (!GP) { return null; } var vx = cw.x - p.x, vy = cw.y - p.y, L = Math.hypot(vx, vy) || 1; return GP.at(m, hexDist([m.q, m.r], [w.q, w.r]), [vx / L, vy / L], step, sq / 2); };
    (V.world.markList || []).forEach(function (m) {
      var p = P(m.q, m.r);
      if (m.won) { flag(g, p.x + 0.35 * step, p.y - 0.2 * step, Math.max(k, 0.5), V.H); if (root.AtlasHoldingsMap) { root.AtlasHoldingsMap.bar(g, p.x + 0.35 * step, p.y - 0.2 * step, Math.max(k, 0.5), V.H, m); }
        var R = gp(m, p); if (R) { g.save(); g.globalAlpha = R.alpha; npc(g, p.x + R.dx, p.y + 0.15 * step + R.dy, Math.max(k, 0.5) * R.scale, V.H, R.look); g.restore(); moving = true; } return; } // the beaten guardian withdraws // its garrison's life (holdings_map.js)
      if (!m.fog) { return; }
      if (p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < Hh + 60) {
        var R = gp(m, p), d = R ? [R.dx, R.dy] : spot(m, tick, step, sq / 2), kk = Math.max(k, 0.5), gx = p.x + d[0], gy = p.y + 0.15 * step + d[1]; moving = true;
        npc(g, gx, gy, kk, V.H, R && R.look);
        if (hexDist([m.q, m.r], [w.q, w.r]) <= 3) {
          var ay = gy - 15.4 * 7 * kk / 7 - 12 * kk, half = Math.max(22, 10 * kk);
          asks.push({ m: m, x: gx, y: ay, k: kk, x0: gx - half, x1: gx + half, y0: ay - half, y1: ay + half });
        }
      }
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
    if (root.AtlasTownPlan && root.AtlasTownPlan.wall) { root.AtlasTownPlan.wall(g, P, V.H, step); } // the territory's wall, crisp over the fog
    asks.forEach(function (h) { ask(g, h.x, h.y, h.k, V.H); }); // over the fog: the question is always readable
    pointer(g, V, w, P, W, Hh);
    if (moving && !still) { pace(); }
  }
  function pace() {
    var ow = root.AtlasOpenworldView && root.AtlasOpenworldView();
    if (!timer && ow && ow.redraw && !(root.document && root.document.hidden)) { timer = root.setTimeout(function () { timer = 0; ow.redraw(); }, 120); }
  }
  if (root.document && root.document.addEventListener) {
    root.document.addEventListener('click', function (e) {
      var sf = root.document.getElementById('surface'); if (!sf || e.target !== sf || (!asks.length && !guideHit)) { return; }
      var r = sf.getBoundingClientRect(), px = (e.clientX - r.left) * (sf.width / (r.width || 1)), py = (e.clientY - r.top) * (sf.height / (r.height || 1)), m = r.width ? askAt(px, py) : null, h = guideHit;
      if (h && px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) { e.stopImmediatePropagation(); e.preventDefault(); go(); return; }
      if (m) { e.stopImmediatePropagation(); e.preventDefault(); profile(m); }
    }, true);
  }
  function guideAt(px, py) { var h = guideHit; return !!(h && px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1); }
  var api = { guideAt: guideAt, nearest: nearest, toward: toward, go: go, walking: function () { return !!going; }, clear: clear, hidden: hidden, won: won, npc: npc, tell: tell, draw: draw, spot: spot, askAt: askAt, profile: profile, CABIN: CABIN, OWN: OWN, STEP: STEP };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasMapFog = api;
})(typeof window !== 'undefined' ? window : globalThis);
