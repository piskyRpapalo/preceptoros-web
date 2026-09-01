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
  var cabeza = document.getElementById('cabeza');
  var entrada = document.getElementById('pregunta');
  if (!panel || !chat) return;

  var PC = window.matchMedia ? matchMedia('(min-width:1024px)') : { matches: false };
  var quieto = window.matchMedia
    ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var boton = null, avatar = null, nombre = null, aviso = null, activo = null;

  /* Doble guarda, y las dos hacen falta: `startViewTransition` no existe en
     Firefox --llamarlo a pelo revienta el cambio de companero-- y quien pide
     menos movimiento no quiere la morfosis aunque su navegador sepa hacerla. */
  function conTransicion(fn) {
    if (quieto.matches || !document.startViewTransition) { fn(); return; }
    document.startViewTransition(fn);
  }

  // --- la cabecera del chat: quien te habla ------------------------------
  var barra = document.createElement('div');
  barra.className = 'chat-quien';
  avatar = document.createElement('img');
  avatar.width = 44; avatar.height = 44; avatar.alt = ''; avatar.decoding = 'async';
  nombre = document.createElement('span');
  nombre.className = 'chat-nombre';
  aviso = document.createElement('p');
  aviso.className = 'chat-aviso'; aviso.hidden = true;
  barra.appendChild(avatar); barra.appendChild(nombre);
  chat.insertBefore(aviso, chat.firstChild);
  chat.insertBefore(barra, chat.firstChild);

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
  herr.appendChild(herrTit);
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

  function vestir(a) {
    if (!a) return;
    activo = a;
    avatar.src = '/assets/agente-3d-' + a.icono3d + '.webp';
    nombre.textContent = a.name;
    // El OJO del Preceptor en el cabezal cambia con el companero activo: es
    // la senal de con quien estas hablando sin leer una palabra.
    if (cabeza) cabeza.style.backgroundImage = "url('/assets/agente-" + a.symbol + ".webp')";
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
      id: a.id, nombre: a.name, modelo: r.modelo || null,
      // `nido` es el papel Caza-Nido que le toca, del catalogo. Quien no lo
      // trae (traductor, aprendiz) viaja sin el y el chat cae al papel base.
      nido: a.nido || null, disponible: !!r.disponible } }));
  }

  // --- abrir y cerrar ----------------------------------------------------
  function abierto() { return !panel.classList.contains('cerrado'); }
  function alternar(forzar) {
    var abrir = forzar === undefined ? !abierto() : forzar;
    // En PC el panel NUNCA se va del todo: se pliega. Sacarlo de la rejilla
    // haria saltar el ancho del chat, y ese salto es justo lo que la columna
    // fija existe para evitar.
    var aplicar = function () {
      panel.classList.toggle('cerrado', !abrir);
      if (boton) boton.setAttribute('aria-expanded', String(abrir));
    };
    if (quieto.matches) { aplicar(); return; }
    aplicar();                      // la animacion la hace el CSS al cambiar la clase
  }

  /* El aviso es PEGAJOSO, y hace falta: `hub.js` pide el catalogo en
     `requestIdleCallback`, y el navegador puede quedarse ocioso mientras
     todavia esta bajando ESTE fichero. Entonces `hub:listo` pasa antes de que
     nadie escuche y el cabezal se queda sin cara, el chat sin nombre y el
     panel cerrado en un PC donde cabia abierto. Se vio asi en el navegador,
     no se dedujo. Si el dato ya esta cuando llego, se atiende y punto. */
  function listo() {
    var H = window.Hub;
    if (!H) return;
    herrTit.textContent = (H.textos && H.textos.herrTitulo) || '';
    boton = H.boton;   // hoy null: MODELOS salio del cabezal y el rail se basta
    if (boton) boton.addEventListener('click', function () { alternar(); });
    // Companero por defecto: el Instalador es el recepcionista.
    vestir(H.agente('instalador') || (H.datos.agentes || [])[0]);
    // En PC el panel nace abierto --hay sitio para los dos--; en movil, no.
    alternar(PC.matches);
    if (PC.addEventListener) {
      PC.addEventListener('change', function (e) { alternar(e.matches); });
    }
    panel.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.modelo[data-agente]');
      if (!b) return;
      conTransicion(function () {
        vestir(H.agente(b.dataset.agente));
        if (!PC.matches) alternar(false);   // en movil, el panel deja paso al chat
      });
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
