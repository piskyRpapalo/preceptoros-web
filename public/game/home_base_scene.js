/* preceptoros.org · theGame · TU CASA: la ciudad sumergida vista en corte, de lado.

   POR QUE DE LADO (decision de diseno, 2026-10-05). El Soberano pidio «TU CASA (vista lateral de
   Atlantis o superior)». Se elige el CORTE LATERAL: en un movil en vertical las capas de agua caben de
   arriba abajo, la luz baja como baja en el mar y un nino reconoce «mi casa» (entonces una cupula, hoy
   su cangrejo) sin leer nada. La vista superior obligaba a explicar que un circulo es un edificio.

   CAPAS, de atras adelante, en lienzos aparte (se rehacen solo al cambiar el tamano o la paleta):
   el agua (gradiente con tramado Atkinson), las ruinas lejanas (parallax lento) y el lecho. Encima,
   cada cuadro: rayos de luz aditivos, burbujas deterministas y TU CANGREJO.

   LA CASA ES EL CANGREJO (R2, plan «el refresco», 2026-10-11): la rejilla de edificios se retiro. Los
   edificios son PARTES de su cuerpo (gdpr-art25-ephemeral-crab.js), que crecen con lo MEDIDO y bajan si
   baja; lo no medido va en niebla. Tu emblema (tu onda) va en el caparazon, que es el Nucleo, y la grieta
   lo raja. Los botones del DOM (`home_buildings.js`) se ponen en las ANCLAS que devuelve el dibujo. Sin
   azar, sin red, sin imagenes. Con movimiento reducido, todo quieto. Si los fps bajan de 50, la calidad
   baja sola. */
(function (raiz) {
  'use strict';

  var E = raiz.AtlasEscena, O = raiz.AtlasOnda;
  /* El suelo, en fraccion del alto; el cangrejo anda por la franja central (FRANJA del ancho). */
  var SUELO = 0.74, FRANJA = 0.35;
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
    var capas = null, clave = '', med = O.medidor(), calidad = 2, cic = -1, t0 = 0;

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
    /* El caparazon ES el Nucleo: tu emblema (tu onda, de tus armonicos) va dentro, y la grieta lo raja. */
    function caparazon(an, s, casa, t, P) {
      var x = an.caparazon[0], y = an.caparazon[1], rr = an.radio, em = casa.emblema;
      if (em) { O.dibuja(g, em, x, y, rr * 0.26, { t: t, giro: t * 0.00025, color: P.acento, grosor: 1.8 * dpr, estela: 3, brillo: 1, calidad: calidad }); }
      if (!s.grieta) { return; }
      g.save(); g.strokeStyle = 'rgba(255,120,90,.9)'; g.lineWidth = 1.6 * dpr; g.beginPath(); g.moveTo(x + rr * 0.3, y - rr * 0.25);
      for (var k = 1; k <= 6; k++) { g.lineTo(x + rr * 0.3 + (E.hash(k, 9, 1) - 0.5) * rr * 0.2, y - rr * 0.25 + k * rr * 0.07); }
      g.stroke(); g.restore();
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
      /* EL CANGREJO, grande y al centro: el mismo paseo del ciclo de juego (J1), proyectado a la franja
         central; el reloj solo rellena ENTRE ciclos. Devuelve las anclas de sus partes. */
      var CJ = raiz.AtlasCangrejo, cj = CJ && f.cangrejo ? f.cangrejo() : null, an = null;
      if (cj) {
        if (cj.ciclo !== cic) { cic = cj.ciclo; t0 = ts; }
        var pc = CJ.paseo(cj.semilla, cj.ciclo, q ? 0 : (ts - t0) / 1000), r = Math.min(W * 0.16, H * 0.2);
        an = CJ.pinta(g, (0.5 + (pc.x - 0.5) * FRANJA) * W, SUELO * H + 0.02 * H, r,
                      { forma: CJ.forma(cj.army, cj.nodo, cj.latido), cuerpo: cj.cuerpo, estilo: casa.estilo, t: t, dir: pc.dir, dpr: dpr, quieto: q });
        if (an) { caparazon(an, s, casa, t, P); }
      }
      if (!q) { burbujas(W, H, t, calidad >= 2 ? 26 : calidad ? 14 : 6); }
      if (f.anclas) { f.anclas(an, W, H); }
    }
    raf = raiz.requestAnimationFrame(pinta);
    return { para: function () { vivo = false; raiz.cancelAnimationFrame(raf); }, fps: function () { return med.fps(); }, calidad: function () { return calidad; } };
  }

  raiz.AtlasCasaEscena = { crea: crea, PALETAS: PALETAS, SUELO: SUELO, FRANJA: FRANJA };
})(this);
