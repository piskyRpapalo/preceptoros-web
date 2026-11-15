// The worm on OpenWorld (Sovereign 2026-11-15: «focus on the graphics, the effects (worm-transition)»). The worm of
// public/assets/worm_transition.js lived only in the old terminal; here the same maths carry the eye from what you
// pressed to what opened: a pad key → its panel, a building on the map → its card, Settings → its sheet.
//   · the path is the Acho neck (acho_language.js neck(a, b, k, p, side)): a curve whose swell is 4p(1 − p);
//   · segments = how many times this panel opened (1..9), alpha 1 − s/(n + 1), as in the original;
//   · its colour is the pressed key's own sheet colour (--cap), ink outlined; a small ring lands on the panel's title;
//   · one second by the clock, then gone (see below); reduced motion: no worm at all, the panel just opens.
// Presentation only: nothing here opens, closes or changes a panel, a seal or the visit.
(function (root) {
  'use strict';
  // Ephemeral by construction (Sovereign 2026-11-15: «it stays like a stain on the web; a burst from the key to the
  // panel, about one second of travel, and then gone»): the flight is timed by the clock (DUR), not by counting frames;
  // each flight paints on its own canvas, and that canvas is REMOVED from the page when the flight ends, with a hard
  // stop at DUR + 300 ms even if no frame comes (a throttled tab, an exception): nothing can stay behind.
  var DUR = 1000, TRAVEL = 0.8, MAX = 9, opens = {}, last = null, live = null;
  // Pure: fade(t) → the whole burst's opacity at t ∈ [0, 1]: full while it travels, down to 0 in the last fifth.
  function fade(t) { return t <= TRAVEL ? 1 : Math.max(0, 1 - (t - TRAVEL) / (1 - TRAVEL)); }
  // Pure: plan(a, b, n, t, neck) → the burst's circles at t ∈ [0, 1]: [{x, y, r, alpha}], head first; [] after t = 1.
  function plan(a, b, n, t, neck) {
    if (!(t >= 0) || t > 1) { return []; }
    var p = Math.min(1, t / TRAVEL), segs = Math.max(1, Math.min(MAX, n || 1)), side = (segs % 2) ? 1 : -1;
    var len = Math.hypot(b[0] - a[0], b[1] - a[1]), pts = neck(a, b, Math.min(140, 16 + len / 6), p, side);
    var head = Math.round(p * (pts.length - 1)), swell = 4 * p * (1 - p), k = fade(t), out = [];
    for (var s = 0; s < segs; s++) { var q = pts[Math.max(0, head - s * 2)] || pts[0]; out.push({ x: q[0], y: q[1], r: (12 - s * 0.8) * (0.55 + 0.6 * swell) * (0.6 + 0.4 * k), alpha: (1 - s / (segs + 1)) * k }); }
    return out;
  }
  function still() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function centre(el) { if (!el || !el.getBoundingClientRect) { return null; } var r = el.getBoundingClientRect(); return r.width || r.height ? [r.left + r.width / 2, r.top + r.height / 2] : null; }
  function token(el, name) { var v = el ? root.getComputedStyle(el).getPropertyValue(name).trim() : ''; return v || root.getComputedStyle(root.document.documentElement).getPropertyValue('--a1d1b26').trim(); }
  function end(f) { if (!f || f.done) { return; } f.done = true; root.clearTimeout(f.stop); if (f.cv.parentNode) { f.cv.parentNode.removeChild(f.cv); } if (live === f) { live = null; } }
  function fly(id, b, colour) {
    var A = root.AtlasAcho, doc = root.document; if (!A || !A.neck || still() || !last || Date.now() - last.t > 900 || !b) { return; }
    opens[id] = (opens[id] || 0) + 1; end(live); // one burst at a time: a new press ends the old one at once
    var cv = doc.createElement('canvas'); cv.className = 'worm-burst'; cv.setAttribute('aria-hidden', 'true'); doc.body.appendChild(cv);
    var f = live = { cv: cv, done: false }, dpr = Math.min(2, root.devicePixelRatio || 1), g = cv.getContext('2d'), ink = token(null, '--a1d1b26'), a = [last.x, last.y], n = opens[id], t0 = 0;
    cv.width = Math.round(root.innerWidth * dpr); cv.height = Math.round(root.innerHeight * dpr);
    f.stop = root.setTimeout(function () { end(f); }, DUR + 300);
    (function frame(now) {
      if (f.done) { return; }
      try {
        var clock = root.performance ? root.performance.now() : Date.now(); if (!t0) { t0 = clock; } var t = (clock - t0) / DUR;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, root.innerWidth, root.innerHeight);
        if (t >= 1) { end(f); return; }
        plan(a, b, n, t, A.neck).forEach(function (q) { g.globalAlpha = q.alpha; g.fillStyle = colour; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, Math.max(1.5, q.r), 0, 7); g.fill(); g.stroke(); });
        if (t > 0.6) { var k = (t - 0.6) / 0.4; g.globalAlpha = Math.max(0, 1 - k); g.strokeStyle = colour; g.lineWidth = 3; g.beginPath(); g.ellipse(b[0], b[1], 10 + 26 * k, 6 + 14 * k, 0, 0, 7); g.stroke(); } // it lands
        g.globalAlpha = 1; root.requestAnimationFrame(frame);
      } catch (x) { end(f); }
    })();
  }
  function watch(doc, el, id, title, colourOf) {
    if (!el || !root.MutationObserver) { return; }
    var was = !el.hidden;
    new root.MutationObserver(function () {
      var now = !el.hidden, key = id(); if (now && (!was || key !== watch[el.id])) { root.requestAnimationFrame(function () { fly(key, centre(title()), colourOf()); }); }
      was = now; watch[el.id] = key;
    }).observe(el, { attributes: true, attributeFilter: ['hidden', 'data-active-category'] });
  }
  function mount(doc) {
    doc.addEventListener('pointerdown', function (e) { last = { x: e.clientX, y: e.clientY, t: Date.now(), el: e.target }; }, true);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { var c = centre(doc.activeElement); if (c) { last = { x: c[0], y: c[1], t: Date.now(), el: doc.activeElement }; } } }, true);
    var pressed = function () { return last && last.el && last.el.closest ? last.el.closest('button') : null; };
    var v = doc.getElementById('voices');
    watch(doc, v, function () { return 'voices:' + (v.dataset.activeCategory || ''); }, function () { return doc.getElementById('voices-title') || v; }, function () { return token(pressed(), '--cap'); });
    var later = function (n) { var bs = doc.getElementById('building-sheet'), ss = doc.getElementById('settings-sheet');
      if (!bs && n < 20) { root.setTimeout(function () { later(n + 1); }, 500); return; }
      watch(doc, bs, function () { return 'building:' + ((doc.getElementById('bs-h') || {}).textContent || ''); }, function () { return doc.getElementById('bs-h') || bs; }, function () { return token(doc.getElementById('gp-town'), '--cap'); });
      watch(doc, ss, function () { return 'settings'; }, function () { return ss && (ss.querySelector('h2,h3') || ss); }, function () { return token(doc.getElementById('gp-letters'), '--cap'); });
    };
    later(0);
  }
  var api = { plan: plan, fade: fade, DUR: DUR };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasWormPanels = api;
  if (root.document && root.document.getElementById && !(typeof module === 'object' && module.exports)) {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { mount(root.document); }); } else { mount(root.document); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
