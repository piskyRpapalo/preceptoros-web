(function (raiz) {
  'use strict';
  var TOPE_SEG = 9, BASE_MS = 360, POR_SEG = 20;
  var intentos = {}, visible = null, textoDe = {}, ultimo = null, lienzo = null;

  function hueDe(sello) { var T = raiz.AtlasSemantica || raiz.AtlasToon; return T && T.SELLOS && T.SELLOS.hasOwnProperty(sello) ? T.SELLOS[sello] : null; }
  function cicloValido(c) { return Number.isSafeInteger(c) && c >= 0 && c <= 1000000000; }
  function cicloActual() {
    try {
      var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null, c = i && i.ciclo;
      return cicloValido(c) ? c : null;
    } catch (_) { return null; }
  }

  function gusano(S, A, B) {
    var segs = Math.max(1, Math.min(TOPE_SEG, S.intentos || 1)), curva = Math.min(140, 16 + Math.abs(S.delta || 0) / 12);

    var lado = cicloValido(S.ciclo) ? (S.ciclo % 2 === 0 ? 1 : -1) : 0, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    var dx = B[0] - A[0], dy = B[1] - A[1], L = Math.sqrt(dx * dx + dy * dy) || 1, cx = mx - dy / L * curva * lado, cy = my + dx / L * curva * lado, pts = [];
    for (var i = 0; i <= 24; i++) { var u = i / 24, w = 1 - u; pts.push([Math.round(w * w * A[0] + 2 * w * u * cx + u * u * B[0]), Math.round(w * w * A[1] + 2 * w * u * cy + u * u * B[1])]); }
    return { puntos: pts, segmentos: segs, ms: BASE_MS + POR_SEG * segs, hue: hueDe(S.sello) };
  }
  function centro(el) { if (!el) { return null; } var q = el.getBoundingClientRect(); return [Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2)]; }
  function quieto() { return raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function anima(gu) {
    var D = raiz.document;
    if (!lienzo) { lienzo = D.createElement('canvas'); lienzo.className = 'gusano-lienzo'; lienzo.setAttribute('aria-hidden', 'true'); D.body.appendChild(lienzo); }
    var dpr = Math.min(2, raiz.devicePixelRatio || 1), g = lienzo.getContext('2d'), t0 = null;
    lienzo.width = Math.round(raiz.innerWidth * dpr); lienzo.height = Math.round(raiz.innerHeight * dpr);
    var color = gu.hue === null ? 'rgba(150,160,180,.8)' : 'hsl(' + gu.hue + ' 70% 60%)';
    function cuadro(ts) {
      if (t0 === null) { t0 = ts; }
      var p = Math.min(1, (ts - t0) / gu.ms), cab = Math.round(p * 24);
      g.clearRect(0, 0, lienzo.width, lienzo.height);
      for (var s = 0; s < gu.segmentos; s++) {
        var q = gu.puntos[Math.max(0, cab - s * 2)];
        g.beginPath(); g.arc(q[0] * dpr, q[1] * dpr, (6 - s * 0.4) * dpr, 0, 2 * Math.PI);
        g.fillStyle = color; g.globalAlpha = 1 - s / (gu.segmentos + 1); g.fill();
      }
      g.globalAlpha = 1;
      if (p < 1) { raiz.requestAnimationFrame(cuadro); } else { g.clearRect(0, 0, lienzo.width, lienzo.height); }
    }
    raiz.requestAnimationFrame(cuadro);
  }

  function vistoAhora() {
    var D = raiz.document, caja = D.getElementById('thegame-terminal'), v = null;
    D.querySelectorAll('.thegame-hoja').forEach(function (h) { if (!h.hidden) { v = { id: h.id.replace('thegame-', ''), el: h }; } });
    if (!v && caja && !caja.hidden) { Array.prototype.forEach.call(caja.children, function (d) { if (d.tagName === 'DETAILS' && !d.hidden) { v = { id: d.id, el: d }; } }); }
    return v;
  }
  function transita() {
    var v = vistoAhora(), id = v ? v.id : null;
    if (id === visible) { return; }
    var de = visible, D = raiz.document;
    visible = id;
    if (!id) { return; }
    intentos[id] = (intentos[id] || 0) + 1;
    var largo = (v.el.innerText || '').length, delta = largo - (de && textoDe[de] !== undefined ? textoDe[de] : 0);
    textoDe[id] = largo;
    var W = raiz.AtlasVentana;
    if (W && W.pinta) { W.pinta(); }
    var f = W && W.ficha ? W.ficha() : null;
    var S = { ciclo: cicloActual(), de: de, a: id, delta: delta, intentos: intentos[id], sello: f && f.id === id ? f.sello : 'NO_DATA' };
    var A = centro(D.getElementById('menu-' + (de || id))) || [0, 0], B = centro(D.getElementById('menu-' + id)) || A, gu = gusano(S, A, B);
    ultimo = { S: S, segmentos: gu.segmentos, ms: gu.ms, hue: gu.hue };
    var R = raiz.AtlasRadioChat;
    if (R && R.dice) { R.dice({ quien: 'Terminal', fuente: 'gusano', sello: S.sello, texto: (de || 'map') + ' → ' + id + ' · Δ text ' + (delta >= 0 ? '+' : '') + delta + ' · opened ×' + S.intentos }); }
    if (!quieto()) { anima(gu); }
  }
  function monta() {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja || monta.hecho) { return; }
    monta.hecho = true;
    var piso = caja.parentNode || D.body;
    new MutationObserver(transita).observe(piso, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }
  if (raiz.setInterval && raiz.document) { raiz.setInterval(monta, 1000); }

  function ficha() { return ultimo ? JSON.parse(JSON.stringify(ultimo)) : null; }

  var AtlasWorm = { gusano: gusano, ficha: ficha, TOPE_SEG: TOPE_SEG };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasWorm; } else { raiz.AtlasWorm = AtlasWorm; }
})(this);
