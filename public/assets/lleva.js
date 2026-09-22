/* preceptoros.org · LLEVAR A ALGUIEN A UN SITIO DE LA PAGINA, y que lo vea.
 *
 * EL GESTO, pedido por el Soberano el 2026-09-23: un boton que te manda a otra
 * parte de la pagina y, al llegar, «el recuadro completo parpadea, asi sabe
 * que le estamos enviando». Y «en todos los casos de la web, pues es bastante
 * intuitivo». Un salto sin señal deja a quien lo sufre mirando una pantalla
 * distinta sin saber que parte de ella es la que se le queria enseñar.
 *
 * UNA SOLA IMPLEMENTACION PARA TODA LA CASA. Tres formas de pedirlo:
 *   · desde codigo:      window.Lleva(nodoOSelector)
 *   · desde marcado:     <button data-lleva="#especificaciones">...</button>
 *   · un enlace interno: <a href="#foro">  (mismo documento; ahi solo se
 *     añade el parpadeo, el salto lo hace el navegador como siempre)
 * Desplazar hasta el recuadro y hacerlo parpadear tres veces en oro. El
 * parpadeo lo pinta `mandos.css` (`.llamada`).
 *
 * QUIEN PIDE MENOS MOVIMIENTO no recibe ni el desplazamiento suave ni el
 * parpadeo: salta y el recuadro queda marcado con un filete fijo. La señal es
 * la misma; lo que se quita es la animacion.
 *
 * EL FOCO VIAJA CON LA VISTA. Quien navega con teclado o lector de pantalla
 * no ve un parpadeo: se le mueve el foco al recuadro, que es su forma de
 * «llegar». Sin `preventScroll`, el navegador saltaria de golpe y se comeria
 * el desplazamiento suave.
 *
 * LO CARGA `cabezal-rotulos.js`, que viaja en todas las paginas, para no
 * añadir una etiqueta a 56 ficheros (el griego tiene 65 bytes libres).
 */
(function () {
  'use strict';
  if (window.Lleva) return;
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parpadea(n) {
    n.classList.remove('llamada');
    void n.offsetWidth;                  // reinicia la animacion si ya estaba
    n.classList.add('llamada');
    setTimeout(function () { n.classList.remove('llamada'); }, quieto ? 2500 : 1700);
  }

  function Lleva(destino) {
    var n = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (!n) return false;
    // Un pliego cerrado que contiene el destino se abre: llevar a algo
    // escondido seria llevar a nada.
    var d = n.closest && n.closest('details:not([open])');
    if (d) d.open = true;
    n.scrollIntoView({ block: 'start', behavior: quieto ? 'auto' : 'smooth' });
    if (!n.hasAttribute('tabindex')) n.setAttribute('tabindex', '-1');
    try { n.focus({ preventScroll: true }); } catch (e) { /* sin foco: se ve igual */ }
    parpadea(n);
    return true;
  }
  window.Lleva = Lleva;

  /* EL DELEGADO. Con `data-lleva`, el gesto entero. Con un enlace `#` de los
     de siempre, SOLO el parpadeo: el salto lo sigue haciendo el navegador,
     porque hay pestanas y pliegos que dependen del hash y quitarselo por un
     efecto visual seria romperlos. Y si otro guion ya atendio el clic
     (`defaultPrevented`), no se toca: el es el dueno de ese enlace. */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var b = e.target.closest && e.target.closest('[data-lleva], a[href^="#"]');
    if (!b) return;
    var sel = b.getAttribute('data-lleva') || b.getAttribute('href');
    if (!sel || sel === '#') return;
    var n = null;
    try { n = document.querySelector(sel); } catch (err) { return; }
    if (!n) return;                      // destino ausente: que haga lo de siempre
    if (b.hasAttribute('data-lleva')) { e.preventDefault(); Lleva(n); return; }
    setTimeout(function () { parpadea(n); }, 60);
  });
})();
