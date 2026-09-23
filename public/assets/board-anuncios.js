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

  /* LO ABIERTO DELANTE, LO CERRADO PLEGADO. Orden del Soberano, 2026-09-14.

     Un anuncio cerrado no se borra --sigue diciendo que se pidio y que paso--
     pero puesto al lado de uno abierto compite con el por la misma atencion, y
     el que no se puede atender gana por ser mas largo. Se pliega: sigue ahi
     para quien lo busque, deja de estar delante de quien viene a actuar.

     Sin `estado`, ABIERTO. Un anuncio que nadie declaro no se esconde: fallar
     hacia lo visible es lo correcto cuando lo que se oculta es una peticion. */
  var RAIZ0 = raiz;
  function pinta(d) {
    raiz = RAIZ0;
    raiz.innerHTML = '';
    /* PLEGADO ENTERO · 2026-09-15. El titulo era una cabecera y debajo venian
       las peticiones abiertas, delante de las lineas de investigacion. Es
       informacion real y va a seguir estando, pero lo que abre una pagina dice
       lo que la pagina ES: Comunidad es donde se actua, no donde se leen
       encargos. Se pliega, con su titulo a la vista y su cuenta al lado, para
       que quien venga a buscarlo lo encuentre a la primera.
       El pliegue de CERRADOS que ya habia sigue dentro: pliegue dentro de
       pliegue, que es lo correcto -- lo cerrado esta dos gestos mas lejos que
       lo abierto, y eso es exactamente su distancia. */
    var lista = d.anuncios || [];
    var raizVieja = raiz;
    var fuera = document.createElement('details');
    fuera.className = 'pliego';
    var tit = document.createElement('summary');
    tit.textContent = T.anTitulo +
      (lista.length ? ' (' + lista.filter(function (a) {
        return a.estado !== 'CERRADO'; }).length + ')' : '');
    fuera.appendChild(tit);
    raizVieja.appendChild(fuera);
    raiz = fuera;
    var abiertos = lista.filter(function (a) { return a.estado !== 'CERRADO'; });
    var cerrados = lista.filter(function (a) { return a.estado === 'CERRADO'; });
    var destino = raiz;
    if (cerrados.length) {
      var pl = document.createElement('details');
      pl.className = 'pliego';
      var res = document.createElement('summary');
      res.textContent = (T.anCerrados || '').replace('{n}', cerrados.length);
      pl.appendChild(res);
      raiz.appendChild(pl);
    }
    abiertos.concat(cerrados).forEach(function (a) {
      destino = (a.estado === 'CERRADO' && raiz.querySelector('.pliego')) || raiz;
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
      destino.appendChild(art);
    });
  }

  /* LOS TEXTOS VIVEN APARTE DESDE EL 2026-09-23: `anuncios.json` trae los
     hechos y `anuncios-<lengua>.json` lo que se lee, por id. Se juntan aqui y
     `pinta()` no cambia. Si la familia no llega, cada anuncio sale con su
     NO_DATA de lengua, que es lo mismo que pasaba con un anuncio sin traducir. */
  function pide(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }
  Promise.all([pide('/anuncios.json'),
               pide('/anuncios-' + idioma + '.json').catch(function () { return null; })])
    .then(function (r) {
      var d = r[0], fam = (r[1] && r[1].textos) || {};
      if (!d || !Array.isArray(d.anuncios)) throw new Error('sin anuncios');
      d.anuncios.forEach(function (a) {
        a.textos = {};
        if (fam[a.id]) a.textos[idioma] = fam[a.id];
      });
      pinta(d);   // primer pintado: no hay nada que transicionar
    })
    .catch(function (e) {
      raiz.appendChild(p(T.anSinDatos + ' ' + (e && e.message ? e.message : e),
                         'nodata'));
    });
})();
