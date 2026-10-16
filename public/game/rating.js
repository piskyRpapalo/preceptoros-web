(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var V = enNode ? require('./valores.js') : raiz.AtlasValores;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
    var ESPERA = [500, 536, 571, 606, 640, 673, 703, 733, 760, 785, 808, 830, 849, 867, 882, 896, 909, 920,
                930, 939, 947, 954, 960, 965, 969, 973, 977, 980, 983, 985, 987, 989, 990];

  function esperado(ra, rb) {
    var d = ra - rb, e = ESPERA[Math.min(32, Math.floor(Math.abs(d) / 25))];
    return d < 0 ? 1000 - e : e;
  }
    function actualiza(ra, rb, resultado, partidas, v) {
    var P = (v || V).combate, prov = partidas < P.provisional_hasta, k = prov ? P.k_provisional : P.k;
    var e = esperado(ra, rb), delta = k * (resultado - e);
    var d = delta >= 0 ? Math.floor((delta + 500) / 1000) : -Math.floor((-delta + 500) / 1000);
    return { esquema: 'atlas.rating_actualizacion/1', antes: ra, despues: ra + d, k: k, esperado: e,
             resultado: resultado, provisional: prov };
  }
    function tabla(resultados, cuentan, v, forma) {
    var P = (v || V).combate, R = {}, N = {};
    cuentan = cuentan || ['humano'];
    resultados.filter(function (r) { return !(forma && forma(r)) && cuentan.indexOf(r.procedencia) >= 0; })
      .map(function (r) { return { r: r, h: K.huella(r) }; })
      .sort(function (a, b) { return a.h < b.h ? -1 : a.h > b.h ? 1 : 0; })
      .forEach(function (x) {
        var r = x.r, a = r.atacante, d = r.defensor;
        [a, d].forEach(function (k) { if (!(k in R)) { R[k] = P.rating_inicial; N[k] = 0; } });
        var sa = r.gana === 'asalto' ? 1000 : r.gana === 'empate' ? 500 : 0;
        var ua = actualiza(R[a], R[d], sa, N[a], v), ud = actualiza(R[d], R[a], 1000 - sa, N[d], v);
        R[a] = ua.despues; R[d] = ud.despues; N[a]++; N[d]++;
      });
    return { ratings: R, partidas: N };
  }

  var AtlasRating = { ESPERA: ESPERA, esperado: esperado, actualiza: actualiza, tabla: tabla };
  if (enNode) { module.exports = AtlasRating; }
  else { raiz.AtlasRating = AtlasRating; }
})(this);
