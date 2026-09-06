/* preceptoros.org · el punto de acceso: el estado del dictado, arriba y siempre.
 *
 * POR QUE ARRIBA Y NO SOLO ABAJO. El boton de hablar vive junto al campo de
 * escribir, al final de la pagina. Quien depende del dictado --y esa es la
 * gente para la que existe-- no deberia tener que recorrer la pagina entera
 * para descubrir si esta maquina puede oirle, ni para encontrar la puerta del
 * permiso. El punto lo dice en la esquina, desde el primer momento.
 *
 * NO ES UNA SEGUNDA PUERTA: ES UN ATAJO A LA MISMA. Todo el trato con el
 * servidor externo --que la voz sale de aqui y va a Google, que el si dura una
 * sesion y al recargar se vuelve a preguntar-- lo gobierna `voice.js`. Este
 * fichero no lo repite ni lo decide: encuentra el boton, mira en que estado
 * esta, y al pulsarse le cede el turno. Dos sitios que preguntan lo mismo con
 * dos redacciones distintas es como se pierde un consentimiento.
 *
 * Y NO TRAE NI UNA CADENA NUEVA. El rotulo sale del `title` del propio boton,
 * que ya esta traducido a las ocho lenguas. Un texto nuevo aqui serian ocho
 * traducciones mas por un adorno.
 */
(function () {
  var zona = document.querySelector('#cabezal .cab-fila');
  if (!zona) return;

  function pinta(mic) {
    var punto = document.createElement('button');
    punto.type = 'button';
    punto.className = 'cab-enlaces';

    // El estado sale del boton de hablar, no de una segunda averiguacion:
    // `aria-disabled` es «ni local ni nube», y el permiso de sesion lo escribe
    // `voice.js` en `sessionStorage`. Se lee de donde se escribe.
    var muerto = mic.getAttribute('aria-disabled') === 'true';
    var aceptado = false;
    try { aceptado = sessionStorage.getItem('voz-nube') === '1'; } catch (e) { /* privado */ }
    var porNube = !muerto && /google|externo|extern|Google/i.test(mic.title || '');

    punto.dataset.estado = muerto ? 'sin' : (porNube && !aceptado ? 'pide' : 'listo');
    // El rotulo ES el del boton: mismo texto, misma lengua, una sola verdad.
    punto.title = mic.title || '';
    punto.setAttribute('aria-label', punto.title);

    punto.addEventListener('click', function () {
      // Le cede el turno a quien manda. `scrollIntoView` antes del clic para
      // que el aviso que va a abrirse se vea: un cartel fuera de pantalla es
      // un cartel que no existe.
      mic.scrollIntoView({ block: 'center',
                           behavior: window.matchMedia(
                             '(prefers-reduced-motion: reduce)').matches
                             ? 'auto' : 'smooth' });
      mic.click();
    });
    zona.appendChild(punto);
  }

  /* El boton de hablar lo crea `voice.js` cuando le toca, y este fichero puede
     cargar antes. Se espera un poco y, si no aparece, NO se pinta nada: un
     punto que no lleva a ninguna parte es peor que ningun punto. */
  var intentos = 0;
  (function busca() {
    var mic = document.querySelector('button.mic');
    if (mic) { pinta(mic); return; }
    if (++intentos > 20) return;
    setTimeout(busca, 150);
  })();
})();

/* --- EL AVISO DE ARRANQUE, MUDADO DE LA CARA AL CHAT ------------------------
 * Vivia pegado a la esfera y tapaba la boca del busto justo cuando la cara es
 * lo unico que se mueve. Al bajarlo al pecho lo recortaba el canto del
 * circulo. Se retira de alli y aparece aqui, junto al campo de escribir, que
 * es donde estan los ojos mientras se espera.
 *
 * SE CUELGA DE LOS MISMOS TRES EVENTOS que movian la nube, para que no haya
 * dos maquinas de estado que puedan discrepar. Y el texto sigue saliendo del
 * `#i18n` de la portada: sin la clave no hay aviso, no se inventa un rotulo. */
(function () {
  var campo = document.getElementById('pregunta') ||
              document.querySelector('.chat-input');
  var bloque = document.getElementById('i18n');
  if (!campo || !bloque) return;
  var texto = (JSON.parse(bloque.textContent) || {}).caraPensando;
  if (!texto) return;

  var aviso = document.createElement('p');
  aviso.className = 'arranque-aviso';
  aviso.hidden = true;
  aviso.setAttribute('role', 'status');
  aviso.textContent = texto;
  campo.insertAdjacentElement('afterend', aviso);

  document.addEventListener('preceptor:pensando', function () { aviso.hidden = false; });
  document.addEventListener('preceptor:hablando', function () { aviso.hidden = true; });
  document.addEventListener('preceptor:turno', function () { aviso.hidden = true; });
})();
