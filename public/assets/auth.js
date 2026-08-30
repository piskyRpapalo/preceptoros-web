/* preceptoros.org · identidad soberana. Sin servidor, sin contrasena.
   La clave privada se genera EN EL NAVEGADOR y se guarda NO EXTRAIBLE: vive en
   IndexedDB como objeto CryptoKey, firma cuando se le pide, y ni esta pagina
   ni ninguna otra puede leerla. Es mas fuerte que guardar los bytes.

   EL PRECIO, Y SE DICE ANTES: una clave que nadie puede leer tampoco se puede
   exportar ni copiar a otro aparato. Si borras los datos del sitio, esa
   identidad se pierde y no hay «recuperar contrasena» porque no hay
   contrasena. Es el mismo trato de una llave fisica, y quien firma tiene
   derecho a saberlo antes de firmar.

   localStorage queda fuera por doctrina: la soberania no vive ahi. */
(function () {
  var BD = 'preceptoros', ALMACEN = 'identity', CLAVE = 'me';
  var block = document.getElementById('i18n');
  var zona = document.getElementById('identity');
  if (!block || !zona) return;
  var T = JSON.parse(block.textContent);
  var yo = null;

  function abrir() {
    return new Promise(function (ok, mal) {
      var p = indexedDB.open(BD, 1);
      p.onupgradeneeded = function () { p.result.createObjectStore(ALMACEN); };
      p.onsuccess = function () { ok(p.result); };
      p.onerror = function () { mal(p.error); };
    });
  }
  function tx(modo, fn) {
    return abrir().then(function (db) {
      return new Promise(function (ok, mal) {
        var t = db.transaction(ALMACEN, modo), s = t.objectStore(ALMACEN), r = fn(s);
        t.oncomplete = function () { ok(r && r.result); };
        t.onerror = function () { mal(t.error); };
      });
    });
  }
  function hex(buf) {
    return [].map.call(new Uint8Array(buf), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }
  // El pseudonimo sale del hash de la clave publica: corto, legible y
  // derivado, no elegido. Nadie puede pedir un nombre que ya sea de otro.
  function apodo(pub) {
    return crypto.subtle.exportKey('raw', pub).then(function (raw) {
      return crypto.subtle.digest('SHA-256', raw);
    }).then(function (h) { return 'Tester-' + hex(h).slice(0, 4).toUpperCase(); });
  }

  function pintar() {
    zona.innerHTML = '';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'leve';
    if (yo) {
      var p = document.createElement('span');
      p.className = 'yo'; p.textContent = T.idHola + ' ' + yo.apodo;
      zona.appendChild(p);
      b.textContent = T.idClave;
      b.addEventListener('click', function () {
        // La huella completa, para quien quiera comprobar que su firma es suya.
        crypto.subtle.exportKey('raw', yo.claves.publicKey).then(function (raw) {
          var n = document.createElement('p');
          n.className = 'tenue'; n.style.wordBreak = 'break-all';
          n.textContent = T.idPublica + ' ' + hex(raw);
          zona.appendChild(n);
        });
      });
    } else {
      b.textContent = T.idEntrar;
      b.addEventListener('click', registrar);
    }
    zona.appendChild(b);
  }
  function registrar() {
    var aviso = document.createElement('p');
    aviso.className = 'nodata'; aviso.textContent = T.idAviso;
    zona.appendChild(aviso);
    crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify'])
      .then(function (k) {
        return tx('readwrite', function (s) { s.put(k, CLAVE); }).then(function () { return k; });
      })
      .then(function (k) { return apodo(k.publicKey).then(function (a) { yo = { claves: k, apodo: a }; }); })
      .then(function () {
        pintar();
        document.dispatchEvent(new CustomEvent('preceptor:identity', { detail: { apodo: yo.apodo } }));
      })
      .catch(function (e) {
        aviso.textContent = T.idFallo + ' ' + (e && e.message ? e.message : e);
      });
  }

  window.Identity = {
    quien: function () { return yo && yo.apodo; },
    // La clave PUBLICA en hex. La privada sigue siendo no extraible: esto no
    // afloja nada, solo expone lo que ya es publico por definicion. Hace falta
    // para derivar el codigo de vinculo web<->app del onboarding.
    publica: function () {
      if (!yo) return Promise.reject(new Error('sin identidad'));
      return crypto.subtle.exportKey('raw', yo.claves.publicKey).then(hex);
    },
    // Se firma el JSON canonico del objeto: mismo objeto, misma firma.
    firmar: function (obj) {
      if (!yo) return Promise.reject(new Error('sin identidad'));
      var texto = JSON.stringify(obj);
      return crypto.subtle.sign({ name: 'Ed25519' }, yo.claves.privateKey,
        new TextEncoder().encode(texto)).then(function (f) {
          return { firma: 'ed25519:' + hex(f).slice(0, 16) + '…', autor: yo.apodo };
        });
    }
  };

  tx('readonly', function (s) { return s.get(CLAVE); }).then(function (k) {
    if (!k) { pintar(); return; }
    return apodo(k.publicKey).then(function (a) {
      yo = { claves: k, apodo: a }; pintar();
      document.dispatchEvent(new CustomEvent('preceptor:identity', { detail: { apodo: a } }));
    });
  }).catch(function () { pintar(); });
})();
