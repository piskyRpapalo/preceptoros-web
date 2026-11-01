// P4 · the floor of the one map in 2.5D (odd/tasks/mapa-25d-aldea.md F3/F4, odd/tasks/fase-visual-openworld.md).
// The baked chunks (map_chunks.js) become isometric hex prisms under the colony, drawn by the ONE placement of
// colonia_pagina.js (geometry → cx, cy, k) and the same HexProjection, so a node stands on its own floor cell.
// Each visible chunk is first translated into a bubble frame under 1,024 bytes — its maths: light, sea waves, bands,
// counts and one sentence. The drawing is a function of (frame, cells, tick): no Math.random, no clock, no network.
// Colours come only from the house tokens (comic_tokens + palette_cycle); each band also has its own pattern, so
// colour is never the only cue. With prefers-reduced-motion the sea stands still.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var P = common ? require('./hex_projection.js') : root.HexProjection;
  var T = common ? require('./comic_tokens.js') : root.AtlasComicTokens;
  var PC = common ? require('./palette_cycle.js') : root.AtlasPaletteCycle;
  var HSTEP = 7, LIGHT = [-0.45, -0.6, 0.66], SEA = { amp: 2, len: 5, speed: 3 }, LIMIT = 1024;
  var NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

  function rgbOf(s) {
    var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(s);
    if (m) { return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]; }
    m = /(\d+)\D+(\d+)\D+(\d+)/.exec(s); return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
  }
  function mix(a, b, k) { return a.map(function (v, j) { return Math.round(v + (b[j] - v) * k); }); }
  function shade(c, f) { return c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); }); }
  function css(c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }

  // The four bands, from house tokens only: deep sea, sand, moss, rock. Each band keeps a pattern for non-colour reading.
  function bands() {
    var N = T.NEUTRAL, F = T.FRONT_DOOR, ocean = rgbOf(N.ocean), cyan = rgbOf(N.cyan), paper = rgbOf(N.paper);
    return [
      { h: 0, kind: 'water', pattern: 'waves', base: mix(ocean, cyan, 0.42) },
      { h: 1, kind: 'sand', pattern: 'dots', base: mix(paper, rgbOf(F['PROPUESTA.base']), 0.35) },
      { h: 2, kind: 'moss', pattern: 'hatch', base: mix(rgbOf(F['LIVE.base']), rgbOf(N.ink), 0.45) },
      { h: 3, kind: 'rock', pattern: 'cross', base: mix(rgbOf(F['NO_DATA.base']), rgbOf(N.ink), 0.25) }];
  }
  function bandOf(cell) { return cell[3] === 'water' ? 0 : Math.max(1, Math.min(3, cell[2])); }

  // frameOf(chunk, t, reduced) → the chunk's maths as a bubble frame (< 1,024 B): what the drawing will show, in text.
  function frameOf(chunk, t, reduced) {
    var n = [0, 0, 0, 0]; chunk.cells.forEach(function (c) { n[bandOf(c)]++; });
    var day = PC.palette(t, reduced).dia, B = bands();
    var f = { v: 'preceptoros.floor/1', c: chunk.c[0] + '_' + chunk.c[1], t: reduced ? PC.MEDIODIA : t, day: day,
      light: LIGHT, sea: reduced ? { amp: 0, len: SEA.len, speed: 0 } : SEA,
      bands: B.map(function (b, i) { return [b.kind, b.pattern, n[i]]; }),
      r: (chunk.frame && chunk.frame.t ? chunk.frame.t + ': ' : '') + n[0] + ' water, ' + n[1] + ' sand, ' + n[2] + ' moss, ' + n[3] + ' rock cells. Light from the north-west' + (reduced ? '; the sea stands still.' : '; the sea moves in slow waves.') };
    if (new TextEncoder().encode(JSON.stringify(f)).length >= LIMIT) { throw new Error('map_painter: floor frame over 1,024 bytes'); }
    return f;
  }

  // Cells of all loaded chunks, sorted back to front once (the projection is linear, so the order never changes).
  function cellsOf(chunks) {
    var all = [], h = {};
    Object.keys(chunks).sort().forEach(function (k) { chunks[k].cells.forEach(function (c) { all.push(c); h[c[0] + ',' + c[1]] = c; }); });
    all.sort(function (a, b) { var ya = 12 * a[0] + 24 * a[1], yb = 12 * b[0] + 24 * b[1]; return ya - yb || a[0] - b[0]; });
    return { list: all, at: h };
  }
  // orderAt(cells, G) → the cell list sorted back to front by the TURNED depth of the view angle (floor law step 3).
  // The projection and the turn are both linear, so one sort per angle is enough; it is kept until the angle changes.
  function orderAt(cells, G) {
    var deg = G.angle || 0;
    if (!deg) { return cells.list; }
    if (cells.deg === deg) { return cells.turned; }
    cells.turned = cells.list.slice().sort(function (a, b) {
      var pa = P(a[0], a[1]), pb = P(b[0], b[1]), ta = G.turn(pa.x, pa.y), tb = G.turn(pb.x, pb.y);
      return ta.y - tb.y || ta.x - tb.x || a[0] - b[0] || a[1] - b[1];
    });
    cells.deg = deg;
    return cells.turned;
  }
  function height(c) { return c[3] === 'water' ? 0 : c[2]; }

  // floor(g, G, world, t, reduced): paints the prisms; G = colonia_pagina geometry; world = { cells, frames }.
  function floor(g, G, world, t, reduced) {
    if (!world || !world.cells.list.length) { return 0; }
    var B = bands(), day = PC.palette(t, reduced).dia / 256, k = G.k, W = g.canvas.width, H = g.canvas.height, drawn = 0;
    var turn = G.turn || function (x, y) { return { x: x, y: y }; };   // the view orbit of colonia_pagina geometry()
    var corner = NB.map(function (d, i) { var e = NB[(i + 1) % 6], p = P(d[0] + e[0], d[1] + e[1]), r = turn(p.x, p.y); return [r.x / 3 * k, r.y / 3 * k]; });
    var wt = reduced ? 0 : t * SEA.speed, lod = k * 48 > 18, lit = 0.62 + 0.38 * day;
    g.save(); g.lineJoin = 'round';
    orderAt(world.cells, G).forEach(function (c) {
      var h0 = P(c[0], c[1]), p = turn(h0.x, h0.y), x = G.cx + p.x * k, y = G.cy + p.y * k;
      if (x < -60 * k || x > W + 60 * k || y < -60 * k || y > H + 90 * k) { return; }
      var b = B[bandOf(c)], hh = height(c), wave = b.kind === 'water' ? Math.round(SEA.amp * Math.sin((c[0] * 2 + c[1] * 3 + wt / 8) / SEA.len) * 10) / 10 : 0;
      var top = y - (hh * HSTEP + wave) * k, occl = 1;
      NB.forEach(function (d) { var o = world.cells.at[(c[0] + d[0]) + ',' + (c[1] + d[1])]; if (o && height(o) > hh) { occl -= 0.07; } });
      // Side faces: the three edges that face the viewer, shaded by their normal against the light.
      if (hh > 0) {
        for (var i = 0; i < 6; i++) {
          var a = corner[i], e = corner[(i + 1) % 6], nx = (a[1] + e[1]) / 2, ny = -(a[0] + e[0]) / 2;
          if ((a[1] + e[1]) / 2 <= 0) { continue; }
          var len = Math.sqrt(nx * nx + ny * ny) || 1, dot = Math.max(0, -(nx / len) * LIGHT[0] - (-(ny / len)) * LIGHT[1] * 0.4);
          g.fillStyle = css(shade(b.base, (0.38 + 0.4 * dot) * lit));
          g.beginPath(); g.moveTo(x + a[0], top + a[1]); g.lineTo(x + e[0], top + e[1]);
          g.lineTo(x + e[0], y + e[1]); g.lineTo(x + a[0], y + a[1]); g.closePath(); g.fill();
        }
      }
      g.beginPath(); corner.forEach(function (q, j) { if (j) { g.lineTo(x + q[0], top + q[1]); } else { g.moveTo(x + q[0], top + q[1]); } }); g.closePath();
      g.fillStyle = css(shade(b.base, (0.9 + 0.1 * LIGHT[2]) * lit * occl)); g.fill();
      g.strokeStyle = css(shade(b.base, 0.55 * lit)); g.lineWidth = Math.max(0.5, k * 0.6); g.stroke();
      if (lod) { pattern(g, b.pattern, x, top, k, b.base, lit, wt, c); }
      drawn++;
    });
    g.restore();
    return drawn;
  }
  function pattern(g, kind, x, y, k, base, lit, wt, c) {
    g.save(); g.strokeStyle = g.fillStyle = css(shade(base, kind === 'water' ? 1.7 * lit : 0.6 * lit)); g.lineWidth = Math.max(0.6, k * 0.8);
    var s = 7 * k;
    if (kind === 'water') {                                  // two short crests, drifting with the deterministic wave
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

  // The page's world: start(surface, onReady) loads the 7 chunks around the cabin and keeps them; describe() is the text.
  var world = null, said = '';
  function start(onReady, opts) {
    var L = root.AtlasMapChunks; if (!L) { said = 'Map floor: NO_DATA · map_chunks.js not loaded'; onReady && onReady(said); return; }
    L.load([0, 0], opts).then(function (r) {
      world = { cells: cellsOf(r.chunks), chunks: r.chunks };
      var n = Object.keys(r.chunks).length;
      said = n ? r.say + '. ' + frameOf(r.chunks[r.key] || r.chunks[Object.keys(r.chunks)[0]], 0, false).r : r.say;
      onReady && onReady(said);
    });
  }
  function draw(g, G, t, reduced) { return floor(g, G, world, Math.round(t) || 0, reduced === true); }

  var api = { frameOf: frameOf, cellsOf: cellsOf, orderAt: orderAt, floor: floor, bands: bands, start: start, draw: draw,
    world: function () { return world; }, describe: function () { return said; }, HSTEP: HSTEP };
  if (common) { module.exports = api; } else { root.AtlasMapPainter = api; }
})(typeof globalThis === 'object' ? globalThis : this);
