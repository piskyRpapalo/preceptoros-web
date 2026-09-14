/* preceptoros.org · LOS TRES ACCESOS GRANDES DE LA PORTADA.

   Orden del Soberano, 2026-09-14: debajo del chat, tres puertas grandes --el
   LorAtelier, la Comunidad y la instalacion-- para que quien entra sepa que hay
   detras sin tener que leerse la pagina ni encontrar el cabezal.

   NO DUPLICA LA NAVEGACION: son los MISMOS destinos del cabezal y los mismos
   rotulos, leidos de `nav.json` --que los genera `nav.py` desde el bloque i18n
   de cada portada, para que la palabra sea literalmente la misma arriba y
   abajo--. Escribirlos aqui otra vez seria tener que traducirlos dos veces y
   verlos separarse a la primera correccion.

   Y NO LLEVA A NINGUN SITIO NUEVO. Tres botones que repiten el cabezal no son
   redundancia: el cabezal es para quien ya sabe donde va, y esto es para quien
   acaba de llegar y todavia no ha mirado arriba. */
(function () {
  var raiz = document.getElementById('accesos');
  if (!raiz) return;
  var lang = (document.documentElement.lang || 'es').slice(0, 2);

  fetch('/nav.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var t = (d.textos || {})[lang] || (d.textos || {}).es;
      if (!t) return;
      [['benchmark', './benchmark.html', 'btn-primario'],
       ['comunidad', './community.html', 'btn-primario'],
       ['instala', './instalar.html', 'btn-secundario']].forEach(function (x) {
        var a = document.createElement('a');
        a.className = 'acceso ' + x[2];
        a.href = x[1];
        a.textContent = t[x[0]];
        raiz.appendChild(a);
      });
    })
    .catch(function () { /* sin rotulos no se pintan botones mudos */ });
})();
