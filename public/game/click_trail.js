// The app's transition on every click (Sovereign, 2026-11-08: «en la app tenemos una transición con sonido muy agradable,
// con una bola que va de lado a lado flotando; tráela a la web con cada click en un interactivo»). Ported from the app's
// interface/transicion.js (the worm: seven fading balls on a harmonic sway) and interface/sting.js (an FM arpeggio up from
// 220 Hz). The ball floats from the last control used to the one just tapped. No chance and no clock: the motion is a frame
// count and the sway comes from the two places. Reduced motion: no ball and no sound. The ball is aria-hidden; nothing is
// stored or sent.
(function (root) {
  'use strict';
  var FRAMES = 26, SEGMENTS = 7, SEMITONES = [0, 2, 4, 7, 9, 12, 14, 16], BASE = 220, last = null, ctx = null, cancel = null;
  // sway(a, b, u): the side-to-side offset at progress u (0..1) between two points; one harmonic, its phase from the places.
  function sway(a, b, u) {
    var phi = Math.atan2(b[1] - a[1] || 1e-9, b[0] - a[0]), d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return Math.sin(u * 2 * Math.PI + phi) * Math.min(56, d * 0.12) * Math.sin(u * Math.PI);
  }
  // path(a, b, frame): the seven balls of one frame, each a little behind the one before: [x, y, radius, alpha].
  function path(a, b, frame) {
    var tau = Math.min(1, frame / FRAMES), dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, out = [];
    for (var s = 0; s < SEGMENTS; s++) {
      var u = Math.max(0, tau - s * 0.045), off = sway(a, b, u);
      out.push([a[0] + dx * u - (dy / n) * off, a[1] + dy * u + (dx / n) * off, 5.5 - s * 0.45, 1 - s / (SEGMENTS + 1)]);
    }
    return out;
  }
  // notes(): the sting's score, so a case can read it without an AudioContext: [hz, start s, stop s].
  function notes() { return SEMITONES.map(function (st, i) { return [BASE * Math.pow(2, st / 12), i * 0.07, i * 0.07 + 0.068]; }); }
  function still(win) { return !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function sting(win) {
    var AC = win.AudioContext || win.webkitAudioContext; if (!AC) { return 'NO_DATA: Web Audio not available'; }
    try {
      ctx = ctx || new AC(); if (ctx.state === 'suspended' && ctx.resume) { ctx.resume(); }
      var t0 = ctx.currentTime + 0.01, out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t0); out.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02); out.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.57);
      out.connect(ctx.destination);
      notes().forEach(function (n) {
        var c = ctx.createOscillator(), m = ctx.createOscillator(), depth = ctx.createGain(), t = t0 + n[1];
        c.type = 'sine'; c.frequency.setValueAtTime(n[0], t); m.type = 'sine'; m.frequency.setValueAtTime(n[0] * 2, t);
        depth.gain.setValueAtTime(n[0] * 0.32, t); m.connect(depth); depth.connect(c.frequency); c.connect(out);
        c.start(t); m.start(t); c.stop(t0 + n[2]); m.stop(t0 + n[2]);
      });
      return 'played';
    } catch (e) { return 'NO_DATA: Web Audio failed: ' + (e && e.name || 'unknown'); }
  }
  function centre(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function ball(doc, win, a, b, colour) {
    if (cancel) { cancel(); }
    var cv = doc.createElement('canvas'), dpr = Math.min(2, win.devicePixelRatio || 1), frame = 0, raf = null, done = false;
    cv.className = 'click-trail'; cv.setAttribute('aria-hidden', 'true'); cv.setAttribute('role', 'presentation');
    cv.width = Math.round((win.innerWidth || 1) * dpr); cv.height = Math.round((win.innerHeight || 1) * dpr);
    doc.body.appendChild(cv);
    var g = cv.getContext('2d'); if (!g) { cv.remove(); return; }
    function draw() {
      if (done) { return; }
      g.clearRect(0, 0, cv.width, cv.height);
      path(a, b, frame).forEach(function (p) { g.globalAlpha = p[3]; g.fillStyle = colour; g.beginPath(); g.arc(p[0] * dpr, p[1] * dpr, p[2] * dpr, 0, 2 * Math.PI); g.fill(); });
      g.globalAlpha = 1; frame++;
      if (frame <= FRAMES) { raf = win.requestAnimationFrame(draw); } else { stop(); }
    }
    function stop() { done = true; if (raf !== null) { win.cancelAnimationFrame(raf); } cv.remove(); cancel = null; }
    cancel = stop; raf = win.requestAnimationFrame(draw);
  }
  var PICK = 'button, [role=button], summary, a[href], [role=tab]';
  function mount(doc, win) {
    doc.addEventListener('click', function (e) {
      var el = e.target && e.target.closest && e.target.closest(PICK);
      if (!el || el.disabled || still(win)) { last = el || last; return; }
      var b = centre(el), a = last && last.isConnected ? centre(last) : [b[0], (win.innerHeight || b[1]) - 24];
      ball(doc, win, a, b, win.getComputedStyle(el).color); sting(win); last = el;
    }, true);
  }
  var api = { FRAMES: FRAMES, SEGMENTS: SEGMENTS, sway: sway, path: path, notes: notes, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasClickTrail = api;
  if (root.document && root.document.addEventListener && !(typeof module === 'object' && module.exports)) { mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
