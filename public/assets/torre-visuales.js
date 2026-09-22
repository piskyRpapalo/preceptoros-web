/* preceptoros.org · LAS LAMINAS DE LA TORRE: una escena de fondo por piso.
 *
 * POR QUE UN FICHERO APARTE. `camino.js` pinta los pisos y esta a 364 B de su
 * tope de 16 KiB: una sola regla de estilo mas lo pasaba. Y es otro asunto --
 * alli «que pisos hay y que hacen», aqui «como se ven»--, que es la
 * regla de la casa para partir: por asunto, nunca recortando comentarios. Lo
 * trae `chat-router.js` detras de la Torre, sin etiqueta en las portadas (el
 * griego no tiene sitio para ella).
 *
 * LAS IMAGENES. Ocho escenas que el Soberano trajo a `Cuarentena/` el
 * 2026-09-22, de 1376x768 y 15 MB en PNG. Aqui van a 512 px de ancho y WebP de
 * calidad 32: ~14 KB cada una, 113 KB las ocho. Se puede bajar tanto porque
 * van DETRAS DE UN VELO: nadie ve el detalle que se pierde. Receta, para
 * rehacerlas si cambian:
 *   cwebp -q 32 -m 6 -resize 512 0 <origen>.png -o assets/torre/piso-N.webp
 *
 * EL ORDEN ES POR NOMBRE, NO POR POSICION. La carpeta de origen las numeraba
 * 1..8, y ese es el orden de la Torre: la cuarta --cuatro tuneles-- cae justo
 * en «Puertos abiertos». Con UNA excepcion, del Soberano al verlas: la 5 y la
 * 7 van cruzadas --el reloj alado es el «Dia del silencio», que tiene su
 * reloj de diez minutos; el orbe con papeles, «¿Quien soy yo, ahi fuera?»--.
 * Por eso el mapa es explicito. Y se atan al `id` del piso y no a su posicion en
 * pantalla: si un piso no trae titulo en una lengua, `camino.js` se lo salta,
 * y contar posiciones le pondria a cada piso la escena del siguiente.
 *
 * CERRADO Y ABIERTO, CON DOS VELOS. La primera version quitaba la escena al
 * abrir --«una foto detras de un parrafo no se lee»--; el Soberano, al verlas,
 * pidio lo contrario: que abierto la escena siga, completa. Se puede sin
 * perder la lectura cambiando el VELO, no la imagen:
 *   · cerrado, un titulo: velo de izquierda a derecha, cerrado donde esta el
 *     texto y abierto donde no hay nada que leer.
 *   · abierto, parrafos y botones: velo parejo y mas denso (~75 %), porque el
 *     texto ya ocupa todo el ancho. La escena se adivina entera, el texto
 *     manda.
 * Y la imagen se ancla arriba al abrir: el piso crece hacia abajo, y lo que
 * se reconoce de la escena tiene que seguir detras del titulo.
 *
 * EL TITULO MANDA SOBRE LA ESCENA. Si hay que elegir entre que se vea la
 * imagen y que se lea el piso, gana el piso.
 *
 * SE PIDEN CUANDO LA TORRE SE ACERCA A LA PANTALLA, no al cargar. La Torre
 * vive debajo del chat, y quien viene a hablar y se va no tiene por que
 * descargar 113 KB de paisajes que no llego a ver. Sin IntersectionObserver
 * se piden sin esperar: mejor pesado que roto.
 */
(function () {
  'use strict';
  if (window.TorreVisuales) return;
  window.TorreVisuales = true;

  var LAMINA = {
    despertar: 1, primeros_pasos: 2, exposicion: 3, puertos: 4,
    whoami: 7, killswitch: 6, silencio: 5, contribuir: 8
  };

  function estilo() {
    if (document.getElementById('torre-laminas')) return;
    var s = document.createElement('style');
    s.id = 'torre-laminas';
    s.textContent =
      '#torre .torre-peldano.con-lamina:not([open]){' +
        'background:linear-gradient(90deg,rgba(18,12,30,.88) 0%,' +
        'rgba(18,12,30,.62) 45%,rgba(18,12,30,.18) 100%),' +
        'var(--lamina) center 58%/cover no-repeat;' +
        'border-color:rgba(242,208,138,.55);color:#fff;' +
        'min-height:clamp(4.6rem,14vw,8rem);justify-content:flex-end;' +
        'transition:filter .2s ease-out}' +
      '#torre .torre-peldano.con-lamina:not([open]):hover{filter:brightness(1.12)}' +
      '#torre .torre-peldano.con-lamina:not([open])>summary{' +
        'text-shadow:0 1px 2px #000,0 0 12px rgba(0,0,0,.7);' +
        'font-size:1.05em;padding-top:1.4rem}' +
      '#torre .torre-peldano.con-lamina:not([open]) .torre-n{' +
        'opacity:1;color:var(--oro,#f2d08a)}' +
      '#torre .torre-peldano.con-lamina[open]{' +
        'background:linear-gradient(rgba(18,12,30,.55),rgba(18,12,30,.74) ' +
        '9rem,rgba(18,12,30,.78)),' +
        'var(--lamina) center top/cover no-repeat;' +
        'border-color:rgba(242,208,138,.55);color:#fff}' +
      '#torre .torre-peldano.con-lamina[open]>summary,' +
      '#torre .torre-peldano.con-lamina[open] .torre-cuerpo{' +
        'text-shadow:0 1px 2px rgba(0,0,0,.8)}' +
      '#torre .torre-peldano.con-lamina[open] .torre-n{' +
        'opacity:1;color:var(--oro,#f2d08a)}';
    document.head.appendChild(s);
  }

  function viste() {
    Object.keys(LAMINA).forEach(function (p) {
      var d = document.getElementById('piso-' + p);
      if (!d || d.classList.contains('con-lamina')) return;
      d.style.setProperty('--lamina',
        'url(/assets/torre/piso-' + LAMINA[p] + '.webp)');
      d.classList.add('con-lamina');
    });
  }

  function cuandoSeVea() {
    var torre = document.getElementById('torre');
    if (!torre || torre.tagName !== 'SECTION') return;  // NO_DATA: no hay pisos
    estilo();
    if (!('IntersectionObserver' in window)) { viste(); return; }
    var mira = new IntersectionObserver(function (vistos) {
      if (vistos.some(function (v) { return v.isIntersecting; })) {
        mira.disconnect();
        viste();
      }
    }, { rootMargin: '400px 0px' });
    mira.observe(torre);
  }

  // Si la Torre ya pinto --cache caliente--, `TorreUI` esta puesto y el aviso
  // ya paso; si no, se espera al aviso. Mismo contrato que `camino-killswitch.js`.
  if (window.TorreUI) cuandoSeVea();
  else window.addEventListener('preceptor:torre', cuandoSeVea, { once: true });
})();
