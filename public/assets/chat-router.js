/* preceptoros.org · el recepcionista. Elegir companero y abrir el chat.
 *
 * EL CHAT NO SE REESCRIBE, SE ENVUELVE
 * ------------------------------------
 * `chat.js`, `engine.js`, `localai.js`, `voice.js`, `meter.js` y `seal.js`
 * buscan sus piezas por id (#pregunta, #enviar, #motor, #dialogo, #chat...).
 * Al meter #chat dentro de un <dialog> los ids no se mueven, asi que esos seis
 * ficheros siguen funcionando sin tocar una linea. Ahi esta casi todo el
 * riesgo que este cambio NO corre.
 *
 * `<dialog>` nativo, y cero libreria de accesibilidad: el navegador ya trae
 * foco atrapado, Escape, fondo inerte y restauracion del foco al cerrar.
 * Reimplementarlo seria hacerlo peor.
 */
(function () {
  var modal = document.getElementById('chat-modal');
  var hub = document.getElementById('hub');
  if (!modal) return;

  /* El cromo del modal se construye AQUI y no en las tres portadas. No es
     elegancia: `fr/index.html` tiene 335 B de margen contra el tope de 10 KB,
     y esta cabecera escrita en marcado se los come. En el marcado queda solo
     `<dialog id="chat-modal">`, que es lo unico que el navegador necesita
     tener antes de que corra un solo script. */
  function nodo(t, c, id) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (id) n.id = id;
    return n;
  }
  var barra = nodo('div', 'modal-cabeza');
  var cabeza = nodo('span', null, 'modal-cabeza');
  var quien = nodo('span', 'modal-quien', 'modal-quien');
  var cerrar = nodo('button', 'boton leve', 'modal-cerrar');
  cerrar.type = 'button'; cerrar.textContent = 'Cerrar';
  cerrar.setAttribute('aria-label', 'Cerrar');
  barra.appendChild(cabeza); barra.appendChild(quien); barra.appendChild(cerrar);
  var aviso = nodo('p', 'modal-aviso', 'modal-aviso'); aviso.hidden = true;
  modal.insertBefore(aviso, modal.firstChild);
  modal.insertBefore(barra, modal.firstChild);

  function T(k, alt) {
    return (window.Hub && window.Hub.textos && window.Hub.textos[k]) || alt;
  }

  /* DOBLE guarda, y las dos hacen falta:
     - `document.startViewTransition` no existe en Firefox ni en Safari viejo;
       llamarlo a pelo revienta el cambio de companero justo donde el
       navegador es mas conservador.
     - Quien pide menos movimiento no quiere una morfosis, aunque su navegador
       sepa hacerla. */
  function conTransicion(fn) {
    var quieto = window.matchMedia &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto || !document.startViewTransition) { fn(); return; }
    document.startViewTransition(fn);
  }

  function vestir(a) {
    if (cabeza) {
      cabeza.innerHTML = '';
      if (a && a.symbol) {
        var img = document.createElement('img');
        img.src = '/assets/agente-' + a.symbol + '.webp';
        img.alt = ''; img.width = 44; img.height = 44; img.decoding = 'async';
        cabeza.appendChild(img);
      }
    }
    if (quien) quien.textContent = a ? a.name : '';
    if (!aviso) return;
    // Un companero sin adaptador NO se finge cargado. Se dice, con su causa.
    // Fingir una carga de LoRA que no existe es exactamente la clase de
    // mentira que el resto de esta web esta construida para no contar.
    var r = (a && a.real) || {};
    if (a && !r.disponible) {
      aviso.textContent = T('hubSinServir', '') +
        (r.causa ? ' (' + r.causa + ')' : '');
      aviso.hidden = false;
    } else {
      aviso.textContent = ''; aviso.hidden = true;
    }
  }

  function abrir(a) {
    conTransicion(function () {
      vestir(a);
      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');   // sin <dialog>, al menos se ve
    });
  }

  if (hub) {
    hub.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.agente[data-agente]');
      if (!b) return;
      abrir(window.Hub ? window.Hub.agente(b.dataset.agente) : null);
    });
  }
  if (cerrar) {
    cerrar.addEventListener('click', function () {
      if (typeof modal.close === 'function') modal.close();
      else modal.removeAttribute('open');
    });
  }
  // Pulsar en el fondo cierra. Escape ya lo trae <dialog> de serie.
  modal.addEventListener('click', function (ev) {
    if (ev.target === modal && typeof modal.close === 'function') modal.close();
  });

  document.addEventListener('hub:listo', function () {
    if (cerrar) cerrar.textContent = T('hubCerrar', cerrar.textContent);
  });
})();
