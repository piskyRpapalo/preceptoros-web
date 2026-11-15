// The garrisons on the map (Sovereign 2026-11-15: «implement it with Acho and the new panels and effects»). The rules are
// holdings_live.js + the Rust ledger (acho_ledger.wasm), untouched: a win leaves the squad as the building's garrison at
// 95 %, each step is a tick, an NPC raid every 20 steps costs 10 points of 100 even when the garrison holds, an unguarded
// building goes back to the NPC after 60. This piece only shows them where they happen:
//   · under each conquered building's flag, its garrison's life bar (the ledger's number, in words for screen readers);
//   · a raid: a ring pulses out of each held building and the top pill says it for 4 s (still under reduced motion);
//   · a building the NPC took back returns to the fog on the map, and is told.
// Every change is an acho:event (eye, ear, machine) once. Nothing is stored or sent: the holdings live for this visit.
(function (root) {
  'use strict';
  var FULL = 1000, PULSE = 900, places = {}, lives = {}, pulse = {}, raf = 0;
  // Pure: tone(life) → the bar's colour key: LIVE.base (green) above half, PROPUESTA.base (gold) above a quarter, else FIRMADO.base.
  function tone(life) { return life > FULL / 2 ? 'LIVE.base' : life > FULL / 4 ? 'PROPUESTA.base' : 'FIRMADO.base'; }
  // Pure: pct(life) → whole percent, 0..100.
  function pct(life) { return Math.max(0, Math.min(100, Math.round(life / FULL * 100))); }
  // Pure: diff(before, after) → what changed between two ledger readings {id: life}: raided ids (lost ≥ 100), lost ids (gone).
  function diff(before, after) {
    var raided = [], lost = [];
    Object.keys(before).forEach(function (id) { if (!(id in after)) { lost.push(id); } else if (before[id] - after[id] >= 100) { raided.push(id); } });
    return { raided: raided, lost: lost };
  }
  function ledger() { var H = root.AtlasHoldings; return H && H.api ? H.api : null; }
  function reading(led) { var o = {}; ((led && led.holdings && led.holdings()) || []).forEach(function (h) { o[h.id] = h.life; }); return o; }
  function tell(kind, text) {
    var d = root.document; if (!d || !root.CustomEvent) { return; }
    d.dispatchEvent(new root.CustomEvent('acho:event', { detail: { id: 'holding/' + kind + '/' + Date.now(), event: { kind: 'holding.' + kind, source: 'local' },
      frame: { v: 'preceptoros.acho/1', id: 'holding/' + kind, change: [text], sound: kind === 'raid' ? 'low' : kind === 'won' ? 'rise' : 'fall', motion: 'pulse' }, news: [] } }));
    toast(d, text);
  }
  function toast(doc, text) {
    var stage = doc.getElementById('stage'); if (!stage) { return; }
    var t = doc.getElementById('holding-toast');
    if (!t) { t = doc.createElement('p'); t.id = 'holding-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); stage.appendChild(t); }
    t.textContent = text; t.hidden = false; root.clearTimeout(t._h); t._h = root.setTimeout(function () { t.hidden = true; }, 4000);
  }
  function redraw() { var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (ow && ow.redraw) { ow.redraw(); } }
  function animate() {
    if (raf || !root.requestAnimationFrame) { return; }
    raf = root.requestAnimationFrame(function () { raf = 0; redraw(); var now = Date.now(); if (Object.keys(pulse).some(function (id) { return now - pulse[id] < PULSE; })) { animate(); } });
  }
  function still() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  // bar(g, x, y, k, H, m): called by map_fog_layer.js beside a conquered building's flag.
  function bar(g, x, y, k, H, m) {
    var L = root.AtlasHoldingsLive, id = L && L.key('b:' + m.id + ':' + m.q + ',' + m.r), life = id in lives ? lives[id] : null;
    if (life === null) { return; }
    var w = 34 * k, h = Math.max(4, 6 * k), x0 = x - w / 2 + 6 * k, y0 = y + 6 * k, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink));
    g.save(); g.lineWidth = Math.max(1, 1.6 * k); g.strokeStyle = ink;
    g.fillStyle = H.css(H.rgbOf(H.T.NEUTRAL.paper)); g.fillRect(x0, y0, w, h);
    g.fillStyle = H.css(H.rgbOf(H.T.FRONT_DOOR[tone(life)])); g.fillRect(x0, y0, w * pct(life) / 100, h); g.strokeRect(x0, y0, w, h);
    var t0 = pulse[id], a = t0 ? (Date.now() - t0) / PULSE : 1;
    if (a < 1 || (t0 && still() && Date.now() - t0 < 4000)) {
      var r = (14 + (still() ? 12 : 30 * a)) * k; g.globalAlpha = still() ? 0.8 : 1 - a; g.lineWidth = Math.max(2, 3 * k);
      g.strokeStyle = H.css(H.rgbOf(H.T.FRONT_DOOR['FIRMADO.base'])); g.beginPath(); g.ellipse(x, y, r, r * 0.6, 0, 0, 7); g.stroke(); g.globalAlpha = 1;
    }
    g.restore();
  }
  function markOf(id) { var V = root.AtlasMapPainter && root.AtlasMapPainter.view && root.AtlasMapPainter.view(); return V && V.world && (V.world.markList || []).find(function (m) { return places[id] === 'b:' + m.id + ':' + m.q + ',' + m.r; }); }
  function sync() {
    var led = ledger(); if (!led) { return; }
    var now = reading(led), d = diff(lives, now), changed = d.raided.length || d.lost.length;
    d.raided.forEach(function (id) { pulse[id] = Date.now(); });
    if (d.raided.length) { var low = Math.min.apply(null, d.raided.map(function (id) { return now[id]; })); tell('raid', '⚔ Raid · held · garrison at ' + pct(low) + ' %'); }
    d.lost.forEach(function (id) {
      var m = markOf(id); if (m) { m.won = false; m.fog = true; var MP = root.AtlasMapPainter; if (MP && MP.resetCache) { MP.resetCache(); } }
      tell('lost', 'The NPC took back the ' + (m ? String(m.id).replace(/-/g, ' ') : 'building') + '.');
    });
    lives = now; if (changed) { animate(); } else { redraw(); }
  }
  function mount(doc) {
    var box = doc.getElementById('visitor-play'); if (!box) { return; }
    box.addEventListener('visitor:battle', function (e) {
      var p = e.detail && e.detail.place, L = root.AtlasHoldingsLive; if (!p || !L || !/^b:/.test(p)) { return; } // read now: it loads after this file
      root.setTimeout(function () { var id = L.key(p), led = ledger(); places[id] = p; var now = reading(led); if (id in now) { lives = now; tell('won', '⚑ Held · ' + pct(now[id]) + ' % garrison'); redraw(); } }, 0); // after holdings_live.js wrote the ledger
    });
    box.addEventListener('visitor:advance', function () { root.setTimeout(sync, 0); });
    box.addEventListener('visitor:end', function () { places = {}; lives = {}; pulse = {}; });
  }
  var api = { tone: tone, pct: pct, diff: diff, bar: bar };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasHoldingsMap = api;
  if (root.document && root.document.getElementById && !(typeof module === 'object' && module.exports)) { mount(root.document); }
})(typeof window !== 'undefined' ? window : globalThis);
