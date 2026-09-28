/* preceptoros.org · theGame · multijugador · el RATING: un Elo ENTERO y LOCAL.

   Cada aparato lo calcula de los resultados verificados que tiene (`arena.compruebaResultado`): no hay
   clasificacion central. Por defecto solo cuentan los duelos `humano`; los `sintetico` (patrullas,
   pruebas) se etiquetan y no puntuan. Sin un solo decimal en ejecucion: la esperanza sale de una
   tabla precalculada y el redondeo es simetrico (lo que gana uno lo pierde el otro, exacto).
   PURO: ni DOM, ni red, ni reloj. Se separo de `arena.js` por tamano (se parte, no se recorta). */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var V = enNode ? require('./valores.js') : raiz.AtlasValores;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  /* Esperanza por mil de un Elo, 1000 / (1 + 10^(-d/400)), en tramos de 25 puntos de 0 a 800,
     precalculada y escrita en enteros: en ejecucion no hay ni un decimal. */
  var ESPERA = [500, 536, 571, 606, 640, 673, 703, 733, 760, 785, 808, 830, 849, 867, 882, 896, 909, 920,
                930, 939, 947, 954, 960, 965, 969, 973, 977, 980, 983, 985, 987, 989, 990];

  function esperado(ra, rb) {
    var d = ra - rb, e = ESPERA[Math.min(32, Math.floor(Math.abs(d) / 25))];
    return d < 0 ? 1000 - e : e;
  }
  /* `resultado` en milesimas para A: 1000 gana, 500 empate, 0 pierde. Redondeo simetrico: lo que
     gana uno lo pierde el otro, exacto. */
  function actualiza(ra, rb, resultado, partidas, v) {
    var P = (v || V).combate, prov = partidas < P.provisional_hasta, k = prov ? P.k_provisional : P.k;
    var e = esperado(ra, rb), delta = k * (resultado - e);
    var d = delta >= 0 ? Math.floor((delta + 500) / 1000) : -Math.floor((-delta + 500) / 1000);
    return { esquema: 'atlas.rating_actualizacion/1', antes: ra, despues: ra + d, k: k, esperado: e,
             resultado: resultado, provisional: prov };
  }
  /* La tabla LOCAL: resultados verificados, en orden canonico (su huella), solo de las procedencias
     que se cuentan (por defecto, `humano`). */
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
