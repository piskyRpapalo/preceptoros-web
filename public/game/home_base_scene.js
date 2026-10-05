/* preceptoros.org · theGame · TU CASA: la ciudad sumergida vista en corte, de lado.

   POR QUE DE LADO (decision de diseno, 2026-10-05). El Soberano pidio «TU CASA (vista lateral de
   Atlantis o superior)». Se elige el CORTE LATERAL: en un movil en vertical las capas de agua caben de
   arriba abajo, la luz baja como baja en el mar y un nino reconoce «mi casa» en una cupula sobre el
   fondo, sin leer nada. La vista superior obligaba a explicar que un circulo es un edificio.

   CAPAS, de atras adelante, en lienzos aparte (se rehacen solo al cambiar el tamano o la paleta):
   el agua (gradiente con tramado Atkinson), las ruinas lejanas (parallax lento) y el lecho. Encima,
   cada cuadro: rayos de luz aditivos, burbujas deterministas, los edificios y la gran CUPULA del
   Nucleo con tu emblema dentro (tu onda, de tus armonicos). Lo no medido de un edificio es NIEBLA.

   LOS EDIFICIOS SON BOTONES DEL DOM (`home_buildings.js`): aqui solo se pinta su forma, en el sitio
   que dice `PARCELAS`, y con el tamano que sale del ESTADO MEDIDO del juego. Sin azar, sin red, sin
   imagenes. Con movimiento reducido, todo quieto. Si los fps bajan de 50, la calidad baja sola. */
(function (raiz) {
  'use strict';

  var E = raiz.AtlasEscena, O = raiz.AtlasOnda;
  /* Donde va cada edificio: x y ancho en fraccion del lienzo; el suelo esta en SUELO. */
  var SUELO = 0.74;
  var PARCELAS = {
    faro: { x: 0.12, w: 0.14 }, army: { x: 0.31, w: 0.2 }, taller: { x: 0.7, w: 0.18 },
    bosque: { x: 0.89, w: 0.18 }, arena: { x: 0.5, w: 0.34, y: 0.95 }
  };
  var PALETAS = {
    abismo: { agua: [[4, 6, 18], [8, 14, 34], [14, 26, 56], [22, 44, 82], [40, 74, 112]], acento: [272, 75, 70], vidrio: [200, 80, 75] },
    coral: { agua: [[10, 4, 14], [26, 10, 30], [52, 18, 46], [86, 34, 60], [130, 62, 78]], acento: [18, 85, 66], vidrio: [340, 70, 78] },
    kelp: { agua: [[3, 10, 10], [6, 22, 20], [10, 40, 34], [20, 64, 50], [44, 96, 70]], acento: [140, 60, 60], vidrio: [170, 60, 72] },
    perla: { agua: [[10, 12, 18], [22, 26, 38], [42, 48, 66], [72, 80, 100], [120, 128, 146]], acento: [45, 70, 70], vidrio: [210, 30, 85] }
  };

  function quieto() { return raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function hsl(c, a) { return 'hsla(' + c[0] + ' ' + c[1] + '% ' + c[2] + '% / ' + (a == null ? 1 : a) + ')'; }

  function crea(lienzo, f) {
    var g = lienzo.getContext('2d'), dpr = Math.min(2, raiz.devicePixelRatio || 1), raf = 0, vivo = true;
    var capas = null, clave = '', med = O.medidor(), calidad = 2, niebla = null;

    function prepara(W, H, pal) {
      var w = Math.ceil(W / (3 * dpr)), h = Math.ceil(H / (3 * dpr)), P = PALETAS[pal] || PALETAS.abismo;
      var agua = E.textura(w, h, function (x, y) {
        return Math.max(0, Math.min(1, 1 - y / h * 1.05 + E.fbm(x / 30, y / 18, 5) * 0.25 - 0.08));
      }, P.agua);
      var lejos = E.textura(w * 2, h, function (x, y) {
        var alto = 0.62 + E.fbm(x / 9, 1, 21) * 0.18, ruina = (Math.floor(x / 11) % 5 === 0) ? 0.1 : 0;
        return y / h > alto - ruina ? 0.35 + E.fbm(x / 4, y / 4, 8) * 0.25 : 0;
      }, [null, P.agua[1], P.agua[2]]);
      var lecho = E.textura(w, h, function (x, y) {
        var s = SUELO + Math.sin(x / w * 9) * 0.015 + E.fbm(x / 14, 3, 2) * 0.03;
        return y / h < s ? 0 : 0.45 + E.fbm(x / 5, y / 5, 9) * 0.55;
      }, [null, [30, 26, 34], [52, 44, 50], [86, 74, 70]]);
      niebla = E.textura(32, 32, function (x, y) { return 0.3 + E.fbm(x / 5, y / 5, 31) * 0.3; }, [null, [150, 160, 182]]);
      capas = { agua: agua, lejos: lejos, lecho: lecho, P: P };
    }
    /* Rayos de luz que bajan, en suma aditiva. */
    function rayos(W, H, t, P) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 5; i++) {
        var x = W * (0.12 + i * 0.2) + Math.sin(t * 0.0003 + i * 2) * W * 0.03, a = 0.035 + 0.02 * Math.sin(t * 0.0007 + i);
        var gr = g.createLinearGradient(0, 0, 0, H * SUELO);
        gr.addColorStop(0, hsl(P.vidrio, a * 1.6)); gr.addColorStop(1, hsl(P.vidrio, 0));
        g.fillStyle = gr; g.beginPath(); g.moveTo(x - W * 0.02, 0); g.lineTo(x + W * 0.02, 0);
        g.lineTo(x + W * 0.09, H * SUELO); g.lineTo(x - W * 0.05, H * SUELO); g.fill();
      }
      g.restore();
    }
    /* Burbujas: posicion por hash, suben con el tiempo de pantalla. */
    function burbujas(W, H, t, n) {
      g.save(); g.strokeStyle = 'rgba(200,230,255,.45)'; g.lineWidth = dpr;
      for (var i = 0; i < n; i++) {
        var hx = E.hash(i, 1, 7), hy = E.hash(i, 2, 7), r = (1 + E.hash(i, 3, 7) * 3) * dpr;
        var y = (hy * H - t * (0.02 + hx * 0.03) * dpr) % (H * SUELO); if (y < 0) { y += H * SUELO; }
        var x = hx * W + Math.sin(t * 0.002 + i) * 3 * dpr;
        g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.stroke();
      }
      g.restore();
    }
    function enNiebla(x, y, w, h) {
      g.save(); g.imageSmoothingEnabled = false; g.beginPath(); g.rect(x, y, w, h); g.clip();
      var L = 64 * dpr; for (var i = x; i < x + w; i += L) { for (var j = y; j < y + h; j += L) { g.drawImage(niebla, i, j, L, L); } }
      g.restore();
    }
    /* Las formas: una torre, cupulas, un faro, un jardin, un anfiteatro. Todo con el estilo elegido. */
    function techo(x, y, w, estilo) {
      g.beginPath();
      if (estilo === 'aguja') { g.moveTo(x - w / 2, y); g.lineTo(x, y - w * 0.9); g.lineTo(x + w / 2, y); }
      else if (estilo === 'concha') { for (var i = 0; i <= 12; i++) { var u = i / 12 * Math.PI; g.lineTo(x - Math.cos(u) * w / 2, y - Math.sin(u) * w * 0.45 * (1 + 0.12 * Math.sin(u * 7))); } }
      else { g.ellipse(x, y, w / 2, w * 0.45, 0, Math.PI, 2 * Math.PI); }
      g.closePath();
    }
    function ventanas(x, y, w, h, n, P, t) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var i = 0; i < n; i++) {
        var a = 0.5 + 0.3 * Math.sin(t * 0.001 + i * 1.3);
        g.fillStyle = hsl(P.acento, a); g.fillRect(x - w * 0.3 + (i % 3) * w * 0.25, y + h * 0.2 + Math.floor(i / 3) * h * 0.22, w * 0.1, h * 0.1);
      }
      g.restore();
    }
    function edificio(id, W, H, e, casa, t, P) {
      var p = PARCELAS[id], x = p.x * W, base = (p.y || SUELO) * H, w = p.w * W, cuerpo = hsl([P.vidrio[0], 18, 22]), borde = hsl(P.acento, 0.9);
      g.save(); g.lineWidth = 1.5 * dpr; g.strokeStyle = borde; g.fillStyle = cuerpo;
      var nivel = e && e.nivel != null ? e.nivel : 0, h;
      if (id === 'faro') {
        h = H * (0.32 + Math.min(0.12, nivel * 0.02));
        g.beginPath(); g.moveTo(x - w * 0.25, base); g.lineTo(x - w * 0.12, base - h); g.lineTo(x + w * 0.12, base - h); g.lineTo(x + w * 0.25, base); g.closePath(); g.fill(); g.stroke();
        var ang = quieto() ? -0.4 : Math.sin(t * 0.0009) * 0.9 - 0.3;
        g.globalCompositeOperation = 'lighter';
        var gr = g.createRadialGradient(x, base - h, 0, x, base - h, W * 0.5);
        gr.addColorStop(0, hsl(P.acento, 0.35)); gr.addColorStop(1, hsl(P.acento, 0));
        g.fillStyle = gr; g.beginPath(); g.moveTo(x, base - h);
        g.arc(x, base - h, W * 0.5, ang - 0.12, ang + 0.12); g.closePath(); g.fill();
        g.fillStyle = hsl(P.acento, 0.9); g.beginPath(); g.arc(x, base - h, 4 * dpr, 0, 7); g.fill();
      } else if (id === 'army') {
        var n = Math.max(1, Math.min(5, nivel || 1));
        for (var i = 0; i < n; i++) {
          var cx = x + (i - (n - 1) / 2) * w * 0.22, cw = w * (i % 2 ? 0.26 : 0.32);
          g.fillRect(cx - cw / 2, base - cw * 0.35, cw, cw * 0.35); techo(cx, base - cw * 0.35, cw, casa.estilo); g.fill(); g.stroke();
        }
        if (!nivel) { g.setLineDash([4 * dpr, 4 * dpr]); g.strokeRect(x - w * 0.4, base - w * 0.3, w * 0.8, w * 0.3); g.setLineDash([]); }
      } else if (id === 'taller') {
        h = H * (0.14 + Math.min(0.16, nivel * 0.008));
        g.fillRect(x - w * 0.3, base - h, w * 0.6, h); g.strokeRect(x - w * 0.3, base - h, w * 0.6, h);
        techo(x, base - h, w * 0.7, casa.estilo); g.fill(); g.stroke();
        ventanas(x, base - h, w, h, Math.min(9, 2 + Math.floor(nivel / 3)), P, t);
        g.globalCompositeOperation = 'lighter'; g.fillStyle = hsl([28, 90, 60], 0.25 + 0.15 * Math.sin(t * 0.004));
        g.beginPath(); g.arc(x, base - h * 0.2, w * 0.12, 0, 7); g.fill();
      } else if (id === 'bosque') {
        var k = Math.max(2, Math.min(9, 2 + Math.floor(nivel / 2)));
        g.strokeStyle = hsl([130, 55, 48], 0.9); g.lineWidth = 2.4 * dpr;
        for (var j = 0; j < k; j++) {
          var kx = x + (j - (k - 1) / 2) * w * 0.11, kh = H * (0.12 + E.hash(j, 4, 3) * 0.12);
          g.beginPath(); g.moveTo(kx, base);
          for (var s = 1; s <= 10; s++) { g.lineTo(kx + Math.sin(s * 0.9 + t * 0.0015 + j) * 5 * dpr * s / 10, base - kh * s / 10); }
          g.stroke();
        }
      } else if (id === 'arena') {
        g.beginPath(); g.ellipse(x, base, w / 2, H * 0.04, 0, 0, 2 * Math.PI); g.fill(); g.stroke();
        g.beginPath(); g.ellipse(x, base, w * 0.32, H * 0.024, 0, 0, 2 * Math.PI); g.stroke();
      }
      g.restore();
      if (!e || !e.medido) { enNiebla(x - w / 2, base - H * 0.3, w, H * 0.3); }
    }
    /* La gran cupula del Nucleo: su tamano sale del nivel; su vidrio se raja si la grieta esta abierta. */
    function cupula(W, H, s, casa, t, P) {
      var x = W * 0.5, base = SUELO * H, rx = Math.min(W * (0.165 + Math.min(0.05, (s.nucleo || 1) * 0.005)), H * 0.26), ry = Math.min(H * 0.36, rx * 1.55);
      g.save(); g.lineWidth = 2 * dpr;
      var gr = g.createLinearGradient(0, base - ry, 0, base);
      gr.addColorStop(0, hsl(P.vidrio, 0.18)); gr.addColorStop(1, hsl(P.vidrio, 0.04));
      g.fillStyle = gr; g.strokeStyle = hsl(P.vidrio, 0.8);
      g.beginPath(); g.ellipse(x, base, rx, ry, 0, Math.PI, 2 * Math.PI); g.fill(); g.stroke();
      g.strokeStyle = hsl(P.vidrio, 0.25); g.lineWidth = dpr;
      for (var i = 1; i < 6; i++) { g.beginPath(); g.ellipse(x, base, rx * i / 6, ry, 0, Math.PI, 2 * Math.PI); g.stroke(); }
      if (s.grieta) {
        g.strokeStyle = 'rgba(255,120,90,.9)'; g.lineWidth = 1.6 * dpr; g.beginPath();
        var cx = x + rx * 0.45, cy = base - ry * 0.55; g.moveTo(cx, cy);
        for (var k = 1; k <= 6; k++) { g.lineTo(cx + (E.hash(k, 9, 1) - 0.5) * rx * 0.3, cy + k * ry * 0.06); }
        g.stroke();
      }
      g.restore();
      var em = casa.emblema;
      if (em) { O.dibuja(g, em, x, base - ry * 0.5, Math.min(rx, ry) * 0.62, { t: t, giro: t * 0.00025, color: P.acento, grosor: 2.2 * dpr, estela: 4, brillo: 1, calidad: calidad }); }
    }
    function pinta(ts) {
      if (!vivo) { return; }
      raf = raiz.requestAnimationFrame(pinta);
      if (lienzo.offsetParent === null || raiz.document.hidden) { return; }
      med.cuadro(ts); calidad = med.nivel(2);
      var w = Math.max(240, lienzo.clientWidth), h = Math.max(240, lienzo.clientHeight);
      if (lienzo.width !== Math.round(w * dpr) || lienzo.height !== Math.round(h * dpr)) { lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr); clave = ''; }
      var W = lienzo.width, H = lienzo.height, casa = f.casa(), s = f.estado(), q = quieto(), t = q ? 0 : ts;
      if (clave !== W + ':' + H + ':' + casa.paleta) { clave = W + ':' + H + ':' + casa.paleta; prepara(W, H, casa.paleta); }
      var P = capas.P;
      g.imageSmoothingEnabled = false;
      g.drawImage(capas.agua, 0, 0, W, H);
      var off = q ? 0 : (t * 0.004 * dpr) % W;
      g.drawImage(capas.lejos, -off, 0, W * 2, H); g.drawImage(capas.lejos, W * 2 - off, 0, W * 2, H);
      if (calidad > 0) { rayos(W, H, t, P); }
      g.drawImage(capas.lecho, 0, 0, W, H);
      cupula(W, H, s, casa, t, P);
      var ed = f.edificios();
      Object.keys(PARCELAS).forEach(function (id) { edificio(id, W, H, ed[id], casa, t, P); });
      if (!q) { burbujas(W, H, t, calidad >= 2 ? 26 : calidad ? 14 : 6); }
    }
    raf = raiz.requestAnimationFrame(pinta);
    return { para: function () { vivo = false; raiz.cancelAnimationFrame(raf); }, fps: function () { return med.fps(); }, calidad: function () { return calidad; } };
  }

  raiz.AtlasCasaEscena = { crea: crea, PARCELAS: PARCELAS, PALETAS: PALETAS, SUELO: SUELO };
})(this);
