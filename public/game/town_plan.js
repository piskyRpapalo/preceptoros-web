// The node's town (Sovereign 2026-11-15: Hexelion's building is the high hexagonal town hall; the other buildings stand
// inside its coloured territory; everything outside is NPC buildings with their ghosts; the fog of war starts outside
// the node). One plan, pure and deterministic, read by map_chunks.js (landmarks, city paving), by
// map_fog_layer.js (what is always seen) and by node_beacon.js (the town hall over the node's own cell):
// - the town hall stands on the node's cell (0,0); the node's ten buildings ring it at radius RING, evenly spaced;
// - the territory is every hex within TERR of the node: coloured, each hex by its nearest own building (its district),
//   the hall's square paved; it is the clearing of the fog;
// - outside it, beyond a one-hex margin, the scattered buildings are grey and held by NPCs (their ghosts) under the fog.
// No clock, no random numbers, no network.
(function (root) {
  'use strict';
  var TERR = 6, RING = 4, SQUARE = 1, SPACE = 4;
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  function hexDist(a, b) { var dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  // Pure: ring(R) → the 6R hexes at distance R from (0,0), in walking order.
  function ring(R) { var out = [], c = [DIRS[4][0] * R, DIRS[4][1] * R]; for (var i = 0; i < 6; i++) { for (var j = 0; j < R; j++) { out.push([c[0], c[1]]); c = [c[0] + DIRS[i][0], c[1] + DIRS[i][1]]; } } return out; }
  // Pure: slots(n) → n hexes of the ring, evenly spaced (index round(i·6R/n)).
  function slots(n) { var r = ring(RING), L = r.length; return Array.from({ length: n }, function (_, i) { return r[Math.round(i * L / n) % L]; }); }
  // One-Nexo proposal mode (explicit, OFF until integrated after browser gates).
  // Node 0 keeps exactly the central hall. The four tutorial sites are NPC-held
  // outside its territory, not extra owned buildings. No local "built" data
  // can silently promote another building into the node's territory.
  var TUTORIAL = ['hostel', 'coliseum', 'doctor', 'workshop'];
  function nexoPlan(world, KINDS, mixHash) {
    var at = world.cells.at, marks = {}, list = [], occupied = [];
    var candidates = world.cells.list.filter(function (c) {
      var d = hexDist(c, [0, 0]);
      return c[3] !== 'water' && d > TERR + 1 && d <= TERR + 7;
    });
    candidates.sort(function (a, b) {
      return hexDist(a, [0, 0]) - hexDist(b, [0, 0]) ||
        mixHash(a[0], a[1]) - mixHash(b[0], b[1]) || a[0] - b[0] || a[1] - b[1];
    });
    TUTORIAL.forEach(function (kind) {
      var k = KINDS.find(function (row) { return row[0] === kind; });
      if (!k) { return; }
      var c = candidates.find(function (spot) {
        return at[spot[0] + ',' + spot[1]] && occupied.every(function (o) { return hexDist(spot, o) >= SPACE; });
      });
      if (!c) { return; } // NO_DATA(tutorial_site_not_available), never invent a hex
      occupied.push(c);
      var m = { q: c[0], r: c[1], id: k[0], roof: k[1], tone: k[2],
        fog: true, town: false, tutorial: true, own: false };
      marks[c[0] + ',' + c[1]] = m;
      list.push(m);
    });
    var city = {};
    world.cells.list.forEach(function (c) {
      if (c[3] !== 'water' && hexDist(c, [0, 0]) <= SQUARE) { city[c[0] + ',' + c[1]] = 1; }
    });
    return { marks: marks, markList: list, city: city,
      nexo: { id: 'nexo', q: 0, r: 0, count: 1, status: 'PROPOSED' },
      tutorialMissing: TUTORIAL.filter(function (k) { return !list.some(function (m) { return m.id === k; }); }) };
  }

  // Pure: plan(world, KINDS, mixHash, built) → { marks, markList, city }. KINDS rows: [id, roof, tone].
  function plan(world, KINDS, mixHash, built) {
    if (world && world.singleNexo === true) { return nexoPlan(world, KINDS, mixHash); }
    var marks = {}, list = [], at = world.cells.at;
    slots(KINDS.length).forEach(function (c, i) { var k = KINDS[i]; if (!k[0] || !at[c[0] + ',' + c[1]]) { return; } // an empty slot keeps the others in place
      var m = { q: c[0], r: c[1], id: k[0], roof: k[1], tone: k[2], fog: false, town: true }; marks[c[0] + ',' + c[1]] = m; list.push(m); });
    var out = world.cells.list.filter(function (c) { return c[3] !== 'water' && hexDist(c, [0, 0]) > TERR + 1; }), picked = [];
    out.sort(function (a, b) { return mixHash(a[0], a[1]) - mixHash(b[0], b[1]) || a[0] - b[0] || a[1] - b[1]; });
    out.forEach(function (c) {
      if (picked.some(function (p) { return hexDist(p, c) < SPACE; })) { return; }
      var k = KINDS[mixHash(c[1], c[0]) % KINDS.length]; picked.push(c); if (!k[0]) { return; }
      var m = { q: c[0], r: c[1], id: k[0], roof: k[1], tone: k[2], fog: true }; marks[c[0] + ',' + c[1]] = m; list.push(m);
    });
    (built || []).forEach(function (m) { var key = m.q + ',' + m.r; if (!marks[key] && at[key]) { m.fog = false; marks[key] = m; list.push(m); } }); // built in Settings
    var city = {}, own = list.filter(function (m) { return m.town; });
    world.cells.list.forEach(function (c) { if (c[3] === 'water') { return; } var d0 = hexDist(c, [0, 0]); if (d0 > TERR) { return; }
      if (d0 <= SQUARE) { city[c[0] + ',' + c[1]] = 1; return; }
      var best = null, bd = 99; own.forEach(function (m) { var d = hexDist(c, [m.q, m.r]); if (d < bd) { bd = d; best = m; } });
      if (best) { city[c[0] + ',' + c[1]] = best.tone; } });
    return { marks: marks, markList: list, city: city };
  }
  // hall(g, x, y, step, sq, H, live): the town hall, a two-tier hexagonal tower with a dome and a lantern, drawn with the
  // building canon's ink outline and lit faces (map_chunks.js building): the dome is the canon's «dome» roof. (x, y) is
  // the centre of the node's cell top; step is one hex in pixels; sq the floor's vertical squash. Returns its box.
  function hall(g, x, y, step, sq, H, live) {
    var F = H.T.FRONT_DOOR, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.rgbOf(H.T.NEUTRAL.paper);
    var wall = H.mix(H.rgbOf(F.cyan), paper, 0.35), roof = H.mix(H.rgbOf(F['FIRMADO.base']), paper, 0.15), gold = H.rgbOf(F['PROPUESTA.base'] || H.T.NEUTRAL.paper);
    g.save(); g.lineJoin = 'round'; g.strokeStyle = ink; g.lineWidth = Math.max(1, step * 0.035);
    function prism(cx, cy, rad, h, col) {
      var P = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; P.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a) * sq]); }
      for (i = 0; i < 6; i++) { var A = P[i], E = P[(i + 1) % 6]; if ((A[1] + E[1]) / 2 < cy) { continue; }
        g.fillStyle = H.css(H.shade(col, A[0] + E[0] < 2 * cx ? 0.95 : 0.72)); g.beginPath(); g.moveTo(A[0], A[1] - h); g.lineTo(E[0], E[1] - h); g.lineTo(E[0], E[1]); g.lineTo(A[0], A[1]); g.closePath(); g.fill(); g.stroke(); }
      g.fillStyle = H.css(H.shade(col, 1.1)); g.beginPath(); P.forEach(function (p, j) { g[j ? 'lineTo' : 'moveTo'](p[0], p[1] - h); }); g.closePath(); g.fill(); g.stroke();
      return cy - h;
    }
    var r1 = step * 0.8, h1 = step * 1.0, r2 = step * 0.54, h2 = step * 0.7;
    var inkc = H.rgbOf(H.T.NEUTRAL.ink); g.fillStyle = H.css(inkc.concat(46)); g.beginPath(); g.ellipse(x + r1 * 0.12, y + r1 * sq * 0.35, r1 * 1.2, r1 * sq * 0.95, 0, 0, 7); g.fill(); // a soft shadow
    var t1 = prism(x, y, r1, h1, wall);
    g.fillStyle = ink; g.beginPath(); var dw = r1 * 0.22, dy = y + r1 * sq * 0.5; g.moveTo(x - dw, dy); g.lineTo(x - dw, dy - h1 * 0.45); g.arc(x, dy - h1 * 0.45, dw, Math.PI, 0); g.lineTo(x + dw, dy); g.closePath(); g.fill(); // the door
    g.fillStyle = H.css(paper); [-0.62, 0.62].forEach(function (s) { g.fillRect(x + s * r1 * 0.75 - r1 * 0.08, y + r1 * sq * 0.25 - h1 * 0.72, r1 * 0.16, h1 * 0.22); });
    var t2 = prism(x, t1, r2, h2, H.shade(wall, 1.04));
    g.fillStyle = live ? H.css(gold) : H.css(H.shade(paper, 0.55)); [-0.55, 0, 0.55].forEach(function (s) { g.fillRect(x + s * r2 * 0.9 - r2 * 0.09, t1 + r2 * sq * 0.6 - h2 * 0.75, r2 * 0.18, h2 * 0.4); });
    g.fillStyle = H.css(roof); g.beginPath(); g.moveTo(x - r2 * 0.95, t2); for (var i = 0; i <= 16; i++) { var a = Math.PI + Math.PI * i / 16; g.lineTo(x + r2 * 0.95 * Math.cos(a), t2 + r2 * 0.8 * Math.sin(a)); } g.closePath(); g.fill(); g.stroke(); // the dome
    var ly = t2 - r2 * 0.8, lr = step * 0.09;
    if (live) { var gl = g.createRadialGradient(x, ly - lr, 1, x, ly - lr, step * 0.6); gl.addColorStop(0, H.css(gold.concat(210))); gl.addColorStop(1, H.css(gold.concat(0))); g.fillStyle = gl; g.beginPath(); g.arc(x, ly - lr, step * 0.6, 0, 7); g.fill(); }
    g.fillStyle = live ? H.css(gold) : H.css(H.shade(paper, 0.55)); g.beginPath(); g.arc(x, ly - lr, lr, 0, 7); g.fill(); g.stroke(); // the lantern
    var fy = ly - 5.2 * lr; g.beginPath(); g.moveTo(x, ly - 2 * lr); g.lineTo(x, fy); g.stroke();
    g.fillStyle = H.css(H.rgbOf(F.cyan)); g.beginPath(); g.moveTo(x, fy); g.quadraticCurveTo(x + 2.2 * lr, fy + 0.4 * lr, x + 3.4 * lr, fy + 0.9 * lr); g.lineTo(x, fy + 1.8 * lr); g.closePath(); g.fill(); g.stroke(); // Hexelion's pennant
    g.restore();
    return { x0: x - r1, x1: x + r1, y0: fy, y1: y + r1 * sq };
  }
  // wall(g, P, H, step): the territory's edge in ink, like a town wall (2026-11-15). P(q, r) → the hex's screen centre. A hex
  // corner is the mean of the three hexes that meet there, so the edge between A and its outside neighbour B runs between
  // (A + B + C1) / 3 and (A + B + C2) / 3, C1 and C2 their common neighbours: true under any tilt and turn of the view.
  var D = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  function edges(R) {
    var out = []; for (var d = 0; d <= R; d++) { (d ? ring(d) : [[0, 0]]).forEach(function (c) { if (d < R) { return; }
      D.forEach(function (v, i) { var b = [c[0] + v[0], c[1] + v[1]]; if (hexDist(b, [0, 0]) <= R) { return; }
        var u = D[(i + 5) % 6], w = D[(i + 1) % 6]; out.push([c, b, [c[0] + u[0], c[1] + u[1]], [c[0] + w[0], c[1] + w[1]]]); }); }); }
    return out;
  }
  function wall(g, P, H, step) {
    var ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), m = function (a, b, c) { return [(a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3]; };
    g.save(); g.strokeStyle = ink; g.lineCap = 'round'; g.lineWidth = Math.max(2, step * 0.09); g.beginPath();
    edges(TERR).forEach(function (e) { var A = P(e[0][0], e[0][1]), B = P(e[1][0], e[1][1]), p = m(A, B, P(e[2][0], e[2][1])), q = m(A, B, P(e[3][0], e[3][1])); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); });
    g.stroke(); g.restore();
  }
  var api = { edges: edges, wall: wall, TERR: TERR, RING: RING, SQUARE: SQUARE, TUTORIAL: TUTORIAL, ring: ring, slots: slots, plan: plan, hall: hall, hexDist: hexDist };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasTownPlan = api;
})(typeof window !== 'undefined' ? window : globalThis);
