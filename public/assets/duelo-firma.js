/* preceptoros.org · LoRAtelier · el veredicto del duelo, firmado.
 *
 * POR QUE ESTA PARTIDO DE `duelo.js`, con su cifra: al poner el techo de
 * tokens y la medida de degeneracion, aquel fichero se fue 120 B sobre el tope
 * de 16.383. La casa parte POR ASUNTO y jamas recorta un comentario; es la
 * novena vez en este arbol y la segunda hoy.
 *
 * Y el corte cae solo, porque son dos trabajos distintos:
 *   `duelo.js`   · PIDE los dos turnos y los pinta. Sabe del rack, del arnes
 *                  y de cuanto tarda cada columna.
 *   este fichero · recoge el JUICIO de la persona y lo firma. No pide turnos
 *                  ni sabe que modelo contesto --- se lo dan hecho.
 *
 * NO HABLA CON EL RACK. Guarda el par firmado en `Bronce`, el almacen del
 * aparato, y de ahi lo recoge la unica puerta de salida que tiene el sitio.
 * Firmar NO envia, y se dice en pantalla con el rotulo que ya tiene la Torre.
 */
(function () {
  /* EL VEREDICTO SE FIRMA CON LA MISMA MAQUINARIA QUE UN PASO DE LA TORRE, y
     esta pantalla no habla con el rack para enviarlo: guarda en `Bronce` y
     sale por la unica puerta que tiene el sitio. Firmar NO envia, y se dice.

     `origen` lleva `#duelo` dentro por lo mismo que la Torre lleva su piso:
     un veredicto de aqui y una correccion de la portada son dos poblaciones
     distintas --- distinta intencion, distinto publico --- y mezclarlas
     contamina las dos. */
  function montaVeredicto(caja, pregunta, r) {
    caja.innerHTML = '';
    caja.appendChild(el('p', 'duelo-cab', UI.duelo_veredicto || 'Veredicto'));
    var area = document.createElement('textarea');
    area.className = 'duelo-campo';
    area.rows = 3;
    area.placeholder = UI.duelo_guia || '';
    area.setAttribute('aria-label', UI.duelo_veredicto || 'Veredicto');
    caja.appendChild(area);
    var firmar = el('button', null, UI.duelo_firmar || 'Firmar');
    firmar.type = 'button';
    caja.appendChild(firmar);
    var dice = el('p', 'no-data', '');
    caja.appendChild(dice);

    firmar.addEventListener('click', function () {
      var t = area.value.trim();
      if (!t) { dice.textContent = UI.duelo_sin_prueba || ''; area.focus(); return; }
      if (!window.Identity || !window.Bronce) {
        dice.textContent = 'NO_DATA · este navegador no tiene identidad ni almacen';
        return;
      }
      firmar.disabled = true;
      var reg = {
        prompt: pregunta,
        /* LA RECHAZADA ES LA DESNUDA Y LA ELEGIDA ES LA VESTIDA, y esto es una
           afirmacion fuerte que conviene mirar de frente: se da por hecho que
           el arnes mejora. Lo dice una medida --- de 4 a 10 en el juez de la
           casa --- y no una preferencia. Si la persona opina lo contrario, eso
           es exactamente lo que escribe en el veredicto, y el veredicto viaja
           entero en `correccion`. */
        respuesta: r.a,
        correccion: t,
        corregido: new Date().toISOString(),
        modelo: r.modelo,
        idioma: lang,
        motivo: 'duelo',
        tarea: 'libre',
        consent: 0,
        origen: 'preceptoros.org' + location.pathname + '#duelo',
        tipo: 'correccion',
        autoridad: 1
      };
      window.Identity.firmar(reg).then(function (f) {
        return window.Identity.publica().then(function (pub) {
          return window.Bronce.guardar({ par: reg, firma: f.firma,
            autor: f.autor, algoritmo: f.algoritmo, publica: pub });
        });
      }).then(function () {
        caja.innerHTML = '';
        caja.appendChild(el('p', 'duelo-cab',
          (UI.duelo_firmar || '') + ' ✓'));
        var aviso = UI.torre_no_enviado || '';
        var boton = (window.ENVT && window.ENVT.envBoton) || '';
        if (aviso) {
          caja.appendChild(el('p', 'no-data',
            aviso + (boton ? ' «' + boton + '»' : '')));
        }
      }).catch(function (e) {
        firmar.disabled = false;
        dice.textContent = e.message;
        /* La misma salida del callejon que la Torre, y ya compartida:
           `identidad-o-salida.js`. Era la cuarta copia del bloque en el
           arbol. */
        window.ConIdentidad(e, caja, function (t) { dice.textContent = t; },
                            function () { firmar.click(); });
      });
    });
  }

  window.DueloFirma = montaVeredicto;
})();
