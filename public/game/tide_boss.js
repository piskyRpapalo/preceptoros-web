// The Tide boss (Sovereign, 2026-11-24: «estoy deseando ver el "super jefe" que inventas como evento en echoes»).
// A DEMO event, said so on its face: there is no shared event calendar yet (NO_DATA), so nobody fights it for real.
// The boss is a troop of the real roll (gacha.js tirada) from a fixed seed, so it is the same creature for everyone,
// forever: its harmonics, eyes and colour come from that roll; its size is seven troops breathing together. Its life is
// the sum of seven rolls of the same seed (measured, not invented), shown as a number with its cause.
// Reduced motion: one still frame. Canvas with a role=img label; the words carry everything the picture says.
(function (root) {
  'use strict';
  var SEED = 'tide-boss/1:leviathan', N = 7, TAU = Math.PI * 2;
  // boss(K, G) → { troop, life, name } — pure given canon.js (sha) and gacha.js (tirada). Tested in ow_topbar_cases.
  function boss(K, G) {
    var t = G.tirada(K.sha(SEED), 'tc4'), life = 0;
    for (var i = 0; i < N; i++) { life += G.tirada(K.sha(SEED + ':' + i), 'tc4').stats.vida; }
    return { troop: t, life: life, name: 'Leviathan of the Tide' };
  }
  function show(menu) {
    var doc = menu.ownerDocument, old = menu.querySelector('.tb-boss'); if (old) { old.remove(); return; }
    var K = root.AtlasCanon, G = root.AtlasGacha, O = root.AtlasOnda, box = doc.createElement('div'); box.className = 'tb-boss';
    if (!K || !G) { box.textContent = 'Tide boss · NO_DATA · roll pieces not loaded'; menu.appendChild(box); return; }
    var b = boss(K, G), h = doc.createElement('h3'), p = doc.createElement('p'), cv = doc.createElement('canvas');
    h.textContent = b.name + ' · DEMO';
    p.textContent = 'Life ' + b.life + ' (seven tide rolls) · when it rises: NO_DATA, no shared event calendar yet · nobody can fight it for real today.';
    cv.width = 260 * 2; cv.height = 170 * 2; cv.style.width = '100%'; cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', b.name + ', a demo boss: seven waves breathing as one creature');
    box.append(h, cv, p); menu.appendChild(box);
    var still = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches, g = cv.getContext('2d'), t0 = null;
    function frame(ts) {
      if (!box.isConnected) { return; }
      if (t0 === null) { t0 = ts; } var t = still ? 0 : ts - t0, W = cv.width, H = cv.height;
      g.clearRect(0, 0, W, H);
      if (O && O.dibuja) {
        for (var i = N - 1; i >= 0; i--) { // the court: six echoes of the same wave orbit the heart, each a beat behind
          var a = i ? i / (N - 1) * TAU + t * 0.0004 : 0, rr = i ? H * 0.3 : 0, x = W / 2 + Math.cos(a) * rr * 1.4, y = H * 0.52 + Math.sin(a) * rr * 0.55;
          g.globalAlpha = i ? 0.55 : 1;
          O.dibuja(g, b.troop.armonicos, x, y, i ? H * 0.11 : H * 0.3, { t: t - i * 140, crece: 1, giro: still ? 0 : t * 0.0003, color: O.tono(b.troop), grosor: i ? 2 : 3.5,
            brillo: 0.9, estela: still ? 0 : 6, respira: !still, calidad: 2, face: !i, eye: O.eyeKind(b.troop), eyes: O.eyeCount ? O.eyeCount(b.troop) : 2, eyeSeed: O.eyeSeed ? O.eyeSeed(b.troop) : 0, desafina: 0 });
        }
        g.globalAlpha = 1;
      }
      if (!still) { root.requestAnimationFrame(frame); }
    }
    root.requestAnimationFrame(frame);
  }
  var api = { SEED: SEED, N: N, boss: boss, show: show };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasTideBoss = api;
})(typeof window !== 'undefined' ? window : globalThis);
