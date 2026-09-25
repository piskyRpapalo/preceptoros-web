/* preceptoros.org · ATLAS · el mapa vivo del Bosque Sumergido.

   TRES LIENZOS, TRES RITMOS. El FONDO (agua, ruinas, kelp, coral y la rejilla
   de sectores) se pinta una vez por tamano. La ESCENA (luz que baja,
   plancton, estructuras que laten, buzos que van y vienen) se repinta por
   fotograma. La NIEBLA, otra vez una sola vez. Asi el coste por fotograma es
   lo que se mueve y nada mas.

   LA ANIMACION SE DUERME SOLA. Solo corre mientras el mapa esta a la vista
   (IntersectionObserver) y la pestana abierta; con `prefers-reduced-motion`
   se pinta un unico fotograma quieto. No hay tick global ni temporizador que
   siga vivo con el piso cerrado.

   El arte lo pone `atlas-arte.js`; aqui solo se decide DONDE y CUANDO. */
(function () {
  'use strict';

  var ANCHA = { cols: 11, filas: 7, sectores: {
    nucleo: [5, 3], forja: [2, 2], aguja: [8, 1], ojo: [8, 5], grieta: [3, 5] } };
  var ESTRECHA = { cols: 7, filas: 7, sectores: {
    nucleo: [3, 3], forja: [1, 1], aguja: [4, 1], ojo: [4, 5], grieta: [1, 5] } };
  /* Las rutas de los buzos: de sector a sector, ida y vuelta. */
  var RUTAS = [['nucleo', 'forja'], ['aguja', 'ojo'], ['nucleo', 'grieta']];

  function centro(c, f, r) {
    var w = Math.sqrt(3) * r;
    return { x: w * (c + 0.5 + (f % 2) * 0.5), y: r * (1 + f * 1.5) };
  }
  function hexagono(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 180 * (60 * i - 30);
      ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
  }
  function lienzo(padre) {
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    padre.appendChild(cv);
    return cv;
  }

  function monta(caja) {
    var A = window.AtlasArte;
    if (!A) { return; }
    var cvFondo = lienzo(caja), cvEscena = lienzo(caja), cvNiebla = lienzo(caja);
    /* Los botones de sector van ENCIMA de los lienzos. */
    Array.prototype.forEach.call(caja.querySelectorAll('[data-sector]'), function (b) {
      caja.appendChild(b);
    });
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var geo = null, visible = true, pedido = 0, ultimo = 0;

    function prepara() {
      var ancho = caja.clientWidth;
      if (!ancho || (geo && geo.ancho === ancho)) { return false; }
      var R = ancho < 480 ? ESTRECHA : ANCHA;
      var r = ancho / (Math.sqrt(3) * (R.cols + 0.5));
      var alto = Math.ceil(r * (1.5 * R.filas + 0.5));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      geo = { ancho: ancho, alto: alto, r: r, dpr: dpr, R: R, pos: {} };
      Object.keys(R.sectores).forEach(function (k) {
        geo.pos[k] = centro(R.sectores[k][0], R.sectores[k][1], r);
      });
      /* La escena se mueve: va a 1x, que a 30 fotogramas no se distingue y
         cuesta la cuarta parte en una pantalla de 2x. Lo quieto, a su dpr. */
      [cvFondo, cvEscena, cvNiebla].forEach(function (cv) {
        var d = cv === cvEscena ? 1 : dpr;
        cv.width = Math.round(ancho * d); cv.height = Math.round(alto * d);
        cv.style.height = alto + 'px';
      });
      caja.style.height = alto + 'px';

      /* Fondo: el bosque y, encima, la rejilla de sectores como cristal. */
      var f = cvFondo.getContext('2d');
      f.setTransform(dpr, 0, 0, dpr, 0, 0);
      A.fondoEstatico(f, ancho, alto);
      for (var fi = 0; fi < R.filas; fi++) {
        for (var c = 0; c < R.cols; c++) {
          var p = centro(c, fi, r);
          hexagono(f, p.x, p.y, r * 0.95);
          f.strokeStyle = A.alfa(A.P.vidrio, 0.12); f.lineWidth = 1; f.stroke();
        }
      }
      Object.keys(geo.pos).forEach(function (k) {
        var q = geo.pos[k];
        hexagono(f, q.x, q.y, r * 0.95);
        f.fillStyle = A.alfa(k === 'grieta' ? A.P.alerta : A.P.cobre, 0.12); f.fill();
        f.strokeStyle = A.alfa(k === 'nucleo' ? A.P.violetaLuz : A.P.cobreLuz, 0.7);
        f.lineWidth = 1.5; f.stroke();
      });

      /* Niebla: lo no explorado, con huecos alrededor de lo conocido. */
      var n = cvNiebla.getContext('2d');
      n.setTransform(dpr, 0, 0, dpr, 0, 0);
      n.clearRect(0, 0, ancho, alto);
      n.fillStyle = A.alfa(A.P.fondo, 0.78); n.fillRect(0, 0, ancho, alto);
      n.globalCompositeOperation = 'destination-out';
      Object.keys(geo.pos).forEach(function (k) {
        var q = geo.pos[k];
        var g = n.createRadialGradient(q.x, q.y, r * 0.8, q.x, q.y, r * 3);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        n.fillStyle = g; n.fillRect(q.x - r * 3, q.y - r * 3, r * 6, r * 6);
      });
      n.globalCompositeOperation = 'source-over';

      Array.prototype.forEach.call(caja.querySelectorAll('[data-sector]'), function (b) {
        var q = geo.pos[b.dataset.sector];
        if (!q) { return; }
        b.style.left = (q.x / ancho * 100) + '%';
        b.style.top = (q.y + r * 0.9) + 'px';
      });
      return true;
    }

    function escena(t) {
      if (!geo) { return; }
      var e = cvEscena.getContext('2d'), g = geo;
      e.setTransform(1, 0, 0, 1, 0, 0);
      e.clearRect(0, 0, g.ancho, g.alto);
      A.rayos(e, g.ancho, g.alto, t);
      A.plancton(e, g.ancho, g.alto, t);
      Object.keys(g.pos).forEach(function (k) {
        A.estructura(e, k, g.pos[k].x, g.pos[k].y, g.r * 1.7, t);
      });
      RUTAS.forEach(function (ruta, i) {
        var a = g.pos[ruta[0]], b = g.pos[ruta[1]];
        if (!a || !b) { return; }
        var ciclo = ((t * 0.00005 + i * 0.33) % 2), u = ciclo < 1 ? ciclo : 2 - ciclo;
        var s = (1 - Math.cos(u * Math.PI)) / 2;
        var x = a.x + (b.x - a.x) * s, y = a.y + (b.y - a.y) * s - Math.sin(s * Math.PI) * g.r * 1.2;
        A.buzo(e, x, y, g.r * 0.55, t, (ciclo < 1 ? b.x - a.x : a.x - b.x) >= 0 ? 1 : -1);
      });
    }

    /* Unos 30 fotogramas por segundo: la luz y el plancton no piden mas, y
       el movil lo agradece. */
    function bucle(t) {
      pedido = 0;
      if (t - ultimo >= 32) { ultimo = t; escena(t); }
      if (!quieto && visible && !document.hidden) { pedido = requestAnimationFrame(bucle); }
    }
    function arranca() {
      if (!pedido && !quieto && visible && !document.hidden) { pedido = requestAnimationFrame(bucle); }
    }

    prepara();
    escena(performance.now());
    arranca();
    window.addEventListener('resize', function () {
      if (prepara()) { escena(performance.now()); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) { arranca(); }
      }).observe(caja);
    }
    document.addEventListener('visibilitychange', arranca);
  }

  window.AtlasMapa = { monta: monta };
})();
