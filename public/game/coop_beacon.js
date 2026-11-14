// The beacon, together (COOP-01, Mesa #34). Loaded only by shared_crabs.js, after the visitor's consent, on the
// loopback experiment. It adds nothing to the authority and decides nothing: it asks, it answers, and it shows what
// the authority said. It grants no copper, no light, no land and no permission.
//   crab A presses «Ask …»  → client.ask(id)  → the authority keeps the request, or refuses with a cause
//   crab B presses «Yes …»  → client.yes(ask) → the authority lights the beacon ONCE, or refuses with a cause
// Every outcome is ONE event (acho.event/1) turned into ONE score (acho_score.js) and read four ways:
//   eye      the lamp, the ring and the sparks on the map, and the words BEACON · LIT on the canvas itself
//   ear      the three rising notes of the lighting (played by the presence line), a falling pair for a refusal
//   reader   one sentence in the live line; the same words on the stage, over the map, never below the fold
//   machine  an «acho:event» with the envelope, the score and the frame; surface.dataset.beacon with what was drawn
// A refusal dims the place and says its cause: it never draws light. A crab that arrives after the lighting sees the
// lamp already lit and still: no replay of a celebration it did not witness. Reduced motion: the final state, at once.
(function (root) {
  'use strict';
  function short(id) { return String(id || '').slice(5, 9); }
  function mount(o) {
    var doc = o.doc, win = o.win, me = o.client, beacon = o.beacon, S = root.AtlasAchoScore, A = root.AtlasCrabPresenceAcho, F = root.AtlasStateFrames;
    if (!S || !A || !F || !me || !beacon || !o.stage) { return null; }
    var mq = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var lit = null, fx = null, req = null, seen = {}, frame = 0, busy = false, refusals = 0, target = null, toMe = null, mine = null, where = '', log = [];
    var bar = doc.createElement('section'); bar.id = 'coop-beacon'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'The beacon, together');
    bar.style.cssText = 'position:absolute;z-index:5;left:8px;right:8px;bottom:8px;box-sizing:border-box;padding:6px 8px;border:2px solid var(--fg);border-radius:12px;background:var(--bg);color:var(--fg);font-size:.84rem;line-height:1.25;display:flex;flex-wrap:wrap;gap:6px;align-items:center';
    var text = doc.createElement('p'); text.id = 'coop-result'; text.setAttribute('role', 'status'); text.setAttribute('aria-live', 'polite'); text.style.cssText = 'margin:0;flex:1 1 150px;overflow-wrap:anywhere;font-weight:700';
    function make(id) { var b = doc.createElement('button'); b.type = 'button'; b.id = id; b.hidden = true; b.style.cssText = 'min-height:44px;min-width:44px;font:inherit;font-weight:800;padding:4px 10px;border:2px solid currentColor;border-radius:999px;background:var(--fg);color:var(--bg);cursor:pointer'; bar.appendChild(b); return b; }
    bar.appendChild(text); var askB = make('coop-ask'), yesB = make('coop-yes'); o.stage.appendChild(bar);
    function now() { return win.performance && win.performance.now ? win.performance.now() : 0; }
    function sample(p) { return !p ? null : (mq && mq.matches) ? S.rest(p.score) : S.at(p.score, now() - p.t0); }
    function moving() { return [lit, fx, req].some(function (p) { var s = sample(p); return s && !s.done; }); }
    function tick() { frame = 0; if (fx && sample(fx).done) { fx = null; } o.redraw(); if (moving()) { frame = win.requestAnimationFrame(tick); } }
    function run() { if (!frame && moving()) { frame = win.requestAnimationFrame(tick); } o.redraw(); }
    // play(envelope, sound) → the score now on stage, or null. The one door every outcome walks through.
    function play(env, sound) {
      var sc = S.score(env);
      if (!sc.ok) { say('NO_DATA · ' + sc.cause); return null; }
      var fr = F.stateFrame({ id: sc.id, sentence: sc.caption, waves: sc.waves });
      log.push({ id: sc.id, kind: sc.kind, status: sc.status, shape: sc.shape, light: sc.light, caption: sc.caption }); if (log.length > 20) { log.shift(); }
      doc.dispatchEvent(new win.CustomEvent('acho:event', { detail: { id: sc.id, event: S.event(env).event, score: { shape: sc.shape, light: sc.light, dur: sc.dur, seal: sc.seal }, frame: fr, news: [] } }));
      if (sound && sc.waves.length && root.AtlasSonifyAcho) { var au = o.audio(), r = root.AtlasSonifyAcho.sonify(fr); if (au && r.ok) { try { if (au.resume) { au.resume(); } root.AtlasSonifyAcho.play(r, au); } catch (e) { /* the words stay */ } } }
      return { score: sc, t0: now() };
    }
    function say(t) { if (text.textContent !== t) { text.textContent = t; } }
    function refuse(kind, r) {
      refusals++; var cause = (r && r.cause) || 'authority_unreachable';
      fx = play(S.refused(kind, cause, 'refused/' + me.id + '/' + refusals, r && r.cause ? 'authority' : 'local', beacon), true);
      if (fx) { say(fx.score.caption); run(); }
    }
    function ignite(ev, still) {
      if (seen[ev.id]) { return; } seen[ev.id] = true; req = null; fx = null;
      var p = play(S.lit(ev), !still); if (!p) { return; }   // the lighting owns its three notes; a late arrival hears none
      if (still) { p.t0 = now() - p.score.dur; }
      lit = p; run();
    }
    function press(button, kind, call) {
      button.addEventListener('click', function () {
        if (busy) { return; } busy = true; draw();
        call().then(function (r) { busy = false; if (!r || r.ok !== true) { refuse(kind, r); } draw(); }, function () { busy = false; refuse(kind, null); draw(); });
      });
    }
    press(askB, 'coop.ask', function () { return target ? me.ask(target.id) : Promise.resolve({ ok: false, cause: 'no_other_crab_in_sight' }); });
    press(yesB, 'coop.beacon_lit', function () { return toMe ? me.yes(toMe.id) : Promise.resolve({ ok: false, cause: 'no_request_to_answer' }); });
    function draw() {
      var isLit = !!lit;
      askB.hidden = isLit || !target || !!mine || !!toMe; yesB.hidden = isLit || !toMe; askB.disabled = yesB.disabled = busy;
      if (!askB.hidden) { askB.textContent = 'Ask ' + short(target.id) + ' to light the beacon together'; askB.setAttribute('aria-label', 'Ask crab ' + short(target.id) + ' to light the beacon together'); }
      if (!yesB.hidden) { yesB.textContent = 'Yes · light it with ' + short(toMe.from); yesB.setAttribute('aria-label', 'Yes, light the beacon together with crab ' + short(toMe.from)); }
      if (fx) { return; }   // a refusal stays written until the next thing happens
      if (isLit) { var w = lit.score.caption; say(lit.who && lit.who.indexOf(me.id) >= 0 ? 'The beacon is lit: you and ' + short(lit.who[0] === me.id ? lit.who[1] : lit.who[0]) + ' lit it together.' : w + '.'); }
      else if (toMe) { say('Crab ' + short(toMe.from) + ' asks you to light the beacon together.'); }
      else if (mine) { say('You asked crab ' + short(mine.to) + ' · waiting for their yes.'); }
      else { say('Beacon · ' + where + (target ? '' : ' · it takes two crabs')); }
    }
    // see(view, others, pos): the authority's view, already read by the presence line. Nothing is inferred beyond it.
    function see(view, others, pos) {
      var d = A.distance(pos, beacon); where = d ? d + (d === 1 ? ' hex ' : ' hexes ') + A.way(pos, beacon) + ' of you' : 'you stand on it';
      target = (others || []).filter(function (c) { return c.seal === 'LIVE'; })[0] || null;
      var asks = Array.isArray(view.asks) ? view.asks : [];
      mine = asks.filter(function (a) { return a.from === me.id; })[0] || null; toMe = asks.filter(function (a) { return a.to === me.id; })[0] || null;
      A.beaconEvents(view).forEach(function (e) { ignite(e, false); if (lit && lit.score.id === e.id) { lit.who = e.who; } });
      if (view.lit && !seen[view.lit]) { ignite({ id: view.lit, who: [], cell: [beacon.q, beacon.r] }, true); }
      var open = mine || toMe;
      if (!lit && open && (!req || req.score.id !== open.id)) { fx = null; req = play(S.asked(open, 'authority', beacon), false); run(); }
      if (!open && req) { req = null; o.redraw(); }
      draw();
    }
    function tag(g, t, x, y, dpr, H) {
      g.font = '700 ' + Math.round(11 * dpr) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
      var tw = g.measureText(t).width + 10 * dpr, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink));
      g.fillStyle = H.css(H.rgbOf(H.T.NEUTRAL.paper)); g.fillRect(x - tw / 2, y, tw, 16 * dpr);
      g.strokeStyle = ink; g.lineWidth = dpr; g.strokeRect(x - tw / 2, y, tw, 16 * dpr); g.fillStyle = ink; g.fillText(t, x, y + 3 * dpr);
      return [Math.round(x - tw / 2 + 3 * dpr), Math.round(y + 8 * dpr)];
    }
    // paint(g, V, dpr): projection only, called last by the shared-crabs layer so the fog never covers it.
    function paint(g, V, dpr) {
      var k = V.G.k, cell = V.world.cells.at[beacon.q + ',' + beacon.r], h0 = V.P(beacon.q, beacon.r), h1 = V.P(beacon.q + 1, beacon.r), p = V.turn(h0.x, h0.y), p1 = V.turn(h1.x, h1.y);
      var x = V.G.cx + p.x * k, y = V.G.cy + p.y * k - (cell ? V.height(cell) * V.HSTEP : 0) * k, u = Math.max(8 * dpr, Math.hypot(p1.x - p.x, p1.y - p.y) * k), ly = y - 1.1 * u;
      var L = sample(lit), X = sample(fx), R = sample(req), H = V.H, cyan = H.rgbOf(H.T.NEUTRAL.cyan), paper = H.rgbOf(H.T.NEUTRAL.paper), ink = H.css(H.rgbOf(H.T.NEUTRAL.ink));
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      if (X && X.dim > 0) { g.globalAlpha = X.dim; g.fillStyle = ink; g.beginPath(); g.ellipse(x, y, 1.5 * u, 0.85 * u, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
      if (R && R.mark > 0 && !L) { g.globalAlpha = R.mark; g.strokeStyle = ink; g.lineWidth = 2 * dpr; g.setLineDash([5 * dpr, 4 * dpr]); g.beginPath(); g.ellipse(x, y, 1.2 * u, 0.7 * u, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
      if (L && L.lamp > 0) {
        var rad = u * (0.9 + 0.7 * L.lamp), glow = g.createRadialGradient(x, ly, 0, x, ly, rad);
        glow.addColorStop(0, 'rgba(' + paper.join(',') + ',' + L.lamp + ')'); glow.addColorStop(0.35, 'rgba(' + cyan.join(',') + ',' + 0.75 * L.lamp + ')'); glow.addColorStop(1, 'rgba(' + cyan.join(',') + ',0)');
        g.fillStyle = glow; g.beginPath(); g.arc(x, ly, rad, 0, Math.PI * 2); g.fill();
        g.fillStyle = H.css(paper); g.beginPath(); g.arc(x, ly, Math.max(2 * dpr, 0.16 * u), 0, Math.PI * 2); g.fill();
        if (L.ring) { g.globalAlpha = L.ring.a; g.strokeStyle = H.css(paper); g.lineWidth = 2.5 * dpr; g.beginPath(); g.ellipse(x, y, L.ring.r * u, L.ring.r * u * 0.58, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
        L.sparks.forEach(function (s) { g.globalAlpha = s.a; g.fillStyle = H.css(paper); g.fillRect(x + s.x * u - 1.5 * dpr, ly + s.y * u - 1.5 * dpr, 3 * dpr, 3 * dpr); }); g.globalAlpha = 1;
      }
      var words = L ? 'BEACON · LIT' : X ? 'BEACON · REFUSED' : R ? 'BEACON · ASKED' : 'BEACON';
      var at = tag(g, words, x, ly - u - 18 * dpr, dpr, H);
      g.restore();
      o.surface.dataset.beacon = JSON.stringify({ id: L ? lit.score.id : null, lit: !!L, words: words, lamp: L ? L.lamp : 0, moving: !!(L && !L.done), x: Math.round(x), y: Math.round(y), light: [Math.round(x), Math.round(ly)], tag: at, cell: [beacon.q, beacon.r] });
    }
    function stop() { if (frame) { win.cancelAnimationFrame(frame); frame = 0; } lit = fx = req = null; if (bar.parentNode) { bar.parentNode.removeChild(bar); } delete o.surface.dataset.beacon; }
    return { see: see, paint: paint, stop: stop, state: function () { return { lit: lit ? lit.score.id : null, refusals: refusals, log: log.slice(), ask: !askB.hidden, yes: !yesB.hidden, text: text.textContent }; } };
  }
  var api = { mount: mount, short: short };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasCoopBeacon = api;
})(typeof window !== 'undefined' ? window : globalThis);
