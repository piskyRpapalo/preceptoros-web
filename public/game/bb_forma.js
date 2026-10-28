(function (raiz) {
  'use strict';
  // Forma de Fourier del lenguaje de burbujas: cada contorno es la EVALUACION de una ecuacion, nunca un dibujo a mano.
  //   r(theta) = sum_k a_k * sin(k*theta + phi_k)        terminos = [[k, a_k, phi_k], ...]
  //   punto(theta) = (r*cos(theta), r*sin(theta))
  // Sin terminos con amplitud > 0 no hay forma: null (NO_DATA, no se dibuja nada).
  // El color sale SOLO de la tabla fisica (tabla_semantica.js). Un sello fuera de la tabla devuelve null.
  var TABLA = (typeof module === 'object' && module.exports) ? require('./tabla_semantica.js') : raiz.AtlasSemantica;

  function radio(terminos, theta) {
    var r = 0;
    for (var i = 0; i < terminos.length; i++) {
      var t = terminos[i];
      r += t[1] * Math.sin(t[0] * theta + t[2]);
    }
    return r;
  }

  function sinForma(terminos) {
    if (!terminos || !terminos.length) { return true; }
    for (var i = 0; i < terminos.length; i++) { if (terminos[i][1] > 0) { return false; } }
    return true;
  }

  function contorno(terminos, n) {
    if (sinForma(terminos) || !(n >= 3)) { return null; }
    var pts = [];
    for (var j = 0; j < n; j++) {
      var th = (2 * Math.PI * j) / n, r = radio(terminos, th);
      pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
    }
    return pts;
  }

  function colorDe(sello) {
    var hue = TABLA.hueDe(sello);
    return hue === null ? null : { sello: sello, hue: hue };
  }

  var BBForma = { radio: radio, contorno: contorno, colorDe: colorDe, sinForma: sinForma };
  if (typeof module === 'object' && module.exports) { module.exports = BBForma; }
  else { raiz.AtlasBBForma = BBForma; }
})(typeof module === 'object' && module.exports ? this : (this || window));
