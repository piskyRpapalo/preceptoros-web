/* preceptoros.org · los anuncios OFICIALES del Ágora. Solo pintura.
 *
 * POR QUE VAN APARTE DE LOS HILOS. `threads.json` es EJEMPLO declarado y
 * `anuncios.json` es REAL. En una sola lista los dos se ven identicos --el
 * mismo problema que board.js ya resuelve con el rotulo de procedencia-- y
 * ahi el precio seria mas alto: el visitante no podria distinguir lo que el
 * Soberano pide de verdad de lo que esta puesto para probar la densidad.
 *
 * DE DONDE SALE EL IDIOMA. De `<html lang>`, no del bloque i18n de la pagina.
 * El texto de un anuncio es CONTENIDO, no interfaz: meterlo en el i18n de las
 * tres board.html obligaria a escribir el mismo parrafo tres veces en tres
 * ficheros y a que las tres se acordaran de cambiarlo a la vez. Es el mismo
 * trato que ya tiene `hub.json` con su bloque `textos`.
 *
 * CADA ANUNCIO LLEVA SU `pero`. Un anuncio que pide algo por un canal que
 * responde 404 es publicidad. El `pero` se pinta con la marca de NO_DATA, con
 * la misma prominencia que la peticion -- no en letra pequena al final.
 */
(function () {
  var raiz = document.getElementById('anuncios');
  var block = document.getElementById('i18n');
  if (!raiz || !block) return;
  var T = JSON.parse(block.textContent);
  var idioma = (document.documentElement.lang || 'es').slice(0, 2);

  function p(texto, clase) {
    var n = document.createElement('p');
    if (clase) n.className = clase;
    n.textContent = texto;
    return n;
  }

  function pinta(d) {
    raiz.innerHTML = '';
    raiz.appendChild(p(T.anTitulo, 'anuncios-cabeza'));
    (d.anuncios || []).forEach(function (a) {
      var t = (a.textos || {})[idioma];
      // Un idioma sin traducir no se rellena con el de al lado: se dice. Caer
      // al espanol en silencio es como llego el pie honesto en un solo idioma.
      if (!t) {
        raiz.appendChild(p(T.anSinIdioma + ' ' + a.id + ' · ' + idioma, 'nodata'));
        return;
      }
      var art = document.createElement('article');
      art.className = 'anuncio';
      var h = document.createElement('h3');
      var m = document.createElement('span');
      m.className = 'marca-hilo ' + (a.tipo || '').toLowerCase();
      m.textContent = '[' + ((T.tbTipos || {})[a.tipo] || a.tipo) + ']';
      h.appendChild(m);
      h.appendChild(document.createTextNode(' ' + t.titulo));
      art.appendChild(h);
      art.appendChild(p(t.cuerpo));
      var ul = document.createElement('ul');
      ['publico', 'privado'].forEach(function (k) {
        if (!t[k]) return;
        var li = document.createElement('li');
        li.textContent = t[k];
        ul.appendChild(li);
      });
      art.appendChild(ul);
      if (t.pero) art.appendChild(p(t.pero, 'nodata'));
      // El enlace solo se pinta si el anuncio TRAE uno. Un boton que no lleva
      // a ningun sitio es peor que no tener boton: se pulsa igual.
      if (a.enlace && t.enlaceTexto) {
        var f = document.createElement('p');
        var en = document.createElement('a');
        en.href = a.enlace; en.className = 'boton';
        en.rel = 'noopener'; en.textContent = t.enlaceTexto;
        f.appendChild(en); art.appendChild(f);
      }
      art.appendChild(p(a.autor + ' · ' + (a.cuando || '').slice(0, 10), 'tenue'));
      raiz.appendChild(art);
    });
  }

  fetch('/anuncios.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (d) {
      if (!d || !Array.isArray(d.anuncios)) throw new Error('sin anuncios');
      pinta(d);   // primer pintado: no hay nada que transicionar
    })
    .catch(function (e) {
      raiz.appendChild(p(T.anSinDatos + ' ' + (e && e.message ? e.message : e),
                         'nodata'));
    });
})();
