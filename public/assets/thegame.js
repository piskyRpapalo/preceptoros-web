/* preceptoros.org · theGame · la capa del juego y su cargador.

   EL JUEGO SOLO VIVE AQUI (Soberano, 2026-09-26): salio de la Torre y se
   entra por la puerta theGame del cabezal, desde cualquier pagina. No hay
   pagina nueva ni URL propia: una capa a pantalla completa sobre la pagina
   donde estes, que se cierra con su boton o con Escape y devuelve el foco a la
   puerta.

   A DEMANDA. Este fichero lo inyecta `cabezal-rotulos.js` al pulsar la puerta.
   Aqui se piden la hoja y los guiones del juego (cinco del piso y tres del piloto), en orden
   (`async = false`); nada de esto esta en ninguna pagina ni en el precache.

   CERRAR NO BORRA LA PARTIDA. La capa se oculta y el reloj del juego se para;
   al volver a abrir sigue donde estaba. Cerrar la PESTANA si la borra: v1 no
   guarda nada, y el sello del juego lo dice. */
(function () {
  'use strict';
  if (window.TheGame) { return; }

  /* El piloto va detras del piso: la partida envuelve al motor ya cargado y
     la capa del piloto necesita los textos que pide el piso. Los de `/game/`
     son theGame v1.5: gacha, army, sintesis e incubadora. */
  var GUIONES = [['atlas-arte.js'], ['atlas-coord.js'], ['atlas-carta.js'], ['atlas-ondas.js'], ['atlas-obra.js'], ['atlas-gesto.js'], ['atlas-mapa.js'],
    ['atlas-dialogo.js', '/assets/'], ['atlas-motor.js'], ['atlas-piso.js', '/'],
    ['atlas-piloto.js'], ['atlas-partida.js'], ['atlas-piloto-capa.js'],
    ['/game/valores.js'], ['/game/gacha.js'], ['/game/db.js'], ['/game/core.js'], ['/game/ui.js'], ['/game/juez.js'], ['atlas-guardado.js']];
  /* LAS LENGUAS DEL JUEGO (2026-09-28, el Soberano: «hoy, solo inglés; un mismo enlace»). La
     UNICA lista de lenguas en las que el juego esta COMPLETO. Cualquier portada abre el juego en
     una de ellas: la de la pagina si esta aqui; si no, la primera. Anadir una lengua es traducir
     su `atlas-<l>.json` hasta que el gate la de completa y escribirla aqui: nada mas cambia. Las
     demas son borradores (el gate vigila que no tengan claves huerfanas y mide su cobertura). */
  var LENGUAS = ['en'], RTL = ['ar'];
  var pagina = (document.documentElement.lang || 'en').slice(0, 2);
  var lengua = LENGUAS.indexOf(pagina) >= 0 ? pagina : LENGUAS[0];
  window.AtlasLengua = { lenguas: LENGUAS, actual: lengua, pagina: pagina };
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
      var hm = document.createElement('link');
      hm.rel = 'stylesheet'; hm.href = '/assets/atlas-mapa.css';
      document.head.appendChild(hm);
      GUIONES.forEach(function (g, i) {
        var s = document.createElement('script');
        s.src = g[0].charAt(0) === '/' ? g[0] : '/assets/' + g[0];
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
    /* La capa habla la lengua del juego, no la de la portada: sin esto, una pagina arabe
       voltearia un juego escrito en ingles. */
    capa.lang = lengua; capa.dir = RTL.indexOf(lengua) >= 0 ? 'rtl' : 'ltr';
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
        window.AtlasJuego.monta(document.getElementById('atlas-juego'), capa).then(function () {
          if (window.AtlasPilotoCapa) { window.AtlasPilotoCapa.monta(capa); }
          if (window.AtlasIncubadora) { window.AtlasIncubadora.monta(capa); }
          if (window.AtlasGuardado) { window.AtlasGuardado.monta(capa); }
          /* El contador de farmeo se carga AL ABRIRLO: su peso no va en la puerta del juego, que es
             una ley del mundo (gzip_juego_b). Plegado es solo su rotulo; abierto, `atlas-hud.js`. */
          var sm = capa.querySelector('#atlas-piso .atlas-mapa'), th = window.AtlasJuego.texto('hud_t');
          if (sm && th) {
            var d = el('details', 'atlas-hud-farmeo'); d.appendChild(el('summary', null, th)); sm.appendChild(d);
            d.addEventListener('toggle', function () {
              if (!d.open || window.AtlasHud) { return; }
              var s = document.createElement('script'); s.src = '/assets/atlas-hud.js';
              s.onload = function () { window.AtlasHud.monta(capa, d); };
              document.head.appendChild(s);
            });
            /* Opinar FIRMADO (sugerencia, veredicto, grieta): `atlas-opina.js`, al pulsar. */
            var bo = el('button', 'boton-sec', window.AtlasJuego.texto('opina'));
            bo.addEventListener('click', function () {
              var s = document.createElement('script'); s.src = '/assets/atlas-opina.js';
              s.onload = function () { window.AtlasOpina.abre(capa); };
              if (window.AtlasOpina) { window.AtlasOpina.abre(capa); } else { document.head.appendChild(s); }
            });
            sm.appendChild(bo);
          }
        });
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
