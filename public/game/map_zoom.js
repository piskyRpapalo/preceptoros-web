// H1b · the view of the colony map: zoom (0.6-3, two fingers or the wheel) and, since the orbit slice, the view angle.
// Everything lives on the canvas dataset (zoom, angle in whole degrees, panx/pany in canvas pixels) and colonia_pagina's
// geometry() reads it. Only the picture changes (law P5): no state, fog or result is touched here.
// Zoom is anchored to the pointer: the world point under the cursor (or between the fingers) stays where it is.
// Turning: Q/E or the page buttons snap by 60° (hex-friendly); right-button drag, Shift+drag or a two-finger twist turn
// freely. Pointer events read e.getCoalescedEvents() when the browser has it (W3C Pointer Events).
(function (raiz) {
  'use strict';
  var MIN = 0.6, MAX = 3, STEP = 1.25, SNAP = 60, DRAG = 0.5, SQUASH = Math.sqrt(3) / 4;   // DRAG: degrees per CSS pixel of a turning drag

  function num(v) { return Number(v) || 0; }
  function norm(deg) { return ((Math.round(deg) % 360) + 360) % 360; }

  // Pure view maths (canvas pixels). C is the canvas centre; a scene point s sits at C + pan + z·R(θ)·p.
  // zoomAt(view, z2, mx, my) → the pan that keeps the point under (mx, my) fixed when the zoom goes to z2.
  function zoomAt(view, z2, mx, my) {
    var f = z2 / view.zoom, ox = mx - view.w / 2, oy = my - view.h / 2;
    return { panx: ox - f * (ox - view.panx), pany: oy - f * (oy - view.pany) };
  }
  // turnAt(view, d, mx, my) → the pan after turning the view by d degrees around (mx, my).
  function turnAt(view, d, mx, my) {
    var a = d * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), ox = mx - view.w / 2, oy = my - view.h / 2;
    var qx = view.panx - ox, qy = view.pany - oy;
    var u = qy / SQUASH;   // the turn is on the ground, like colonia_pagina geometry().turn
    return { panx: ox + qx * cs - u * sn, pany: oy + (qx * sn + u * cs) * SQUASH };
  }
  function snapped(angle, dir) { return norm(Math.round((angle + dir * SNAP) / SNAP) * SNAP); }

  function crea(c, opts) {
    opts = opts || {};
    var zm = 1, ang = 0, pts = {}, g0 = null, drag = null, moved = 0, tween = 0, goal = null;
    var reduced = !!(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches);
    c.dataset.zoom = '1.00'; c.dataset.angle = '0';
    function changed() { if (opts.changed) { opts.changed(); } }
    function view() { return { w: c.width || 1, h: c.height || 1, zoom: zm, panx: num(c.dataset.panx), pany: num(c.dataset.pany) }; }
    function setPan(p) { c.dataset.panx = String(Math.round(p.panx)); c.dataset.pany = String(Math.round(p.pany)); }
    function local(x, y) {
      var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: c.width, height: c.height };
      return [(x - r.left) * (c.width / (r.width || 1)), (y - r.top) * (c.height / (r.height || 1))];
    }
    // fija(v, mx, my): zoom to v, anchored at the canvas point (mx, my) — the centre when no point is given.
    function fija(v, mx, my) {
      var z2 = Math.max(MIN, Math.min(MAX, v)), V = view();
      if (mx === undefined) { mx = V.w / 2; my = V.h / 2; }
      setPan(zoomAt(V, z2, mx, my)); zm = z2; c.dataset.zoom = zm.toFixed(2); changed();
    }
    // gira(d, mx, my): turn by d degrees around the canvas point (mx, my), the centre by default.
    function gira(d, mx, my) {
      var V = view(), to = norm(ang + d), real = to - ang;
      if (mx === undefined) { mx = V.w / 2; my = V.h / 2; }
      setPan(turnAt(V, real, mx, my)); ang = to; c.dataset.angle = String(ang); changed();
    }
    function last(ev) { var l = ev.getCoalescedEvents ? ev.getCoalescedEvents() : null; return l && l.length ? l[l.length - 1] : ev; }
    function pair() {
      var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]];
      return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, a: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, m: local((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
    }
    c.addEventListener('pointerdown', function (ev) {
      pts[ev.pointerId] = [ev.clientX, ev.clientY]; moved = 0;
      if (Object.keys(pts).length === 2) { g0 = pair(); drag = null; }
      else if (ev.button === 2 || ev.shiftKey) { drag = { x: ev.clientX }; }
    });
    c.addEventListener('pointermove', function (ev) {
      if (!pts[ev.pointerId]) { return; }
      var e = last(ev), prev = pts[ev.pointerId];
      moved += Math.abs(e.clientX - prev[0]) + Math.abs(e.clientY - prev[1]);
      pts[ev.pointerId] = [e.clientX, e.clientY];
      if (Object.keys(pts).length === 2 && g0) {
        var g = pair(), dz = g.d / g0.d, da = g.a - g0.a;
        if (da > 180) { da -= 360; } else if (da < -180) { da += 360; }
        fija(zm * dz, g.m[0], g.m[1]);
        g0.d = g.d;
        if (Math.abs(da) >= 1) { var r = Math.round(da); gira(r, g.m[0], g.m[1]); g0.a += r; }
      } else if (drag) {
        var dd = (e.clientX - drag.x) * DRAG;
        if (Math.abs(dd) >= 1) { gira(dd); drag.x += Math.round(dd) / DRAG; }
      }
    });
    function suelta(ev) { delete pts[ev.pointerId]; g0 = null; if (!Object.keys(pts).length) { drag = null; } }
    c.addEventListener('pointerup', suelta); c.addEventListener('pointercancel', suelta);
    // A turning drag or a pinch is not a tap: its click is swallowed so it never walks the crab.
    c.addEventListener('click', function (ev) { if (moved > 6) { ev.stopImmediatePropagation(); moved = 0; } });
    c.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    c.addEventListener('wheel', function (ev) {
      if (ev.ctrlKey) { return; } ev.preventDefault();
      var m = local(ev.clientX, ev.clientY); fija(zm * Math.exp(-ev.deltaY * 0.0015), m[0], m[1]);
    }, { passive: false });
    // snap(+1|-1): the next multiple of 60°. A short tween unless reduced motion is on; then it jumps.
    function snap(dir) {
      var to = snapped(goal === null ? ang : goal, dir), d = ((to - ang + 540) % 360) - 180, raf = raiz.requestAnimationFrame;
      tween++;
      if (reduced || !raf || !d) { gira(d); return ang; }
      var id = tween, done = 0, n = 6; goal = to;
      (function frame() {
        if (id !== tween) { return; }
        var s = Math.round(d * (done + 1) / n) - Math.round(d * done / n); done++;
        gira(s); if (done < n) { raf(frame); } else { goal = null; }
      })();
      return to;
    }
    function reset() { tween++; goal = null; zm = 1; ang = 0; c.dataset.zoom = '1.00'; c.dataset.angle = '0'; c.dataset.panx = '0'; c.dataset.pany = '0'; changed(); }
    // A11Y: the same view without a pointer — set(v), step(+1|-1|0), turn(+1|-1), reset() and the spoken line.
    return {
      factor: function () { return zm; }, angle: function () { return ang; }, set: fija,
      step: function (d) { fija(d === 0 ? 1 : zm * (d > 0 ? STEP : 1 / STEP)); return zm; },
      turn: snap, rotate: gira, reset: reset,
      say: function () { return 'Map view ' + ang + '° · zoom ' + zm.toFixed(2) + '×'; }
    };
  }

  var AtlasMapZoom = { crea: crea, create: crea, zoomAt: zoomAt, turnAt: turnAt, snapped: snapped, SQUASH: SQUASH, MIN: MIN, MAX: MAX, STEP: STEP, SNAP: SNAP };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMapZoom; } else { raiz.AtlasMapZoom = AtlasMapZoom; }
})(this);
