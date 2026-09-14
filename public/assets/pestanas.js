/* preceptoros.org · PESTAÑAS, y una sola implementacion para toda la casa.

   Marcado esperado, y es todo lo que pide:

     <div class="pestanas" data-pestanas>
       <button class="pestana" data-panel="proyectos">Proyectos</button>
       <button class="pestana" data-panel="foro">Foro</button>
     </div>
     <div data-hoja="proyectos"> ... </div>
     <div data-hoja="foro" hidden> ... </div>

   POR QUE UN FICHERO Y NO UNA FUNCION DENTRO DE CADA PAGINA: porque hacen falta
   en Comunidad y en el LorAtelier, y dos implementaciones del mismo gesto se
   separan a la primera correccion -- una recuerda el foco y la otra no, y nadie
   sabe cual es la buena.

   ACCESIBLE DE VERDAD, que es la mitad del trabajo: roles `tab`/`tabpanel`,
   `aria-selected` --que es lo que lee un lector de pantalla, no el color-- y
   flechas izquierda/derecha para moverse, como manda el patron. `hidden` y no
   `display:none` a mano: la hoja base ya lo hace cumplir y el estado vive en el
   atributo que se lee.

   NO TOCA LA URL. Un `#hash` por pestaña parece gratis y no lo es: convierte
   cada cambio de pestaña en una entrada del historial, y el boton de atras deja
   de hacer lo que la persona espera. */
(function () {
  Array.prototype.forEach.call(
    document.querySelectorAll('[data-pestanas]'), function (barra) {
      var botones = Array.prototype.slice.call(barra.querySelectorAll('.pestana'));
      if (!botones.length) return;
      barra.setAttribute('role', 'tablist');

      function hoja(nombre) {
        return document.querySelector('[data-hoja="' + nombre + '"]');
      }

      function mostrar(cual, mover) {
        botones.forEach(function (b) {
          var mia = b.dataset.panel === cual;
          b.setAttribute('aria-selected', mia ? 'true' : 'false');
          b.setAttribute('tabindex', mia ? '0' : '-1');
          var h = hoja(b.dataset.panel);
          if (h) { h.hidden = !mia; }
          if (mia && mover) b.focus();
        });
      }

      botones.forEach(function (b, i) {
        b.type = 'button';
        b.setAttribute('role', 'tab');
        var h = hoja(b.dataset.panel);
        if (h) {
          h.setAttribute('role', 'tabpanel');
          if (!h.id) h.id = 'hoja-' + b.dataset.panel;
          b.setAttribute('aria-controls', h.id);
        }
        b.addEventListener('click', function () { mostrar(b.dataset.panel, false); });
        b.addEventListener('keydown', function (e) {
          var paso = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
          if (!paso) return;
          e.preventDefault();
          var j = (i + paso + botones.length) % botones.length;
          mostrar(botones[j].dataset.panel, true);
        });
      });

      // La primera manda, y si alguna viene ya marcada en el marcado, esa.
      var marcada = botones.filter(function (b) {
        return b.getAttribute('aria-selected') === 'true';
      })[0];
      mostrar((marcada || botones[0]).dataset.panel, false);
    });
})();
