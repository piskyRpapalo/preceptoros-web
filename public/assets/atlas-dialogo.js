(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (padre) { padre.appendChild(n); }
    return n;
  }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function degradado(defs, id, tipo, paradas, extra) {
    var g = s(tipo, Object.assign({ id: id }, extra || {}), defs);
    paradas.forEach(function (p) { s('stop', { offset: p[0], 'stop-color': p[1] }, g); });
  }

  var CELDAS = Object.freeze({ reposo: 0, habla: [1, 2], revelar: 3, alerta: 4 });
  var EMBLEMA = [[1, 24, 24, 0], [-3, 13, 13, 44], [9, 3, 3, 40]];

  var TONO = 'hsl(205 30% 74%)', COBRE = 'hsl(35 80% 62%)';

  function retratoPreceptor(ui, decorativo) {
    var marco = el('div', 'atlas-pre'), cv = document.createElement('canvas'), celda = 0, alerta = false;
    cv.className = 'atlas-pre-onda'; cv.width = 167; cv.height = 248;

    if (decorativo) { marco.setAttribute('aria-hidden', 'true'); }
    else { cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', ui.atlas_retrato_alt || ''); }
    function pinta() {
      var g = cv.getContext && cv.getContext('2d');
      if (!g) { return; }
      var e = celda === 2 ? 2.6 : 2.8, i, u, x, y;
      g.clearRect(0, 0, 167, 248); g.beginPath();
      for (i = 0; i <= 120; i++) {
        u = i / 120 * 2 * Math.PI; x = 0; y = 0;
        EMBLEMA.forEach(function (h) { var f = h[0] * u + h[3] * Math.PI / 32; x += h[1] * Math.cos(f); y += h[2] * Math.sin(f); });
        g[i ? 'lineTo' : 'moveTo'](83.5 + x * e, 124 + y * e);
      }
      g.lineWidth = celda === 3 ? 5 : 2.5; g.strokeStyle = alerta || celda === 4 ? COBRE : TONO; g.stroke();
    }
    marco.appendChild(cv); pinta();
    return {
      nodo: marco,
      celda: function (n) { marco.dataset.celda = String(n); celda = n; pinta(); },
      alerta: function (si) { marco.classList.toggle('en-alerta', !!si); alerta = !!si; pinta(); }
    };
  }

  window.AtlasDialogo = { retrato: retratoPreceptor, CELDAS: CELDAS };
})();
