/* preceptoros.org · theGame · EL CRISTAL DE LATENCIA (los 9 objetos, cuarto; FIRMO 2026-10-12).

   «Registros fosiles de como se comporta el render en un dispositivo concreto (...) no moneda: evidencia» (J-TG-10,
   clsob.txt:432). El cristal MIDE TU HIERRO con los cuadros del propio mapa y lo deja escrito:
   - Cada cuadro aporta su duracion (la marca del navegador entre dos pintadas). Huecos de mas de 250 ms no son cuadros
     (pestana oculta, mapa en pausa bajo una hoja): se descartan, no se promedian.
   - Cada 30 ciclos, con al menos 60 cuadros, se anota un EVENTO (append-only, nunca un contador): ciclo, cuadros, fps
     p50 y p10 (el peor decil: la banda de incertidumbre), calidad elegida, dpr y tamano del lienzo.
   - Su NIVEL sale del p50 medido: ORO >= 55 fps, PLATA >= 40, BRONCE >= 25 y, por debajo, DITHERING (el modo 1-bit de
     J-TG-14: el cristal se pinta tramado, sin color). INTERPRETACION de la orden de guardia (oro->plata->bronce->
     dithering como niveles de lo medido), declarada: el corpus no fija los cortes.
   - Sin evento: NO_DATA (cuerpo hueco y translucido, nunca «0 fps»). Evento con mas de 120 ciclos: STALE.
   El lab lee `eventos()`. Sin red, sin azar; el reloj del navegador solo MIDE, no decide nada del juego. */
(function (raiz) {
  'use strict';
  var CADA = 30, MIN = 60, VENTANA = 240, HUECO = 250, VIEJO = 120, MAX_EVENTOS = 50;
  var NIVELES = [['oro', 55, [45, 90, 55]], ['plata', 40, [210, 12, 74]], ['bronce', 25, [28, 62, 46]], ['dithering', 0, null]];
  var deltas = [], previo = null, eventos = [], ultimoCiclo = null, nivelVisto = null;

  /* Puro: la mediana y el peor decil de una lista de duraciones (ms) -> fps. Con menos de MIN cuadros, null. */
  function resume(ds) {
    if (!ds || ds.length < MIN) { return null; }
    var o = ds.slice().sort(function (a, b) { return a - b; }), q = function (p) { return o[Math.min(o.length - 1, Math.floor(p * o.length))]; };
    return { cuadros: o.length, p50: Math.round(1000 / q(0.5)), p10: Math.round(1000 / q(0.9)) };
  }
  function nivel(p50) { for (var i = 0; i < NIVELES.length; i++) { if (p50 >= NIVELES[i][1]) { return NIVELES[i]; } } return NIVELES[3]; }
  /* El sello del ultimo evento en el ciclo c: LIVE, STALE (viejo) o NO_DATA (no hay). */
  function sello(ev, c) { return !ev ? 'NO_DATA' : (c - ev.ciclo > VIEJO ? 'STALE' : 'LIVE'); }

  /* Un cuadro: `ts` es la marca de requestAnimationFrame. */
  function anota(ts) {
    if (typeof ts !== 'number' || !ts) { previo = null; return; }
    if (previo !== null) { var d = ts - previo; if (d > 0 && d <= HUECO) { deltas.push(d); if (deltas.length > VENTANA) { deltas.shift(); } } }
    previo = ts;
  }
  function registra(c, x) {
    if (ultimoCiclo !== null && c - ultimoCiclo < CADA) { return null; }
    var r = resume(deltas);
    if (!r) { return null; }
    var q = raiz.AtlasCalidad;
    var ev = { esquema: 'preceptoros.cristal/1', ciclo: c, cuadros: r.cuadros, p50: r.p50, p10: r.p10, nivel: nivel(r.p50)[0],
               calidad: q && q.modo ? q.modo : 'NO_DATA', dpr: x.dpr, lienzo: x.lienzo };
    eventos.push(ev); if (eventos.length > MAX_EVENTOS) { eventos.shift(); }
    ultimoCiclo = c; deltas = [];
    return ev;
  }

  /* g, P como las demas capas; o: { dpr, t, ts, texto, quieto }; casa: sitio de tu casa (o null); c: ciclo. */
  function pinta(g, P, o, casa, c) {
    anota(o.ts);
    if (c === null || c === undefined) { return; }
    var t = o.texto || function (k) { return k; }, dpr = o.dpr || 1, nuevo = registra(c, { dpr: dpr, lienzo: g.canvas ? g.canvas.width + 'x' + g.canvas.height : 'NO_DATA' });
    var ev = eventos.length ? eventos[eventos.length - 1] : null, s = sello(ev, c), N = (t('cri_niveles') || '').split('|');
    if (nuevo && nuevo.nivel !== nivelVisto) {
      var R = raiz.AtlasRadioChat, i = ['oro', 'plata', 'bronce', 'dithering'].indexOf(nuevo.nivel);
      if (R && R.dice) { R.dice({ quien: t('cri_nombre'), fuente: 'cristal', sello: 'LIVE', texto: (N[i] || nuevo.nivel) + ' · ' + nuevo.p50 + ' fps (p10 ' + nuevo.p10 + ') · ' + nuevo.cuadros + ' ▭' }); }
      nivelVisto = nuevo.nivel;
    }
    if (!casa) { return; }
    (o.pon || function (x, y, d) { d(); })(casa.x + 200, casa.y + 40, function () {
    var p = P(casa.x + 200, casa.y + 40), lado = (ev ? 6 + Math.min(60, ev.p50) / 10 : 8) * dpr, niv = ev ? nivel(ev.p50) : null;
    g.beginPath(); g.moveTo(p[0], p[1] - lado * 1.4); g.lineTo(p[0] + lado, p[1]); g.lineTo(p[0], p[1] + lado * 1.4); g.lineTo(p[0] - lado, p[1]); g.closePath();
    if (s === 'NO_DATA') { g.setLineDash([2 * dpr, 2 * dpr]); g.strokeStyle = 'rgba(150,160,180,.45)'; g.stroke(); g.setLineDash([]); }
    else if (niv[2]) { g.globalAlpha = s === 'STALE' ? 0.5 : 1; g.fillStyle = 'hsl(' + niv[2][0] + ' ' + niv[2][1] + '% ' + niv[2][2] + '%)'; g.fill(); g.globalAlpha = 1; }
    else { g.save(); g.clip(); g.fillStyle = 'rgb(220,220,220)'; for (var j = 0; j * dpr < lado * 2.8; j++) { for (var i = j % 2; i * dpr < lado * 2; i += 2) { g.fillRect(p[0] - lado + i * dpr, p[1] - lado * 1.4 + j * dpr, dpr, dpr); } } g.restore(); }
    g.strokeStyle = 'rgba(155,227,255,.7)'; g.lineWidth = dpr; g.stroke();
    g.fillStyle = 'rgba(155,227,255,.75)';
    /* Rotulo corto (en el Doogee el largo pisaba la casa): la cifra y su banda; el nombre lo dice el chat. */
    g.fillText(ev ? ev.p50 + ' fps · p10 ' + ev.p10 + (s === 'STALE' ? ' · STALE' : '') : 'NO_DATA', p[0], p[1] + lado * 1.4 + 12 * dpr);
    });
  }
  function lista() { return eventos.slice(); }
  function enVentana() { return deltas.length; }

  var AtlasCristal = { pinta: pinta, eventos: lista, resume: resume, nivel: nivel, sello: sello, anota: anota, enVentana: enVentana, CADA: CADA, MIN: MIN, VIEJO: VIEJO };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCristal; } else { raiz.AtlasCristal = AtlasCristal; }
})(this);
