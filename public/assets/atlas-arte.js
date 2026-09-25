/* preceptoros.org · ATLAS · el arte, pintado en canvas. Sin un solo raster.

   ANIME-REALISTA SOLARPUNK, A MANO Y EN CODIGO. Firmado por el Soberano el
   2026-09-25. No hay imagenes que bajar: cada pieza es geometria, degradado
   y luz. Pesa kilobytes, escala a cualquier pantalla sin pixelarse y no pide
   nada a nadie -- la regla de §E («nada externo en runtime»), cumplida por
   construccion y no por disciplina.

   LA PALETA DEL ARTE NO ES LA DE LA INTERFAZ. La interfaz sale de
   `soberano.css`; el agua, el kelp y la piel necesitan tonos que un boton no
   usa nunca. Viven aqui, en un solo sitio (`P`), y el cobre y el violeta son
   los mismos de la capa soberana para que mapa y panel sean un solo mundo.

   LO QUICIO DEL RENDIMIENTO: el fondo estatico (degradado, ruinas, coral,
   kelp) se pinta UNA vez por tamano en un lienzo aparte; por fotograma solo
   se mueven la luz, el plancton, el vapor y los buzos. Quien mire otra cosa o
   pida quietud, no paga ni eso: lo decide atlas-piso.js. */
(function () {
  'use strict';

  var P = {
    superficie: '#8ff0e0', agua: '#1d8a9a', hondo: '#153a5c', abismo: '#1a1233',
    fondo: '#0f0c1b', kelp: '#1f7a5c', kelpLuz: '#7dffc8', coral: '#e2735a',
    coralLuz: '#ffb38a', piedra: '#2a2440', piedraLuz: '#4a3f6b',
    cobre: '#d97706', cobreLuz: '#f59e0b', oro: '#ffd27a', violeta: '#7c3aed',
    violetaLuz: '#a78bfa', vidrio: '#bff7ff', ascua: '#ff7a3d', alerta: '#ff5a4f'
  };

  /* Azar con semilla: el mismo bosque en cada carga, sin guardar nada. */
  function azar(semilla) {
    var s = semilla >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function lineal(ctx, x0, y0, x1, y1, paradas) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    paradas.forEach(function (p) { g.addColorStop(p[0], p[1]); });
    return g;
  }
  function radial(ctx, x, y, r0, r1, paradas) {
    var g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    paradas.forEach(function (p) { g.addColorStop(p[0], p[1]); });
    return g;
  }
  function alfa(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* --- EL FONDO ESTATICO ------------------------------------------------- */
  function fondoEstatico(ctx, w, h) {
    var r = azar(1987);
    ctx.fillStyle = lineal(ctx, 0, 0, 0, h, [[0, P.superficie], [0.18, P.agua],
      [0.55, P.hondo], [0.85, P.abismo], [1, P.fondo]]);
    ctx.fillRect(0, 0, w, h);

    /* Ruinas lejanas: arcos y cupulas en tres planos, cada uno mas azul. */
    [[0.52, 0.18, 0.9], [0.62, 0.28, 1.2], [0.72, 0.4, 1.6]].forEach(function (capa, i) {
      var base = h * capa[0], a = capa[1], esc = capa[2];
      ctx.fillStyle = alfa(i < 2 ? P.hondo : P.piedra, a + 0.12);
      ctx.beginPath(); ctx.moveTo(0, h);
      for (var x = 0; x <= w; x += 12) {
        ctx.lineTo(x, base + Math.sin(x / 90 + i) * 10 * esc + r() * 6);
      }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      for (var k = 0; k < 4 + i * 2; k++) {
        var cx = r() * w, cw = (22 + r() * 34) * esc, ch = (24 + r() * 52) * esc;
        ctx.fillRect(cx - cw / 2, base - ch, cw, ch);
        ctx.beginPath(); ctx.arc(cx, base - ch, cw / 2, Math.PI, 0); ctx.fill();
        /* Ventanas que aun guardan luz: la tecnologia dormida. */
        ctx.save(); ctx.fillStyle = alfa(P.kelpLuz, 0.1 + i * 0.05);
        for (var v = 0; v < 3; v++) {
          ctx.fillRect(cx - cw * 0.18, base - ch * (0.3 + v * 0.22), cw * 0.36, ch * 0.08);
        }
        ctx.restore(); ctx.fillStyle = alfa(i < 2 ? P.hondo : P.piedra, a + 0.12);
      }
    });

    /* Kelp: tallos curvos con hojas y bayas que brillan. */
    for (var k = 0; k < 14; k++) {
      var x0 = r() * w, alto = h * (0.35 + r() * 0.5), curva = (r() - 0.5) * 120;
      var grosor = 3 + r() * 5;
      ctx.strokeStyle = lineal(ctx, x0, h, x0, h - alto, [[0, alfa(P.kelp, 0.95)],
        [1, alfa(P.kelpLuz, 0.35)]]);
      ctx.lineWidth = grosor; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, h);
      ctx.bezierCurveTo(x0 + curva, h - alto * 0.33, x0 - curva, h - alto * 0.66,
                        x0 + curva * 0.5, h - alto);
      ctx.stroke();
      for (var j = 0; j < 7; j++) {
        var t = j / 7, px = x0 + curva * Math.sin(t * Math.PI) * 0.6,
            py = h - alto * t;
        ctx.fillStyle = alfa(P.kelp, 0.8);
        ctx.beginPath();
        ctx.ellipse(px + (j % 2 ? 9 : -9), py, 10 + r() * 6, 3.5, (j % 2 ? -0.5 : 0.5), 0, 7);
        ctx.fill();
        if (r() > 0.55) {
          ctx.fillStyle = radial(ctx, px, py, 0, 7, [[0, alfa(P.kelpLuz, 0.95)],
            [1, alfa(P.kelpLuz, 0)]]);
          ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.fill();
        }
      }
    }

    /* Coral en primer plano: ramas calidas contra el agua fria. */
    for (var c = 0; c < 9; c++) {
      var cx2 = r() * w, cy2 = h - r() * h * 0.06, tam = 20 + r() * 34;
      coral(ctx, cx2, cy2, tam, r);
    }
    /* Viñeta: el abismo cierra los bordes, la mirada va al centro. */
    ctx.fillStyle = radial(ctx, w / 2, h * 0.45, Math.min(w, h) * 0.3, Math.max(w, h) * 0.75,
      [[0, 'rgba(0,0,0,0)'], [1, alfa(P.fondo, 0.7)]]);
    ctx.fillRect(0, 0, w, h);
  }

  function coral(ctx, x, y, tam, r) {
    ctx.save(); ctx.lineCap = 'round';
    function rama(px, py, ang, largo, g) {
      if (g > 3 || largo < 4) { return; }
      var qx = px + Math.cos(ang) * largo, qy = py + Math.sin(ang) * largo;
      ctx.strokeStyle = g < 2 ? P.coral : P.coralLuz; ctx.lineWidth = 5 - g;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
      rama(qx, qy, ang - 0.45 - r() * 0.3, largo * 0.68, g + 1);
      rama(qx, qy, ang + 0.45 + r() * 0.3, largo * 0.68, g + 1);
    }
    rama(x, y, -Math.PI / 2, tam * 0.45, 0);
    ctx.restore();
  }

  /* --- LA LUZ QUE BAJA (por fotograma) ---------------------------------- */
  function rayos(ctx, w, h, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 6; i++) {
      var x = w * (0.08 + i * 0.17) + Math.sin(t * 0.0003 + i) * w * 0.02;
      var ancho = w * (0.05 + (i % 3) * 0.025);
      var brillo = 0.07 + 0.05 * Math.sin(t * 0.0009 + i * 1.7);
      ctx.fillStyle = lineal(ctx, 0, 0, 0, h * 0.85, [[0, alfa(P.superficie, brillo * 1.6)],
        [1, alfa(P.superficie, 0)]]);
      ctx.beginPath(); ctx.moveTo(x - ancho * 0.3, 0); ctx.lineTo(x + ancho * 0.3, 0);
      ctx.lineTo(x + ancho * 1.4, h * 0.85); ctx.lineTo(x - ancho * 0.6, h * 0.85);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function plancton(ctx, w, h, t) {
    var r = azar(77);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 70; i++) {
      var x = r() * w, v = 0.006 + r() * 0.012, tam = 0.6 + r() * 1.8;
      var y = (r() * h - t * v) % h; if (y < 0) { y += h; }
      var a = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.001 + i));
      ctx.fillStyle = alfa(i % 5 ? P.vidrio : P.kelpLuz, a);
      ctx.beginPath(); ctx.arc(x + Math.sin(t * 0.0008 + i) * 6, y, tam, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  /* --- LAS ESTRUCTURAS --------------------------------------------------- */
  function zocalo(ctx, x, y, s) {
    ctx.fillStyle = radial(ctx, x, y + s * 0.42, 0, s * 0.55, [[0, 'rgba(0,0,0,.45)'],
      [1, 'rgba(0,0,0,0)']]);
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.42, s * 0.55, s * 0.14, 0, 0, 7); ctx.fill();
    ctx.fillStyle = lineal(ctx, x, y + s * 0.25, x, y + s * 0.45, [[0, P.piedraLuz], [1, P.piedra]]);
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.33, s * 0.42, s * 0.12, 0, 0, 7); ctx.fill();
  }
  function hojaSolar(ctx, x, y, s, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = lineal(ctx, 0, -s, 0, s, [[0, P.oro], [0.5, P.cobreLuz], [1, P.cobre]]);
    ctx.beginPath(); ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.55, 0, 0, s); ctx.quadraticCurveTo(-s * 0.55, 0, 0, -s);
    ctx.fill();
    ctx.strokeStyle = alfa(P.oro, 0.8); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(0, s * 0.9); ctx.stroke();
    ctx.restore();
  }

  var ESTRUCTURA = {
    /* El Nucleo: cupula de vidrio sobre un corazon de ambar que late. */
    nucleo: function (ctx, x, y, s, t) {
      zocalo(ctx, x, y, s);
      for (var i = 0; i < 5; i++) { hojaSolar(ctx, x + (i - 2) * s * 0.2, y + s * 0.1, s * 0.16, (i - 2) * 0.5); }
      var late = 0.75 + 0.25 * Math.sin(t * 0.003);
      ctx.fillStyle = radial(ctx, x, y - s * 0.05, 0, s * 0.3, [[0, alfa(P.oro, late)],
        [0.5, alfa(P.cobre, 0.7 * late)], [1, alfa(P.cobre, 0)]]);
      ctx.beginPath(); ctx.arc(x, y - s * 0.05, s * 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = radial(ctx, x - s * 0.1, y - s * 0.2, s * 0.02, s * 0.36,
        [[0, alfa(P.vidrio, 0.75)], [0.7, alfa(P.agua, 0.4)], [1, alfa(P.vidrio, 0.65)]]);
      ctx.beginPath(); ctx.arc(x, y + s * 0.1, s * 0.36, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = P.cobreLuz; ctx.lineWidth = s * 0.025;
      for (var k = -2; k <= 2; k++) {
        ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, Math.abs(k) * s * 0.09 + 0.1, s * 0.36, 0, Math.PI, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = alfa('#ffffff', 0.7); ctx.lineWidth = s * 0.02;
      ctx.beginPath(); ctx.arc(x, y + s * 0.1, s * 0.3, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
    },
    /* La Forja: horno de coral con chimenea de cobre y vapor. */
    forja: function (ctx, x, y, s, t) {
      zocalo(ctx, x, y, s);
      ctx.fillStyle = lineal(ctx, x - s * 0.3, 0, x + s * 0.3, 0, [[0, P.piedraLuz], [1, P.piedra]]);
      ctx.beginPath(); ctx.moveTo(x - s * 0.32, y + s * 0.3); ctx.lineTo(x - s * 0.26, y - s * 0.12);
      ctx.quadraticCurveTo(x, y - s * 0.3, x + s * 0.26, y - s * 0.12);
      ctx.lineTo(x + s * 0.32, y + s * 0.3); ctx.closePath(); ctx.fill();
      var fuego = 0.7 + 0.3 * Math.sin(t * 0.008) * Math.sin(t * 0.013);
      ctx.fillStyle = radial(ctx, x, y + s * 0.12, 0, s * 0.16, [[0, alfa(P.oro, fuego)],
        [0.6, alfa(P.ascua, fuego)], [1, alfa(P.ascua, 0.2)]]);
      ctx.beginPath(); ctx.arc(x, y + s * 0.14, s * 0.12, Math.PI, 0); ctx.lineTo(x + s * 0.12, y + s * 0.3);
      ctx.lineTo(x - s * 0.12, y + s * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = lineal(ctx, x + s * 0.1, 0, x + s * 0.22, 0, [[0, P.cobreLuz], [1, P.cobre]]);
      ctx.fillRect(x + s * 0.1, y - s * 0.5, s * 0.1, s * 0.34);
      for (var i = 0; i < 4; i++) {
        var f = ((t * 0.0006 + i / 4) % 1), vy = y - s * 0.52 - f * s * 0.5;
        ctx.fillStyle = alfa(P.vidrio, 0.35 * (1 - f));
        ctx.beginPath(); ctx.arc(x + s * 0.15 + Math.sin(f * 6 + i) * s * 0.06, vy, s * (0.05 + f * 0.1), 0, 7);
        ctx.fill();
      }
    },
    /* La Aguja: espira que perfora la niebla con un haz violeta. */
    aguja: function (ctx, x, y, s, t) {
      zocalo(ctx, x, y, s);
      var haz = 0.35 + 0.25 * Math.sin(t * 0.004);
      ctx.fillStyle = lineal(ctx, x, y - s * 0.7, x, y + s * 0.4, [[0, alfa(P.violetaLuz, haz)],
        [1, alfa(P.violeta, 0)]]);
      ctx.beginPath(); ctx.moveTo(x - s * 0.03, y - s * 0.72); ctx.lineTo(x + s * 0.03, y - s * 0.72);
      ctx.lineTo(x + s * 0.2, y + s * 0.4); ctx.lineTo(x - s * 0.2, y + s * 0.4); ctx.fill();
      ctx.fillStyle = lineal(ctx, x - s * 0.12, 0, x + s * 0.12, 0, [[0, P.piedraLuz], [0.5, '#6b5d96'], [1, P.piedra]]);
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.75); ctx.lineTo(x + s * 0.13, y + s * 0.3);
      ctx.lineTo(x - s * 0.13, y + s * 0.3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.cobreLuz; ctx.lineWidth = s * 0.025;
      [0.05, -0.2, -0.45].forEach(function (k, i) {
        var a = s * (0.11 - i * 0.03);
        ctx.beginPath(); ctx.ellipse(x, y + s * k, a, a * 0.3, 0, 0, 7); ctx.stroke();
      });
      ctx.fillStyle = radial(ctx, x, y - s * 0.75, 0, s * 0.12, [[0, '#ffffff'], [0.4, alfa(P.violetaLuz, 0.9)],
        [1, alfa(P.violeta, 0)]]);
      ctx.beginPath(); ctx.arc(x, y - s * 0.75, s * 0.12, 0, 7); ctx.fill();
    },
    /* El Ojo: torre-faro con una lente que barre el agua. */
    ojo: function (ctx, x, y, s, t) {
      zocalo(ctx, x, y, s);
      var ang = -Math.PI / 2 + Math.sin(t * 0.0012) * 0.9;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = alfa(P.kelpLuz, 0.14);
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.3);
      ctx.arc(x, y - s * 0.3, s * 1.1, ang - 0.22, ang + 0.22); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = lineal(ctx, x - s * 0.1, 0, x + s * 0.1, 0, [[0, P.piedraLuz], [1, P.piedra]]);
      ctx.fillRect(x - s * 0.09, y - s * 0.2, s * 0.18, s * 0.5);
      ctx.fillStyle = P.cobre;
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.3, s * 0.22, s * 0.14, 0, 0, 7); ctx.fill();
      ctx.fillStyle = radial(ctx, x, y - s * 0.3, 0, s * 0.12, [[0, '#ffffff'], [0.25, P.kelpLuz],
        [0.7, P.agua], [1, P.hondo]]);
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.3, s * 0.16, s * 0.1, 0, 0, 7); ctx.fill();
      ctx.fillStyle = P.fondo;
      ctx.beginPath(); ctx.arc(x + Math.cos(ang) * s * 0.03, y - s * 0.3, s * 0.035, 0, 7); ctx.fill();
    },
    /* La Grieta: agua fria que entra, con su resplandor de alarma. */
    grieta: function (ctx, x, y, s, t) {
      var a = 0.45 + 0.35 * Math.abs(Math.sin(t * 0.004));
      ctx.fillStyle = radial(ctx, x, y, 0, s * 0.5, [[0, alfa(P.alerta, a)], [1, alfa(P.alerta, 0)]]);
      ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, 7); ctx.fill();
      ctx.strokeStyle = P.oro; ctx.lineWidth = s * 0.04; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.2); ctx.lineTo(x - s * 0.08, y - s * 0.02);
      ctx.lineTo(x - s * 0.16, y + s * 0.08); ctx.lineTo(x + s * 0.12, y + s * 0.22);
      ctx.lineTo(x + s * 0.02, y + s * 0.04); ctx.lineTo(x + s * 0.3, y - s * 0.14); ctx.stroke();
      for (var i = 0; i < 5; i++) {
        var f = ((t * 0.0007 + i / 5) % 1);
        ctx.strokeStyle = alfa(P.vidrio, 0.7 * (1 - f)); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x + (i - 2) * s * 0.08, y - f * s * 0.7, s * 0.03 + f * s * 0.03, 0, 7);
        ctx.stroke();
      }
    }
  };

  /* --- LOS BUZOS ATLANTES ------------------------------------------------ */
  function buzo(ctx, x, y, s, t, mira) {
    ctx.save(); ctx.translate(x, y); ctx.scale(mira < 0 ? -1 : 1, 1);
    var aleta = Math.sin(t * 0.012) * 0.35;
    ctx.fillStyle = P.hondo;
    ctx.save(); ctx.translate(-s * 0.5, s * 0.05); ctx.rotate(aleta);
    ctx.beginPath(); ctx.ellipse(-s * 0.2, 0, s * 0.25, s * 0.08, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = lineal(ctx, 0, -s * 0.2, 0, s * 0.2, [[0, '#2f6f86'], [1, '#183a52']]);
    ctx.beginPath(); ctx.ellipse(-s * 0.1, 0, s * 0.42, s * 0.16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = lineal(ctx, 0, -s * 0.2, 0, 0, [[0, P.cobreLuz], [1, P.cobre]]);
    ctx.fillRect(-s * 0.35, -s * 0.24, s * 0.34, s * 0.12);
    ctx.fillStyle = radial(ctx, -s * 0.36, -s * 0.18, 0, s * 0.08, [[0, alfa(P.oro, 0.95)], [1, alfa(P.oro, 0)]]);
    ctx.beginPath(); ctx.arc(-s * 0.36, -s * 0.18, s * 0.08, 0, 7); ctx.fill();
    ctx.fillStyle = radial(ctx, s * 0.38, -s * 0.05, s * 0.02, s * 0.2, [[0, alfa(P.vidrio, 0.9)],
      [0.7, alfa(P.agua, 0.5)], [1, P.cobre]]);
    ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.04, s * 0.18, 0, 7); ctx.fill();
    ctx.strokeStyle = alfa('#ffffff', 0.8); ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.04, s * 0.12, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
    ctx.restore();
    for (var i = 0; i < 3; i++) {
      var f = ((t * 0.001 + i / 3) % 1);
      ctx.strokeStyle = alfa(P.vidrio, 0.6 * (1 - f)); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x - mira * s * 0.5, y - s * 0.2 - f * s * 0.8, s * 0.05 + f * s * 0.04, 0, 7);
      ctx.stroke();
    }
  }

  window.AtlasArte = {
    P: P, alfa: alfa, azar: azar,
    fondoEstatico: fondoEstatico, rayos: rayos, plancton: plancton,
    estructura: function (ctx, tipo, x, y, s, t) {
      if (ESTRUCTURA[tipo]) { ctx.save(); ESTRUCTURA[tipo](ctx, x, y, s, t); ctx.restore(); }
    },
    buzo: buzo
  };
})();
