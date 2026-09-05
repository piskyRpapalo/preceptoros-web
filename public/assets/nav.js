/* preceptoros.org · el cabezal de las paginas interiores.
 *
 * POR QUE EXISTE. Cada pagina llevaba su propia lista de enlaces escrita a
 * mano: `community` cinco, `benchmark` cuatro, `onboarding` dos, y en distinto
 * orden. Peor: con OTROS nombres --«Portada» donde el cabezal de la portada
 * dice «INICIO», «Benchmark» donde dice «LORATELIER»--, asi que el mismo sitio
 * se llamaba de dos maneras segun desde donde lo mirases. Seis paginas por
 * ocho lenguas son 48 sitios donde acordarse, y no se acordo nadie.
 *
 * Ahora lo pinta esto, con los rotulos de `nav.json`, que a su vez salen del
 * bloque i18n de cada portada: la palabra es literalmente la misma arriba y
 * abajo porque es el mismo dato.
 *
 * LA CASA ES UN ICONO, no la palabra. Un dibujo se reconoce sin leerlo y no
 * hay que traducirlo: quita trabajo a quien lo escribe y trabajo cognitivo a
 * quien lo usa. El nombre sigue en el `aria-label` y en el `title` -- quien
 * navega con lector o con el cursor lo tiene igual.
 *
 * LA PAGINA ACTUAL NO SE ENLAZA A SI MISMA: se marca con `aria-current` y se
 * queda sin `href`. Un boton que lleva donde ya estas gasta un toque y no hace
 * nada.
 */
(function () {
  var cab = document.querySelector('header:not(#cabezal)');
  if (!cab) return;
  var marca = cab.querySelector('.marca');
  if (!marca) return;

  var CASA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"'
    + ' stroke="currentColor" stroke-width="1.9" stroke-linecap="round"'
    + ' stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M3 11 12 3l9 8"></path>'
    + '<path d="M5 10v10h5v-6h4v6h5V10"></path></svg>';

  fetch('/nav.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var lang = document.documentElement.lang;
      var T = (d.textos || {})[lang] || (d.textos || {}).es || {};
      var base = '/' + lang + '/';
      var aqui = location.pathname;

      // La vieja lista de enlaces se va: si se quedara, habria dos cabezales.
      var vieja = marca.querySelector('p');
      if (vieja) vieja.remove();

      var nav = document.createElement('nav');
      nav.className = 'cab-nav-interior';
      nav.setAttribute('aria-label', T.home);

      [[base, T.casa, true], [base + 'benchmark.html', T.benchmark, false],
       [base + 'community.html', T.comunidad, false],
       [base + 'instalar.html', T.instala, false]].forEach(function (par) {
        var url = par[0], rotulo = par[1], esCasa = par[2];
        var actual = aqui === url || aqui === url + 'index.html';
        var n = document.createElement(actual ? 'span' : 'a');
        n.className = 'cab-boton' + (esCasa ? ' cab-casa' : '');
        if (!actual) n.href = url;
        if (esCasa) {
          n.innerHTML = CASA;
          n.setAttribute('aria-label', rotulo);
          n.title = rotulo;
        } else {
          n.textContent = rotulo;
        }
        if (actual) n.setAttribute('aria-current', 'page');
        nav.appendChild(n);
      });
      marca.parentNode.insertBefore(nav, marca.nextSibling);
    })
    .catch(function () { /* sin catalogo se queda el cabezal sin fila: mejor eso
                            que media fila con nombres de dos epocas */ });
})();
