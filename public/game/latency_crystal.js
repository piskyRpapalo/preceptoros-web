
(function (raiz) {
  'use strict';
  var CADA = 30, MIN = 60, VENTANA = 240, HUECO = 250, VIEJO = 120, MAX_EVENTOS = 50;
  var NIVELES = [['oro', 55, [45, 90, 55]], ['plata', 40, [210, 12, 74]], ['bronce', 25, [28, 62, 46]], ['dithering', 0, null]];
  var deltas = [], previo = null, eventos = [], ultimoCiclo = null, nivelVisto = null;


  function resume(ds) {
    if (!ds || ds.length < MIN) { return null; }
    var o = ds.slice().sort(function (a, b) { return a - b; }), q = function (p) { return o[Math.min(o.length - 1, Math.floor(p * o.length))]; };
    return { cuadros: o.length, p50: Math.round(1000 / q(0.5)), p10: Math.round(1000 / q(0.9)) };
  }
  function nivel(p50) { for (var i = 0; i < NIVELES.length; i++) { if (p50 >= NIVELES[i][1]) { return NIVELES[i]; } } return NIVELES[3]; }

  function sello(ev, c) { return !ev ? 'NO_DATA' : (c - ev.ciclo > VIEJO ? 'STALE' : 'LIVE'); }


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
    if (s === 'NO_DATA') { if (!raiz.AtlasZ || raiz.AtlasZ.visible('NO_DATA')) { g.setLineDash([2 * dpr, 2 * dpr]); g.strokeStyle = 'rgba(150,160,180,.45)'; g.stroke(); g.setLineDash([]); } }
    else if (niv[2]) { var TB = raiz.AtlasBuildingsToon; if (TB) { TB.forma(g, 'cristal', p[0], p[1], lado, { h: niv[2][0], s: niv[2][1], l: niv[2][2] }, dpr, s === 'STALE' ? 0.5 : 1); } else { g.globalAlpha = s === 'STALE' ? 0.5 : 1; g.fillStyle = 'hsl(' + niv[2][0] + ' ' + niv[2][1] + '% ' + niv[2][2] + '%)'; g.fill(); g.globalAlpha = 1; } }
    else { g.save(); g.clip(); g.fillStyle = 'rgb(220,220,220)'; for (var j = 0; j * dpr < lado * 2.8; j++) { for (var i = j % 2; i * dpr < lado * 2; i += 2) { g.fillRect(p[0] - lado + i * dpr, p[1] - lado * 1.4 + j * dpr, dpr, dpr); } } g.restore(); }
    g.strokeStyle = 'rgba(155,227,255,.7)'; g.lineWidth = dpr; g.stroke();
    g.fillStyle = 'rgba(155,227,255,.75)';

    g.fillText(ev ? ev.p50 + ' fps · p10 ' + ev.p10 + (s === 'STALE' ? ' · STALE' : '') : 'NO_DATA', p[0], p[1] - lado * 1.4 - 4 * dpr);
    }, function () { return raiz.AtlasPlaceCards.ficha('cristal', { que: t('cri_nombre'), estado: ev ? s + ' · ' + ev.p50 + ' fps (p10 ' + ev.p10 + ') · ' + ev.cuadros + ' frames · cycle ' + ev.ciclo : null,
      causas: ev ? [] : ['fewer than ' + MIN + ' frames measured yet'] }, { medidas: eventos.length }); });
  }
  function lista() { return eventos.slice(); }
  function enVentana() { return deltas.length; }

  var AtlasCristal = { pinta: pinta, eventos: lista, resume: resume, nivel: nivel, sello: sello, anota: anota, enVentana: enVentana, CADA: CADA, MIN: MIN, VIEJO: VIEJO };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCristal; } else { raiz.AtlasCristal = AtlasCristal; }
})(this);
