(function (root) {
  'use strict';

  var PI = Math.PI, RAD = PI / 180;
  var PHASE_UNIT = PI / 32;
  var EMBLEM = [[1, 24, 24, 0], [-3, 13, 13, 44], [9, 3, 3, 40]];
  var EYE_STATES = ['up', 'open', 'shut'];

  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function pair(v, d) { return Array.isArray(v) && v.length === 2 ? v : d; }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function stateOf(v) { return EYE_STATES.indexOf(v) >= 0 ? v : 'open'; }
  function copyPts(pts) { return pts.map(function (q) { return [q[0], q[1]]; }); }

  function piece(o, props, f, s, lw, d) {
    var item = { o: o, f: f || null, s: s || null, d: d || 0 }, k;
    if (lw) { item.lw = lw; }
    for (k in props) { if (Object.prototype.hasOwnProperty.call(props, k)) { item[k] = props[k]; } }
    return item;
  }
  function disc(x, y, r, f, s, lw, d) { return piece('wave', { x: x, y: y, h: [[1, r, r, 0]] }, f, s, lw, d); }
  function strokeLine(pts, s, lw, d) { return piece('ribbon', { pts: pts, closed: false }, null, s, lw, d); }
  function closedShape(pts, f, s, lw, d) { return piece('ribbon', { pts: pts, closed: true }, f, s, lw, d); }

  function harmonicPoint(h, u) {
    var x = 0, y = 0, i, f;
    for (i = 0; i < h.length; i++) {
      f = h[i][0] * u + h[i][3] * PHASE_UNIT;
      x += h[i][1] * Math.cos(f);
      y += h[i][2] * Math.sin(f);
    }
    return [x, y];
  }

  function eyeItems(x, y, re, state, d) {
    if (state === 'shut') { return [strokeLine([[x - re, y], [x + re, y]], 'ink', 2.2, d)]; }
    var py = state === 'up' ? y - 0.5 * re : y;
    return [disc(x, y, re, 'paper', 'ink', 1.2, d), disc(x, py, 0.43 * re, 'ink', null, null, d)];
  }

  function crabWord(p) {
    var x = num(p.x, 0), y = num(p.y, 0), rr = num(p.rr, 40), dir = p.dir === -1 ? -1 : 1;
    var state = stateOf(p.eye), out = [], pts, px, i, q, lim = 0, scale, lg = 0.5 * rr;
    function X(u) { return x + dir * u; }

    for (i = 0; i < 6; i++) {
      px = (i - 2.5) / 2.5 * 0.85 * rr;
      pts = [[X(px), y], [X(1.05 * px), y + 0.45 * lg], [X(1.15 * px), y + lg]];
      out.push(strokeLine(pts, 'ink', 3.4, 0), strokeLine(copyPts(pts), 'cyan', 1.6, 0));
    }

    out.push(disc(x - 0.95 * rr, y - 0.1 * rr, 0.18 * rr, 'cyan', 'ink', 3.2, 0));
    out.push(disc(x + 0.95 * rr, y - 0.1 * rr, 0.18 * rr, 'cyan', 'ink', 3.2, 0));

    pts = [];
    for (i = 0; i <= 24; i++) {
      q = i / 24 * PI;
      pts.push([X(0.95 * rr * Math.cos(q)), y - 0.1 * rr - 0.62 * rr * Math.sin(q)]);
    }
    out.push(closedShape(pts, 'cyan', 'ink', 3.2, 0));

    for (i = 0; i < EMBLEM.length; i++) { lim += Math.max(Math.abs(EMBLEM[i][1]), Math.abs(EMBLEM[i][2])); }
    scale = 0.26 * rr / lim;
    pts = [];
    for (i = 0; i < 48; i++) {
      q = harmonicPoint(EMBLEM, i / 48 * 2 * PI);
      pts.push([X(-0.1 * rr + q[0] * scale), y - 0.36 * rr + q[1] * scale]);
    }
    out.push(closedShape(pts, null, 'ink', 2, 0));

    [[0.32, -0.75], [0.58, -0.68]].forEach(function (e) {
      var ex = X(e[0] * rr), ey = y + e[1] * rr;
      out.push(strokeLine([[ex, y - 0.55 * rr], [ex, ey]], 'ink', 2.2, 0));
      out = out.concat(eyeItems(ex, ey, 0.07 * rr, state, 0));
    });
    return out;
  }

  function starWord(p) {
    var x = num(p.x, 0), y = num(p.y, 0), r = num(p.r, 22), state = stateOf(p.eye);
    var body = piece('wave', { x: x, y: y, h: [[1, r, r, 0], [-4, 0.3 * r, 0.3 * r, 0]] }, 'cyan', 'ink', 3.2, 0);
    return [body].concat(eyeItems(x - 0.28 * r, y - 0.04 * r, 0.2 * r, state, 0),
      eyeItems(x + 0.28 * r, y - 0.04 * r, 0.2 * r, state, 0));
  }

  function snailWord(p) {
    var x = num(p.x, 0), y = num(p.y, 0), r = num(p.r, 16), state = stateOf(p.eye), out = [];
    var cx = x - 0.25 * r, cy = y - 0.35 * r, spiral = [], k, th, rho, stalks, i;
    for (k = 0; k <= 18; k++) {
      th = k / 18 * 5 * PI;
      rho = 0.08 * r + (0.5 * r - 0.08 * r) * k / 18;
      spiral.push([cx + rho * Math.cos(th), cy + rho * Math.sin(th)]);
    }
    out.push(piece('blob', { x: cx, y: cy, rx: 0.55 * r, ry: 0.55 * r, rot: 0, seed: 'concha', rough: 0.05 }, 'cyan', 'ink', 3.2, 0));
    out.push(strokeLine(spiral, 'ink', 2.5, 0));
    out.push(piece('blob', { x: x + 0.1 * r, y: y + 0.42 * r, rx: r, ry: 0.34 * r, rot: 0, seed: 'cuerpo', rough: 0.1 }, 'cyan', 'ink', 3.2, 0));
    stalks = [
      [[x + 0.5 * r, y + 0.2 * r], [x + 0.6 * r, y - 0.2 * r], [x + 0.56 * r, y - 0.55 * r]],
      [[x + 0.72 * r, y + 0.2 * r], [x + 0.82 * r, y - 0.1 * r], [x + 0.9 * r, y - 0.42 * r]]
    ];
    for (i = 0; i < stalks.length; i++) {
      out.push(strokeLine(stalks[i], 'ink', 2.2, 0));
      out = out.concat(eyeItems(stalks[i][2][0], stalks[i][2][1], 0.2 * r, state, 0));
    }
    return out;
  }

  function octoWord(p) {
    var x = num(p.x, 0), y = num(p.y, 0), r = num(p.r, 20), state = stateOf(p.eye), out = [];
    var i, k, dx, side, p0, p1, p2, c, th, rho, pts;
    for (i = 0; i < 6; i++) {
      dx = (i - 2.5) / 2.5 * 0.8 * r;
      side = dx < 0 ? -1 : 1;
      p0 = [x + dx * 0.5, y + 0.55 * r];
      p1 = [x + dx * 1.1, y + 0.9 * r];
      p2 = [x + dx * 1.2, y + 1.15 * r];
      c = [p2[0] + 0.12 * r * side, p2[1]];
      pts = [p0, p1, p2];
      for (k = 0; k <= 4; k++) {
        th = PI * (0.2 + 1.3 * k / 4);
        rho = 0.14 * r * (1 - 0.6 * k / 4);
        pts.push([c[0] + rho * Math.cos(th), c[1] + rho * Math.sin(th)]);
      }
      out.push(strokeLine(pts, 'ink', 3.2, 0));
    }
    out.push(piece('blob', { x: x, y: y - 0.15 * r, rx: r, ry: 0.9 * r, rot: 0, seed: 'cabeza', rough: 0.15 }, 'cyan', 'ink', 3.2, 0));
    return out.concat(eyeItems(x - 0.38 * r, y - 0.2 * r, 0.2 * r, state, 0),
      eyeItems(x + 0.38 * r, y - 0.2 * r, 0.2 * r, state, 0));
  }

  function fishWord(p) {
    return [piece('wave', { x: num(p.x, 0), y: num(p.y, 0), sc: num(p.sc, 1), h: [[1, 10, 5, 0], [2, 2, 2, 16]] }, null, 'cyan', 2.5, 2)];
  }

  function troopWord(p) {
    var x = num(p.x, 0), y = num(p.y, 0), r = num(p.r, 12), ph = num(p.ph, 0);
    return [
      piece('wave', { x: x, y: y, sc: r / 6, h: [[1, 6, 6, ph], [3, 2, 2, ph], [5, 1, 1, ph]] }, 'ocean', 'cyan', 2.5, 0),
      disc(x - 0.3 * r, y - 0.1 * r, 0.2 * r, 'paper', null, null, 0),
      disc(x + 0.3 * r, y - 0.1 * r, 0.2 * r, 'paper', null, null, 0)
    ];
  }

  function bustWord(p) {
    var x = num(p.x, 0), y = num(p.y, 0), r = num(p.r, 64), rot = num(p.rot, 0), sq = pair(p.sq, [1, 1]);
    var sx = clamp(num(sq[0], 1), 0.88, 1.12), sy = clamp(num(sq[1], 1), 0.88, 1.12);
    var cs = Math.cos(rot * RAD), sn = Math.sin(rot * RAD), out = [], i;
    var opened = p.eye === 'open';
    var cybState = p.cybEye === 'violet' || p.cybEye === 'shut' ? p.cybEye : (opened ? 'violet' : 'shut');
    var marbleState = p.mEye === 'open' || p.mEye === 'happy' || p.mEye === 'shut' ? p.mEye : (opened ? 'open' : 'shut');
    var mouth = p.mouth === 'o' || p.mouth === 'smile' ? p.mouth : 'closed';
    var E = [0.36 * r, -0.12 * r];
    var M = [-0.36 * r, -0.12 * r];
    function T(u, v) { var a = u * sx, b = v * sy; return [x + a * cs - b * sn, y + a * sn + b * cs]; }
    function line(pts, s, lw) {
      return piece('ribbon', { pts: pts.map(function (q) { return T(q[0], q[1]); }), closed: false }, null, s, lw, 0);
    }
    function arc(cu, cv, rad, a0, span, n) {
      var pts = [], k, a;
      for (k = 0; k <= n; k++) { a = (a0 + span * k / n) * RAD; pts.push([cu + rad * Math.cos(a), cv + rad * Math.sin(a)]); }
      return pts;
    }
    function ellipse(u, v, rx, ry, f, s, lw) {
      var c = T(u, v);
      return piece('wave', { x: c[0], y: c[1], rot: rot, h: [[1, rx * sx, ry * sy, 0]] }, f, s, lw, 0);
    }

    var hair = T(0, -0.18 * r);
    out.push(piece('wave', { x: hair[0], y: hair[1], rot: rot,
      h: [[1, 1.12 * r * sx, 1.08 * r * sy, 0], [13, 0.09 * r * sx, 0.09 * r * sy, 0]] }, 'paper', 'ink', 3.5, 0));

    for (i = 0; i < 6; i++) { out.push(line(arc(0, -0.18 * r, 0.92 * r, -165 + 31 * i - 13, 26, 5), 'ink', 2.5)); }

    var face = T(0, 0);
    out.push(piece('blob', { x: face[0], y: face[1], rx: 0.86 * r * sx, ry: r * sy, rot: rot, seed: 'cara', rough: 0.05 }, 'paper', 'ink', 3.5, 0));

    var beard = T(0, 0.55 * r);
    out.push(piece('wave', { x: beard[0], y: beard[1], rot: rot,
      h: [[1, 0.62 * r * sx, 0.42 * r * sy, 0], [6, 0.06 * r * sx, 0.06 * r * sy, 0]] }, 'paper', 'ink', 3.5, 0));
    [[-0.3, 0.72], [-0.1, 0.8], [0.1, 0.8], [0.3, 0.72]].forEach(function (c) {
      out.push(line(arc(c[0] * r, c[1] * r, 0.07 * r, 190, 160, 4), 'ink', 2.5));
    });

    var plate = T(0.38 * r, -0.1 * r);
    out.push(piece('blob', { x: plate[0], y: plate[1], rx: 0.25 * r * sx, ry: 0.36 * r * sy, rot: rot, seed: 'placa', rough: 0.1 }, 'ink', null, null, 0));
    [[[0.14, 0], [0.22, -0.06], [0.26, -0.2], [0.3, -0.28]], [[0.14, 0.08], [0.24, 0.12], [0.26, 0.26]],
      [[0, -0.14], [-0.06, -0.26], [-0.02, -0.36]]].forEach(function (circuit) {
      var pts = circuit.map(function (q) { return [E[0] + q[0] * r, E[1] + q[1] * r]; });
      var end = pts[pts.length - 1];
      out.push(line(pts, 'cyan', 2.5));
      out.push(ellipse(end[0], end[1], 3, 3, 'cyan', null, null));
    });
    out.push(line(arc(E[0], E[1], 0.15 * r, 120, 300, 10), 'cyan', 2.5));
    if (cybState === 'violet') {
      out.push(ellipse(E[0], E[1], 9, 9, 'FIRMADO.base', 'ink', 2.5));
      out.push(ellipse(E[0] - 3.5, E[1] - 3.5, 3, 3, 'paper', null, null));
    } else {
      out.push(line([[E[0] - 0.1 * r, E[1] - 0.01 * r], [E[0], E[1] + 0.05 * r], [E[0] + 0.1 * r, E[1] - 0.01 * r]], 'cyan', 2.5));
    }

    if (marbleState === 'open') {
      out.push(ellipse(M[0], M[1], 4, 4, 'ink', null, null));
    } else if (marbleState === 'happy') {
      out.push(line([[M[0] - 0.1 * r, M[1] + 0.02 * r], [M[0], M[1] - 0.05 * r], [M[0] + 0.1 * r, M[1] + 0.02 * r]], 'ink', 2.5));
    } else {
      out.push(line([[M[0] - 0.1 * r, M[1]], [M[0], M[1] + 0.06 * r], [M[0] + 0.1 * r, M[1]]], 'ink', 2.5));
    }

    if (mouth === 'o') {
      out.push(ellipse(0, 0.38 * r, 0.08 * r, 0.08 * r, 'ink', null, null));
    } else if (mouth === 'smile') {
      out.push(line([[-0.16 * r, 0.32 * r], [0, 0.42 * r], [0.16 * r, 0.32 * r]], 'ink', 3));
    } else {
      out.push(line([[-0.12 * r, 0.36 * r], [0.12 * r, 0.36 * r]], 'ink', 3));
    }
    return out;
  }

  var WORDS = {
    bust: bustWord,
    crab: crabWord,
    star: starWord,
    snail: snailWord,
    octo: octoWord,
    fish: fishWord,
    troop: troopWord
  };

  var core = null;
  if (typeof module === 'object' && module.exports) {
    try { core = require('./bubble_language.js'); } catch (e) { core = null; }
  } else {
    core = root.AtlasBubble || null;
  }
  if (core && typeof core.define === 'function') {
    Object.keys(WORDS).forEach(function (name) { core.define(name, WORDS[name]); });
  }

  var API = { WORDS: WORDS };
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  else { root.AtlasBubbleBestiary = API; }
})(typeof module === 'object' && module.exports ? this : (this || window));
