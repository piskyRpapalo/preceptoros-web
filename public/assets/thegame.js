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

  /* UN <dialog> NATIVO, abierto con showModal(). La trampa de foco no la
     escribe este fichero: la pone el navegador, que deja la pagina de debajo
     inerte, y es la que respetan los lectores de pantalla moviles. Un trap en
     JS se comporta distinto bajo TalkBack y VoiceOver; este no. */
  function construye() {
    capa = el('dialog', 'thegame-capa'); capa.id = 'thegame';
    capa.setAttribute('aria-labelledby', 'thegame-t');
    var barra = el('div', 'thegame-barra');
    barra.appendChild(el('h2', 'thegame-t', 'theGame')).id = 'thegame-t';
    var x = el('button', 'thegame-cerrar', '×'); x.type = 'button';
    x.setAttribute('aria-label', 'theGame ×');
    x.addEventListener('click', cierra);
    barra.appendChild(x);
    capa.appendChild(barra);
    var juego = el('div', 'thegame-juego'); juego.id = 'atlas-juego';
    capa.appendChild(juego);
    capa.addEventListener('cancel', cancela);
    document.body.appendChild(capa);
  }

  /* Escape llega como `cancel` del <dialog>. Si hay un dialogo del juego
     abierto encima, se cierra ese (con su propio Escape) y la capa se queda. */
  function cancela(e) {
    e.preventDefault();
    if (!document.querySelector('.atlas-dlg-capa')) { cierra(); }
  }

  /* SIN GUARDAR TAMBIEN AL CERRAR: cerrar la capa, por boton o por Escape, no
     borra la partida, pero cerrar la pestana si. Se dice un momento junto a la
     puerta, sin tapar nada. */
  function avisa() {
    var t = window.AtlasJuego && window.AtlasJuego.texto('cierre_aviso');
    if (!t || !origen || !origen.parentNode) { return; }
    var viejo = document.getElementById('thegame-aviso');
    if (viejo) { viejo.remove(); }
    var n = el('p', 'thegame-aviso', t); n.id = 'thegame-aviso';
    n.setAttribute('role', 'status');
    origen.parentNode.appendChild(n);
    setTimeout(function () { n.remove(); }, 6000);
  }

  function abre(desde) {
    origen = desde || document.querySelector('#cab-nav a.thegame');
    carga().then(function () {
      if (!capa) {
        construye();
        window.AtlasJuego.monta(document.getElementById('atlas-juego'), capa);
      }
      if (!capa.open) { capa.showModal(); }
      document.body.classList.add('en-thegame');
      window.AtlasJuego.sigue();
    }).catch(function (err) {
      /* Sin juego no hay capa a medias: se dice en la consola y la pagina
         sigue tal cual. */
      console.warn('NO_DATA · theGame no cargo: ' + (err && err.message));
      cargado = null;
    });
  }

  function cierra() {
    if (!capa || !capa.open) { return; }
    if (window.AtlasJuego) { window.AtlasJuego.pausa(); }
    capa.close();
    document.body.classList.remove('en-thegame');
    if (location.hash === '#thegame' && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (origen && origen.focus) { origen.focus(); }
    avisa();
  }

  window.TheGame = { abre: abre, cierra: cierra };
})();
