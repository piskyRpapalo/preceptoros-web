/* preceptoros.org · el Perfil, mitad IDENTIDAD. Quien eres y como te enseñas.
 *
 * LA OTRA MITAD ESTA EN `profile-obra.js` --lo que has hecho-- y no es una
 * separacion estetica: las dos juntas pasaban de los 10 KB por fichero que
 * este sitio se impone. Se partio por la costura natural, que es la misma que
 * el visitante ve en la pagina.
 *
 * AQUI NO SE INVENTA UN NOMBRE. El pseudonimo lo deriva `auth.js` del hash de
 * la clave publica: nadie puede pedir el de otro y nadie tiene que recordar
 * uno. Lo unico que se ELIGE es el busto, y se guarda en una base propia
 * (`preceptoros-perfil`) y no en la de la identidad: meter un almacen nuevo en
 * `preceptoros` obligaria a subirle la version, y `auth.js` la abre en la 1 --
 * la identidad dejaria de cargar. Es la misma leccion que board-fuentes.js.
 *
 * SIN IDENTIDAD LA PAGINA NO MIENTE. No se pinta un perfil de ejemplo con un
 * nombre inventado: se dice que no hay identidad y se manda al boton que la
 * crea, que es el mismo de todas las paginas.
 */
(function () {
  var BD = 'preceptoros-perfil', ALMACEN = 'perfil';
  var block = document.getElementById('i18n');
  if (!block) return;
  var T = JSON.parse(block.textContent);
  var idioma = (document.documentElement.lang || 'es').slice(0, 2);
  var zonaId = document.getElementById('perfil-identidad');
  var zonaAv = document.getElementById('perfil-avatar');
  var zonaSh = document.getElementById('perfil-compartir');
  // El busto elegido lo necesitan DOS sitios --la ficha de arriba y la rejilla
  // de abajo-- y llega asincrono. Vive aqui para que no lo lea cada uno por su
  // cuenta y acaben ensenando bustos distintos en la misma pagina.
  var RUTA_BUSTO = '/assets/busto-', POR_DEFECTO = 'ojo', elegido = null;

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
        var t = db.transaction(ALMACEN, modo), r = fn(t.objectStore(ALMACEN));
        t.oncomplete = function () { ok(r && r.result); };
        t.onerror = function () { mal(t.error); };
      });
    });
  }
  // Lo comparte con profile-obra.js: una sola base, un solo sitio donde se
  // abre. Dos ficheros abriendo la misma base con versiones distintas es la
  // averia que esta pagina ya evita con auth.js.
  window.Perfil = {
    leer: function (k) {
      return tx('readonly', function (s) { return s.get(k); })
        .catch(function () { return null; });
    },
    guardar: function (k, v) {
      return tx('readwrite', function (s) { s.put(v, k); })
        .catch(function () { });
    }
  };

  function p(texto, clase) {
    var n = document.createElement('p');
    if (clase) n.className = clase;
    n.textContent = texto;
    return n;
  }

  /* --- identidad ------------------------------------------------------ */
  function pintaIdentidad() {
    if (!zonaId) return;
    zonaId.innerHTML = '';
    var quien = window.Identity && window.Identity.quien();
    if (!quien) {
      zonaId.appendChild(p(T.pfSinIdentidad, 'nodata'));
      return;
    }
    /* EL BUSTO PROPIO NO VA EN `lazy`. Es lo mas grande que se pinta arriba
       del todo: es el LCP de esta pagina. Diferirlo para ahorrar una peticion
       retrasa justo la imagen por la que se mide la carga. Los OCHO de la
       rejilla si van diferidos -- estan mas abajo y son una eleccion, no la
       portada de la ficha. */
    var mio = document.createElement('img');
    mio.className = 'mi-busto'; mio.width = 96; mio.height = 96;
    mio.loading = 'eager'; mio.fetchPriority = 'high'; mio.alt = '';
    mio.src = RUTA_BUSTO + (elegido || POR_DEFECTO) + '.webp';
    zonaId.appendChild(mio);
    /* <address> y no <h2>: el titulo de la seccion ya esta en el HTML, y esto
       es la senas de quien firma la ficha, que es literalmente para lo que
       existe el elemento. */
    var h = document.createElement('address');
    h.className = 'perfil-apodo'; h.textContent = quien;
    zonaId.appendChild(h);
    zonaId.appendChild(p(T.pfDerivado, 'tenue'));
    // La clave publica ENTERA, en un <details>. Es publica por definicion, y
    // quien quiera comprobar que una firma es suya la necesita completa: un
    // prefijo con puntos suspensivos no verifica nada.
    var d = document.createElement('details');
    var s = document.createElement('summary');
    s.textContent = T.pfVerClave;
    var c = document.createElement('code');
    c.style.wordBreak = 'break-all';
    c.textContent = T.pfCargando;
    d.appendChild(s); d.appendChild(c);
    zonaId.appendChild(d);
    window.Identity.publica().then(function (hex) {
      c.textContent = hex;
    }).catch(function (e) {
      c.textContent = T.pfSinClave + ' ' + (e && e.message ? e.message : e);
    });
  }

  /* --- avatar: los ocho bustos ---------------------------------------- */
  function pintaAvatar(cat) {
    if (!zonaAv) return;
    zonaAv.innerHTML = '';
    var rejilla = document.createElement('div');
    rejilla.className = 'bustos';
    rejilla.setAttribute('role', 'radiogroup');
    rejilla.setAttribute('aria-label', T.pfAvatar);
    (cat.bustos || []).forEach(function (b) {
      var bt = document.createElement('button');
      bt.type = 'button'; bt.className = 'busto';
      bt.setAttribute('role', 'radio');
      bt.setAttribute('aria-checked', String(b.id === elegido));
      var img = document.createElement('img');
      img.src = cat.ruta + b.id + '.webp';
      img.width = 96; img.height = 96; img.loading = 'lazy';
      // El alt lleva la descripcion del busto, no «avatar»: quien navega con
      // lector de pantalla esta ELIGIENDO entre ocho, y ocho «avatar» iguales
      // no son una eleccion.
      img.alt = b[idioma] || b.es || b.id;
      bt.appendChild(img);
      var n = document.createElement('span');
      n.textContent = b[idioma] || b.es || b.id;
      bt.appendChild(n);
      bt.addEventListener('click', function () {
        elegido = b.id;
        window.Perfil.guardar('avatar', b.id);
        pintaAvatar(cat);
        pintaIdentidad();          // la ficha de arriba cambia de cara a la vez
      });
      rejilla.appendChild(bt);
    });
    zonaAv.appendChild(rejilla);
  }

  function cargarAvatar() {
    if (!zonaAv) return;
    Promise.all([
      fetch('/bustos.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }),
      window.Perfil.leer('avatar')
    ]).then(function (r) {
      var cat = r[0];
      if (!cat || !Array.isArray(cat.bustos)) throw new Error('sin bustos');
      elegido = r[1] || POR_DEFECTO;
      pintaAvatar(cat);
      pintaIdentidad();
    }).catch(function (e) {
      zonaAv.appendChild(p(T.pfSinBustos + ' ' + (e && e.message ? e.message : e),
                           'nodata'));
    });
  }

  /* --- compartir ------------------------------------------------------ */
  /* NO SE COMPARTE LA CLAVE NI LA BIOGRAFIA. Se comparte la URL de la pagina y
     el pseudonimo, que es lo unico que otra persona puede abrir. Meter la
     clave publica en el texto que va a una red social seria mandar a un
     tercero un dato que aqui no hace falta para nada. */
  function pintaCompartir() {
    if (!zonaSh) return;
    zonaSh.innerHTML = '';
    var quien = (window.Identity && window.Identity.quien()) || null;
    if (!quien) { zonaSh.appendChild(p(T.pfCompartirSin, 'tenue')); return; }
    var url = location.origin + location.pathname;
    var texto = T.pfCompartirTexto.replace('{quien}', quien);
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'boton'; b.textContent = T.pfCompartir;
    var aviso = p('', 'tenue');
    b.addEventListener('click', function () {
      // `navigator.share` abre el selector del sistema; donde no exista, se
      // copia. No hay tercer camino ni boton por red social: cada uno seria
      // una URL a un tercero en una pagina que publica cero peticiones
      // externas.
      if (navigator.share) {
        navigator.share({ title: quien, text: texto, url: url })
          .then(function () { aviso.textContent = T.pfCompartido; })
          .catch(function () { aviso.textContent = ''; });
        return;
      }
      var todo = texto + ' ' + url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(todo).then(function () {
          aviso.textContent = T.pfCopiado;
        }).catch(function () { aviso.textContent = T.pfSinCopiar + ' ' + todo; });
      } else {
        aviso.textContent = T.pfSinCopiar + ' ' + todo;
      }
    });
    var f = document.createElement('div'); f.className = 'fila';
    f.appendChild(b);
    zonaSh.appendChild(f); zonaSh.appendChild(aviso);
  }

  function todo() { pintaIdentidad(); pintaCompartir(); }
  document.addEventListener('preceptor:identity', todo);
  todo();
  cargarAvatar();
})();
