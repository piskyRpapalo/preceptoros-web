// The real nodes on the map (Sovereign 2026-11-15; WORLD/ACHO/LIVE NODE commission). Four separate truths, never mixed:
// admitted in World (the gateway's /api/world-state lists it, at its own cell) · heartbeat (LIVE only with one in the last
// 5 minutes, else asleep with its age and cause) · can talk (a chatbot is declared for it: today only Node 0 (the Beelink host), where
// Hexelion runs) · can run tasks (never claimed here). Each node is a mast with a lantern, lit only when LIVE. Three ways
// to perceive one truth: the eye (mast, lamp, words), the ear (its description spoken and a short motif, only when the
// visitor turned the spoken world on), the machine (an «acho:event» with status, source and age). A tap — or the node's
// keyboard door — opens «Talk to Node 0»: the Hexelion model answers (map_chat.js → classroom_chat.js → the gateway's chat).
// Projection only: this file sends nothing about the visitor; the only call is its read of /api/world-state.
(function (root) {
  'use strict';
  var NAMES = { 'primer-ancla': 'Node 0', onexstation: 'Onexstation', 'doggee-s110': 'Doogee S110' };
  var TALKS = { 'primer-ancla': 'Node 0' }; // the public name of its chatbot (the Hexelion model answers through the gateway) // the chatbot each node declares; absent = cannot talk (NO_DATA)
  var WS = '/api/world-state', nodes = [], hits = [], asked = 0, cause = '', told = {}; // WS: a worker route, not a file
  var DAY = 86400000;
  function nameOf(n) { return NAMES[n.id] || n.id; }
  // Pure: label(n) → the words on the node's pill: a speech mark when it can talk, its name, then live or asleep + day.
  function label(n) { return (TALKS[n.id] ? '💬 ' : '') + nameOf(n) + (n.seal === 'LIVE' ? ' · LIVE · measured day ' + (n.since || 'NO_DATA') : ' · asleep ' + (n.since ? n.since.slice(5) : 'NO_DATA')); }
  // Pure: age(since, today) → whole days between the last heartbeat day and today (YYYY-MM-DD), or null.
  function age(since, today) { var a = Date.parse(since + 'T00:00:00Z'), b = Date.parse(today + 'T00:00:00Z'); return isNaN(a) || isNaN(b) ? null : Math.max(0, Math.round((b - a) / DAY)); }
  // Pure: describe(n, today) → the sentence the ear hears and the screen reader reads: state, its cause and age, and talk.
  function describe(n, today) {
    var nm = /^Node\b/.test(nameOf(n)) ? nameOf(n) : nameOf(n) + ' node', t = TALKS[n.id], d = age(n.since, today), s; // «Node 0», never «Node 0 node»
    if (n.seal === 'LIVE') { s = nm + ', LIVE: its heartbeat arrived in the last 5 minutes; last reported measurement day ' + (n.since || 'NO_DATA') + '.'; }
    else { s = nm + ', asleep: no heartbeat in the last 5 minutes; the last one was ' + (n.since ? n.since + (d === null ? '' : d === 0 ? ', today' : ', ' + d + (d === 1 ? ' day' : ' days') + ' ago') : 'never measured (NO_DATA)') + '.'; }
    return s + (t ? (t === nameOf(n) ? ' It answers through the gateway (the Hexelion model): press to talk.' : ' Its chatbot, ' + t + ', answers through the gateway: press to talk.') : ' It declares no chatbot (NO_DATA).');
  }
  // Pure: only measured LIVE rows from Aduana are map doors. Pending admission and STALE stay in the publisher's
  // historical state; a missing measurement never becomes a visible node or inherited chatbot.
  function pick(d) {
    var list = d && d.colonia && Array.isArray(d.colonia.nodes) ? d.colonia.nodes : [];
    return list.filter(function (n) { return n && typeof n.id === 'string' && n.id !== '' && n.alive === true &&
      n.seal === 'LIVE' && Number.isSafeInteger(n.q) && Number.isSafeInteger(n.r) &&
      typeof n.since === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n.since); })
      .map(function (n) { return { id: n.id, q: n.q, r: n.r, seal: 'LIVE', since: n.since }; });
  }
  // Pure: frame(n, today) → the machine's view of the same truth (an Acho frame under 1,024 bytes).
  function frame(n, today) {
    var r = describe(n, today);
    return { v: 'preceptoros.acho/1', id: 'node/' + n.id, atoms: [{ k: 'node', r: r, i: [] }], change: [r], source: 'gateway:/api/world-state',
      status: n.seal, since: n.since || null, age_days: age(n.since, today), talks: TALKS[n.id] || null, sound: 'motif', motion: 'none' };
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function spoken() { try { return root.localStorage.getItem('preceptoros.audio-only') === 'on'; } catch (e) { return false; } }
  // motif(live): two rising notes for a live node, one low falling pair for a sleeping one. Only after a press, only when
  // the visitor turned the spoken world on; under 0.4 s; never on its own.
  var ctx = null;
  function motif(live) {
    var C = root.AudioContext || root.webkitAudioContext; if (!C || !spoken()) { return false; }
    try { ctx = ctx || new C(); if (ctx.resume) { ctx.resume(); } } catch (e) { return false; }
    (live ? [523.25, 783.99] : [392, 293.66]).forEach(function (f, i) {
      var o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + i * 0.16;
      o.type = 'triangle'; o.frequency.setValueAtTime(f, t0); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18); o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.2);
    });
    return true;
  }
  function tell(n) { // the machine hears a node's state once per change, never on a loop
    var doc = root.document, key = n.id + ':' + n.seal + ':' + n.since; if (told[n.id] === key || !doc) { return; } told[n.id] = key;
    if (root.CustomEvent) { doc.dispatchEvent(new root.CustomEvent('acho:event', { detail: { id: 'node/' + n.id, event: { kind: 'node.state', status: n.seal, source: 'gateway' }, frame: frame(n, today()), news: [] } })); }
  }
  // doors(): one real button per node for keyboard and screen readers; it sits off screen until it has focus.
  function doors() {
    var doc = root.document, stage = doc && doc.getElementById('stage'); if (!stage) { return; }
    var box = doc.getElementById('node-doors');
    if (!box) { box = doc.createElement('div'); box.id = 'node-doors'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Nodes on the map'); stage.appendChild(box); }
    box.replaceChildren();
    var st = doc.getElementById('state'), lv = nodes.filter(function (n) { return n.seal === 'LIVE'; }).map(function (n) { return n.id; }); // ids (no spaces); the Node sheet's «Live nodes» line (node_live.js) reads this
    if (st && !cause) { st.dataset.live = lv.length ? lv.join(' ') : '-'; }
    if (!nodes.length) { var p = doc.createElement('p'); p.className = 'node-door'; p.textContent = 'Nodes: NO_DATA · ' + (cause || 'not read yet'); box.appendChild(p); }
    nodes.forEach(function (n) {
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'node-door'; b.id = 'node-door-' + n.id; b.textContent = label(n);
      b.setAttribute('aria-label', describe(n, today())); b.addEventListener('click', function () { open(n); }); box.appendChild(b);
    });
  }
  function load() {
    var now = Date.now(); if (now - asked < 60000 || !root.fetch) { return; } asked = now;
    root.fetch(WS, { cache: 'no-store' }).then(function (r) { if (!r.ok) { cause = 'world-state answered ' + r.status; return null; } return r.json(); }).then(function (d) {
      if (d) { nodes = pick(d); cause = nodes.length ? '' : 'no node admitted in World'; nodes.forEach(tell); }
      doors(); var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (ow && ow.redraw) { ow.redraw(); }
    }).catch(function () { nodes = []; cause = 'world-state unreachable'; doors(); });
  }
  // draw(g, V, s): called by map_chunks.js youLayer after the fog, before the names and the crab.
  function draw(g, V, s) {
    load(); hits = []; if (!nodes.length) { return; } var placed = []; // label boxes so far: no pill covers another
    var H = V.H, K = Math.max(V.G.k, 0.5), dpr = s.width / (s.clientWidth || s.width), ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.css(H.rgbOf(H.T.NEUTRAL.paper));
    var gold = H.rgbOf(H.T.FRONT_DOOR['PROPUESTA.base'] || H.T.NEUTRAL.paper), dark = H.css(H.shade(H.rgbOf(H.T.NEUTRAL.paper), 0.62));
    nodes.forEach(function (n) {
      var k = K, c = V.world.cells.at[n.q + ',' + n.r], h0 = V.P(n.q, n.r), p = V.turn(h0.x, h0.y), live = n.seal === 'LIVE', talk = !!TALKS[n.id];
      var x = V.G.cx + p.x * V.G.k + 30 * k, y = V.G.cy + p.y * V.G.k - (c ? V.height(c) * V.HSTEP : 0) * V.G.k - 4 * k, top = y - (talk ? 62 : 44) * k;
      if (x < -60 || x > s.width + 60 || y < -80 || y > s.height + 80) { return; }
      var TP = root.AtlasTownPlan;
      if (talk && TP && TP.hall) { // the node that talks is the town hall on its own cell (town_plan.js), the crab at its door
        var e1 = V.P(n.q + 1, n.r), step = Math.max(8, Math.abs(e1.x - h0.x) * V.G.k), cx = x - 30 * k, cy = y - 0.5 * step * Math.min(1, 0.866 * (V.G.tilt || 1)); // stable hex pitch BEFORE orbit/tilt; only zoom changes size
        var hb = TP.hall(g, cx, cy, step, Math.min(1, 0.866 * (V.G.tilt || 1)), H, live);
        var t0 = label(n), f0 = Math.round(13 * dpr); g.save(); g.font = '800 ' + f0 + 'px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = Math.max(1.5, 2.2 * k); g.strokeStyle = ink;
        var w0 = g.measureText(t0).width + 20 * dpr, h0 = f0 + 14 * dpr, ly0 = hb.y0 - h0 / 2 - 6 * dpr, lx0 = Math.max(w0 / 2 + 4, Math.min(s.width - w0 / 2 - 4, cx));
        g.fillStyle = live ? H.css(gold) : paper; g.beginPath(); g.moveTo(lx0 - w0 / 2 + h0 / 2, ly0 - h0 / 2); g.arc(lx0 + w0 / 2 - h0 / 2, ly0, h0 / 2, -Math.PI / 2, Math.PI / 2);
        g.arc(lx0 - w0 / 2 + h0 / 2, ly0, h0 / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = ink; g.fillText(t0, lx0, ly0 + dpr); g.restore();
        placed.push({ x: lx0, y: ly0, w: w0, h: h0 });
        hits.push({ n: n, x0: Math.min(hb.x0, lx0 - w0 / 2), x1: Math.max(hb.x1, lx0 + w0 / 2), y0: ly0 - h0 / 2, y1: hb.y1 });
        return;
      }
      // A node without its own building yet is a small post with a lantern (2026-11-15: inside the town the full mast and pill
      // crowded the ring); its name shows when the crab stands on it, and the keyboard door always says it.
      var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), w = ow && ow.controls && ow.controls.walker && ow.controls.walker();
      var close = !!w && (Math.abs(w.q - n.q) + Math.abs(w.r - n.r) + Math.abs(w.q + w.r - n.q - n.r)) / 2 < 1;
      if (!talk) { k *= 0.6; top = y - 44 * k; }
      g.save(); g.lineCap = 'round'; g.strokeStyle = ink; g.lineWidth = Math.max(2, 3.2 * k);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, top + 12 * k); g.stroke(); g.beginPath(); g.moveTo(x - 9 * k, y); g.lineTo(x + 9 * k, y); g.stroke(); // the mast
      if (live) { var gl = g.createRadialGradient(x, top, 2, x, top, 30 * k); gl.addColorStop(0, H.css(gold.concat(200))); gl.addColorStop(1, H.css(gold.concat(0))); g.fillStyle = gl; g.beginPath(); g.arc(x, top, 30 * k, 0, 7); g.fill(); }
      g.fillStyle = live ? H.css(gold) : dark; g.lineWidth = Math.max(1.5, 2.2 * k);
      g.beginPath(); g.moveTo(x - 8 * k, top + 12 * k); g.lineTo(x - 10 * k, top - 6 * k); g.lineTo(x, top - 14 * k); g.lineTo(x + 10 * k, top - 6 * k); g.lineTo(x + 8 * k, top + 12 * k); g.closePath(); g.fill(); g.stroke(); // the lantern
      if (!talk && !close) { g.restore(); hits.push({ n: n, x0: x - 22 * dpr, x1: x + 22 * dpr, y0: top - 22 * dpr, y1: y + 6 * dpr }); return; }
      var t = talk ? label(n) : nameOf(n), fs = Math.round((talk ? 13 : 11) * dpr); g.font = '800 ' + fs + 'px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var tw = g.measureText(t).width + 20 * dpr, th = fs + 14 * dpr, ly = talk ? top - 14 * k - th / 2 - 6 * dpr : y + th / 2 + 6 * dpr, lx = Math.max(tw / 2 + 4, Math.min(s.width - tw / 2 - 4, x));
      for (var tries = 0; tries < 6 && placed.some(function (b) { return Math.abs(b.x - lx) < (b.w + tw) / 2 && Math.abs(b.y - ly) < (b.h + th) / 2 + 2 * dpr; }); tries++) { ly += (talk ? -1 : 1) * (th + 4 * dpr); }
      placed.push({ x: lx, y: ly, w: tw, h: th });
      g.fillStyle = live ? H.css(gold) : paper; g.beginPath(); g.moveTo(lx - tw / 2 + th / 2, ly - th / 2); g.arc(lx + tw / 2 - th / 2, ly, th / 2, -Math.PI / 2, Math.PI / 2);
      g.arc(lx - tw / 2 + th / 2, ly, th / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = ink; g.fillText(t, lx, ly + dpr);
      g.restore();
      hits.push({ n: n, x0: Math.min(lx - tw / 2, x - 22 * dpr), x1: Math.max(lx + tw / 2, x + 22 * dpr), y0: Math.min(ly - th / 2, top - 22 * dpr), y1: Math.max(y + 4 * dpr, ly + th / 2) });
    });
  }
  function hitAt(px, py) { for (var i = 0; i < hits.length; i++) { var h = hits[i]; if (px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) { return h.n; } } return null; }
  // open(n): a node that talks opens «Talk to <node>» — the Talk sheet (its field #question is in the Radio voice), «Who
  // answers» set to its chatbot (map_chat.js), a first line in the conversation that says which node answers and its
  // state, the field focused. A node that does not talk only says its description. Closing the sheet keeps the visit.
  function open(n) {
    var doc = root.document, d = describe(n, today()), SF = root.AtlasSoundFirst, nm = nameOf(n);
    motif(n.seal === 'LIVE'); if (spoken() && SF && SF.speak) { SF.speak(root, d, true); }
    if (!TALKS[n.id]) { var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (ow && ow.controls && ow.controls.say) { ow.controls.say(d); } return d; }
    var v = doc.getElementById('voices'), talk = doc.querySelector('.cats [data-cat=Communication]'), mode = doc.getElementById('chat-destination');
    if (talk && (!v || v.hidden || v.dataset.activeCategory !== 'Communication')) { talk.click(); }
    if (mode) { mode.value = 'hexelion'; mode.dispatchEvent(new root.Event('change')); }
    if (v) { v.dataset.talk = 'node'; if (!v.dataset.talkWatch) { v.dataset.talkWatch = '1'; // the sheet is a conversation while you talk to a node (building_skins.css)
      var off = function () { delete v.dataset.talk; }; if (mode) { mode.addEventListener('change', function () { if (mode.value !== 'hexelion') { off(); } }); }
      new root.MutationObserver(function () { if (v.hidden || v.dataset.activeCategory !== 'Communication') { off(); } }).observe(v, { attributes: true, attributeFilter: ['hidden', 'data-active-category'] }); } }
    var q = doc.getElementById('question'), f = doc.getElementById('entry'), log = doc.getElementById('log');
    if (log) { var li = doc.createElement('li'); li.className = 'node-intro'; li.dataset.node = n.id; li.textContent = nm + ' node · ' + (n.seal === 'LIVE' ? 'live' : 'asleep since ' + (n.since || 'NO_DATA')) + ' · ' + TALKS[n.id] + ' answers from it through the gateway.'; log.appendChild(li); }
    root.setTimeout(function () { // after the sheet names itself (panel_sheet.js)
      var h = doc.getElementById('chat-h'), tt = doc.getElementById('voices-title');
      if (h) { h.textContent = TALKS[n.id] === nm ? nm : nm + ' · ' + TALKS[n.id]; } if (tt) { tt.textContent = 'Talk to ' + nm; }
      if (q) { q.placeholder = 'Ask the ' + nm + ' node'; } if (f && f.scrollIntoView) { f.scrollIntoView({ block: 'center' }); } if (q) { q.focus({ preventScroll: true }); }
    }, 120);
    return d;
  }
  if (root.document && root.document.addEventListener) {
    root.document.addEventListener('click', function (e) {
      var sf = root.document.getElementById('surface'); if (!sf || e.target !== sf || !hits.length) { return; }
      var r = sf.getBoundingClientRect(), n = r.width ? hitAt((e.clientX - r.left) * (sf.width / r.width), (e.clientY - r.top) * (sf.height / r.height)) : null;
      if (n) { e.stopImmediatePropagation(); e.preventDefault(); open(n); }
    }, true);
  }
  // use(data): a harness hands a world-state it measured elsewhere (the page itself reads only its own /api/world-state).
  function use(d) { nodes = pick(d); asked = Date.now(); cause = nodes.length ? '' : 'no node admitted in World'; nodes.forEach(tell); doors(); return nodes; }
  var api = { nodes: function () { return nodes.slice(); }, NAMES: NAMES, TALKS: TALKS, label: label, age: age, describe: describe, pick: pick, frame: frame, draw: draw, hitAt: hitAt, open: open, use: use };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasNodeBeacon = api;
})(typeof window !== 'undefined' ? window : globalThis);
