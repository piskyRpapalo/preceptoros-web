// Pieza 2 · el mapa vivo (odd/tasks/mapa-vivo.md, 2026-11-03). Loaded on demand by world_feed.js with the first good
// heartbeat: a map with nothing alive pays nothing. Three things, each an Acho frame under 1,024 B with its sentence and
// its declared sound. (A) The seal stamped over each node sealed LIVE or STALE (never the tutorial cabin). (B) The
// seven floor cells of that node woken by its heartbeat: rim and pattern, never colour alone; the heartbeat carries no
// terrain, so the baked floor stays the floor. (C) The State buoy, cared for by every good heartbeat read: its Proof
// of Tick is { nace_tic, cuidado_tic, t }, three integers anyone can replay with estado(). No clock, no Math.random.
(function (root) {
  'use strict';
  var LIMIT = 1024, SHOWN = { LIVE: 1, STALE: 1 }, NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  var BX = 60, BY = 84, CV = [120, 110];   // the box of colonia_pagina; a node stands on floor cell (2q, 2r)
  // A LIVE seal beats: its wave draws the beat and sounds it (acho_sonify reads h, after a gesture). STALE does not.
  var PULSO = [[1, 5, 5, 0], [3, 2, 1, 0]];
  // The buoy law (FIRMO 2026-10-12, reef_building_lifecycle at 2ef43155). One tick = one heartbeat read: the page
  // cycle stops under reduced motion and the basic terminal draws at t = 0, so the reads are the only tick both share.
  var BOYA = { esquema: 'preceptoros.edificio/1', id: 'boya-estado', tipo: 'boya', madura_tics: 1, desgaste_por_tic: 300 };
  var BUOY = [[1, 10, 7, 0], [4, 1, 1, 0]];
  var common = typeof module === 'object' && module.exports;
  function hp() { return root.HexProjection || (common ? require('./hex_projection.js') : null); }

  function size(f) { return new TextEncoder().encode(JSON.stringify(f)).length; }
  function guard(f) { var n = size(f); if (n >= LIMIT) { throw new Error('frame ' + f.id + ' is ' + n + ' B (>= 1024)'); } return f; }
  function frame(id, t, seal, k, r, i, bands, sound, cause, extra) {
    var f = { v: 'preceptoros.acho/1', id: id, t: t, cv: CV, seal: seal, atoms: [{ k: k, r: r, i: i }], bands: bands, change: [r], sound: sound, soundCause: cause };
    if (extra) { Object.keys(extra).forEach(function (key) { f[key] = extra[key]; }); }
    return guard(f);
  }
  function entero(v, a, b) { return typeof v === 'number' && Math.floor(v) === v && v >= a && v <= b; }

  // estado(m, t): the buoy law, pure. naciendo → vivo → gastado → NO_DATA with its cause; never «0».
  function estado(m, t) {
    if (!m || m.esquema !== BOYA.esquema || !entero(m.nace_tic, 0, 1e9) || !entero(m.madura_tics, 0, 1e6) || !entero(m.desgaste_por_tic, 0, 1000) ||
      (m.cuidado_tic != null && !entero(m.cuidado_tic, m.nace_tic, 1e9))) { return { fase: 'NO_DATA', causa: 'manifest' }; }
    if (!entero(t, 0, 1e9)) { return { fase: 'NO_DATA', causa: 'cycle not measured' }; }
    if (t < m.nace_tic) { return { fase: 'NO_DATA', causa: 'not born yet (cycle ' + m.nace_tic + ')' }; }
    var edad = t - m.nace_tic, sin = t - (m.cuidado_tic != null ? m.cuidado_tic : m.nace_tic), gasto = Math.min(1000, sin * m.desgaste_por_tic);
    if (gasto >= 1000) { return { fase: 'NO_DATA', edad: edad, causa: 'unattended ' + sin + ' cycles' }; }
    return { fase: edad < m.madura_tics ? 'naciendo' : (gasto >= 600 ? 'gastado' : 'vivo'), edad: edad, vida: 1000 - gasto };
  }

  // (A) the seal of one node, over its hex. LIVE beats (still under reduced motion); STALE never does.
  function stampFrame(id, seal, t, reducido) {
    var late = seal === 'LIVE' && !reducido, y = BY - 64 + (late ? [0, -2, -3, -2][((t % 4) + 4) % 4] : 0);
    var r = 'seal ' + seal + ' · ' + id + ' · ' + (seal === 'LIVE' ? 'its heartbeat answers' : 'its heartbeat is late') + (late ? ' · beating' : ' · still');
    var i = [{ o: 'ribbon', pts: [[BX - 34, y - 11], [BX + 34, y - 11], [BX + 34, y + 11], [BX - 34, y + 11]], closed: true, f: seal + '.base', s: 'ink', lw: seal === 'LIVE' ? 2.5 : 1.5 },
      { o: 'text', x: BX + 9, y: y + 4, tx: seal, sz: 12 }];
    if (seal === 'LIVE') { i.push({ o: 'wave', x: BX - 22, y: y, sc: 1, h: PULSO }); }
    return frame('seal-' + id, t, seal, 'seal.' + seal, r, i, [seal + '.base', 'ink', 'paper'],
      seal === 'LIVE' ? 'ok' : 'NO_DATA: a STALE seal does not beat', seal === 'LIVE' ? 'the heartbeat wave' : 'no answer in the last read');
  }

  // (C) the State buoy from the heartbeat record { t, nace, cuidado } of world_feed.js. Size is measured life; NO_DATA hollow.
  function buoyFrame(reg) {
    var m = { esquema: BOYA.esquema, nace_tic: reg.nace, cuidado_tic: reg.cuidado, madura_tics: BOYA.madura_tics, desgaste_por_tic: BOYA.desgaste_por_tic };
    var e = estado(m, reg.t), nd = e.fase === 'NO_DATA', sc = nd ? 0.8 : 0.6 + e.vida / 2500;
    var r = 'State buoy · ' + (nd ? 'NO_DATA · ' + e.causa : e.fase + ' · life ' + e.vida + '/1000') + ' · born tick ' + reg.nace + ' · cared tick ' + reg.cuidado + ' · now tick ' + reg.t + ' · Proof of Tick';
    var body = { o: 'wave', x: BX, y: BY - 14, sc: sc, h: BUOY, s: nd ? 'NO_DATA.base' : 'ink', lw: nd ? 1.5 : 2.5 };
    if (!nd) { body.f = e.fase === 'gastado' ? 'STALE.base' : e.fase === 'naciendo' ? 'paper' : 'LIVE.base'; }
    var i = [{ o: 'ribbon', pts: [[BX, BY - 14 - 7 * sc], [BX, BY - 40]], closed: false, s: 'ink', lw: 2 },
      { o: 'ribbon', pts: [[BX, BY - 40], [BX + 12, BY - 35], [BX, BY - 30]], closed: true, f: nd ? 'paper' : 'cyan', s: 'ink', lw: 1.5 }, body];
    return frame(BOYA.id, reg.t, nd ? 'NO_DATA' : e.fase === 'gastado' ? 'STALE' : 'LIVE', 'buoy.' + e.fase, r, i, ['ink', 'paper', 'cyan'],
      nd ? 'NO_DATA: the buoy is unattended' : 'ok', nd ? e.causa : 'the buoy wave', { prueba: { nace_tic: reg.nace, cuidado_tic: reg.cuidado, t: reg.t } });
  }

  // scene(tiles, seals, t, reducido, reg) → { marks, ground, frases }. marks: [{ id, x, y, frame }] in scene units (a seal
  // over each shown node, the buoy beside the tutorial cabin); ground: the nodes to wake, drawn by ground().
  function scene(tiles, seals, t, reducido, reg) {
    var marks = [], ground = [], frases = [];
    tiles.forEach(function (n) {
      var seal = seals[n.id], f;
      if (n.id === 'cabin' || !SHOWN[seal]) { return; }
      try { f = stampFrame(n.id, seal, t, reducido); } catch (e) { frases.push('seal of ' + n.id + ' · NO_DATA · ' + e.message); return; }
      marks.push({ id: f.id, x: n.x, y: n.y, frame: f }); frases.push(f.atoms[0].r);
      ground.push({ id: n.id, q: n.q, r: n.r, seal: seal });
      frases.push('ground of ' + n.id + ' · ' + (seal === 'LIVE' ? 'awake by its heartbeat' : 'dimmed, its heartbeat is late') + ' · ' + seal + ' · 7 cells');
    });
    var cabin = tiles.filter(function (n) { return n.id === 'cabin'; })[0];
    if (cabin && reg && entero(reg.nace, 0, 1e9) && entero(reg.t, 0, 1e9)) {
      var b;
      try { b = buoyFrame(reg); } catch (e) { frases.push('State buoy · NO_DATA · ' + e.message); return { marks: marks, ground: ground, frases: frases }; }
      marks.push({ id: b.id, x: cabin.x - 44, y: cabin.y + 14, frame: b }); frases.push(b.atoms[0].r);
    }
    return { marks: marks, ground: ground, frases: frases };
  }

  // groundFrame(n, G, at, step) → one frame in canvas pixels, turned with the view: the outline of the node's seven floor
  // cells (18 corners, each on its own cell's top) and the rim of the node's own cell. Seven full rims weigh 1,262 B; the
  // outline says the same under 1,024. LIVE: thick outline and a full rim. STALE: thin outline and half an open rim.
  function groundFrame(n, G, at, step) {
    var HP = hp(), k = G.k, i = [], seen = {}, cq = 2 * n.q, cr = 2 * n.r;
    var c0 = HP(cq, cr);
    [[0, 0]].concat(NB).forEach(function (d) {
      var q = cq + d[0], r = cr + d[1], c = at[q + ',' + r], h = c && c[3] !== 'water' ? c[2] : 0, p = HP(q, r);
      NB.forEach(function (a, j) {
        var b = NB[(j + 1) % 6], o = HP(a[0] + b[0], a[1] + b[1]), x = p.x + o.x / 3, y = p.y + o.y / 3, key = Math.round(x) + ',' + Math.round(y);
        var s = seen[key] || (seen[key] = { x: x, y: y, h: h, n: 0, mine: false });
        s.n++; if (!d[0] && !d[1]) { s.mine = true; s.j = j; }
      });
    });
    var px = function (s) { var w = G.turn(s.x, s.y); return [Math.round(G.cx + w.x * k), Math.round(G.cy + (w.y - s.h * step) * k)]; };
    var all = Object.keys(seen).map(function (key) { return seen[key]; });
    var edge = all.filter(function (s) { return s.n < 3; }).sort(function (a, b) { return Math.atan2(a.y - c0.y, a.x - c0.x) - Math.atan2(b.y - c0.y, b.x - c0.x); }).map(px);
    var own = all.filter(function (s) { return s.mine; }).sort(function (a, b) { return a.j - b.j; }).map(px);
    i.push({ o: 'ribbon', pts: edge, closed: true, s: n.seal + '.base', lw: n.seal === 'LIVE' ? 3 : 1.5 });
    if (n.seal === 'LIVE') { i.push({ o: 'ribbon', pts: own, closed: true, s: 'LIVE.base', lw: 2 }); }
    else { i.push({ o: 'ribbon', pts: own.slice(0, 4), closed: false, s: 'STALE.base', lw: 2 }); }   // half a rim: open, never closed
    var r0 = 'ground of ' + n.id + ' · ' + (n.seal === 'LIVE' ? 'awake by its heartbeat' : 'dimmed, its heartbeat is late') + ' · ' + n.seal + ' · 7 cells';
    return frame('ground-' + n.id, 0, n.seal, 'ground.' + n.seal, r0, i, [n.seal + '.base', 'ink'],
      'NO_DATA: the ground declares no wave; its seal sounds', 'the stamp of ' + n.id + ' carries the sound');
  }

  // ground(g, G, nodes): paints the woken cells under every layer (colonia_pagina draws it right after the floor).
  function ground(g, G, nodes) {
    var MP = root.AtlasMapPainter, B = root.AtlasAcho, P = root.AtlasComicAtoms, w = MP && MP.world ? MP.world() : null;
    if (!hp() || !B || !P || !nodes.length) { return 0; }
    var at = w && w.cells ? w.cells.at : {}, step = MP && MP.HSTEP ? MP.HSTEP : 7;
    var W = g.canvas ? g.canvas.width : 4096, H = g.canvas ? g.canvas.height : 4096, drawn = 0;
    nodes.forEach(function (n) {
      // Off the canvas, nothing is drawn (and nothing weighs); a frame over the law is skipped, never painted.
      var p0 = hp()(2 * n.q, 2 * n.r), w = G.turn(p0.x, p0.y), x = G.cx + w.x * G.k, y = G.cy + w.y * G.k, pad = 60 * G.k;
      if (x < -pad || x > W + pad || y < -pad || y > H + pad) { return; }
      try { var f = groundFrame(n, G, at, step); g.save(); P.paint(g, B.compile(f)); g.restore(); drawn++; } catch (e) { n.causa = e.message; }
    });
    return drawn;
  }

  var AtlasLatidoVivo = { BOYA: BOYA, estado: estado, stampFrame: stampFrame, buoyFrame: buoyFrame, groundFrame: groundFrame, scene: scene, ground: ground, size: size };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasLatidoVivo; } else { root.AtlasLatidoVivo = AtlasLatidoVivo; }
})(typeof globalThis === 'object' ? globalThis : this);
