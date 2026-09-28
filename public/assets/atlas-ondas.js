/* preceptoros.org · theGame · LAS ONDAS sobre tu base, y el flujo que farmea tu nodo.

   Pinta; no decide. La forma de cada voz la da `AtlasCarta.helices` desde los armonicos de tus
   tropas (semilla firmada): misma tropa, misma trenza en cualquier pantalla. Aqui solo se pone
   el tiempo de pantalla y la luz. Es la pieza que mas puede crecer (mas capas, mas voces) sin
   tocar el mapa: `atlas-mapa.js` le pasa el lienzo y una vista `V` {s, sx, nd, voces, ins, A,
   visible}, y si esta pieza falta el mapa sigue entero sin ondas. */
(function () {
  'use strict';

  var C = window.AtlasCarta;
  function frac(x) { return x - Math.floor(x); }

  /* EL FLUJO: lo que tu nodo farmea corre por el fondo hasta el Nucleo; la biomasa sube. */
  function flujo(e, t, V) {
    var nd = V.nd, s = V.s, sx = V.sx, P = V.A.P, al = V.A.alfa;
    if (!nd) { return; }
    var r = (V.ins && V.ins.recursos) || {}, arco = C.dx(nd.x, C.SECTORES.nucleo);
    var n = Math.min(28, 8 + Math.round((r.flujo || 0) / 6));
    e.setLineDash([s, s * 2]); e.strokeStyle = 'hsla(' + nd.tono + ',40%,60%,.28)'; e.lineWidth = 1;
    e.beginPath();
    for (var u = 0; u <= 1; u += 0.02) {
      var x = nd.x + arco * u; e.lineTo(sx(x), (C.suelo(x) - 1) * s);
    }
    e.stroke(); e.setLineDash([]);
    e.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var q = frac(C.h32(nd.semilla, i) + t * 0.00003 * (1 + C.h32(nd.semilla, i + 50)));
      var xx = nd.x + arco * q, yy = C.suelo(xx) - 1.2 + Math.sin(t * 0.004 + i) * 0.6;
      punto(e, sx(xx), yy * s, s * 0.9, 'hsla(' + nd.tono + ',70%,66%,' + (0.35 + 0.5 * Math.sin(q * 3.14)) + ')');
    }
    var bio = Math.min(16, 4 + Math.round((r.biomasa || 0) / 25));
    for (var j = 0; j < bio; j++) {
      var v = frac(C.h32(nd.semilla, j + 99) + t * 0.00006);
      punto(e, sx(nd.x + Math.sin(t * 0.001 + j * 2) * 3), (nd.y - 4 - v * 26) * s, s * 0.5,
            al(P.oro, 0.5 * (1 - v)));
    }
    e.globalCompositeOperation = 'source-over';
  }
  function punto(e, x, y, r, c) {
    e.fillStyle = c; e.beginPath(); e.arc(x, y, r, 0, 7); e.fill();
  }

  /* LAS RAICES: bajan por la roca con la semilla de tu nodo, y por ellas suben pulsos hacia la
     base. Mas flujo en tu partida, pulsos mas seguidos. Es el farmeo visto como algo que crece. */
  var cacheR = { id: null, r: [] };
  function raices(e, t, V) {
    var nd = V.nd, s = V.s, sx = V.sx;
    if (cacheR.id !== nd.id) { cacheR = { id: nd.id, r: C.raices(nd) }; }
    var fl = ((V.ins && V.ins.recursos) || {}).flujo || 0, vel = 0.00035 * (1 + fl / 40);
    e.lineCap = 'round';
    cacheR.r.forEach(function (g, i) {
      e.strokeStyle = 'hsla(' + (nd.tono + g[4] * 8) + ',45%,58%,' + (0.34 - g[4] * 0.05) + ')';
      e.lineWidth = Math.max(0.6, s * (0.7 - g[4] * 0.12));
      e.beginPath(); e.moveTo(sx(g[0]), g[1] * s); e.lineTo(sx(g[2]), g[3] * s); e.stroke();
      var q = frac(C.h32(nd.semilla, i + 900) + t * vel * (1 + g[4] * 0.3));
      /* El pulso va de la punta a la base: sube. */
      punto(e, sx(g[2] + (g[0] - g[2]) * q), (g[3] + (g[1] - g[3]) * q) * s, s * 0.45,
            'hsla(' + nd.tono + ',85%,75%,' + (0.9 * Math.sin(q * Math.PI)) + ')');
    });
  }

  /* LA ANTENA: una helice triple que sube del mastil a la luz. */
  function antena(e, t, V, bx, top) {
    var s = V.s, ts = t / 1000, h = top, N = 40;
    for (var k = 0; k < 3; k++) {
      e.strokeStyle = 'hsla(' + (V.nd.tono + k * 25) + ',55%,68%,' + (0.42 - k * 0.1) + ')';
      e.beginPath();
      for (var i = 0; i <= N; i++) {
        var u = i / N, w = s * (1.2 + 2.2 * u);
        e.lineTo(bx + Math.sin(u * 14 - ts * 1.6 + k * 2.0944) * w, top - (top - 2 * s) * u);
      }
      e.stroke();
    }
    var q = frac(ts * 0.35);
    punto(e, bx + Math.sin(q * 14 - ts * 1.6) * s * (1.2 + 2.2 * q), h - (h - 2 * s) * q, s * 0.8,
          'rgba(255,240,200,' + (0.8 * (1 - q)) + ')');
  }

  /* TU BASE: raices, mastil solar, antena y, a su lado, el campo de ONDAS. Cada voz trenza tres
     hebras con su eco un instante antes (la estela); donde dos hebras se cruzan salta una chispa;
     y la suma de todas las voces, el acorde, pasa por el medio en blanco tenue. */
  function base(e, t, V) {
    var nd = V.nd, s = V.s, sx = V.sx, P = V.A.P, al = V.A.alfa;
    if (!nd || !V.visible(nd.x, 60 * s)) { return; }
    var bx = sx(nd.x), by = nd.y * s, top = by - 9 * s;
    e.globalCompositeOperation = 'lighter';
    raices(e, t, V);
    e.globalCompositeOperation = 'source-over';
    e.strokeStyle = al(P.oro, 0.85); e.lineWidth = s * 0.5;
    e.beginPath(); e.moveTo(bx, by); e.lineTo(bx, top); e.stroke();
    for (var k = 0; k < 3; k++) {
      var a = -1.57 + (k - 1) * 0.7 + Math.sin(t * 0.0006) * 0.08;
      e.save(); e.translate(bx, top); e.rotate(a);
      e.fillStyle = al(k === 1 ? P.oro : P.kelpLuz, 0.75); e.fillRect(0, -s * 0.6, 5 * s, s * 1.2);
      e.restore();
    }
    var gl = e.createRadialGradient(bx, top, 0, bx, top, 9 * s);
    gl.addColorStop(0, 'hsla(' + nd.tono + ',65%,70%,.5)'); gl.addColorStop(1, 'hsla(' + nd.tono + ',65%,70%,0)');
    e.fillStyle = gl; e.fillRect(bx - 9 * s, top - 9 * s, 18 * s, 18 * s);
    e.globalCompositeOperation = 'lighter';
    e.lineWidth = Math.max(1, s * 0.3);
    antena(e, t, V, bx, top);
    var ts = t / 1000, N = 72, voces = V.voces, largo = 64 * s;
    var cy = Math.max(14, nd.y - 24) * s;
    voces.forEach(function (v, iv) {
      /* NADAR: cada voz deriva y respira a su ritmo, y su envolvente viaja; la forma no cambia. */
      var A = (9 + iv * 2.2) * s * (0.85 + 0.15 * Math.sin(ts * 0.5 + iv)), Y = [];
      var bxv = bx + Math.sin(ts * 0.21 + iv * 1.7) * 3 * s, cyv = cy + Math.sin(ts * 0.37 + iv) * 2.5 * s;
      for (var h = 0; h < 3; h++) {
        for (var eco = 1; eco >= 0; eco--) {
          var te = ts - eco * 0.22, fila = [];
          e.strokeStyle = 'hsla(' + (v.tono + h * 18) + ',50%,' + (62 + h * 6) + '%,' +
            ((h ? 0.2 : 0.46) * (eco ? 0.35 : 1)) + ')';
          e.beginPath();
          for (var i = 0; i <= N; i++) {
            var u = i / N, env = Math.pow(Math.sin(Math.PI * u), 0.7) * (0.7 + 0.3 * Math.sin(6.2832 * u - te * 0.8));
            var X = bxv + (u - 0.5) * largo, y = cyv + C.onda(v, u, te, h) * A * env + golpe(X, cyv, t, V);
            fila.push(y); e.lineTo(X, y);
          }
          e.stroke();
          if (!eco) { Y.push(fila); }
        }
      }
      for (var j = 1; j < N; j++) {
        for (var p = 0; p < 3; p++) {
          var a0 = Y[p], a1 = Y[(p + 1) % 3];
          if ((a0[j] - a1[j]) * (a0[j + 1] - a1[j + 1]) < 0) {
            punto(e, bxv + (j / N - 0.5) * largo, a0[j], s * 0.55, 'hsla(' + v.tono + ',80%,80%,.75)');
          }
        }
      }
    });
    if (voces.length > 1) {
      e.strokeStyle = 'rgba(255,250,235,.32)'; e.beginPath();
      for (var i2 = 0; i2 <= N; i2++) {
        var u2 = i2 / N, sum = 0;
        voces.forEach(function (v) { sum += C.onda(v, u2, ts, 0); });
        var X2 = bx + (u2 - 0.5) * largo;
        e.lineTo(X2, cy + sum / voces.length * 8 * s * Math.sin(Math.PI * u2) + golpe(X2, cy, t, V));
      }
      e.stroke();
    }
    e.globalCompositeOperation = 'source-over';
  }

  /* EL TOQUE: donde tocas el agua nace un frente que viaja a 22 u/s y se apaga en 2,6 s. Es
     tiempo de pantalla y nada mas: no entra en la partida ni en la grabadora. */
  var VEL = 22;
  function golpe(X, Y, t, V) {
    var d = 0;
    (V.toques || []).forEach(function (q) {
      var age = (t - q.t) / 1000, r = Math.hypot(X - V.sx(q.x), Y - q.y * V.s) / V.s - age * VEL;
      d += Math.exp(-age * 1.4) * Math.exp(-r * r / 18) * Math.sin(r * 0.9) * 5 * V.s;
    });
    return d;
  }
  function toques(e, t, V) {
    var s = V.s;
    e.globalCompositeOperation = 'lighter';
    (V.toques || []).forEach(function (q) {
      var age = (t - q.t) / 1000, x = V.sx(q.x), y = q.y * s;
      for (var k = 0; k < 3; k++) {
        var r = (age * VEL - k * 3) * s;
        if (r <= 0) { continue; }
        e.strokeStyle = 'rgba(191,247,255,' + (0.5 * Math.exp(-age * 1.4) / (k + 1)) + ')';
        e.lineWidth = 1; e.beginPath(); e.ellipse(x, y, r, r * 0.45, 0, 0, 7); e.stroke();
      }
    });
    e.globalCompositeOperation = 'source-over';
  }

  window.AtlasOndas = { base: base, flujo: flujo, toques: toques };
})();
