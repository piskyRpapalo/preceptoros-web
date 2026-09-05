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

  /* EL PANEL DE HERRAMIENTAS SE RETIRA (2026-09-05, firmado). Era un
     `section.panel` con su titulo «Atajos» que envolvia el motor, el rotulo del
     cerebro y los ocho comandos. El recuadro sobraba: los atajos son parte del
     chat, no una caja aparte debajo de el. Un marco propio decia que eran otra
     cosa, y son la misma -- ordenes que se le dan a esta conversacion.

     No hace falta mudar nada a mano. `#motor` y `#brain` ya nacen dentro de
     `#chat` en el marcado --era este fichero el que los sacaba de ahi para
     meterlos en la caja-- y `comandos.js` ya trae su caida escrita:
     `getElementById('herramientas') || getElementById('chat')`. Al no existir
     el panel, los ocho comandos cuelgan del chat solos. La feature no se toca;
     se le quita el marco. */

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
      var abierto = vv.height < alto * 0.75;
      chat.classList.toggle('con-teclado', abierto);

      /* EL ALTO VISIBLE, PUBLICADO PARA EL CSS. Sin esto no hay forma de
         maquetar con el teclado abierto: `100dvh` en Android sigue midiendo la
         pantalla ENTERA --el teclado se dibuja encima, no encoge la ventana--
         asi que la pagina se queda mas alta que lo que se ve y hay que
         desplazarla para encontrar la linea de escribir. Es exactamente el
         hueco vacio que se fotografio en el Doogee.

         `visualViewport.height` es el unico numero que sabe cuanto queda
         visible de verdad. Se publica como variable y la maqueta lo usa como
         alto total; el css solo no puede llegar aqui.

         La clase va en `body` y no solo en el chat porque lo que cambia es la
         pagina entera: deja de desplazarse y se reparte en una columna --
         cabezal con su esfera arriba, la ultima frase abajo, y nada mas. */
      document.documentElement.style.setProperty('--alto-visible', vv.height + 'px');
      document.body.classList.toggle('con-teclado', abierto);
    };
    vv.addEventListener('resize', mirar);
  }
})();

/* --- Capa 1 · los atajos, debajo del campo --------------------------------
 * Los mismos tres que la app, mismas claves y mismo gesto: escriben en el campo
 * y dejan el cursor ahi. NO mandan solos -- un atajo que manda sin que se lea
 * lo que va a mandar es un boton que habla por ti. Los rotulos salen del `#i18n`
 * de la portada: este fichero no tiene idioma, asi que no puede tener texto. */
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

/* --- Capa 3 · quien abre los desplegables ----------------------------------
 * EL BOTON SE ATA AL ARRANCAR, y por eso vive aqui y no en `chat-router.js`:
 * alli el enganche cuelga de `listo()`, que espera al catalogo, y hasta
 * entonces el desplegable no tenia quien lo abriera. Con el rail daba igual
 * --se tocaba directamente--; uno plegado no se puede tocar. Y este fichero es
 * el de «donde se colocan los mandos». Nace CERRADO aunque la clase
 * este en el marcado: `hub.js` lo reescribe al pintar. */
(function () {
  /* Los DOS mandos del cabezal con el mismo mecanismo: companeros y rueda. Se
     generaliza en vez de copiarse -- dos bucles iguales divergen en cuanto uno
     gana una condicion. Y abrir uno cierra el otro: caen en el mismo sitio y
     superpuestos no se leeria ninguno. */
  /* QUEDA UN SOLO PAR. Eran dos --Herramientas y la rueda-- y el primero se
     retiro el 2026-09-05: sus nubes bajaron al cuadro de especificaciones y el
     mando se quedo sin nada que abrir. El bucle se conserva aunque hoy de una
     sola vuelta: generalizarlo costo escribirlo una vez, y volver a
     particularizarlo para un solo caso es trabajo que habria que deshacer el
     dia que entre el segundo desplegable. */
  var pares = [['rueda', 'panel-ajustes']]
    .map(function (par) {
      return { b: document.getElementById(par[0]), p: document.getElementById(par[1]) };
    }).filter(function (x) { return x.b && x.p; });
  if (!pares.length) return;
  pares.forEach(function (uno) { montar(uno, pares); });
})();

function montar(uno, todos) {
  var boton = uno.b, panel = uno.p;

  function pinta() {
    boton.setAttribute('aria-expanded',
      panel.classList.contains('cerrado') ? 'false' : 'true');
  }
  function cierra() { panel.classList.add('cerrado'); pinta(); }

  cierra();
  boton.addEventListener('click', function () {
    var abrir = panel.classList.contains('cerrado');
    todos.forEach(function (o) { o.p.classList.add('cerrado'); o.b.setAttribute('aria-expanded', 'false'); });
    if (abrir) panel.classList.remove('cerrado');
    pinta();
  });
  /* Escape cierra: un panel que cae sobre el chat y solo se cierra volviendo al
     boton obliga a cruzar la pantalla para recuperar lo de abajo. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.classList.contains('cerrado')) cierra();
  });
  // Elegir companero cierra: ya se hizo lo que se vino a hacer.
  document.addEventListener('preceptor:companero', cierra);
}

/* La PIEL --el interruptor claro/oscuro de la rueda-- vive en `hub-cola.js`.
 * No cabia aqui: este fichero llego a su techo de 10.240 B con los cuatro
 * asuntos que ya lleva. Se parte, no se recorta. */

/* --- Capa 2 · el cabezal se aparta cuando se escribe ------------------------
 * Una clase en `body` y el resto lo hace el css. Se pone al enfocar el campo y
 * se quita al soltarlo, que es exactamente el momento en que la atencion pasa
 * del aparato a lo que se esta diciendo.
 *
 * `focusin`/`focusout` y no `focus`/`blur`: los primeros burbujean, asi que si
 * manana el campo se envuelve en otra caja esto sigue funcionando sin tocarse.
 */
(function () {
  var campo = document.getElementById('pregunta');
  if (!campo) return;
  campo.addEventListener('focusin', function () {
    document.body.classList.add('chat-activo');
  });
  campo.addEventListener('focusout', function () {
    document.body.classList.remove('chat-activo');
  });
})();

/* --- Capa 5 · el chat a pantalla completa ----------------------------------
 * La entrada vive en la rueda, junto al idioma y la piel: es una preferencia
 * de como se mira, no una accion sobre la conversacion. La salida es un aspa
 * DENTRO del chat, porque una vez dentro la rueda ya no se ve.
 *
 * NO se usa la API de pantalla completa del navegador. Esa saca la pagina del
 * documento y en el movil se lleva la barra del sistema por delante; ademas
 * necesita un gesto y falla en silencio si el navegador la niega. Aqui es una
 * clase: se comporta igual en los tres navegadores y no puede fallar a medias.
 *
 * Escape sale, como del desplegable. Un modo del que solo se sale con el raton
 * es un modo en el que alguien se queda encerrado.
 */
(function () {
  var chat = document.getElementById('chat');
  var caja = document.getElementById('panel-ajustes');
  var bloque = document.getElementById('i18n');
  if (!chat || !caja || !bloque) return;
  var T = JSON.parse(bloque.textContent);

  var aspa = document.createElement('button');
  aspa.type = 'button';
  aspa.className = 'pleno-cerrar';
  aspa.hidden = true;
  aspa.setAttribute('aria-label', T.plenoSalir || '');
  aspa.textContent = '×';

  function pon(entra) {
    chat.classList.toggle('pleno', entra);
    aspa.hidden = !entra;
    // El fondo no se desplaza detras de un modo que ocupa la ventana entera.
    document.body.style.overflow = entra ? 'hidden' : '';
  }
  aspa.addEventListener('click', function () { pon(false); });
  chat.insertBefore(aspa, chat.firstChild);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && chat.classList.contains('pleno')) pon(false);
  });

  /* Se cuelga de la rueda cuando `hub.js` ya la ha rellenado: aquel la vacia
     con `innerHTML = ""` al pintar los idiomas, asi que entrar antes seria
     escribir para que lo borren. */
  function cuelga() {
    if (caja.querySelector('.ajuste-pleno')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ajuste-idioma ajuste-pleno';
    b.textContent = T.pleno || '';
    b.addEventListener('click', function () { pon(true); });
    caja.appendChild(b);
  }
  if (window.Hub) cuelga();
  else document.addEventListener('hub:listo', cuelga);
})();
