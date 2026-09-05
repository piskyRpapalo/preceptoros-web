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
    b.appendChild(el('span', 'modelo-nombre', a.name));
    b.appendChild(el('span', 'modelo-spec', a.function));
    var r = a.real || {};
    b.appendChild(el('span', 'modelo-real ' + (r.disponible ? 'sirve' : 'no-sirve'),
      r.disponible ? L.hubDisponible : L.hubSinAdaptador));
    return b;
  }
  function pintaPanel() {
    panel.innerHTML = '';
    panel.appendChild(el('h2', 'panel-titulo', L.hubTitulo));
    // El rotulo de honestidad es pequeno y NO desaparece: una rejilla de
    // companeros se ve igual sea catalogo real o maqueta.
    var n = (DATOS.agentes || []).filter(function (a) {
      return a.real && a.real.disponible;
    }).length;
    var rot = el('p', 'panel-rotulo',
      DATOS.estado + ' · ' + n + '/' + (DATOS.agentes || []).length + ' ' + L.hubServido);
    // En el rail solo cabe la cifra, y la cifra dice lo mismo. Lo que no
    // puede pasar es que el rotulo desaparezca.
    rot.dataset.corto = n + '/' + (DATOS.agentes || []).length;
    panel.appendChild(rot);
    var g = el('div', 'modelos');
    var sin = ligero();
    (DATOS.agentes || []).forEach(function (a) { g.appendChild(tarjeta(a, sin)); });
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
        var lang = (document.documentElement.lang || 'es').slice(0, 2);
        L = (d.textos || {})[lang] || (d.textos || {}).es || {};
        if (!d.agentes || !d.agentes.length) throw new Error('catalogo sin agentes');
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
