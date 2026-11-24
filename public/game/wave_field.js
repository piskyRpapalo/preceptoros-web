// The wave field (Sovereign, 2026-11-24: «queremos ver las Waves vivir, luchar y morir sobre nuestro propio mapa»).
// A practice battle is no longer a card over the map: its squads march out of the crab and out of the guardian, flank,
// shoot, recoil, regroup and fall ON the OpenWorld floor, painted in the map's own pass (the 'visitor:draw' event of
// #surface): one canvas, no veil. The motion is battle_choreography.js (pure: record + seed → frames, shots, moments);
// life is the record's own (frames carry each unit's life after each landed hit), so the picture never decides a winner.
// Three clocks: the record (logic), vt (presentation: ×1 ×2 ×4, pause) and the camera (crab_stage.js). Speed changes
// only vt. Reduced motion: the last frame and the verdict, still. Same contract as duel_face.scene (velocidad, salta,
// otra, para), so the replay controls and the strip (combat_acho.js) keep working unchanged.
(function (root) {
  'use strict';
  var doc = root.document, TAU = Math.PI * 2, ZOOM = 1.45;
  if (doc && !root.AtlasCoreografia) { var s = doc.createElement('script'); s.src = '/game/battle_choreography.js'; doc.head.appendChild(s); }
  // place(W, H) → how the choreography's 1000 × 600 field lies on a W × H canvas: along the long side of the screen, the
  // crab's squad from the near end (u = 0), the guardian's from the far one. Pure; tested in wave_field_cases.
  function place(W, H, cx, cy) {
    var wide = W >= H, L = (wide ? W * 0.84 : H * 0.68), k = L / 1000, sq = wide ? 0.62 : 0.9;
    var at = function (x, y) { var u = (x - 40) * k, v = (y - 300) * k * sq; return wide ? { x: cx + u, y: cy + v } : { x: cx + v, y: cy - u }; };
    return { wide: wide, k: k, at: at, crab: wide ? { x: W * 0.1, y: H * 0.5 } : { x: W * 0.5, y: H * 0.8 } };
  }
  // pose(c, j, vt) → where unit j stands at presentation time vt and its life, interpolated between the 100 ms samples.
  function pose(c, j, vt) {
    var f = c.frames, q = Math.max(0, Math.min(f.length - 1, vt / c.muestra)), a = f[Math.floor(q)], b = f[Math.min(f.length - 1, Math.floor(q) + 1)], p = q - Math.floor(q);
    return { x: a[j * 3] + (b[j * 3] - a[j * 3]) * p, y: a[j * 3 + 1] + (b[j * 3 + 1] - a[j * 3 + 1]) * p, vida: a[j * 3 + 2] };
  }
  // landed(c, vt) → how many record hits have landed by vt (the strip and the screen reader follow this count).
  function landed(c, vt) { var m = c.fin - c.hits * c.ev; return Math.max(0, Math.min(c.hits, Math.floor((vt - m - c.ev * 0.6) / c.ev) + 1)); }
  function scene(cv, def, asa, combate, op) {
    var G = root.AtlasGacha, C = root.AtlasCoreografia, surf = doc.getElementById('surface');
    if (!G || !C || !surf) { return null; }
    op = op || {};
    var stats = function (l) { return l.map(function (x) { var t = G.tirada(x.semilla, x.tc); return { t: t, max: t.stats.vida, vel: t.stats.velocidad, inercia: t.stats.inercia }; }); };
    var T = [stats(def), stats(asa)], log = (op.log ? op.log() : combate.registro) || combate.registro;
    var c = C.coreografia(log, T, op.semilla, combate.gana);
    c.hits = log.length; var all = T[0].concat(T[1]), n0 = T[0].length, dead = {}, vt = 0, vel = 1, last = null, raf = 0, vivo = true, done = false, told = -1, quieto = !!op.quieto;
    c.momentos.forEach(function (m) { if (m.tipo === 'cae') { dead[m.lado ? n0 + m.i : m.i] = m.t; } });
    var END = c.fin + 1600, shift = null, dpr = Math.min(2, root.devicePixelRatio || 1);
    cv.style.display = 'none'; surf.dataset.field = '1'; var box = cv.parentNode; if (box && box.classList) { box.classList.add('field'); } // the card shrinks to a HUD
    function view() { var v = root.AtlasOpenworldView && root.AtlasOpenworldView(); return v && v.redraw ? v : null; }
    function H() { var MP = root.AtlasMapPainter, V = MP && MP.view && MP.view(); return V && V.H; }
    function col(Hc, key) { return Hc.css(Hc.rgbOf(key)); }
    // the camera: once crab_stage has zoomed on the crab, slide the map so the crab stands at the near end of the field
    function camera(W, Hh) {
      var x = Number(surf.dataset.youx), y = Number(surf.dataset.youy); if (!surf.dataset.youx || !isFinite(x)) { return null; }
      var P = place(W, Hh, x, y);
      if (!shift && !surf.dataset.look) { shift = { x0: Number(surf.dataset.panx) || 0, y0: Number(surf.dataset.pany) || 0, dx: Math.round(P.crab.x - x), dy: Math.round(P.crab.y - y), t: vt, z0: Number(surf.dataset.zoom) || 1 }; }
      if (shift && (shift.dx || shift.dy)) {
        var p = quieto ? 1 : Math.min(1, (vt - shift.t) / 700), e = 1 - Math.pow(1 - p, 3);
        surf.dataset.panx = String(Math.round(shift.x0 + shift.dx * e)); surf.dataset.pany = String(Math.round(shift.y0 + shift.dy * e)); if (shift.z0 > ZOOM) { surf.dataset.zoom = String(shift.z0 + (ZOOM - shift.z0) * e); } // a wider look than the crab's close-up: the whole fight in frame
      }
      return P;
    }
    function paint() {
      var Hc = H(), O = root.AtlasOnda; if (!Hc || !O) { return; }
      var g = surf.getContext('2d'), W = surf.width, Hh = surf.height, P = camera(W, Hh); if (!P) { return; }
      var T0 = Hc.T, gold = col(Hc, T0.FRONT_DOOR['PROPUESTA.base']), violet = col(Hc, T0.FRONT_DOOR['FIRMADO.base']), paper = col(Hc, T0.NEUTRAL.paper), ink = col(Hc, T0.NEUTRAL.ink);
      var k = P.k, R = Math.max(14 * dpr, Math.min(46 * k, Math.min(W, Hh) * 0.075)), march = c.fin - c.hits * c.ev, born = Math.min(1, vt / march);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      // the battle stones of this fight (the choreography's obstacles): low Acho mounds on the floor
      c.mapa.rocas.forEach(function (r) { var p = P.at(r.x, r.y), a = r.r * k * 0.8, b = a * (P.wide ? 0.55 : 0.7); g.beginPath(); g.ellipse(p.x, p.y, a, b, 0, 0, TAU); g.globalAlpha = 0.16; g.fillStyle = ink; g.fill(); g.globalAlpha = 0.4; g.lineWidth = 1.5 * dpr; g.setLineDash([4 * dpr, 4 * dpr]); g.strokeStyle = ink; g.stroke(); g.setLineDash([]); });
      g.globalAlpha = 1;
      // the guardian at its base, and a breathing ring where the fight is: the contested ground
      var gb = P.at(c.mapa.bases[0].x + 40, c.mapa.bases[0].y);
      if (root.AtlasMapFog && root.AtlasMapFog.npc) { root.AtlasMapFog.npc(g, gb.x, gb.y + Math.sin(vt * 0.004) * 3 * dpr, R / 8, Hc); }
      // shots: a bolt crossing from hitter to target in the hitter's colour, a burst where it lands
      c.tiros.forEach(function (s) {
        var a = P.at(s.x0, s.y0), b = P.at(s.x1, s.y1), hue = s.lado ? gold : violet;
        if (vt >= s.t0 && vt < s.t1) {
          var q = (vt - s.t0) / (s.t1 - s.t0), x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q - Math.sin(q * Math.PI) * R * 0.8, tx = a.x + (b.x - a.x) * Math.max(0, q - 0.18), ty = a.y + (b.y - a.y) * Math.max(0, q - 0.18) - Math.sin(Math.max(0, q - 0.18) * Math.PI) * R * 0.8;
          g.strokeStyle = hue; g.lineCap = 'round'; g.lineWidth = Math.max(2, R * 0.22); g.globalAlpha = 0.85; g.beginPath(); g.moveTo(tx, ty); g.lineTo(x, y); g.stroke();
          g.fillStyle = paper; g.globalAlpha = 1; g.beginPath(); g.arc(x, y, Math.max(1.5, R * 0.14), 0, TAU); g.fill();
        } else if (s.dano >= 0 && vt >= s.t1 && vt < s.t1 + 520 && !quieto) {
          var z = (vt - s.t1) / 520, e = 1 - Math.pow(1 - z, 3), rr = R * (0.5 + 0.6 * Math.min(1, (s.dano + 1) / 6));
          g.globalAlpha = 1 - z; g.strokeStyle = hue; g.lineWidth = Math.max(1.5, R * 0.12 * (1 - z));
          for (var j = 0; j < 8; j++) { var an = j * TAU / 8 + s.de, d0 = rr * Math.max(0, e - 0.4), d1 = rr * e; g.beginPath(); g.moveTo(b.x + Math.cos(an) * d0, b.y + Math.sin(an) * d0); g.lineTo(b.x + Math.cos(an) * d1, b.y + Math.sin(an) * d1); g.stroke(); }
          if (z < 0.25) { g.fillStyle = paper; g.globalAlpha = 1 - z * 4; g.beginPath(); g.arc(b.x, b.y, rr * 0.4, 0, TAU); g.fill(); }
        }
      });
      g.globalAlpha = 1;
      // the units: the same harmonic face from hatch to fall (identity never changes, only its life and detuning)
      var order = all.map(function (u, j) { return { u: u, j: j, p: pose(c, j, vt) }; }).sort(function (a, b) { return P.at(a.p.x, a.p.y).y - P.at(b.p.x, b.p.y).y; });
      order.forEach(function (o) {
        var u = o.u, j = o.j, lado = j < n0 ? 0 : 1, gone = dead[j] != null && vt > dead[j] ? Math.min(1, (vt - dead[j]) / 650) : 0;
        if (gone >= 1) { return; }
        var p = P.at(o.p.x, o.p.y);
        if (vt < march && lado === 1) { var e = 1 - Math.pow(1 - born, 3), cr = P.at(40, 300); p = { x: cr.x + (p.x - cr.x) * e, y: cr.y + (p.y - cr.y) * e }; } // out of the crab
        if (p.x < -R * 2 || p.y < -R * 2 || p.x > W + R * 2 || p.y > Hh + R * 2) { return; } // off camera: not drawn
        var hit = 0; c.tiros.forEach(function (s) { if (s.dano >= 0 && (s.lado ? s.a : n0 + s.a) === j && vt >= s.t1 && vt < s.t1 + 380) { hit = Math.max(hit, 1 - (vt - s.t1) / 380); } });
        g.globalAlpha = 0.28 * (1 - gone); g.fillStyle = ink; g.beginPath(); g.ellipse(p.x, p.y + R * 0.85, R * 0.8, R * 0.26, 0, 0, TAU); g.fill();
        g.save(); g.globalAlpha = 1 - gone;
        var sc = (0.35 + 0.65 * (lado ? born : Math.min(1, vt / 900))) * (1 - gone * 0.4), sx = quieto ? 0 : Math.sin(vt * 0.08) * hit * R * 0.25, t = u.t;
        O.dibuja(g, t.armonicos, p.x + sx, p.y - gone * R, R * sc, { t: vt, crece: born, giro: quieto ? 0 : vt * 0.00035 * (lado ? 1 : -1), color: O.tono(t), grosor: 2 * dpr, brillo: o.p.vida ? 0.7 : 0.2,
          estela: quieto ? 0 : 4, respira: !quieto, calidad: 2, face: true, eye: O.eyeKind ? O.eyeKind(t) : null, eyes: O.eyeCount ? O.eyeCount(t) : 2, eyeSeed: O.eyeSeed ? O.eyeSeed(t) : 0,
          desafina: Math.min(1, (1 - o.p.vida / u.max) * 0.85 + hit * 0.35) });
        g.restore();
        // a thin life arc under each wave: the record's life, never the picture's
        if (o.p.vida < u.max) { g.globalAlpha = 0.9 * (1 - gone); g.lineWidth = Math.max(2, R * 0.14); g.lineCap = 'round'; g.strokeStyle = lado ? gold : violet; g.beginPath(); g.arc(p.x, p.y, R * 1.12, Math.PI * 0.62, Math.PI * (0.62 + 1.76 * o.p.vida / u.max)); g.stroke(); }
      });
      // the end: the winner's ring breathes over the contested ground and the word is written on the floor
      if (vt >= c.fin) {
        var w = combate.gana === 'asalto' ? 1 : combate.gana === 'defensa' ? 0 : -1, q2 = quieto ? 1 : Math.min(1, (vt - c.fin) / 900), mid = P.at(500, 300), rr2 = 260 * k * (0.6 + 0.4 * q2);
        g.globalAlpha = 0.85 * q2; g.strokeStyle = w === 1 ? gold : w === 0 ? violet : paper; g.lineWidth = Math.max(3, R * 0.2); g.beginPath();
        for (var i = 0; i <= 96; i++) { var th = i / 96 * TAU, m2 = rr2 * (1 + 0.06 * Math.sin(3 * th + vt * 0.002) + 0.03 * Math.sin(5 * th)); g[i ? 'lineTo' : 'moveTo'](mid.x + Math.cos(th) * m2, mid.y + Math.sin(th) * m2 * (P.wide ? 0.62 : 0.9)); }
        g.stroke();
        var word = w === 1 ? 'Win' : w === 0 ? 'Defeat' : 'Draw', fs = Math.round(Math.max(18 * dpr, R * 1.5));
        g.globalAlpha = q2; g.font = '900 ' + fs + 'px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        g.lineWidth = fs * 0.22; g.strokeStyle = ink; g.strokeText(word, mid.x, mid.y); g.fillStyle = w === 1 ? gold : w === 0 ? violet : paper; g.fillText(word, mid.x, mid.y);
      }
      g.restore();
    }
    function frame(ts) {
      if (!vivo) { return; }
      var dt = last == null ? 16 : Math.min(64, ts - last); last = ts; vt = quieto ? END : Math.min(END + 60000, vt + dt * vel);
      var h = landed(c, vt); if (h !== told) { told = h; if (op.alGolpe) { op.alGolpe(h); } }
      if (!done && vt >= END) { done = true; if (op.alFin) { op.alFin(combate); } }
      var v = view(); if (v) { v.redraw(); }
      if (!quieto || !done) { raf = root.requestAnimationFrame(frame); }
    }
    surf.addEventListener('visitor:draw', paint);
    raf = root.requestAnimationFrame(frame);
    return {
      choreography: c,
      velocidad: function (v) { vel = v; },
      salta: function () { vt = Math.max(vt, END); },
      otra: function () { vt = 0; done = false; told = -1; },
      para: function () { vivo = false; root.cancelAnimationFrame(raf); surf.removeEventListener('visitor:draw', paint); delete surf.dataset.field; var v = view(); if (v) { v.redraw(); } }
    };
  }
  var api = { place: place, pose: pose, landed: landed, scene: scene };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasWaveField = api;
})(typeof window !== 'undefined' ? window : globalThis);
