// The crab's stage (Sovereign, 2026-11-08; odd/tasks/crab-stage.md): summons and duels happen on the map, where the crab
// stands. When an egg hatches (summon_reveal.js «.revela») or a practice duel opens (visitor_battle_ui.js dialog), the
// camera zooms into the crab's hex and the scene pops out of the crab over the map; on close the camera eases back to
// where it was. Only the picture moves (law P5): no state, result or seal is touched. Reduced motion: still cuts.
(function (root) {
  'use strict';
  var doc = root.document, ZOOM = 2.2, MS = 520, saved = null;
  function surface() { return doc.getElementById('surface'); }
  function still() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function view() { var v = root.AtlasOpenworldView && root.AtlasOpenworldView(); return v && v.redraw ? v : null; }
  // Pure: the eased value at progress p (0..1) of a tween from a to b (ease-out cubic). Tested in crab_stage_cases.
  function ease(a, b, p) { var q = Math.max(0, Math.min(1, p)); return a + (b - a) * (1 - Math.pow(1 - q, 3)); }
  // Pure: the pan that puts the crab (x, y) in the middle of a w × h canvas, from the current pan.
  function centre(pan, x, y, w, h) { return { x: Math.round(pan.x + w / 2 - x), y: Math.round(pan.y + h / 2 - y) }; }

  function pan(s) { return { x: Number(s.dataset.panx) || 0, y: Number(s.dataset.pany) || 0 }; }
  function setPan(s, p) { s.dataset.panx = String(p.x); s.dataset.pany = String(p.y); }
  function follow(s) {
    var x = Number(s.dataset.youx), y = Number(s.dataset.youy);
    if (s.dataset.youx && isFinite(x) && isFinite(y)) { setPan(s, centre(pan(s), x, y, s.width, s.height)); }
  }
  function tween(s, v, z0, z1, p0, p1, done) {
    var t0 = null, ms = still() ? 0 : MS;
    function frame(ts) {
      if (t0 === null) { t0 = ts; }
      var p = ms ? (ts - t0) / ms : 1;
      s.dataset.zoom = String(ease(z0, z1, p));
      if (p1) { setPan(s, { x: Math.round(ease(p0.x, p1.x, p)), y: Math.round(ease(p0.y, p1.y, p)) }); }
      v.redraw(); if (!p1) { follow(s); }
      if (p < 1) { root.requestAnimationFrame(frame); } else { v.redraw(); if (done) { done(); } }
    }
    if (root.requestAnimationFrame) { root.requestAnimationFrame(frame); } else { frame(0); }
  }
  // focus(true) zooms into the crab and remembers the camera; focus(false) eases back to it.
  function focus(on) {
    var s = surface(), v = view();
    if (!s || !v) { return false; }
    if (on && !saved) {
      saved = { z: Number(s.dataset.zoom) || 1, p: pan(s), look: s.dataset.look };
      delete s.dataset.look; s.dataset.stage = '1';
      tween(s, v, saved.z, Math.max(saved.z, ZOOM), null, null);
    } else if (!on && saved) {
      var back = saved; saved = null;
      tween(s, v, Number(s.dataset.zoom) || 1, back.z, pan(s), back.p, function () {
        delete s.dataset.stage; if (back.look) { s.dataset.look = back.look; }
      });
    }
    return true;
  }
  // look(): after an accepted action, zoom onto the crab and stay (no way back is saved; the visitor's own pan or zoom
  // takes the camera from here). A scene already on stage keeps its own camera.
  function look() {
    var s = surface(), v = view();
    if (!s || !v || saved) { return false; }
    delete s.dataset.look; tween(s, v, Number(s.dataset.zoom) || 1, Math.max(Number(s.dataset.zoom) || 1, ZOOM), null, null); return true;
  }
  // The scene pops out of the crab: its transform origin is the crab's place on the map, in CSS pixels.
  function origin(el) {
    var s = surface(), r = s && s.getBoundingClientRect(), k = r && r.width ? r.width / s.width : 1;
    if (s && s.dataset.youx) { el.style.setProperty('--ox', Math.round(Number(s.dataset.youx) * k) + 'px'); el.style.setProperty('--oy', Math.round(Number(s.dataset.youy) * k) + 'px'); }
  }
  function onMap(el) {
    var st = doc.getElementById('stage');
    if (!st) { return false; }
    origin(el); el.classList.add('on-map'); st.appendChild(el);
    if (st.scrollIntoView) { st.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' }); }
    focus(true); return true;
  }
  // hold(dialog): the duel opens on the map, not over the page (visitor_battle_ui.js); false → the caller shows it as before.
  function hold(d) {
    if (!onMap(d)) { return false; }
    d.style.width = ''; if (d.querySelector('canvas')) { d.classList.add('duel'); } d.show(); // a duel: its waves on the map itself (piece 6)
    d.addEventListener('close', function () { focus(false); d.remove(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); d.close(); } });
    var f = d.querySelector('button'); if (f) { f.focus({ preventScroll: true }); }
    return true;
  }
  // The egg's reveal (summon_reveal.js) is born full screen; on /openworld/ it moves onto the map over the crab.
  function watch() {
    if (!root.MutationObserver || !doc.body) { return; }
    new root.MutationObserver(function (list) {
      list.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.classList && n.classList.contains('revela') && !n.classList.contains('on-map')) { onMap(n); } });
        Array.prototype.forEach.call(m.removedNodes, function (n) { if (n.classList && n.classList.contains('revela') && !n.isConnected) { focus(false); } });
      });
    }).observe(doc.body, { childList: true, subtree: true });
  }

  var api = { ZOOM: ZOOM, ease: ease, centre: centre, focus: focus, hold: hold, look: look };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCrabStage = api;
  if (doc && doc.getElementById) { watch(); }
})(typeof window !== 'undefined' ? window : globalThis);
