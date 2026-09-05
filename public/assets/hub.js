/* preceptoros.org · el cabezal y el panel Modelos.
 *
 * QUE CAMBIO EN LA PUERTA 6, Y POR QUE
 * ------------------------------------
 * Antes esto pintaba una rejilla de ocho tarjetas, la cola de firma y el rack,
 * todo en la portada. Se vio en produccion y era una pared de texto: lo que la
 * gente viene a hacer --hablar-- quedaba debajo de todo lo demas.
 *
 * Ahora el chat es el protagonista y lo demas se pide. El cabezal lleva cuatro
 * botones; los companeros viven en un panel que se abre por la derecha. Y el
 * RACK sale de la web publica entero: la telemetria del rack es del Soberano,
 * no de quien visita, y su sitio es el Ojo.
 *
 * DOS ORIGENES DE TEXTO, Y NO ES UN DESCUIDO
 * ------------------------------------------
 * Los rotulos cortos del cabezal salen del bloque #i18n de la portada (`T`),
 * que es donde el gate de paridad los vigila. Los textos largos del panel
 * viven en `hub.json` (`L`): meterlos en las tres portadas cuesta ~500 B en
 * cada una y `fr/index.html` no los tiene. Cada uno donde cabe.
 */
(function () {
  var cab = document.getElementById('cab-nav');
  var panel = document.getElementById('panel-modelos');
  var bloque = document.getElementById('i18n');
  if (!cab || !panel || !bloque) return;
  var T = JSON.parse(bloque.textContent);
  var L = {}, DATOS = null;

  var ceder = (window.scheduler && window.scheduler.yield)
    ? function () { return window.scheduler.yield(); }
    : function () { return new Promise(function (r) { setTimeout(r, 0); }); };

  function ligero() {
    var c = navigator.connection || {};
    return !!c.saveData ||
      (navigator.deviceMemory && navigator.deviceMemory < 4) ||
      (window.matchMedia && matchMedia('(prefers-reduced-data:reduce)').matches);
  }
  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }
  function enlace(clase, texto, href) {
    var a = el('a', clase, texto); a.href = href; return a;
  }
  // Se parte por longitud, no por dos claves: es un nombre propio sin traducir.
  function marcaPartida(href, texto) {
    var a = el('a', 'cab-boton loratelier'); a.href = href;
    a.appendChild(el('span', 'lor', texto.slice(0, 3)));
    a.appendChild(el('span', 'atelier', texto.slice(3)));
    return a;
  }

  /* --- el cabezal, sincrono ---------------------------------------------
     Se construye antes de pedir nada: una cabecera que aparece medio segundo
     tarde se lee como una pagina rota.

     CUATRO PUERTAS, Y OCUPAN TODO EL ANCHO. Hubo siete botones y en el Doogee
     ocupaban tres filas: el cabezal se comia el 40 % del alto. Se midio en el
     telefono, no en un viewport emulado. De aquella poda, MODELOS se fue al
     desplegable y COLA al panel lateral. */
  cab.appendChild(enlace('cab-boton', T.cabHome, './'));
  /* LoRAtelier va SEGUNDO y partido: es el producto principal de esta web --el
     banco de pruebas comunitario-- y se leia como una seccion mas. «LoR» toma
     el violeta y el canto dorado; «Atelier» queda en blanco. Mismo gesto que
     `Preceptor`+`OS`, y por eso se reconoce sin explicarlo. */
  cab.appendChild(marcaPartida('./benchmark.html', T.cabBenchmark));
  cab.appendChild(enlace('cab-boton', T.cabComunidad, './community.html'));
  /* INSTALAR AQUI cierra la fila. El segundo puesto lo tenia EMPIEZA AQUI --a
     `onboarding.html`--, que decia lo mismo con otras palabras y dejaba la
     instalacion sin puerta propia. `onboarding.html` sigue existiendo. */
  cab.appendChild(enlace('cab-boton empezar', T.cabInstala, './instalar.html'));
  /* EL IDIOMA SALE DE LA FILA y pasa a la rueda, como en la app: es el primer
     paso del recorrido, pero SOLO el primero, y despues ocupaba un quinto del
     ancho para algo que ya no se toca. En la rueda sigue a un toque. */
  var ajustes = document.getElementById('panel-ajustes');
  if (ajustes) {
    ajustes.innerHTML = '';
    ajustes.appendChild(el('p', 'panel-rotulo', T.cabIdioma));
    /* LOS IDIOMAS SE DESCUBREN DE LA PROPIA PAGINA, no se escriben aqui. La
       lista estaba a mano --es, en, fr-- y al entrar el portugues se quedo
       vieja en silencio: la lengua existia, el sitemap la ofrecia, el selector
       de la raiz la tenia, y la rueda no. Un quinto sitio que recordar es un
       quinto sitio que olvidar.

       Las etiquetas `hreflang` de la cabecera YA declaran que lenguas hay, y se
       generan con la pagina. Leerlas de ahi es la version en el navegador de la
       regla que el gate aplica en el disco: el criterio de idiomas se descubre,
       no se repite. La proxima lengua aparece aqui sola. */
    var NOMBRES = {es:'Español', en:'English', fr:'Français', pt:'Português',
                   it:'Italiano', de:'Deutsch', ru:'Русский', el:'Ελληνικά'};
    var vistos = {};
    Array.prototype.forEach.call(
      document.querySelectorAll('link[rel="alternate"][hreflang]'), function (l) {
        var c = l.getAttribute('hreflang');
        if (c === 'x-default' || vistos[c]) return;
        vistos[c] = 1;
        var a = enlace('ajuste-idioma', NOMBRES[c] || c, '/' + c + '/');
        if (document.documentElement.lang === c) a.setAttribute('aria-current', 'true');
        ajustes.appendChild(a);
      });
    // La piel la anade `chat-panel.js`: es un mando, y aqui no cabia.
  }

  /* LOS DOS MANDOS ESTABAN SIN NOMBRE. Su `<span data-rotulo="...">` nacia
     vacio y no lo rellenaba nadie: dos botones cuyo unico contenido es un SVG
     con `aria-hidden`, es decir, dos botones que un lector de pantalla anuncia
     como «boton» y ya. Llevaba asi desde que se escribio el cabezal.

     Se rellena aqui porque aqui vive `T`, y en un bucle sobre el atributo --no
     uno por boton-- para que el tercer mando que se anada salga nombrado sin
     tocar esto.

     El rotulo se queda con su clase `.sr` puesta: quien lee con los oidos lo
     tiene siempre, y en pantalla aparece solo con el panel abierto. Esa parte
     la decide el css --`[aria-expanded]`-- y no este bucle, porque es cuando
     se ve, no que dice. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-rotulo]'), function (n) {
    var t = T[n.dataset.rotulo];
    if (!t) return;
    n.textContent = t;
  });

  /* La declaracion solar, en el cabezal y en los tres idiomas. No es un boton:
     es una afirmacion sobre quien sirve esto, asi que se lee y no se pulsa.

     Es la MISMA clave que pinta el pie. Hubo dos --`pieSolar` decia otra cosa
     parecida-- y se fundieron el 2026-09-04: dos frases sobre el mismo hecho
     terminan divergiendo, y esta se publica en dos sitios de la misma pagina. */
  /* Al centro del cabezal, no al final de la navegacion, donde se leia como un
     pie de la fila. `Powered` va aparte y en verde: es la palabra que dice de
     donde sale la energia. Y sin nombrar al proveedor -- la frase afirma que
     hay uno, no cual, asi que no miente el dia que cambie. */
  var solar = document.getElementById('cab-solar');
  if (solar) {
    solar.innerHTML = '';
    solar.appendChild(el('b', 'solar-powered', 'Powered'));
    solar.appendChild(document.createTextNode(' · ' + T.cabSolar));
  }

  /* Los enlaces de identidad publica van AQUI y en ningun otro sitio: son la
     unica forma de comprobar quien firma esto, y dos copias divergen.

     El DIBUJO vive en `hub-cola.js` desde el 2026-09-05 --aqui no cabian sus
     1,9 KB de rutas--, pero la DECISION se queda: que enlace se pone lo dice
     el catalogo, no una constante. */
  var ident = document.getElementById('cab-ident');
  /* --- el panel Modelos --------------------------------------------------- */
  function hueso(c) { return el('div', 'hueso ' + c); }
  function esqueleto() {
    var g = el('div', 'modelos');
    for (var i = 0; i < 8; i++) {
      var t = el('div', 'modelo esqueleto');
      t.appendChild(hueso('esfera'));
      t.appendChild(hueso('corto')); t.appendChild(hueso('largo'));
      g.appendChild(t);
    }
    return g;
  }
  function tarjeta(a, sinImagen) {
    var b = el('button', 'modelo');
    b.type = 'button'; b.dataset.agente = a.id;
    if (!sinImagen && a.icono3d) {
      var img = document.createElement('img');
      img.src = '/assets/agente-3d-' + a.icono3d + '.webp';
      img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.width = 56; img.height = 56;
      b.appendChild(img);
    } else {
      b.appendChild(el('span', 'modelo-inicial', (a.name || '?').replace(/^El /, '')[0]));
    }
    /* EL NOMBRE ES UNA ETIQUETA, Y UNA ETIQUETA PIDE TRADUCCION. Hasta el
       2026-09-05 el catalogo traia un solo `name` y una sola `function`, en
       castellano, asi que los ocho salian en castellano en la portada inglesa y
       en la francesa -- en paginas por lo demas enteras en su idioma. Se veia
       en pantalla; no lo cazaba ninguna prueba.

       El catalogo conserva `name` y `function` como estaban: son la version
       castellana y el respaldo si un idioma llegara sin traducir. `i18n[lang]`
       manda cuando existe.

       Y aqui NO se escribe ninguno, ni de ejemplo en un comentario: hay una
       prueba que lo prohibe --para que el codigo no pueda inventar agentes que
       el catalogo no tenga-- y busca por el nombre incluso dentro de la prosa.
       Se aprendio poniendola en rojo.

       LAS TRADUCCIONES VIVEN EN LA PORTADA, NO EN EL CATALOGO, y eso se decidio
       midiendo. Estuvieron un rato dentro de `hub.json`, un bloque `i18n` por
       agente: con cuatro lenguas el fichero marcaba 14.012 B de los 16.384 que
       permite el tope, y las ocho previstas no cabian. Repartidas, cada portada
       carga SOLO su lengua --unos 850 B-- en el bloque que ya venia con ella, y
       una lengua nueva no engorda nada de lo que descargan las demas. */
    var voz = (T.agentes && T.agentes[a.id]) || a;
    b.appendChild(el('span', 'modelo-nombre', voz.name || a.name));
    /* La linea de lo que HACE sigue en el marcado y se esconde por css en la
       pastilla: se queda ademas en el `title`, que es donde la lee quien pasa
       el cursor, quien tabula y quien usa lector. Se mantiene el elemento --y
       no solo el atributo-- porque el dia que este panel vuelva a ser tarjetas
       el texto ya esta puesto, y porque un `title` a solas no lo ve quien
       navega con el dedo. */
    b.title = (voz.function || a.function || '');
    b.appendChild(el('span', 'modelo-spec', voz.function || a.function));
    var r = a.real || {};
    b.appendChild(el('span', 'modelo-real ' + (r.disponible ? 'sirve' : 'no-sirve'),
      r.disponible ? L.hubDisponible : L.hubSinAdaptador));
    return b;
  }
  /* SOLO SE PINTA LO QUE ESTA SERVIDO (2026-09-05), y con eso se van el titulo
     y el rotulo de maqueta.

     El rotulo decia «MOCK · 1/8 servido» y existia por una razon buena: una
     rejilla de companeros se ve igual sea catalogo real o inventado, y siete de
     los ocho tenian el estado puesto a mano para poder mirar la interfaz. La
     etiqueta era la unica diferencia visible entre lo real y lo fingido.

     Filtrando por `real.disponible` esa diferencia deja de existir: lo que se
     ve ES lo que hay. Un rotulo que dice «maqueta» sobre una rejilla sin nada
     fingido dentro ya no informa, confunde. Y el titulo se va con el porque el
     mando que abre esto ya se llama Herramientas -- decirlo dos veces a dos
     dedos de distancia es ocupar sitio para nada.

     LOS SIETE NO DESAPARECEN DEL CATALOGO, solo de la pantalla. Siguen en
     `hub.json` con su `causa_no_servido`, que es donde un dato incomodo tiene
     que estar: el dia que se sirva uno, aparece solo y sin tocar este fichero.
     La honestidad no se pierde -- cambia de sitio: antes se declaraba con una
     etiqueta, ahora no hay nada que declarar porque no se muestra nada
     inventado. */
  function pintaPanel() {
    panel.innerHTML = '';
    var g = el('div', 'modelos');
    var sin = ligero();
    (DATOS.agentes || [])
      .filter(function (a) { return a.real && a.real.disponible; })
      .forEach(function (a) { g.appendChild(tarjeta(a, sin)); });
    panel.appendChild(g);
    /* La PUERTA de la cola la pone `hub-cola.js`, que es de quien es: ese
       fichero ya era el dueño del panel de la cola, y tener la puerta aqui y
       la habitacion alli obligaba a este fichero a saber de identidades.
       Ademas hub.js se paso de 10 KB al añadirla. Se parte por lo que es. */
  }
  function falla(causa) {
    panel.innerHTML = '';
    panel.appendChild(el('p', 'nodata', (L.hubFallo || 'NO_DATA ·') + ' ' + causa));
  }

  panel.appendChild(esqueleto());

  function arranca() {
    fetch('/hub.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        DATOS = d;
        if (!d.agentes || !d.agentes.length) throw new Error('catalogo sin agentes');
        /* LOS TEXTOS VIVEN APARTE DESDE EL 2026-09-05. Estaban dentro de
           `hub.json` y solo en tres lenguas: pt, it, de, ru y el caian al
           castellano ENTERAS --el respaldo era por objeto, no por clave-- y
           asi llevaban semanas en el panel, en la cola y en la correccion.
           Las cinco que faltaban no cabian en `hub.json`, que ya iba por 10 KB
           de los 16 del tope. El catalogo es una cosa y su traduccion, otra. */
        return fetch('/hub-textos.json', { cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (tx) {
            var lang = (document.documentElement.lang || 'es').slice(0, 2);
            L = (tx.textos || {})[lang] || (tx.textos || {}).es || {};
            return d;
          });
      })
      .then(function (d) {
        pintaPanel();
        var i = d.identidad || {};
        if (ident && i.github_url && window.HubMarca)
          ident.appendChild(window.HubMarca('GitHub', i.github_url));
        if (ident && i.linkedin_url && window.HubMarca)
          ident.appendChild(window.HubMarca('LinkedIn', i.linkedin_url));
        window.Hub = {
          textos: L, rotulos: T, datos: d, boton: null, panel: panel,
          agente: function (id) {
            return (d.agentes || []).filter(function (a) { return a.id === id; })[0] || null;
          }
        };
        document.dispatchEvent(new CustomEvent('hub:listo'));
        return ceder();
      })
      .catch(function (e) { falla(e && e.message ? e.message : String(e)); });
  }
  if (window.requestIdleCallback) requestIdleCallback(arranca, { timeout: 1500 });
  else setTimeout(arranca, 200);
})();
