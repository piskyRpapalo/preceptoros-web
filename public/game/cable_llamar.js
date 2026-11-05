
(function (raiz) {
  'use strict';
  var ACCION = 'llamar', TOPE_CONTEXTO = 512;

  function ciclo() {
    try { return raiz.AtlasVector && raiz.AtlasVector.leer().c; } catch (e) { return null; }
  }
  function coordenada() {
    try { var k = raiz.AtlasVector && raiz.AtlasVector.leer().k; return k && k.length >= 2 ? [k[0], k[1]] : null; }
    catch (e) { return null; }
  }
  function estadoEsperado() {
    try {
      var v = raiz.AtlasVector && raiz.AtlasVector.leer();
      if (!v || !v.bytes) { return null; }
      return v.bytes;
    } catch (e) { return null; }
  }


  function payload(contexto) {
    var c = ciclo(), k = coordenada(), h = estadoEsperado();
    if (c == null || !k || !h) { return { causa: 'game state not ready: no cycle, coordinate or vector in this tab yet' }; }
    var texto = String(contexto || '').slice(0, TOPE_CONTEXTO);
    return { esquema: 'atlas.nexo/1', pares: {
      version: 'v1', origen: 'web-terminal', accion: ACCION,
      contexto: texto, coordenada: k, hash_de_estado_esperado: h, tic: c } };
  }


  function llama(contexto, pinta) {
    var p = payload(contexto);
    if (p.causa) { pinta({ estado: 'sin-lectura', causa: p.causa }); return; }
    var E = raiz.Enviar;
    if (!E || typeof E.paquete !== 'function') {
      pinta({ estado: 'sin-lectura', causa: 'the send channel of this page is not available yet (window.Enviar)' });
      return;
    }
    E.paquete('atlas.nexo/1', p.pares).then(function (d) {

      pinta({ estado: 'recibo', recibo: d });
    }).catch(function (e) {

      pinta({ estado: 'sin-lectura', causa: (e && e.message ? e.message : 'the call did not reach the lab') });
    });
  }

  var AtlasCableLlamar = { llama: llama, payload: payload, ACCION: ACCION, TOPE_CONTEXTO: TOPE_CONTEXTO };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCableLlamar; }
  else { raiz.AtlasCableLlamar = AtlasCableLlamar; }
})(typeof module === 'object' && module.exports ? this : (this || window));
