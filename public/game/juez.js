(function (raiz) {
  'use strict';

  var HORIZONTE = 300, SIN_DIA = 'sin-dia';

  function aplicar(M, e, a) {
    if (a.accion === 'esperar') { return e; }
    if (a.accion === 'bajar_a') { return M.bajarA(e, a.banda, SIN_DIA); }
    if (a.accion === 'invocar') { return M.invocar(e, a.coste, SIN_DIA); }
    if (a.accion === 'recoger' || a.accion === 'reparar' || a.accion === 'aplazar') {
      return M[a.accion](e, SIN_DIA);
    }
    throw new Error('accion desconocida: ' + a.accion);
  }

    function rama(M, Pa, Pi, e0, a, ley, h) {
    var e = aplicar(M, e0, a), min = e.integridad;
    for (var i = 0; i < h; i++) {
      e = M.ciclo(e, ley);
      var p = Pi.decide(Pa.instantanea(e, M), M);
      if (Pi.valida(p) && p.accion !== 'esperar') { e = aplicar(M, e, p); }
      if (e.integridad < min) { min = e.integridad; }
    }
    var xp = 0;
    e.xp.forEach(function (x) { xp += x; });
    return { fase: M.fase(e), nucleo: M.nivelNucleo(e), integridad_min: min,
             integridad_fin: e.integridad, xp: xp };
  }

    function gana(p, h) {
    if (!h) { return 'NO_DATA'; }
    var k = ['nucleo', 'fase', 'integridad_min', 'xp'];
    for (var i = 0; i < k.length; i++) {
      if (h[k[i]] > p[k[i]]) { return 'humano'; }
      if (h[k[i]] < p[k[i]]) { return 'piloto'; }
    }
    return 'empate';
  }

    function sinEfecto(M, Pa, e, a) {
    try {
      return JSON.stringify(Pa.final(aplicar(M, e, a), M)) === JSON.stringify(Pa.final(e, M));
    } catch (x) { return true; }
  }

  function juzga(M, Pa, Pi, e, sug, hum, ley, h) {
    h = h || HORIZONTE;
    var nula = sinEfecto(M, Pa, e, sug);
    var rp = nula ? null : rama(M, Pa, Pi, e, sug, ley, h);
    var rh = hum ? rama(M, Pa, Pi, e, hum, ley, h) : null;
    return { horizonte: h, piloto: rp, humano: rh, gana: rp ? gana(rp, rh) : 'NO_DATA', alucinacion: nula };
  }

  var AtlasJuez = { HORIZONTE: HORIZONTE, aplicar: aplicar, rama: rama, gana: gana, juzga: juzga,
                    sinEfecto: sinEfecto };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasJuez; return; }
  raiz.AtlasJuez = AtlasJuez;
})(this);
