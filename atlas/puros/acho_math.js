// Acho math · the one small kernel every moving thing shares (Mesa #34, ROUND 5). Pure: no clock, no randomness,
// no DOM, no network. Every function is a closed form of its arguments, so a value at time t never depends on the
// frames drawn before it: the same event can be played in the game at any frame rate and replayed later in a film.
//   hash(text) → uint32 (FNV-1a)            rand(seed, i) → [0, 1), the i-th number of that seed
//   noise(seed, x) → [0, 1), smooth in x    smooth(p) → smoothstep on [0, 1]
//   track(keys) → f(t)                      monotone cubic through [[t, v], ...] (Fritsch–Carlson 1980): it never
//                                           overshoots a key, so a camera or a light never passes its target
//   spring(t, zeta, omega) → 0 → 1          damped step response in closed form (under, critical, over)
//   particle(t, p) → { x, y }               launch with exponential drag and gravity, integrated exactly
//   screen(a, b) → [0, 1]                   bounded light: adding light never leaves the range
// Sources: the mathematics is textbook; the idea of analytic particles and seeded noise follows patch-gg/pixelfx
// (MIT), and of one pure render(t) follows lemomo-ai/lemo-opuscar. No line of either is copied.
(function (root) {
  'use strict';
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function smooth(p) { var q = clamp(p, 0, 1); return q * q * (3 - 2 * q); }
  function mix(a, b, k) { return a + (b - a) * k; }
  function screen(a, b) { return 1 - (1 - clamp(a, 0, 1)) * (1 - clamp(b, 0, 1)); }
  function hash(text) {
    var s = String(text), h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  // rand(seed, i): one integer mix (the murmur3 finaliser) of seed and index. Same seed, same i, same number, forever.
  function rand(seed, i) {
    var h = ((seed >>> 0) ^ Math.imul((i | 0) + 1, 0x9e3779b1)) >>> 0;
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function noise(seed, x) {
    var i = Math.floor(x), f = x - i;
    return mix(rand(seed, i), rand(seed, i + 1), smooth(f));
  }
  // track(keys) → f(t). keys: [[t, v], ...] with strictly rising t. Outside the keys the value holds.
  function track(keys) {
    var n = Array.isArray(keys) ? keys.length : 0, i;
    if (!n) { throw new Error('acho_math: track needs keys'); }
    for (i = 0; i < n; i++) {
      if (!Array.isArray(keys[i]) || !isFinite(keys[i][0]) || !isFinite(keys[i][1]) || (i && keys[i][0] <= keys[i - 1][0])) { throw new Error('acho_math: track keys must rise in t'); }
    }
    var d = [], m = [];
    for (i = 0; i < n - 1; i++) { d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0])); }
    for (i = 0; i < n; i++) { m.push(i === 0 ? d[0] || 0 : i === n - 1 ? d[n - 2] || 0 : (d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2)); }
    for (i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      var a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { var k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
    }
    return function (t) {
      if (n === 1 || t <= keys[0][0]) { return keys[0][1]; }
      if (t >= keys[n - 1][0]) { return keys[n - 1][1]; }
      var j = 0; while (t > keys[j + 1][0]) { j++; }
      var h = keys[j + 1][0] - keys[j][0], u = (t - keys[j][0]) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * keys[j][1] + (u3 - 2 * u2 + u) * h * m[j] + (-2 * u3 + 3 * u2) * keys[j + 1][1] + (u3 - u2) * h * m[j + 1];
    };
  }
  // spring(t, zeta, omega): position of a unit step, at rest at 0 when t = 0. t in seconds, omega in rad/s.
  function spring(t, zeta, omega) {
    if (!(t > 0)) { return 0; }
    var z = Math.max(0, zeta), w = Math.max(1e-6, omega);
    if (z < 1) { var wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }
    if (z === 1) { return 1 - Math.exp(-w * t) * (1 + w * t); }
    var r = Math.sqrt(z * z - 1), s1 = -w * (z - r), s2 = -w * (z + r);
    return 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
  }
  // particle(t, { x, y, vx, vy, drag, g }): dv/dt = -drag·v + g (g pulls +y). Exact, so t can be any instant.
  function particle(t, p) {
    var k = p.drag || 0, g = p.g || 0, s = Math.max(0, t);
    if (k < 1e-6) { return { x: p.x + p.vx * s, y: p.y + p.vy * s + g * s * s / 2 }; }
    var e = (1 - Math.exp(-k * s)) / k;
    return { x: p.x + p.vx * e, y: p.y + g * s / k + (p.vy - g / k) * e };
  }
  var api = { clamp: clamp, smooth: smooth, mix: mix, screen: screen, hash: hash, rand: rand, noise: noise, track: track, spring: spring, particle: particle };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasAchoMath = api;
})(typeof globalThis === 'object' ? globalThis : this);
