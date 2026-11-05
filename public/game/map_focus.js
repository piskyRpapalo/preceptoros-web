// Tab to every bubble of the map (buzon#30, 2026-11-02, NO_DATA filled): each node drawn on the canvas gets a real,
// focusable proxy <button> (44×44) over its anchor, placed by the ONE placement of colony_page.js (anchorOf) on every
// visitor:draw, so it follows redraw, zoom and pan. Its name is the node's own bubble sentence (and its building's: the
// building stands on the node's anchor and Enter on the node enters it). Tab order is the map's depth order (back to
// front, then left to right); the «?» marks of hitl_walkers.js are moved right after their node. Enter or Space = a tap.
// The focused node gets a ring drawn on the canvas (solid ring + dashed ring: shape, never colour alone).
// Pure core (order, label) + a browser layer. No clock, no randomness, no network.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  // order(items) → the items sorted back to front (smaller y first), then left to right. Ties keep the id order.
  function order(items) {
    return items.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
  }
  // label(id, sentences) → the accessible name of a node's proxy: its bubble sentences, then what Enter does.
  function label(id, sentences) {
    var said = (sentences || []).filter(Boolean).join('; ');
    return 'Map node ' + id + (said ? ': ' + said : '') + '. Enter walks there; on it, Enter goes in.';
  }
  // forced(win) → true when the system paints its own colours (Windows high contrast).
  function forced(win) { return !!(win && win.matchMedia && win.matchMedia('(forced-colors: active)').matches); }

  function attach(win) {
    var doc = win.document, surface = doc.getElementById('surface');
    if (!surface) { return null; }
    var mapVoice = doc.querySelector('#voices [data-speaker="Map"]');
    if (mapVoice) {
      var list = doc.createElement('div'), items = {};
      list.id = 'map-node-list'; list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Map places'); mapVoice.appendChild(list);
      surface.addEventListener('visitor:draw', function () {
        var v = win.AtlasOpenworldView && win.AtlasOpenworldView(), keep = {};
        if (v && v.colony) {
          v.colony.nodes.forEach(function (n) {
            var b = items[n.id];
            if (!b) {
              b = items[n.id] = doc.createElement('button'); b.type = 'button'; b.className = 'map-place'; b.dataset.node = n.id;
              b.textContent = 'Walk to ' + n.id; b.setAttribute('aria-label', 'Walk to ' + n.id);
              b.addEventListener('click', function () { var view = win.AtlasOpenworldView(); if (view && view.controls) { view.controls.walkTo(n.id); } });
              list.appendChild(b);
            }
            keep[n.id] = true;
          });
        }
        Object.keys(items).forEach(function (id) { if (!keep[id]) { items[id].remove(); delete items[id]; } });
      });
      return { proxies: items };
    }
    var holder = surface.parentNode, layer = doc.createElement('div'), proxies = {};
    layer.id = 'map-proxies'; layer.setAttribute('role', 'group'); layer.setAttribute('aria-label', 'Map bubbles: Tab moves between them');
    surface.after(layer);
    function view() { return win.AtlasOpenworldView ? win.AtlasOpenworldView() : null; }
    function proxy(id) {
      var b = proxies[id];
      if (!b) {
        b = proxies[id] = doc.createElement('button');
        b.type = 'button'; b.className = 'map-proxy'; b.dataset.node = id;
        b.addEventListener('click', function () { var v = view(); if (v && v.controls) { v.controls.walkTo(id); } });
        b.addEventListener('focus', function () { var v = view(); if (v && v.redraw) { v.redraw(); } });
        b.addEventListener('blur', function () { var v = view(); if (v && v.redraw) { v.redraw(); } });
      }
      return b;
    }
    // ring(g, x, y): the canvas focus ring, a solid ring and a dashed ring in one ink (the system's under forced colours).
    function ring(g, x, y) {
      var T = win.AtlasComicTokens, ink = forced(win) ? 'CanvasText' : (T && T.NEUTRAL && T.NEUTRAL.ink) || 'black';
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.lineWidth = 3; g.strokeStyle = ink;
      g.beginPath(); g.arc(x, y, 30, 0, 6.283); g.stroke();
      g.setLineDash([6, 4]); g.beginPath(); g.arc(x, y, 36, 0, 6.283); g.stroke(); g.restore();
      layer.dataset.ring = Math.round(x) + ',' + Math.round(y);
    }
    surface.addEventListener('visitor:draw', function () {
      var v = view(), CP = win.AtlasColoniaPagina, keep = {};
      layer.dataset.ring = '';
      try {
        if (!v || !v.colony || !CP) { throw new Error('no colony'); }
        var sc = CP.scene(v.colony, v.t, false, v.looks, v.seals), rect = surface.getBoundingClientRect();
        var sx = (rect.width || surface.width) / surface.width, sy = (rect.height || surface.height) / surface.height;
        var first = function (f) { return f && f.atoms && f.atoms[0] ? f.atoms[0].r : ''; };
        var items = sc.tiles.map(function (n) {
          var a = CP.anchorOf(surface, v.colony, v.t, v.looks, v.seals, n.id);
          var said = [first(n.frame)].concat(sc.buildings.filter(function (b) { return b.node === n.id; }).map(function (b) { return first(b.frame); }));
          return { id: n.id, x: a.x, y: a.y, said: said };
        });
        var want = [];
        order(items).forEach(function (it) {
          var b = proxy(it.id); keep[it.id] = true; want.push(b);
          var name = label(it.id, it.said); if (b.getAttribute('aria-label') !== name) { b.setAttribute('aria-label', name); }
          b.style.left = (surface.offsetLeft + it.x * sx - 22) + 'px'; b.style.top = (surface.offsetTop + it.y * sy - 22) + 'px';
          var mark = holder.querySelector('.hitl-mark[data-node="' + it.id + '"]'); if (mark) { want.push(mark); }
          if (doc.activeElement === b || (mark && doc.activeElement === mark)) { ring(surface.getContext('2d'), it.x, it.y); }
        });
        // Re-append only when the depth order changed: moving a focused button would drop its focus.
        var now = Array.prototype.slice.call(layer.children);
        if (now.length !== want.length || want.some(function (b, i) { return now[i] !== b; })) { want.forEach(function (b) { layer.appendChild(b); }); }
      } catch (e) { /* no colony: no proxies */ }
      Object.keys(proxies).forEach(function (id) { if (!keep[id]) { proxies[id].remove(); delete proxies[id]; } });
    });
    return { proxies: proxies };
  }
  var P = { order: order, label: label, forced: forced, attach: attach };
  if (common) { module.exports = P; } else { root.AtlasMapFocus = P; if (root.document) { P.attached = attach(root); } }
})(typeof globalThis === 'object' ? globalThis : this);
