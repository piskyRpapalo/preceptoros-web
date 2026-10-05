/* preceptoros.org · theGame · LA REVELACION: una onda nace, armonico a armonico, y se asienta.

   Pedido del Soberano (2026-10-05): «la escena de invocacion/taller es la revelacion del gacha: la
   onda nace, se compone armonico a armonico y se asienta. La rareza se ve en la riqueza de la forma,
   no en un numero». Cuando un huevo eclosiona (`ui.js`, `eclosiona`), esta escena ocupa el CENTRO:
   chispas que convergen (su sitio sale de la semilla de la tropa, no del azar), los armonicos de
   `gacha.js` que entran uno a uno -- cada uno con su destello --, y la figura que respira ya entera.
   Una onda comun tiene pocos armonicos con peso; una unica, muchos: se VE.

   El resultado no se decide aqui: la tropa ya salio de su semilla firmada. Esto es solo su escena.
   Con movimiento reducido se pinta la forma final, quieta, con el mismo texto. Se cierra con un
   toque, con Escape o con su boton; el foco vuelve a donde estaba. */
(function (raiz) {
  'use strict';

  var O = raiz.AtlasOnda, E = raiz.AtlasEscena, DURA = 3600;

  function quieto() { return raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function T(k, d) { return (raiz.AtlasJuego && raiz.AtlasJuego.texto(k)) || d; }
  function semillaInt(t) { return parseInt(String(t.semilla || '0').slice(0, 8), 16) || 7; }

  function muestra(t) {
    if (!t || !t.armonicos) { return; }
    var capa = document.getElementById('thegame') || document.body, antes = document.activeElement;
    var fondo = el('div', 'revela'), cv = el('canvas', 'revela-lienzo'), n = O.riqueza(t.armonicos);
    var rar = T('rar_' + t.rareza, t.rareza);
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', rar + ' · ' + n + ' ' + T('revela_arm', 'harmonics') + ' · ' + T('revela_aria', 'a new wave is born, harmonic by harmonic'));
    var pie = el('div', 'revela-pie'), txt = el('p', 'revela-txt'), b = el('button', 'boton revela-ok', T('revela_ok', 'Continue'));
    b.type = 'button'; txt.setAttribute('role', 'status');
    pie.appendChild(txt); pie.appendChild(b); fondo.appendChild(cv); fondo.appendChild(pie);
    capa.appendChild(fondo);
    var g = cv.getContext('2d'), dpr = Math.min(2, raiz.devicePixelRatio || 1), t0 = null, raf = 0, vivo = true, q = quieto();
    var sem = semillaInt(t), col = O.tono(t), chispas = [];
    for (var i = 0; i < 48; i++) { chispas.push([E.hash(i, 1, sem), E.hash(i, 2, sem), 0.4 + E.hash(i, 3, sem) * 0.6]); }
    var anillos = [];
    function cierra() {
      if (!vivo) { return; }
      vivo = false; raiz.cancelAnimationFrame(raf); fondo.remove();
      document.removeEventListener('keydown', tecla, true);
      if (antes && antes.focus) { antes.focus(); }
    }
    function tecla(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cierra(); } }
    function cuadro(ts) {
      if (!vivo) { return; }
      raf = raiz.requestAnimationFrame(cuadro);
      if (t0 === null) { t0 = ts; }
      var w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      var W = cv.width, H = cv.height, cx = W / 2, cy = H * 0.44, R = Math.min(W, H) * 0.3;
      var p = q ? 1 : Math.min(1, (ts - t0) / DURA), crece = q ? 1 : Math.max(0, Math.min(1, (p - 0.18) / 0.6));
      g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(4,4,14,' + (q ? 1 : 0.35) + ')'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      /* Las chispas convergen hacia el centro en el primer tramo. */
      if (p < 0.4) {
        var k = Math.min(1, p / 0.3);
        chispas.forEach(function (c) {
          var a = c[0] * Math.PI * 2, d = (1 - k) * Math.max(W, H) * 0.6 * c[2];
          g.fillStyle = 'hsla(' + col[0] + ' ' + col[1] + '% 80% / ' + (0.3 + 0.7 * k) + ')';
          g.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2.5 * dpr, 2.5 * dpr);
        });
      }
      /* Cada armonico que entra deja un anillo. */
      var entra = Math.floor(crece * t.armonicos.length);
      while (anillos.length < entra) { anillos.push(ts); }
      anillos.forEach(function (a0) {
        var d = (ts - a0) / 700; if (d > 1) { return; }
        g.strokeStyle = 'hsla(' + col[0] + ' ' + col[1] + '% 75% / ' + (1 - d) * 0.6 + ')'; g.lineWidth = 2 * dpr;
        g.beginPath(); g.arc(cx, cy, R * (0.3 + d * 1.1), 0, Math.PI * 2); g.stroke();
      });
      if (crece > 0) {
        O.dibuja(g, t.armonicos, cx, cy, R * (0.6 + 0.4 * crece), { t: ts, crece: crece, giro: q ? 0 : (ts - t0) * 0.00035,
          color: col, grosor: 2.6 * dpr, brillo: 0.6 + 0.4 * crece, estela: q ? 0 : 6, respira: !q, calidad: 2 });
      }
      if (p >= 1 && !txt.textContent) { txt.textContent = rar + ' · ' + n + ' ' + T('revela_arm', 'harmonics'); b.focus(); }
    }
    b.addEventListener('click', cierra);
    fondo.addEventListener('click', function (e) { if (e.target === cv && (q || t0 !== null)) { cierra(); } });
    document.addEventListener('keydown', tecla, true);
    raf = raiz.requestAnimationFrame(cuadro);
    return { cierra: cierra };
  }

  raiz.AtlasRevela = { muestra: muestra, DURA: DURA };
})(this);
