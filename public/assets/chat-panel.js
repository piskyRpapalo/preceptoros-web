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
