/* preceptoros.org · el recepcionista. Elegir companero y abrir el panel.
 *
 * EL CHAT NO SE REESCRIBE, SE ENVUELVE. `chat.js`, `engine.js`, `localai.js`,
 * `voice.js`, `meter.js` y `seal.js` buscan sus piezas por id (#pregunta,
 * #enviar, #motor, #dialogo...). Ninguna se mueve, asi que los seis siguen
 * funcionando sin tocar una linea.
 *
 * DOS COMPORTAMIENTOS, UNA SOLA FUENTE DE VERDAD
 * ----------------------------------------------
 * Por debajo de 1024 px el panel se DESLIZA sobre el chat: en un movil no
 * caben los dos y el chat es lo que se vino a usar. A partir de 1024 px el
 * panel es una COLUMNA fija a la derecha y se ven a la vez -- la ventana se
 * estira de esquina a esquina sin perder el chat. Quien decide es
 * `matchMedia`, no el ancho leido a mano: asi el navegador avisa al girar el
 * telefono y no hay dos ideas distintas del mismo umbral.
 */
(function () {
  var panel = document.getElementById('panel-modelos');
  var chat = document.getElementById('chat');
  var entrada = document.getElementById('pregunta');
  if (!panel || !chat) return;

  var PC = window.matchMedia ? matchMedia('(min-width:1024px)') : { matches: false };
  var quieto = window.matchMedia
    ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var nombre = null, aviso = null, activo = null;
  /* El papel Caza-Nido se COMPONE aqui y viaja ya hecho. `chat.js` recibe
     texto, no una clave: tiene 129 B libres y no debe aprender a buscar en el
     catalogo. Este fichero ya sabe quien contesta; saber que papel juega es la
     misma pregunta.

     `PR.agentesCifras` es una regla COMPARTIDA --euros y aviso de medidas-- y
     por eso vive UNA vez en `prompts-*.js` en vez de copiada en los dos
     papeles que la necesitan: duplicarla costaba 440 B en `fr`, que tenia 533
     libres. Quien la necesita lo declara el catalogo con `cifras: true`, no un
     `if` con dos nombres dentro que envejece al renombrar un agente. */
  var bloqueI18N = document.getElementById('i18n');
  var T = bloqueI18N ? JSON.parse(bloqueI18N.textContent) : {};
  function papelDe(a) {
    var base = (PR.agentes || {})[a.nido];
    if (!base) return null;                 // sin nido: el chat cae a T.papel
    return a.cifras && PR.agentesCifras ? base + ' ' + PR.agentesCifras : base;
  }

  /* Doble guarda, y las dos hacen falta: `startViewTransition` no existe en
     Firefox --llamarlo a pelo revienta el cambio de companero-- y quien pide
     menos movimiento no quiere la morfosis aunque su navegador sepa hacerla. */
  function conTransicion(fn) {
    if (quieto.matches || !document.startViewTransition) { fn(); return; }
    document.startViewTransition(fn);
  }

  /* --- QUIEN TE HABLA BAJA A LA FICHA DEL APARATO (2026-09-05) ------------
     Era una pastilla flotando sobre la esquina del chat, y encima de la
     primera linea de la conversacion: se leia el nombre del companero
     tachando lo primero que dijo. Se vio en el telefono.

     Baja al cuadro de especificaciones, que es donde el Soberano lo pidio:
     «debajo de la ventana de texto tenemos las especificaciones del modelo +
     la funcion de Herramienta en la pagina». Ahi comparte caja con el motor,
     la velocidad y las ocho nubes -- las cuatro cosas contestan a la misma
     pregunta, «que hay puesto en este aparato», y separadas no se leian como
     una respuesta.

     Y DEJA DE SER UN BOTON. Abria el mando de Herramientas llamando a
     `getElementById('lateral-boton')`, que se retiro hoy: el codigo seguia
     ahi, protegido por su `if`, sin hacer nada y sin quejarse -- un boton que
     no hace nada es peor que uno que falta. Las nubes que abria estan ahora
     tres centimetros mas abajo, a la vista. Lo que queda es lo que siempre
     fue: un rotulo que dice con quien hablas y para que sirve.

     LA FUNCION SE ANADE, y es dato nuevo en pantalla: vivia solo en el `title`
     de cada nube, donde en un telefono no la lee nadie -- no hay cursor que
     pasar por encima. */
  var ficha = document.getElementById('especificaciones');
  var barra = document.createElement('p');
  barra.className = 'chat-quien';
  nombre = document.createElement('b');
  nombre.className = 'chat-nombre';
  var funcion = document.createElement('span');
  funcion.className = 'quien-funcion';
  barra.appendChild(nombre);
  barra.appendChild(funcion);
  aviso = document.createElement('p');
  aviso.className = 'chat-aviso'; aviso.hidden = true;
  chat.insertBefore(aviso, chat.firstChild);
  if (ficha) ficha.insertBefore(barra, ficha.firstChild);

  function vestir(a) {
    if (!a) return;
    activo = a;
    // La etiqueta va en el idioma de la pagina, y sale del bloque i18n de la
    // portada -- que es donde vive el texto de esta lengua y de ninguna otra.
    var voz = (window.Hub && Hub.rotulos.agentes && Hub.rotulos.agentes[a.id]) || a;
    nombre.textContent = voz.name || a.name;
    funcion.textContent = voz.function || a.function || '';
    /* Aqui se le ponia cara al cabezal: `#cabeza` cambiaba de fondo con el
       companero activo. Se retiro con el cabezal viejo el 2026-09-05 -- quien
       dice con quien hablas es `.chat-quien`, que ademas trae el nombre. */
    var r = a.real || {};
    var L = (window.Hub && window.Hub.textos) || {};
    if (!r.disponible) {
      // No se finge una carga de LoRA que no existe. Se dice, con su causa.
      aviso.textContent = (L.hubSinServir || '') + (r.causa ? ' (' + r.causa + ')' : '');
      aviso.hidden = false;
    } else { aviso.textContent = ''; aviso.hidden = true; }
    /* Quien contesta lo decide el companero: su `real.adaptador` ES el nombre
       del modelo en la Ollama del rack. El router no habla con nadie -- solo
       dice en voz alta a quien le toca, y quien sepa hablar que escuche. */
    document.dispatchEvent(new CustomEvent('preceptor:companero', { detail: {
      /* EL NOMBRE VA TRADUCIDO, y hasta hoy no. Este evento mandaba
         `a.name` --el nombre CRUDO de `hub.json`, que solo existe en
         castellano-- mientras la pastilla de al lado pintaba `voz.name`, que
         si sale del bloque i18n de la pagina. Nadie lo noto mientras el evento
         solo servia para cosas internas; al colgarle la pista del campo, la
         portada inglesa acabo diciendo «Write here to talk with El
         Instalador». Se vio en una captura para el README, no en un test.
         Un dato que viaja en dos versiones acaba saliendo por la mala. */
      id: a.id, nombre: voz.name || a.name, modelo: r.modelo || null,
      // El papel YA COMPUESTO. Quien no tiene nido (traductor, aprendiz)
      // viaja con null y el chat cae solo al papel base.
      nido: papelDe(a), disponible: !!r.disponible } }));
  }

  /* --- AQUI SE ABRIA Y SE CERRABA ---------------------------------------
     Habia un `abierto()` y un `alternar()` que plegaban `#panel-modelos`, con
     su `aria-expanded`, su respeto a quien pide quietud y su regla distinta
     para PC y movil. Todo eso se retira el 2026-09-05: las nubes bajaron al
     cuadro de especificaciones y ahi se ven siempre. No hay nada que abrir.

     Y NO BASTABA CON QUITAR EL BOTON. Se quito primero, y la pagina se quedo
     con las ocho nubes invisibles: este fichero seguia llamando a
     `alternar(false)` al arrancar y les ponia `cerrado` sin que nadie pudiera
     quitarselo. Un mueble sin puerta pero con el cerrojo echado. Se vio en el
     navegador -- el panel medía cero de alto con su contenido dentro.

     La leccion, que ya es la tercera hoy con esta forma: retirar un mando es
     retirar TAMBIEN lo que lo obedecia. Lo que se queda es el unico gesto que
     de verdad hacian estas lineas -- elegir companero. */

  /* El aviso es PEGAJOSO, y hace falta: `hub.js` pide el catalogo en
     `requestIdleCallback`, y el navegador puede quedarse ocioso mientras
     todavia esta bajando ESTE fichero. Entonces `hub:listo` pasa antes de que
     nadie escuche y el cabezal se queda sin cara, el chat sin nombre y el
     panel cerrado en un PC donde cabia abierto. Se vio asi en el navegador,
     no se dedujo. Si el dato ya esta cuando llego, se atiende y punto. */
  function listo() {
    var H = window.Hub;
    if (!H) return;
    /* El titulo del panel de herramientas se escribia aqui por selector. El
       panel se retiro el 2026-09-05 --los atajos son parte del chat, no una
       caja debajo-- asi que ya no hay titulo que escribir. La comprobacion por
       selector que habia hacia que esto no reventara, y por eso no hubo que
       tocar nada mas al quitarlo. */
    /* El hueco que este `H.boton` llevaba esperando desde que MODELOS salio
       del cabezal. El rail se bastaba porque se tocaba directamente; un
       desplegable plegado no se puede tocar, asi que la Capa 3 trae su
       boton al cabezal --como en la app-- y aqui se recoge. */
    // Companero por defecto: el Instalador es el recepcionista.
    vestir(H.agente('instalador') || (H.datos.agentes || [])[0]);
    panel.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.modelo[data-agente]');
      if (!b) return;
      conTransicion(function () { vestir(H.agente(b.dataset.agente)); });
      if (entrada && PC.matches) entrada.focus();
    });
  }
  if (window.Hub) listo();
  else document.addEventListener('hub:listo', listo);

  /* El chat NACE ABIERTO, tambien en el telefono (2026-09-01).
     Antes el campo de escritura no se pintaba hasta que se tocaba el panel:
     se hizo para que el teclado no tapara la lectura, pero el precio era que
     la primera pantalla del producto era una caja muda que no decia que
     hubiera que tocarla. Lo que se vino a hacer es hablar. Quien no quiera
     escribir todavia, no toca el campo; el teclado solo sube si lo pulsas. */

})();
