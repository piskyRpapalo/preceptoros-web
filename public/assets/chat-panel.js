/* preceptoros.org · el panel de herramientas del chat, y el teclado del movil.
 *
 * POR QUE ES UN FICHERO Y NO UN TROZO DE `chat-router.js`. Medido el
 * 2026-09-04: aquel estaba en 10.226 B de un techo de 10.240 que el gate
 * exige. Catorce bytes. El proximo comentario lo rompia, y en un arbol donde
 * los comentarios son la documentacion eso significa que el fichero se habia
 * vuelto intocable sin que nadie lo hubiera decidido.
 *
 * LA COSTURA no se eligio por tamano sino por asunto. `chat-router.js`
 * responde a «quien te contesta»: el catalogo de companeros, el papel que se
 * le da al modelo, la cabecera con su cara. Esto de aqui responde a otra cosa
 * --donde se colocan los mandos y que pasa cuando sale el teclado--, que es
 * disposicion, no encaminamiento. Dos preguntas distintas, dos ficheros.
 *
 * EL UNICO HILO que cruzaba entre los dos era el titulo del panel, que el
 * nucleo escribia en una variable de aqui. Ahora se busca por selector y con
 * su comprobacion: si este fichero no llegara, el otro no revienta -- se queda
 * sin panel, que es degradar, no romper.
 *
 * Y POR ESO ESTE FICHERO SE CARGA ANTES QUE `chat-router.js`, que es el orden
 * contrario al que parece natural. Se descubrio partiendolo, no razonandolo:
 * el router llama a su `listo()` de forma SINCRONA cuando el hub ya esta
 * cargado --y lo esta, porque `hub.js` va antes-- asi que buscaba el titulo en
 * un panel que todavia no existia y lo dejaba en blanco. Con el orden al reves
 * el nodo esta puesto en los dos caminos, el sincrono y el del evento. Primero
 * se construye el mueble; luego se le pone el rotulo.
 */
(function () {
  var chat = document.getElementById('chat');
  if (!chat) return;

  /* --- el panel de herramientas ------------------------------------------
     Va DENTRO del panel grande y DEBAJO de la terminal, no como panel
     hermano. Antes se insertaba detras de #chat y en un telefono quedaba a
     una pantalla entera de scroll de la conversacion a la que pertenece.

     Lo que contiene se ha adelgazado (2026-09-01): `motor` y `brain`. El
     buscador de IA del navegador y el de Ollama local NO se han borrado --se
     han mudado al Benchmark--, que es donde se elige y se MIDE un motor. En
     la portada eran tres formas distintas de contestar a la misma pregunta,
     apiladas encima del chat.

     `voice` sale de aqui y sube junto a Enviar: hablar es una forma de
     escribir el turno, no una herramienta suelta. */
  var herr = document.createElement('section');
  herr.id = 'herramientas'; herr.className = 'panel';
  var herrTit = document.createElement('h2');
  herrTit.className = 'panel-titulo';
  herr.appendChild(herrTit);   // lo escribe `chat-router.js`, por selector
  ['motor', 'brain'].forEach(function (id) {
    var n = document.getElementById(id);
    if (n) herr.appendChild(n);
  });
  chat.appendChild(herr);

  /* El teclado del movil tapa media pantalla, y lo que tapa es justo la
     conversacion. `visualViewport` dice cuanto queda VISIBLE, que es la unica
     forma fiable de saber que el teclado esta abierto: `resize` de window no
     dispara en Android y `env(keyboard-inset-height)` todavia no lo resuelve
     en el navegador del Doogee. Si el hueco visible se encoge mas de un 25 %,
     el panel de herramientas se retira; al cerrarse el teclado, vuelve. */
  var vv = window.visualViewport;
  if (vv) {
    var alto = vv.height;
    var mirar = function () {
      if (vv.height > alto) alto = vv.height;      // giro de pantalla, no teclado
      chat.classList.toggle('con-teclado', vv.height < alto * 0.75);
    };
    vv.addEventListener('resize', mirar);
  }
})();

/* --- Capa 1 · los atajos, debajo del campo --------------------------------
 * Los mismos tres que la app, con las mismas claves y el mismo gesto: escriben
 * en el campo y dejan el cursor ahi. NO mandan solos -- un atajo que manda sin
 * que se lea lo que va a mandar es un boton que habla por ti.
 *
 * Los rotulos salen del bloque `#i18n` de la portada y no de aqui: este
 * fichero no tiene idioma, y por eso no puede tener texto. Es la misma regla
 * que ya cumple `board-fuentes.js`.
 */
(function () {
  var caja = document.getElementById('atajos');
  var campo = document.getElementById('pregunta');
  var bloque = document.getElementById('i18n');
  if (!caja || !campo || !bloque) return;
  var T = JSON.parse(bloque.textContent);

  ['atResume', 'atPasos', 'atDudas'].forEach(function (clave) {
    var texto = T[clave];
    if (!texto) return;          // sin rotulo no hay boton: no se inventa uno
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'atajo';
    b.textContent = texto;
    b.addEventListener('click', function () {
      campo.value = texto + ': ';
      campo.focus();
    });
    caja.appendChild(b);
  });
  if (caja.children.length) caja.hidden = false;
})();

/* --- Capa 4 · los estados de la cara --------------------------------------
 * Las mismas funciones que el MVP, sobre los eventos que esta web YA emitia y
 * que hasta hoy solo movian el sello del pie. La cara es un sensor, no un
 * adorno: se mueve cuando pasa algo de verdad.
 *
 * PENSAR Y HABLAR SON DOS COSAS, y esa es la correccion que la app firmo el
 * 2026-09-04. Antes la boca se movia mientras el modelo generaba, o sea que la
 * cara hablaba sin haber dicho nada todavia -- y con un modelo lento eso son
 * minutos de boca moviendose en falso. Ahora piensa mientras piensa y mueve la
 * boca cuando el texto llega.
 */
(function () {
  var cara = document.querySelector('.esfera');
  if (!cara) return;
  function estado(clase) {
    cara.classList.remove('piensa', 'habla');
    if (clase) cara.classList.add(clase);
  }
  document.addEventListener('preceptor:pensando', function () { estado('piensa'); });
  document.addEventListener('preceptor:hablando', function () { estado('habla'); });
  // Al cerrar el turno vuelve a reposo. No se relanza ninguna entrada: la
  // apertura es la entrada del producto, no el gesto al que se vuelve.
  document.addEventListener('preceptor:turno', function () { estado(null); });
})();

/* --- Capa 3 · quien abre el desplegable -----------------------------------
 * EL BOTON SE ATA AL ARRANCAR, y por eso vive aqui y no en `chat-router.js`.
 * Medido el 2026-09-05 en el navegador: alli el enganche cuelga de `listo()`,
 * que espera al catalogo --`hub.js` lo pide en `requestIdleCallback`-- y hasta
 * entonces el desplegable no tenia quien lo abriera. Con el rail daba igual,
 * porque el rail se tocaba directamente; un desplegable plegado no se puede
 * tocar. Y este fichero es justo el de «donde se colocan los mandos».
 *
 * Nace CERRADO aunque la clase este en el marcado: `hub.js` reescribe el panel
 * al pintarlo y el estado hay que volver a declararlo.
 */
(function () {
  var boton = document.getElementById('lateral-boton');
  var panel = document.getElementById('panel-modelos');
  if (!boton || !panel) return;

  function pinta() {
    boton.setAttribute('aria-expanded',
      panel.classList.contains('cerrado') ? 'false' : 'true');
  }
  function cierra() { panel.classList.add('cerrado'); pinta(); }

  cierra();
  boton.addEventListener('click', function () {
    panel.classList.toggle('cerrado');
    pinta();
  });
  /* Escape cierra: un panel que cae sobre el chat y solo se cierra volviendo al
     boton obliga a cruzar la pantalla para recuperar lo de abajo. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.classList.contains('cerrado')) cierra();
  });
  // Elegir companero cierra: ya se hizo lo que se vino a hacer.
  document.addEventListener('preceptor:companero', cierra);
})();
