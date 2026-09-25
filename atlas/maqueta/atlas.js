/* ATLAS · Panel del Atlante · maqueta (FASE 0, PASO 1).

   PINTA Y REGISTRA, NADA MAS. No hay motor, ni servidor, ni una sola peticion
   de red: los botones escriben en la consola (`[ATLAS stub]`) y el mapa es una
   rejilla hexagonal con niebla.

   EL RENDER ES EL QUE PIDE LA ARQUITECTURA. El mapa se dibuja UNA vez en un
   OffscreenCanvas y se copia con un solo `drawImage`; no hay bucle por
   fotograma ni tick global. Solo se repinta si cambia el ancho de la ventana.
   La niebla es otro lienzo encima, con huecos donde ya se ha explorado.

   LOS COLORES SE LEEN DE `soberano.css` con getComputedStyle: el lienzo no
   tiene paleta propia. */
(function () {
  'use strict';

  /* DOS REJILLAS, la misma geografia. Once columnas en 375 px dejaban
     hexagonos de 10 px con las etiquetas tapandolos: medido en el iPhone SE.
     En estrecho la rejilla baja a siete y los sectores se recolocan en ella.
     (columna, fila); la grieta esta en las ruinas exteriores, a 120 m. */
  var ANCHA = { cols: 11, filas: 7, sectores: {
    nucleo: [5, 3], forja: [2, 2], aguja: [8, 1], ojo: [8, 5], grieta: [3, 5] } };
  var ESTRECHA = { cols: 7, filas: 7, sectores: {
    nucleo: [3, 3], forja: [1, 1], aguja: [4, 1], ojo: [4, 5], grieta: [1, 5] } };
  var COLS, FILAS, SECTORES;

  var mapa = document.getElementById('atlas-mapa');
  var niebla = document.getElementById('atlas-niebla');
  if (!mapa || !niebla) { return; }
  var lienzo = mapa.parentElement;

  function token(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  }
  /* Hexagonos con la punta arriba y filas desplazadas. */
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
  /* Ruido determinista por celda: la misma rejilla en cada carga, sin
     texturas ni ficheros. */
  function ruido(c, f) {
    var h = Math.sin(c * 12.9898 + f * 78.233) * 43758.5453;
    return h - Math.floor(h);
  }
  function esSector(c, f) {
    for (var k in SECTORES) {
      if (SECTORES[k][0] === c && SECTORES[k][1] === f) { return k; }
    }
    return null;
  }

  function dibujaMapa(ctx, r, dpr) {
    var fondo = token('--bg-secondary'), violeta = token('--accent-violet'),
        cobre = token('--accent-copper'), filo = token('--edge-sov');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var f = 0; f < FILAS; f++) {
      for (var c = 0; c < COLS; c++) {
        var p = centro(c, f, r), s = esSector(c, f);
        hexagono(ctx, p.x, p.y, r * 0.94);
        ctx.globalAlpha = 1; ctx.fillStyle = fondo; ctx.fill();
        ctx.globalAlpha = s ? 0.4 : 0.07 + ruido(c, f) * 0.2;
        ctx.fillStyle = s ? (s === 'nucleo' ? violeta : cobre) : violeta;
        ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = s ? cobre : filo;
        ctx.lineWidth = s ? 1.5 : 1; ctx.stroke();
      }
    }
  }

  function dibujaNiebla(ctx, ancho, alto, r, dpr) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.86; ctx.fillStyle = token('--bg-primary');
    ctx.fillRect(0, 0, ancho, alto);
    /* Los huecos: lo explorado alrededor de cada sector conocido. */
    ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 1;
    for (var k in SECTORES) {
      var p = centro(SECTORES[k][0], SECTORES[k][1], r);
      var g = ctx.createRadialGradient(p.x, p.y, r * 0.6, p.x, p.y, r * 2.6);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(p.x - r * 2.6, p.y - r * 2.6, r * 5.2, r * 5.2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  var anchoPintado = 0;
  function pinta() {
    var ancho = lienzo.clientWidth;
    if (!ancho || ancho === anchoPintado) { return; }
    anchoPintado = ancho;
    var rejilla = ancho < 480 ? ESTRECHA : ANCHA;
    COLS = rejilla.cols; FILAS = rejilla.filas; SECTORES = rejilla.sectores;
    var r = ancho / (Math.sqrt(3) * (COLS + 0.5));
    var alto = Math.ceil(r * (1.5 * FILAS + 0.5));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    [mapa, niebla].forEach(function (cv) {
      cv.width = Math.round(ancho * dpr); cv.height = Math.round(alto * dpr);
      cv.style.height = alto + 'px';
    });
    lienzo.style.height = alto + 'px';

    /* Pre-render: se dibuja fuera de pantalla y se copia una vez. */
    var ctx = mapa.getContext('2d');
    if (typeof OffscreenCanvas !== 'undefined') {
      var off = new OffscreenCanvas(mapa.width, mapa.height);
      dibujaMapa(off.getContext('2d'), r, dpr);
      ctx.drawImage(off, 0, 0);
    } else {
      dibujaMapa(ctx, r, dpr);
    }
    dibujaNiebla(niebla.getContext('2d'), ancho, alto, r, dpr);

    /* Las etiquetas DOM se colocan sobre su hexagono. */
    Array.prototype.forEach.call(lienzo.querySelectorAll('[data-sector]'), function (b) {
      var s = SECTORES[b.dataset.sector];
      if (!s) { return; }
      var p = centro(s[0], s[1], r);
      b.style.left = (p.x / ancho * 100) + '%';
      b.style.top = p.y + 'px';
    });
  }

  var pendiente = false;
  window.addEventListener('resize', function () {
    if (pendiente) { return; }
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; pinta(); });
  });
  pinta();

  /* --- stubs: la maqueta solo avisa de lo que haria ---------------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-stub]');
    if (b) { console.log('[ATLAS stub]', b.dataset.stub, b.dataset.sector || ''); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.name === 'profundidad') {
      console.log('[ATLAS stub] profundidad', e.target.value);
    }
  });
})();
