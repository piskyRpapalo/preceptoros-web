/* preceptoros.org · theGame v1.5 · el ARMY y su puerta de firma.

   NINGUNA TROPA ENTRA SIN FIRMA VERIFICADA (IronClaw: el silicio forja, el
   carbono firma). `adopta` no se fia de que haya un campo `firma`: VERIFICA
   la firma Ed25519 sobre la adopcion con la clave publica, y solo entonces
   escribe. La comprobacion vive DENTRO del camino de escritura y no en quien
   llama (leccion D79b): un llamante nuevo que no la conozca no puede
   saltarsela, porque no hay otro camino.

   LA FORMA DE VERIFICAR SE INYECTA: en la pestana es WebCrypto, en node es
   `crypto`. El fichero no elige plataforma y se prueba igual en las dos.

   HOY EL ARMY VIVE EN LA PESTANA, como toda la v1. La directiva v1.5 pide
   IndexedDB; guardar la partida es una decision distinta de «v1 no guarda
   nada» (sello de las nueve lenguas) y queda PENDIENTE DE FIRMA. Cuando se
   firme, la persistencia entra aqui, detras de esta misma puerta. */
(function (raiz) {
  'use strict';

  var TOPE = 60;

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  /* Lo que se firma al adoptar: la tropa entera (su JSON canonico, el mismo
     que hace `Identity.firmar`) y quien la adopta. */
  function adopcion(tropa, pseudonimo, clave) {
    return { esquema: 'atlas.adopcion/1', tropa: tropa, pseudonimo: pseudonimo, clave_publica: clave };
  }

  /* `verifica(texto, firmaHex, claveHex) -> Promise<bool>`. */
  function crea(verifica) {
    var army = [];
    return {
      lista: function () { return army.slice(); },
      /* La unica forma de meter una tropa. Rechaza con su motivo; nunca
         devuelve un «vale» a medias. */
      adopta: function (ad, firma) {
        if (!ad || ad.esquema !== 'atlas.adopcion/1' || !ad.tropa || ad.tropa.esquema !== 'atlas.tropa/1') {
          return Promise.reject(new Error('forma: adopcion'));
        }
        var m = /^ed25519:([0-9a-f]{128})$/.exec(firma || '');
        if (!m) { return Promise.reject(new Error('sin firma')); }
        if (!/^[0-9a-f]{64}$/.test(ad.clave_publica || '')) { return Promise.reject(new Error('forma: clave')); }
        if (army.length >= TOPE) { return Promise.reject(new Error('army lleno (' + TOPE + ')')); }
        if (army.some(function (a) { return a.adopcion.tropa.semilla === ad.tropa.semilla; })) {
          return Promise.reject(new Error('ya adoptada'));
        }
        return Promise.resolve(verifica(JSON.stringify(ad), m[1], ad.clave_publica)).then(function (ok) {
          if (!ok) { throw new Error('firma: no verifica'); }
          var u = { adopcion: ad, firma: firma };
          army.push(u);
          return u;
        });
      }
    };
  }

  /* El verificador de la pestana: WebCrypto Ed25519 con la clave publica en
     crudo (la misma que da `Identity.publica`). */
  function verificaWeb(texto, firmaHex, claveHex) {
    function bytes(h) { return new Uint8Array(h.match(/../g).map(function (x) { return parseInt(x, 16); })); }
    var s = raiz.crypto && raiz.crypto.subtle;
    if (!s) { return Promise.reject(new Error('NO_DATA · sin WebCrypto')); }
    return s.importKey('raw', bytes(claveHex), { name: 'Ed25519' }, false, ['verify'])
      .then(function (k) {
        return s.verify({ name: 'Ed25519' }, k, bytes(firmaHex), new TextEncoder().encode(texto));
      });
  }

  /* La semilla de una invocacion: sha256 de su firma. */
  function semillaWeb(firma) {
    return raiz.crypto.subtle.digest('SHA-256', new TextEncoder().encode(firma)).then(hex);
  }

  var AtlasArmy = { TOPE: TOPE, adopcion: adopcion, crea: crea, verificaWeb: verificaWeb, semillaWeb: semillaWeb };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasArmy; }
  else { raiz.AtlasArmy = AtlasArmy; }
})(this);
