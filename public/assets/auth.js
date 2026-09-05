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
  // 64 bytes de firma Ed25519 -> 128 caracteres hex. Es la longitud del
  // algoritmo, no una preferencia: si sale otra cosa, algo se rompio.
  var FIRMA_HEX = 128;
  var block = document.getElementById('i18n');
  var zona = document.getElementById('identity');
  if (!block || !zona) return;
  var T = JSON.parse(block.textContent);
  var yo = null;

  /* EL MENU DE IDENTIDAD ES UN POPOVER NATIVO. El navegador pone la capa
     superior, el cierre con Escape, el cierre al pulsar fuera y el foco. No
     habia logica manual de toggle que quitar --nunca la hubo-- y aqui no se
     escribe una: `popovertarget` en el boton y ya esta.

     Se crea en JS y no en las tres portadas por una razon medida: a
     `fr/index.html` le quedaban 533 B. Aqui cuesta CERO bytes de HTML, y
     ademas este fichero ya construye toda su interfaz asi. */
  var menu = document.createElement('div');
  menu.id = 'identity-menu';
  menu.popover = 'auto';
  document.body.appendChild(menu);

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
    menu.innerHTML = '';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'leve';
    b.setAttribute('popovertarget', 'identity-menu');
    if (yo) {
      /* EL NOMBRE ES LA PUERTA, no un rotulo al lado de la puerta. Habia tres
         piezas apiladas --«Hola, X», «Mi perfil» y «Ver mi huella»-- y las
         tres a tamano de boton: en el Doogee eso eran tres filas del cabezal
         para decir quien eres. Ahora el pseudonimo ES el enlace, que ademas es
         donde se busca: se pulsa tu nombre para ver lo tuyo.

         `title` conserva lo que el rotulo decia, para quien pase por encima y
         para quien lea con los oidos: un nombre suelto no anuncia que lleva
         a ningun sitio. */
      b.textContent = T.idClave;
      b.setAttribute('aria-label', T.idClave);
      /* LA PUERTA AL PERFIL VA AQUI Y NO EN EL CABEZAL. El cabezal de la
         portada se midio en el Doogee: siete botones ocupaban tres filas, y
         se bajo a cinco. Un sexto fijo desharia esa medida para todo el
         mundo, incluido quien llega por primera vez y todavia no tiene ficha
         que mirar.

         Colgada de la identidad no cuesta una fila a nadie: aparece cuando
         aparece el pseudonimo, en las cinco paginas que cargan este fichero,
         y es ademas donde se busca -- se pulsa tu nombre para ver lo tuyo.

         `T.idPerfil` puede faltar: no todas las paginas que cargan auth.js
         tienen la clave. Sin ella no se pinta un enlace vacio, no se pinta
         nada. Y en la propia ficha tampoco, que seria un enlace a si misma. */
      if (T.idPerfil && !/\/profile\.html$/.test(location.pathname)) {
        var mi = document.createElement('a');
        mi.className = 'leve yo-perfil';
        mi.href = './profile.html';
        mi.textContent = yo.apodo;
        mi.title = T.idPerfil;
        zona.appendChild(mi);
      } else {
        // En la propia ficha el nombre no enlaza a si misma: se dice y ya.
        var p = document.createElement('span');
        p.className = 'yo'; p.textContent = yo.apodo;
        zona.appendChild(p);
      }
      // La huella completa, para quien quiera comprobar que su firma es suya.
      // Va al menu y no al hueco: pulsando dos veces, la version anterior
      // apilaba un parrafo mas cada vez.
      var n = document.createElement('p');
      n.className = 'tenue'; n.style.wordBreak = 'break-all';
      menu.appendChild(n);
      crypto.subtle.exportKey('raw', yo.claves.publicKey).then(function (raw) {
        var completa = hex(raw);
        n.textContent = T.idPublica + ' ' + completa;
        /* LA HUELLA, CUANDO EXISTE, SE ENSENA COMO NUMERO CORTO. El boton decia
           «Ver mi huella» y ocupaba una fila entera para no decir ninguna
           huella. Con los seis primeros digitos se reconoce de un vistazo y
           cabe al lado del nombre; la completa sigue estando a un toque, en el
           menu, que es donde se comprueba de verdad.

           Se pone DESPUES de exportar y no antes: si la exportacion fallara,
           el boton se queda con su rotulo en vez de con un hueco. El nombre
           accesible no cambia -- seis digitos no anuncian lo que hace. */
        b.textContent = completa.slice(0, 6);
        b.classList.add('huella-corta');
      });
    } else {
      /* SIN SESION, UN ICONO DE PERSONA Y NADA MAS (2026-09-05, firmado).
         Decia «Crear identidad» con todas sus letras, y en frances y en aleman
         eso es la pieza mas ancha del cabezal para ofrecer algo que la mayoria
         no va a hacer en su primera visita. El dibujo de una persona lo dice
         en las ocho lenguas y ocupa lo que un dedo necesita.

         EL ROTULO NO DESAPARECE, cambia de sitio: va al nombre accesible y al
         `title`, asi que quien lee con los oidos y quien pasa el cursor
         reciben la frase entera. Un icono sin nombre accesible es un boton
         mudo, y eso no es simplificar: es esconder.

         Y el panel que abre sigue siendo el mismo popover con el aviso de que
         la clave no se recupera. Lo que se ha encogido es la puerta, no lo que
         hay detras. */
      b.className = 'leve identity-icono';
      b.setAttribute('aria-label', T.idEntrar);
      b.title = T.idEntrar;
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
        + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
        + ' aria-hidden="true"><circle cx="12" cy="8" r="4"></circle>'
        + '<path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"></path></svg>';
      /* EL AVISO VA ANTES, NO DESPUES. Hasta hoy la clave se generaba al
         pulsar y el «esto no se puede exportar ni recuperar» aparecia cuando
         ya existia. Una identidad irreversible se acepta informado o no se
         acepta: el popover es la unica pantalla entre el boton y la clave. */
      var av = document.createElement('p');
      av.className = 'nodata'; av.textContent = T.idAviso;
      var ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'boton'; ok.textContent = T.idEntrar;
      ok.addEventListener('click', function () {
        if (menu.hidePopover) menu.hidePopover();
        registrar();
      });
      menu.appendChild(av); menu.appendChild(ok);
    }
    zona.appendChild(b);
  }
  function registrar() {
    // Solo para el fallo: el aviso ya se leyo en el menu, antes de pulsar.
    var aviso = document.createElement('p');
    aviso.className = 'nodata';
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
    //
    // LA FIRMA VA ENTERA. Hasta el 2026-08-30 esto devolvia los 16 primeros
    // caracteres y unos puntos suspensivos: `ed25519:a3f9…`. Calculaba los 64
    // bytes y tiraba 48. Se veia bien --parecia una firma-- y no lo era: con
    // 16 nibbles no se puede verificar nada, ni aqui ni en el Agora. Una
    // firma recortada es un adorno con nombre de garantia.
    //
    // Si hace falta acortarla para ENSENARLA, se acorta al pintar, que es
    // donde el recorte no destruye nada. Aqui no.
    firmar: function (obj) {
      if (!yo) return Promise.reject(new Error('sin identidad'));
      var texto = JSON.stringify(obj);
      return crypto.subtle.sign({ name: 'Ed25519' }, yo.claves.privateKey,
        new TextEncoder().encode(texto)).then(function (f) {
          // Ed25519 firma siempre en 64 bytes: 128 caracteres hexadecimales,
          // ni uno mas ni uno menos. Se comprueba en vez de confiarlo -- un
          // dia alguien cambia de curva y aqui nadie se entera.
          var h = hex(f);
          if (h.length !== FIRMA_HEX) {
            return Promise.reject(new Error(
              'firma de ' + h.length + ' caracteres, se esperaban ' + FIRMA_HEX));
          }
          return { firma: 'ed25519:' + h, autor: yo.apodo, algoritmo: 'Ed25519' };
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
