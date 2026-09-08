/* preceptoros.org · EL CABEZAL, UNO SOLO PARA TODO EL SITIO.
 *
 * POR QUE NACE (2026-09-07). Habia DOS cabezales y ninguno de los dos lo
 * sabia. La portada montaba el suyo en `hub.js` --cuatro puertas, la rueda con
 * los idiomas, la frase de energia-- y las paginas interiores montaban otro en
 * `nav.js`: los mismos cuatro enlaces, con los mismos rotulos, en otra caja y
 * sin rueda, sin frase y sin identidad. Se parecian porque alguien los habia
 * igualado a mano ese mismo dia, que es exactamente la forma en que dos cosas
 * vuelven a separarse.
 *
 * El Soberano lo cerro con una frase: «lo mejor seria simplemente dejar el
 * cabezal de home, iluminando un poco la nube que contiene el nombre de la
 * pestana donde esta el usuario». Asi que no hay dos cabezales parecidos: hay
 * uno, y la pagina donde estas se enciende.
 *
 * EL MARCADO LO PONE ESTE FICHERO, no la pagina. Cada portada trae la rueda
 * entera escrita a mano --su SVG son casi 900 B-- y multiplicarla por las
 * veinticuatro paginas interiores habria pasado del tope a `el/instalar.html`,
 * que ya iba a 15.318 B de 16.384. Aqui la pagina solo pone su TITULO:
 *
 *     <header id="cabezal" data-cabezal="community">
 *       <div class="marca"><h1>...</h1></div>
 *     </header>
 *
 * y son 130 B contra los 406 que costaba la cabecera vieja. Las interiores
 * ADELGAZAN al ganar cabezal, que es lo contrario de lo que suele pasar.
 *
 * LA PORTADA NO SE TOCA. Trae su cabezal escrito en el html desde hace
 * semanas y hay reglas y pruebas colgadas de esa estructura; este fichero
 * comprueba pieza por pieza y solo crea LO QUE FALTA. Asi el refactor no
 * cambia un pixel alli --que es lo que el gate demuestra-- y las interiores
 * reciben lo mismo sin una segunda version.
 *
 * DOS ORIGENES PARA LOS ROTULOS, y no es un descuido. La portada los tiene en
 * su bloque `#i18n` y se leen SINCRONOS: una cabecera que aparece medio
 * segundo tarde se lee como una pagina rota. Las interiores no siempre tienen
 * ese bloque --`instalar.html` no lo tiene, sus textos viven en
 * `/instalar.json`-- asi que ahi se piden a `/nav.json`, que es donde ya
 * vivian los rotulos de la navegacion interior.
 */
(function () {
  var cab = document.getElementById('cabezal');
  if (!cab) return;

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
  function marcaPartida(clase, href, texto) {
    var a = el('a', clase); a.href = href;
    a.appendChild(el('span', 'lor', texto.slice(0, 3)));
    a.appendChild(el('span', 'atelier', texto.slice(3)));
    return a;
  }

  var RUEDA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
    + ' aria-hidden="true"><circle cx="12" cy="12" r="3"></circle>'
    + '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06'
    + '-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09'
    + 'A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83'
    + 'l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09'
    + 'A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83'
    + 'l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09'
    + 'a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83'
    + 'l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4'
    + 'h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';

  /* --- lo que falte, se pone -------------------------------------------------
     Pieza por pieza y por `id`, nunca «si es interior monta todo»: la portada
     y las interiores comparten cabezal precisamente porque nadie pregunta en
     que pagina esta. La septima pagina que se escriba trae su cabezal por
     traer su `<header id="cabezal">`, sin tocar esto. */
  function falta(id) { return !document.getElementById(id); }

  var fila = cab.querySelector('.cab-fila');
  if (!fila) {
    fila = el('div', 'cab-fila');
    var marca = cab.querySelector('.marca');
    cab.insertBefore(fila, cab.firstChild);
    if (marca) fila.appendChild(marca);
  }
  /* --- LA ESQUINA ES UNA PIEZA, NO DOS COORDENADAS -------------------------
     El Soberano: «vigila el boton de perfil del usuario» y «debe ser el
     hermano del de ajustes». Lo era sobre el papel y no en pantalla: medido a
     375 px, la rueda en 315,27 y el perfil en 310,107 -- ochenta pixeles de
     separacion y en renglones distintos, que es el «circulo suelto que no
     pertenece a nada» que ya se reporto una vez.

     Y LA CAUSA NO ERA UN NUMERO MAL PUESTO. `esquina.css` colocaba a los dos a
     mano, con `top` y `right` propios, en TRES franjas de anchura distintas: un
     par de gemelos definido por aritmetica en seis reglas. El comentario que
     hay alli dice «los dos dibujos juntos y contra el canto» -- y era verdad
     cuando se escribio; despues la rueda paso a `position:absolute` y nadie
     volvio a leer aquella frase. La prosa describia una intencion que el codigo
     habia dejado de cumplir, y ese es el defecto que se repite, no el offset.

     Asi que no se reajusta: se quita la posibilidad. Los dos mandos entran en
     UNA caja y la caja es la que se ancla. A partir de aqui su distancia es
     estructura, no cuentas, y ninguna consulta de medios puede separarlos
     porque no hay dos cosas que colocar.

     EL PANEL DE AJUSTES SE QUEDA FUERA, y esto si es una cuenta que hay que
     saber: `.cab-esquina` va absoluta, asi que seria el bloque contenedor de
     todo lo que lleve dentro -- y el desplegable cuelga con `top:calc(100%)`,
     que dentro de una caja de noventa pixeles significa «debajo de los
     iconos», no «debajo del cabezal». Se queda colgando de `#cabezal`, que es
     lo que ese `100%` tiene que medir. */
  var esquina = cab.querySelector('.cab-esquina');
  if (!esquina) {
    esquina = el('div', 'cab-esquina');
    cab.appendChild(esquina);
  }

  if (falta('panel-ajustes')) {
    var zona = el('div', 'lateral-zona');
    var boton = el('button', 'lateral-boton rueda');
    boton.type = 'button'; boton.id = 'rueda';
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-controls', 'panel-ajustes');
    boton.innerHTML = RUEDA;
    var rot = el('span', 'sr'); rot.dataset.rotulo = 'ajustes';
    boton.appendChild(rot);
    esquina.appendChild(boton);
    var pa = el('section', 'cerrado'); pa.id = 'panel-ajustes';
    zona.appendChild(pa);
    fila.insertBefore(zona, fila.firstChild);
  }
  if (falta('cab-solar')) {
    var s = el('p', 'cab-solar'); s.id = 'cab-solar'; fila.appendChild(s);
  }
  /* `auth.js` busca `#identity` y SE CALLA si no esta: sin esta linea el boton
     de crear identidad desapareceria de las interiores sin un solo error en
     consola. Es la misma trampa que la prueba del cabezal ya vigila. */
  if (falta('identity')) {
    var i = el('div', 'fila identity'); i.id = 'identity'; esquina.appendChild(i);
  }
  /* En la portada las dos piezas ya existen en el marcado, sueltas en la fila.
     Se MUEVEN, no se duplican: `auth.js` busca `#identity` por su id y le da
     igual de quien cuelgue, y el boton de la rueda lo ata `chat-panel.js`
     tambien por id. Mover un nodo no rompe a quien lo busca; copiarlo si.

     EL PERFIL ENTRA PRIMERO Y LA RUEDA DESPUES, y ese orden lleva firmado
     desde el 2026-09-06 en otro fichero: la rueda toma el canto y la cuenta
     crece hacia la izquierda, que es donde hay sitio. «Un mando que cambia de
     sitio segun si has entrado es un mando que hay que buscar dos veces»: con
     sesion el perfil se ensancha --nombre y huella-- y si estuviera fuera
     empujaria a la rueda contra el borde y luego fuera de el. */
  var identYa = document.getElementById('identity');
  if (identYa && identYa.parentNode !== esquina) esquina.appendChild(identYa);
  var ruedaYa = document.getElementById('rueda');
  if (ruedaYa && ruedaYa.parentNode !== esquina) esquina.appendChild(ruedaYa);

  if (falta('cab-nav')) {
    var n = el('nav'); n.id = 'cab-nav'; cab.appendChild(n);
  }
  /* LA CARA VA LA ULTIMA y fuera de la fila: `cara.css` la coloca absoluta
     contra el canto del cabezal, y el hueco se lo reserva el propio cabezal
     con su `padding-right`. */
  if (!cab.querySelector('.presentacion')) {
    var p = el('div', 'presentacion');
    var e = el('div', 'esfera');
    e.setAttribute('role', 'img');
    e.setAttribute('aria-label', 'Preceptor');
    p.appendChild(e); cab.appendChild(p);
  }

  /* --- los rotulos, de donde los haya ---------------------------------------- */
  var bloque = document.getElementById('i18n');
  if (bloque) {
    try { vestir(JSON.parse(bloque.textContent)); return; } catch (err) { /* sigue */ }
  }
  fetch('/nav.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var lang = document.documentElement.lang;
      var t = (d.textos || {})[lang] || (d.textos || {}).es || {};
      vestir({ cabHome: t.home, cabBenchmark: t.benchmark, cabComunidad: t.comunidad,
               cabInstala: t.instala, cabIdioma: t.idioma, cabSolar: t.solar,
               ajustes: t.ajustes });
    })
    .catch(function () { /* sin catalogo, cabezal sin rotulos antes que medio
                            cabezal con nombres de dos epocas */ });

  function vestir(T) {
    /* --- LAS CUATRO PUERTAS ------------------------------------------------
       El orden no es decorativo y lo vigila el gate: INICIO porque es el
       sitio, LoRAtelier segundo porque es el producto principal de esta web,
       COMUNIDAD despues e INSTALAR el ultimo, que es lo que se hace cuando ya
       se ha visto lo demas.

       LA PAGINA DONDE ESTAS SE ENCIENDE, y ese es el encargo: «iluminando un
       poco la nube que contiene el nombre de la pestana donde esta el
       usuario». Se marca con `aria-current` --que es el dato, y lo lee tambien
       quien navega con los oidos-- y el color lo pone la hoja. Y SE QUEDA SIN
       `href`: un boton que lleva donde ya estas gasta un toque y no hace nada. */
    var nav = document.getElementById('cab-nav');
    if (!nav) return;
    nav.innerHTML = '';
    var base = './';
    var aqui = location.pathname;
    var puertas = [
      ['cab-boton', T.cabHome, '', false],
      ['cab-boton loratelier', T.cabBenchmark, 'benchmark.html', true],
      ['cab-boton', T.cabComunidad, 'community.html', false],
      ['cab-boton empezar', T.cabInstala, 'instalar.html', false]
    ];
    puertas.forEach(function (p) {
      var clase = p[0], rotulo = p[1], hoja = p[2], partida = p[3];
      if (!rotulo) return;
      var url = base + hoja;
      /* Se compara contra el ULTIMO tramo y no contra la url entera: `./`
         resuelto desde `/es/community.html` no es `/es/` sino `/es/`, pero
         desde `/es/` con `index.html` explicito tampoco coincide. El nombre de
         la hoja es lo unico estable en las dos formas de escribir la misma
         direccion. */
      var hojaAqui = aqui.slice(aqui.lastIndexOf('/') + 1);
      var actual = hoja ? hojaAqui === hoja
                        : (hojaAqui === '' || hojaAqui === 'index.html');
      var n;
      if (partida) {
        n = marcaPartida(clase, url, rotulo);
      } else {
        n = el('a', clase, rotulo); n.href = url;
      }
      if (actual) {
        n.removeAttribute('href');
        n.setAttribute('aria-current', 'page');
      }
      nav.appendChild(n);
    });

    /* --- LA RUEDA: los idiomas ---------------------------------------------
       SE DESCUBREN DE LA PROPIA PAGINA. La lista estaba a mano --es, en, fr--
       y al entrar el portugues se quedo vieja en silencio: la lengua existia,
       el sitemap la ofrecia, el selector de la raiz la tenia, y la rueda no.
       Las etiquetas `hreflang` ya declaran que lenguas hay y se generan con la
       pagina, asi que la proxima aparece aqui sola.

       Y AQUI ESTA LA CONDICION QUE HAY QUE RECORDAR: una pagina interior solo
       declara `hreflang` de las lenguas que TIENE. Si un dia una interior
       aparece con tres y la portada con ocho, la rueda dira tres -- y sera
       verdad, porque saltar a una lengua que esa pagina no tiene es un 404. */
    var ajustes = document.getElementById('panel-ajustes');
    if (ajustes && !ajustes.querySelector('.ajuste-idioma')) {
      if (T.cabIdioma) ajustes.appendChild(el('p', 'panel-rotulo', T.cabIdioma));
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
    }

    /* Los dos mandos nacian SIN NOMBRE: su `<span data-rotulo>` vacio y nadie
       lo rellenaba, asi que un lector de pantalla los anunciaba como «boton» y
       ya. Va en un bucle sobre el atributo --no uno por boton-- para que el
       tercer mando que se anada salga nombrado sin tocar esto. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-rotulo]'),
      function (n) { var t = T[n.dataset.rotulo]; if (t) n.textContent = t; });

    /* La declaracion solar. No es un boton: es una afirmacion sobre quien
       sirve esto, asi que se lee y no se pulsa. `Powered` va aparte y en verde
       --es la palabra que dice de donde sale la energia-- y sin nombrar al
       proveedor: la frase afirma que hay uno, no cual, asi que no miente el
       dia que cambie. */
    var solar = document.getElementById('cab-solar');
    if (solar && !solar.firstChild && T.cabSolar) {
      solar.appendChild(el('b', 'solar-powered', 'Powered'));
      solar.appendChild(document.createTextNode(' · ' + T.cabSolar));
    }
  }
})();
