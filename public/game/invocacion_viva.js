// The summon comes alive (render and sound only). A signed summon or a Voice Star grant gets a particle burst in the
// bubble language (circles and arcs, house tokens), a deterministic voice through the house sonification
// (bubble_sonify.js, only after «Listen») and, on entering a building, a tunnel of hexagonal rings.
// This layer NEVER decides: the egg, the seal and the copper come from visitor_eggs.js; it only draws what was signed.
// Determinism: the seed is a hash of the event receipt; frames are counted, never a clock; no random source.
// Rosetta: the tunnel's maths are own work, ported from public/assets/worm_transition.js (segments counted by the
// attempt, alpha 1 - s/(n+1), the 4p(1-p) swell) onto hexagonal rings instead of the worm's neck.
(function (root) {
  'use strict';
  var FRAMES = 90;            // 1.5 s at 60 frames per second
  var TUNNEL_FRAMES = 36;     // 600 ms at 60 frames per second
  var GRAVITY = 0.35, BOUNCE = 0.55, DAMP = 0.96, BOUND = 200;
  var TOKENS = ['LIVE.base', 'PROPUESTA.base', 'FIRMADO.base', 'cyan'];
  var EGGS = { tc1: 'reef', tc2: 'sentinel', tc3: 'leviathan', tc4: 'herald' };

  // seedOf(text) → FNV-1a 32-bit of the receipt text.
  function seedOf(text) {
    var h = 0x811c9dc5, s = String(text);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  // A small integer generator (mulberry32) fed only by the seed.
  function generator(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // particles(receipt) → the initial particles: position on the floor plane (x, y), height z, velocities, shape.
  function particles(receipt) {
    var g = generator(seedOf(receipt)), n = 12 + Math.floor(g() * 9), out = [];
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * 2 * Math.PI + g() * 0.5, sp = 1.5 + g() * 2;
      out.push({ kind: g() < 0.6 ? 'circle' : 'arc', x: 0, y: 0, z: 0, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        vz: 3 + g() * 3, r: 2 + Math.floor(g() * 5), a0: g() * 2 * Math.PI, sweep: 1 + g() * 2.5, spin: (g() - 0.5) * 0.3,
        token: TOKENS[Math.floor(g() * TOKENS.length)] });
    }
    return out;
  }
  // step(p): gravity on z, a bounce on the isometric floor (z = 0) and damping. Pure; returns a new particle.
  function step(p) {
    var q = { kind: p.kind, x: p.x + p.vx, y: p.y + p.vy, z: p.z + p.vz, vx: p.vx * DAMP, vy: p.vy * DAMP, vz: (p.vz - GRAVITY) * 0.99,
      r: p.r, a0: p.a0 + p.spin, sweep: p.sweep, spin: p.spin * DAMP, token: p.token };
    if (q.z < 0) { q.z = -q.z * BOUNCE; q.vz = -q.vz * BOUNCE; }
    return q;
  }
  // project(p) → screen offset of a floor-plane point (the same 2:1 isometric of the colony floor).
  function project(p) { return { sx: p.x - p.y, sy: (p.x + p.y) / 2 - p.z }; }
  // simulate(receipt) → FRAMES frames, each the list of drawn particles { kind, sx, sy, r, a0, a1, alpha, token }.
  function simulate(receipt, frames) {
    var n = Math.min(FRAMES, frames || FRAMES), ps = particles(receipt), out = [];
    for (var f = 0; f < n; f++) {
      var alpha = 1 - f / n;
      out.push(ps.map(function (p) {
        var s = project(p);
        return { kind: p.kind, sx: Math.max(-BOUND, Math.min(BOUND, s.sx)), sy: Math.max(-BOUND, Math.min(BOUND, s.sy)), r: p.r, a0: p.a0, a1: p.a0 + p.sweep, alpha: alpha, token: p.token };
      }));
      ps = ps.map(step);
    }
    return out;
  }
  // plan(receipt, reduced): reduced motion → one static ring and no frames.
  function plan(receipt, reduced) {
    if (reduced) { return { animated: false, frames: [], ring: { r: 18, token: TOKENS[seedOf(receipt) % TOKENS.length] } }; }
    return { animated: true, frames: simulate(receipt), ring: null };
  }
  // describe(event) → the text equivalent for #state (never colour only).
  function describe(e) {
    if (e.type === 'summon') { return 'Summoned · ' + (EGGS[e.tc] || e.tc) + ' egg · ' + e.copper + ' copper'; }
    return 'Voice Star · +' + e.copper + ' copper · answer ' + String(e.sha || 'NO_DATA').slice(0, 8);
  }
  function receiptOf(e) { return e.type === 'summon' ? 'summon|' + e.tc + '|' + e.seq + '|' + e.step : 'echo|' + e.sha + '|' + e.echoes; }
  // voice(receipt) → a frame with one wave and its harmonics [k, ax, ay, ph], for AtlasSonifyBubble.sonify.
  function voice(receipt) {
    var g = generator(seedOf('voice|' + receipt)), h = [[1, 8, 8, 0]];
    for (var i = 0; i < 3; i++) { h.push([2 + Math.floor(g() * 12), 1 + Math.floor(g() * 6), 1 + Math.floor(g() * 6), Math.floor(g() * 64)]); }
    return { sound: 'ok', atoms: [{ i: [{ o: 'wave', h: h }] }] };
  }
  // hexRings(p, n) → the tunnel at progress p in [0, 1]: n hexagonal rings expanding outwards.
  function hexRings(p, n) {
    p = Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0; n = Math.max(1, Math.min(9, n || 4));
    var swell = 4 * p * (1 - p), out = [];
    for (var s = 0; s < n; s++) {
      var r = Math.max(0, (p * 1.6 - s * 0.15)) * 240, pts = [];
      for (var k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; pts.push([r * Math.cos(a), r * Math.sin(a) / 2]); }
      out.push({ r: r, alpha: (1 - s / (n + 1)) * Math.max(0.2, swell), pts: pts });
    }
    return out;
  }

  // ---- DOM: only drawing, sound after «Listen», and the state line. ----
  var D = root.document, soundOn = false, overlay = null, run = 0;
  function quiet() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function colour(token) {
    var T = root.AtlasComicTokens; return T && T.FRONT_DOOR && T.FRONT_DOOR[token] ? T.FRONT_DOOR[token] : (T && T.NEUTRAL ? T.NEUTRAL.cyan : 'currentColor');
  }
  // The layer sits right after the map canvas, in its box: the sheets that cover the map also cover the burst.
  function layer(surface) {
    if (!overlay) {
      overlay = D.createElement('canvas'); overlay.id = 'invocation-layer'; overlay.setAttribute('aria-hidden', 'true');
      overlay.style.position = 'absolute'; overlay.style.pointerEvents = 'none'; surface.after(overlay);
      var host = surface.parentElement;
      if (host && root.getComputedStyle && root.getComputedStyle(host).position === 'static') { host.style.position = 'relative'; }
    }
    var q = surface.getBoundingClientRect();
    overlay.style.left = surface.offsetLeft + 'px'; overlay.style.top = surface.offsetTop + 'px'; overlay.style.width = q.width + 'px'; overlay.style.height = q.height + 'px';
    overlay.width = Math.round(q.width); overlay.height = Math.round(q.height);
    return { g: overlay.getContext('2d'), q: q };
  }
  // The crab's position through the ONE placement (colonia_pagina geometry); the centre of the map otherwise.
  function crabAt(surface, q) {
    try {
      var V = root.AtlasOpenworldView && root.AtlasOpenworldView(), CP = root.AtlasColoniaPagina, w = V && V.controls && V.controls.walker();
      var a = V && V.colony && w && CP ? CP.anchorOf(surface, V.colony, V.t, V.looks, V.seals, w.node) : null;
      if (a) { return { x: a.x * q.width / surface.width, y: a.y * q.height / surface.height - 12 }; }
    } catch (_) { /* the centre below */ }
    return { x: q.width / 2, y: q.height / 2 };
  }
  function paint(g, o, ps) {
    ps.forEach(function (p) {
      g.globalAlpha = p.alpha; g.strokeStyle = g.fillStyle = colour(p.token); g.lineWidth = 2; g.beginPath();
      if (p.kind === 'circle') { g.arc(o.x + p.sx, o.y + p.sy, p.r, 0, 2 * Math.PI); g.fill(); }
      else { g.arc(o.x + p.sx, o.y + p.sy, p.r + 3, p.a0, p.a1); g.stroke(); }
    });
    g.globalAlpha = 1;
  }
  function play(receipt) {
    if (!soundOn) { return 0; }
    var S = root.AtlasSonifyBubble, Ctx = root.AudioContext || root.webkitAudioContext;
    if (!S || !Ctx) { return 0; }
    var r = S.sonify(voice(receipt)); if (!r.ok) { return 0; }
    try { return S.play(r, new Ctx()); } catch (_) { return 0; }
  }
  function burst(e) {
    var surface = D.getElementById('surface'), state = D.getElementById('state'), receipt = receiptOf(e);
    if (state && e.type === 'summon') { state.textContent = describe(e); }
    play(receipt);
    if (!surface) { return; }
    var L = layer(surface), o = crabAt(surface, L.q), pl = plan(receipt, quiet()), mine = ++run;
    overlay.dataset.burst = pl.animated ? 'animated' : 'ring';
    if (!pl.animated) {
      L.g.globalAlpha = 1; L.g.strokeStyle = colour(pl.ring.token); L.g.lineWidth = 3; L.g.beginPath(); L.g.arc(o.x, o.y, pl.ring.r, 0, 2 * Math.PI); L.g.stroke();
      return;
    }
    var f = 0;
    (function frame() {
      if (mine !== run) { return; }
      L.g.clearRect(0, 0, overlay.width, overlay.height);
      if (f >= pl.frames.length) { overlay.dataset.burst = 'done'; return; }
      overlay.dataset.frame = String(f);
      paint(L.g, o, pl.frames[f++]); root.requestAnimationFrame(frame);
    })();
  }
  // tunnel(then): hexagonal rings for TUNNEL_FRAMES frames (≤ 600 ms), then the building's chat. Reduced → at once.
  function tunnel(then) {
    var surface = D.getElementById('surface');
    if (quiet() || !surface || !root.requestAnimationFrame) { then(); return; }
    var L = layer(surface), o = { x: L.q.width / 2, y: L.q.height / 2 }, f = 0, mine = ++run, tok = colour('cyan'), done = false;
    overlay.dataset.tunnel = 'running';
    function end() { if (done) { return; } done = true; L.g.clearRect(0, 0, overlay.width, overlay.height); overlay.dataset.tunnel = 'done'; then(); }
    (function frame() {
      if (mine !== run) { end(); return; }
      L.g.clearRect(0, 0, overlay.width, overlay.height);
      if (f > TUNNEL_FRAMES) { end(); return; }
      hexRings(f / TUNNEL_FRAMES, 4).forEach(function (ring) {
        L.g.globalAlpha = ring.alpha; L.g.strokeStyle = tok; L.g.lineWidth = 3; L.g.beginPath();
        ring.pts.forEach(function (pt, i) { if (i) { L.g.lineTo(o.x + pt[0], o.y + pt[1]); } else { L.g.moveTo(o.x + pt[0], o.y + pt[1]); } });
        L.g.closePath(); L.g.stroke();
      });
      L.g.globalAlpha = 1; f++; root.requestAnimationFrame(frame);
    })();
  }

  var api = { FRAMES: FRAMES, TUNNEL_FRAMES: TUNNEL_FRAMES, BOUND: BOUND, EGGS: EGGS, seedOf: seedOf, particles: particles, step: step,
    project: project, simulate: simulate, plan: plan, describe: describe, receiptOf: receiptOf, voice: voice, hexRings: hexRings,
    burst: burst, tunnel: tunnel };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.AtlasInvocacionViva = api;
  if (D) {
    // «Listen» law: no sound until the visitor presses Listen on this page.
    D.addEventListener('click', function (ev) { var t = ev.target; if (t && t.id === 'listen') { soundOn = true; } }, true);
    D.addEventListener('invocation:signed', function (ev) { var d = ev.detail || {}; burst({ type: 'summon', tc: d.tc, copper: d.copper, seq: d.seq, step: d.step }); });
    D.addEventListener('voicestar:granted', function (ev) { var d = ev.detail || {}; burst({ type: 'echo', copper: d.copper, sha: d.sha, echoes: d.echoes }); });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
