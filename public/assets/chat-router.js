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
    boton = H.boton;
    boton.addEventListener('click', function () { alternar(); });
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

  /* --- el teclado del movil no estorba -----------------------------------
     Por debajo de 1024 px el campo de escritura no se pinta hasta que se
     toca: en un telefono el teclado se come media pantalla, y abrirlo antes
     de que nadie haya decidido escribir tapa justo lo que se vino a leer. */
  if (!PC.matches && entrada) {
    chat.classList.add('sin-teclado');
    var despertar = function () {
      chat.classList.remove('sin-teclado');
      entrada.focus();
      chat.removeEventListener('click', despertar);
    };
    chat.addEventListener('click', despertar);
  }
})();
