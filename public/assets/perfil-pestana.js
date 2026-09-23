/* preceptoros.org · «MI PERFIL», COMO PESTAÑA DE COMUNIDAD.
 *
 * QUE PIDIO EL SOBERANO (addendum F.5, 2026-09-23): fusionar `profile.html` en
 * `community.html` como pestaña «Mi perfil». Una pagina menos que recorrer, y
 * el perfil al lado del foro, que es donde se usa la clave.
 *
 * POR QUE SE MONTA AL ABRIR LA PESTAÑA Y NO VIENE EN EL MARCADO. Medido: los
 * textos del perfil pesan 8,3 KB en griego y la Comunidad griega tiene ~3,9 KB
 * libres de sus 16. No caben, y aunque cupieran, quien entra a leer el foro no
 * tiene por que descargar el perfil. Asi que el marcado solo trae la pestaña y
 * su hoja vacia; `pestanas.js` pide este fichero la primera vez que se abre.
 *
 * LOS TEXTOS VIENEN DE `perfil-<lengua>.json`, la familia que los recogio tal
 * cual de las ocho `profile.html`: los 55 del bloque `#i18n` y los que
 * estaban escritos en el marcado (la guia, los seis titulos, el pie). Se
 * dejan en `window.PerfilUI`, y de ahi los leen `profile.js`,
 * `perfil-rack.js` y `profile-obra.js` --que antes buscaban el `#i18n` de su
 * pagina y aqui encontrarian el de Comunidad, con otras claves--.
 *
 * LOS CUATRO GUIONES DEL PERFIL SE CARGAN EN ORDEN (`async = false`), como en
 * la pagina de la que vienen: `bronce.js` antes que `profile-obra.js`, que le
 * pregunta por el nivel. Si alguno ya esta en la pagina, no se pide dos veces.
 */
(function () {
  'use strict';
  var hoja = document.querySelector('[data-hoja="perfil"]');
  if (!hoja || hoja.dataset.montada) return;
  hoja.dataset.montada = '1';
  var lang = (document.documentElement.lang || 'es').slice(0, 2);

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = String(x);
    return n;
  }
  function seccion(u, h, id, relleno) {
    var s = el('section', 'panel');
    s.setAttribute('aria-labelledby', 'h-' + h);
    var t = el('h2', null, u['pfH_' + h] || '');
    t.id = 'h-' + h;
    s.appendChild(t);
    var z = el('div'); z.id = id;
    if (relleno) z.appendChild(relleno);
    s.appendChild(z);
    return s;
  }
  function conFuerte(u, f, r) {
    var p = el('li');
    p.appendChild(el('strong', null, u[f] || ''));
    p.appendChild(document.createTextNode(' ' + (u[r] || '')));
    return p;
  }

  function monta(u) {
    window.PerfilUI = u;
    hoja.innerHTML = '';
    var g = el('p', 'guia');
    g.appendChild(el('strong', null, u.pfGuiaFuerte || ''));
    g.appendChild(document.createTextNode(' ' + (u.pfGuiaResto || '')));
    hoja.appendChild(g);
    hoja.appendChild(seccion(u, 'yo', 'perfil-identidad'));
    // El enlace va escrito, como en la pagina original: funciona sin el guion.
    var f = el('div', 'fila');
    var a = el('a', 'boton', u.pfInstalarEnlace || '');
    a.href = './instalar.html';
    f.appendChild(a);
    hoja.appendChild(seccion(u, 'app', 'perfil-instalacion', f));
    hoja.appendChild(seccion(u, 'niv', 'perfil-niveles'));
    hoja.appendChild(seccion(u, 'rack', 'perfil-rack'));
    hoja.appendChild(seccion(u, 'ver', 'perfil-version'));
    hoja.appendChild(seccion(u, 'cla', 'perfil-clave'));
    var pie = el('details', 'pliego');
    pie.appendChild(el('summary', null, u.pfPieTitulo || ''));
    var ul = el('ul');
    [1, 2, 3].forEach(function (i) { ul.appendChild(conFuerte(u, 'pfPie' + i + 'f', 'pfPie' + i + 'r')); });
    pie.appendChild(ul);
    hoja.appendChild(pie);

    ['/assets/bronce.js', '/assets/profile.js', '/assets/perfil-rack.js',
     '/assets/profile-obra.js'].forEach(function (src) {
      if (src === '/assets/bronce.js' && document.querySelector('script[src="' + src + '"]')) return;
      var s = document.createElement('script');
      s.src = src; s.async = false;
      document.head.appendChild(s);
    });
  }

  var pide = function (l) {
    return fetch('/perfil-' + l + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  };
  pide(lang).then(function (d) { return d || pide('es'); }).then(function (d) {
    if (!d || !d.ui) {
      hoja.appendChild(el('p', 'no-data', 'NO_DATA · /perfil-' + lang + '.json'));
      return;
    }
    monta(d.ui);
  });
})();
