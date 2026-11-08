// P3 · loads the map by neighbourhood (odd/tasks/mapa-25d-aldea.md F3). It asks for /map/chart.json, then ONLY the
// 7 chunks around the area key of a cell (AtlasMapCarta.neighbourhood), never an exact position. Each chunk is checked
// by SHA-256 (the chunk_router.js pattern: chunk_hash_mismatch, cache_chunk_missing) and by its contract; anything
// missing or wrong is NO_DATA with its cause (honest fog). Every request is declared in the result. No server state.
(function (root) {
  'use strict';
  var C = root.AtlasMapCarta || (typeof require === 'function' ? require('./map_chart.js') : null);

  function hexOf(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function sha256(buf) {
    var R = root.AtlasChunkRouter;
    if (R && R.sha256) { return R.sha256(buf); }
    var sub = root.crypto && root.crypto.subtle;
    return sub ? sub.digest('SHA-256', buf).then(hexOf) : Promise.resolve(null);
  }
  function text(buf) { return new root.TextDecoder().decode(buf); }

  // load(cell, { fetch, base }) → { key, chunks: { key: chunk }, missing: [{ key, cause }], requests: [url], say }
  function load(cell, opts) {
    var get = (opts && opts.fetch) || root.fetch.bind(root), base = (opts && opts.base) || '/map/';
    var requests = [], out = { key: null, chunks: {}, missing: [], requests: requests, say: '' };
    function ask(url) { requests.push(url); return get(url).then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.arrayBuffer(); }); }
    return ask(base + 'chart.json').then(function (buf) {
      var carta = JSON.parse(text(buf)), bad = C.checkCarta(carta);
      if (bad) { throw new Error(bad); }
      var R = carta.radius, here = C.chunkOf(cell[0], cell[1], R), index = {};
      out.key = C.key(here);
      carta.chunks.forEach(function (c) { index[c.id] = c; });
      return Promise.all(C.neighbourhood(here, R).map(function (c) {
        var k = C.key(c), entry = index[k];
        if (!entry) { out.missing.push({ key: k, cause: 'cache_chunk_missing: not baked yet' }); return null; }
        return ask(base + 'chunks/' + k + '.' + entry.sha256.slice(0, 8) + '.json').then(function (b) {
          return sha256(b).then(function (hex) {
            if (hex !== entry.sha256) { out.missing.push({ key: k, cause: 'chunk_hash_mismatch' }); return; }
            var chunk = JSON.parse(text(b)), why = C.checkChunk(chunk, R);
            if (why) { out.missing.push({ key: k, cause: why }); return; }
            out.chunks[k] = chunk;
          });
        }, function (e) { out.missing.push({ key: k, cause: 'cache_chunk_missing: ' + e.message }); });
      }));
    }).then(function () {
      var n = Object.keys(out.chunks).length;
      // Terminal familia (TF-1): say is the visitor's sentence; detail keeps chunk keys and causes for Technical details.
      out.detail = 'Map chunks: ' + n + ' of 7 around area ' + out.key + (out.missing.length ? ' · NO_DATA ' + out.missing.map(function (m) { return m.key + ' (' + m.cause + ')'; }).join(', ') : '');
      out.say = n === 7 ? 'Map loaded' : n ? 'Part of the map is still missing' : 'The map has not loaded';
      return out;
    }, function (e) {
      out.detail = 'Map chunks: NO_DATA · ' + e.message; out.say = 'The map has not loaded'; return out;
    });
  }


  // Landmarks: every chunk is a village. Its floor cells are walked in a fixed hash order and a building stands wherever no
  // other stands within SPACE hexes; the cabin clearing (radius 2) stays free for the tutorial. No count is set: the land
  // decides. The kinds are the nine town buildings (building_interiors.json) and the model tower, each with its own roof.
  var SPACE = 4, KINDS = [['hostel', 'cone', 'PROPUESTA.base'], ['coliseum', 'arch', 'LIVE.base'], ['choir', 'dome', 'FIRMADO.base'],
    ['workshop', 'chimney', 'PROPUESTA.base'], ['tower', 'spire', 'cyan'], ['agora', 'dome', 'LIVE.base'], ['customs', 'flag', 'FIRMADO.base'],
    ['lottery', 'dome', 'PROPUESTA.base'], ['visitor-house', 'cone', 'cyan'], ['doctor', 'flag', 'LIVE.base']];
  function mixHash(q, r) { var h = (q * 73856093) ^ (r * 19349663) ^ 20261108; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; }
  function hexDist(a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  function landmarks(world) {
    if (world.marks) { return world.marks; }
    var picked = [], marks = {}, list = world.cells.list.filter(function (c) { return c[3] !== 'water' && hexDist(c, [0, 0]) > 2; });
    list.sort(function (a, b) { return mixHash(a[0], a[1]) - mixHash(b[0], b[1]) || a[0] - b[0] || a[1] - b[1]; });
    list.forEach(function (c) {
      if (picked.some(function (p) { return hexDist(p, c) < SPACE; })) { return; }
      var k = KINDS[mixHash(c[1], c[0]) % KINDS.length];
      picked.push(c); marks[c[0] + ',' + c[1]] = { q: c[0], r: c[1], id: k[0], roof: k[1], tone: k[2] };
    });
    try { JSON.parse(root.localStorage.getItem('preceptoros.built') || '[]').forEach(function (m) { // built in Settings
      var key = m.q + ',' + m.r; if (!marks[key] && world.cells.at[key]) { marks[key] = m; picked.push([m.q, m.r]); } }); } catch (e) {}
    world.marks = marks; world.markList = picked.map(function (c) { return marks[c[0] + ',' + c[1]]; });
    return marks;
  }
  // oval(g, …): an ellipse arc as a polygon (any 2D context, even the test double).
  function oval(g, x, y, rx, ry, a0, a1) { for (var i = 0; i <= 16; i++) { var a = a0 + (a1 - a0) * i / 16; g.lineTo(x + rx * Math.cos(a), y + ry * Math.sin(a)); } }
  // building(g, m, x, top, o): a smaller prism on the cell's top, ink-outlined (comic), its roof by kind.
  function building(g, m, x, top, o, H) {
    var k = o.k, F = H.T.FRONT_DOOR, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), base = H.mix(H.rgbOf(F[m.tone]), H.rgbOf(H.T.NEUTRAL.paper), 0.18);
    var ring = o.corner.map(function (q) { return [q[0] * 0.5, q[1] * 0.5]; }), hb = (m.roof === 'spire' ? 26 : 16) * k, y0 = top - 2 * k;
    if (k * 48 <= 12) { g.fillStyle = H.css(base); g.beginPath(); g.arc(x, y0 - 3 * k, Math.max(1.5, 5 * k), 0, 7); g.fill(); return; }
    g.lineWidth = Math.max(0.8, 1.6 * k); g.strokeStyle = ink;
    for (var i = 0; i < 6; i++) {
      var a = ring[i], e = ring[(i + 1) % 6];
      if ((a[1] + e[1]) / 2 <= 0) { continue; }
      g.fillStyle = H.css(H.shade(base, (a[0] + e[0] < 0 ? 0.92 : 0.66) * o.lit));
      g.beginPath(); g.moveTo(x + a[0], y0 + a[1] - hb); g.lineTo(x + e[0], y0 + e[1] - hb); g.lineTo(x + e[0], y0 + e[1]); g.lineTo(x + a[0], y0 + a[1]); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = H.css(H.shade(base, 1.08 * o.lit)); g.beginPath();
    ring.forEach(function (q, j) { if (j) { g.lineTo(x + q[0], y0 + q[1] - hb); } else { g.moveTo(x + q[0], y0 + q[1] - hb); } }); g.lineTo(x + ring[0][0], y0 + ring[0][1] - hb); g.fill(); g.stroke();
    var w = Math.abs(ring[0][0]) + Math.abs(ring[3][0]) || 10 * k, rt = y0 - hb, accent = H.css(H.shade(H.mix(base, H.rgbOf(H.T.NEUTRAL.paper), 0.4), o.lit));
    g.fillStyle = accent; g.beginPath();
    if (m.roof === 'cone') { g.moveTo(x - w * 0.42, rt); g.lineTo(x, rt - 14 * k); g.lineTo(x + w * 0.42, rt); g.closePath(); }
    else if (m.roof === 'dome') { oval(g, x, rt, w * 0.36, 11 * k, Math.PI, 2 * Math.PI); g.closePath(); }
    else if (m.roof === 'spire') { g.moveTo(x - w * 0.18, rt); g.lineTo(x, rt - 22 * k); g.lineTo(x + w * 0.18, rt); g.closePath(); }
    else if (m.roof === 'chimney') { g.rect(x + w * 0.08, rt - 12 * k, w * 0.16, 12 * k); }
    else if (m.roof === 'arch') { oval(g, x, rt, w * 0.34, 5 * k, 0, 2 * Math.PI); g.fill(); g.stroke(); g.fillStyle = H.css(H.shade(base, 0.5 * o.lit)); g.beginPath(); oval(g, x, rt, w * 0.2, 2.6 * k, 0, 2 * Math.PI); }
    else { g.moveTo(x, rt); g.lineTo(x, rt - 16 * k); g.lineTo(x + 10 * k, rt - 12 * k); g.lineTo(x, rt - 8 * k); }
    g.fill(); g.stroke();
    if (m.roof === 'spire') { g.fillStyle = H.css(H.rgbOf(F.cyan)); g.beginPath(); g.arc(x, rt - 24 * k, 2.6 * k, 0, 7); g.fill(); g.stroke(); }
  }


  function shadow(g, c, x, top, o, H, hh) {
    var b = o.B[c[3] === 'water' ? 0 : Math.max(1, Math.min(3, c[2]))], corner = o.corner;
    // Cast shadow: a higher sunward neighbour darkens a band along the shared edge (corner[i-1]→corner[i]), floor ink.
    for (var s = 0; s < 6; s++) {
      var d = H.NB[s], nb = o.at[(c[0] + d[0]) + ',' + (c[1] + d[1])], p0 = corner[(s + 5) % 6], p1 = corner[s];
      if (!nb || H.height(nb) <= hh) { continue; }
      if ((p0[0] + p1[0]) * H.LIGHT[0] + (p0[1] + p1[1]) * H.LIGHT[1] <= 0) { continue; }
      var f = Math.min(0.85, 0.3 * (H.height(nb) - hh));
      g.globalAlpha = 0.32; g.fillStyle = H.css(H.shade(b.base, 0.3 * o.lit));
      g.beginPath(); g.moveTo(x + p0[0], top + p0[1]); g.lineTo(x + p1[0], top + p1[1]);
      g.lineTo(x + p1[0] * (1 - f), top + p1[1] * (1 - f)); g.lineTo(x + p0[0] * (1 - f), top + p0[1] * (1 - f)); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
  }
  // pattern(): the floor's marks (waves, dots, hatch, cross), drawn for map_painter.js.
  function pattern(g, kind, x, y, k, base, lit, wt, c, H) {
    g.save(); g.strokeStyle = g.fillStyle = H.css(H.shade(base, kind === 'water' ? 1.7 * lit : 0.6 * lit)); g.lineWidth = Math.max(0.6, k * 0.8);
    var s = 7 * k;
    if (kind === 'water') {
      var o = ((c[0] * 7 + c[1] * 5) % 6 - 3) * k + (wt % 24) / 24 * 4 * k;
      g.beginPath(); g.moveTo(x - s + o, y); g.quadraticCurveTo(x - s / 2 + o, y - s / 3, x + o, y); g.stroke();
      g.beginPath(); g.moveTo(x + o / 2, y + s / 2); g.quadraticCurveTo(x + s / 2 + o / 2, y + s / 6, x + s + o / 2, y + s / 2); g.stroke();
    } else if (kind === 'dots') {
      [[-0.5, -0.1], [0.4, 0.15], [-0.05, 0.35]].forEach(function (d) { g.beginPath(); g.arc(x + d[0] * s * 1.6, y + d[1] * s, Math.max(0.6, k * 0.9), 0, 6.283); g.fill(); });
    } else if (kind === 'hatch') {
      for (var i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * s - s / 3, y + s / 3); g.lineTo(x + i * s + s / 3, y - s / 3); g.stroke(); }
    } else {
      g.beginPath(); g.moveTo(x - s / 2, y - s / 3); g.lineTo(x + s / 2, y + s / 3); g.moveTo(x + s / 2, y - s / 3); g.lineTo(x - s / 2, y + s / 3); g.stroke();
    }
    g.restore();
  }

  // markAt(world, G, px, py, V): the building whose roof is nearest a tap (canvas pixels), or null beyond reach.
  // V = { P, turn, HSTEP, height } from the painter, so the hit test uses the very placement the floor was drawn with.
  function markAt(world, G, px, py, V) {
    var k = G.k, best = null, bd = 20 + 30 * k;
    landmarks(world); world.markList.forEach(function (m) {
      var h0 = V.P(m.q, m.r), p = V.turn(h0.x, h0.y), x = G.cx + p.x * k;
      var y = G.cy + p.y * k - (V.height(world.cells.at[m.q + ',' + m.r]) * V.HSTEP + 12) * k, d = Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
      if (d < bd) { bd = d; best = m; }
    });
    return best;
  }

  // dirOf(dx, dy, deg, squash): a screen gesture → one of the six hex steps. The vector is turned back to the 0° view on
  // the ground (as the map tap does), so «up the screen» stays up at any orbit angle.
  var SIX = [['east', 0], ['north-east', 60], ['north-west', 120], ['west', 180], ['south-west', 240], ['south-east', 300], ['east', 360]];
  function dirOf(dx, dy, deg, squash) {
    var q = squash || 1, vy = dy / q, th = -(deg || 0) * Math.PI / 180;
    var ux = dx * Math.cos(th) - vy * Math.sin(th), uy = (dx * Math.sin(th) + vy * Math.cos(th)) * q, a = (Math.atan2(-uy, ux) * 180 / Math.PI + 360) % 360;
    return SIX.reduce(function (b, d) { return Math.abs(a - d[1]) < Math.abs(a - b[1]) ? d : b; })[0];
  }
  // The crab's body and its glide live in crab_body.js (AtlasCrabBody); without it the crab is not drawn (NO_DATA, not a fake).
  // names(): buildings within REACH hexes of the crab carry a small Acho name pill; the map reads as it is walked.
  var REACH = 6, NAMES = { hostel: 'Hostel', coliseum: 'Coliseum', choir: 'Choir', workshop: 'Workshop', tower: 'Model tower',
    agora: 'Agora', customs: 'Customs', lottery: 'Lottery', 'visitor-house': 'Visitor house', doctor: 'Doctor' };
  function names(g, V, w, dpr, cx, cy) {
    if (!V.world.markList) { landmarks(V.world); }
    var k = V.G.k, ink = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.ink)), paper = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.paper)), fs = Math.round(11 * dpr);
    g.save(); g.font = '700 ' + fs + 'px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    V.world.markList.forEach(function (m) {
      if (hexDist([m.q, m.r], [w.q, w.r]) > REACH) { return; }
      var cell = V.world.cells.at[m.q + ',' + m.r], h0 = V.P(m.q, m.r), p = V.turn(h0.x, h0.y);
      var x = V.G.cx + p.x * k, y = V.G.cy + p.y * k - ((cell ? V.height(cell) * V.HSTEP : 0) + (m.roof === 'spire' ? 58 : 44)) * k;
      var t = NAMES[m.id] || m.id, tw = g.measureText(t).width + 12 * dpr, th = fs + 6 * dpr;
      // A label over the crab moves under its building.
      if (Math.abs(x - cx) < tw / 2 + 24 * k && Math.abs(y - cy) < th / 2 + 26 * k) { y += ((m.roof === 'spire' ? 58 : 44) + 22) * k; }
      g.fillStyle = paper; g.strokeStyle = ink; g.lineWidth = Math.max(1, 1.6 * dpr);
      g.beginPath(); g.moveTo(x - tw / 2 + th / 2, y - th / 2); g.lineTo(x + tw / 2 - th / 2, y - th / 2); g.arc(x + tw / 2 - th / 2, y, th / 2, -Math.PI / 2, Math.PI / 2);
      g.lineTo(x - tw / 2 + th / 2, y + th / 2); g.arc(x - tw / 2 + th / 2, y, th / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = ink; g.fillText(t, x, y + 0.5 * dpr);
    });
    g.restore();
  }
  // The visitor layer: with no live colony the page draws only the floor, so the companion is drawn here on every
  // visitor:draw, its place is written for the map tap (dataset.youx/youy), and the camera follows it when it nears an
  // edge, unless the visitor is looking around (dataset.look, the left stick or a drag).
  function youLayer(doc) {
    var s = doc.getElementById('surface');
    if (!s) { return; }
    s.addEventListener('visitor:draw', function () {
      var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), MP = root.AtlasMapPainter, V = MP && MP.view && MP.view();
      var C = ow && !ow.colony && V && ow.controls, w = C && C.walker && C.walker();
      if (C && !w && C.start) { C.start(true); w = C.walker(); }
      if (!w) { return; }
      var k = V.G.k, B = root.AtlasCrabBody, at = function (key) { var c = V.world.cells.at[key], q = key.split(','), h0 = V.P(+q[0], +q[1]), p = V.turn(h0.x, h0.y);
        return { x: V.G.cx + p.x * k, y: V.G.cy + p.y * k - (c ? V.height(c) * V.HSTEP : 0) * k }; };
      var key = w.q + ',' + w.r, still = ow.reduced === true, T = B && B.track(key, !!(V.world.marks && V.world.marks[key]), still), e = T && T.from ? B.ease(T.p) : 1;
      var a = at(key), f = T && T.from ? at(T.from) : a, x = f.x + (a.x - f.x) * e, y = f.y + (a.y - f.y) * e; // the glide is projection only
      s.dataset.youx = String(Math.round(x)); s.dataset.youy = String(Math.round(y));
      var g = s.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
      if (root.AtlasMapAura) { root.AtlasMapAura.draw(g, V, s, still, oval, ow); } // the selected building's aura (map_aura.js)
      names(g, V, w, s.width / (s.getBoundingClientRect().width || s.width), x, y);
      if (B) { B.draw(g, x, y, Math.max(k, 0.5), B.pose(T.steps, still ? 1 : T.p, still ? 1 : T.gp), V.H, B.beat(ow.signal || null, Date.now()), oval); if (T.busy) { B.loop(ow.redraw); } }
      var W = s.width, Hh = s.height;
      if (!s.dataset.look && (x < W * 0.25 || x > W * 0.75 || y < Hh * 0.3 || y > Hh * 0.7)) {
        s.dataset.panx = String(Math.round((Number(s.dataset.panx) || 0) + W / 2 - x));
        s.dataset.pany = String(Math.round((Number(s.dataset.pany) || 0) + Hh / 2 - y));
        if (ow.redraw && root.requestAnimationFrame) { root.requestAnimationFrame(function () { ow.redraw(); }); }
      }
    });
  }
  // A tap on a village building opens its card (building_sheet.js open); a tap elsewhere goes on to the map.
  function listen(doc) {
    var s = doc.getElementById('surface');
    if (!s) { return; }
    s.addEventListener('click', function (e) {
      var MP = root.AtlasMapPainter, BS = root.AtlasBuildingSheet, r = s.getBoundingClientRect();
      var mk = MP && MP.markAt && r.width ? MP.markAt((e.clientX - r.left) * (s.width / r.width), (e.clientY - r.top) * (s.height / r.height)) : null;
      if (mk && BS && BS.open && BS.open(mk.id)) { e.stopImmediatePropagation(); if (root.AtlasMapAura) { root.AtlasMapAura.select(doc, s, mk.q + ',' + mk.r); } }
    }, true);
  }
  if (root.document && root.document.getElementById) {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { listen(root.document); youLayer(root.document); }); } else { listen(root.document); youLayer(root.document); }
  }

  var api = { load: load, pattern: pattern, markAt: markAt, dirOf: dirOf, landmarks: landmarks, building: building, shadow: shadow, KINDS: KINDS };
  root.AtlasMapChunks = api;
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
