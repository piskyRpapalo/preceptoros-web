// P5a · the HITL «?» and the deterministic walkers of the colony (plan 2.5D, F4). Pure part: no DOM, no clock, no
// random numbers, no network. A walker is the bot of one node walking from the tutorial cabin to its parcel over the
// visible route (walk_route.js). Its pose is a function of (seed, tick) alone. States are a taxonomy, each with its
// own shape and its own text, never colour alone: walking · building · needs-you · NO_DATA.
// The browser part draws on the one placement of colonia_pagina.js (anchorOf) and puts one real button over each «?».
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var W = common ? require('./walk_route.js') : root.AtlasWalkRoute;
  var FRAMES = W.FRAMES, S = 1.4, LIFT = 128;   // LIFT: canvas px from the anchor up to the «?», clear of the house

  // Shape and text of every state. The shape is drawn; the text is said. Neither depends on a colour.
  var STATES = {
    walking: { shape: 'arrow', text: 'walking' },
    building: { shape: 'square', text: 'building' },
    'needs-you': { shape: 'question', text: 'needs you' },
    NO_DATA: { shape: 'dash', text: 'NO_DATA' }
  };
  var SHAPES = {
    arrow: [[[4, 16], [22, 16], [22, 10], [32, 20], [22, 30], [22, 24], [4, 24]], true],
    square: [[[8, 8], [32, 8], [32, 32], [8, 32]], true],
    question: [[[12, 14], [14, 8], [20, 5], [27, 8], [29, 14], [25, 20], [20, 23], [20, 28]], false],
    dash: [[[6, 18], [34, 18], [34, 22], [6, 22]], true]
  };

  function hash(text) {
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // walkerAt(nodes, seals, pending, id, seed, tick, reduced) → { id, node, to, fraction, state, path, cause }.
  // The walk starts at a delay of hash(seed:id) % FRAMES ticks. With reduced motion the walker jumps to its last stop.
  function walkerAt(nodes, seals, pending, id, seed, tick, reduced) {
    var origin = (nodes || []).some(function (n) { return n.id === 'cabin'; }) ? 'cabin' : ((nodes || [])[0] || {}).id;
    var r = W.route(nodes, seals, origin, id);
    if (!r.ok) { return { id: id, node: null, to: null, fraction: 0, state: 'NO_DATA', path: [], cause: r.cause }; }
    var steps = r.path.length - 1, e = Math.max(0, tick - hash(String(seed) + ':' + id) % FRAMES);
    var arrived = { id: id, node: id, to: null, fraction: 0, state: (pending || {})[id] ? 'needs-you' : 'building', path: r.path, cause: '' };
    if (reduced === true || e >= steps * FRAMES) { return arrived; }
    var i = Math.floor(e / FRAMES);
    return { id: id, node: r.path[i], to: r.path[i + 1], fraction: (e % FRAMES) / FRAMES, state: 'walking', path: r.path, cause: '' };
  }

  // sentence(w, reduced) → what the log says of one walker: its state in words, and its stops.
  function sentence(w, reduced) {
    var st = STATES[w.state].text;
    if (w.state === 'NO_DATA') { return 'walker of ' + w.id + ': NO_DATA · ' + w.cause; }
    var where = w.to ? ' · ' + w.node + ' → ' + w.to : ' · at ' + w.node;
    return 'walker of ' + w.id + ': ' + st + where + ' · stops ' + w.path.join(' → ') + (reduced === true ? ' (jumped, reduced motion)' : '');
  }

  // frame(id, shape, said, t) → a bubble frame (preceptoros.bubble/1) under 1,024 UTF-8 bytes that names itself.
  function frame(id, shape, said, t) {
    var s = SHAPES[shape];
    return {
      v: 'preceptoros.bubble/1', id: id, t: t, cv: [40, 40], seal: 'NO_DATA',
      atoms: [{ k: id, r: said, i: [{ o: 'ribbon', pts: s[0], closed: s[1], f: 'paper', s: 'ink', lw: 3 }] }],
      bands: ['paper', 'ink'], change: [said],
      sound: 'NO_DATA: this mark declares no waves', soundCause: 'a mark has no measured value'
    };
  }
  function walkerFrame(w, t) { return frame('walker-' + w.id, STATES[w.state].shape, sentence(w, false), t); }
  function markerFrame(id, piece, t) { return frame('hitl-' + id, 'question', 'question mark over ' + id + ' · needs you: ' + piece, t); }

  // pendingOf(colony, pending) → [{ id, piece }] in node order: the visible nodes that wait for a signature.
  function pendingOf(colony, pending) {
    return ((colony || {}).nodes || []).filter(function (n) { return typeof (pending || {})[n.id] === 'string' && pending[n.id] !== ''; })
      .map(function (n) { return { id: n.id, piece: pending[n.id] }; });
  }

  // attach(win): the browser layer. It redraws on every visitor:draw of the map, reading the page's view.
  function attach(win) {
    var doc = win.document, surface = doc.getElementById('surface');
    if (!surface) { return null; }
    var holder = surface.parentNode, say = doc.createElement('p'), buttons = {};
    if (win.getComputedStyle(holder).position === 'static') { holder.style.position = 'relative'; }
    say.id = 'walkers-state'; say.setAttribute('aria-live', 'polite'); say.className = 'state';
    surface.after(say);
    function paint(g, f, x, y) {
      g.save(); g.translate(x - 20 * S, y - 20 * S); g.scale(S, S); win.AtlasComicAtoms.paint(g, win.AtlasBubble.compile(f)); g.restore();
    }
    function button(p, view) {
      var b = buttons[p.id];
      if (!b) {
        b = buttons[p.id] = doc.createElement('button');
        b.type = 'button'; b.className = 'hitl-mark'; b.dataset.node = p.id;
        b.style.cssText = 'position:absolute;min-width:44px;min-height:44px;width:44px;height:44px;padding:0;background:transparent;border:2px dashed var(--fg);border-radius:var(--radius);cursor:pointer';
        b.addEventListener('click', function () {
          var v = win.AtlasOpenworldView();
          v.state.textContent += ' · Needs you: ' + b.dataset.piece + ' · opening ' + b.dataset.node;
          if (v.controls) { v.controls.walkTo(b.dataset.node); }
        });
        holder.appendChild(b);
      }
      b.dataset.piece = p.piece; b.setAttribute('aria-label', 'Needs you: ' + p.piece);
      return b;
    }
    surface.addEventListener('visitor:draw', function () {
      var v = win.AtlasOpenworldView ? win.AtlasOpenworldView() : null, CP = win.AtlasColoniaPagina, keep = {}, said = [];
      try {
        if (!v || !v.colony || !CP) { throw new Error('no colony'); }
        var c = v.colony, g = surface.getContext('2d'), seed = c.nodes.map(function (n) { return n.id; }).join(',');
        var at = function (id) { return CP.anchorOf(surface, c, v.t, v.looks, v.seals, id); };
        g.setTransform(1, 0, 0, 1, 0, 0);
        c.nodes.forEach(function (n) {
          var w = walkerAt(c.nodes, v.seals, v.pending, n.id, seed, v.t, v.reduced);
          said.push(sentence(w, v.reduced));
          if (!w.node) { return; }
          var a = at(w.node), b2 = w.to ? at(w.to) : a;
          paint(g, walkerFrame(w, v.t), a.x + (b2.x - a.x) * w.fraction, a.y + (b2.y - a.y) * w.fraction + 24);
        });
        var rect = surface.getBoundingClientRect(), sx = (rect.width || surface.width) / surface.width, sy = (rect.height || surface.height) / surface.height;
        pendingOf(c, v.pending).forEach(function (p) {
          var a = at(p.id);
          paint(g, markerFrame(p.id, p.piece, v.t), a.x, a.y - LIFT);
          var b = button(p, v); keep[p.id] = true;
          b.style.left = (surface.offsetLeft + a.x * sx - 22) + 'px'; b.style.top = (surface.offsetTop + (a.y - LIFT) * sy - 22) + 'px';
        });
      } catch (e) { /* no colony: no walkers and no marks */ }
      Object.keys(buttons).forEach(function (id) { if (!keep[id]) { buttons[id].remove(); delete buttons[id]; } });
      var text = said.join('; ');
      if (say.textContent !== text) { say.textContent = text; }
    });
    return { buttons: buttons };
  }

  var AtlasHitlWalkers = { STATES: STATES, SHAPES: SHAPES, LIFT: LIFT, hash: hash, walkerAt: walkerAt, sentence: sentence, walkerFrame: walkerFrame, markerFrame: markerFrame, pendingOf: pendingOf, attach: attach };
  if (common) { module.exports = AtlasHitlWalkers; }
  else { root.AtlasHitlWalkers = AtlasHitlWalkers; attach(root); }
})(typeof globalThis === 'object' ? globalThis : this);
