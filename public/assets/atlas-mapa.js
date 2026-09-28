/* preceptoros.org · ATLAS · el mapa: el MUNDO ABIERTO del Bosque Sumergido, en un lienzo.

   QUE SE VE. Un corte del fondo que da la vuelta sin bordes: se arrastra de lado (el dedo en
   vertical sigue moviendo la pagina). Arriba la luz, abajo la fosa del Nucleo; los cinco
   sectores sobre el fondo; TU NODO anclado donde dice tu clave; y encima de tu base, las ONDAS
   de tus tropas trenzadas en helices, con chispas donde se cruzan. Del nodo al Nucleo corre el
   flujo que farmea tu partida. La niebla tapa lo que tu partida aun no ha visto.

   QUE NO SE DECIDE AQUI. Donde esta cada cosa, que tapa la niebla y como es cada onda lo dice
   `atlas-carta.js`, que es puro. Esta pieza solo pinta: se puede rehacer entera sin tocar un
   dato. El movimiento es tiempo de pantalla; la FORMA de cada onda sale de su semilla.

   LA ANIMACION SE DUERME SOLA. Solo corre con el mapa a la vista y la pestana abierta; con
   `prefers-reduced-motion`, un fotograma quieto que se repinta al cambiar el estado. */
(function () {
  'use strict';

  var C = window.AtlasCarta;
  /* Los buzos van y vienen entre sectores. */
  var RUTAS = [['nucleo', 'forja'], ['aguja', 'ojo'], ['nucleo', 'grieta']];
  function frac(x) { return x - Math.floor(x); }

  var ultima = null, vivo = null;
  function monta(caja) {
    ultima = caja;
    var A = window.AtlasArte;
    if (!A || !C) { return null; }
    var P = A.P, al = A.alfa;
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    caja.insertBefore(cv, caja.firstChild);
    caja.style.touchAction = 'pan-y'; caja.style.cursor = 'grab';
    var ter = document.createElement('canvas'), nie = document.createElement('canvas');
    nie.width = C.COLS; nie.height = C.FILAS;
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* `sup` es el modo Superficie: SOLO de esta pestana, en memoria; no se recuerda (sello). */
    var S = { ins: null, nd: null, voces: [], sector: null, fase: 1, sup: 0, k: 0, vis: {}, toques: [], nt: 0 };
    var g = null, cam = S.nd ? S.nd.x : C.SECTORES.nucleo, meta = null, inercia = 0;
    var visible = true, pedido = 0, ultimo = 0;

    /* La etiqueta de tu nodo: su id, que no es de ninguna lengua. */
    var etq = document.createElement('button');
    etq.type = 'button'; etq.className = 'atlas-sector atlas-nodo'; etq.textContent = '◈ NO_DATA';
    etq.addEventListener('click', function () { if (S.nd) { meta = S.nd.x; arranca(); } });
    caja.appendChild(etq);
    Array.prototype.forEach.call(caja.querySelectorAll('[data-sector]'), function (b) {
      caja.appendChild(b);
      b.addEventListener('focus', function () { meta = C.SECTORES[b.dataset.sector]; arranca(); });
    });
    /* Lo que lee un agente: el mundo, tu nodo y tu niebla, en JSON cerrado (`atlas.carta/1`). */
    var det = document.createElement('details'), pre = document.createElement('pre');
    det.className = 'atlas-carta-json';
    var sum = document.createElement('summary'); sum.textContent = 'atlas.carta/1';
    det.appendChild(sum); det.appendChild(pre);
    caja.parentNode.insertBefore(det, caja.nextSibling);

    function prepara() {
      var ancho = caja.clientWidth;
      if (!ancho || (g && g.ancho === ancho)) { return false; }
      var alto = Math.max(260, Math.min(440, Math.round(ancho * 0.62)));
      var s = alto / C.HONDO, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      g = { ancho: ancho, alto: alto, s: s, sh: s, W: C.ANCHO * s, dpr: dpr };
      cv.width = Math.round(ancho * dpr); cv.height = Math.round(alto * dpr);
      cv.style.height = alto + 'px'; caja.style.height = alto + 'px';
      terreno();
      return true;
    }

    /* EL FONDO, una vez por tamano: agua por bandas, lecho con vetas y un borde que respira. */
    function terreno() {
      var s = g.s, W = g.W, H = g.alto;
      ter.width = Math.round(W * g.dpr); ter.height = Math.round(H * g.dpr);
      var t = ter.getContext('2d');
      t.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      var ag = t.createLinearGradient(0, 0, 0, H);
      [[0, P.superficie], [0.12, P.agua], [0.45, P.hondo], [0.8, P.abismo], [1, P.fondo]]
        .forEach(function (p) { ag.addColorStop(p[0], p[1]); });
      t.fillStyle = ag; t.fillRect(0, 0, W, H);
      /* Las bandas del motor, como linea de agua: se ven sin rotulos. */
      t.setLineDash([2, 6]); t.lineWidth = 1;
      C.BANDAS.slice(1).forEach(function (b) {
        t.strokeStyle = al(P.vidrio, 0.1);
        t.beginPath(); t.moveTo(0, b[1] * s); t.lineTo(W, b[1] * s); t.stroke();
      });
      t.setLineDash([]);
      function lecho(dy) {
        t.beginPath(); t.moveTo(0, H);
        for (var x = 0; x <= C.ANCHO; x += 0.5) { t.lineTo(x * s, (C.suelo(x) + dy) * s); }
        t.lineTo(W, H); t.closePath();
      }
      var lg = t.createLinearGradient(0, 10 * s, 0, H);
      lg.addColorStop(0, P.piedraLuz); lg.addColorStop(0.5, P.piedra); lg.addColorStop(1, P.fondo);
      lecho(0); t.fillStyle = lg; t.fill();
      for (var k = 1; k <= 4; k++) {
        lecho(k * 3.2); t.strokeStyle = al(k % 2 ? P.cobre : P.violetaLuz, 0.22 - k * 0.04); t.stroke();
      }
      t.save(); t.shadowColor = P.kelpLuz; t.shadowBlur = 8;
      t.beginPath();
      for (var x = 0; x <= C.ANCHO; x += 0.5) { t.lineTo(x * s, C.suelo(x) * s); }
      t.strokeStyle = al(P.kelpLuz, 0.45); t.lineWidth = 1.2; t.stroke(); t.restore();
      /* Coral y ruinas: puntos del mismo azar sin azar que el relieve. */
      for (var c = 0; c < C.ANCHO; c += 1) {
        var h = C.h32(71, c), y = C.suelo(c) * s;
        if (h > 0.9) { t.fillStyle = al(P.coral, 0.55); t.beginPath(); t.arc(c * s, y - s * 0.6, s * (0.5 + h), 0, 7); t.fill(); }
        else if (h < 0.05) { t.fillStyle = al(P.piedraLuz, 0.9); t.fillRect(c * s - s * 0.5, y - s * 3, s, s * 3); }
      }
    }

    /* LA NIEBLA, cuando cambia el estado: 64 x 25 celdas que el lienzo suaviza al escalarlas. */
    function nubla() {
      var m = C.niebla(S.ins || { fase: S.fase }, S.nd), x = nie.getContext('2d');
      var ex = C.exploracion(Object.keys(S.vis), S.nd);
      var img = x.createImageData(C.COLS, C.FILAS), n = parseInt(P.fondo.slice(1), 16);
      for (var i = 0; i < m.length; i++) {
        img.data[i * 4] = n >> 16; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255;
        img.data[i * 4 + 3] = [236, 150, 0][Math.max(m[i], ex[i] ? 1 : 0)];
      }
      x.putImageData(img, 0, 0);
    }

    /* x de mundo a x de pantalla, por la copia mas cercana a la camara. */
    function sx(x) { return g.ancho / 2 + C.dx(cam, x) * g.sh; }
    function envuelto(ctx, img, dy, alfa) {
      var W = C.ANCHO * g.sh, o = frac((g.ancho / 2 - cam * g.sh) / W) * W - W;
      ctx.globalAlpha = alfa;
      for (; o < g.ancho; o += W) { ctx.drawImage(img, o, dy, W, g.alto); }
      ctx.globalAlpha = 1;
    }
    function visibleX(x, m) { var p = sx(x); return p > -m && p < g.ancho + m; }

    function kelp(e, t) {
      var s = g.s, izq = cam - g.ancho / 2 / g.sh - 4, der = cam + g.ancho / 2 / g.sh + 4;
      e.lineCap = 'round';
      for (var x = Math.floor(izq / 3) * 3; x < der; x += 3) {
        var k = C.vuelta(x), h = C.h32(11, k);
        if (h < 0.45) { continue; }
        var px = sx(k), y0 = C.suelo(k) * s, alto = (6 + h * 14) * s;
        var sw = Math.sin(t * 0.0011 + k * 0.7) * 2.2 * s;
        e.strokeStyle = al(h > 0.8 ? P.kelpLuz : P.kelp, 0.55); e.lineWidth = s * 0.45;
        e.beginPath(); e.moveTo(px, y0);
        e.quadraticCurveTo(px + sw * 0.3, y0 - alto * 0.5, px + sw, y0 - alto); e.stroke();
      }
    }

    function fotograma(t) {
      if (!g) { return; }
      var e = cv.getContext('2d'), s = g.s;
      if (meta !== null) {
        var d = C.dx(cam, meta);
        cam = C.vuelta(cam + (quieto ? d : d * 0.12));
        if (Math.abs(d) < 0.05) { meta = null; }
      } else if (Math.abs(inercia) > 0.01) { cam = C.vuelta(cam + inercia); inercia *= 0.9; }
      S.k += quieto ? S.sup - S.k : (S.sup - S.k) * 0.1;
      g.sh = g.s + (g.ancho / C.ANCHO - g.s) * S.k;
      var t0 = t; S.toques = S.toques.filter(function (q) { return t0 - q.t < 2600; });
      e.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      envuelto(e, ter, 0, 1);
      e.save(); e.beginPath(); e.moveTo(0, 0);
      for (var q = 0; q <= g.ancho; q += 6) { e.lineTo(q, C.suelo(cam + (q - g.ancho / 2) / g.sh) * s); }
      e.lineTo(g.ancho, 0); e.closePath(); e.clip();
      A.rayos(e, g.ancho, g.alto, t);
      e.restore();
      kelp(e, t);
      var O = window.AtlasOndas, V = { s: s, sx: sx, nd: S.nd, voces: S.voces, ins: S.ins, A: A,
        visible: visibleX, toques: S.toques, k: S.k };
      if (O) { O.flujo(e, t, V); }
      Object.keys(C.SECTORES).forEach(function (k) {
        var x = C.SECTORES[k];
        var ob = window.AtlasObra, tam = s * 9 * (1 - 0.45 * S.k);
        if (visibleX(x, 20 * s)) { (ob ? ob.pinta : A.estructura)(e, k, sx(x), (C.suelo(x) - 4) * s, tam, t, S.ins); }
      });
      /* Un buzo por tropa tuya: sin tropas, nadie bucea (no se anima lo que el juego no conoce). */
      for (var i = 0; i < Math.min(S.nt, 6); i++) {
        var r = RUTAS[i % 3];
        var a = C.SECTORES[r[0]], b = C.SECTORES[r[1]], c = frac(t * 0.00004 + i * 0.17) * 2;
        var u = c < 1 ? c : 2 - c, q = (1 - Math.cos(u * Math.PI)) / 2, x = a + C.dx(a, b) * q;
        if (!visibleX(x, 10 * s)) { continue; }
        A.buzo(e, sx(x), (C.suelo(x) - 6 - Math.sin(q * Math.PI) * 10) * s, s * 3, t,
               (c < 1) === (C.dx(a, b) > 0) ? 1 : -1);
      }
      if (O) { O.base(e, t, V); if (O.toques) { O.toques(e, t, V); } }
      A.plancton(e, g.ancho, g.alto, t);
      /* La niebla respira: dos pasadas que derivan despacio, y lo nunca visto sigue tapado. */
      var dr = quieto ? 0 : Math.sin(t * 0.0003) * s * 1.5;
      e.imageSmoothingEnabled = true;
      if (S.k < 0.99) { envuelto(e, nie, dr, 0.55 * (1 - S.k)); envuelto(e, nie, -dr, 0.55 * (1 - S.k)); }
      if (S.sector && visibleX(C.SECTORES[S.sector], 20 * s)) {
        var x0 = sx(C.SECTORES[S.sector]), y0 = (C.suelo(C.SECTORES[S.sector]) - 4) * s;
        var pl = quieto ? 0.5 : frac(t * 0.0006);
        e.strokeStyle = al(S.sector === 'grieta' ? P.alerta : P.vidrio, 0.7 * (1 - pl));
        e.lineWidth = 1.5; e.beginPath(); e.arc(x0, y0, s * (6 + pl * 8), 0, 7); e.stroke();
      }
      coloca();
    }

    function coloca() {
      var s = g.s;
      Array.prototype.forEach.call(caja.querySelectorAll('[data-sector]'), function (b) {
        var x = C.SECTORES[b.dataset.sector];
        if (x === undefined) { return; }
        b.style.left = sx(x) + 'px';
        b.style.top = Math.min(g.alto - 12, (C.suelo(x) + 3.5) * s) + 'px';
      });
      etq.hidden = !S.nd && !S.sinClave;
      if (S.nd) {
        etq.style.left = sx(S.nd.x) + 'px';
        etq.style.top = Math.min(g.alto - 12, (S.nd.y + 3.5) * s) + 'px';
      } else { etq.style.left = '50%'; etq.style.top = '1.2rem'; }
    }

    function bucle(t) {
      pedido = 0;
      if (t - ultimo >= 32) { ultimo = t; fotograma(t); }
      if (!quieto && visible && !document.hidden) { pedido = requestAnimationFrame(bucle); }
    }
    function arranca() {
      if (quieto) { fotograma(0); return; }
      if (!pedido && visible && !document.hidden) { pedido = requestAnimationFrame(bucle); }
    }

    /* El gesto (arrastre, toque, teclado, fichas, Superficie) vive en `atlas-gesto.js`. */

    /* Tu nodo sale de tu clave publica; sin identidad, NO_DATA y el mundo sigue siendo el mismo. */
    function clave() {
      var I = window.Identity;
      if (!I || !I.publica || !(I.quien && I.quien())) { S.sinClave = true; return; }
      I.publica().then(function (pub) {
        S.nd = C.nodo(pub); S.sinClave = !S.nd;
        if (S.nd) { etq.textContent = '◈ ' + C.coord(S.nd.pub, 'base', S.nd.x, S.nd.y).corta; meta = S.nd.x; }
        estado(S.ins);
      }).catch(function () { S.sinClave = true; });
    }
    function tropas() {
      var inc = window.AtlasIncubadora, l = null;
      try { l = inc && inc.army ? inc.army() : null; } catch (x) { l = null; }
      return Array.isArray(l) ? l : null;
    }
    function estado(ins) {
      if (ins) { S.ins = ins; S.fase = ins.fase || S.fase; S.vis[C.visita(ins)] = 1; }
      var tr = tropas();
      S.voces = C.helices(S.nd, tr); S.nt = tr ? tr.length : 0;
      nubla();
      pre.textContent = JSON.stringify(C.estado(S.ins, S.nd, tr, Object.keys(S.vis)), null, 1);
      if (ins && window.AtlasHud) { window.AtlasHud.estado(ins); }
      if (quieto && g) { fotograma(0); }
    }

    prepara();
    clave();
    estado(null);
    arranca();
    document.addEventListener('preceptor:identity', clave);
    /* Una tropa nueva entra en tu base al eclosionar, no a los 5 ciclos (`ui.js` avisa). */
    document.addEventListener('atlas:tropa', function () { estado(null); });
    /* Se mide la CAJA, no la ventana: el dialogo termina de maquetarse despues de montar el mapa
       y la caja cambia de ancho sin que la ventana lo haga (Doogee, 2026-09-28: lienzo pensado
       para 297 px y estirado a 499, rotulos a 1,68x de su edificio). */
    if ('ResizeObserver' in window) { new ResizeObserver(function () { if (prepara()) { arranca(); } }).observe(caja); }
    else { window.addEventListener('resize', function () { if (prepara()) { arranca(); } }); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) { arranca(); }
      }).observe(caja);
    }
    document.addEventListener('visibilitychange', arranca);
    vivo = {
      fase: function (f) { if (f !== S.fase) { S.fase = f; estado(null); } },
      estado: estado,
      sector: function (k) { S.sector = k; if (quieto && g) { fotograma(0); } },
      carta: function () {
        /* Lo que lee un agente es la partida de AHORA, no la ultima que llego al mapa. */
        var J = window.AtlasJuego, i = J && J.instantanea && J.instantanea();
        if (i) { estado(i); }
        return C.estado(S.ins, S.nd, tropas(), Object.keys(S.vis));
      },
      /* Lo que usa `atlas-gesto.js`: la camara, el toque, la Superficie y el dato de cada sitio. */
      g: function () { return g; }, cam: function () { return cam; },
      mira: function (x) { meta = x; arranca(); },
      arrastra: function (c, v) { cam = C.vuelta(c); inercia = v; meta = null; if (quieto) { fotograma(0); } else { arranca(); } },
      toca: function (px, py) {
        if (!g) { return; }
        S.toques.push({ x: C.vuelta(cam + (px - g.ancho / 2) / g.sh), y: py / g.s, t: performance.now() });
        arranca();
      },
      superficie: function (on) { S.sup = on ? 1 : 0; det.open = !!on; arranca(); return !!on; },
      edificios: function () { return C.estructuras(S.ins, S.nd); },
      nodo: function () { return S.nd; }, ins: function () { return S.ins; }, caja: caja, etq: etq,
      /* Las visitas de una partida retomada: la niebla vuelve a ser la que esa partida vio. */
      visitas: function (l) { S.vis = {}; (l || []).forEach(function (v) { S.vis[v] = 1; }); estado(null); }
    };
    if (window.AtlasGesto) { window.AtlasGesto.monta(vivo); }
    return vivo;
  }

  /* ESTAS AQUI: la linea y el `aria-current` los escribe `atlas-gesto.js` (se movio alli el
     2026-09-28, al pasar este fichero de 16 KiB: es texto y accesibilidad, oficio del gesto). El
     mapa solo pinta el anillo del sector. */
  function aqui(texto, sector) {
    if (window.AtlasGesto && ultima) { window.AtlasGesto.aqui(ultima, texto, sector); }
    if (vivo) { vivo.sector(sector); }
  }
  /* La instantanea real llega por aqui (la voz del Preceptor la reparte cada pocos ciclos). */
  function estado(ins) { if (vivo) { vivo.estado(ins); } }
  function carta() { return vivo ? vivo.carta() : null; }
  function visitas(l) { if (vivo) { vivo.visitas(l); } }
  window.AtlasMapa = { monta: monta, aqui: aqui, estado: estado, carta: carta, visitas: visitas };
})();
