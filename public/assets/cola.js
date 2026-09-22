/* preceptoros.org · la cola del rack, a la vista.
 *
 * EL RACK ATIENDE DE UNO EN UNO, Y NO ES UN DEFECTO. Medido el 2026-09-19 en
 * el Soberano: el modelo genera 16,1 tok/s en total, igual con una persona que
 * con ocho. Mas huecos no dan mas capacidad; solo reparten la misma y alargan
 * la espera de todos. Asi que `agora_api` hace cola --semaforo de uno, primero
 * en llegar, primero en salir-- y este fichero la CUENTA.
 *
 * DE DONDE SALE CADA CIFRA. El servidor manda la posicion y la espera en
 * cabeceras (`X-Cola-*`), que llegan ANTES que el primer token: se sabe cuanto
 * falta en cuanto se envia la pregunta, no cuando ya contesta. Las lee
 * `rack.js` y las reparte con el evento `preceptor:cola`; aqui solo se pintan.
 * Ninguna se calcula en el navegador: inventar una aqui seria tener dos
 * verdades, la del que mide y la del que dibuja.
 *
 * LA ESPERA ES UN TECHO, NO UNA PREDICCION, y se dice. El servidor la calcula
 * con lo maximo que el modelo PUEDE escribir, no con lo que suele: en la
 * prueba de carga el ultimo de doce tenia 29,8 s de techo y acabo en 18,4.
 * Quien ve «30 s» y espera 18 no se siente enganado; al reves si.
 *
 * CERO RUEDAS. Aqui no gira nada. Una rueda dice «algo pasa» sin decir que ni
 * cuanto, y eso es exactamente el «procesando» falso que la cola existe para
 * sustituir. Lo que se mueve es un numero de segundos que baja.
 *
 * LO QUE NO SE ANUNCIA CADA SEGUNDO. El puesto y el estado del modelo van en
 * una region `aria-live`, que un lector de pantalla lee una vez. La cuenta
 * atras no: leida en voz alta cada segundo seria ruido, no ayuda.
 *
 * SE CARGA TARDE A PROPOSITO. No hay etiqueta <script> en la portada: el
 * griego tiene 65 bytes libres y no cabe. La pide `rack.js` al enviar el
 * primer turno, que ademas respeta la regla de «cero peticiones al cargar».
 * Si llega despues que las cabeceras, lee el ultimo estado en `Rack.cola` y
 * descuenta el tiempo que ya paso: no empieza la cuenta de cero.
 */
(function () {
  'use strict';
  if (window.Cola) return;

  var T = null, nodo = null, dice = null, reloj = null, cifra = null;
  var tic = null, fase = null;

  /* LOS ROTULOS: el bloque propio de la pagina manda, la familia `motor-*`
     es el respaldo. Es la regla ya escrita en `auth.js` y `engine.js`: si la
     pagina los trae no se pide nada a la red. Y si no llegan, sale la clave a
     la vista --- feo y legible antes que bonito y mudo. */
  function textos() {
    if (T) return Promise.resolve(T);
    var propio = {};
    try { propio = JSON.parse(document.getElementById('i18n').textContent) || {}; }
    catch (e) { propio = {}; }
    if (propio.colaPos) { T = propio; return Promise.resolve(T); }
    var pide = function (l) {
      return fetch('/motor-' + l + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    };
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    return pide(lang)
      .then(function (d) { return d || pide('es'); })
      .then(function (d) { T = (d && d.ui) || {}; return T; });
  }
  function t(k) { return (T && T[k]) || k; }

  function monta() {
    if (nodo) return nodo;
    var ancla = document.getElementById('dialogo') || document.getElementById('chat');
    if (!ancla) return null;          // pagina sin chat: no hay donde contar
    nodo = document.createElement('p');
    nodo.id = 'cola';
    nodo.className = 'tenue cola';
    nodo.hidden = true;
    dice = document.createElement('span');
    dice.setAttribute('role', 'status');
    dice.setAttribute('aria-live', 'polite');
    reloj = document.createElement('span');
    reloj.setAttribute('aria-hidden', 'true');
    nodo.appendChild(dice);
    nodo.appendChild(reloj);
    if (ancla.id === 'dialogo' && ancla.parentNode) {
      ancla.parentNode.insertBefore(nodo, ancla.nextSibling);
    } else {
      ancla.appendChild(nodo);
    }
    return nodo;
  }

  function calla() {
    if (tic) { clearInterval(tic); tic = null; }
    if (nodo) nodo.hidden = true;
  }

  /* La plantilla lleva `{s}` donde va la cifra. Se parte por ahi y se monta
     con nodos, no con innerHTML: el texto viene de un .json, pero la costumbre
     es la que protege el dia que no. */
  function pintaReloj(plantilla, s) {
    reloj.textContent = '';
    var trozos = plantilla.split('{s}');
    reloj.appendChild(document.createTextNode(' · ' + trozos[0]));
    cifra = document.createElement('b');
    cifra.className = 'cifra';
    cifra.textContent = String(s);
    reloj.appendChild(cifra);
    if (trozos[1]) reloj.appendChild(document.createTextNode(trozos[1]));
  }

  function cuenta(d) {
    var pasado = (Date.now() - (d.t0 || Date.now())) / 1000;
    var falta = Math.max(0, Math.ceil((+d.espera || 0) - pasado));
    if (falta > 0) {
      if (cifra && reloj.firstChild) { cifra.textContent = String(falta); }
      else { pintaReloj(t('colaEspera'), falta); }
    } else {
      // Pasado el techo sin primer token: no se cuenta en negativo, que seria
      // presumir de una precision que la cifra nunca tuvo.
      reloj.textContent = ' · ' + t('colaCasi');
      cifra = null;
      if (tic) { clearInterval(tic); tic = null; }
    }
  }

  function muestra(d) {
    if (!monta()) return;
    // Se mira la fase ANTERIOR antes de pisarla. En la primera version se
    // asignaba primero y la guarda de «llena» de abajo nunca podia cumplirse:
    // el aviso de cola llena se borraba en el mismo instante en que salia.
    var antes = fase;
    if (d.fase === 'fin' && antes === 'llena') return;
    fase = d.fase;
    if (d.fase === 'cola') {
      var partes = [t('colaPos').replace('{n}', String(d.posicion))];
      if (d.estado === 'frio') partes.push(t('colaFrio'));
      if (d.estado === 'swap') partes.push(t('colaSwap'));
      dice.textContent = partes.join(' · ');
      cifra = null;
      reloj.textContent = '';
      nodo.title = t('colaTecho') + ' · ' + (d.tokS || '?') + ' tok/s · '
                   + t('colaMedida');
      nodo.hidden = false;
      cuenta(d);
      if (tic) clearInterval(tic);
      tic = setInterval(function () { cuenta(d); }, 1000);
      return;
    }
    if (d.fase === 'llena') {
      if (tic) { clearInterval(tic); tic = null; }
      dice.textContent = t('colaLlena');
      reloj.textContent = '';
      nodo.title = d.causa || '';
      nodo.hidden = false;
      return;
    }
    // `generando` o `fin`. El aviso de cola llena NO se borra con el fin del
    // turno --- lo cubre la guarda de arriba ---: lo que el turno cuenta es su
    // error, y lo util es el remedio. Se va al empezar la pregunta siguiente.
    calla();
  }

  function oye(e) {
    var d = e && e.detail;
    if (!d) return;
    textos().then(function () { muestra(d); });
  }

  window.addEventListener('preceptor:cola', oye);
  window.Cola = { muestra: function (d) { oye({ detail: d }); } };

  // Si las cabeceras llegaron antes que este fichero, el estado ya esta ahi.
  if (window.Rack && window.Rack.cola) oye({ detail: window.Rack.cola });
})();
