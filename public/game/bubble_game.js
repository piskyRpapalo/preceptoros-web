(function (root) {
  'use strict';
  var TAU = 2 * Math.PI, RAD = Math.PI / 180;
  var node = typeof module === 'object' && module.exports;

  function lib(name, file) {
    if (root[name]) { return root[name]; }
    if (node) { try { return require(file); } catch (e) { return null; } }
    return null;
  }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function disc(x, y, r, f, s, lw) {
    var it = { o: 'wave', f: f || null, s: s || null, d: 0, x: r2(x), y: r2(y), h: [[1, r2(r), r2(r), 0]] };
    if (lw) { it.lw = lw; }
    return it;
  }
  function line(pts, s, lw) {
    return { o: 'ribbon', f: null, s: s, d: 0, lw: lw, closed: false, pts: pts.map(function (q) { return [r2(q[0]), r2(q[1])]; }) };
  }
  function harmonics(arm) {
    return (Array.isArray(arm) ? arm : []).filter(function (h) {
      return Array.isArray(h) && h.length === 4 && h.every(function (v) { return typeof v === 'number' && isFinite(v); });
    });
  }

  var CAST = Object.create(null);
  function cast(name, arm) { CAST[String(name)] = harmonics(arm).map(function (h) { return h.slice(); }); return CAST[String(name)]; }
  function spectrum(it) { var a = harmonics(it.arm); return a.length ? a : (CAST[it.as] || []); }

  function reach(arm) {
    var G = lib('AtlasGacha', './gacha.js'), m = 0, i, p;
    if (!G) { return 1; }
    for (i = 0; i < 96; i++) { p = G.punto(arm, i / 96 * TAU); m = Math.max(m, Math.sqrt(p[0] * p[0] + p[1] * p[1])); }
    return m || 1;
  }

  function troop(p) {
    var arm = spectrum(p);
    if (!arm.length) { return []; }
    var r = num(p.r, 60), out = [];
    out.push({ o: 'wave', f: p.f || 'paper', s: 'ink', d: 0, lw: 3.2, x: num(p.x, 0), y: num(p.y, 0),
      sc: r2(r / reach(arm)), rot: num(p.rot, 0), h: arm });
    if (p.eyes !== false) {
      out.push(disc(num(p.x, 0) - 0.22 * r, num(p.y, 0) - 0.08 * r, 0.13 * r, 'paper', 'ink', 2.5),
        disc(num(p.x, 0) + 0.22 * r, num(p.y, 0) - 0.08 * r, 0.13 * r, 'paper', 'ink', 2.5),
        disc(num(p.x, 0) - 0.2 * r, num(p.y, 0) - 0.06 * r, 0.05 * r, 'ink'),
        disc(num(p.x, 0) + 0.24 * r, num(p.y, 0) - 0.06 * r, 0.05 * r, 'ink'));
    }
    return out;
  }

  function meter(p) {
    var x = num(p.x, 0), y = num(p.y, 0), w = num(p.w, 120), max = Math.max(num(p.max, 1), 1e-9);
    var n = Math.max(4, Math.round(w / 12)), full = Math.round(n * clamp(num(p.v, 0) / max, 0, 1)), out = [], i, cx;
    out.push(line([[x, y + 7], [x + w, y + 7]], 'cyan', 1.6));
    for (i = 0; i < n; i++) {
      cx = x + w * i / (n - 1);
      out.push(i < full ? disc(cx, y, 4.2, p.f || 'cyan', 'ink', 2) : disc(cx, y, 3.2, null, 'cyan', 1.6));
    }
    return out;
  }

  function label(tx, x, y, sz, al) {
    var L = lib('AtlasBubbleLetters', './bubble_letters.js');
    if (L && L.WORDS && L.WORDS.letters) { return L.WORDS.letters({ tx: tx, x: x, y: y, sz: sz, al: al, sh: [1.5, 1.5, 'ink'] }); }
    return [{ o: 'text', tx: tx, x: x, y: y, sz: sz * 1.3, f: 'paper' }];
  }

  function shares(o, n) {
    var total = o.reduce(function (a, b) { return a + b; }, 0), raw = o.map(function (v) { return v / total * n; });
    var out = raw.map(Math.floor), left = n - out.reduce(function (a, b) { return a + b; }, 0);
    raw.map(function (v, i) { return [v - Math.floor(v), i]; }).sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; })
      .slice(0, left).forEach(function (r) { out[r[1]] += 1; });
    return out;
  }

  function odds(p) {
    var o = Array.isArray(p.chances) ? p.chances.map(function (v) { return Math.max(num(v, 0), 0); }) : [];
    var bands = Array.isArray(p.bands) ? p.bands : [], total = o.reduce(function (a, b) { return a + b; }, 0);
    if (!o.length || !(total > 0)) { return []; }
    var x = num(p.x, 0), y = num(p.y, 0), w = num(p.w, 300), rows = 4, cols = 25, step = w / (cols - 1);
    var count = shares(o, rows * cols), out = [], k = 0, g = 0, used = 0;
    for (k = 0; k < rows * cols; k++) {
      while (g < count.length - 1 && used >= count[g]) { g += 1; used = 0; }
      used += 1;
      out.push(disc(x + step * Math.floor(k / rows), y + 0.9 * step * (k % rows), 0.36 * step, bands[g] || 'paper', 'ink', 1.6));
    }
    o.forEach(function (v, i) {
      var lx = x + w * (i + 0.5) / o.length - 16, ly = y + 0.9 * step * rows + 12;
      out.push(disc(lx, ly, 5, bands[i] || 'paper', 'ink', 1.6));
      out = out.concat(label(String(Math.round(v / total * 1000) / 10) + '%', lx + 10, ly, 10, 'left'));
    });
    return out;
  }

  function clash(p) {
    var a = Array.isArray(p.a) ? p.a : [0, 0], b = Array.isArray(p.b) ? p.b : [100, 0];
    var n = Math.max(1, Math.round(num(p.n, 3))), amp = num(p.amp, 12), k = num(p.k, 3), ph = num(p.ph, 0) * RAD;
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len;
    var out = [], i, j, t, e, off, pts;
    for (i = 0; i < n; i++) {
      pts = [];
      for (j = 0; j <= 24; j++) {
        t = j / 24; e = Math.sin(Math.PI * t);
        off = amp * e * Math.sin(TAU * k * t + ph + i * TAU / n);
        pts.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
      }
      out.push(line(pts, i % 2 ? 'paper' : 'cyan', 2));
    }
    for (j = 1; j < 8; j++) {
      t = j / 8;
      out.push(disc(a[0] + dx * t, a[1] + dy * t, 2.6 + 1.6 * Math.abs(Math.sin(TAU * k * t + ph)), 'paper'));
    }
    return out;
  }

  function sleeper(p) {
    var arm = spectrum(p);
    if (!arm.length) { return []; }
    var x = num(p.x, 0), y = num(p.y, 0), r = num(p.r, 60), w = clamp(num(p.awake, 0), 0, 1), up = w >= 0.5, out = [];
    var sx = x - 0.3 * r, sy = y + 0.34 * r, sw = 0.6 * r, sh = 0.34 * r;
    out.push({ o: 'wave', f: p.f || 'paper', s: 'ink', d: 0, lw: 3.2, x: x, y: y, sc: r2(r / reach(arm)), rot: num(p.rot, 0), h: arm });
    [-1, 1].forEach(function (sd) {
      var cx = x + sd * 0.24 * r, ey = y - 0.12 * r;
      if (up) { out.push(disc(cx, ey, 0.12 * r, 'paper', 'ink', 2.5), disc(cx, ey + 0.02 * r, 0.05 * r, 'ink')); }
      else { out.push(line([[cx - 0.11 * r, ey - 0.01 * r], [cx, ey + 0.05 * r], [cx + 0.11 * r, ey - 0.01 * r]], 'ink', 3)); }
      out.push(line([[x + sd * 0.5 * r, y + 0.1 * r], [x + sd * 0.32 * r, sy + 0.1 * r]], 'ink', 3));
    });
    out.push({ o: 'ribbon', f: up ? 'cyan' : 'ink', s: 'paper', d: 0, lw: 2.5, closed: true,
      pts: [[sx, sy], [sx + sw, sy], [sx + sw, sy + sh], [sx, sy + sh]].map(function (q) { return [r2(q[0]), r2(q[1])]; }) });
    if (!up) { out = out.concat(label('zzz', x + 0.55 * r, y - 0.7 * r, 11, 'left')); }
    return out;
  }

  var SKINS = Object.freeze({ atlantis: Object.freeze({}), apocalypse: Object.freeze({ troop: 'sleeper' }) });
  var skinName = 'atlantis';
  function useSkin(n) { skinName = Object.prototype.hasOwnProperty.call(SKINS, n) ? n : 'atlantis'; return skinName; }
  function dress(frame) {
    var m = SKINS[skinName];
    frame.atoms.forEach(function (a) { a.i.forEach(function (it) { if (m[it.o]) { it.o = m[it.o]; } }); });
    frame.skin = skinName;
    return frame;
  }

  function mix(a, b, t) {
    var G = lib('AtlasGacha', './gacha.js');
    return G ? G.mezcla(a, b, clamp(t, 0, 1)).map(function (h) { return h.map(r2); }) : b;
  }

  function add(it, k, v) { it[k] = Array.isArray(it[k]) ? it[k].map(function (q) { return r2(q + v); }) : r2(num(it[k], 0) + v); }

  function moveItem(it, m, p) {
    if (m.dx) { add(it, 'x', m.dx * p); }
    if (m.dy) { add(it, 'y', m.dy * p); }
    if (m.bob) { add(it, 'y', m.bob[0] * Math.sin(TAU * m.bob[1] * p)); }
    if (m.rot) { it.rot = r2(num(it.rot, 0) + m.rot * p); }
    if (m.a) { it.a = r2(num(it.a, 45) + m.a * p); }
    if (m.ph) { it.ph = r2(num(it.ph, 0) + m.ph * p); }
    if (m.morph && it.from) { it.arm = mix(CAST[it.from] || [], spectrum(it), p); delete it.from; delete it.as; }
    if (m.fill) { it.v = r2(num(it.v, 0) * clamp(p * m.fill, 0, 1)); }
    if (m.drain) { it.v = r2(num(it.v, 0) * (1 - m.drain * p)); }
    if (m.wake) { it.awake = r2(clamp(p * m.wake, 0, 1)); }
    if (Array.isArray(m.series) && m.series.length) { it.v = m.series[Math.min(m.series.length - 1, Math.floor(p * m.series.length))]; }
  }

  function pulse(frame, motion, p) {
    var mv = (motion && motion[frame.id]) || {};
    if (typeof p !== 'number' || !isFinite(p)) {
      frame.atoms.forEach(function (a) { a.i.forEach(function (it) { delete it.from; }); });
      return dress(frame);
    }
    p = clamp(p, 0, 1);
    frame.atoms.forEach(function (a) {
      var m = mv[a.k];
      a.i.forEach(function (it) { if (m && it.o !== 'keep') { moveItem(it, m, p); } delete it.from; });
    });
    return dress(frame);
  }

  var WORDS = { troop: troop, meter: meter, odds: odds, clash: clash, sleeper: sleeper };
  var core = lib('AtlasBubble', './bubble_language.js');
  if (core && typeof core.define === 'function') { Object.keys(WORDS).forEach(function (k) { core.define(k, WORDS[k]); }); }

  var API = Object.freeze({ WORDS: WORDS, pulse: pulse, reach: reach, cast: cast, SKINS: SKINS, useSkin: useSkin, skin: function () { return skinName; } });
  if (node) { module.exports = API; } else { root.AtlasBubbleGame = API; }
})(typeof module === 'object' && module.exports ? this : (this || window));
