/* preceptoros.org · registra el Service Worker. Nada mas.
 *
 * Vive aparte y no dentro de otro guion a proposito: `instalar.html` y
 * `hitos.html` no cargan NINGUN javascript, y meter el registro dentro de
 * `pie.js` o `chat.js` habria dejado esas dos paginas fuera del PWA sin que
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
