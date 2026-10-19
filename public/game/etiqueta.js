(function (raiz) {
  'use strict';

  // Etiqueta de un objeto del mapa: <= 1.024 B en UTF-8, con title y rag_base_prompt a primer nivel.
  // Dos etiquetas (propia y vecina) son la percepcion completa de la mini-IA: <= 2.048 B.
  // PURO: ni DOM, ni red, ni reloj, ni azar.

  var TOPE = 1024;
  var TOPE_PAR = 2 * TOPE;
  var OBLIGATORIOS = ['title', 'rag_base_prompt'];

  function bytes(texto) {
    return new TextEncoder().encode(texto).length;
  }

  function ordena(o) {
    var r = {};
    Object.keys(o).sort().forEach(function (k) { r[k] = o[k]; });
    return r;
  }

  function etiqueta(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, motivo: 'el objeto no es un registro' };
    }
    for (var i = 0; i < OBLIGATORIOS.length; i++) {
      var k = OBLIGATORIOS[i];
      if (typeof obj[k] !== 'string' || !obj[k].trim()) {
        return { ok: false, motivo: k + ' ausente o vacio: NO_DATA con causa' };
      }
    }
    var texto;
    try { texto = JSON.stringify(ordena(obj)); }
    catch (e) { return { ok: false, motivo: 'no serializable: ' + e.message }; }
    var n = bytes(texto);
    if (n > TOPE) { return { ok: false, motivo: 'etiqueta de ' + n + ' B supera el techo de ' + TOPE }; }
    return { ok: true, texto: texto, bytes: n };
  }

  function compara(propia, vecina) {
    var a = etiqueta(propia), b = etiqueta(vecina);
    if (!a.ok) { return { ok: false, motivo: 'propia: ' + a.motivo }; }
    if (!b.ok) { return { ok: false, motivo: 'vecina: ' + b.motivo }; }
    var total = a.bytes + b.bytes;
    if (total > TOPE_PAR) { return { ok: false, motivo: 'par de ' + total + ' B supera ' + TOPE_PAR }; }
    return { ok: true, bytes: total, par: [a.texto, b.texto] };
  }

  var AtlasEtiqueta = { TOPE: TOPE, TOPE_PAR: TOPE_PAR, etiqueta: etiqueta, compara: compara, bytes: bytes };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasEtiqueta; }
  else { raiz.AtlasEtiqueta = AtlasEtiqueta; }
})(this);
