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
    /* El OJO del Preceptor en el cabezal cambia con el companero activo: es
       la senal de con quien estas hablando sin leer una palabra. El TAMANO
       viaja con la imagen: `#cabeza` nace al 700 % porque su fondo es la TIRA
       de la apertura, y poner solo la imagen estiraba el ojo siete veces --
       medido el 2026-09-04, ventana de 60 px sobre imagen de 420. */
    if (cabeza) {
      cabeza.style.backgroundImage = "url('/assets/agente-" + a.symbol + ".webp')";
      cabeza.style.backgroundSize = '100%';
    }
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
      // El papel YA COMPUESTO. Quien no tiene nido (traductor, aprendiz)
      // viaja con null y el chat cae solo al papel base.
      nido: papelDe(a), disponible: !!r.disponible } }));
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
    // El panel de herramientas lo construye `chat-panel.js`. Se busca por
    // selector y se comprueba: si ese fichero no llegara, aqui no se revienta.
    var herrTit = document.querySelector('#herramientas .panel-titulo');
    if (herrTit) herrTit.textContent = (H.textos && H.textos.herrTitulo) || '';
    /* El hueco que este `H.boton` llevaba esperando desde que MODELOS salio
       del cabezal. El rail se bastaba porque se tocaba directamente; un
       desplegable plegado no se puede tocar, asi que la Capa 3 trae su
       boton al cabezal --como en la app-- y aqui se recoge. */
    boton = H.boton;   // el del cabezal lo ata `chat-panel.js`
    if (boton) boton.addEventListener('click', function () { alternar(); });
    // Companero por defecto: el Instalador es el recepcionista.
    vestir(H.agente('instalador') || (H.datos.agentes || [])[0]);
    // En PC el panel nace abierto --hay sitio para los dos--; en movil, no.
    /* CERRADO EN TODO ANCHO, y esto cambia el 2026-09-05. Antes abria solo
       en PC porque alli el panel era una columna acoplada y el hueco ya
       estaba reservado: no abrirlo habria dejado un vacio de 4,6rem contra
       el borde. Ahora la Capa 3 no reserva nada y cae ENCIMA del chat, asi
       que abrirla sola taparia lo que la persona vino a usar. */
    alternar(false);
    if (PC.addEventListener) {
      PC.addEventListener('change', function () { alternar(false); });
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

  /* La cara del cabezal, cableada a los avisos QUE YA EXISTEN.
     `chat.js` no se toca: le quedan 111 B y ya emite `preceptor:hablando` al
     primer trozo y `preceptor:turno` al cerrar. Aqui solo se escucha. */
  if (cabeza) {
    /* Nace despierta: la apertura salio del cabezal y su `animationend` ya
       no llega nunca. */
    cabeza.classList.add('despierto');
    document.addEventListener('preceptor:hablando', function () {
      cabeza.classList.add('hablando');
    });
    document.addEventListener('preceptor:turno', function () {
      cabeza.classList.remove('hablando');
    });
  }
})();
