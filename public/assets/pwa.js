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
    // SE PIDE LA COMPROBACION, no se espera a que el navegador la haga.
    //
    // El navegador solo vuelve a mirar `sw.js` al NAVEGAR. Quien tenga la PWA
    // abierta y no navegue se queda con el worker viejo --y con el shell que
    // ese worker cachea-- indefinidamente. Medido el 2026-09-13 en un Doogee:
    // la web servia ficheros de dias antes y desde el navegador se veia como un
    // fallo de estilos, no como una version vieja.
    //
    // `update()` en cada carga cierra ese hueco y no cuesta nada cuando no hay
    // nada nuevo: el navegador compara bytes y se calla. `skipWaiting` y
    // `clients.claim` --que `sw.js` ya tiene-- hacen el resto sin pedir
    // permiso ni una segunda recarga.
    navigator.serviceWorker.register('/sw.js')
      .then(function (r) { if (r && r.update) { return r.update(); } })
      .catch(function () {});
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
  // Se escucha YA, fuera del `load`: el navegador dispara este evento pronto y
  // quien llegue tarde no lo ve nunca. `preventDefault` evita el cartel propio
  // del navegador, que aparece donde el quiere y no donde esta el boton.
  /* Se guarda y NO se toca el cabezal. El `conecta()` que habia aqui murio el
     2026-09-14 con el secuestro del boton (A25); la llamada sobrevivio a la
     funcion y reventaba en carga. `instalar-descargas.js` tiene su propio
     `beforeinstallprompt` y es quien arma el gesto donde la persona lo pidio. */
  /* El listener SE QUEDA aunque ya no guarde nada, y el motivo no es inercia:
     su `preventDefault` es lo que impide que el navegador saque su propio
     cartel de instalacion donde a el le parece. El evento lo recoge donde
     importa `instalar-descargas.js`, en la pagina que lo cuenta.
     Lo que SI se fue es la variable `guardado`: se escribia y ya no la leia
     nadie desde que murio el secuestro del cabezal (A25). Un valor que solo se
     escribe es una promesa a medias -- parece que algo lo usara. */
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); });

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

  /* EL CABEZAL YA NO SE SECUESTRA. Orden del Soberano, 2026-09-14.

     Aqui vivia un `conecta()` que le cambiaba el `onclick` al boton INSTALAR de
     la cabecera: `preventDefault()` y `prompt()` del navegador. O sea que el
     enlace decia ir a `instalar.html` y no iba -- y en algunos PC el emergente
     tapa la pagina, asi que quien queria LEER como se instala no llegaba nunca
     a la pagina que lo cuenta.

     Un enlace que no lleva a donde dice es la peor clase de boton: se aprende
     mal una vez y se desconfia de todos los demas. La navegacion manda desde el
     cabezal, y punto.

     El prompt no se pierde: vive donde tiene sentido, en el panel «Instalar
     web» de `instalar.html`, que lo arma `instalar-descargas.js` con su propio
     `beforeinstallprompt` y su respaldo manual para los navegadores que no lo
     disparan. Ahi el gesto es el que la persona pidio.

     Y AQUI ABAJO habia un `conecta()` suelto que se quedo cuando la funcion se
     fue. `ReferenceError` en CADA carga de CADA pagina que trae este guion, y
     tres veces por pagina. No lo vio nadie porque el gate lee FICHEROS: no
     abre el sitio, asi que un error de consola no existe para el. Lo cazo
     abrir la portada como la abre una persona. */
})();
