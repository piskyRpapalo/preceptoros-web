/* preceptoros.org · EL JUEZ COORDINADOR del estudio. Vive fuera de
   `escenario.js` porque aquel esta a 1,1 KB de su tope y esto no es un retoque:
   es una pieza con su propia doctrina.

   QUE JUZGA. El panel de estudio declara su juez en `paneles.json` --modelo,
   rubrica y una regla-- y hasta hoy eso se quedaba en el fichero. Ahora se
   enseña y se puede pedir: quien practica ve QUIEN le va a puntuar y con que
   antes de escribir una linea.

   Y POR QUE SU VEREDICTO SALE MARCADO COMO UNA SOLA CAPA. No es prudencia: es
   lo que el propio panel exige. Su ficha dice, con estas palabras,
   «determinista primero, MoE despues. Una sola capa es NO_DATA». Desde el
   navegador solo se puede pedir la segunda --la del modelo--, porque la
   primera es codigo que corre en el rack. Asi que el veredicto se pide, se
   enseña entero, y se dice que le falta la mitad.

   Enseñar una nota de 7/10 sin esa linea seria inventarse una autoridad: la
   persona leeria una calificacion firme donde hay media medicion.

   LA RUBRICA VIAJA POR SU NOMBRE. `CHECKPOINTS.md` vive en el rack y este
   navegador no lo tiene. Se manda el nombre y las cinco joyas, que es lo que
   hay; copiar aqui un resumen inventado de la rubrica seria peor que no
   mandarla, porque el juez puntuaria contra algo que no es la rubrica. */
(function () {
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = String(texto);
    return n;
  }

  window.Juez = {
    /* `leer` devuelve la conversacion de este estudio como texto. La pide el
       escenario, que es quien la tiene: este fichero no toca el DOM del chat. */
    caja: function (hecho, UI, leer) {
      var j = hecho && hecho.juez;
      if (!j) return null;
      var sec = el('section', 'esc-juez');
      sec.appendChild(el('h3', null, UI.juezTitulo || ''));
      sec.appendChild(el('p', 'tenue',
        (UI.chatQuien || '') + ' ' + (j.modelo || 'NO_DATA')));
      if (j.rubrica) sec.appendChild(el('p', 'tenue', j.rubrica));

      var b = el('button', 'btn-secundario', UI.juezPedir || '');
      b.type = 'button';
      var salida = el('div', 'esc-veredicto');
      salida.setAttribute('aria-live', 'polite');
      sec.appendChild(b);
      sec.appendChild(salida);

      b.addEventListener('click', function () {
        var conversacion = (leer && leer()) || '';
        salida.innerHTML = '';
        if (!conversacion.trim()) {
          salida.appendChild(el('p', 'no-data', UI.juezSinTurnos || ''));
          return;
        }
        if (!window.Rack || !j.modelo) {
          salida.appendChild(el('p', 'no-data',
            (UI.chatSinRack || '') + ' ' + (j.modelo || 'NO_DATA')));
          return;
        }
        b.disabled = true;
        /* El papel del juez se compone AQUI y en ingles, delimitado, igual que
           el bloque de estado del chat: el modelo lo lee como datos y no como
           una frase mas de la conversacion. */
        var papel = '[RUBRIC]\n' + (j.rubrica || 'NO_DATA') +
          '\n[/RUBRIC]\n\n[TRANSCRIPT]\n' + conversacion + '\n[/TRANSCRIPT]\n\n' +
          'Score the transcript against the rubric. Say what is missing. ' +
          'If the rubric is not enough to score, say NO_DATA and why.';
        var p = el('p', 'esc-el', ''); salida.appendChild(p);
        var acc = '';
        window.Rack.stream(j.modelo, papel, function (d) {
          acc += d;
          p.textContent = window.sinFuga ? window.sinFuga(acc) : acc;
        }).then(function () {
          b.disabled = false;
          if (!acc) { p.className = 'no-data'; p.textContent = UI.chatFallo || ''; }
          else if (UI.juezUnaCapa) {
            salida.appendChild(el('p', 'no-data', UI.juezUnaCapa));
          }
        }).catch(function (e) {
          b.disabled = false;
          p.className = 'no-data';
          p.textContent = (UI.chatFallo || '') + ' ' + (e && e.message ? e.message : e);
        });
      });
      return sec;
    }
  };
})();
