/* preceptoros.org · LO QUE EL CABEZAL DICE. `cabezal.js` monta el mueble.
 *
 * POR QUE SON DOS FICHEROS. `cabezal.js` llego a 16.580 B de un tope de 16.384
 * el 2026-09-08, y en este arbol se parte antes que recortar: los comentarios
 * son la documentacion y quitarlos para que quepa es pagar el tope con lo unico
 * que no se puede volver a deducir del codigo.
 *
 * LA COSTURA ES LA QUE EL PROPIO FICHERO YA TENIA MARCADA. Alli se contesta
 * «que piezas hay y donde van»: crear la esquina, mover la rueda, bajar la
 * firma al pie, poner la cara. Aqui se contesta otra cosa --«que dice cada
 * pieza»--: las cuatro puertas con sus rotulos, los idiomas de la rueda, la
 * frase de energia. Dos preguntas distintas, dos ficheros; y el dia que cambie
 * un rotulo no hay que abrir el que coloca.
 *
 * SE CARGA DESPUES, y ese orden no es decorativo: aqui se rellena un mueble
 * que tiene que existir. No hay evento ni espera -- si el mueble no esta, esto
 * no encuentra `#cab-nav` y se retira sin hacer nada, que es degradar y no
 * romper.
 *
 * DOS ORIGENES PARA LOS ROTULOS, y no es un descuido. La portada los tiene en
 * su bloque `#i18n` y se leen SINCRONOS: una cabecera que aparece medio segundo
 * tarde se lee como una pagina rota. Las interiores no siempre tienen ese
 * bloque --`instalar.html` no lo tiene, sus textos viven en `/instalar.json`--
 * asi que ahi se piden a `/nav.json`, que es donde ya vivian los rotulos de la
 * navegacion interior y que genera `nav.py` desde las propias portadas.
 */
(function () {
  var nav = document.getElementById('cab-nav');
  if (!nav) return;

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

  /* --- los rotulos, de donde los haya ---------------------------------------- */
  /* SE COMPRUEBA LA CLAVE, NO EL BLOQUE. Aqui se preguntaba solo si existe
     `#i18n`, y eso basto mientras el unico sitio con bloque era la portada. Al
     estrenar el cabezal en las interiores salio a la luz: `community` y
     `benchmark` TIENEN bloque --con sus propias claves, las de su tablon y su
     tabla-- y ninguno de los dos trae `cabHome`. Con la comprobacion vieja se
     daba por bueno y las cuatro puertas salian vacias: cuatro pastillas sin
     una letra dentro. Se vio en el navegador, no en el gate.

     La pregunta correcta no es «hay bloque» sino «hay ROTULO». Un bloque i18n
     no promete estas claves; solo las de su pagina. */
  var bloque = document.getElementById('i18n');
  if (bloque) {
    try {
      var T = JSON.parse(bloque.textContent);
      if (T && T.cabHome) { vestir(T); return; }
    } catch (err) { /* sigue al catalogo */ }
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
