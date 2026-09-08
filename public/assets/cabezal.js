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
    /* VA DENTRO DE LA FILA, no colgando del cabezal. Estuvo absoluta unas
       horas del 2026-09-07 y con eso resolvia el caso SIN sesion y rompia el
       otro: al registrarse, la identidad pasa de ser un icono de 36 px a una
       pastilla con nombre y firma --211 px medidos-- y una caja fuera del
       flujo que se ensancha crece ENCIMA de su vecino. Se midio: 69 px de
       solape sobre la marca, con la rueda enterrada debajo.
       En el flujo, ese caso no puede ocurrir: el reparto lo hace flexbox
       midiendo, y lo hace en los dos estados sin que nadie escriba un numero. */
    fila.appendChild(esquina);
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

  /* --- LA FIRMA BAJA AL PIE (2026-09-08) -----------------------------------
     GitHub y LinkedIn NO son mandos. Dicen QUIEN FIRMA ESTO, que es
     informacion de pie de pagina, y estaban ocupando sitio de barra de
     herramientas en la pantalla mas estrecha que existe.

     LO QUE COSTABAN, medido: sesenta pixeles de la fila de la marca. Con ellos
     dentro la cuenta a 375 daba 335 sobre 325 disponibles --marca 184 + firma
     60 + rueda y perfil 78 + huecos--, asi que la esquina bajaba SIEMPRE a su
     propia fila y el cabezal se iba a 204 px. Faltaban diez pixeles y los
     pagaba todo el mundo, incluido quien nunca va a pulsar esos dos enlaces.

     SE MUEVE, NO SE DUPLICA NI SE ESCONDE. Es el mismo nodo `#cab-ident` que
     `hub.js` rellena --lo busca por su id y le da igual de quien cuelgue-- asi
     que la DECISION de que enlace se pone la sigue tomando el catalogo, y no
     hay una segunda copia que pueda divergir. Esconderlos en el telefono
     habria sido peor: dos versiones del sitio, y la de quien mira desde un
     movil sin forma de comprobar quien esta detras.

     Y ABAJO NO SE PIERDEN: el pie es donde se busca esto en cualquier sitio
     web del mundo. Lo que se pierde es la fila que ocupaban arriba. */
  var firma = document.getElementById('cab-ident');
  var pie = document.querySelector('.honest-footer');
  if (firma && pie && firma.parentNode !== pie) pie.appendChild(firma);

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

  /* LO QUE EL CABEZAL DICE --las cuatro puertas, los idiomas de la rueda, la
     frase de energia-- vive en `cabezal-rotulos.js` desde el 2026-09-08. Este
     fichero llego a 16.580 B de un tope de 16.384 y se parte por asunto, que
     es la regla: aqui «que piezas hay y donde van», alli «que dice cada una».
     Aquel se carga DESPUES, porque rellena un mueble que tiene que existir. */
})();
