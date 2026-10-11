/* preceptoros.org · theGame v1.5 · LA FICHA de una tropa: su lienzo de Fourier, su nombre, su carta y su voz.

   Troceo T (2026-10-11, PROPUESTA pendiente de FIRMO: `ui.js` es intocable): sale de `ui.js` SIN CAMBIO VISIBLE,
   para que la cadena de invocaciones (G0) y la piedad quepan alli. El mismo codigo, movido: `crea(ctx)` lo ata a
   lo que `ui.js` ya tenia (gacha, sintesis, textos y su linea de estado). Sin red, sin azar. */
(function () {
  'use strict';
  function crea(ctx) {
    var G = ctx.G, S = ctx.S, T = ctx.T, el = ctx.el, boton = ctx.boton, rellena = ctx.rellena, dice = ctx.dice;

  /* --- el lienzo: una figura de Fourier ---------------------------------- */
  function lienzo(lado, etiqueta) {
    var c = el('canvas', 'atlas-onda'), r = window.devicePixelRatio || 1;
    c.width = lado * r; c.height = lado * r;
    c.style.width = lado + 'px'; c.style.height = lado + 'px';
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', etiqueta || '');
    return c;
  }
  function traza(c, arm, clase, latido) {
    var g = c.getContext('2d'), w = c.width, lim = 0;
    arm.forEach(function (h) { lim += Math.max(Math.abs(h[1]), Math.abs(h[2])); });
    var k = (w / 2 - 6) / Math.max(1, lim) * (latido || 1);
    g.clearRect(0, 0, w, w);
    g.lineWidth = Math.max(1.5, w / 90);
    g.strokeStyle = getComputedStyle(c).getPropertyValue('--onda').trim() || '#c98a4b';
    g.beginPath();
    for (var i = 0; i <= 256; i++) {
      var p = G.punto(arm, i / 256 * 2 * Math.PI);
      g[i ? 'lineTo' : 'moveTo'](w / 2 + p[0] * k, w / 2 - p[1] * k);
    }
    g.stroke();
    c.dataset.rareza = clase || '';
  }

  /* --- nombres, desde el texto de la lengua ------------------------------ */
  function nombre(t) {
    if (t.rareza === 'unico') { return T('unico_nombre'); }
    return rellena(T('nombre_tropa'), {
      base: T('base_' + t.base), pre: t.prefijo ? T('af_' + t.prefijo) : '',
      suf: t.sufijo ? T('af_' + t.sufijo) : ''
    }).replace(/\s+/g, ' ').trim();
  }
  function ficha(t, lado) {
    var f = el('figure', 'atlas-tropa rar-' + t.rareza);
    var c = lienzo(lado, nombre(t) + ' · ' + T('rar_' + t.rareza));
    f.appendChild(c);
    var cap = el('figcaption');
    cap.appendChild(el('b', null, nombre(t)));
    cap.appendChild(el('small', null, T('rar_' + t.rareza)));
    /* M18-B: sus aristas; una tropa firmada antes no las lleva y se dice de otra version (en combate se
       vuelve a tirar de su semilla con las reglas de hoy: cambia de forma, y se avisa aqui). */
    cap.appendChild(el('small', 'atlas-aristas', t.aristas ? rellena(T('aristas_n'), { n: t.aristas }) : T('version_previa')));
    /* R8 · LA VITRINA: sus stats reales a la vista (las mismas que usa el combate), sin barras. */
    cap.appendChild(el('small', 'atlas-stats', G.STATS.filter(function (k) { return t.stats[k]; }).map(function (k) { return k.slice(0, 3) + ' ' + t.stats[k]; }).join(' · ')));
    /* SU CARACTER Y SU VOZ: el color de la traza sale de su caracter; el boton suena su timbre. */
    var k = G.caracter(t);
    /* P10: tenida a tu bandera, se pinta de su tono (lo eligio la persona); si no, el de su caracter. */
    var tn = window.AtlasTallerUI && window.AtlasTallerUI.tono(t.semilla);
    c.style.setProperty('--onda', tn != null ? 'hsl(' + tn + ' 85% 62%)' : ['hsl(35 75% 58%)', 'hsl(140 45% 55%)', 'hsl(275 55% 68%)', 'hsl(210 12% 68%)'][k.color]);
    c.dataset.caracter = k.color + '-' + k.pulso + '-' + k.tendencia;
    var oir = boton(T('sonido'));
    oir.addEventListener('click', function () { oye(t); });
    cap.appendChild(oir);
    f.appendChild(cap);
    requestAnimationFrame(function () { traza(c, t.armonicos, t.rareza); });
    return f;
  }

  /* LA VOZ EXACTA: `atlas-voz.js`, mismos bytes en cada aparato; baja al pulsar. Sin ella, oscilador. */
  function oye(t) {
    var V = window.AtlasVoz;
    if (V) {
      var v = V.oye(t, S.contexto());
      dice(v ? rellena(T('voz_exacta'), { h: v.huella.corta, n: v.partes.length }) : T('sonido_nd'));
      return;
    }
    var s = document.createElement('script');
    s.src = '/assets/atlas-voz.js';
    s.onload = function () { if (window.AtlasVoz) { oye(t); } else { s.onerror(); } };
    s.onerror = function () { dice(S.suena(S.vozDe(t)) ? T('voz_exacta_nd') : T('sonido_nd')); };
    document.head.appendChild(s);
  }

    /* PIEDAD VISIBLE Y CRONICA DE DESEOS (piezas 1+2 y 3, firmadas). La cifra sale de TU cadena (`db.js`), aqui solo
       se pinta. La garantia no tiene numero firmado: NO_DATA, nunca uno inventado. La cronica se coloca en la espiral
       de girasol de los escuadrones (`AtlasEscuadron.sitios`, la MISMA funcion); sin ella, queda la lista. Lo vivo en
       color (raro, unico, leviatan) y lo comun en gris; la lista es el equivalente en texto del dibujo. */
    var TONO = { normal: 'hsl(210 10% 55%)', magico: 'hsl(195 80% 70%)', raro: 'hsl(38 95% 60%)', unico: 'hsl(270 85% 72%)' };
    function cronica(zona, cadena, causa) {
      zona.textContent = '';
      if (!cadena) { if (causa) { zona.appendChild(el('p', 'no-data', 'NO_DATA · ' + causa)); } return; }
      var A = ctx.A, p = A.piedad(cadena, function (e) { return G.tirada(e.semilla, e.obj.tc).rareza; });
      if (p.nd) { zona.appendChild(el('p', 'no-data', 'NO_DATA · ' + p.nd)); return; }
      var l = A.cronica(cadena, G.tirada), E = window.AtlasEscuadron, V = window.AtlasValores;
      var resumen = rellena(T('piedad_t'), { n: p.desde_raro, a: p.abiertos, i: p.incubando });
      zona.appendChild(el('p', 'atlas-piedad', resumen));
      zona.appendChild(el('p', 'atlas-nota', T('garantia_nd')));
      if (!l.length) { return; }
      if (E && E.sitios && V && V.escuadron) {
        var c = lienzo(168, resumen), g = c.getContext('2d'), w = c.width, S = E.sitios(l.length, 'atlas.cronica', null), k = (w / 2 - 10) / V.escuadron.radio;
        S.forEach(function (q, i) {
          var t = l[i], lev = t.aristas > 12;
          g.fillStyle = lev ? 'hsl(14 100% 67%)' : TONO[t.rareza] || TONO.normal;
          g.beginPath(); g.arc(w / 2 + q[0] * k, w / 2 + q[1] * k, (lev ? 5 : 3) * (window.devicePixelRatio || 1), 0, 2 * Math.PI); g.fill();
        });
        zona.appendChild(c);
      }
      var ol = el('ol', 'atlas-cronica');
      l.slice(-12).reverse().forEach(function (t) {
        ol.appendChild(el('li', null, rellena(T('cronica_item'), { s: t.seq, c: t.ciclo, tc: T(t.tc), n: t.aristas, r: T('rar_' + t.rareza), h: t.sello })));
      });
      zona.appendChild(ol);
    }

    return { lienzo: lienzo, traza: traza, nombre: nombre, ficha: ficha, oye: oye, cronica: cronica };
  }
  window.AtlasFicha = { crea: crea };
})();
