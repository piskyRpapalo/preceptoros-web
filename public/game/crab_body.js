// The living crab (Sovereign commission 2026-11-08 «the crab alive», piece 2 + greeting and heartbeat;
// odd/tasks/crab-alive.md). The walk stays the walker's (colony_controls.js): this piece only PROJECTS it. Between two
// cells the body glides with an ease-in-out over GLIDE ms and the six legs step in a tripod gait (three down, three up)
// in time with the step; on birth and on reaching a building it greets (claws up, opening twice); the floor ring beats
// only with a fresh signal (none for a visitor without a node: it stays still). Reduced motion: it arrives at once, the
// legs rest, no greeting sway. No chance anywhere in the body (no random numbers); the clock only times the picture, never the walk.
(function (root) {
  'use strict';
  var GLIDE = 240, GREET = 640;
  // Pure: ease-in-out (cubic) on 0..1.
  function ease(p) { var q = Math.max(0, Math.min(1, p)); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; }
  // Pure: the pose of the body for a step count, the glide progress p (1 = standing) and the greeting progress gp (≥1 = none).
  // legs[i] for i = 0..5 (left 0-2, right 3-5): the lift of each leg, tripod gait: L0, L2, R1 lift together, then the others.
  function pose(steps, p, gp) {
    var moving = p < 1, legs = [], i, set, phase = Math.PI * (steps + p);
    for (i = 0; i < 6; i++) {
      set = (i === 0 || i === 2 || i === 4) ? 0 : 1;       // L0, L2, R1 (index 4) | L1, R0, R2
      legs.push(moving ? Math.max(0, Math.sin(phase + set * Math.PI)) : 0);
    }
    var greeting = gp < 1, wave = greeting ? Math.abs(Math.sin(gp * Math.PI * 2)) : 0;
    return { legs: legs, bob: moving ? Math.abs(Math.sin(phase)) : 0, raise: greeting ? Math.sin(gp * Math.PI) : 0, open: greeting ? wave : 0.35 };
  }
  // Pure: the beat of the floor ring for a signal freshness f (0..1, null = no signal) at time t → alpha.
  function beat(f, t) { return f ? 0.35 + 0.35 * f * (0.5 + 0.5 * Math.sin(t / 160)) : 0.5; }

  var at = null, from = null, t0 = 0, steps = 0, g0 = null, raf = 0;
  function now() { return root.performance && root.performance.now ? root.performance.now() : Date.now(); }
  // track(key, cell, isBuilding, still) → { from, p, steps, gp }: notes a new cell, starts the glide and maybe a greeting.
  function track(key, isBuilding, still) {
    var n = now();
    if (at === null) { at = key; g0 = still ? null : n; }
    else if (key !== at) { from = at; at = key; t0 = still ? -1e9 : n; steps++; if (isBuilding && !still) { g0 = n + GLIDE; } }
    var p = from === null ? 1 : Math.min(1, (n - t0) / GLIDE), gp = g0 === null ? 1 : (n - g0) / GREET;
    if (p >= 1) { from = null; }
    if (gp >= 1) { g0 = null; }
    return { from: from, p: p, steps: steps, gp: gp < 0 ? 1 : gp, busy: p < 1 || (g0 !== null) };
  }
  // loop(redraw): a few frames while the body moves; then it stops (the map has no idle loop of its own).
  function loop(redraw) {
    if (raf || !root.requestAnimationFrame) { return; }
    raf = root.requestAnimationFrame(function () { raf = 0; redraw(); });
  }

  // draw(g, x, y, k, P, H, alpha): the crab body in Acho (shell from the polar wave, claws, legs, eyes on stalks).
  function draw(g, x, y, k, P, H, ringAlpha, oval) {
    var F = H.T.FRONT_DOOR, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.rgbOf(H.T.NEUTRAL.paper);
    var sea = H.mix(H.rgbOf(F.cyan), H.rgbOf(F['FIRMADO.base']), 0.35), R = 12 * k, cy = y - 11 * k - P.bob * 2 * k, i, a;
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    g.globalAlpha = ringAlpha; g.lineWidth = Math.max(1, 2.2 * k); g.strokeStyle = H.css(H.rgbOf(F['PROPUESTA.base']));
    g.beginPath(); oval(g, x, y - 2 * k, 19 * k, 7.5 * k, 0, 2 * Math.PI); g.stroke();
    g.globalAlpha = 0.25; g.fillStyle = ink; g.beginPath(); oval(g, x, y - 2 * k, 13 * k, 4.5 * k, 0, 2 * Math.PI); g.fill();
    g.globalAlpha = 1; g.strokeStyle = ink; g.lineWidth = Math.max(1, 1.8 * k);
    for (i = 0; i < 6; i++) {                      // legs: three a side; a lifted leg bends up and reaches forward
      var s = i < 3 ? -1 : 1, j = i % 3, up = P.legs[i] * 3.5 * k, bx = x + s * (6 + j * 3.5) * k, by = cy + 3 * k;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + s * 5 * k, by + 3 * k - up); g.lineTo(bx + s * (7 + P.legs[i] * 1.5) * k, by + 7 * k - up * 0.6); g.stroke();
    }
    [-1, 1].forEach(function (s) {                 // claws: the arm rises with the greeting, the jaws open
      var hx = x + s * (17 - P.raise * 3) * k, hy = cy - (6 + P.raise * 9) * k, o = P.open;
      g.beginPath(); g.moveTo(x + s * 9 * k, cy - 1 * k); g.quadraticCurveTo(x + s * 15 * k, cy - (1 + P.raise * 4) * k, hx, hy); g.stroke();
      g.fillStyle = H.css(H.shade(sea, 0.92)); g.beginPath(); g.arc(hx, hy, 4.6 * k, 0, 2 * Math.PI); g.fill(); g.stroke();
      g.fillStyle = H.css(paper); g.beginPath(); g.moveTo(hx, hy); g.arc(hx, hy - 1 * k, 4.6 * k, -Math.PI / 2 - 0.25 - 0.55 * o, -Math.PI / 2 + 0.25 + 0.55 * o); g.closePath(); g.fill(); g.stroke();
    });
    g.fillStyle = H.css(sea); g.beginPath();      // the shell: a scalloped dome from the polar wave, flattened like a crab
    for (i = 0; i <= 72; i++) { a = Math.PI * 2 * i / 72; var rr = R * (1 + 0.09 * Math.cos(6 * a)); g.lineTo(x + rr * Math.cos(a) * 1.08, cy + rr * Math.sin(a) * (Math.sin(a) < 0 ? 0.78 : 0.5)); }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = H.css(H.mix(sea, paper, 0.55)); g.beginPath(); oval(g, x - 3 * k, cy - 5 * k, 5 * k, 2.2 * k, 0, 2 * Math.PI); g.fill();
    [-1, 1].forEach(function (s) {                 // eyes on stalks, raised a little more while greeting
      var ex = x + s * 4.5 * k, ey = cy - (12 + P.raise * 2) * k;
      g.beginPath(); g.moveTo(x + s * 3 * k, cy - 6 * k); g.lineTo(ex, ey); g.stroke();
      g.fillStyle = H.css(paper); g.beginPath(); g.arc(ex, ey, 3 * k, 0, 2 * Math.PI); g.fill(); g.stroke();
      g.fillStyle = ink; g.beginPath(); g.arc(ex + 0.6 * k, ey + 0.3 * k, 1.3 * k, 0, 2 * Math.PI); g.fill();
    });
    g.restore();
  }

  var api = { GLIDE: GLIDE, GREET: GREET, ease: ease, pose: pose, beat: beat, track: track, loop: loop, draw: draw };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabBody = api;
})(typeof window !== 'undefined' ? window : globalThis);
