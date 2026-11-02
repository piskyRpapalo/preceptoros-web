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
    var all = [], h = {}, of = {};
    Object.keys(chunks).sort().forEach(function (k) { chunks[k].cells.forEach(function (c) { all.push(c); h[c[0] + ',' + c[1]] = c; of[c[0] + ',' + c[1]] = k; }); });
    all.sort(function (a, b) { var ya = 12 * a[0] + 24 * a[1], yb = 12 * b[0] + 24 * b[1]; return ya - yb || a[0] - b[0]; });
    return { list: all, at: h, chunkOf: of };
  }
  function height(c) { return c[3] === 'water' ? 0 : c[2]; }

  // corners(k) → the six top corners of one hex prism at scale k (relative to its centre).
  function corners(k) { return NB.map(function (d, i) { var e = NB[(i + 1) % 6], p = P(d[0] + e[0], d[1] + e[1]); return [p.x / 3 * k, p.y / 3 * k]; }); }
  function litOf(t, reduced) { return 0.62 + 0.38 * PC.palette(t, reduced).dia / 256; }
  // cell(g, c, x, y, o): one prism. o = { B, corner, k, lit, wt, lod, at, still }. still: the baked pass (flat sea, no crests).
  function cell(g, c, x, y, o) {
    var b = o.B[bandOf(c)], hh = height(c), k = o.k;
    var wave = !o.still && b.kind === 'water' ? Math.round(SEA.amp * Math.sin((c[0] * 2 + c[1] * 3 + o.wt / 8) / SEA.len) * 10) / 10 : 0;
    var top = y - (hh * HSTEP + wave) * k, occl = 1, corner = o.corner;
    NB.forEach(function (d) { var n = o.at[(c[0] + d[0]) + ',' + (c[1] + d[1])]; if (n && height(n) > hh) { occl -= 0.07; } });
    // Side faces: the three edges that face the viewer, shaded by their normal against the light.
    if (hh > 0) {
      for (var i = 0; i < 6; i++) {
        var a = corner[i], e = corner[(i + 1) % 6], nx = (a[1] + e[1]) / 2, ny = -(a[0] + e[0]) / 2;
        if ((a[1] + e[1]) / 2 <= 0) { continue; }
        var len = Math.sqrt(nx * nx + ny * ny) || 1, dot = Math.max(0, -(nx / len) * LIGHT[0] - (-(ny / len)) * LIGHT[1] * 0.4);
        g.fillStyle = css(shade(b.base, (0.38 + 0.4 * dot) * o.lit));
        g.beginPath(); g.moveTo(x + a[0], top + a[1]); g.lineTo(x + e[0], top + e[1]);
        g.lineTo(x + e[0], y + e[1]); g.lineTo(x + a[0], y + a[1]); g.closePath(); g.fill();
      }
    }
    g.beginPath(); corner.forEach(function (q, j) { if (j) { g.lineTo(x + q[0], top + q[1]); } else { g.moveTo(x + q[0], top + q[1]); } }); g.closePath();
    g.fillStyle = css(shade(b.base, (0.9 + 0.1 * LIGHT[2]) * o.lit * occl)); g.fill();
    g.strokeStyle = css(shade(b.base, 0.55 * o.lit)); g.lineWidth = Math.max(0.5, k * 0.6); g.stroke();
    if (o.lod && !(o.still && b.kind === 'water')) { pattern(g, b.pattern, x, top, k, b.base, o.lit, o.wt, c); }
  }

  // floor(g, G, world, t, reduced): the live path — every prism, every frame; G = colonia_pagina geometry.
  function floor(g, G, world, t, reduced) {
    if (!world || !world.cells.list.length) { return 0; }
    var k = G.k, W = g.canvas.width, H = g.canvas.height, drawn = 0;
    var o = { B: bands(), corner: corners(k), k: k, lit: litOf(t, reduced), wt: reduced ? 0 : t * SEA.speed, lod: k * 48 > 18, at: world.cells.at, still: false };
    g.save(); g.lineJoin = 'round';
    world.cells.list.forEach(function (c) {
      var p = P(c[0], c[1]), x = G.cx + p.x * k, y = G.cy + p.y * k;
      if (x < -60 * k || x > W + 60 * k || y < -60 * k || y > H + 90 * k) { return; }
      cell(g, c, x, y, o); drawn++;
    });
    g.restore();
    return drawn;
  }

  // 3.5D · OFFSCREEN BAKING. The static floor of each chunk is drawn ONCE per (chunk, zoom bucket, light bucket,
  // angle, dpr) into an offscreen canvas and kept as an ImageBitmap; each frame only blits. The live sea crests and the
  // data haze are the only per-frame strokes. Render only (P5): what is revealed never depends on the cache.
  var cache = { scope: '', map: {}, bakes: 0, hits: 0 }, LIMIT_BMP = 14, LIT_LO = 0.62;
  function groupsOf(world) {
    if (world.groups) { return world.groups; }
    var by = {}, open = [], edge = [];
    world.cells.list.forEach(function (c) {
      var key = world.cells.chunkOf ? world.cells.chunkOf[c[0] + ',' + c[1]] : 'all', gr = by[key];
      if (!gr) { gr = by[key] = { key: key, cells: [], x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, order: 0 }; }
      var p = P(c[0], c[1]); gr.cells.push(c); gr.order += 12 * c[0] + 24 * c[1];
      gr.x0 = Math.min(gr.x0, p.x); gr.x1 = Math.max(gr.x1, p.x); gr.y0 = Math.min(gr.y0, p.y); gr.y1 = Math.max(gr.y1, p.y);
      var at = world.cells.at, missing = NB.some(function (d) { return !at[(c[0] + d[0]) + ',' + (c[1] + d[1])]; });
      if (missing) { edge.push(c); }
      // Open sea: a water cell with no raised cell in front of it, so its live crest never paints over a prism.
      if (c[3] === 'water' && ![[1, 0], [0, 1], [-1, 1]].some(function (d) { var n = at[(c[0] + d[0]) + ',' + (c[1] + d[1])]; return n && height(n) > 0; })) { open.push(c); }
    });
    world.groups = Object.keys(by).map(function (k) { var gr = by[k]; gr.order /= gr.cells.length; return gr; })
      .sort(function (a, b) { return a.order - b.order || (a.key < b.key ? -1 : 1); });
    world.open = open; world.edge = edge;
    return world.groups;
  }
  // bake(gr, world, kb, lit, env) → { bmp, ox, oy, w, h, kb }: one chunk's prisms at scale kb, flat sea, on a fresh surface.
  function bake(gr, world, kb, lit, env) {
    var corner = corners(kb), reach = 0;
    corner.forEach(function (q) { reach = Math.max(reach, Math.abs(q[0]), Math.abs(q[1])); });
    var mx = Math.ceil(reach + 2), mt = Math.ceil(reach + 3 * HSTEP * kb + 2), mb = Math.ceil(reach + 2);
    var w = Math.max(1, Math.ceil((gr.x1 - gr.x0) * kb) + 2 * mx), h = Math.max(1, Math.ceil((gr.y1 - gr.y0) * kb) + mt + mb);
    var surf = env.make(w, h), g = surf.getContext('2d');
    var o = { B: bands(), corner: corner, k: kb, lit: lit, wt: 0, lod: kb * 48 > 18, at: world.cells.at, still: true };
    g.lineJoin = 'round';
    gr.cells.forEach(function (c) { var p = P(c[0], c[1]); cell(g, c, mx + (p.x - gr.x0) * kb, mt + (p.y - gr.y0) * kb, o); });
    cache.bakes++;
    var bmp = typeof surf.transferToImageBitmap === 'function' ? surf.transferToImageBitmap() : surf;
    return { bmp: bmp, ox: mx, oy: mt, w: w, h: h, kb: kb };
  }
  function zoomBucket(k) { return Math.max(1, Math.round(k * 64)) / 64; }
  // floorBaked(g, G, world, t, reduced, env): blits the baked chunks, then draws only what moves. env = { make, angle, dpr }.
  function floorBaked(g, G, world, t, reduced, env) {
    if (!world || !world.cells.list.length) { return 0; }
    var groups = groupsOf(world), k = G.k, kb = zoomBucket(k), s = k / kb, lit = litOf(t, reduced);
    var scope = kb + '|' + (env.angle || 0) + '|' + (env.dpr || 1);
    if (scope !== cache.scope) { cache.scope = scope; cache.map = {}; }            // zoom, angle or dpr changed: invalidate
    var W = g.canvas.width, H = g.canvas.height, drawn = 0, dark = (1 - lit) / (1 - LIT_LO);
    groups.forEach(function (gr) {
      var e = cache.map[gr.key];
      if (e) { cache.hits++; } else {
        var keys = Object.keys(cache.map); if (keys.length >= LIMIT_BMP) { delete cache.map[keys[0]]; }
        // Two bakes per chunk: full day and deepest night. Shading is linear in the light, so the frame's light is the
        // night bitmap laid over the day one at alpha (1 − lit) / (1 − night): no re-bake as the day turns.
        e = cache.map[gr.key] = { hi: bake(gr, world, kb, 1, env), lo: bake(gr, world, kb, LIT_LO, env) };
      }
      var b = e.hi, dx = Math.round(G.cx + gr.x0 * k - b.ox * s), dy = Math.round(G.cy + gr.y0 * k - b.oy * s), dw = Math.round(b.w * s), dh = Math.round(b.h * s);
      if (dx > W || dy > H || dx + dw < 0 || dy + dh < 0) { return; }
      // Only the visible part of the bitmap is copied (source rect clipped to the canvas): fill cost follows the screen.
      var x0 = Math.max(0, dx), y0 = Math.max(0, dy), x1 = Math.min(W, dx + dw), y1 = Math.min(H, dy + dh);
      var sx = (x0 - dx) / s, sy = (y0 - dy) / s, sw = (x1 - x0) / s, sh = (y1 - y0) / s;
      if (dark < 0.995) { g.drawImage(b.bmp, sx, sy, sw, sh, x0, y0, x1 - x0, y1 - y0); }
      if (dark > 0.005) { g.globalAlpha = Math.min(1, dark); g.drawImage(e.lo.bmp, sx, sy, sw, sh, x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; }
      drawn += gr.cells.length;
    });
    live(g, G, world, t, reduced);
    return drawn;
  }
  // live(g, G, world, t, reduced): the moving layer — sea crests on open water and the data haze on the floor's edge.
  function live(g, G, world, t, reduced) {
    var k = G.k, W = g.canvas.width, H = g.canvas.height, wt = reduced ? 0 : t * SEA.speed, B = bands(), lit = litOf(t, reduced);
    g.save(); g.lineJoin = 'round';
    if (k * 48 > 18) {
      world.open.forEach(function (c) {
        var p = P(c[0], c[1]), x = G.cx + p.x * k, y = G.cy + p.y * k;
        if (x < -20 * k || x > W + 20 * k || y < -20 * k || y > H + 20 * k) { return; }
        pattern(g, 'waves', x, y, k, B[0].base, lit, wt, c);
      });
    }
    haze(g, G, world.edge, t, reduced);
    g.restore();
  }
  // hazeAt(c, t, reduced) → null or { rise, alpha, glyph }: a deterministic particle over one edge cell of the revealed floor.
  // It shows the fog STATE only; it never reads or changes what is revealed. Reduced motion: still, faint, no rise.
  var GLYPHS = ['plus', 'bar', 'ring'];
  function hazeAt(c, t, reduced) {
    var h = ((c[0] * 73856093) ^ (c[1] * 19349663)) >>> 0, period = 12;
    if (h % 3 !== 0) { return null; }
    var glyph = GLYPHS[(h >>> 3) % 3];
    if (reduced) { return { rise: 0, alpha: 0.25, glyph: glyph }; }
    var u = ((t + h % period) % period) / period;
    return { rise: u, alpha: 0.45 * Math.sin(Math.PI * u), glyph: glyph };
  }
  function haze(g, G, edge, t, reduced) {
    var k = G.k, N = T.NEUTRAL, col = css(mix(rgbOf(N.paper), rgbOf(N.cyan), 0.35));
    g.strokeStyle = col; g.lineWidth = Math.max(0.8, k * 0.9);
    edge.forEach(function (c) {
      var q = hazeAt(c, t, reduced); if (!q || q.alpha <= 0.02) { return; }
      var p = P(c[0], c[1]), x = G.cx + p.x * k, y = G.cy + p.y * k - (height(c) * HSTEP + 4 + q.rise * 22) * k, r = 2.2 * k;
      g.globalAlpha = q.alpha; g.beginPath();
      if (q.glyph === 'plus') { g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); }
      else if (q.glyph === 'bar') { g.moveTo(x, y - r * 1.3); g.lineTo(x, y + r * 1.3); }
      else { g.arc(x, y, r, 0, 6.283); }
      g.stroke();
    });
    g.globalAlpha = 1;
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
  // env(g) → how this browser makes an offscreen surface; null in node or when forced live (setLive, the bench).
  var forceLive = false;
  function envOf(g) {
    if (forceLive) { return null; }
    var O = root.OffscreenCanvas, d = root.document, c = g.canvas || {};
    var make = O ? function (w, h) { return new O(w, h); } : (d ? function (w, h) { var x = d.createElement('canvas'); x.width = w; x.height = h; return x; } : null);
    if (!make) { return null; }
    return { make: make, angle: (c.dataset && c.dataset.angle) || 0, dpr: root.devicePixelRatio || 1 };
  }
  // worthBaking(G) → the measured policy (2026-11-01, 390 px, CPU 4×): blits win at zoom 0.6 and 1; zoomed in to 3 the
  // chunk bitmaps grow past BAKE_MAX_SIDE, the medians tie and the bitmaps would only cost memory, so the live path draws.
  var BAKE_MAX_SIDE = 2048;
  function worthBaking(G) {
    if (!world || !world.cells.list.length) { return false; }
    var side = 0;
    groupsOf(world).forEach(function (gr) { side = Math.max(side, (gr.x1 - gr.x0) * G.k, (gr.y1 - gr.y0) * G.k); });
    return side <= BAKE_MAX_SIDE;
  }
  var lastMode = 'live', forceBake = false;
  function draw(g, G, t, reduced) {
    var e = envOf(g), tt = Math.round(t) || 0;
    if (e && (forceBake || worthBaking(G))) { lastMode = 'baked'; return floorBaked(g, G, world, tt, reduced === true, e); }
    lastMode = 'live'; var n = floor(g, G, world, tt, reduced === true);
    if (world && world.cells.list.length) { groupsOf(world); haze(g, G, world.edge, tt, reduced === true); }
    return n;
  }

  var api = { frameOf: frameOf, cellsOf: cellsOf, floor: floor, floorBaked: floorBaked, hazeAt: hazeAt, bands: bands, start: start, draw: draw,
    cacheStats: function () { return { mode: lastMode, bakes: cache.bakes, hits: cache.hits, size: Object.keys(cache.map).length, scope: cache.scope }; },
    resetCache: function () { cache = { scope: '', map: {}, bakes: 0, hits: 0 }; }, setLive: function (on) { forceLive = on === true; }, setBake: function (on) { forceBake = on === true; },
    color: { rgbOf: rgbOf, mix: mix, shade: shade, css: css },
    world: function () { return world; }, describe: function () { return said; }, HSTEP: HSTEP };
  if (common) { module.exports = api; } else { root.AtlasMapPainter = api; }
})(typeof globalThis === 'object' ? globalThis : this);
