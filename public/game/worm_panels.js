// The worm on OpenWorld (Sovereign 2026-11-15: «focus on the graphics, the effects (worm-transition)»). The worm of
// public/assets/worm_transition.js lived only in the old terminal; here the same maths carry the eye from what you
// pressed to what opened: a pad key → its panel, a building on the map → its card, Settings → its sheet.
//   · the path is the Acho neck (acho_language.js neck(a, b, k, p, side)): a curve whose swell is 4p(1 − p);
//   · segments = how many times this panel opened (1..9), alpha 1 − s/(n + 1), as in the original;
//   · its colour is the pressed key's own sheet colour (--cap), ink outlined; a small ring lands on the panel's title;
//   · frames are counted (27 ≈ 450 ms), no clock decides; reduced motion: no worm at all, the panel just opens.
// Presentation only: nothing here opens, closes or changes a panel, a seal or the visit.
(function (root) {
  'use strict';
  var FRAMES = 27, MAX = 9, opens = {}, last = null, cv = null, run = 0;
  // Pure: plan(a, b, n, f) → the segment circles of frame f: [{x, y, r, alpha}], head first; [] after the last frame.
  function plan(a, b, n, f, neck) {
    if (f > FRAMES) { return []; }
    var p = f / FRAMES, segs = Math.max(1, Math.min(MAX, n || 1)), side = (segs % 2) ? 1 : -1;
    var len = Math.hypot(b[0] - a[0], b[1] - a[1]), pts = neck(a, b, Math.min(140, 16 + len / 6), p, side);
    var head = Math.round(p * (pts.length - 1)), swell = 4 * p * (1 - p), out = [];
    for (var s = 0; s < segs; s++) { var q = pts[Math.max(0, head - s * 2)]; out.push({ x: q[0], y: q[1], r: (12 - s * 0.8) * (0.55 + 0.6 * swell), alpha: 1 - s / (segs + 1) }); }
    return out;
  }
  function still() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function centre(el) { if (!el || !el.getBoundingClientRect) { return null; } var r = el.getBoundingClientRect(); return r.width || r.height ? [r.left + r.width / 2, r.top + r.height / 2] : null; }
  function token(el, name) { var v = el ? root.getComputedStyle(el).getPropertyValue(name).trim() : ''; return v || root.getComputedStyle(root.document.documentElement).getPropertyValue('--a1d1b26').trim(); }
  function fly(id, b, colour) {
    var A = root.AtlasAcho, doc = root.document; if (!A || !A.neck || still() || !last || Date.now() - last.t > 900 || !b) { return; }
    opens[id] = (opens[id] || 0) + 1;
    if (!cv) { cv = doc.createElement('canvas'); cv.id = 'worm-panels'; cv.setAttribute('aria-hidden', 'true'); doc.body.appendChild(cv); }
    var dpr = Math.min(2, root.devicePixelRatio || 1), g = cv.getContext('2d'), ink = token(null, '--a1d1b26'), a = [last.x, last.y], n = opens[id], f = 0, me = ++run;
    cv.width = Math.round(root.innerWidth * dpr); cv.height = Math.round(root.innerHeight * dpr);
    (function frame() {
      if (me !== run) { return; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      var c = plan(a, b, n, f, A.neck);
      c.forEach(function (q) { g.globalAlpha = q.alpha; g.fillStyle = colour; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, Math.max(1.5, q.r), 0, 7); g.fill(); g.stroke(); });
      if (f > FRAMES * 0.7) { var k = (f - FRAMES * 0.7) / (FRAMES * 0.3); g.globalAlpha = 1 - k; g.strokeStyle = colour; g.lineWidth = 3; g.beginPath(); g.ellipse(b[0], b[1], 10 + 26 * k, 6 + 14 * k, 0, 0, 7); g.stroke(); } // it lands
      g.globalAlpha = 1;
      if (f++ <= FRAMES) { root.requestAnimationFrame(frame); } else { g.clearRect(0, 0, cv.width, cv.height); }
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
  var api = { plan: plan, FRAMES: FRAMES };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasWormPanels = api;
  if (root.document && root.document.getElementById && !(typeof module === 'object' && module.exports)) {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { mount(root.document); }); } else { mount(root.document); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
