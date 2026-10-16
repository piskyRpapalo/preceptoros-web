/* preceptoros.org · theGame · PIEZA C2 · EL CABLE: el visitante llama al lab
   (orden del Soberano: ver con sus ojos el bucle cerrado).
   Botón en la terminal chatbot → aduana VIVA (api.preceptoros.org) → recibo
   pintado en el chat. Eso y nada más.
   CONTRATO (C1, public/nexo-v1.json, atlas.nexo/1): versión, origen (texto),
   acción ('llamar', lista cerrada), contexto + coordenada, hash de estado
   esperado, tic (ciclo de juego: la única vara temporal con autoridad).
   DOBLE FIRMA Ed25519 EN EL NAVEGADOR (precedente de los duelos, sobres.js):
   el reto de la aduana (conReto de enviar.js) + el mensaje del nexo con
   Identity.firmarTexto. La clave privada JAMÁS sale del dispositivo.
   RESPUESTA: recibo con huella o rechazo con causa, pintado en el chat.
   Sin respuesta: estado traducido con la edad del dato (Δ ciclos), nunca
   bloqueo, nunca invención. JAMÁS el literal NO_DATA en texto visible (25.8):
   se traduce («todavía no hay lectura», «el rack aún no tiene dónde…»).
   Cero telemetría camuflada: lo que viaja está DECLARADO en nexo-v1.json.
   Sin reloj de pared: el tic es ciclo de juego; la edad se mide en ciclos. */
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
      return v.bytes; /* el vector acotado ya ES el estado esperado, en bytes */
    } catch (e) { return null; }
  }

  /* El payload del nexo: los campos del contrato, <1 KB. Puro. */
  function payload(contexto) {
    var c = ciclo(), k = coordenada(), h = estadoEsperado();
    if (c == null || !k || !h) { return { causa: 'game state not ready: no cycle, coordinate or vector in this tab yet' }; }
    var texto = String(contexto || '').slice(0, TOPE_CONTEXTO);
    return { esquema: 'atlas.nexo/1', pares: {
      version: 'v1', origen: 'web-terminal', accion: ACCION,
      contexto: texto, coordenada: k, hash_de_estado_esperado: h, tic: c } };
  }

  /* La llamada: reto de la aduana + firma del nexo, por la MISMA puerta de
     enviar.js (una sola salida, dos cargas — su regla del 2026-10-04). */
  function llama(contexto, pinta) {
    var p = payload(contexto);
    if (p.causa) { pinta({ estado: 'sin-lectura', causa: p.causa }); return; }
    var E = raiz.Enviar;
    if (!E || typeof E.paquete !== 'function') {
      pinta({ estado: 'sin-lectura', causa: 'the send channel of this page is not available yet (window.Enviar)' });
      return;
    }
    E.paquete('atlas.nexo/1', p.pares).then(function (d) {
      /* 202 encolado: la aduana vive y la respuesta trae su huella. */
      pinta({ estado: 'recibo', recibo: d });
    }).catch(function (e) {
      /* Sin canal (404/405) u otro error: estado traducido, jamás bloqueo. */
      pinta({ estado: 'sin-lectura', causa: (e && e.message ? e.message : 'the call did not reach the lab') });
    });
  }

  var AtlasCableLlamar = { llama: llama, payload: payload, ACCION: ACCION, TOPE_CONTEXTO: TOPE_CONTEXTO };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCableLlamar; }
  else { raiz.AtlasCableLlamar = AtlasCableLlamar; }
})(typeof module === 'object' && module.exports ? this : (this || window));
