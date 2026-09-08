/* preceptoros.org · el consentimiento de guardar lo que escribes.
 *
 * FICHERO PROPIO porque es otro asunto --que pasa con lo que escribes, no que
 * cerebro te contesta-- y porque `selector-modelo.js` llego a 16.859 B de los
 * 16.384 con esto dentro. Se parte, no se recorta. Su CSS ya vivia aparte en
 * `consiento.css`, asi que la costura estaba medio hecha.
 *
 * DESMARCADO POR DEFECTO, y no es un detalle de implementacion: una casilla
 * premarcada recoge el consentimiento de quien no la vio, que es justo lo que
 * la palabra consentimiento excluye.
 */
(function () {
  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }

  var GRACIAS = { es:'Gracias', en:'Thank you', pt:'Obrigado', fr:'Merci',
                  it:'Grazie', de:'Danke', el:'Ευχαριστώ', ru:'Спасибо' };
  var CONS = {
    es:['Permitir análisis para mejorar el modelo',
        'Marcado: se guarda lo que escribes y lo que responde. Sin marcar: solo el modelo, la hora y el largo.'],
    en:['Allow analysis to improve the model',
        'Ticked: what you write and what it answers are stored. Unticked: only the model, the time and the length.'] };

  /* --- EL CONSENTIMIENTO, VISIBLE Y DESMARCADO ---------------------------
     DESMARCADO POR DEFECTO, y no es un detalle de implementacion: una casilla
     premarcada recoge el consentimiento de quien no la vio, que es justo lo
     que la palabra consentimiento excluye. Quien quiera ayudar la marca; quien
     no la mire, no ha dicho que si.

     VISIBLE, y no escondida en una rueda. Va donde se escribe, porque es ahi
     donde importa saber que pasa con lo que escribes. Un ajuste de privacidad
     a tres toques de distancia esta tecnicamente disponible y practicamente
     oculto.

     Y DICE LAS DOS RAMAS, no solo la buena: marcado se guarda el texto, sin
     marcar se guarda que modelo, cuando y cuanto. La segunda tambien es
     guardar algo, y callarlo seria la mitad de una verdad. */
  function consentimiento(w) {
    var campo = document.getElementById('pregunta');
    if (!campo || document.getElementById('consiento')) return;
    var caja = el('div', 'consiento-caja');
    var et = document.createElement('label');
    et.className = 'consiento-et'; et.htmlFor = 'consiento';
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = 'consiento';
    cb.checked = false;                       // nunca se lee lo guardado para MARCARLO
    try { cb.checked = localStorage.getItem('preceptor-consiento') === '1'; } catch (e) { /* */ }
    var DISCO = '<svg viewBox="0 0 20 20" width="26" height="26" fill="none"'
      + ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round"'
      + ' stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M3.5 3.5h9l4 4v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"/>'
      + '<path d="M6.5 3.5v5h7"/><rect x="6.5" y="12" width="7" height="4.5"/></svg>';
    var icono = document.createElement('span');
    icono.className = 'consiento-icono';
    icono.innerHTML = DISCO;
    et.appendChild(cb); et.appendChild(icono);
    et.appendChild(el('span', 'consiento-texto', w[0]));
    caja.appendChild(et);
    caja.appendChild(el('p', 'consiento-pie', w[1]));
    /* ACEPTADO SE ENCOGE. Una casilla marcada que sigue ocupando cuatro
       lineas explicando lo que ya aceptaste es un cartel, no un control: se
       queda el check en oro y el rotulo corto, y la explicacion vuelve si lo
       desmarcas. El «gracias» sale AL LADO y se va solo -- agradecer una vez
       es cortesia; dejarlo fijo en pantalla es cobrarselo. */
    var lang2 = (document.documentElement.lang || 'es').slice(0, 2);
    function vestir() {
      caja.classList.toggle('dado', cb.checked);
      icono.innerHTML = cb.checked
        ? '<svg viewBox="0 0 24 24" width="26" height="26" fill="none"'
          + ' stroke="currentColor" stroke-width="2.6" stroke-linecap="round"'
          + ' stroke-linejoin="round" aria-hidden="true"><path d="M4 13l5.5 5.5L20 6"/></svg>'
        : DISCO;
    }
    function gracias() {
      var g = el('span', 'consiento-gracias', GRACIAS[lang2] || GRACIAS['en']);
      caja.appendChild(g);
      setTimeout(function () { g.classList.add('ida'); }, 2200);
      setTimeout(function () { if (g.parentNode) g.remove(); }, 2800);
    }
    cb.addEventListener('change', function () {
      try { localStorage.setItem('preceptor-consiento', cb.checked ? '1' : '0'); }
      catch (e) { /* privado */ }
      vestir();
      if (cb.checked) gracias();
    });
    vestir();
    /* VA DESPUES DE LA PLACA, no dentro. `.panel` es una columna flex de
       altura medida y `.chat-abajo` coloca el campo por encima de donde
       empieza su propia caja: meter aqui un bloque de casi noventa pixeles
       gastaba un reparto que otro habia medido, y el consentimiento acababa
       montando el campo -- 34 px, visto en el telefono del Soberano. Fuera de
       la columna sigue estando donde se escribe, justo debajo, y no le quita
       sitio a la conversacion.

       Y DEBAJO DE LOS ATAJOS, no encima (2026-09-07). Pedido por el Soberano,
       y el orden dice una jerarquia: los atajos son lo que se PULSA nada mas
       terminar de escribir --tres botones a un dedo del campo-- y el
       consentimiento es un ajuste que se toca una vez en la vida. Con la caja
       en medio, la fila de atajos quedaba a noventa pixeles de su campo y
       detras de una casilla que no lleva a ningun sitio.

       El anclaje se busca por orden: los atajos primero y la placa como
       respaldo. `benchmark` tiene campo y no tiene atajos, asi que sin el
       respaldo esta caja no se pintaria alli -- y la casilla de consentimiento
       no puede depender de que una pagina tenga sugerencias. */
    /* UNA VEZ DECIDIDO, SE VA DE LA PLACA Y VIVE EN LA RUEDA (2026-09-08,
       decision del Soberano). En un telefono esta casilla ocupa dos lineas
       encima del campo de escribir, y las ocupa PARA SIEMPRE aunque ya la
       hayas contestado: preguntar dos veces lo mismo no es cuidado, es ruido.

       Se mira si HAY decision guardada --da igual si fue si o no--, no si esta
       marcada. Un `no` es una respuesta tan valida como un `si`, y esconder
       solo los `si` dejaria la casilla puesta justo a quien ya dijo que no.

       No se pierde: se mueve al panel de ajustes, que es donde se cambia de
       opinion. Y si ese panel no existe en esta pagina, la caja se queda donde
       estaba -- retirarla sin sitio adonde ir seria borrar el control. */
    var decidido = false;
    try { decidido = localStorage.getItem('preceptor-consiento') !== null; }
    catch (e) { /* navegador sin almacen: se pinta como siempre */ }
    var rueda = decidido && document.getElementById('panel-ajustes');
    if (rueda) { caja.classList.add('consiento-en-rueda'); rueda.appendChild(caja); return; }

    /* EL OYENTE ES PROPIO Y NO UN PARCHE en el que ya guardaba. Se probo al
       reves --meter la mudanza dentro de aquel-- y no corrio: hay mas de un
       sitio que escribe la decision, y el que se parcheo no era el que se
       dispara. Un oyente aparte no depende de cual gane. */
    cb.addEventListener('change', function () {
      var r = document.getElementById('panel-ajustes');
      if (r && caja.parentNode !== r) {
        caja.classList.add('consiento-en-rueda'); r.appendChild(caja);
      }
    });

    var atajos = document.getElementById('atajos');
    var ancla = (atajos && atajos.parentNode) ? atajos : campo.closest('.panel');
    if (ancla && ancla.parentNode) ancla.parentNode.insertBefore(caja, ancla.nextSibling);
    else (campo.closest('.fila') || campo.parentNode).parentNode.insertBefore(caja, null);
  }

  function arrancar() {
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    consentimiento(CONS[lang] || CONS['en']);
  }
  addEventListener('load', arrancar);
  if (document.readyState === 'complete') arrancar();
})();
