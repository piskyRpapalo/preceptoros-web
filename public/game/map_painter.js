// P4 · the 2.5D floor of the one map (odd/tasks/mapa-25d-aldea.md F3/F4): baked chunks become hex prisms, placed by
// colonia_pagina geometry (cx, cy, k, turn) + HexProjection. Each chunk is also a Acho frame < 1,024 B. Deterministic;
// house tokens only, a pattern per band (colour never the only cue); reduced motion: the sea stands still.
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

  // The four bands (sea, sand, moss, rock), house tokens only, each with a pattern.
  function bands() {
    var N = T.NEUTRAL, F = T.FRONT_DOOR, ocean = rgbOf(N.ocean), cyan = rgbOf(N.cyan), paper = rgbOf(N.paper);
    return [
      { h: 0, kind: 'water', pattern: 'waves', base: mix(ocean, cyan, 0.42) },
      { h: 1, kind: 'sand', pattern: 'dots', base: mix(paper, rgbOf(F['PROPUESTA.base']), 0.35) },
      { h: 2, kind: 'moss', pattern: 'hatch', base: mix(rgbOf(F['LIVE.base']), rgbOf(N.ink), 0.45) },
      { h: 3, kind: 'rock', pattern: 'cross', base: mix(rgbOf(F['NO_DATA.base']), rgbOf(N.ink), 0.25) }];
  }
  function bandOf(cell) { return cell[3] === 'water' ? 0 : Math.max(1, Math.min(3, cell[2])); }

  // frameOf(chunk, t, reduced) → the chunk's maths as a Acho frame (< 1,024 B).
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

  // Cells of all chunks, sorted back to front once at 0°.
  function cellsOf(chunks) {
    var all = [], h = {}, of = {};
    Object.keys(chunks).sort().forEach(function (k) { chunks[k].cells.forEach(function (c) { all.push(c); h[c[0] + ',' + c[1]] = c; of[c[0] + ',' + c[1]] = k; }); });
    all.sort(function (a, b) { var ya = 12 * a[0] + 24 * a[1], yb = 12 * b[0] + 24 * b[1]; return ya - yb || a[0] - b[0]; });
    return { list: all, at: h, chunkOf: of };
  }
  // orderAt(cells, G) → cells back to front by the TURNED depth; one sort per angle, kept until it changes.
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

  // corners(k, turn) → the six top corners of a prism at scale k, turned by the view orbit.
  function corners(k, turn) { return NB.map(function (d, i) { var e = NB[(i + 1) % 6], p = P(d[0] + e[0], d[1] + e[1]), r = turn ? turn(p.x, p.y) : p; return [r.x / 3 * k, r.y / 3 * k]; }); }
  function same(x, y) { return { x: x, y: y }; }
  function turnOf(G) { return G.turn || same; }
  function litOf(t, reduced) { return 0.62 + 0.38 * PC.palette(t, reduced).dia / 256; }
  // cell(g, c, x, y, o): one prism. o = { B, corner, k, lit, wt, lod, at, still }; still = baked (flat sea).
  function cell(g, c, x, y, o) {
    var b = o.B[bandOf(c)], hh = height(c), k = o.k;
    var wave = !o.still && b.kind === 'water' ? Math.round(SEA.amp * Math.sin((c[0] * 2 + c[1] * 3 + o.wt / 8) / SEA.len) * 10) / 10 : 0;
    var top = y - (hh * HSTEP + wave) * k, occl = 1, corner = o.corner;
    NB.forEach(function (d) { var n = o.at[(c[0] + d[0]) + ',' + (c[1] + d[1])]; if (n && height(n) > hh) { occl -= 0.07; } });
    // Side faces toward the viewer, shaded by normal against the light.
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

  // floor(g, G, world, t, reduced): the live path, every prism every frame.
  function floor(g, G, world, t, reduced) {
    if (!world || !world.cells.list.length) { return 0; }
    var k = G.k, W = g.canvas.width, H = g.canvas.height, drawn = 0, turn = turnOf(G);
    var o = { B: bands(), corner: corners(k, turn), k: k, lit: litOf(t, reduced), wt: reduced ? 0 : t * SEA.speed, lod: k * 48 > 18, at: world.cells.at, still: false };
    g.save(); g.lineJoin = 'round';
    orderAt(world.cells, G).forEach(function (c) {
      var h0 = P(c[0], c[1]), p = turn(h0.x, h0.y), x = G.cx + p.x * k, y = G.cy + p.y * k;
      if (x < -60 * k || x > W + 60 * k || y < -60 * k || y > H + 90 * k) { return; }
      cell(g, c, x, y, o); drawn++;
    });
    g.restore();
    return drawn;
  }

  // 3.5D · one ImageBitmap per (chunk, zoom bucket, angle, dpr), day + night; per frame only blits, sea crests and haze.
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
      // Open sea: water with no raised cell in front, so its crest never paints over a prism.
      if (c[3] === 'water' && ![[1, 0], [0, 1], [-1, 1]].some(function (d) { var n = at[(c[0] + d[0]) + ',' + (c[1] + d[1])]; return n && height(n) > 0; })) { open.push(c); }
    });
    world.groups = Object.keys(by).map(function (k) { var gr = by[k]; gr.order /= gr.cells.length; return gr; })
      .sort(function (a, b) { return a.order - b.order || (a.key < b.key ? -1 : 1); });
    world.open = open; world.edge = edge;
    return world.groups;
  }
  // bake(...) → { bmp, ox, oy, w, h, kb, x0, y0 }: one chunk at scale kb and the view angle (turned), flat sea.
  function bake(gr, world, kb, lit, env, turn, deg) {
    turn = turn || same;
    var corner = corners(kb, turn), reach = 0, b = boundsOf(gr, turn, deg);
    corner.forEach(function (q) { reach = Math.max(reach, Math.abs(q[0]), Math.abs(q[1])); });
    var mx = Math.ceil(reach + 2), mt = Math.ceil(reach + 3 * HSTEP * kb + 2), mb = Math.ceil(reach + 2);
    var w = Math.max(1, Math.ceil((b.x1 - b.x0) * kb) + 2 * mx), h = Math.max(1, Math.ceil((b.y1 - b.y0) * kb) + mt + mb);
    var surf = env.make(w, h), g = surf.getContext('2d');
    var o = { B: bands(), corner: corner, k: kb, lit: lit, wt: 0, lod: kb * 48 > 18, at: world.cells.at, still: true };
    g.lineJoin = 'round';
    b.order.forEach(function (c) { var p = P(c[0], c[1]), r = turn(p.x, p.y); cell(g, c, mx + (r.x - b.x0) * kb, mt + (r.y - b.y0) * kb, o); });
    cache.bakes++;
    var bmp = typeof surf.transferToImageBitmap === 'function' ? surf.transferToImageBitmap() : surf;
    return { bmp: bmp, ox: mx, oy: mt, w: w, h: h, kb: kb, x0: b.x0, y0: b.y0 };
  }
  // boundsOf(gr, turn, deg) → turned extent, mean depth and back-to-front cells; memoised per angle.
  function boundsOf(gr, turn, deg) {
    if (deg !== undefined && gr.bdeg === deg) { return gr.bnd; }
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, depth = 0, keyed = gr.cells.map(function (c) {
      var p = P(c[0], c[1]), r = turn(p.x, p.y);
      x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x); y0 = Math.min(y0, r.y); y1 = Math.max(y1, r.y); depth += r.y;
      return { c: c, x: r.x, y: r.y };
    });
    keyed.sort(function (a, b) { return a.y - b.y || a.x - b.x || a.c[0] - b.c[0] || a.c[1] - b.c[1]; });
    var out = { x0: x0, x1: x1, y0: y0, y1: y1, depth: depth / (gr.cells.length || 1), order: keyed.map(function (q) { return q.c; }) };
    if (deg !== undefined) { gr.bdeg = deg; gr.bnd = out; }
    return out;
  }
  function zoomBucket(k) { return Math.max(1, Math.round(k * 64)) / 64; }
  // floorBaked(g, G, world, t, reduced, env): blits the chunks, then draws only what moves.
  function floorBaked(g, G, world, t, reduced, env) {
    if (!world || !world.cells.list.length) { return 0; }
    var k = G.k, kb = zoomBucket(k), s = k / kb, lit = litOf(t, reduced), turn = turnOf(G);
    // The key carries the angle: a turn re-bakes (openworld_browser: baked = live at 120°).
    var ang = G.angle !== undefined ? G.angle : (Number(env.angle) || 0);
    var scope = kb + '|' + ang + '|' + (env.dpr || 1), mk = G.turn ? ang : 0;   // mk: bounds memo
    var groups = groupsOf(world).map(function (gr) { return { gr: gr, depth: boundsOf(gr, turn, mk).depth }; })
      .sort(function (a, b) { return a.depth - b.depth || (a.gr.key < b.gr.key ? -1 : 1); }).map(function (q) { return q.gr; });
    if (scope !== cache.scope) { cache.scope = scope; cache.map = {}; }
    var W = g.canvas.width, H = g.canvas.height, drawn = 0, dark = (1 - lit) / (1 - LIT_LO);
    groups.forEach(function (gr) {
      var e = cache.map[gr.key];
      if (e) { cache.hits++; } else {
        var keys = Object.keys(cache.map); if (keys.length >= LIMIT_BMP) { delete cache.map[keys[0]]; }
        // Day and night bakes; the frame's light is the night bitmap over the day one at alpha (no re-bake).
        e = cache.map[gr.key] = { hi: bake(gr, world, kb, 1, env, turn, mk), lo: bake(gr, world, kb, LIT_LO, env, turn, mk) };
      }
      var b = e.hi, dx = Math.round(G.cx + b.x0 * k - b.ox * s), dy = Math.round(G.cy + b.y0 * k - b.oy * s), dw = Math.round(b.w * s), dh = Math.round(b.h * s);
      if (dx > W || dy > H || dx + dw < 0 || dy + dh < 0) { return; }
      // Only the visible source rect is copied.
      var x0 = Math.max(0, dx), y0 = Math.max(0, dy), x1 = Math.min(W, dx + dw), y1 = Math.min(H, dy + dh);
      var sx = (x0 - dx) / s, sy = (y0 - dy) / s, sw = (x1 - x0) / s, sh = (y1 - y0) / s;
      if (dark < 0.995) { g.drawImage(b.bmp, sx, sy, sw, sh, x0, y0, x1 - x0, y1 - y0); }
      if (dark > 0.005) { g.globalAlpha = Math.min(1, dark); g.drawImage(e.lo.bmp, sx, sy, sw, sh, x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; }
      drawn += gr.cells.length;
    });
    live(g, G, world, t, reduced);
    return drawn;
  }
  // live(...): sea crests on open water and the data haze on the floor's edge.
  function live(g, G, world, t, reduced) {
    var k = G.k, W = g.canvas.width, H = g.canvas.height, wt = reduced ? 0 : t * SEA.speed, B = bands(), lit = litOf(t, reduced), turn = turnOf(G);
    g.save(); g.lineJoin = 'round';
    if (k * 48 > 18) {
      openAt(world, G).forEach(function (c) {
        var p = P(c[0], c[1]), r = turn(p.x, p.y), x = G.cx + r.x * k, y = G.cy + r.y * k;
        if (x < -20 * k || x > W + 20 * k || y < -20 * k || y > H + 20 * k) { return; }
        pattern(g, 'waves', x, y, k, B[0].base, lit, wt, c);
      });
    }
    haze(g, G, world.edge, t, reduced);
    g.restore();
  }
  // hazeAt(c, t, reduced) → null | { rise, alpha, glyph }: shows the fog state only, never changes it.
  var GLYPHS = ['plus', 'bar', 'ring'];
  function hazeAt(c, t, reduced) {
    var h = ((c[0] * 73856093) ^ (c[1] * 19349663)) >>> 0, period = 12;
    if (h % 3 !== 0) { return null; }
    var glyph = GLYPHS[(h >>> 3) % 3];
    if (reduced) { return { rise: 0, alpha: 0.25, glyph: glyph }; }
    var u = ((t + h % period) % period) / period;
    return { rise: u, alpha: 0.45 * Math.sin(Math.PI * u), glyph: glyph };
  }
  // openAt(world, G) → open sea at the view angle (front = turned depth).
  function openAt(world, G) {
    var deg = G.angle || 0, turn = turnOf(G);
    if (!deg) { return world.open; }
    if (world.openDeg === deg) { return world.openTurned; }
    var at = world.cells.at, front = NB.filter(function (d) { var p = P(d[0], d[1]); return turn(p.x, p.y).y > 1e-6; });
    world.openTurned = world.cells.list.filter(function (c) {
      return c[3] === 'water' && !front.some(function (d) { var n = at[(c[0] + d[0]) + ',' + (c[1] + d[1])]; return n && height(n) > 0; });
    });
    world.openDeg = deg;
    return world.openTurned;
  }
  function haze(g, G, edge, t, reduced) {
    var turn = turnOf(G), k = G.k, N = T.NEUTRAL, col = css(mix(rgbOf(N.paper), rgbOf(N.cyan), 0.35));
    g.strokeStyle = col; g.lineWidth = Math.max(0.8, k * 0.9);
    edge.forEach(function (c) {
      var q = hazeAt(c, t, reduced); if (!q || q.alpha <= 0.02) { return; }
      var p0 = P(c[0], c[1]), p = turn(p0.x, p0.y), x = G.cx + p.x * k, y = G.cy + p.y * k - (height(c) * HSTEP + 4 + q.rise * 22) * k, r = 2.2 * k;
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

  // start(onReady, opts) loads the 7 chunks around the cabin; describe() is the text.
  var world = null, said = '', detail = '';
  function start(onReady, opts) {
    var L = root.AtlasMapChunks; if (!L) { said = 'The map has not loaded.'; detail = 'Map floor: NO_DATA · map_chunks.js not loaded'; onReady && onReady(said, detail); return; }
    L.load([0, 0], opts).then(function (r) {
      world = { cells: cellsOf(r.chunks), chunks: r.chunks };
      var n = Object.keys(r.chunks).length;
      said = r.say + '.';
      detail = n ? r.detail + '. ' + frameOf(r.chunks[r.key] || r.chunks[Object.keys(r.chunks)[0]], 0, false).r : r.detail;
      onReady && onReady(said, detail);
    });
  }
  // envOf(g) → offscreen maker; null in node or when forced live.
  var forceLive = false;
  function envOf(g) {
    if (forceLive) { return null; }
    var O = root.OffscreenCanvas, d = root.document, c = g.canvas || {};
    var make = O ? function (w, h) { return new O(w, h); } : (d ? function (w, h) { var x = d.createElement('canvas'); x.width = w; x.height = h; return x; } : null);
    if (!make) { return null; }
    return { make: make, angle: Number(c.dataset && c.dataset.angle) || 0, dpr: root.devicePixelRatio || 1 };
  }
  // worthBaking(G): measured 2026-11-01 (390 px, CPU 4×): bake at zoom ≤ 1; past BAKE_MAX_SIDE draw live.
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
    // Orbit: bake only at rest angles (multiples of 60°); twist and tween frames draw live.
    var rest = ((G.angle || 0) % 60) === 0;
    if (e && (forceBake || (rest && worthBaking(G)))) { lastMode = 'baked'; return floorBaked(g, G, world, tt, reduced === true, e); }
    lastMode = 'live'; var n = floor(g, G, world, tt, reduced === true);
    if (world && world.cells.list.length) { groupsOf(world); haze(g, G, world.edge, tt, reduced === true); }
    return n;
  }

  var api = { frameOf: frameOf, cellsOf: cellsOf, orderAt: orderAt, floor: floor, floorBaked: floorBaked, hazeAt: hazeAt, bands: bands, start: start, draw: draw,
    cacheStats: function () { return { mode: lastMode, bakes: cache.bakes, hits: cache.hits, size: Object.keys(cache.map).length, scope: cache.scope }; },
    resetCache: function () { cache = { scope: '', map: {}, bakes: 0, hits: 0 }; }, setLive: function (on) { forceLive = on === true; }, setBake: function (on) { forceBake = on === true; },
    color: { rgbOf: rgbOf, mix: mix, shade: shade, css: css },
    world: function () { return world; }, describe: function () { return said; }, HSTEP: HSTEP };
  if (common) { module.exports = api; } else { root.AtlasMapPainter = api; }
})(typeof globalThis === 'object' ? globalThis : this);
