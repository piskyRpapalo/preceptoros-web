/* preceptoros.org · theGame · LA REPETICION de una batalla, como una partida de estrategia vista otra vez.

   El Soberano (2026-10-05): «busco unidades en movimiento por el mapa, como ver una partida de Age of
   Empires repetida. No solo el combate por turnos». Las tropas salen de sus bases, cruzan el terreno
   en formacion, rodean las rocas, chocan en el frente, disparan, retroceden, caen y se reagrupan.
   La camara sigue la accion. Mandos grandes: play/pausa, x1/x2/x4, una linea de tiempo que se
   arrastra y la formacion de tu bando.

   NADA DE ESTO DECIDE. El resultado y cada golpe salen de `arena.combate`; `battle_choreography.js`
   los pone en el mapa con un generador sembrado con la semilla de la partida, y este fichero solo los
   pinta. La formacion cambia la coreografia, nunca el registro. Misma partida, misma repeticion.

   LA ESTETICA MEDIDA SE QUEDA: el dano DESAFINA la figura, el color de cada onda es su VELOCIDAD, y el
   bando se distingue por la FORMA de su marca (circulo el tuyo, rombo el otro), no solo por el color.
   Con movimiento reducido: cuatro fotogramas clave quietos y el resumen en texto. El lienzo lleva
   `role=img` y los momentos clave se narran en una region viva. Sin azar, sin red, sin reloj. */
(function (raiz) {
  'use strict';

  var G = raiz.AtlasGacha, E = raiz.AtlasEscena, O = raiz.AtlasOnda, Co = raiz.AtlasCoreografia;
  var PALETA = [[6, 10, 22], [10, 22, 42], [16, 38, 64], [24, 56, 80], [38, 82, 96]];

  function quieto() { return raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function hsla(c, a) { return 'hsla(' + c[0] + ' ' + c[1] + '% ' + c[2] + '% / ' + a + ')'; }
  function velColor(v) { return [Math.round(210 - Math.max(0, Math.min(1, (v - 3) / 10)) * 185), 80, 64]; }

  function escena(lienzo, def, asa, combate, op) {
    op = op || {};
    var T = op.texto || function (k) { return k; }, col = op.colores || {}, yo = op.yo == null ? 1 : op.yo, q = quieto();
    var U = [def, asa].map(function (l) { return l.map(function (x) { return G.tirada(x.semilla, x.tc); }); });
    var tropas = U.map(function (l) { return l.map(function (t) { return { max: t.stats.vida, vel: t.stats.velocidad, inercia: t.stats.inercia }; }); });
    var semilla = /^[0-9a-f]{64}$/.test(op.semilla || '') ? op.semilla : raiz.AtlasCanon.huella(combate.registro);
    var casa = raiz.AtlasCasa && raiz.AtlasCasa.casa ? raiz.AtlasCasa.casa() : null, forma = (casa && casa.formacion) || 'agresiva', k = null;
    var g = lienzo.getContext('2d'), dpr = Math.min(2, raiz.devicePixelRatio || 1), fondo = null, t = 0, vel = 1, juega = !q, raf = 0, vivo = true;
    var ultimo = null, acabo = false, dicho = 0, med = O.medidor();

    function arma() {
      k = Co.coreografia(combate.registro, tropas, semilla, combate.gana, { lado: yo, formacion: forma });
      var s = parseInt(semilla.slice(0, 8), 16) % 9973, rocas = k.mapa.rocas;
      fondo = E.textura(250, 150, function (x, y) {
        var wx = x * 4, wy = y * 4, roca = 0;
        rocas.forEach(function (r) { var d = Math.hypot(wx - r.x, wy - r.y); if (d < r.r) { roca = Math.max(roca, 1 - d / r.r); } });
        return Math.min(1, E.fbm(x / 26, y / 26, s) * 0.75 + roca * 0.8);
      }, PALETA);
      R.tiempo.max = String(k.total);
      dicho = 0; R.narra.textContent = '';
      R.lista.textContent = '';
      k.momentos.forEach(function (m) { R.lista.appendChild(el('li', null, momento(m))); });
    }
    function momento(m) {
      if (m.tipo === 'cae') { return rellena(T('rp_cae'), { q: m.lado === yo ? T('arena_log_tu') : T('arena_log_ellos'), n: m.i + 1 }); }
      if (m.tipo === 'fin') { var c = op.letrero ? op.letrero(combate) : { texto: combate.gana }; return rellena(T('rp_fin'), { r: c.texto }); }
      return T('rp_' + m.tipo);
    }

    /* --- los mandos ---------------------------------------------------------------------------------- */
    var R = {}, caja = el('div', 'rp-mandos');
    R.play = el('button', 'boton rp-play'); R.play.type = 'button';
    R.vel = el('button', 'boton-sec rp-vel'); R.vel.type = 'button';
    R.forma = el('button', 'boton-sec rp-forma'); R.forma.type = 'button';
    R.tiempo = el('input', 'rp-tiempo'); R.tiempo.type = 'range'; R.tiempo.min = '0'; R.tiempo.step = '100';
    R.tiempo.setAttribute('aria-label', T('rp_tiempo'));
    R.narra = el('p', 'rp-narra'); R.narra.setAttribute('aria-live', 'polite');
    R.claves = el('details', 'rp-claves'); R.claves.appendChild(el('summary', null, T('rp_claves')));
    R.lista = el('ol'); R.claves.appendChild(R.lista);
    [R.play, R.vel, R.forma].forEach(function (b) { caja.appendChild(b); });
    caja.appendChild(R.tiempo);
    var ref = lienzo.nextSibling;
    [caja, R.narra, R.claves].forEach(function (n) { lienzo.parentNode.insertBefore(n, ref); });
    function rotulos() {
      R.play.textContent = juega ? '⏸' : '▶'; R.play.setAttribute('aria-label', T(juega ? 'rp_pausa' : 'rp_play'));
      R.vel.textContent = '×' + vel; R.vel.setAttribute('aria-label', rellena(T('arena_x'), { v: vel }));
      R.forma.textContent = rellena(T('rp_forma'), { f: T('rp_f_' + forma) });
    }
    R.play.addEventListener('click', function () { if (t >= k.total) { t = 0; acabo = false; } juega = !juega && !q; rotulos(); });
    R.vel.addEventListener('click', function () { vel = vel >= 4 ? 1 : vel * 2; rotulos(); });
    R.forma.addEventListener('click', function () {
      var F = Co.FORMAS; forma = F[(F.indexOf(forma) + 1) % F.length];
      if (raiz.AtlasCasa && raiz.AtlasCasa.pon) { raiz.AtlasCasa.pon('formacion', forma); }
      arma(); rotulos();
    });
    R.tiempo.addEventListener('input', function () { t = +R.tiempo.value; juega = false; rotulos(); });
    lienzo.setAttribute('aria-label', T('rp_aria'));

    /* --- la camara: encuadra a los vivos, suavizada sobre varios fotogramas (pura) ---------------- */
    function caja2(ti) {
      var f = k.frames[Math.max(0, Math.min(k.frames.length - 1, ti))], x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (var j = 0; j < f.length; j += 3) { if (f[j + 2] > 0) { x0 = Math.min(x0, f[j]); x1 = Math.max(x1, f[j]); y0 = Math.min(y0, f[j + 1]); y1 = Math.max(y1, f[j + 1]); } }
      return x0 > x1 ? [0, 0, 1000, 600] : [x0, y0, x1, y1];
    }
    function camara(ti, W, H) {
      var s = [0, 0, 0, 0], n = 0;
      for (var d = -8; d <= 8; d += 2) { var b = caja2(ti + d); s[0] += b[0]; s[1] += b[1]; s[2] += b[2]; s[3] += b[3]; n++; }
      var cx = (s[0] + s[2]) / 2 / n, cy = (s[1] + s[3]) / 2 / n, bw = (s[2] - s[0]) / n + 240, bh = (s[3] - s[1]) / n + 200;
      var z0 = Math.max(W / 1000, H / 600), z = Math.max(z0, Math.min(Math.min(W / bw, H / bh), z0 * 2.4));
      cx = Math.max(W / 2 / z, Math.min(1000 - W / 2 / z, cx)); cy = Math.max(H / 2 / z, Math.min(600 - H / 2 / z, cy));
      if (W / z > 1000) { cx = 500; } if (H / z > 600) { cy = 300; }
      return { z: z, x: cx, y: cy };
    }
    function pos(fi, j, a) {
      var f0 = k.frames[fi], f1 = k.frames[Math.min(k.frames.length - 1, fi + 1)];
      return [f0[j * 3] + (f1[j * 3] - f0[j * 3]) * a, f0[j * 3 + 1] + (f1[j * 3 + 1] - f0[j * 3 + 1]) * a, f0[j * 3 + 2]];
    }

    /* --- un fotograma, en un rectangulo del lienzo (los cuatro clave lo usan con movimiento reducido) -- */
    function dibuja(ti, rx, ry, W, H, calidad) {
      var fi = Math.min(k.frames.length - 1, Math.floor(ti / k.muestra)), a = (ti % k.muestra) / k.muestra, cam = camara(fi, W, H), z = cam.z;
      function P(x, y) { return [rx + (x - cam.x) * z + W / 2, ry + (y - cam.y) * z + H / 2]; }
      g.save(); g.beginPath(); g.rect(rx, ry, W, H); g.clip();
      g.imageSmoothingEnabled = false;
      var o = P(0, 0); g.drawImage(fondo, o[0], o[1], 1000 * z, 600 * z);
      g.globalCompositeOperation = 'lighter'; g.lineWidth = 1.2 * dpr;
      k.mapa.rocas.forEach(function (r) { var p = P(r.x, r.y); g.strokeStyle = 'rgba(120,170,200,.25)'; g.beginPath(); g.arc(p[0], p[1], r.r * z, 0, 7); g.stroke(); });
      g.globalCompositeOperation = 'source-over';
      k.mapa.bases.forEach(function (b, l) {
        var p = P(b.x, b.y); g.strokeStyle = l === yo ? (col.tuya || '#c98a4b') : (col.suya || '#8b5cf6'); g.lineWidth = 2 * dpr;
        g.beginPath(); g.arc(p[0], p[1], 34 * z, 0, 7); g.stroke();
      });
      var n0 = k.n[0], r = Math.max(7 * dpr, 15 * z);
      for (var j = 0; j < k.max.length; j++) {
        var l = j < n0 ? 0 : 1, i = l ? j - n0 : j, p = pos(fi, j, a), s = P(p[0], p[1]), tr = U[l][i];
        /* La estela: por donde paso en los ultimos fotogramas. */
        if (calidad && p[2] > 0) {
          g.strokeStyle = hsla(velColor(k.vel[j]), 0.18); g.lineWidth = 1.5 * dpr; g.beginPath();
          for (var e = 6; e >= 0; e--) { var pe = pos(Math.max(0, fi - e), j, 0), se = P(pe[0], pe[1]); g[e === 6 ? 'moveTo' : 'lineTo'](se[0], se[1]); }
          g.stroke();
        }
        g.strokeStyle = l === yo ? (col.tuya || '#c98a4b') : (col.suya || '#8b5cf6'); g.lineWidth = 1.6 * dpr;
        g.beginPath();
        if (l === yo) { g.ellipse(s[0], s[1] + r * 0.9, r * 0.9, r * 0.35, 0, 0, 7); }
        else { g.moveTo(s[0] - r * 0.9, s[1] + r * 0.9); g.lineTo(s[0], s[1] + r * 0.55); g.lineTo(s[0] + r * 0.9, s[1] + r * 0.9); g.lineTo(s[0], s[1] + r * 1.25); g.closePath(); }
        g.stroke();
        if (p[2] > 0) {
          O.dibuja(g, tr.armonicos, s[0], s[1], r, { t: ti, giro: ti * 0.0006 * (l ? 1 : -1), color: velColor(k.vel[j]), grosor: 1.6 * dpr,
            brillo: calidad ? 0.7 : 0, desafina: Math.min(1, (1 - p[2] / k.max[j]) * 0.85), calidad: calidad, estela: 0 });
        } else {
          g.strokeStyle = 'rgba(200,200,220,.45)'; g.lineWidth = dpr; g.beginPath();
          g.moveTo(s[0] - r * 0.4, s[1] - r * 0.4); g.lineTo(s[0] + r * 0.4, s[1] + r * 0.4); g.moveTo(s[0] + r * 0.4, s[1] - r * 0.4); g.lineTo(s[0] - r * 0.4, s[1] + r * 0.4); g.stroke();
        }
      }
      /* Los disparos en vuelo, y su impacto. */
      g.globalCompositeOperation = 'lighter';
      k.tiros.forEach(function (d) {
        if (ti < d.t0 || ti > d.t1 + 420) { return; }
        var a0 = P(d.x0, d.y0), a1 = P(d.x1, d.y1), cl = velColor(k.vel[d.lado ? n0 + d.de : d.de]);
        if (ti <= d.t1) {
          var u = (ti - d.t0) / (d.t1 - d.t0), x = a0[0] + (a1[0] - a0[0]) * u, y = a0[1] + (a1[1] - a0[1]) * u - Math.sin(Math.PI * u) * 40 * z;
          g.strokeStyle = hsla(cl, 0.95); g.lineWidth = 1.6 * dpr; g.beginPath();
          for (var m = 0; m <= 28; m++) { var w = m / 28 * 6.2832; g[m ? 'lineTo' : 'moveTo'](x + Math.sin(3 * w + u * 6) * r * 0.45, y + Math.sin(2 * w) * r * 0.45); }
          g.stroke();
        } else if (d.dano > 0) {
          var v = (ti - d.t1) / 420; g.strokeStyle = hsla(cl, 1 - v); g.lineWidth = (1 - v) * 4 * dpr;
          g.beginPath(); g.arc(a1[0], a1[1], r * (0.6 + v * 1.4), 0, 7); g.stroke();
        }
      });
      g.globalCompositeOperation = 'source-over';
      var vivos = [0, 0], f = k.frames[fi];
      for (var j2 = 0; j2 < k.max.length; j2++) { if (f[j2 * 3 + 2] > 0) { vivos[j2 < n0 ? 0 : 1]++; } }
      g.font = '700 ' + Math.round(12 * dpr) + 'px ui-monospace, monospace'; g.textAlign = 'left'; g.fillStyle = 'rgba(4,6,14,.75)';
      g.fillRect(rx + 6 * dpr, ry + 6 * dpr, 150 * dpr, 20 * dpr); g.fillStyle = col.texto || '#ddd';
      g.fillText(rellena(T('rp_vivos'), { a: vivos[yo], b: vivos[1 - yo] }), rx + 12 * dpr, ry + 20 * dpr);
      if (ti >= k.fin + 600 && op.letrero) {
        var le = op.letrero(combate); g.textAlign = 'center'; g.fillStyle = 'rgba(4,6,14,.72)'; g.fillRect(rx, ry + H / 2 - 28 * dpr, W, 52 * dpr);
        g.fillStyle = le.color || '#ddd'; g.font = '700 ' + Math.round(Math.min(W / 8, 40 * dpr)) + 'px ui-monospace, monospace';
        g.fillText(le.texto, rx + W / 2, ry + H / 2 + 10 * dpr);
      }
      g.restore();
    }

    function cuadro(ts) {
      if (!vivo) { return; }
      raf = raiz.requestAnimationFrame(cuadro);
      if (lienzo.offsetParent === null || raiz.document.hidden) { ultimo = null; return; }
      var w = Math.max(240, lienzo.clientWidth), h = Math.round(Math.min(480, Math.max(280, w * 0.72)));
      if (lienzo.width !== Math.round(w * dpr)) { lienzo.width = Math.round(w * dpr); }
      if (lienzo.height !== Math.round(h * dpr)) { lienzo.height = Math.round(h * dpr); lienzo.style.height = h + 'px'; }
      var W = lienzo.width, H = lienzo.height;
      med.cuadro(ts);
      if (q) {
        var claves = [0, 3000, Math.round(k.fin / 2), k.total];
        claves.forEach(function (tc, i) { dibuja(tc, (i % 2) * W / 2, Math.floor(i / 2) * H / 2, W / 2, H / 2, 0); });
        if (!acabo) { acabo = true; R.claves.open = true; R.narra.textContent = momento(k.momentos[k.momentos.length - 1]); if (op.alFin) { op.alFin(combate); } }
        raiz.cancelAnimationFrame(raf); return;
      }
      var dt = ultimo === null ? 0 : Math.min(100, ts - ultimo); ultimo = ts;
      if (juega) { t = Math.min(k.total, t + dt * vel); if (t >= k.total) { juega = false; rotulos(); } }
      R.tiempo.value = String(Math.round(t));
      R.tiempo.setAttribute('aria-valuetext', Math.floor(t / 60000) + ':' + ('0' + Math.floor(t / 1000) % 60).slice(-2));
      while (dicho < k.momentos.length && k.momentos[dicho].t <= t) { R.narra.textContent = momento(k.momentos[dicho]); dicho++; }
      if (dicho && k.momentos[dicho - 1].t > t) { dicho = 0; }
      dibuja(t, 0, 0, W, H, med.nivel(k.max.length > 8 ? 1 : 2) ? 1 : 0);
      if (!acabo && t >= k.fin + 600) {
        acabo = true;
        if (op.sonido) { op.sonido(combate.gana === 'asalto' ? 'gana' : 'pierde'); }
        if (op.alFin) { op.alFin(combate); }
      }
    }
    arma(); rotulos();
    raf = raiz.requestAnimationFrame(cuadro);
    function quita() { [caja, R.narra, R.claves].forEach(function (n) { n.remove(); }); }
    return {
      velocidad: function (v) { vel = v; rotulos(); },
      salta: function () { t = k.total; juega = false; rotulos(); },
      otra: function () { t = 0; acabo = false; juega = !q; dicho = 0; rotulos(); },
      para: function () { vivo = false; raiz.cancelAnimationFrame(raf); quita(); },
      estado: function () { return { t: t, total: k.total, hash: k.hash, formacion: forma, fps: med.fps() }; }
    };
  }

  raiz.AtlasReplay = { escena: escena };
})(this);
