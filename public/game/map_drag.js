// Pieza 3 · LA MANO (odd/tasks/la-mano-la-voz.md §2): one finger drags the map. Only the picture moves (law P5): the pan
// lives on the canvas dataset (panx/pany, canvas pixels) beside map_zoom.js's zoom and angle, and every redraw reads it.
// While the visitor looks around, dataset.look = '1' and colonia_pagina follow() leaves the camera alone; a tap or ⌂ hands
// it back to the crab. Two fingers stay with map_zoom.js (pinch and twist); its click guard already swallows a drag's click.
// Keyboard: W A S D move the view (Q/E turn it, map_zoom); the view is spoken in #zoom-state once the finger lifts.
(function (raiz) {
  'use strict';
  var TAP = 6, BOUND = 0.75, FRENO = 0.9, KEY = 0.12;   // TAP: CSS px a finger may wander and still be a tap

  // clamp(pan, w, h, z) → the pan kept within BOUND of the zoomed canvas on each side (pure).
  function clamp(p, w, h, z) {
    var lx = Math.round(w * z * BOUND), ly = Math.round(h * z * BOUND);
    return { panx: Math.max(-lx, Math.min(lx, Math.round(p.panx))), pany: Math.max(-ly, Math.min(ly, Math.round(p.pany))) };
  }

  // rest(pan, v, w, h, z) → where a coast from velocity v stops (pure, J7): the same brake and bound as the frames,
  // run ahead without drawing, so the destination is spoken the instant the finger lifts (about 9·v, bounded).
  function rest(p, v, w, h, z) {
    for (v = v.slice(); ;) {
      v = [v[0] * FRENO, v[1] * FRENO];
      if (Math.abs(v[0]) + Math.abs(v[1]) < 0.5) { return p; }
      p = clamp({ panx: p.panx + v[0], pany: p.pany + v[1] }, w, h, z);
    }
  }

  function attach(c, opts) {
    opts = opts || {};
    var doc = c.ownerDocument, pts = {}, one = null, vel = [0, 0], raf = raiz.requestAnimationFrame, queued = false, coast = 0;
    var reduced = !!(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function redraw() {
      if (queued) { return; } queued = true;
      var go = function () { queued = false; var V = raiz.AtlasOpenworldView && raiz.AtlasOpenworldView(); if (V && V.redraw) { V.redraw(); } };
      if (raf) { raf(go); } else { go(); }
    }
    function say(text) { var s = doc.getElementById('zoom-state'); if (s) { s.textContent = text; } }
    function where() { return 'Map view moved · ' + (Number(c.dataset.panx) || 0) + ', ' + (Number(c.dataset.pany) || 0) + ' px'; }
    function scale() { var r = c.getBoundingClientRect ? c.getBoundingClientRect() : null; return r && r.width ? c.width / r.width : 1; }
    // move(dx, dy) in canvas pixels: the picture follows the finger, bounded; the camera is the visitor's now.
    function move(dx, dy) {
      var p = clamp({ panx: (Number(c.dataset.panx) || 0) + dx, pany: (Number(c.dataset.pany) || 0) + dy }, c.width || 1, c.height || 1, Number(c.dataset.zoom) || 1);
      c.dataset.panx = String(p.panx); c.dataset.pany = String(p.pany); c.dataset.look = '1'; redraw();
    }
    function home() { delete c.dataset.look; redraw(); }
    c.addEventListener('pointerdown', function (ev) {
      coast++;
      pts[ev.pointerId] = 1;
      var n = Object.keys(pts).length;
      // One finger (or a plain left button) drags; a second finger, the right button or Shift belong to map_zoom.js.
      one = n === 1 && ev.button === 0 && !ev.shiftKey ? { id: ev.pointerId, x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, far: false, t: ev.timeStamp } : null;
    });
    c.addEventListener('pointermove', function (ev) {
      if (!one || ev.pointerId !== one.id || Object.keys(pts).length !== 1) { return; }
      var l = ev.getCoalescedEvents ? ev.getCoalescedEvents() : null, e = l && l.length ? l[l.length - 1] : ev;
      if (!one.far && Math.abs(e.clientX - one.sx) + Math.abs(e.clientY - one.sy) <= TAP) { return; }
      one.far = true;
      var k = scale(), dx = (e.clientX - one.x) * k, dy = (e.clientY - one.y) * k, dt = Math.max(1, e.timeStamp - one.t);
      vel = [dx / dt * 16, dy / dt * 16];
      one.x = e.clientX; one.y = e.clientY; one.t = e.timeStamp;
      move(dx, dy);
    });
    function lift(ev) {
      var was = one && ev.pointerId === one.id ? one : null;
      delete pts[ev.pointerId];
      if (Object.keys(pts).length !== 1) { one = null; }
      if (!was || !was.far) { return; }
      one = null; say(where());
      // A short coast with a brake, unless reduced motion is on.
      if (reduced || !raf || Math.abs(vel[0]) + Math.abs(vel[1]) < 1) { return; }
      var id = ++coast, v = vel.slice();
      var end = rest({ panx: Number(c.dataset.panx) || 0, pany: Number(c.dataset.pany) || 0 }, v, c.width || 1, c.height || 1, Number(c.dataset.zoom) || 1);
      say('Map view moved · stops at ' + end.panx + ', ' + end.pany + ' px');
      (function frame() {
        if (id !== coast) { return; }
        v = [v[0] * FRENO, v[1] * FRENO];
        if (Math.abs(v[0]) + Math.abs(v[1]) < 0.5) { say(where()); return; }
        move(v[0], v[1]); raf(frame);
      })();
    }
    c.addEventListener('pointerup', lift); c.addEventListener('pointercancel', lift);
    // A click that survives map_zoom's guard is a tap: the camera goes back to the crab.
    c.addEventListener('click', function () { if (c.dataset.look) { coast++; home(); } });
    doc.addEventListener('keydown', function (e) {
      var t = e.target, field = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (field || e.ctrlKey || e.metaKey || e.altKey) { return; }
      var d = { w: [0, 1], a: [1, 0], s: [0, -1], d: [-1, 0] }[String(e.key).toLowerCase()];
      if (!d) { return; }
      e.preventDefault(); coast++;
      move(d[0] * (c.width || 1) * KEY, d[1] * (c.height || 1) * KEY); say(where());
    });
    return { move: move, home: home };
  }

  var api = { attach: attach, clamp: clamp, rest: rest, TAP: TAP, BOUND: BOUND, FRENO: FRENO };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  raiz.AtlasMapDrag = api;
  // Attach after the page script has built the map (and map_zoom's click guard, so a drag's click is already swallowed).
  var doc = raiz.document;
  if (doc && doc.getElementById) {
    var go = function () { var c = doc.getElementById('surface'); if (c && raiz.AtlasMapZoom) { raiz.AtlasMapPan = attach(c); var s = doc.createElement('script'); s.src = '/game/map_view_joystick.js'; doc.head.appendChild(s); } };
    if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', go); } else { go(); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
