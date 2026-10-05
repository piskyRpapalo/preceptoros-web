/* preceptoros.org · theGame v1.5 · el ARMY y su puerta de firma.

   NINGUNA TROPA ENTRA SIN FIRMA VERIFICADA (IronClaw: el silicio forja, el
   carbono firma). `adopta` no se fia de que haya un campo `firma`: VERIFICA
   la firma Ed25519 sobre la adopcion con la clave publica, y solo entonces
   escribe. La comprobacion vive DENTRO del camino de escritura y no en quien
   llama (leccion D79b): un llamante nuevo que no la conozca no puede
   saltarsela, porque no hay otro camino.

   LA FORMA DE VERIFICAR SE INYECTA: en la pestana es WebCrypto, en node es
   `crypto`. El fichero no elige plataforma y se prueba igual en las dos.

   EL ARMY SE GUARDA EN ESTE APARATO desde el plan firmado del 2026-10-05 (capa C1: «salir del
   juego hace perder recursos y army: eso se arregla»). La persistencia entra AQUI, detras de esta
   misma puerta, como se dejo dicho: se guardan solo los pares {adopcion, firma} y al volver cada uno
   ENTRA OTRA VEZ POR `adopta`, que re-verifica la firma. Un almacen tocado no mete ni una tropa.
   El almacen se inyecta (`{lee, pon}`): IndexedDB en la pestana, memoria en node. */
(function (raiz) {
  'use strict';

  var V = (typeof module === 'object' && module.exports) ? require('./valores.js') : raiz.AtlasValores;
  var TOPE = V.army_tope;

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
  function crea(verifica, almacen) {
    var army = [];
    function guarda() {
      if (almacen) { almacen.pon(army.map(function (u) { return { adopcion: u.adopcion, firma: u.firma }; })); }
    }
    var yo = {
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
          guarda();
          return u;
        });
      },
      /* Lo guardado vuelve POR `adopta`, en orden: lo que no verifica se queda fuera con su causa,
         y el almacen se reescribe con lo que si entro. */
      restaura: function () {
        if (!almacen) { return Promise.resolve({ entran: 0, fuera: [] }); }
        return Promise.resolve(almacen.lee()).then(function (l) {
          var fuera = [], cadena = Promise.resolve();
          (Array.isArray(l) ? l : []).forEach(function (u) {
            cadena = cadena.then(function () {
              return yo.adopta(u && u.adopcion, u && u.firma).catch(function (e) { fuera.push(e.message); });
            });
          });
          return cadena.then(function () { if (fuera.length) { guarda(); } return { entran: army.length, fuera: fuera }; });
        });
      }
    };
    return yo;
  }

  /* El almacen de la pestana: una base propia `atlas-army` con un unico registro. */
  function almacenWeb() {
    function db() {
      return new Promise(function (ok, mal) {
        var r = raiz.indexedDB.open('atlas-army', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('army'); };
        r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); };
      });
    }
    return {
      lee: function () {
        return db().then(function (d) {
          return new Promise(function (ok) {
            var q = d.transaction('army').objectStore('army').get('mia');
            q.onsuccess = function () { d.close(); ok(q.result || []); }; q.onerror = function () { d.close(); ok([]); };
          });
        }).catch(function () { return []; });
      },
      pon: function (l) {
        db().then(function (d) {
          var tx = d.transaction('army', 'readwrite'); tx.objectStore('army').put(l, 'mia');
          tx.oncomplete = function () { d.close(); };
        }).catch(function () {});
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

  var AtlasArmy = { TOPE: TOPE, adopcion: adopcion, crea: crea, almacenWeb: almacenWeb, verificaWeb: verificaWeb, semillaWeb: semillaWeb };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasArmy; }
  else { raiz.AtlasArmy = AtlasArmy; }
})(this);
