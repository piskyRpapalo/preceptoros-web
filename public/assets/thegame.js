/* preceptoros.org · theGame · la capa del juego y su cargador.

   EL JUEGO SOLO VIVE AQUI (Soberano, 2026-09-26): salio de la Torre y se
   entra por la puerta theGame del cabezal, desde cualquier pagina. No hay
   pagina nueva ni URL propia: una capa a pantalla completa sobre la pagina
   donde estes, que se cierra con su boton o con Escape y devuelve el foco a la
   puerta.

   A DEMANDA. Este fichero lo inyecta `cabezal-rotulos.js` al pulsar la puerta.
   Aqui se piden la hoja y los cinco guiones del juego, en orden
   (`async = false`); nada de esto esta en ninguna pagina ni en el precache.

   CERRAR NO BORRA LA PARTIDA. La capa se oculta y el reloj del juego se para;
   al volver a abrir sigue donde estaba. Cerrar la PESTANA si la borra: v1 no
   guarda nada, y el sello del juego lo dice. */
(function () {
  'use strict';
  if (window.TheGame) { return; }

  var GUIONES = [['atlas-arte.js'], ['atlas-mapa.js'],
    ['atlas-dialogo.js', '/assets/'], ['atlas-motor.js'], ['atlas-piso.js', '/']];
  var capa = null, origen = null, cargado = null;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }

  function carga() {
    if (cargado) { return cargado; }
    cargado = new Promise(function (listo, falla) {
      var hoja = document.createElement('link');
      hoja.rel = 'stylesheet'; hoja.href = '/assets/atlas.css';
      document.head.appendChild(hoja);
      GUIONES.forEach(function (g, i) {
        var s = document.createElement('script');
        s.src = '/assets/' + g[0];
        s.async = false;
        if (g[1]) { s.dataset.base = g[1]; }
        if (i === GUIONES.length - 1) {
          s.onload = function () { listo(); };
          s.onerror = function () { falla(new Error(g[0])); };
        }
        document.head.appendChild(s);
      });
    });
    return cargado;
  }

  function construye() {
    capa = el('div', 'thegame-capa'); capa.id = 'thegame';
    capa.setAttribute('role', 'dialog'); capa.setAttribute('aria-modal', 'true');
    capa.setAttribute('aria-labelledby', 'thegame-t'); capa.tabIndex = -1;
    var barra = el('div', 'thegame-barra');
    barra.appendChild(el('h2', 'thegame-t', 'theGame')).id = 'thegame-t';
    var x = el('button', 'thegame-cerrar', '×'); x.type = 'button';
    x.setAttribute('aria-label', 'theGame ×');
    x.addEventListener('click', cierra);
    barra.appendChild(x);
    capa.appendChild(barra);
    var juego = el('div', 'thegame-juego'); juego.id = 'atlas-juego';
    capa.appendChild(juego);
    document.body.appendChild(capa);
  }

  function teclas(e) {
    /* Escape cierra la capa, salvo si hay un dialogo del juego abierto encima:
       ese se cierra primero, con su propio Escape. */
    if (e.key === 'Escape' && capa && !capa.hidden &&
        !document.querySelector('.atlas-dlg-capa')) { cierra(); }
  }

  function abre(desde) {
    origen = desde || document.querySelector('#cab-nav a.thegame');
    carga().then(function () {
      if (!capa) {
        construye();
        window.AtlasJuego.monta(document.getElementById('atlas-juego'), capa);
      }
      capa.hidden = false;
      document.body.classList.add('en-thegame');
      document.addEventListener('keydown', teclas);
      window.AtlasJuego.sigue();
      capa.focus();
    }).catch(function (err) {
      /* Sin juego no hay capa a medias: se dice en la consola y la pagina
         sigue tal cual. */
      console.warn('NO_DATA · theGame no cargo: ' + (err && err.message));
      cargado = null;
    });
  }

  function cierra() {
    if (!capa || capa.hidden) { return; }
    if (window.AtlasJuego) { window.AtlasJuego.pausa(); }
    capa.hidden = true;
    document.body.classList.remove('en-thegame');
    document.removeEventListener('keydown', teclas);
    if (location.hash === '#thegame' && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (origen && origen.focus) { origen.focus(); }
  }

  window.TheGame = { abre: abre, cierra: cierra };
})();
