// H1 · the joystick's aim and the preconfigured routes, ported to the unified map (pure math, no DOM).
// Ported from public/face/face_world.js (route, sample, walk, places) and public/face/face.js (stick aim).
// Same numbers as the face: a parity test compares both (atlas/map_stick_casos.mjs). No clock, no randomness.
(function (root) {
  'use strict';
  var tile = 12, worldSize = 1000, root2 = Math.SQRT2;
  var homeAt = [500, 690];
  var places = [
    { id: 'beacon', name: 'the beacon', at: [306, 462], bend: 1 },
    { id: 'reef', name: 'the Reef', at: [722, 430], bend: -1 },
    { id: 'rift', name: 'the rift', at: [486, 196], bend: 1 }
  ];
  var R = 40, DEAD = 18;

  function hash32(s) {
    var h = 0x811c9dc5, i;
    for (i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 0x01000193); }
    return h >>> 0;
  }

  // aim(px, py) → { knob, dir }: the knob is clamped to the ring of radius R; the direction is a unit vector past the dead zone.
  function aim(px, py) {
    var d = Math.hypot(px, py), dx = px, dy = py;
    if (d > R) { dx *= R / d; dy *= R / d; }
    return { knob: [dx, dy], dir: d > DEAD ? [px / d, py / d] : [0, 0] };
  }

  function route(from, place) {
    var a = from, b = place.at, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len, h = hash32(place.id), pts = [], i, t, w, bow;
    for (i = 0; i <= 4; i++) {
      t = i / 4;
      bow = place.bend * 0.22 * len * Math.sin(Math.PI * t);
      w = i === 0 || i === 4 ? 0 : (((h >>> (i * 4)) & 15) - 7.5);
      pts.push([Math.round(a[0] + dx * t + nx * (bow + w)), Math.round(a[1] + dy * t + ny * (bow + w))]);
    }
    return pts;
  }

  function sample(pts) {
    var out = [pts[0]], n = pts.length, i, k, p0, p1, p2, p3, c1, c2, t, u;
    for (i = 0; i < n - 1; i++) {
      p0 = pts[Math.max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[Math.min(n - 1, i + 2)];
      c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      for (k = 1; k <= 24; k++) {
        t = k / 24; u = 1 - t;
        out.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
          u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]);
      }
    }
    return out;
  }

  function walk(pts) {
    var s = sample(pts), acc = [0], i, total, steps, out = [], j = 0, d, f;
    for (i = 1; i < s.length; i++) { acc.push(acc[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1])); }
    total = acc[acc.length - 1];
    steps = Math.max(1, Math.round(total / tile));
    for (i = 0; i <= steps; i++) {
      d = total * i / steps;
      while (j < acc.length - 2 && acc[j + 1] < d) { j++; }
      f = acc[j + 1] > acc[j] ? (d - acc[j]) / (acc[j + 1] - acc[j]) : 0;
      out.push([Math.round(s[j][0] + (s[j + 1][0] - s[j][0]) * f), Math.round(s[j][1] + (s[j + 1][1] - s[j][1]) * f)]);
    }
    return { steps: steps, units: Math.round(total), at: out };
  }

  var MapStick = { tile: tile, worldSize: worldSize, root2: root2, homeAt: homeAt, places: places, R: R, DEAD: DEAD, hash32: hash32, aim: aim, route: route, sample: sample, walk: walk };
  if (typeof module === 'object' && module.exports) { module.exports = MapStick; } else { root.AtlasMapStick = MapStick; }
})(typeof module === 'object' && module.exports ? this : window);
