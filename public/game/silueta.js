(function (raiz) {
  'use strict';

  // Silueta matricial: silhouette_hex de 64 a 256 caracteres, solo [0-9a-f]. PURO: ni DOM, ni red, ni reloj, ni azar.
  // Contraste, consentimiento y correspondencia acustica no se miden aqui: son NO_DATA con causa.

  var ESQUEMA = 'preceptoros.silueta/1';
  var MIN = 64, MAX = 256;
  var HEX = /^[0-9a-f]+$/;
  var INYECCION = /[<>"'`]|https?:|javascript:|data:|url\(/i;
  var NO_DATA = {
    contraste: 'NO_DATA (contraste): no hay umbral medido en este arbol',
    consentimiento: 'NO_DATA (consentimiento): el envio no pasa por este modulo',
    correspondencia: 'NO_DATA (correspondencia): no hay acorde ni texto medidos para esta silueta'
  };

  function valida(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { return { ok: false, motivo: 'no es un registro' }; }
    var claves = Object.keys(obj).sort().join(',');
    if (claves !== 'esquema,silhouette_hex') { return { ok: false, motivo: 'campos distintos de esquema y silhouette_hex' }; }
    if (obj.esquema !== ESQUEMA) { return { ok: false, motivo: 'esquema distinto de ' + ESQUEMA }; }
    var h = obj.silhouette_hex;
    if (typeof h !== 'string') { return { ok: false, motivo: 'silhouette_hex no es texto' }; }
    if (INYECCION.test(h)) { return { ok: false, motivo: 'inyeccion HTML/SVG/URL' }; }
    if (!HEX.test(h)) { return { ok: false, motivo: 'caracteres fuera de [0-9a-f]' }; }
    if (h.length < MIN) { return { ok: false, motivo: 'silueta de ' + h.length + ' caracteres, menos de ' + MIN }; }
    if (h.length > MAX) { return { ok: false, motivo: 'silueta de ' + h.length + ' caracteres, mas de ' + MAX }; }
    return { ok: true, longitud: h.length };
  }

  var AtlasSilueta = { ESQUEMA: ESQUEMA, MIN: MIN, MAX: MAX, NO_DATA: NO_DATA, valida: valida };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSilueta; }
  else { raiz.AtlasSilueta = AtlasSilueta; }
})(this);
