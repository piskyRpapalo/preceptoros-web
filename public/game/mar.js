/* preceptoros.org · theGame · el MAR multijugador: el lienzo de la Arena.

   Tu nodo en el centro, con su emblema (figura de Fourier de tu clave publica). Alrededor, por anillos de
   profundidad (tier 1 cerca, tier 4 al borde), los LUGARES NPC; y las PERSONAS cuya defensa firmada
   importaste: su angulo sale del hash de su clave y su radio de la distancia XOR a la tuya (Kademlia).
   Sin servidor y sin censo: el mar lo dibuja tu aparato con lo que tiene.

   PINTA; NO DECIDE. Los lugares, la seleccion y los textos se los da `ui-arena.js`; aqui solo el tiempo
   de pantalla (las figuras giran y el mar ondula) y el toque, que devuelve el lugar mas cercano. El
   mando de verdad es la lista de botones del DOM. Con `prefers-reduced-motion`, todo quieto. Se separo
   de `ui-arena.js` por tamano (se parte, no se recorta). */
(function () {
  'use strict';

  var E = window.AtlasEscena, K = window.AtlasCanon;
  var ANILLO = { tc1: 0.42, tc2: 0.6, tc3: 0.76, tc4: 0.9 };

  function h32(hex) { return parseInt(hex.slice(0, 8), 16) >>> 0; }
  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* `f`: { lugares(), sel(), emblema(), pub(), nombre(l), texto(k), colores(), elige(l) }. */
  function crea(c, f) {
    var dpr = window.devicePixelRatio || 1, raf = 0, col = null;

    function posicion(l, W, H) {
      var Rm = Math.min(W, H) * 0.46, ang, rad, pub = f.pub();
      if (l.npc) { ang = (l.orden * 60) * Math.PI / 180; rad = ANILLO[l.tc] * Rm; }
      else {
        ang = (h32(K.sha(l.de)) % 360) * Math.PI / 180;
        var d = pub ? ((h32(K.sha(pub)) ^ h32(K.sha(l.de))) >>> 0) / 4294967296 : 0.5;
        rad = (0.3 + 0.6 * d) * Rm;
      }
      return [W / 2 + Math.cos(ang) * rad, H / 2 + Math.sin(ang) * rad];
    }

    function pinta(ts) {
      raf = requestAnimationFrame(pinta);
      if (c.offsetParent === null || document.hidden) { return; }
      var w = Math.max(240, c.clientWidth), h = Math.round(Math.min(520, w * 0.95));
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); }
      if (c.height !== Math.round(h * dpr)) { c.height = Math.round(h * dpr); c.style.height = h + 'px'; }
      var g = c.getContext('2d'), W = c.width, H = c.height, t = quieto() ? 0 : ts, Rm = Math.min(W, H) * 0.46;
      col = col || f.colores();
      g.clearRect(0, 0, W, H);
      g.strokeStyle = col.mar; g.lineWidth = dpr;
      Object.keys(ANILLO).forEach(function (k) {
        g.setLineDash([4 * dpr, 6 * dpr]); g.beginPath(); g.arc(W / 2, H / 2, ANILLO[k] * Rm, 0, 2 * Math.PI); g.stroke();
      });
      g.setLineDash([]);
      /* El sonar: un anillo sale de tu nodo cada cuatro segundos. */
      if (!quieto()) {
        var ping = (t % 4000) / 4000;
        g.save(); g.globalAlpha = 0.5 * (1 - ping); g.strokeStyle = col.tuya; g.beginPath();
        g.arc(W / 2, H / 2, ping * Rm, 0, 2 * Math.PI); g.stroke(); g.restore();
      }
      for (var j = 1; j <= 4; j++) {
        g.beginPath();
        for (var x = 0; x <= W; x += 10 * dpr) { g[x ? 'lineTo' : 'moveTo'](x, H * j / 5 + Math.sin(x / (70 * dpr) + t * 0.0006 + j) * 6 * dpr); }
        g.stroke();
      }
      g.font = '600 ' + Math.round(11 * dpr) + 'px ui-monospace, monospace'; g.textAlign = 'center';
      var sel = f.sel();
      f.lugares().forEach(function (l) {
        var p = posicion(l, W, H), t0 = l.lider, r = (l.id === 'nucleo' ? 26 : 19) * dpr;
        if (sel === l) {
          g.strokeStyle = col.tuya; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(p[0], p[1]); g.stroke();
          g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.004); g.beginPath(); g.arc(p[0], p[1], r * 1.5, 0, 2 * Math.PI); g.stroke();
          g.globalAlpha = 1;
        }
        E.figura(g, t0.armonicos, p[0], p[1], r, { color: l.npc ? E.tono(t0) : col.suya, giro: t * 0.0004 * (l.npc ? -1 : 1),
                                                   grosor: 1.4 * dpr, brillo: (E.BRILLO[t0.rareza] + (l.npc ? 0 : 8)) * dpr });
        var nom = f.nombre(l), an = g.measureText(nom).width + 8 * dpr, lx = Math.min(W - an / 2, Math.max(an / 2, p[0]));
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(lx - an / 2, p[1] + r + 3 * dpr, an, 15 * dpr);
        g.fillStyle = col.texto; g.fillText(nom, lx, p[1] + r + 14 * dpr);
      });
      var er = 22 * dpr, em = f.emblema();
      if (em) { E.figura(g, em.armonicos, W / 2, H / 2, er, { color: col.tuya, giro: t * 0.0003, grosor: 2 * dpr, brillo: 12 * dpr }); }
      else { g.strokeStyle = col.fallo; g.beginPath(); g.arc(W / 2, H / 2, er * 0.6, 0, 2 * Math.PI); g.stroke(); }
      g.fillStyle = col.texto; g.fillText(f.texto('arena_tu'), W / 2, H / 2 + er + 14 * dpr);
    }

    c.addEventListener('click', function (ev) {
      var q = c.getBoundingClientRect(), x = (ev.clientX - q.left) * dpr, y = (ev.clientY - q.top) * dpr;
      var mejor = null, dist = 34 * dpr;
      f.lugares().forEach(function (l) {
        var p = posicion(l, c.width, c.height), d = Math.hypot(p[0] - x, p[1] - y);
        if (d < dist) { dist = d; mejor = l; }
      });
      if (mejor) { f.elige(mejor); }
    });
    raf = requestAnimationFrame(pinta);
    return { para: function () { cancelAnimationFrame(raf); } };
  }

  window.AtlasMar = { ANILLO: ANILLO, crea: crea };
})();
