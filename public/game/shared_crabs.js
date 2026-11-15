// Shared crabs on the one map (Seam A, Mesa #34). EXPERIMENT: this piece does nothing unless the page runs on
// loopback AND names a TEST authority by its port (?presence=8812). On the public site there is no authority, so
// nothing is offered, nothing is asked of the network and nothing is drawn.
// With a test authority and a visit, one button asks for consent. After it:
//   - every hex the crab walks is signed (atlas.paso/1) and sent; the authority decides the cell;
//   - a crab that stands still signs «still here» (atlas.presente/1) so it is not forgotten;
//   - the authority's view around the crab is read while the page is visible, and the other crabs are drawn on the
//     same map with the same crab body; a silent crab is drawn pale and its label says STALE (never colour alone);
//   - each change is ONE event with four readings from crab_presence_acho.js: the live line (eye and screen reader),
//     its notes (ear: a nearer crab is a higher note) and an «acho:event» with the frame (machine).
// Parameters of the experiment, not policy: ?poll=ms (look every), ?beat=ms (still-here every), ?radius=hexes.
(function (root) {
  'use strict';
  // Pure: authority(location) → 'http://127.0.0.1:<port>' or null. Only loopback, only a port: no page can be
  // pointed at another host.
  function authority(loc) {
    var m = /[?&]presence=(\d{2,5})(?:&|$)/.exec((loc && loc.search) || '');
    return m && /^(127\.0\.0\.1|localhost)$/.test((loc && loc.hostname) || '') ? 'http://127.0.0.1:' + m[1] : null;
  }
  function param(loc, name, fallback, min) {
    var m = new RegExp('[?&]' + name + '=(\\d{1,6})(?:&|$)').exec((loc && loc.search) || ''), n = m ? Number(m[1]) : fallback;
    return n >= min ? n : fallback;
  }
  // Pure: dirOf(from, to, DIRS) → the name of the one-hex step between two cells, or null (no step, or a jump).
  function dirOf(a, b, DIRS) {
    var dq = b.q - a.q, dr = b.r - a.r, out = null;
    Object.keys(DIRS).forEach(function (k) { if (DIRS[k][0] === dq && DIRS[k][1] === dr) { out = k; } });
    return out;
  }
  // Pure: label(crab) → what is written under another crab: its short id, and STALE in words when it fell silent.
  function label(c) { return c.id.slice(5, 9) + (c.seal === 'STALE' ? ' · STALE' : ''); }
  // Pure: slot(s) → the sideways place (in crab widths) of the s-th crab drawn on one hex: 0, +1, -1, +2, -2… Crowds, not
  // piles (2026-11-15): two crabs on one cell stand side by side. s counts the visitor's own crab, which keeps the centre.
  function slot(s) { return s ? (s % 2 ? 1 : -1) * Math.ceil(s / 2) : 0; }
  function oval(g, x, y, rx, ry, a0, a1) { for (var i = 0; i <= 16; i++) { var a = a0 + (a1 - a0) * i / 16; g.lineTo(x + rx * Math.cos(a), y + ry * Math.sin(a)); } }

  function mount(doc, win) {
    var box = doc.getElementById('visitor-play'), surface = doc.getElementById('surface'), auth = authority(win.location);
    if (!box || !surface || !auth) { return null; }
    var POLL = param(win.location, 'poll', 500, 100), BEAT = param(win.location, 'beat', 2000, 500), RADIUS = param(win.location, 'radius', 12, 1);
    var account = null, me = null, pos = null, view = null, others = null, lastLine = '', sentAt = 0, soundAt = 0, timers = [], audio = null, said = [], heard = [], coop = null;
    var wrap = doc.createElement('div'); wrap.id = 'shared-crabs';
    var button = doc.createElement('button'); button.type = 'button'; button.id = 'shared-crabs-join'; button.style.minHeight = '44px'; button.style.minWidth = '44px';
    button.textContent = 'Share my crab on this map · test authority'; button.hidden = true;
    var line = doc.createElement('p'); line.id = 'shared-crabs-line'; line.setAttribute('role', 'status'); line.setAttribute('aria-live', 'polite');
    wrap.appendChild(button); wrap.appendChild(line); box.appendChild(wrap);
    function say(text) { if (text !== line.textContent) { line.textContent = text; } }
    function send(path, body) {
      return win.fetch(auth + path, { method: 'POST', body: JSON.stringify(body), cache: 'no-store', credentials: 'omit' }).then(function (r) { return r.json(); }, function () { return null; });
    }
    function load(src, name) {
      return new Promise(function (done) {
        if (root[name]) { done(root[name]); return; }
        var sc = doc.createElement('script'); sc.src = src; sc.onload = function () { done(root[name] || null); }; sc.onerror = function () { done(null); }; doc.head.appendChild(sc);
      });
    }
    function walker() { var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), C = ow && ow.controls; return C && C.walker ? C.walker() : null; }
    function redraw() { var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (ow && ow.redraw) { ow.redraw(); } }
    function stop(cause) {
      timers.forEach(function (t) { win.clearInterval(t); }); timers = []; me = null; view = null; others = null; heard = [];
      if (coop) { coop.stop(); coop = null; }
      if (cause) { say('NO_DATA · sharing stopped · ' + cause); } button.hidden = !account; redraw();
    }
    function refused(r) { stop((r && r.cause) || 'authority_unreachable'); }
    function hear(frame) {
      var S = root.AtlasSonifyAcho, now = Date.now();
      if (!S || !audio || now - soundAt < 1200) { return; }
      var r = S.sonify(frame); if (r.ok) { soundAt = now; try { if (audio.resume) { audio.resume(); } S.play(r, audio); } catch (e) { /* the words stay */ } }
    }
    async function look() {
      if (!me || doc.visibilityState === 'hidden') { return; }
      var id = me.id, v = await me.look({ q: pos.q, r: pos.r, radius: RADIUS });
      if (!me || me.id !== id) { return; }
      if (!v || !Array.isArray(v.crabs)) { say('NO_DATA · the authority does not answer'); return; }
      if (!v.crabs.some(function (c) { return c.id === id; })) { stop('this visit was forgotten by the authority'); return; }
      view = v;
      var d = root.AtlasCrabPresenceAcho.describe(v, id, root.AtlasStateFrames, others, heard);
      if (!d.ok) { say('NO_DATA · ' + d.cause); return; }
      others = d.others; heard = heard.concat(d.events || []).slice(-24);
      if (coop) { coop.see(v, d.others, pos); }
      if (d.line !== lastLine) {
        lastLine = d.line; say(d.line); said.push(d.line); if (said.length > 40) { said.shift(); }
        doc.dispatchEvent(new win.CustomEvent('acho:event', { detail: { id: 'presence/' + id, frame: d.frame, view: v, news: d.news } }));
        hear(d.frame); redraw();
      }
    }
    async function join() {
      var w = walker();
      if (!account || !w) { say('NO_DATA · start a visit and stand on the map first'); return; }
      button.hidden = true; say('Asking the test authority…');
      var Ctx = win.AudioContext || win.webkitAudioContext; try { audio = audio || (Ctx ? new Ctx() : null); } catch (e) { audio = null; }
      var got = await Promise.all([load('/game/crab_presence_client.js', 'AtlasCrabPresenceClient'), load('/game/crab_presence_acho.js', 'AtlasCrabPresenceAcho'), load('/game/acho_sonify.js', 'AtlasSonifyAcho'), load('/game/acho_math.js', 'AtlasAchoMath')]);
      if (got[3]) { got.push(await load('/game/acho_score.js', 'AtlasAchoScore'), await load('/game/coop_beacon.js', 'AtlasCoopBeacon')); }
      if (!got[0] || !got[1]) { stop('piece_not_loaded'); return; }
      w = walker(); var mine = await got[0].join(account, send, true, [w.q, w.r]);
      if (!mine.ok) { stop(mine.cause); return; }
      me = mine; pos = { q: w.q, r: w.r }; sentAt = Date.now(); lastLine = ''; others = null;
      say('Shared as ' + me.id + ' · the authority holds your cell'); wrap.dataset.id = me.id;
      // The beacon, together: only when the authority names a beacon and the pieces loaded. Otherwise presence alone.
      if (root.AtlasCoopBeacon && me.beacon) { coop = root.AtlasCoopBeacon.mount({ doc: doc, win: win, client: me, beacon: me.beacon, stage: doc.getElementById('stage'), surface: surface, redraw: redraw, audio: function () { return audio; } }); }
      timers.push(win.setInterval(look, POLL));
      timers.push(win.setInterval(function () { if (me && Date.now() - sentAt >= BEAT) { sentAt = Date.now(); me.beat().then(function (r) { if (me && r && r.ok === false && r.cause !== 'beat_too_soon') { refused(r); } }); } }, Math.max(250, Math.round(BEAT / 4))));
      look();
    }
    button.addEventListener('click', join);
    box.addEventListener('visitor:render', function (e) { account = e.detail && e.detail.account ? e.detail.account : null; if (!me) { button.hidden = !account; } });
    box.addEventListener('visitor:end', function () { account = null; stop(''); button.hidden = true; say(''); });
    win.addEventListener('pagehide', function () { stop(''); });
    // Every hex the crab walks: one signed step. The authority's cell is the truth; a refusal ends the sharing aloud.
    box.addEventListener('visitor:advance', function () {
      var w = walker(), W = root.AtlasVisitorWalk;
      if (!me || !w || !W) { return; }
      var to = { q: w.q, r: w.r }, d = dirOf(pos, to, W.DIRS);
      if (!d) { if (to.q !== pos.q || to.r !== pos.r) { stop('a jump is not a step'); } return; }
      pos = to; sentAt = Date.now();
      me.step(d).then(function (r) { if (!me) { return; } if (!r || r.ok !== true) { refused(r); } else if (r.at.q !== to.q || r.at.r !== to.r) { stop('the authority and this page disagree on the cell'); } });
    });
    // The other crabs, on the same map with the same body. Projection only: nothing here decides a position.
    // This layer must be the LAST to draw (after the fog, the aura and the names of map_chunks.js), or the fog would
    // cover the very crabs it shows: it is added once the document has finished loading.
    function layer() { surface.addEventListener('visitor:draw', paint); redraw(); }
    if (doc.readyState === 'complete') { layer(); } else { win.addEventListener('load', layer); }
    function paint() {
      var MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(), B = root.AtlasCrabBody, ow = root.AtlasOpenworldView && root.AtlasOpenworldView();
      if (!me || !view || !V || !B || surface.dataset.duel) { return; }
      var g = surface.getContext('2d'), k = V.G.k, dpr = surface.width / (surface.getBoundingClientRect().width || surface.width), drawn = [];
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      var rest = B.pose(0, 1, 1); rest.sp = 1; rest.look = null; // another crab: at rest, its own eyes (not this visitor's gestures)
      var here = {}; view.crabs.slice().sort(function (a, b) { return a.id === me.id ? -1 : b.id === me.id ? 1 : a.id < b.id ? -1 : 1; })
        .forEach(function (c) { var key = c.q + ',' + c.r; here[key] = (here[key] || 0) + 1; c.slot = here[key] - 1; });
      view.crabs.forEach(function (c) {
        if (c.id === me.id) { return; }
        var cell = V.world.cells.at[c.q + ',' + c.r], h0 = V.P(c.q, c.r), p = V.turn(h0.x, h0.y);
        var x = V.G.cx + p.x * k + slot(c.slot) * 26 * k, y = V.G.cy + p.y * k - (cell ? V.height(cell) * V.HSTEP : 0) * k, stale = c.seal === 'STALE', t = label(c);
        g.globalAlpha = stale ? 0.4 : 1;
        B.draw(g, x, y, Math.max(k, 0.5) * 0.9, rest, V.H, stale ? 0.15 : 0.6, oval);
        g.globalAlpha = 1; g.font = '600 ' + Math.round(11 * dpr) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
        var tw = g.measureText(t).width + 8 * dpr;
        g.fillStyle = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.paper)); g.fillRect(x - tw / 2, y + 4 * dpr, tw, 15 * dpr);
        g.strokeStyle = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.ink)); g.lineWidth = dpr; if (stale) { g.setLineDash([3 * dpr, 3 * dpr]); } g.strokeRect(x - tw / 2, y + 4 * dpr, tw, 15 * dpr); g.setLineDash([]);
        g.fillStyle = V.H.css(V.H.rgbOf(V.H.T.NEUTRAL.ink)); g.fillText(t, x, y + 6 * dpr);
        drawn.push({ id: c.id, q: c.q, r: c.r, seal: c.seal, x: Math.round(x), y: Math.round(y), tag: [Math.round(x - tw / 2 + 3 * dpr), Math.round(y + 8 * dpr)] });
      });
      g.restore(); surface.dataset.crabs = JSON.stringify(drawn); void ow;
      if (coop) { coop.paint(g, V, dpr); }
    }
    return { auth: auth, poll: POLL, beat: BEAT, radius: RADIUS, state: function () { return { id: me ? me.id : null, pos: pos, view: view, said: said.slice(), beacon: coop ? coop.state() : null }; } };
  }

  var api = { authority: authority, dirOf: dirOf, label: label, slot: slot, mount: mount, mounted: null };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasSharedCrabs = api;
  if (root.document && root.document.getElementById && root.location) { api.mounted = mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
