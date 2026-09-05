/* preceptoros.org · el Service Worker y el boton de instalar.
 *
 * Vive aparte y no dentro de otro guion a proposito: `instalar.html` y
 * `hitos.html` no cargan NINGUN javascript, y meter el registro dentro de
 * `chat.js` habria dejado esas dos paginas fuera del PWA sin que
 * se notara. Un fichero de 700 bytes que se puede poner en las diecinueve
 * paginas es mas barato que la excepcion que habria que recordar.
 *
 * Se registra DESPUES de `load` y no antes: durante la carga el navegador
 * esta ocupado con lo que el visitante vino a ver, y el trabajo del worker
 * --precachear diecinueve rutas-- competiria con el LCP de la pagina que lo
 * arranca. El PWA sirve a la SEGUNDA visita; robarle ancho de banda a la
 * primera para adelantarlo es un mal negocio.
 *
 * Si falla, falla en silencio. Un sitio que funciona sin worker es el caso
 * normal --la primera visita de todo el mundo-- y no hay nada que anunciar.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  // file:// no admite workers y `localhost` sin https tampoco en algunos
  // navegadores. Se comprueba en vez de suponer: un error en consola en cada
  // carga local acaba ensenando a ignorar la consola.
  if (!self.isSecureContext) return;
  addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
})();

/* --- EMPIEZA AQUI se convierte en «instala esto en tu aparato» -------------
 *
 * El boton era un enlace normal a `onboarding.html`. Sigue siendolo cuando no
 * hay nada que instalar, que es la mitad del diseno: no se rompe nada por
 * defecto.
 *
 * TRES CAMINOS, y el tercero es el que suele faltar.
 *
 * 1. El navegador ofrece instalar -> dispara `beforeinstallprompt`. Se guarda
 *    el evento --hay que llamarlo desde un gesto de la persona, no desde aqui--
 *    y el boton pasa a instalar de verdad.
 *
 * 2. Ya esta instalada -> no se toca el boton. Ofrecer instalar lo que ya esta
 *    puesto es la clase de detalle que hace dudar de todo lo demas.
 *
 * 3. iOS. Safari NO dispara `beforeinstallprompt` y no lo va a disparar: en
 *    iPhone no existe la instalacion por programa, solo «Compartir -> Anadir a
 *    pantalla de inicio». Un boton que promete instalar y no hace nada en un
 *    iPhone seria una promesa rota en la puerta de un producto cuyo argumento
 *    entero es la honestidad. Asi que ahi el boton no instala: ensena el
 *    camino a mano, escrito.
 *
 * Los rotulos salen del bloque i18n de la pagina, que es donde vive el resto
 * del texto. Sin bloque --hay paginas que no lo llevan-- esto no hace nada, y
 * ese es el comportamiento correcto: no hay boton que convertir.
 */
(function () {
  var guardado = null;
  // Se escucha YA, fuera del `load`: el navegador dispara este evento pronto y
  // quien llegue tarde no lo ve nunca. `preventDefault` evita el cartel propio
  // del navegador, que aparece donde el quiere y no donde esta el boton.
  addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    guardado = e;
    conecta();
  });

  function textos() {
    var b = document.getElementById('i18n');
    if (!b) return null;
    try { return JSON.parse(b.textContent); } catch (_) { return null; }
  }

  function instalada() {
    // Dos formas, porque ningun navegador tiene las dos: la consulta de medios
    // es la del estandar y `standalone` es la de Safari.
    return (matchMedia && matchMedia('(display-mode: standalone)').matches) ||
           navigator.standalone === true;
  }

  function esIos() {
    // Se pregunta por lo que hace falta --si este navegador ofrece el gesto de
    // «anadir a la pantalla»-- y no por la marca del aparato. `standalone`
    // existe solo en Safari de iOS, y vale `false` mientras no este instalada.
    return navigator.standalone === false;
  }

  function conecta() {
    var boton = document.querySelector('.cab-boton.empezar');
    var T = textos();
    if (!boton || !T || instalada()) return;

    if (guardado) {
      boton.textContent = T.cabInstala;
      boton.onclick = function (ev) {
        ev.preventDefault();
        guardado.prompt();
        // No se comprueba el resultado: si dice que no, el enlace de siempre
        // sigue ahi y no hay nada que anunciar. Preguntar dos veces molesta.
        guardado = null;
      };
      return;
    }

    if (esIos()) {
      boton.textContent = T.cabInstala;
      boton.onclick = function (ev) {
        ev.preventDefault();
        var ya = document.getElementById('comoInstalar');
        if (ya) { ya.remove(); return; }
        var p = document.createElement('p');
        p.id = 'comoInstalar';
        p.className = 'como-instalar';
        p.textContent = T.cabInstalaIos;
        boton.parentNode.insertBefore(p, boton.nextSibling);
      };
    }
  }

  // El cabezal lo dibuja `hub.js`, que corre antes que este fichero; aun asi se
  // reintenta en `load` por si el evento del navegador llega mas tarde que el
  // marcado, que es el orden normal.
  addEventListener('load', conecta);
  conecta();
})();
