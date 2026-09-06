/* preceptoros.org · el taller: la vitrina de las lineas de investigacion.

   DOS FICHEROS, Y LA FRONTERA ES LA DE SIEMPRE. `loratelier.json` trae los
   HECHOS --estado, base, tamaño, firma, recuentos-- y no lleva una palabra de
   prosa. `taller-<idioma>.json` trae el texto, uno por lengua. Se separan por
   el mismo motivo por el que el Hub saco los suyos: juntar las ocho lenguas en
   un fichero lo deja lleno el primer dia, y en griego y ruso cada caracter
   cuesta el doble.

   TRES NIVELES. El primero es la frase humana y no nombra ningun modelo: quien
   llega sin saber nada tiene que entender el problema antes que la herramienta.
   El segundo dice que hace hoy, que falta y que se puede aportar. El tercero es
   la ficha, y ahi si van familia, base, tamaño y firma.

   LO QUE ESTE FICHERO NO PINTA NUNCA es un boton de descarga sin `artefacto` y
   sin `hash` en el registro. Hoy no hay ninguno publicado, asi que la vitrina
   nace sin descargas -- y es justo eso lo que hara creible el primer boton. */
(function () {
  var caja = document.getElementById('taller');
  if (!caja) return;

  var L = {}, UI = {};

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  /* Un par etiqueta/valor. Se usa igual en el nivel dos y en la ficha: la
     diferencia es la clase, no la estructura. */
  function par(padre, etiqueta, valor, clase) {
    if (valor == null || valor === '') return;
    var dt = el('dt', null, etiqueta), dd = el('dd', clase || null, String(valor));
    padre.appendChild(dt); padre.appendChild(dd);
  }

  function sello(estado) {
    var mapa = { en_estudio: 'estudio', en_entrenamiento: 'entrenando',
                 disponible: 'disponible', vision: 'vision' };
    var clave = mapa[estado] || 'estudio';
    return el('span', 'sello sello-' + clave, UI[clave] || estado);
  }

  /* El recuento SIEMPRE enseña su n. Con cero no se pinta un cero -- un cero
     junto a una media se lee como una media baja, y no hay media: no hay nadie
     todavia. Se pinta el hueco con su invitacion. */
  function recuento(bloque) {
    var p = el('p', 'recuento');
    var partes = [['medidas', bloque.medidas], ['tests', bloque.tests],
                  ['valoraciones', bloque.valoraciones]];
    var vivo = false;
    partes.forEach(function (x) {
      var n = x[1] && typeof x[1].n === 'number' ? x[1].n : 0;
      if (n > 0) {
        vivo = true;
        var s = el('span', null, x[0] + ' ');
        var b = el('b', null, String(n)); s.appendChild(b);
        p.appendChild(s);
      }
    });
    if (!vivo) p.textContent = UI.sinMedia || '';
    return p;
  }

  function ficha(bloque) {
    var dl = el('dl', 'ficha'), f = bloque.ficha || {};
    par(dl, 'familia', f.familia);
    par(dl, 'licencia', f.licencia);
    par(dl, 'origen', f.origen);
    par(dl, 'base', f.base_entrenamiento, 'taller-cifra');
    if (f.base_tamano_q4_gb != null) par(dl, 'Q4', f.base_tamano_q4_gb + ' GB', 'taller-cifra');
    par(dl, 'servido', f.servido_en_el_rack, 'taller-cifra');
    if (f.servido_tamano_q4_gb != null) par(dl, 'Q4', f.servido_tamano_q4_gb + ' GB', 'taller-cifra');
    par(dl, 'razonamiento', f.razonamiento);
    par(dl, 'modelo', bloque.modelo_base, 'taller-cifra');
    par(dl, 'hardware', bloque.requisitos_hw);
    // La firma NO se rellena con un guion cuando falta: se omite. Un guion en el
    // sitio de una firma se parece demasiado a una firma vacia.
    if (bloque.artefacto) {
      par(dl, 'version', bloque.artefacto.version, 'taller-cifra');
      par(dl, 'firma', bloque.artefacto.sha256_hash, 'taller-cifra');
    }
    return dl;
  }

  function nivelDos(bloque, texto) {
    var caja2 = el('div', 'linea-mas');
    caja2.hidden = true;
    [['hoy', texto.hoy], ['falta', texto.falta], ['aportas', texto.aportas]]
      .forEach(function (x) {
        if (!x[1]) return;
        var dl = el('dl', 'campo');
        par(dl, UI[x[0]] || x[0], x[1]);
        caja2.appendChild(dl);
      });
    caja2.appendChild(ficha(bloque));
    caja2.appendChild(recuento(bloque));
    if (!bloque.artefacto || !bloque.artefacto.sha256_hash) {
      caja2.appendChild(el('p', 'sin-descarga', UI.sinDescarga || ''));
    }
    return caja2;
  }

  function linea(bloque) {
    var texto = (L.bloques || {})[bloque.id];
    if (!texto) return null;                 // sin texto en esta lengua, no se pinta
    var art = el('article', 'panel linea');

    var cab = el('div', 'linea-cab');
    cab.appendChild(el('h3', null, texto.nombre || bloque.id));
    cab.appendChild(sello(bloque.estado));
    art.appendChild(cab);
    art.appendChild(el('p', 'linea-util', texto.util || ''));

    var mas = nivelDos(bloque, texto);
    var boton = el('button', 'taller-abrir', UI.abrir || '');
    boton.type = 'button';
    boton.setAttribute('aria-expanded', 'false');
    boton.addEventListener('click', function () {
      var abierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      // `hidden` y no `display` a mano: la hoja base ya lo hace cumplir, y asi
      // el estado vive en el atributo que los lectores de pantalla leen.
      mas.hidden = abierto;
      boton.textContent = abierto ? (UI.abrir || '') : (UI.cerrar || '');
    });
    art.appendChild(boton);
    art.appendChild(mas);
    return art;
  }

  function pintar(registro) {
    var rejilla = el('div', 'taller-rejilla');
    (registro.bloques || [])
      .slice()
      .sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); })
      .forEach(function (b) {
        var n = linea(b);
        if (n) rejilla.appendChild(n);
      });
    caja.innerHTML = '';
    caja.appendChild(el('h2', null, UI.titulo || ''));
    caja.appendChild(rejilla);
  }

  function traer(ruta) {
    return fetch(ruta, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  // El respaldo es al castellano y por FICHERO, no por clave suelta: media
  // lengua traducida y media caida es peor que una lengua entera prestada,
  // porque nadie sabe cual de las dos frases es la buena.
  traer('/taller-' + lang + '.json')
    .catch(function () { return traer('/taller-es.json'); })
    .then(function (t) { L = t; UI = t.ui || {}; return traer('/loratelier.json'); })
    .then(pintar)
    .catch(function (e) {
      // NO_DATA con causa a la vista, que es lo que esta casa hace cuando algo
      // no llega: un hueco callado se confunde con una seccion que no existe.
      caja.innerHTML = '';
      var p = el('p', 'nodata', 'NO_DATA · ' + e.message);
      caja.appendChild(p);
    });
})();
