/* preceptoros.org · el cargador del piso 9, ATLAS · el Bosque Sumergido.

   A DEMANDA, NO DE SALIDA. El piso son cuatro guiones, una hoja y una tira
   de pixel art: unos 110 KB que nadie tiene por que bajar si no abre el piso.
   Este fichero es lo unico que carga la Torre; el resto se inyecta la primera
   vez que alguien abre `#piso-atlas`, y ni entra en el precache ni en
   ninguna pagina.

   EL ORDEN IMPORTA, y por eso `async = false`: el arte antes que el mapa, el
   dialogo antes que el piso. `atlas-piso.js` se monta solo al llegar, porque
   la Torre ya esta pintada y `window.TorreUI` existe. */
(function () {
  'use strict';
  var GUIONES = [['atlas-arte.js'], ['atlas-mapa.js'],
    ['atlas-dialogo.js', '/assets/'], ['atlas-piso.js', '/']];
  var cargado = false;

  function carga() {
    if (cargado) { return; }
    cargado = true;
    var hoja = document.createElement('link');
    hoja.rel = 'stylesheet'; hoja.href = '/assets/atlas.css';
    document.head.appendChild(hoja);
    GUIONES.forEach(function (g) {
      var s = document.createElement('script');
      s.src = '/assets/' + g[0];
      s.async = false;
      if (g[1]) { s.dataset.base = g[1]; }
      document.head.appendChild(s);
    });
  }

  function engancha() {
    var piso = document.getElementById('piso-atlas');
    if (!piso || piso.dataset.atlas) { return; }
    piso.dataset.atlas = '1';
    if (piso.open) { carga(); return; }
    piso.addEventListener('toggle', function () { if (piso.open) { carga(); } });
  }

  window.addEventListener('preceptor:torre', engancha);
  if (document.getElementById('piso-atlas')) { engancha(); }
})();
