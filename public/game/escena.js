/* preceptoros.org · theGame · la ESCENA: las tropas de onda, vivas, y el combate que se ve.

   UN PERSONAJE ES SU ONDA. Cada tropa se dibuja con sus propios armonicos (`gacha.punto`): circulos
   que giran dentro de circulos. Respira, gira con su velocidad y brilla con su rareza; el color sale
   de su caracter, el mismo que en la incubadora. Nada de imagenes: cabe en unos cientos de bytes.

   EL COMBATE NO SE INVENTA AQUI: se REPRODUCE. `arena.combate` ya decidio cada golpe con enteros y
   una semilla; la escena solo pone el tiempo de pantalla: el que ataca se lanza, una onda cruza hasta
   su objetivo, el golpe lo sacude y su figura ENCOGE con la vida que le queda; al caer, la onda se
   deshace en particulas. Misma semilla, misma pelea, en cualquier pantalla.

   `prefers-reduced-motion`: sin saltos, sin temblores, sin particulas: el final se pinta quieto y el
   registro queda en el DOM. El sonido lo pone quien llama (`op.sonido`), y solo si la persona lo
   encendio. Sin red, sin reloj con autoridad: el tiempo de `requestAnimationFrame` es de pantalla. */
(function (raiz) {
  'use strict';

  var G = raiz.AtlasGacha;
  var TONOS = ['hsl(35 75% 58%)', 'hsl(140 45% 55%)', 'hsl(275 55% 68%)', 'hsl(210 12% 68%)'];
  var BRILLO = { normal: 0, magico: 5, raro: 10, unico: 16 };
  var EVENTO_MS = 560;

  function limite(arm) {
    var l = 0;
    arm.forEach(function (h) { l += Math.max(Math.abs(h[1]), Math.abs(h[2])); });
    return Math.max(1, l);
  }
  /* Una figura de Fourier: centro, radio, giro, escala, color, alfa, brillo y grosor. */
  function figura(g, arm, x, y, r, o) {
    var k = r / limite(arm) * (o.escala == null ? 1 : o.escala), c = Math.cos(o.giro || 0), s = Math.sin(o.giro || 0);
    var n = o.puntos || 120;
    g.save();
    g.globalAlpha = o.alfa == null ? 1 : o.alfa;
    g.strokeStyle = o.color; g.lineWidth = o.grosor || 2; g.lineJoin = 'round';
    if (o.brillo) { g.shadowColor = o.color; g.shadowBlur = o.brillo; }
    g.beginPath();
    for (var i = 0; i <= n; i++) {
      var p = G.punto(arm, i / n * 2 * Math.PI), px = p[0] * k, py = p[1] * k;
      g[i ? 'lineTo' : 'moveTo'](x + px * c - py * s, y - (px * s + py * c));
    }
    g.stroke();
    g.restore();
  }
  function tono(t) { return TONOS[G.caracter(t).color]; }
  /* Una figura quieta en un lienzo pequeno (fichas de escuadra, tarjetas de lugar). */
  function mini(lienzo, t, color) {
    var g = lienzo.getContext('2d'), w = lienzo.width;
    g.clearRect(0, 0, w, lienzo.height);
    figura(g, t.armonicos, w / 2, lienzo.height / 2, w * 0.42, { color: color || tono(t), grosor: Math.max(1.2, w / 60),
                                                               brillo: BRILLO[t.rareza] * w / 120 });
  }
  function unidades(tropas, lado) {
    return tropas.map(function (x, i) {
      var t = G.tirada(x.semilla, x.tc);
      return { t: t, lado: lado, i: i, vida: t.stats.vida, max: t.stats.vida, vel: t.stats.velocidad,
               color: tono(t), brillo: BRILLO[t.rareza], muere: null, flash: 0, tiembla: null, x: 0, y: 0, r: 10 };
    });
  }

  /* LA ESCENA de un combate ya resuelto. `def` (lado 0, derecha) y `asa` (lado 1, izquierda) son listas
     `{tc, semilla}`; `combate` es lo que devolvio `arena.combate`. */
  function escena(lienzo, def, asa, combate, op) {
    op = op || {};
    var g = lienzo.getContext('2d'), U = [unidades(def, 0), unidades(asa, 1)], ev = combate.registro;
    var todos = U[0].concat(U[1]), vt = 0, ultimo = null, vel = 1, hechos = 0, raf = 0, acabado = false, vivo = true;
    var pops = [], chispas = [], ronda = 0, dpr = raiz.devicePixelRatio || 1, finVt = 0;
    var col = op.colores || {}, quieto = !!op.quieto;

    function mide() {
      var w = Math.max(200, lienzo.clientWidth || 320), h = Math.round(Math.min(420, Math.max(260, w * 0.7)));
      if (lienzo.width !== Math.round(w * dpr)) { lienzo.width = Math.round(w * dpr); }
      if (lienzo.height !== Math.round(h * dpr)) { lienzo.height = Math.round(h * dpr); lienzo.style.height = h + 'px'; }
      var W = lienzo.width, H = lienzo.height;
      [0, 1].forEach(function (l) {
        var n = U[l].length, paso = H / (n + 1);
        U[l].forEach(function (u, i) {
          var fila = n > 3 ? (i % 2 ? 0.07 : -0.02) : 0;
          u.x = W * (l ? 0.2 + fila : 0.8 - fila); u.y = paso * (i + 1) + H * 0.03;
          u.r = Math.min(W * 0.085, paso * 0.42, 64 * dpr);
        });
      });
    }
    function impacta(e, conEfectos) {
      var a = U[e[1]][e[2]], t = U[1 - e[1]][e[3]];
      ronda = e[0];
      if (e[4] < 0) {
        if (conEfectos) { pops.push({ x: t.x, y: t.y - t.r, txt: op.fallo || 'miss', c: col.fallo || '#9aa', v: vt }); }
        return;
      }
      t.vida = Math.max(0, t.vida - e[4]);
      if (!conEfectos) { if (!t.vida) { t.muere = -1e9; } return; }
      t.flash = 1; t.tiembla = vt;
      pops.push({ x: t.x, y: t.y - t.r, txt: '-' + e[4], c: col.dano || a.color, v: vt });
      if (op.sonido) { op.sonido(t.vida ? 'golpe' : 'cae', a.t); }
      if (!t.vida) {
        t.muere = vt;
        for (var i = 0; i < 26; i++) {
          var p = G.punto(t.t.armonicos, i / 26 * 2 * Math.PI), k = t.r / limite(t.t.armonicos);
          chispas.push({ x: t.x + p[0] * k, y: t.y - p[1] * k, vx: p[0] * k * 0.004, vy: -p[1] * k * 0.004, c: t.color, v: vt });
        }
      }
    }
    function avanza() {
      var k = Math.min(ev.length, Math.floor(vt / EVENTO_MS + 0.5));
      while (hechos < k) { impacta(ev[hechos], !quieto); hechos++; }
      if (!acabado && hechos >= ev.length && vt > ev.length * EVENTO_MS + 800) {
        acabado = true; finVt = vt;
        if (op.sonido) { op.sonido(combate.gana === 'asalto' ? 'gana' : 'pierde'); }
        if (op.alFin) { op.alFin(combate); }
      }
    }
    function mar(W, H, t) {
      g.save(); g.strokeStyle = col.mar || 'rgba(120,160,200,.08)'; g.lineWidth = dpr;
      for (var j = 1; j <= 5; j++) {
        g.beginPath();
        for (var x = 0; x <= W; x += 8 * dpr) {
          var y = H * j / 6 + Math.sin(x / (60 * dpr) + t * 0.0007 + j) * 5 * dpr;
          g[x ? 'lineTo' : 'moveTo'](x, y);
        }
        g.stroke();
      }
      g.restore();
    }
    function barra(u) {
      var w = u.r * 1.6, x = u.x - w / 2, y = u.y + u.r + 8 * dpr, h = 4 * dpr;
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, y, w, h);
      g.fillStyle = u.lado === (op.yo == null ? 1 : op.yo) ? (col.tuya || u.color) : (col.suya || u.color);
      g.fillRect(x, y, w * u.vida / u.max, h);
    }
    function pinta(ts) {
      var W = lienzo.width, H = lienzo.height, t = quieto ? 0 : ts;
      g.clearRect(0, 0, W, H);
      mar(W, H, t);
      /* El evento de ESTE tramo de tiempo: el golpe cae a mitad de tramo (`avanza`), el salto dura el tramo. */
      var cur = Math.floor(vt / EVENTO_MS), e = cur < ev.length ? ev[cur] : null, fase = (vt % EVENTO_MS) / EVENTO_MS;
      todos.forEach(function (u, idx) {
        var m = u.muere === null ? 1 : Math.max(0, 1 - (vt - u.muere) / 600);
        if (m <= 0) { return; }
        var dx = 0, dy = 0;
        if (!quieto && e && e[1] === u.lado && e[2] === u.i) {
          var obj = U[1 - e[1]][e[3]], f = Math.sin(Math.PI * fase) * 0.28;
          dx = (obj.x - u.x) * f; dy = (obj.y - u.y) * f;
        }
        if (!quieto && u.tiembla !== null && vt - u.tiembla < 260) { dx += Math.sin(vt * 0.12) * 5 * dpr * (1 - (vt - u.tiembla) / 260); }
        var gira = quieto ? 0 : t * 0.00045 * (1 + u.vel / 12) * (u.lado ? 1 : -1) * (acabado && u.vida ? 3 : 1);
        var respira = quieto ? 1 : 1 + 0.035 * Math.sin(t * 0.002 + idx);
        figura(g, u.t.armonicos, u.x + dx, u.y + dy, u.r, {
          color: u.color, giro: gira, alfa: m, grosor: 1.6 * dpr, brillo: (u.brillo + u.flash * 18) * dpr,
          escala: (0.45 + 0.55 * u.vida / u.max) * respira * (0.4 + 0.6 * m)
        });
        u.flash = Math.max(0, u.flash - 0.06);
        if (m === 1) { barra(u); }
      });
      if (!quieto && e && fase > 0.3 && fase < 0.75) {
        var a = U[e[1]][e[2]], b = U[1 - e[1]][e[3]], L = Math.hypot(b.x - a.x, b.y - a.y), nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
        g.save(); g.strokeStyle = a.color; g.globalAlpha = 0.8 * Math.sin(Math.PI * (fase - 0.3) / 0.45); g.lineWidth = 1.4 * dpr;
        g.beginPath();
        for (var q = 0; q <= 40; q++) {
          var s = q / 40, w = Math.sin(s * 18 - t * 0.02) * 6 * dpr * Math.sin(Math.PI * s);
          g[q ? 'lineTo' : 'moveTo'](a.x + (b.x - a.x) * s + nx * w, a.y + (b.y - a.y) * s + ny * w);
        }
        g.stroke(); g.restore();
      }
      chispas = chispas.filter(function (c) { return vt - c.v < 900; });
      chispas.forEach(function (c) {
        var d = vt - c.v; g.globalAlpha = 1 - d / 900; g.fillStyle = c.c;
        g.fillRect(c.x + c.vx * d, c.y + c.vy * d, 2 * dpr, 2 * dpr);
      });
      g.globalAlpha = 1;
      g.font = '600 ' + Math.round(13 * dpr) + 'px ui-monospace, monospace'; g.textAlign = 'center';
      pops = pops.filter(function (p) { return vt - p.v < 800; });
      pops.forEach(function (p) {
        var d = vt - p.v; g.globalAlpha = 1 - d / 800; g.fillStyle = p.c; g.fillText(p.txt, p.x, p.y - d * 0.04 * dpr);
      });
      g.globalAlpha = 1; g.fillStyle = col.texto || '#ccc';
      if (ronda && op.ronda) { g.fillText(op.ronda.replace('{r}', ronda), W / 2, 18 * dpr); }
      /* El letrero final: VICTORIA, DERROTA o EMPATE, que entra despacio sobre el mar. */
      if (acabado && op.letrero) {
        var l = op.letrero(combate), a2 = quieto ? 1 : Math.min(1, (vt - finVt) / 500);
        g.save(); g.globalAlpha = 0.9 * a2; g.fillStyle = l.color || col.texto || '#ddd';
        g.font = '700 ' + Math.round(Math.min(W / 9, 44 * dpr)) + 'px ui-monospace, monospace';
        g.shadowColor = l.color || '#000'; g.shadowBlur = quieto ? 0 : 18 * dpr;
        g.fillText(l.texto, W / 2, H / 2 + 14 * dpr); g.restore();
      }
    }
    function cuadro(ts) {
      if (!vivo) { return; }
      raf = raiz.requestAnimationFrame(cuadro);
      var visible = lienzo.offsetParent !== null && !raiz.document.hidden;
      var dt = ultimo === null ? 0 : Math.min(100, ts - ultimo);
      ultimo = ts;
      if (!visible) { return; }
      mide();
      if (!acabado || !quieto) { vt += quieto ? 1e9 : dt * vel; }
      avanza();
      pinta(ts);
    }
    function reinicia() {
      todos.forEach(function (u) { u.vida = u.max; u.muere = null; u.flash = 0; u.tiembla = null; });
      vt = 0; hechos = 0; acabado = false; pops = []; chispas = []; ronda = 0;
    }
    raf = raiz.requestAnimationFrame(cuadro);
    return {
      velocidad: function (v) { vel = v; },
      salta: function () {
        while (hechos < ev.length) { impacta(ev[hechos], false); hechos++; }
        vt = Math.max(vt, ev.length * EVENTO_MS + 801); pops = []; chispas = [];
      },
      otra: reinicia,
      para: function () { vivo = false; raiz.cancelAnimationFrame(raf); }
    };
  }

  var AtlasEscena = { TONOS: TONOS, BRILLO: BRILLO, EVENTO_MS: EVENTO_MS, figura: figura, mini: mini, tono: tono, escena: escena };
  raiz.AtlasEscena = AtlasEscena;
})(this);
