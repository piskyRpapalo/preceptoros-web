// The live node on the map (Sovereign 2026-11-15: connect the Beelink as the only live node on the web; from one
// device's ephemeral account, see another's node and talk with its chatbot). The nodes come from /api/world-state (the gateway's heartbeats, read-only); each one stands
// at its own cell as a mast with a lantern: lit when its heartbeat is LIVE, dark and dated when STALE (never a fake glow).
// A tap opens that node's chatbot: the Talk-to-Hexelion door (map_chat.js → classroom_chat.js → the gateway's /api/v1/chat),
// the only call, on the visitor's own Send. Projection only: nothing about the visitor is sent by this file.
(function (root) {
  'use strict';
  var NAMES = { 'primer-ancla': 'Beelink' }, WS = '/api/world-state', nodes = [], hits = [], asked = 0; // WS: a worker route, not a file
  // Pure: label(n) → the words on the node's pill: its human name, then LIVE, or asleep since its last heartbeat day.
  function label(n) { var nm = NAMES[n.id] || n.id; return '💬 ' + nm + (n.seal === 'LIVE' ? ' · live' : ' · asleep ' + (n.since ? n.since.slice(5) : 'NO_DATA')); }
  // Pure: pick(data) → the nodes a map can show: well formed, alive, with an integer cell.
  function pick(d) {
    var list = d && d.colonia && Array.isArray(d.colonia.nodes) ? d.colonia.nodes : [];
    return list.filter(function (n) { return n && typeof n.id === 'string' && n.alive && Number.isInteger(n.q) && Number.isInteger(n.r); })
      .map(function (n) { return { id: n.id, q: n.q, r: n.r, seal: n.seal === 'LIVE' ? 'LIVE' : 'STALE', since: n.since || '' }; });
  }
  function load() {
    var now = Date.now(); if (now - asked < 60000 || !root.fetch) { return; } asked = now;
    root.fetch(WS, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      nodes = pick(d); var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (ow && ow.redraw) { ow.redraw(); }
    }).catch(function () { nodes = []; });
  }
  // draw(g, V, s): called by map_chunks.js youLayer after the fog, before the names and the crab.
  function draw(g, V, s) {
    load(); hits = []; if (!nodes.length) { return; }
    var H = V.H, k = Math.max(V.G.k, 0.5), dpr = s.width / (s.clientWidth || s.width), ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.css(H.rgbOf(H.T.NEUTRAL.paper));
    var gold = H.rgbOf(H.T.FRONT_DOOR['PROPUESTA.base'] || H.T.NEUTRAL.paper);
    nodes.forEach(function (n) {
      var c = V.world.cells.at[n.q + ',' + n.r], h0 = V.P(n.q, n.r), p = V.turn(h0.x, h0.y), live = n.seal === 'LIVE';
      var x = V.G.cx + p.x * V.G.k + 30 * k, y = V.G.cy + p.y * V.G.k - (c ? V.height(c) * V.HSTEP : 0) * V.G.k - 4 * k, top = y - 62 * k;
      if (x < -60 || x > s.width + 60 || y < -80 || y > s.height + 80) { return; }
      g.save(); g.lineCap = 'round'; g.strokeStyle = ink; g.lineWidth = Math.max(2, 3.2 * k);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, top + 12 * k); g.stroke(); // the mast
      g.beginPath(); g.moveTo(x - 9 * k, y); g.lineTo(x + 9 * k, y); g.stroke();
      if (live) { var gl = g.createRadialGradient(x, top, 2, x, top, 30 * k); gl.addColorStop(0, H.css(gold.concat(200))); gl.addColorStop(1, H.css(gold.concat(0))); g.fillStyle = gl; g.beginPath(); g.arc(x, top, 30 * k, 0, 7); g.fill(); }
      g.fillStyle = live ? H.css(gold) : H.css(H.shade(H.rgbOf(H.T.NEUTRAL.paper), 0.62)); g.lineWidth = Math.max(1.5, 2.2 * k);
      g.beginPath(); g.moveTo(x - 8 * k, top + 12 * k); g.lineTo(x - 10 * k, top - 6 * k); g.lineTo(x, top - 14 * k); g.lineTo(x + 10 * k, top - 6 * k); g.lineTo(x + 8 * k, top + 12 * k); g.closePath(); g.fill(); g.stroke(); // the lantern
      var t = label(n), fs = Math.round(13 * dpr); g.font = '800 ' + fs + 'px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var tw = g.measureText(t).width + 20 * dpr, th = fs + 14 * dpr, ly = top - 14 * k - th / 2 - 6 * dpr, lx = Math.max(tw / 2 + 4, Math.min(s.width - tw / 2 - 4, x));
      g.fillStyle = live ? H.css(gold) : paper; g.beginPath(); g.moveTo(lx - tw / 2 + th / 2, ly - th / 2); g.arc(lx + tw / 2 - th / 2, ly, th / 2, -Math.PI / 2, Math.PI / 2);
      g.arc(lx - tw / 2 + th / 2, ly, th / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = ink; g.fillText(t, lx, ly + dpr);
      g.restore();
      hits.push({ n: n, x0: Math.min(lx - tw / 2, x - 22 * dpr), x1: Math.max(lx + tw / 2, x + 22 * dpr), y0: Math.min(ly - th / 2, ly - 22 * dpr), y1: y + 4 * dpr });
    });
  }
  function hitAt(px, py) { for (var i = 0; i < hits.length; i++) { var h = hits[i]; if (px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) { return h.n; } } return null; }
  // open(n): the node's chatbot — the Talk sheet (its field #question lives in the Radio voice), «Who answers» set to
  // Hexelion (map_chat.js), the sheet titled with the node's name, the field in view and focused.
  function open(n) {
    var doc = root.document, v = doc.getElementById('voices'), talk = doc.querySelector('.cats [data-cat=Communication]'), mode = doc.getElementById('chat-destination');
    if (talk && (!v || v.hidden || v.dataset.activeCategory !== 'Communication')) { talk.click(); }
    if (mode) { mode.value = 'hexelion'; mode.dispatchEvent(new root.Event('change')); }
    var nm = NAMES[n.id] || n.id, q = doc.getElementById('question'), f = doc.getElementById('entry');
    root.setTimeout(function () { // after the sheet names itself (panel_sheet.js)
      var h = doc.getElementById('chat-h'), tt = doc.getElementById('voices-title');
      if (h) { h.textContent = nm + ' · Hexelion'; } if (tt) { tt.textContent = 'Talk to ' + nm; }
      if (q) { q.placeholder = 'Ask the ' + nm + ' node'; } if (f && f.scrollIntoView) { f.scrollIntoView({ block: 'center' }); } if (q) { q.focus({ preventScroll: true }); }
    }, 120);
    return nm;
  }
  if (root.document && root.document.addEventListener) {
    root.document.addEventListener('click', function (e) {
      var sf = root.document.getElementById('surface'); if (!sf || e.target !== sf || !hits.length) { return; }
      var r = sf.getBoundingClientRect(), n = r.width ? hitAt((e.clientX - r.left) * (sf.width / r.width), (e.clientY - r.top) * (sf.height / r.height)) : null;
      if (n) { e.stopImmediatePropagation(); e.preventDefault(); open(n); }
    }, true);
  }
  // use(data): a harness hands a world-state it measured elsewhere (the page itself reads only its own /api/world-state).
  function use(d) { nodes = pick(d); asked = Date.now(); return nodes; }
  var api = { NAMES: NAMES, label: label, pick: pick, draw: draw, hitAt: hitAt, open: open, use: use };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasNodeBeacon = api;
})(typeof window !== 'undefined' ? window : globalThis);
