/* preceptoros.org · theGame · la capa del juego y su cargador.

   EL JUEGO SOLO VIVE AQUI (Soberano, 2026-09-26): salio de la Torre y se
   entra por la puerta theGame del cabezal, desde cualquier pagina. No hay
   pagina nueva ni URL propia: una capa a pantalla completa sobre la pagina
   donde estes, que se cierra con su boton o con Escape y devuelve el foco a la
   puerta.

   A DEMANDA. Este fichero lo inyecta `cabezal-rotulos.js` al pulsar la puerta.
   Aqui se piden las hojas y los guiones del juego, en orden (`async = false`); nada de esto
   esta en ninguna pagina ni en el precache. La incubadora y su Army se piden al abrir SU
   pestana: su peso no va en la puerta, que es una ley del mundo (`gzip_juego_b`).

   CINCO PESTANAS (Soberano, 2026-09-28: «adaptado a telefono, con pestanas y cabecero bien
   estructurado»): Core, Map, Crafts, Army y Game. En el telefono van abajo, al alcance del
   pulgar; en escritorio, bajo el cabecero. Maqueta: `thegame.css`.

   CERRAR NO BORRA LA PARTIDA. La capa se oculta y el reloj del juego se para;
   al volver a abrir sigue donde estaba. Cerrar la PESTANA si la borra: v1 no
   guarda nada, y el sello del juego lo dice. */
(function () {
  'use strict';
  if (window.TheGame) { return; }

  /* El piloto va detras del piso: la partida envuelve al motor ya cargado y
     la capa del piloto necesita los textos que pide el piso. El juez (`/game/`, v1.5) va en la
     puerta: escucha cada jugada y da voz al Preceptor desde el primer ciclo. */
  var GUIONES = [['atlas-arte.js'], ['atlas-coord.js'], ['atlas-carta.js'], ['atlas-ondas.js'], ['atlas-obra.js'], ['atlas-gesto.js'], ['atlas-mapa.js'],
    ['atlas-dialogo.js', '/assets/'], ['atlas-motor.js'], ['atlas-piso.js', '/'],
    ['atlas-piloto.js'], ['atlas-partida.js'], ['atlas-piloto-capa.js'],
    ['/game/juez.js'], ['atlas-guardado.js']];
  /* EL ARMY, A DEMANDA (theGame v1.5: valores, gacha, army, sintesis e incubadora): al abrir su
     pestana, o al importar una partida firmada, cuya firma comprueba el verificador del Army. */
  var ARMY = [['/game/valores.js'], ['/game/gacha.js'], ['/game/db.js'], ['/game/core.js'], ['/game/ui.js']];
  /* LA ARENA, A DEMANDA (Soberano, 2026-09-28: «el mapa multi-jugador en una pestana… las formas
     invocadas luchando en live con los NPCs»): el mar, los lugares NPC, el combate en vivo y los duelos
     entre personas por paquetes firmados. Detras del Army, cuyas tropas y verificador usa. */
  var ARENA = [['/game/canon.js'], ['/game/sobres.js'], ['/game/rating.js'], ['/game/arena.js'], ['/game/duelo.js'],
    ['/game/escena.js'], ['/game/mar.js'], ['/game/nodos-pesos.js'], ['/game/nodos-cedulas.js'], ['/game/nodos.js'],
    ['/game/ui-nodos.js'], ['/game/ui-arena.js'], ['/game/ui-duelo.js']];
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

  /* Los guiones de una lista, en orden; la promesa se cumple con el ultimo. */
  function pide(lista) {
    return new Promise(function (listo, falla) {
      lista.forEach(function (g, i) {
        var s = document.createElement('script');
        s.src = g[0].charAt(0) === '/' ? g[0] : '/assets/' + g[0];
        s.async = false;
        if (g[1]) { s.dataset.base = g[1]; }
        if (i === lista.length - 1) { s.onload = function () { listo(); }; }
        s.onerror = function () { falla(new Error(g[0])); };
        document.head.appendChild(s);
      });
    });
  }

  function carga() {
    if (cargado) { return cargado; }
    ['atlas.css', 'atlas-mapa.css', 'thegame.css'].forEach(function (n) {
      var h = document.createElement('link');
      h.rel = 'stylesheet'; h.href = '/assets/' + n;
      document.head.appendChild(h);
    });
    cargado = pide(GUIONES);
    return cargado;
  }

  /* LAS PESTANAS. NO SE REHACE NADA: cada pieza que ya pintan el piso, el piloto y el guardado se
     MUEVE, con sus referencias vivas, a su panel DENTRO de `#atlas-piso` (los `#atlas-piso ...` de
     los demas guiones siguen valiendo). El orden de cada lista es el orden en pantalla. El piloto,
     su freno (Soltar), la sugerencia y el veredicto del juez se quedan en el cabecero: se ven desde
     cualquier pestana. */
  var PESTANAS = [
    ['nucleo', '\u25C9', '.atlas-alerta|.atlas-cab|.atlas-recursos|#atlas-piso > .atlas-vivo|.atlas-dormias|.atlas-nucleo'],
    ['mapa', '\u25C8', '.atlas-lema|.atlas-mapa|.atlas-izq'],
    ['oficios', '\u2692\uFE0E', '.atlas-hud > .panel:not(.atlas-dormias)'],
    ['army', '\u2726', ''],
    ['arena', '\u2694\uFE0E', ''],
    ['partida', '\u2261', '.atlas-guardado|.thegame-exporta|.thegame-opina|.atlas-hud-farmeo|#atlas-juego > .no-data|.atlas-pie']];
  /* LO TECNICO, SIEMPRE PLEGADO (Soberano: «son textos que asustan a usuarios no tecnicos»): el
     JSON de la carta, las leyes medidas, la semilla que no es VRF, los valores provisionales y el
     pie. No se borran, porque son la prueba: se ven al abrir «Technical details». */
  var TECNICO = '.atlas-carta-json, .atlas-nucleo > .atlas-nota, .atlas-nucleo > .atlas-medido, ' +
    '.atlas-incubadora > .atlas-medido, .atlas-incubadora > .atlas-casa, .atlas-pie';
  var PANEL = {}, BOTON = {}, actual = 'nucleo', army = null, arena = null;

  function T(k) { return (window.AtlasJuego && window.AtlasJuego.texto(k)) || k; }
  function cada(lista, f) { Array.prototype.forEach.call(lista, f); }

  function tecnico(p) {
    var ns = p.querySelectorAll(TECNICO);
    if (!ns.length) { return; }
    var d = p.querySelector('.thegame-tecnico');
    if (!d) { d = el('details', 'thegame-tecnico'); d.appendChild(el('summary', null, T('tecnico'))); }
    cada(ns, function (n) { d.appendChild(n); });
    p.appendChild(d);
  }

  /* Cambiar de pestana vuelve arriba; el foco solo se mueve con las flechas (con el dedo o el raton
     ya esta en el boton pulsado, y moverlo a mano pintaria el anillo del teclado). */
  function muestra(id, foco) {
    if (id !== actual) { capa.scrollTop = 0; }
    actual = id;
    Object.keys(PANEL).forEach(function (k) {
      PANEL[k].hidden = k !== id;
      BOTON[k].setAttribute('aria-selected', String(k === id));
      BOTON[k].tabIndex = k === id ? 0 : -1;
    });
    if (foco) { BOTON[id].focus(); }
    if (id === 'army') { cargaArmy(); }
    if (id === 'arena') { cargaArena(); }
  }

  function ordena() {
    var piso = capa.querySelector('#atlas-piso'), barra = capa.querySelector('.thegame-barra');
    if (!piso || !barra || barra.querySelector('.thegame-pestanas')) { return; }
    var nav = el('nav', 'thegame-pestanas'), fila = el('div'), ids = PESTANAS.map(function (p) { return p[0]; });
    nav.setAttribute('aria-label', T('pes_aria'));
    fila.setAttribute('role', 'tablist');
    PESTANAS.forEach(function (p) {
      var id = p[0], d = el('section', 'thegame-panel'), b = el('button'), ico = el('span', 'thegame-ico', p[1]);
      d.id = 'thegame-p-' + id; d.setAttribute('role', 'tabpanel'); d.setAttribute('aria-labelledby', 'thegame-b-' + id);
      b.type = 'button'; b.id = 'thegame-b-' + id; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', d.id);
      ico.setAttribute('aria-hidden', 'true');
      b.appendChild(ico); b.appendChild(el('span', null, T('pes_' + id)));
      b.addEventListener('click', function () { muestra(id); });
      p[2].split('|').forEach(function (s) { if (s) { cada(capa.querySelectorAll(s), function (n) { d.appendChild(n); }); } });
      tecnico(d);
      piso.appendChild(d); fila.appendChild(b);
      PANEL[id] = d; BOTON[id] = b;
    });
    /* Lo que queda vacio al repartir (la rejilla de la pagina larga) sobra. */
    cada(piso.querySelectorAll(':scope > .atlas-rejilla'), function (n) { n.remove(); });
    /* Flechas entre pestanas, como pide el patron de ARIA (al reves en una capa RTL). */
    fila.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) { return; }
      e.preventDefault();
      if (capa.dir === 'rtl') { d = -d; }
      muestra(ids[(ids.indexOf(actual) + d + ids.length) % ids.length], true);
    });
    nav.appendChild(fila); barra.appendChild(nav);
    /* Con la grieta abierta, la pestana Core lleva un punto: el aviso llega desde cualquier vista. */
    var a = piso.querySelector('.atlas-alerta');
    if (a) {
      var marca = function () { BOTON.nucleo.classList.toggle('con-aviso', !a.classList.contains('sellada')); };
      new MutationObserver(marca).observe(a, { attributes: true, attributeFilter: ['class'] });
      marca();
    }
    muestra('nucleo');
  }

  /* El Army se pide una vez; si falla, NO_DATA en su panel y el siguiente intento vuelve a pedir. */
  function cargaArmy() {
    if (army) { return army; }
    var p = PANEL.army;
    if (p && !p.firstChild) { p.appendChild(el('p', 'atlas-nota', T('army_carga'))); }
    army = pide(ARMY).then(function () {
      if (window.AtlasIncubadora) { window.AtlasIncubadora.monta(capa); }
      var s = capa.querySelector('.atlas-incubadora');
      if (p && s) { p.textContent = ''; p.appendChild(s); tecnico(p); }
    }).catch(function (e) {
      army = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); }
    });
    return army;
  }

  /* La Arena se pide una vez, detras del Army; al volver a ella se refresca la escuadra. */
  function cargaArena() {
    if (arena) { if (window.AtlasArenaUI) { window.AtlasArenaUI.refresca(); } return arena; }
    var p = PANEL.arena;
    if (p && !p.firstChild) { p.appendChild(el('p', 'atlas-nota', T('arena_carga'))); }
    arena = cargaArmy().then(function () { return pide(ARENA); }).then(function () {
      if (window.AtlasArenaUI) { window.AtlasArenaUI.monta(capa, p); }
    }).catch(function (e) {
      arena = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); }
    });
    return arena;
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
            var bo = el('button', 'boton-sec thegame-opina', window.AtlasJuego.texto('opina'));
            bo.addEventListener('click', function () {
              var s = document.createElement('script'); s.src = '/assets/atlas-opina.js';
              s.onload = function () { window.AtlasOpina.abre(capa); };
              if (window.AtlasOpina) { window.AtlasOpina.abre(capa); } else { document.head.appendChild(s); }
            });
            sm.appendChild(bo);
          }
          ordena();
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

  window.TheGame = { abre: abre, cierra: cierra, army: cargaArmy };
})();
