/* preceptoros.org · el pie honesto y los enlaces, desde el bloque i18n.
   Existe porque estaban escritos a mano en cada portada y las tres decian lo
   mismo EN ESPANOL: /en/ y /fr/ mostraban el pie castellano a quien no lo
   habla. Un texto visible fuera del i18n no se traduce -- se olvida. */
(function () {
  'use strict';
  var b = document.getElementById('i18n');
  var ul = document.getElementById('pie-honesto');
  var nav = document.getElementById('pie-enlaces');
  if (!b) return;
  var T = JSON.parse(b.textContent);

  function li(fuerte, resto) {
    var e = document.createElement('li');
    var s = document.createElement('strong');
    s.textContent = fuerte;
    e.appendChild(s);
    e.appendChild(document.createTextNode(' ' + resto));
    return e;
  }

  if (ul) {
    ul.innerHTML = '';
    /* La cuarta es el badge solar. Entra como PAR con el resto vacio en vez de
       con render propio: el bucle de abajo ya sabe pintar `<strong>` + texto,
       asi que la insignia cuesta una linea en vez de un bloque. Si algun dia
       lleva segunda mitad, ya tiene sitio.

       Y usa `cabSolar`, la MISMA clave que el cabezal. Habia dos: `pieSolar`
       decia «servido por IA 99% solar (excepto Cloudflare)» y el cabezal
       «excepto el proveedor web». Dos frases sobre el mismo hecho, una
       nombrando al proveedor y la otra no -- la clase de par que se separa mas
       cada vez que alguien retoca una sola. Se fundieron el 2026-09-04 en la
       redaccion que firma el Soberano, que dice las dos cosas. */
    /* LA FRASE SOLAR SALE DE AQUI el 2026-09-05. Se decia DOS VECES en la
       misma pagina --arriba en el cabezal y abajo en esta lista-- y con la
       misma clave, asi que no era ni siquiera una segunda redaccion: era el
       mismo texto repetido a dos pantallas de distancia. Se queda arriba, que
       es donde se lee primero. */
    [['pie1f', 'pie1r'], ['pie2f', 'pie2r'], ['pie3f', 'pie3r']]
      .forEach(function (par) {
        if (T[par[0]]) ul.appendChild(li(T[par[0]], T[par[1]] || ''));
      });
  }

  /* EL PIE YA NO LLEVA ENLACES. Solo quedaba Hitos --`hitos.html`-- y estaba
     roto: la ruta `../hitos.html` se resolvia mal desde las portadas de idioma.
     Un enlace que no lleva a ninguna parte es peor que la ausencia del enlace,
     porque la ausencia no promete nada. Si Hitos vuelve, vuelve con su ruta
     comprobada. `#pie-enlaces` ya no existe en el marcado. */
})();
