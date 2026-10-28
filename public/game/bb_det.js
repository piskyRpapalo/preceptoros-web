(function (raiz) {
  'use strict';
  // Primitivas deterministas del lenguaje de burbujas (canon 2026-10-03: nada de azar del sistema ni reloj).
  // Ecuaciones:
  //   xorshift32:  x ^= x<<13; x ^= x>>>17; x ^= x<<5   (uint32; la semilla 0 no sale, se cambia por una fija)
  //   u(x)      = x / 2^32                                 (uniforme en [0,1))
  //   hash(a,b,c)= canon (bb_canon.js): a ^ b*73856093 ^ c*19349663, luego xorshift
  //   elige     = primer indice i con sum(p[0..i]) > u*sum(p)  (seleccion ponderada por acumulacion)
  var SEMILLA_CERO = 0x9E3779B9;

  function crea(semilla) {
    var x = semilla >>> 0;
    return { x: x === 0 ? SEMILLA_CERO : x };
  }

  function siguiente(st) {
    var x = st.x;
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 17)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    st.x = x;
    return x;
  }

  function uniforme(st) { return siguiente(st) / 4294967296; }

  // El hash espacial es el CANON registrado (render_seed.js:5-11): ver public/game/bb_canon.js.
  var hash = (typeof module === 'object' && module.exports) ? require('./bb_canon.js').hash : raiz.AtlasBBCanon.hash;

  // pesos: lista de numeros >= 0. Sin peso positivo no hay eleccion: -1 (NO_DATA, no se inventa un indice).
  function elige(st, pesos) {
    var total = 0, i;
    for (i = 0; i < pesos.length; i++) { total += pesos[i] > 0 ? pesos[i] : 0; }
    if (!(total > 0)) { return -1; }
    var r = uniforme(st) * total, acc = 0;
    for (i = 0; i < pesos.length; i++) {
      acc += pesos[i] > 0 ? pesos[i] : 0;
      if (acc > r) { return i; }
    }
    return pesos.length - 1;
  }

  var BBDet = { crea: crea, siguiente: siguiente, uniforme: uniforme, hash: hash, elige: elige,
                SEMILLA_CERO: SEMILLA_CERO };
  if (typeof module === 'object' && module.exports) { module.exports = BBDet; }
  else { raiz.AtlasBBDet = BBDet; }
})(typeof module === 'object' && module.exports ? this : (this || window));
