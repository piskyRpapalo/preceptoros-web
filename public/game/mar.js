/* preceptoros.org · theGame · el MAPA GLOBAL: un mundo que se arrastra hasta chocar con la niebla.

   «El mapa principal debe ser LA CASA del usuario. El mapa global tiene que ser MOVIBLE: que el user
   pueda moverse hasta chocarse con la niebla» (Soberano, 2026-10-05).
   - Al abrir, la camara se centra en TU CASA (su sitio sale de tu clave publica). Sin clave, en
     Hexelion, y se dice por que.
   - Se mueve con el dedo, el raton, las flechas y botones grandes (accion `mover`, R2c); inercia en
     `world_camera.js`; con movimiento reducido, salta.
   - LA NIEBLA ES EL LIMITE (`fog_of_war.js`): lo despejado sale de lo MEDIDO y de lo ya jugado; la
     camara no entra en lo demas: rebota y lo dice en texto.
   - El terreno: teselas de ruido entero con tramado Atkinson (`mar-fondo.js`). Cero imagenes ni red.
   EL ORIGEN SE VE: Hexelion MEDIDO, nitido; un nodo sin medidas, en niebla y con su anillo NO_DATA.
   PINTA; NO DECIDE: lugares, seleccion y textos los da `ui-arena.js`; el mando es la lista de botones. */
(function () {
  'use strict';

  var E = window.AtlasEscena, K = window.AtlasCanon, N = window.AtlasNiebla, C = window.AtlasCamara;
  var F = (window.AtlasValores && window.AtlasValores.fluidez) || {}, O = window.AtlasOnda || {};
  /* Las teselas (terreno y niebla) las pinta `mar-fondo.js`: una sola fuente para el mapa y la portada. */
  var MF = window.AtlasMarFondo, VE = 620, PASO = 90, VIVO = null;
  /* LAS FLECHAS SON ACCIONES DEL PILOTO (R2c): `mover <dir>` del enum `atlas.accion/1`, una lista, no dos.
     Aqui solo su vector y su icono; la lista de direcciones es la del piloto (`AtlasPiloto.DIRS`). */
  var VEC = { izq: [-1, 0], arr: [0, -1], aba: [0, 1], der: [1, 0], casa: [0, 0], faro: [0, 0] }, ICO = { izq: '◀', arr: '▲', aba: '▼', der: '▶', casa: '⌂', faro: '◈' };
  function dirs() { return (window.AtlasPiloto && window.AtlasPiloto.DIRS) || ['izq', 'arr', 'aba', 'der', 'casa']; }
  /* La flecha de la persona entra por la MISMA puerta que la de la IA: `AtlasJuego.aplica`. */
  function flecha(dir) {
    var a = { esquema: 'atlas.accion/1', accion: 'mover', dir: dir, origen: 'humano' }, J = window.AtlasJuego;
    return J && J.aplica ? J.aplica(a) : mueve(dir);
  }
  /* Lo que ejecuta `aplica` para `mover`: un salto de la camara del mapa vivo; si choca, `fallo`. */
  function mueve(dir) {
    if (!VIVO || !VEC[dir]) { return null; }
    return { tipo: 'mover', dir: dir, resultado: VIVO.mueveDir(dir) ? 'fallo' : 'ok' };
  }
  var ANILLO = N.ANILLO;

  /* npc_chunk es de clase CALIDAD (valores.semantica): solo cuando la calidad elegida baja de Maxima. */
  function baja() { var q = window.AtlasCalidad; return !!q && (q.modo === 'media' || q.modo === 'luz'); }
  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = texto; } return n; }


  /* `f`: { lugares(), sel(), emblema(), pub(), nombre(l), texto(k), colores(), elige(l), luchados() }. */
  function crea(c, f) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), raf = 0, col = null, H0 = window.AtlasMapNodes.casas(), circ = [];
    var TS = MF.pintor(), cam = null, arrastre = null, ultimo = null, avisado = 0, centro = null;
    var Ce = window.AtlasNodosCedulas, cuadros = 0, movido = false, mapaOcupacion = window.AtlasNpcTerritoryMap.crea();

    /* --- los mandos: flechas grandes, volver a casa y el aviso ------------------------------------ */
    var mandos = el('div', 'mapa-mandos'), aviso = el('p', 'mapa-aviso');
    aviso.setAttribute('role', 'status');
    dirs().forEach(function (d) {
      var x = el('button', 'boton-sec mapa-mando', ICO[d]); x.type = 'button'; x.setAttribute('aria-label', f.texto('mapa_' + d));
      x.addEventListener('click', function () { flecha(d); });
      mandos.appendChild(x);
    });
    c.parentNode.insertBefore(mandos, c.nextSibling); c.parentNode.insertBefore(aviso, mandos.nextSibling);
    c.tabIndex = 0;
    var zoom = window.AtlasMapZoom.crea(c);   /* zoom del mapa (pellizco y rueda): map_zoom.js */

    function despeja() {
      var r = f.luchados ? f.luchados() : {}, luchados = mapaOcupacion.explorados(r, f.ocupacion);
      circ = N.despejado({ pub: f.pub(), sha: K.sha, nodos: Ce ? Ce.nodos : [], lugares: f.lugares(), luchados: luchados });
      if (window.AtlasArrecife) { circ = circ.concat(window.AtlasArrecife.circulos()); }
      TS.despejado(circ);
    }
    function aCasa(dilo) {
      despeja();
      var casa = N.sitioCasa(f.pub(), K.sha);
      centro = casa || N.HEX;
      if (!cam) { cam = C.crea(centro); } else { C.planea(cam, centro.x, centro.y, circ, quieto()); }  /* F357: planea */
      if (dilo || !casa) { aviso.textContent = f.texto(casa ? 'mapa_en_casa' : 'mapa_sin_casa'); }
    }
    function choca() {
      var t = performance.now();
      if (t - avisado > 1500) { avisado = t; aviso.textContent = f.texto('mapa_niebla'); }
    }
    /* Un salto por accion `mover`: devuelve true si choco con la niebla. */
    function mueveDir(d) {
      if (d === 'casa') { aCasa(true); return false; }
      if (d === 'faro') { C.planea(cam, N.HEX.x, N.HEX.y, circ, quieto()); movido = true; aviso.textContent = f.texto('mapa_en_faro'); return false; }
      /* En rombo, la flecha es de PANTALLA (derecha se ve a la derecha): se pasa a mundo con la inversa. */
      movido = true; var v = C.aMundoDelta(VEC[d][0] * PASO * 2.2, VEC[d][1] * PASO * 2.2, 1), c = C.empuja(cam, v[0], v[1], circ, quieto());
      if (c) { choca(); }
      return c;
    }

    /* --- dibujo ------------------------------------------------------------------------------------ */
    function curva(a, b, s) {
      var mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.18, u = 1 - s;
      return [u * u * a[0] + 2 * u * s * mx + s * s * b[0], u * u * a[1] + 2 * u * s * my + s * s * b[1]];
    }
    function enlace(g, a, b, punteado) {
      g.setLineDash(punteado ? [2 * dpr, 6 * dpr] : []); g.beginPath();
      for (var i = 0; i <= 24; i++) { var p = curva(a, b, i / 24); g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }
      g.stroke(); g.setLineDash([]);
    }
    function pulso(g, a, b, s, cl, rr) {
      var p = curva(a, b, s); g.strokeStyle = cl; g.beginPath();
      for (var i = 0; i <= 32; i++) { var u = i / 32 * 2 * Math.PI; g[i ? 'lineTo' : 'moveTo'](p[0] + Math.sin(3 * u + s * 9) * rr, p[1] + Math.sin(2 * u) * rr); }
      g.stroke();
    }
    function rotulo(g, txt, x, y) {
      var an = g.measureText(txt).width + 10 * dpr;
      g.fillStyle = 'rgb(6,10,22)'; g.fillRect(x - an / 2, y - 12 * dpr, an, 16 * dpr);
      g.fillStyle = col.texto; g.fillText(txt, x, y);
    }
    function sitio(l) { return N.sitioLugar(l, K.sha, f.pub()); }
    function pinta(ts) {
      raf = requestAnimationFrame(pinta);
      /* U1: el mapa ES la pantalla (lienzo fijo); se PAUSA bajo una hoja (`con-hoja`) o con la pestana oculta. */
      if (!c.isConnected || document.hidden || document.documentElement.classList.contains('con-hoja')) { ultimo = null; return; }
      var w = Math.max(240, c.clientWidth), h = Math.max(260, c.clientHeight);
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); }
      if (c.height !== Math.round(h * dpr)) { c.height = Math.round(h * dpr); }
      var g = c.getContext('2d'), W = c.width, H = c.height, q = quieto(), t = q ? 0 : ts, z = W / VE * (w < 600 ? 1.15 : 1) * zoom.factor();
      col = col || f.colores();
      /* La clave llega despues (promesa): si aun no te has movido, la camara va a tu casa en cuanto se sabe. */
      if (!cam || (!movido && centro === N.HEX && f.pub())) { aCasa(!!cam); }
      var snap = window.AtlasJuego && window.AtlasJuego.instantanea ? window.AtlasJuego.instantanea() : null;
      if (snap && mapaOcupacion.cambiaCiclo(snap.ciclo)) { despeja(); }
      if (!(cuadros++ % 30)) { despeja(); }
      var k = ultimo === null ? 1 : Math.min(6, (ts - ultimo) / 16); ultimo = ts;
      if (!arrastre && !q && C.paso(cam, k, circ)) { choca(); }
      g.imageSmoothingEnabled = false;
      g.fillStyle = 'rgb(5,8,18)'; g.fillRect(0, 0, W, H);
      TS.tierra(g, cam, W, H, z, q ? null : MF.deriva(t));
      g.font = '600 ' + Math.round(11 * dpr) + 'px ui-monospace, monospace'; g.textAlign = 'center'; g.lineWidth = dpr;
      var P = function (x, y) { return C.aPantalla(cam, W, H, z, x, y); }, hx = null;
      H0.forEach(function (n) { if (n.gen.estado === 'MEDIDO' && !hx) { hx = n; } });
      var cen = P(N.HEX.x, N.HEX.y), casa = N.sitioCasa(f.pub(), K.sha), yo = casa ? P(casa.x, casa.y) : null;
      var destinos = f.lugares().map(function (l) { var s = sitio(l); return { p: P(s.x, s.y) }; });
      if (yo) { destinos.push({ p: yo }); }
      H0.forEach(function (n) { if (n !== hx) { destinos.push({ p: P(n.x, n.y), nd: n.gen.estado === 'NO_DATA' }); } });
      destinos.forEach(function (d, i) {
        g.strokeStyle = 'rgba(160,200,230,.3)'; enlace(g, cen, d.p, d.nd || !hx);
        if (!hx || d.nd || q) { return; }
        var s = ((t * hx.gen.valor / 1e7) + i * 0.37) % 1;
        g.lineWidth = 1.6 * dpr; pulso(g, cen, d.p, s, E.rapidez(3 + Math.min(10, hx.gen.valor / 800)), 5 * dpr); g.lineWidth = dpr;
      });
      var sel = f.sel();
      /* LEY DEL SUELO, paso 3: ORDEN DE PINTOR. Lugares, nodos, cangrejos, anclas y edificios se ENCOLAN con su sitio y se
         pintan de atras a delante por profundidad (col + fila, `IsometricFloor.ordena`): lo de delante tapa lo de detras. */
      var cola = [], pon = function (x, y, d, fi) { cola.push({ col: x, fila: y, f: d, ficha: fi }); };
      var rec = (f.luchados && f.luchados()) || {};
      f.lugares().forEach(function (l, i) { var s = sitio(l), Z = window.AtlasLugarNablaC, v = Z && l.npc ? Z.vector(rec[l.clave], l.lider) : 0, cz = v === 0 ? 0 : Z.color(v); pon(s.x, s.y, function () {
        var p = P(s.x, s.y), t0 = l.lider, r = 18 * dpr;
        if (sel === l) {
          if (yo) { g.strokeStyle = col.tuya; g.lineWidth = 2 * dpr; enlace(g, yo, p, false); }
          g.lineWidth = 2 * dpr; g.strokeStyle = col.tuya; g.globalAlpha = q ? 1 : 0.6 + 0.4 * Math.sin(t * 0.005);
          g.beginPath(); g.arc(p[0], p[1], r * 1.7, 0, 2 * Math.PI); g.stroke(); g.globalAlpha = 1; g.lineWidth = dpr;
        }
        var dx = q ? 0 : Math.sin(t * 0.0006 + i) * 3 * dpr;
        /* MOVIMIENTO 8 - M17: Sprites chunky para NPCs */
        if (l.npc && F.npc_chunk && baja()) {
          var clave = 'npc_' + l.id + '_' + r;
          /* 1/4 de escala y ampliado x4 sin suavizar: el pixel gordo que declara 75c7ad0 (pintaba x4). */
          var cv = O.sprite(t0.armonicos, r / 4, cz ? cz.css : l.npc ? E.tono(t0) : col.suya, clave, dpr);
          g.imageSmoothingEnabled = false;
          g.drawImage(cv, p[0] + dx - cv.width * 2, p[1] - cv.height * 2, cv.width * 4, cv.height * 4);
          g.imageSmoothingEnabled = true;
        } else {
          E.figura(g, t0.armonicos, p[0] + dx, p[1], r, { color: cz ? cz.css : l.npc ? E.tono(t0) : col.suya, giro: t * 0.0004 * (l.npc ? -1 : 1),
                                                         grosor: 1.5 * dpr, brillo: (E.BRILLO[t0.rareza] + (l.npc ? 0 : 8)) * dpr });
        }
        rotulo(g, f.nombre(l), p[0], p[1] + r + 15 * dpr);
        /* Conquistado: ganado en ESTE aparato (FIRMO 2026-10-10). */
        var rl = rec[l.clave], em = f.emblema();
        if (rl && rl.g) {
          rotulo(g, f.texto('arena_conquistado_mapa'), p[0], p[1] + r + 31 * dpr);
          if (em) { E.figura(g, em.armonicos, p[0] + r * 1.5, p[1] - r * 1.2, r * 0.45, { color: col.tuya, grosor: 1.4 * dpr, brillo: 6 * dpr }); }
        }
        mapaOcupacion.mensaje(g, l, f, rotulo, p, r, dpr);
      }, function () { return mapaOcupacion.ficha(l, f.nombre(l), cz ? Z.estado(v) : l.npc ? 'NPC' : 'player', l.lider); }); });
      window.AtlasMapNodes.pinta(g, P, { H0: H0, col: col, t: t, dpr: dpr, pon: pon });
      /* U2: tu cangrejo (y el de los jugadores llegados, en lo despejado), donde flotaba el emblema suelto. */
      window.AtlasMarCangrejos.pinta(g, P, { pub: f.pub(), sha: K.sha, t: t, dpr: dpr, quieto: q, circ: circ, pon: pon,
        otros: f.lugares().filter(function (l) { return !l.npc; }).map(function (l) { return { de: l.de, n: l.defensa.tropas.length }; }) });
      /* R7 · las anclas (`mar-anclas.js`); P10: tu prisma, del color de TU bandera. */
      var cs = window.AtlasCasa && window.AtlasCasa.casa ? window.AtlasCasa.casa() : null, BV = window.AtlasValores.banderas;
      window.AtlasMarAnclas.pinta(g, P, { pub: f.pub(), sha: K.sha, nodos: Ce ? Ce.nodos : [], dpr: dpr, texto: f.texto, pon: pon,
                                          bandera: cs && cs.bandera && BV ? BV[cs.bandera] : null });
      if (window.AtlasArrecife) { window.AtlasArrecife.pinta(g, P, { pub: f.pub(), sha: K.sha, dpr: dpr, t: t, quieto: q, texto: f.texto, cam: cam, ts: ts, pon: pon }); }
      window.IsometricFloor.ordena(cola).forEach(function (x) { x.f(); });
      if (window.AtlasInspector) { window.AtlasInspector.registra(cola, P, f.texto); }  /* 0d */
      TS.niebla(g, cam, W, H, z);
      /* MOVIMIENTO 7 - M17: Vignette barato - gradiente radial cacheado */
      if (!quieto() && F.vignette_alfa) {
        var grad = g.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
        grad.addColorStop(0, 'rgba(0,0,0,' + F.vignette_alfa + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);
      }
      /* Lo que esta en la niebla tambien se DECLARA: su anillo vacio y su rotulo, por encima. */
      H0.forEach(function (n) {
        var p = P(n.x, n.y), med = n.gen.estado === 'MEDIDO';
        if (!med) { g.strokeStyle = col.texto; g.lineWidth = 1.5 * dpr; g.setLineDash([3 * dpr, 4 * dpr]); g.beginPath(); g.arc(p[0], p[1], 39 * dpr, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]); }
        rotulo(g, n.nodo.split('.').pop() + ' · ' + (med ? f.texto('mapa_medido') : 'NO_DATA'), p[0], p[1] + 58 * dpr);
      });
      /* La postura de tu casa (home_buildings.js) se VE en el mapa: lema y alianzas cerradas. Solo aspecto. */
      var ca = window.AtlasCasa && window.AtlasCasa.casa ? window.AtlasCasa.casa() : null;
      if (yo) { rotulo(g, f.texto('arena_tu') + (ca && ca.lema ? ' \u00B7 \u201C' + ca.lema + '\u201D' : '') + (ca && ca.alianzas === 'cerradas' ? ' \u00B7 \u26E8' : ''), yo[0], yo[1] + 40 * dpr); }
    }

    /* --- el dedo: `map_pointer_input.js` (salio de aqui al migrar a la LEY DEL SUELO, 2026-10-12) ------------------ */
    window.AtlasMapaDedo.monta({ c: c, C: C, dpr: dpr, z: function () { return c.width / VE * (c.clientWidth < 600 ? 1.15 : 1) * zoom.factor(); },
      cam: function () { return cam; }, circ: function () { return circ; }, quieto: quieto, choca: choca, marca: function () { movido = true; },
      lugares: f.lugares, sitio: sitio, elige: f.elige, flecha: flecha });
    raf = requestAnimationFrame(pinta);
    VIVO = { mueveDir: mueveDir };
    return { para: function () { cancelAnimationFrame(raf); VIVO = null; }, camara: function () { return cam; }, despejado: function () { return circ; } };
  }

  window.AtlasMar = { ANILLO: ANILLO, crea: crea, casas: function () { return window.AtlasMapNodes.casas(); }, mueve: mueve, flecha: flecha };
})();
