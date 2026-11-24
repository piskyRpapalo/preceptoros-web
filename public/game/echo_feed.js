// Echoes (Sovereign, 2026-11-23: the world's events «se llaman echoes en el lore»). Every piece of the page already tells
// what happened on one bus, 'acho:event' (combat_acho, node_beacon, online_nodes, holdings_map, building_skins, eggs,
// shared crabs, coop beacon, way by ear): each with its kind, its source (local / gateway) and its sentence. This file
// only listens. It keeps the last 20 echoes for the Echoes menu (ow_topbar.js: a role=log list, source and age written),
// and where an echo names a hex ('…/q,r' or a battle's building) a ring breathes out from that hex on the map floor for
// 2.4 s, in the map's own 'visitor:draw' pass. An event without a source is not an echo: it is dropped, never invented.
// Reduced motion: no ring, the list still says it.
(function (root) {
  'use strict';
  var doc = root.document, CAP = 20, LIFE = 2400, TAU = Math.PI * 2, list = [], rings = [], raf = 0;
  // read(detail, now) → { id, kind, source, line, hex, t } or null. Pure; tested in echo_feed_cases.
  function read(d, now) {
    if (!d || typeof d.id !== 'string') { return null; }
    var ev = d.event || {}, fr = d.frame || {}, src = ev.source || (/^presence\/|^world\/|^building\/(?!yours)/.test(d.id) ? 'gateway' : null);
    if (src !== 'local' && src !== 'gateway') { return null; }
    var line = (Array.isArray(fr.change) && fr.change[0]) || (fr.atoms && fr.atoms[0] && fr.atoms[0].r) || '';
    var m = /(-?\d+),(-?\d+)$/.exec(d.id);
    return { id: d.id, kind: ev.kind || d.id.split('/')[0], source: src, line: String(line).slice(0, 140), hex: m ? [+m[1], +m[2]] : null, t: now };
  }
  // age(ms) → '12 s ago' / '3 min ago'. Pure.
  function age(ms) { var s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? s + ' s ago' : Math.round(s / 60) + ' min ago'; }
  function still() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function view() { var v = root.AtlasOpenworldView && root.AtlasOpenworldView(); return v && v.redraw ? v : null; }
  function push(e) {
    if (!e) { return; }
    list = [e].concat(list.filter(function (x) { return x.id !== e.id; })).slice(0, CAP);
    if (e.hex && !still()) { rings.push({ hex: e.hex, src: e.source, t: e.t }); loop(); }
    if (doc) { doc.dispatchEvent(new root.CustomEvent('echo:feed', { detail: { n: list.length } })); }
  }
  function loop() { if (raf) { return; } raf = root.requestAnimationFrame(function tick() { raf = 0; var now = Date.now(); rings = rings.filter(function (r) { return now - r.t < LIFE; }); var v = view(); if (v) { v.redraw(); } if (rings.length) { raf = root.requestAnimationFrame(tick); } }); }
  function paint() {
    if (!rings.length) { return; }
    var MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(), s = doc.getElementById('surface'); if (!V || !s) { return; }
    var g = s.getContext('2d'), k = V.G.k, Hc = V.H, now = Date.now();
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.lineCap = 'round';
    rings.forEach(function (r) {
      var h = V.P(r.hex[0], r.hex[1]), p = V.turn(h.x, h.y), x = V.G.cx + p.x * k, y = V.G.cy + p.y * k, q = (now - r.t) / LIFE;
      var col = Hc.css(Hc.rgbOf(r.src === 'gateway' ? Hc.T.NEUTRAL.cyan : Hc.T.FRONT_DOOR['PROPUESTA.base']));
      for (var i = 0; i < 3; i++) { // three echoes of the same ring, each a beat behind: the hex «speaks»
        var e = Math.max(0, Math.min(1, q * 1.4 - i * 0.18)); if (!e || e >= 1) { continue; }
        var R = (14 + 46 * e) * k; g.globalAlpha = (1 - e) * 0.9; g.strokeStyle = col; g.lineWidth = Math.max(1.5, 3.2 * k * (1 - e));
        g.beginPath(); for (var j = 0; j <= 48; j++) { var th = j / 48 * TAU, m = R * (1 + 0.07 * Math.sin(3 * th + i)); g[j ? 'lineTo' : 'moveTo'](x + Math.cos(th) * m, y + Math.sin(th) * m * 0.55); } g.stroke();
      }
    });
    g.restore();
  }
  // render(box) → the Echoes list inside the menu: newest first, each with its source and age, as a polite log.
  function render(box) {
    var d = box.ownerDocument, ol = box.querySelector('.ef-log') || d.createElement('ol'), now = Date.now();
    ol.className = 'ef-log'; ol.setAttribute('role', 'log'); ol.setAttribute('aria-label', 'Recent echoes of this world'); ol.replaceChildren();
    if (!list.length) { var li0 = d.createElement('li'); li0.textContent = 'No echo yet on this page · NO_DATA'; ol.appendChild(li0); }
    list.forEach(function (e) { var li = d.createElement('li'), b = d.createElement('b'); b.textContent = e.source; li.append(b, ' ' + (e.line || e.kind) + ' · ' + age(now - e.t)); ol.appendChild(li); });
    box.appendChild(ol);
  }
  if (doc) {
    doc.addEventListener('acho:event', function (ev) { push(read(ev.detail, Date.now())); });
    doc.addEventListener('visitor:battle', function (ev) { var p = ev.detail && /:(-?\d+),(-?\d+)$/.exec(ev.detail.place || ''); if (p) { push({ id: 'battle-start/' + p[1] + ',' + p[2], kind: 'battle.start', source: 'local', line: 'A battle starts here', hex: [+p[1], +p[2]], t: Date.now() }); } }, true);
    var hook = function () { var s = doc.getElementById('surface'); if (s && !s.dataset.ef) { s.dataset.ef = '1'; s.addEventListener('visitor:draw', paint); } };
    hook(); if (root.MutationObserver && doc.body) { new root.MutationObserver(hook).observe(doc.body, { childList: true }); }
  }
  var api = { CAP: CAP, read: read, age: age, render: render, list: function () { return list.slice(); } };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasEchoFeed = api;
})(typeof window !== 'undefined' ? window : globalThis);
