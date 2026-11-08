// The duel's face (Sovereign, 2026-11-08, with photos of the Doogee): the fighters are the summon's creature waves
// (wave_render.js dibuja, no extra adornments; the triangle and star squads are retired from this face). A cinematic: the crab
// from behind in the near corner, looking at the fight; the opponent (an NPC ghost) facing us in the far corner. Each side's
// creatures come out of its own corner and form a row; the two rows push head-on into a middle line, recoil and come on
// again (no firing), so each side reads apart. The line leans toward the side losing life; the struck recoil, shake and
// detune (the canon on duels: damage detunes the figure); at the end the winner pushes the beaten waves out until its own
// reach the loser's corner. This is the game's only fight face (Sovereign, 2026-11-08). A creature is at most 80 % of the crab. Same controls as the older face →
// { velocidad, salta, otra, para }. The result and every hit come from the resolved combat; this file only paints them.
// No chance, no clock with authority, no raw colour. Sound comes later, with the whole engine.
(function (root) {
  'use strict';
  var G, O, CT, EV = 1680, BORN = 1400, CRAB = 35, CORNER = [[0.82, 0.18], [0.2, 0.7]], END = 1800; // CRAB: the back crab's width in its own units; CORNER[side]: 0 the opponent (ghost), 1 the crab // EV: one hit every 1680 ms, three times the older step: fights are lovely to watch (Sovereign, 2026-11-08); the result does not change
  // The wave renderer loads with the first hatch (hatch_reveal.js); the face asks for it too, and reads the globals per fight.
  if (root.document && !root.AtlasOnda) { var w = root.document.createElement('script'); w.src = '/game/wave_render.js'; root.document.head.appendChild(w); }
  // front(lifeOpp, lifeCrab, end, gana) → where the middle line stands on the diagonal from the crab's corner (0) to the
  // opponent's (1). It leans toward the side losing life; at the end the winner pushes it into the loser's corner. Pure.
  function front(l0, l1, end, gana) {
    if (end && gana === 'asalto') { return 0.97; }
    if (end && gana === 'defensa') { return 0.03; }
    return 0.5 + 0.3 * (l1 - l0);
  }
  // spot(lado, i, n, s, A, B, gap) → a fighter's place: its row stands on its own side of the line s, fanned across it. Pure.
  function spot(lado, i, n, s, A, B, gap) {
    var dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, at = s + (lado === 1 ? -gap : gap), sp = (i - (n - 1) / 2) * 0.16;
    return { x: A.x + dx * at - dy / L * sp * L * 0.5, y: A.y + dy * at + dx / L * sp * L * 0.5 };
  }
  // detune(u, hit) → 0..1: the wound (life lost) plus a short shiver after each hit. Pure.
  function detune(u, hit) { return Math.min(1, (1 - u.vida / u.max) * 0.85 + hit * 0.35); }
  // crabBack(g, x, y, k, H): the crab seen from behind (the cinematic puts it in the near corner, looking at the fight):
  // the scalloped shell from above and behind, six legs, both claws raised toward the fight, the backs of its eyes.
  function crabBack(g, x, y, k, H, t) {
    var F = H.T.FRONT_DOOR, ink = H.css(H.rgbOf(H.T.NEUTRAL.ink)), paper = H.rgbOf(H.T.NEUTRAL.paper);
    var sea = H.mix(H.rgbOf(F.cyan), H.rgbOf(F['FIRMADO.base']), 0.35), R = 16 * k, bob = Math.sin(t * 0.006) * 1.5 * k, i, a;
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = ink; g.lineWidth = Math.max(1.2, 2 * k);
    for (i = 0; i < 6; i++) { var sd = i < 3 ? -1 : 1, j = i % 3, bx = x + sd * (8 + j * 4) * k, by = y + bob;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + sd * 7 * k, by + (5 + j) * k); g.lineTo(bx + sd * 9 * k, by + (12 + j * 2) * k); g.stroke(); }
    [-1, 1].forEach(function (sd) { var hx = x + sd * 16 * k, hy = y - 26 * k + bob + Math.sin(t * 0.009 + sd) * 2 * k;
      g.beginPath(); g.moveTo(x + sd * 10 * k, y - 4 * k + bob); g.quadraticCurveTo(x + sd * 19 * k, y - 12 * k, hx, hy); g.stroke();
      g.fillStyle = H.css(H.shade(sea, 0.92)); g.beginPath(); g.arc(hx, hy, 6 * k, 0, 2 * Math.PI); g.fill(); g.stroke(); });
    g.fillStyle = H.css(sea); g.beginPath();
    for (i = 0; i <= 72; i++) { a = Math.PI * 2 * i / 72; var rr = R * (1 + 0.08 * Math.cos(6 * a)); g.lineTo(x + rr * Math.cos(a) * 1.1, y - 4 * k + bob + rr * Math.sin(a) * 0.72); }
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = H.css(H.shade(sea, 0.7)); g.beginPath(); g.moveTo(x, y - 14 * k + bob); g.lineTo(x, y + 6 * k + bob); g.stroke(); g.strokeStyle = ink;
    [-1, 1].forEach(function (sd) { var ex = x + sd * 6 * k, ey = y - 24 * k + bob;
      g.beginPath(); g.moveTo(x + sd * 4 * k, y - 14 * k + bob); g.lineTo(ex, ey); g.stroke();
      g.fillStyle = H.css(H.mix(sea, paper, 0.5)); g.beginPath(); g.arc(ex, ey, 4 * k, 0, 2 * Math.PI); g.fill(); g.stroke(); });
    g.restore();
  }
  // scene(cv, def, asa, combat, op): op.log() → the combat's hits, in order (the caller hands them over).
  function scene(cv, def, asa, combate, op) {
    G = root.AtlasGacha; O = root.AtlasOnda; CT = root.AtlasComicTokens;
    op = op || {};
    var log = op.log || function () { return []; };
    var g = cv.getContext('2d'), dpr = Math.min(2, root.devicePixelRatio || 1), quieto = !!op.quieto;
    var U, ev, hechos, vt, line, sparks = [], vel = 1, raf = 0, vivo = true, acabado, last = null;
    function reinicia() {
      U = [def, asa].map(function (tr, lado) {
        return tr.map(function (x, i) { var t = G.tirada(x.semilla, x.tc); return { t: t, lado: lado, i: i, vida: t.stats.vida, max: t.stats.vida, hit: 0, lunge: 0, gone: 0, x: null, col: O.tono(t) }; });
      });
      ev = log(); hechos = 0; vt = 0; acabado = false; last = null; line = null; sparks = [];
    }
    // golpe(e): the attacker surges into the line (touching the rival row); the struck recoils, shakes and detunes.
    function golpe(e) { var a = U[e[1]] && U[e[1]][e[2]], t = U[1 - e[1]] && U[1 - e[1]][e[3]]; if (a) { a.lunge = 1; }
      if (a && t && e[4] >= 0 && !quieto) { sparks.push({ a: a, t: t, age: 0, n: 9 + (hechos % 4), seed: hechos, big: Math.min(1, e[4] / Math.max(1, t.max) * 3) }); } /* sparks where the hit lands */ if (!t || e[4] < 0) { return; } t.vida = Math.max(0, t.vida - e[4]); t.hit = 1; }
    function size() {
      var w = cv.clientWidth || 360, h = cv.clientHeight || 300;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    }
    function frame(ts) {
      if (!vivo) { return; }
      var dt = last == null ? 16 : Math.min(64, ts - last); last = ts; vt += quieto ? 0 : dt * vel;
      if (quieto) { vt = ev.length * EV + BORN + END + 100; }
      ev = log();
      var k = Math.min(ev.length, Math.max(0, Math.floor((vt - BORN) / EV + 0.5))); while (hechos < k) { golpe(ev[hechos]); hechos++; }
      size(); var W = cv.width, H = cv.height, grow = Math.min(1, vt / BORN), mm = Math.min(W, H), all = U[0].concat(U[1]);
      g.clearRect(0, 0, W, H);
      var MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(), HH = V && V.H, ck = mm / 150;
      if (HH) {
        g.fillStyle = HH.css(HH.rgbOf(HH.T.NEUTRAL.ink)) + 'e0'; g.fillRect(0, 0, W, H); // a night veil over the floor: the waves' neon reads (Sovereign, 2026-11-08)
        var cx0 = W * CORNER[1][0], cy0 = H * CORNER[1][1], e = quieto ? 1 : 1 - Math.pow(1 - grow, 3);
        if (from && from.cr.width) { var fx = (from.px - from.cr.left) * W / from.cr.width, fy = (from.py - from.cr.top) * H / from.cr.height; cx0 = fx + (cx0 - fx) * e; cy0 = fy + (cy0 - fy) * e; }
        crabBack(g, cx0, cy0, ck * (0.5 + 0.5 * e), HH, vt); // the live crab, walked from the map into its corner
        if (root.AtlasMapFog && root.AtlasMapFog.npc) { root.AtlasMapFog.npc(g, W * CORNER[0][0], H * CORNER[0][1] + Math.sin(vt * 0.004) * mm * 0.01, mm / 110, HH); }
      }
      var rMax = 0.8 * CRAB * ck / 2; // a creature is at most 80 % of the crab (its width is CRAB · ck)
      var A = { x: W * CORNER[1][0], y: H * CORNER[1][1] }, B = { x: W * CORNER[0][0], y: H * CORNER[0][1] }, L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
      var life = [0, 1].map(function (l) { var v = 0, m = 0; U[l].forEach(function (u) { v += u.vida; m += u.max; }); return m ? v / m : 0; });
      var end = hechos >= ev.length && vt > ev.length * EV + BORN + 300, st = quieto ? 0 : dt * vel;
      var f = front(life[0], life[1], end, combate.gana);
      line = quieto || line == null ? f : line + (f - line) * Math.min(1, st * 0.002);
      all.forEach(function (u) {
        var n = U[u.lado].length, r = Math.min(rMax, mm * 0.075 / Math.sqrt(Math.max(1, n / 2))), lose = end && (combate.gana === 'asalto' ? 0 : combate.gana === 'defensa' ? 1 : -1) === u.lado;
        u.r = r; u.gone = quieto ? (u.vida ? (lose ? 1 : 0) : 1) : Math.min(1, u.gone + (u.vida && !lose ? 0 : st / 600)); // the beaten are pushed out and fade
        // push and recoil: each row presses into the line, backs off and comes on again; a hitter surges, the struck recoils
        var press = quieto ? 0.5 : 0.5 + 0.5 * Math.sin(vt * 0.005 + u.i * 1.3 + u.lado * Math.PI);
        var gap = r / L * 1.05 + (1 - u.lunge) * press * 0.06 + u.hit * 0.07 + u.gone * 0.12;
        var t = spot(u.lado, u.i, n, line, A, B, gap);
        if (u.x == null) { u.x = u.lado ? A.x : B.x; u.y = u.lado ? A.y : B.y; } // out of its own corner
        var k2 = quieto ? 1 : Math.min(1, st * (u.lunge > 0 ? 0.012 : 0.006));
        u.x += (t.x - u.x) * k2; u.y += (t.y - u.y) * k2;
        u.lunge = Math.max(0, u.lunge - st / 500);
      });
      all.forEach(function (u) {
        if (u.gone >= 1) { u.hit = 0; return; }
        var sx = quieto ? 0 : Math.sin(vt * 0.08) * u.hit * mm * 0.02, sc = (0.4 + 0.6 * grow) * (1 - u.gone); // the shake of a fresh hit
        g.save(); g.globalAlpha = 1 - u.gone;
        O.dibuja(g, u.t.armonicos, u.x + sx, u.y, u.r * sc, { t: vt, crece: grow, giro: quieto ? 0 : vt * 0.00035 * (u.lado ? 1 : -1), color: u.col,
          grosor: 2.2 * dpr, brillo: u.vida ? 0.65 + 0.35 * grow : 0.2, estela: quieto ? 0 : 5, respira: !quieto, calidad: 2, face: true, eye: O.eyeKind ? O.eyeKind(u.t) : null, eyes: O.eyeCount ? O.eyeCount(u.t) : 2, eyeSeed: O.eyeSeed ? O.eyeSeed(u.t) : 0, desafina: detune(u, u.hit) });
        g.restore(); u.hit *= quieto ? 0 : 0.92;
      });
      // the sparks of a hit (Sovereign, 2026-11-08: «chispas cuando comienza el choque, que se vea la acción cuando entra el daño»):
      // a burst where the two waves touch, in the hitter's gold or violet and the paper's white, glowing on the night floor
      if (HH && sparks.length) {
        var gold = HH.css(HH.rgbOf(HH.T.FRONT_DOOR['PROPUESTA.base'])), violet = HH.css(HH.rgbOf(HH.T.FRONT_DOOR['FIRMADO.base'])), white = HH.css(HH.rgbOf(HH.T.NEUTRAL.paper));
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        sparks = sparks.filter(function (sp) {
          sp.age += st; var k = sp.age / 560; if (k >= 1 || sp.a.x == null) { return k < 1; }
          var x = (sp.a.x + sp.t.x) / 2, y = (sp.a.y + sp.t.y) / 2, R = mm * (0.09 + 0.1 * sp.big), e2 = 1 - Math.pow(1 - k, 3);
          if (k < 0.22) { g.globalAlpha = 1 - k / 0.22; g.fillStyle = white; g.beginPath(); g.arc(x, y, R * (0.3 + k * 1.6), 0, 2 * Math.PI); g.fill(); }
          for (var j = 0; j < sp.n; j++) {
            var an = j * 2 * Math.PI / sp.n + sp.seed * 0.7, len = (0.6 + 0.4 * ((j * 7 + sp.seed) % 5) / 4) * R, d1 = len * e2, d0 = len * Math.max(0, e2 - 0.35);
            g.globalAlpha = 1 - k; g.strokeStyle = j % 3 ? (sp.a.lado ? gold : violet) : white; g.lineWidth = Math.max(1.5, mm * 0.011 * (1 - k));
            g.beginPath(); g.moveTo(x + Math.cos(an) * d0, y + Math.sin(an) * d0); g.lineTo(x + Math.cos(an) * d1, y + Math.sin(an) * d1); g.stroke();
          }
          return true;
        });
        g.restore();
      }
      // the end comes the moment the beaten side's last wave is gone; then the verdict: Win, Defeat or Draw (the crab's view)
      var loser = combate.gana === 'asalto' ? 0 : combate.gana === 'defensa' ? 1 : -1;
      var over = end && (!op.vivo || combate.gana != null) && (loser < 0 ? vt > ev.length * EV + BORN + END : U[loser].every(function (u) { return u.gone >= 1; }));
      if (!acabado && over) { acabado = vt; if (op.alFin) { op.alFin(combate); } }
      if (acabado && HH) { verdict(HH, W, H, mm, loser < 0 ? 'Draw' : loser === 0 ? 'Win' : 'Defeat', quieto ? 1 : Math.min(1, (vt - acabado) / 450)); }
      raf = root.requestAnimationFrame(frame);
    }
    // the live crab: the duel takes it off the map from where it stands and walks it to its corner (map_chunks skips it
    // while surface.dataset.duel is set); when the fight ends it goes back to the map.
    var surf = root.document && root.document.getElementById('surface'), from = null;
    function redraw() { var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(); if (ow && ow.redraw) { ow.redraw(); } }
    if (surf && surf.dataset.youx) {
      var sr = surf.getBoundingClientRect(), cr = cv.getBoundingClientRect(), ss = surf.width / (sr.width || 1);
      from = { px: sr.left + Number(surf.dataset.youx) / ss, py: sr.top + Number(surf.dataset.youy) / ss, cr: cr };
      surf.dataset.duel = '1'; redraw();
    }
    function release() { if (surf && surf.dataset.duel) { delete surf.dataset.duel; redraw(); } }
    // verdict(H, W, Hh, mm, word, p): a big rounded plate with the word, popping in (p 0→1); gold for a win, violet otherwise
    function verdict(Hc, W, Hh, mm, word, p) {
      var T = Hc.T, ink = Hc.css(Hc.rgbOf(T.NEUTRAL.ink)), fill = Hc.css(Hc.rgbOf(T.FRONT_DOOR[word === 'Win' ? 'PROPUESTA.base' : word === 'Defeat' ? 'FIRMADO.base' : 'LIVE.base']));
      var sc = p < 1 ? 0.6 + 0.5 * Math.sin(p * Math.PI * 0.75) / Math.sin(Math.PI * 0.75) : 1, fs = mm * 0.13 * sc, w = fs * (word.length * 0.62 + 1.2), h = fs * 1.5, x = W / 2 - w / 2, y = Hh * 0.45 - h / 2;
      g.save(); g.globalAlpha = Math.min(1, p * 2); g.lineWidth = Math.max(2, fs * 0.09); g.strokeStyle = ink; g.fillStyle = fill;
      g.beginPath(); g.moveTo(x + h / 2, y); g.arcTo(x + w, y, x + w, y + h, h / 2); g.arcTo(x + w, y + h, x, y + h, h / 2); g.arcTo(x, y + h, x, y, h / 2); g.arcTo(x, y, x + w, y, h / 2); g.closePath(); g.fill(); g.stroke();
      g.font = '900 ' + Math.round(fs) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.fillStyle = Hc.css(Hc.rgbOf(T.NEUTRAL.paper)); g.lineWidth = fs * 0.14; g.strokeText(word, W / 2, y + h / 2 + fs * 0.05); g.fillText(word, W / 2, y + h / 2 + fs * 0.05);
      g.restore();
    }
    reinicia(); raf = root.requestAnimationFrame(frame);
    return {
      velocidad: function (v) { vel = v; },
      salta: function () { ev = log(); while (hechos < ev.length) { golpe(ev[hechos]); hechos++; } vt = Math.max(vt, ev.length * EV + BORN + END + 1); },
      otra: reinicia,
      para: function () { vivo = false; root.cancelAnimationFrame(raf); release(); }
    };
  }
  var api = { CRAB: CRAB, CORNER: CORNER, scene: scene, ready: function () { return !!(root.AtlasOnda && root.AtlasOnda.dibuja); }, front: front, spot: spot, detune: detune };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasDuelFace = api;
})(typeof window !== 'undefined' ? window : globalThis);
