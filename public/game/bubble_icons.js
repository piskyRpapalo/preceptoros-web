(function (root) {
  'use strict';

  var NAMES = Object.freeze(['left', 'up', 'down', 'right', 'home', 'beacon', 'eye', 'terminal', 'buoy', 'bubble', 'sound-on', 'sound-off', 'comment', 'menu', 'history', 'waves', 'nodes', 'help', 'play', 'pause']);

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }

  function toPts(c, uv) { return uv.map(function (q) { return [c.x + q[0] * c.r, c.y + q[1] * c.r]; }); }
  function outline(c, uv, f) { return { o: 'ribbon', pts: toPts(c, uv), closed: true, f: f, s: 'ink', lw: c.lw, d: 0 }; }
  function stroke(c, uv) { return { o: 'ribbon', pts: toPts(c, uv), closed: false, f: null, s: 'ink', lw: c.lw, d: 0 }; }
  function dot(c, u, v, rr, f) {
    var q = [c.x + u * c.r, c.y + v * c.r], R = rr * c.r;
    return { o: 'wave', x: q[0], y: q[1], h: [[1, R, R, 0]], f: f, s: 'ink', lw: c.lw, d: 0 };
  }
  function arcUV(cu, cv, rad, a0, a1, n) {
    var out = [], k, a;
    for (k = 0; k <= n; k++) {
      a = (a0 + (a1 - a0) * k / n) * Math.PI / 180;
      out.push([cu + rad * Math.cos(a), cv + rad * Math.sin(a)]);
    }
    return out;
  }
  function roundedUV(u0, v0, u1, v1, rr) {
    return arcUV(u1 - rr, v0 + rr, rr, -90, 0, 3)
      .concat(arcUV(u1 - rr, v1 - rr, rr, 0, 90, 3))
      .concat(arcUV(u0 + rr, v1 - rr, rr, 90, 180, 3))
      .concat(arcUV(u0 + rr, v0 + rr, rr, 180, 270, 3));
  }
  function almondUV() {
    var up = [], dn = [], k, t;
    for (k = 0; k <= 8; k++) {
      t = k / 8;
      up.push([-0.9 + 1.8 * t, -0.55 * Math.sin(Math.PI * t)]);
      dn.push([-0.9 + 1.8 * t, 0.55 * Math.sin(Math.PI * t)]);
    }
    return up.concat(dn.slice(1, -1).reverse());
  }
  function speakerUV() {
    return [[-0.85, -0.3], [-0.4, -0.3], [0, -0.7], [0, 0.7], [-0.4, 0.3], [-0.85, 0.3]];
  }
  function sineUV(v0, amp) {
    var out = [], k;
    for (k = 0; k <= 12; k++) { out.push([-0.85 + 1.7 * k / 12, v0 + amp * Math.sin(2 * Math.PI * k / 6)]); }
    return out;
  }

  var DRAW = {
    left: function (c) { return [outline(c, [[-0.8, 0], [0.5, -0.7], [0.5, 0.7]], c.acc)]; },
    up: function (c) { return [outline(c, [[0, -0.8], [0.7, 0.5], [-0.7, 0.5]], c.acc)]; },
    down: function (c) { return [outline(c, [[0, 0.8], [0.7, -0.5], [-0.7, -0.5]], c.acc)]; },
    right: function (c) { return [outline(c, [[0.8, 0], [-0.5, -0.7], [-0.5, 0.7]], c.acc)]; },
    home: function (c) {
      return [
        outline(c, [[-0.95, 0.02], [0, -0.82], [0.95, 0.02]], c.acc),
        outline(c, [[-0.62, 0], [0.62, 0], [0.62, 0.82], [-0.62, 0.82]], c.acc),
        stroke(c, [[-0.15, 0.82], [-0.15, 0.4], [0.15, 0.4], [0.15, 0.82]])
      ];
    },
    beacon: function (c) {
      return [
        outline(c, [[-0.3, -0.14], [0.3, -0.14], [0.55, 0.82], [-0.55, 0.82]], c.acc),
        dot(c, 0, -0.3, 0.16, 'paper'),
        stroke(c, [[-0.32, -0.5], [-0.78, -0.72]]),
        stroke(c, [[0, -0.55], [0, -0.92]]),
        stroke(c, [[0.32, -0.5], [0.78, -0.72]])
      ];
    },
    eye: function (c) { return [outline(c, almondUV(), c.acc), dot(c, 0, 0, 0.3, 'ink')]; },
    terminal: function (c) {
      return [
        outline(c, roundedUV(-0.9, -0.7, 0.9, 0.7, 0.25), c.acc),
        stroke(c, [[-0.45, -0.32], [-0.1, 0], [-0.45, 0.32]]),
        stroke(c, [[0.05, 0.32], [0.45, 0.32]])
      ];
    },
    buoy: function (c) {
      return [
        dot(c, 0, 0, 0.8, c.acc),
        outline(c, [[-0.775, -0.2], [0.775, -0.2], [0.775, 0.2], [-0.775, 0.2]], 'ink')
      ];
    },
    bubble: function (c) { return [dot(c, 0, 0, 0.8, c.acc), dot(c, -0.35, -0.35, 0.14, 'paper')]; },
    'sound-on': function (c) {
      return [
        outline(c, speakerUV(), c.acc),
        stroke(c, arcUV(0, 0, 0.5, -50, 50, 6)),
        stroke(c, arcUV(0, 0, 0.85, -50, 50, 8))
      ];
    },
    'sound-off': function (c) {
      return [
        outline(c, speakerUV(), c.acc),
        stroke(c, [[0.35, -0.35], [0.85, 0.35]]),
        stroke(c, [[0.85, -0.35], [0.35, 0.35]])
      ];
    },
    comment: function (c) {
      return [
        outline(c, [[-0.85, -0.6], [0.85, -0.6], [0.85, 0.3], [-0.1, 0.3], [-0.55, 0.8], [-0.5, 0.3], [-0.85, 0.3]], c.acc),
        stroke(c, [[-0.5, -0.2], [0.5, -0.2]]),
        stroke(c, [[-0.5, 0.05], [0.2, 0.05]])
      ];
    },
    menu: function (c) {
      return [
        outline(c, roundedUV(-0.7, -0.66, 0.7, -0.4, 0.1), c.acc),
        outline(c, roundedUV(-0.7, -0.12, 0.7, 0.12, 0.1), c.acc),
        outline(c, roundedUV(-0.7, 0.4, 0.7, 0.66, 0.1), c.acc)
      ];
    },
    history: function (c) {
      return [
        dot(c, 0, 0, 0.82, c.acc),
        stroke(c, [[0, -0.5], [0, 0.02]]),
        stroke(c, [[0, 0.02], [0.38, 0.22]])
      ];
    },
    waves: function (c) { return [stroke(c, sineUV(-0.35, 0.2)), stroke(c, sineUV(0.35, 0.2))]; },
    nodes: function (c) {
      return [
        stroke(c, [[-0.6, 0.5], [0, -0.6]]),
        stroke(c, [[0, -0.6], [0.6, 0.5]]),
        dot(c, -0.6, 0.5, 0.3, c.acc),
        dot(c, 0, -0.6, 0.3, c.acc),
        dot(c, 0.6, 0.5, 0.3, c.acc)
      ];
    },
    help: function (c) {
      return [
        dot(c, 0, 0, 0.85, c.acc),
        stroke(c, arcUV(0, -0.3, 0.32, 180, 360, 8).concat([[0, 0.1], [0, 0.28]])),
        dot(c, 0, 0.5, 0.12, 'ink')
      ];
    },
    play: function (c) { return [outline(c, [[-0.45, -0.7], [0.8, 0], [-0.45, 0.7]], c.acc)]; },
    pause: function (c) {
      return [
        outline(c, roundedUV(-0.6, -0.7, -0.14, 0.7, 0.08), c.acc),
        outline(c, roundedUV(0.14, -0.7, 0.6, 0.7, 0.08), c.acc)
      ];
    }
  };

  function icon(p) {
    if (!p || typeof p !== 'object' || typeof p.name !== 'string' || !has(DRAW, p.name)) { return []; }
    var r = num(p.r, 0);
    if (!(r > 0)) { return []; }
    var c = {
      x: num(p.x, 0), y: num(p.y, 0), r: r,
      lw: Math.max(2.5, 0.16 * r),
      acc: p.f === undefined || p.f === null ? 'cyan' : p.f
    };
    var items = DRAW[p.name](c);
    if (p.halo !== true) { return items; }
    return items.map(function (it) { return Object.assign({}, it, { s: 'paper', lw: it.lw + 3, f: null }); }).concat(items);
  }

  function missing(name) { return NAMES.indexOf(name) < 0; }

  function canvas(doc, name, size, opts) {
    var o = opts || {}, scale = num(o.scale, 2);
    var AB = root.AtlasBubble || core, AC = root.AtlasComicAtoms || globalThis.AtlasComicAtoms;
    if (!doc || typeof doc.createElement !== 'function' || !AB || !AC || missing(name) || !(typeof size === 'number' && size > 0)) { return null; }
    var cv = doc.createElement('canvas'), g = cv.getContext('2d');
    cv.width = size * scale;
    cv.height = size * scale;
    cv.className = 'bubble-ico';
    cv.setAttribute('aria-hidden', 'true');
    g.setTransform(scale, 0, 0, scale, 0, 0);
    var frame = {
      v: 'preceptoros.bubble/1', id: 'ICON', t: 0, cv: [size, size], bands: ['cyan', 'ink', 'paper'], change: ['icon'],
      sound: 'NO_DATA', soundCause: 'icon', motion: 'NO_DATA',
      atoms: [{ k: name, r: name, i: [{ o: 'icon', name: name, x: size / 2, y: size / 2, r: size * 0.38, halo: !!(opts && opts.halo), f: opts && opts.f }] }]
    };
    AC.paint(g, AB.compile(frame));
    return cv;
  }

  var WORDS = { icon: icon };
  var core = null;
  if (typeof module === 'object' && module.exports) {
    try { core = require('./bubble_language.js'); } catch (e) { core = null; }
  } else {
    core = root.AtlasBubble || null;
  }
  if (core && typeof core.define === 'function') { core.define('icon', icon); }

  var API = { NAMES: NAMES, WORDS: WORDS, missing: missing, canvas: canvas };
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  else { root.AtlasBubbleIcons = API; }
})(this);
