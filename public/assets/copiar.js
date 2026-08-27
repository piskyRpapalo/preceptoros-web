/* Copia al portapapeles el contenido de un <textarea> por su id.
   Vive aparte de chat.js porque lo usan paginas que no tienen chat, y porque
   un fichero de 700 B se cachea una vez y sirve a todas. */
(function () {
  var botones = document.querySelectorAll('[data-copia]');
  for (var i = 0; i < botones.length; i++) {
    botones[i].addEventListener('click', function () {
      var area = document.getElementById(this.getAttribute('data-copia'));
      if (!area) return;
      var b = this, antes = b.textContent, hecho = b.getAttribute('data-hecho') || 'OK';
      var manual = b.getAttribute('data-manual') || 'Ctrl+C';
      var fin = function (ok) {
        b.textContent = ok ? hecho : manual;
        setTimeout(function () { b.textContent = antes; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(area.value)
          .then(function () { fin(true); }, function () { area.select(); fin(false); });
      } else { area.select(); fin(false); }
    });
  }
})();
