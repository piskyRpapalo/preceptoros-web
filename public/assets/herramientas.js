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
    // Las mismas reglas para el indice y para el bloque de modelos.
    var H = ':is(#herramientas,#herr-modelos)';
    s.textContent =
      H + '{margin:2rem 0}' +
      H + ' .herr-lema{opacity:.8;margin:.2rem 0 1rem}' +
      H + ' .herr-lista{display:grid;gap:.6rem;grid-template-columns:1fr}' +
      '@media(min-width:44rem){' + H + ' .herr-lista{grid-template-columns:1fr 1fr}}' +
      H + ' .herr-caja{border:1px solid currentColor;' +
        'border-radius:.4rem;padding:.6rem .75rem}' +
      H + ' .herr-nombre{font-weight:600;display:block;margin-bottom:.25rem}' +
      '#herr-modelos .herr-cmd{display:block;margin-top:.3rem;font-size:.82rem;' +
        'overflow-wrap:anywhere;user-select:all}';
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
    /* LA CAUSA DEL AUDIO ERA FALSA, y se corrige (2026-09-23). Decia «cero
       referencias en el rack»: existe `preceptor-lora/TALLER_DE_MUSICA.md`
       desde el 2026-09-14, con dos proyectos y sus tuberias escritas que paran
       con NO_DATA. La causa vive ahora en la familia (`herr_audio_causa`) y en
       las ocho lenguas, no en castellano dentro del guion. */
    { clave: 'herr_audio', ancla: null, causaClave: 'herr_audio_causa' },
    { clave: 'herr_agora', ancla: '#agora-portada' },
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
          (ui[h.causaClave] || h.causa || 'el bloque al que apunta no esta en esta pagina')));
      }
      lista.appendChild(caja);
    });
    sec.appendChild(lista);
    host.parentNode.insertBefore(sec, host);
    modelos(ui, sec);
  }

  /* --- LOS MODELOS QUE HABLAN EN LA WEB (2026-09-23) ------------------------
     El Soberano: «mover la lista de modelos desde Community a Herramientas,
     con sus tamaños y comandos de `ollama pull`». Salen de `cerebros.json`
     --el mismo catalogo que decide quien habla en cada piso--, con el tamaño
     MEDIDO en la Ollama del nodo (`bytes`).

     EL COMANDO SOLO DONDE FUNCIONA. Los `preceptor-*` son construcciones de la
     casa sobre un modelo base y NO existen en el registro de Ollama: escribir
     «ollama pull preceptor-charla-web:v1» seria mandar a alguien a un error.
     Para esos se dice que todavia no se instalan asi, y donde estan sus
     adaptadores publicados. */
  function tam(b) {
    if (!b) return 'NO_DATA';
    return b >= 1e9 ? (b / 1e9).toFixed(1).replace('.', ',') + ' GB'
                    : Math.round(b / 1e6) + ' MB';
  }
  function modelos(ui, antes) {
    if (!ui.herr_modelos || document.getElementById('herr-modelos')) { return; }
    Promise.all([
      fetch('/cerebros.json').then(function (r) { return r.json(); }),
      fetch('/cerebros-' + (lang === 'es' ? 'es' : 'en') + '.json')
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (par) {
      var reg = par[0], prosa = (par[1] && par[1].cerebros) || {};
      var sec = el('section', 'panel');
      sec.id = 'herr-modelos';
      sec.appendChild(el('h2', null, ui.herr_modelos));
      if (ui.herr_modelos_nota) { sec.appendChild(el('p', 'herr-lema', ui.herr_modelos_nota)); }
      var lista = el('div', 'herr-lista');
      (reg.cerebros || []).forEach(function (c) {
        var caja = el('div', 'herr-caja');
        caja.appendChild(el('span', 'herr-nombre', (prosa[c.id] || {}).nombre || c.id));
        caja.appendChild(el('p', 'tenue', c.modelo + ' · ' + tam(c.bytes)));
        if (/^preceptor-/.test(c.modelo)) {
          caja.appendChild(el('p', 'no-data', ui.herr_modelo_casa || 'NO_DATA'));
        } else {
          caja.appendChild(el('code', 'herr-cmd', 'ollama pull ' + c.modelo));
        }
        lista.appendChild(caja);
      });
      sec.appendChild(lista);
      antes.parentNode.insertBefore(sec, antes.nextSibling);
    }).catch(function () { /* sin catalogo no hay lista: el indice sigue en pie */ });
  }

  /* --- EL ESTADO DEL AGORA, MUDADO DESDE COMUNIDAD (2026-09-23) --------------
     Descargas con su sha256, actividad medida, lo cerrado con su causa y como
     se modera: es «lo que te puedes llevar», asi que vive en Herramientas. Se
     monta el pliego y se piden su hoja y su guion al vuelo, en vez de añadir
     dos etiquetas a las ocho paginas. El titulo del pliego viene de
     `agora-<lengua>.json`. */
  function agora(host) {
    if (document.getElementById('agora-portada')) { return; }
    var pl = el('details', 'pliego');
    var su = el('summary', null, '…');
    pl.appendChild(su);
    var raiz = el('section', 'panel');
    raiz.id = 'agora-portada';
    pl.appendChild(raiz);
    host.parentNode.appendChild(pl);
    fetch('/agora-' + lang + '.json').then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) { su.textContent = (d && d.ui && d.ui.agPliego) || 'Agora'; });
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = '/assets/agora.css';
    document.head.appendChild(css);
    var s = document.createElement('script');
    s.src = '/assets/agora-portada.js';
    document.head.appendChild(s);
  }

  function arranca() {
    /* SE MONTA DELANTE DE `#descargas`, no detras: un indice detras de lo que
       indexa es un resumen, y se lee cuando ya no hace falta. */
    var host = document.getElementById('descargas');
    if (!host) { return; }
    agora(host);
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
