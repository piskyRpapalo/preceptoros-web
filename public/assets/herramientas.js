/* preceptoros.org · Herramientas · el indice de lo que te puedes llevar.
 *
 * NO ES UNA PAGINA, Y ESO ES UNA DECISION CON CIFRA DETRAS
 * --------------------------------------------------------
 * `test_maximo_ocho_paginas` permite NUEVE y hay ocho, asi que cabria una. No
 * se gasta: la novena esta reservada por firma para `manifiesto.html`, y la
 * regla del gate es explicita --- «cada pagina nueva se paga con este numero,
 * y subirlo exige firma». Gastar la amnistia de otro en esto seria saltarse la
 * firma por la puerta de atras.
 *
 * Y ADEMAS NO HACE FALTA, que es el motivo bueno. Las herramientas ya estan en
 * `instalar.html`: la web instalable la pinta `instalar-descargas.js`, la app
 * tiene su boton de descarga, y el bloque `#atasco` ES el «Copiar para tu IA»
 * y los «Errores comunes» con otro nombre. Lo que faltaba no era el contenido:
 * era el INDICE que dice «esto es lo que te puedes llevar gratis, y aqui esta
 * cada cosa».
 *
 * `herr_lema` lo dice entero: «Cosas gratis que puedes llevarte. Nada se
 * instala solo: cada una te da su ruta real».
 *
 * LO QUE NO SE INVENTA
 * ---------------------
 * `herr_audio` --- «Audio y musica del rack» --- lleva traducido a ocho
 * lenguas desde la Fase 1 y NO EXISTE. Buscado el 2026-09-20 en el repo de la
 * web, en `mente/doctrina/`, en `OPERACIONES.md` y en el arbol de `p0x`: cero
 * referencias. Asi que se pinta con su NO_DATA y su causa, no se omite.
 * Omitirlo dejaria ocho traducciones huerfanas sin que nadie supiera por que,
 * que es como se pierde el trabajo hecho; y pintarlo con una ruta inventada
 * seria mentir en la pagina que promete «su ruta real».
 *
 * LAS RUTAS SON ANCLAS DE ESTA MISMA PAGINA, no destinos nuevos. Un indice que
 * lleva a sitios que ya estan debajo es un indice; uno que abre paginas nuevas
 * es otra capa de navegacion, y esta casa ya retiro una este mes por eso.
 */
(function () {
  var lang = (document.documentElement.lang || 'es').slice(0, 2);

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto) { n.textContent = texto; }
    return n;
  }

  function estilo() {
    if (document.getElementById('herr-estilo')) { return; }
    var s = el('style');
    s.id = 'herr-estilo';
    s.textContent =
      '#herramientas{margin:2rem 0}' +
      '#herramientas .herr-lema{opacity:.8;margin:.2rem 0 1rem}' +
      '#herramientas .herr-lista{display:grid;gap:.6rem;' +
        'grid-template-columns:1fr}' +
      '@media(min-width:44rem){#herramientas .herr-lista{' +
        'grid-template-columns:1fr 1fr}}' +
      '#herramientas .herr-caja{border:1px solid currentColor;' +
        'border-radius:.4rem;padding:.6rem .75rem}' +
      '#herramientas .herr-nombre{font-weight:600;display:block;' +
        'margin-bottom:.25rem}';
    document.head.appendChild(s);
  }

  /* LAS TRES, CON SU DESTINO REAL Y COMPROBADO EL 2026-09-20:
       web   · `#pwa-puerta`, el bloque que ya pinta `instalar-descargas.js`.
       app   · `#descargas`, donde esta el boton. Su `pausa_descarga` vencio el
               2026-09-13 y la release existe --- `releases/latest` redirige a
               `v1.3` ---, asi que el boton esta vivo y aqui se apunta a el en
               vez de duplicar la URL: una segunda copia de un enlace es una
               segunda cosa que envejece.
       audio · sin destino. Ver la cabecera. */
  var HERRAMIENTAS = [
    { clave: 'herr_web', ancla: '#pwa-puerta' },
    { clave: 'herr_app', ancla: '#descargas' },
    { clave: 'herr_audio', ancla: null,
      causa: 'no existe todavia en el rack: buscado en el repo de la web, en '
           + 'la doctrina y en el arbol del proyecto, cero referencias' },
    { clave: 'herr_copia_ai', ancla: '#atasco' },
    { clave: 'herr_errores', ancla: '#atasco' }
  ];

  function pinta(ui, host) {
    if (document.getElementById('herramientas')) { return; }
    estilo();
    var sec = el('section', 'panel');
    sec.id = 'herramientas';
    sec.appendChild(el('h2', null, ui.herr_titulo || 'Herramientas'));
    if (ui.herr_lema) { sec.appendChild(el('p', 'herr-lema', ui.herr_lema)); }

    var lista = el('div', 'herr-lista');
    HERRAMIENTAS.forEach(function (h) {
      var nombre = ui[h.clave];
      if (!nombre) { return; }
      var caja = el('div', 'herr-caja');
      if (h.ancla && document.querySelector(h.ancla)) {
        /* EL ENLACE SOLO SI EL DESTINO ESTA EN LA PAGINA. Un indice que lleva
           a un ancla que no existe deja al dedo dando en el vacio, y en un
           telefono eso no se distingue de una pagina rota. Si el bloque no
           esta --- porque otra lengua lo tenga distinto, o porque se retire
           manana --- se pinta el nombre sin enlace y no pasa nada. */
        var a = el('a', 'herr-nombre', nombre);
        a.href = h.ancla;
        caja.appendChild(a);
      } else {
        caja.appendChild(el('span', 'herr-nombre', nombre));
        caja.appendChild(el('p', 'no-data',
          (ui.herr_cerrada || 'NO_DATA') + ' · ' +
          (h.causa || 'el bloque al que apunta no esta en esta pagina')));
      }
      lista.appendChild(caja);
    });
    sec.appendChild(lista);
    host.parentNode.insertBefore(sec, host);
  }

  function arranca() {
    /* SE MONTA DELANTE DE `#descargas`, no detras: un indice detras de lo que
       indexa es un resumen, y se lee cuando ya no hace falta. */
    var host = document.getElementById('descargas');
    if (!host) { return; }
    fetch('/herramientas-' + lang + '.json')
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (d) { pinta(d.ui || {}, host); })
      .catch(function (e) {
        if (document.getElementById('herramientas')) { return; }
        var p = el('p', 'no-data',
          'NO_DATA · las herramientas no cargaron: ' + e.message);
        p.id = 'herramientas';
        host.parentNode.insertBefore(p, host);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arranca);
  } else { arranca(); }
})();
