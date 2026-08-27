/* Copia al portapapeles, en dos sabores:
     data-copia="id-de-un-textarea"  -> copia lo que ya esta en la pagina
     data-copia-url="ruta.txt"       -> lo trae del propio dominio AL PULSAR
   El segundo existe porque el encargo de las laminas son 3 KB de texto: metidos
   en el HTML dejaban la pagina en 11 KB y el limite del proyecto es 10 KB por
   fichero. Externo, la pagina cabe, el fichero se puede ABRIR y leer por su
   cuenta, y la peticion solo ocurre cuando alguien pulsa — nunca al cargar.
   Vive aparte de chat.js porque lo usan paginas que no tienen chat. */
(function () {
  var botones = document.querySelectorAll('[data-copia],[data-copia-url]');
  for (var i = 0; i < botones.length; i++) {
    botones[i].addEventListener('click', function () {
      var b = this, antes = b.textContent, hecho = b.getAttribute('data-hecho') || 'OK';
      var manual = b.getAttribute('data-manual') || 'Ctrl+C';
      var url = b.getAttribute('data-copia-url');
      var area = url ? null : document.getElementById(b.getAttribute('data-copia'));
      if (!url && !area) return;
      var fin = function (ok) {
        b.textContent = ok ? hecho : manual;
        setTimeout(function () { b.textContent = antes; }, 2600);
      };
      var alPortapapeles = function (texto) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto)
            .then(function () { fin(true); },
                  function () { if (area) { area.select(); } fin(false); });
        } else if (area) { area.select(); fin(false); } else { fin(false); }
      };
      if (url) {
        b.disabled = true;
        fetch(url).then(function (r) {
          if (!r.ok) throw new Error(r.status);   // un 404 no se copia en silencio
          return r.text();
        }).then(function (t) { b.disabled = false; alPortapapeles(t); })
          .catch(function () { b.disabled = false; fin(false); });
      } else { alPortapapeles(area.value); }
    });
  }
})();
