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
      /* P9 · POLVO DE TALLER: la UNICA forma de sacar una tropa. Exige el recibo `atlas.taller/1` de
         desintegrar, firmado por la MISMA clave que la adopto; verifica la firma aqui dentro, como `adopta`. */
      retira: function (rec, firma) {
        var m = /^ed25519:([0-9a-f]{128})$/.exec(firma || '');
        if (!rec || rec.esquema !== 'atlas.taller/1' || rec.op !== 'desintegra' || !m) { return Promise.reject(new Error('forma: recibo')); }
        var i = army.map(function (u) { return u.adopcion.tropa.semilla; }).indexOf(rec.semilla);
        if (i < 0) { return Promise.reject(new Error('no esta en el army')); }
        if (army[i].adopcion.clave_publica !== rec.clave_publica) { return Promise.reject(new Error('otra clave')); }
        return Promise.resolve(verifica(JSON.stringify(rec), m[1], rec.clave_publica)).then(function (ok) {
          if (!ok) { throw new Error('firma: no verifica'); }
          var u = army.splice(i, 1)[0];
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

  /* Una caja de la pestana: su propia base con un unico registro. db.js es la unica puerta de
     almacenamiento del juego; ui.js y ui-arena.js no tocan IndexedDB (test_v15, Conquista). */
  function caja(base, almacen, clave) {
    function db() {
      return new Promise(function (ok, mal) {
        var r = raiz.indexedDB.open(base, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(almacen); };
        r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); };
      });
    }
    return {
      lee: function () {
        return db().then(function (d) {
          return new Promise(function (ok) {
            var q = d.transaction(almacen).objectStore(almacen).get(clave);
            q.onsuccess = function () { d.close(); ok(q.result || null); }; q.onerror = function () { d.close(); ok(null); };
          });
        }).catch(function () { return null; });
      },
      pon: function (v) {
        db().then(function (d) {
          var tx = d.transaction(almacen, 'readwrite'); tx.objectStore(almacen).put(v, clave);
          tx.oncomplete = function () { d.close(); };
        }).catch(function () {});
      }
    };
  }
  /* La calidad elegida (M17). */
  function calidadWeb() { return caja('atlas-calidad', 'calidad', 'modo'); }
  /* La conquista (FIRMO del Soberano, 2026-10-10): el record de los lugares NPC de ESTE aparato. Ganar
     una vez conquista. No da rating ni botin y no entra en el combate. Lee, limpia, suma lo que la
     pestana no tenga y repinta; devuelve la caja para guardar (`pon`) tras cada combate. */
  function conquistasWeb(record, lugares, pinta) {
    var c = caja('atlas-conquista', 'conquista', 'record');
    c.lee().then(function (r) {
      var l = limpiaRecord(r, lugares.map(function (x) { return x.clave; }));
      Object.keys(l).forEach(function (k) { if (!record[k]) { record[k] = l[k]; } });
      pinta();
    });
    return c;
  }
  /* Lo que vuelve del almacen no se cree: solo lugares conocidos y cuentas enteras >= 0. */
  function limpiaRecord(r, claves) {
    var o = {};
    function ok(n) { return Number.isInteger(n) && n >= 0; }
    if (!r || typeof r !== 'object' || Array.isArray(r)) { return o; }
    claves.forEach(function (k) {
      var x = r[k];
      if (x && typeof x === 'object' && ok(x.g) && ok(x.p)) { o[k] = { g: x.g, p: x.p }; }
    });
    return o;
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

  /* G0 · LA CADENA DE INVOCACIONES (aceptada por el Soberano el 2026-10-11). Cada invocacion es un ESLABON firmado:
     {esquema, tc, seq, prev, clave_publica}, con seq monotono por clave y prev = la semilla del anterior (sha256 de
     su firma). Solo se firma lo que fija la semilla: ni pseudonimo ni ciclo (con ellos, renombrarse o esperar daba
     otra semilla: pesca). Se guarda en el aparato con sus huevos (desde/hasta, datos de pantalla, no firmados), asi
     recargar ya no pierde el huevo con el cobre gastado. Un hueco o una firma que no cuadra: NO_DATA con causa. */
  function eslabon(cadena, tc, clave) {
    var u = cadena[cadena.length - 1];
    return { esquema: 'atlas.invocacion/2', tc: tc, seq: u ? u.obj.seq + 1 : 1, prev: u ? u.semilla : 'genesis', clave_publica: clave };
  }
  function compruebaCadena(cadena) {
    for (var i = 0; i < cadena.length; i++) {
      var e = cadena[i], o = e && e.obj;
      if (!o || o.esquema !== 'atlas.invocacion/2') { return 'eslabon ' + (i + 1) + ': esquema'; }
      if (o.seq !== i + 1) { return 'hueco: se esperaba seq ' + (i + 1) + ' y llega ' + o.seq; }
      if (o.prev !== (i ? cadena[i - 1].semilla : 'genesis')) { return 'eslabon ' + o.seq + ': prev no enlaza'; }
      if (i && o.clave_publica !== cadena[0].obj.clave_publica) { return 'eslabon ' + o.seq + ': otra clave'; }
    }
    return '';
  }
  function anexa(cadena, obj, firma, semilla, desde, hasta) {
    var c = cadena.concat([{ obj: obj, firma: firma, semilla: semilla, desde: desde, hasta: hasta, abierto: false }]), causa = compruebaCadena(c);
    if (causa) { throw new Error('cadena: ' + causa); }
    return c;
  }
  function huevos(cadena) {
    return cadena.filter(function (e) { return !e.abierto; }).map(function (e) { return { tc: e.obj.tc, semilla: e.semilla, desde: e.desde, hasta: e.hasta, seq: e.obj.seq }; });
  }
  function abre(cadena, seq) { return cadena.map(function (e) { return e.obj.seq === seq ? Object.assign({}, e, { abierto: true }) : e; }); }
  /* Al volver: cada firma con su clave y cada semilla con su firma. `verifica` y `sha` se inyectan (web o node). */
  function verificaCadena(cadena, clave, verifica, sha) {
    var causa = compruebaCadena(cadena);
    if (causa) { return Promise.resolve(causa); }
    return cadena.reduce(function (p, e) {
      return p.then(function (c) {
        if (c) { return c; }
        var m = /^ed25519:([0-9a-f]{128})$/.exec(e.firma || '');
        if (!m || e.obj.clave_publica !== clave) { return 'eslabon ' + e.obj.seq + ': firma'; }
        return Promise.resolve(verifica(JSON.stringify(e.obj), m[1], clave)).then(function (ok) {
          if (!ok) { return 'eslabon ' + e.obj.seq + ': firma'; }
          return Promise.resolve(sha(e.firma)).then(function (s) { return s === e.semilla ? '' : 'eslabon ' + e.obj.seq + ': semilla'; });
        });
      });
    }, Promise.resolve(''));
  }
  function cadenaWeb(clave) { return caja('atlas-invocaciones', 'cadena', clave); }
  /* PIEDAD VISIBLE (piezas 1+2, firmadas): se calcula AQUI, en el cliente, desde TU cadena; el rack no lleva la
     cuenta de la suerte de nadie. Solo cuentan los huevos ABIERTOS (lo que aun incuba no se destripa). Cadena con
     hueco: NO_DATA con causa, nunca un numero inventado. `rareza(eslabon)` se inyecta (la gacha decide, aqui no). */
  function piedad(cadena, rareza) {
    var causa = cadena ? compruebaCadena(cadena) : 'sin cadena';
    if (causa) { return { nd: causa }; }
    var abiertos = cadena.filter(function (e) { return e.abierto; }), n = 0;
    for (var i = abiertos.length - 1; i >= 0; i--) { var r = rareza(abiertos[i]); if (r === 'raro' || r === 'unico') { break; } n++; }
    return { desde_raro: n, abiertos: abiertos.length, incubando: cadena.length - abiertos.length };
  }
  /* CRONICA DE DESEOS (pieza 3): cada capsula ABIERTA con su puesto, su ciclo, su sello y lo que salio. */
  function cronica(cadena, tirada) {
    return (cadena || []).filter(function (e) { return e.abierto; }).map(function (e) {
      var t = tirada(e.semilla, e.obj.tc);
      return { seq: e.obj.seq, tc: e.obj.tc, ciclo: e.desde, sello: e.semilla.slice(0, 8), aristas: t.aristas, rareza: t.rareza };
    });
  }

  var AtlasArmy = { TOPE: TOPE, adopcion: adopcion, crea: crea, almacenWeb: almacenWeb, cajaWeb: caja, calidadWeb: calidadWeb, conquistasWeb: conquistasWeb, limpiaRecord: limpiaRecord, verificaWeb: verificaWeb, semillaWeb: semillaWeb,
    eslabon: eslabon, compruebaCadena: compruebaCadena, anexa: anexa, huevos: huevos, abre: abre, verificaCadena: verificaCadena, cadenaWeb: cadenaWeb,
    piedad: piedad, cronica: cronica };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasArmy; }
  else { raiz.AtlasArmy = AtlasArmy; }
})(this);
