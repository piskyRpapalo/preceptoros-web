/* preceptoros.org · theGame · la capa del juego y su cargador.

   EL JUEGO SOLO VIVE AQUI (Soberano, 2026-09-26). En la portada ES la pagina
   (`#juego-panel`); en cualquier otra, una capa a pantalla completa que se
   cierra con su boton o con Escape.

   A DEMANDA. Lo inyecta `cabezal-rotulos.js` al pulsar la puerta; pide hojas y guiones en orden.
   El Army y la Arena se piden al abrir: su peso no va en la puerta (`gzip_juego_b`).

   CUATRO PESTANAS (Soberano, 2026-10-05: «un juego COMPACTO»; «la primera pantalla de tu nodo debe ser
   TU CASA»): Home, Map, Battle y Help. Cada escena ocupa el centro; los mandos van en los bordes.

   CERRAR NO BORRA LA PARTIDA; cerrar la PESTANA del navegador si. */
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
  var ARENA = [['/game/sobres.js'], ['/game/rating.js'], ['/game/arena.js'], ['/game/duelo.js'],
    ['/game/fog_of_war.js'], ['/game/world_camera.js'], ['/game/mar.js'], ['/game/nodos-pesos.js'], ['/game/nodos.js'], ['/game/cuenta.js'],
    ['/game/ui-nodos.js'], ['/game/ui-rack.js'], ['/game/battle_choreography.js'], ['/game/battle_replay.js'], ['/game/ui-arena.js'], ['/game/ui-duelo.js']];
  /* LAS LENGUAS DEL JUEGO (2026-09-28, el Soberano: «hoy, solo inglés; un mismo enlace»). La
     UNICA lista de lenguas en las que el juego esta COMPLETO. Cualquier portada abre el juego en
     una de ellas: la de la pagina si esta aqui; si no, la primera. Anadir una lengua es traducir
     su `atlas-<l>.json` hasta que el gate la de completa y escribirla aqui: nada mas cambia. Las
     demas son borradores (el gate vigila que no tengan claves huerfanas y mide su cobertura). */
  var LENGUAS = ['en'], RTL = ['ar'];
  var pagina = (document.documentElement.lang || 'en').slice(0, 2);
  var lengua = LENGUAS.indexOf(pagina) >= 0 ? pagina : LENGUAS[0];
  window.AtlasLengua = { lenguas: LENGUAS, actual: lengua, pagina: pagina };
  var capa = null, origen = null, cargado = null, RUTA = /^#thegame(?:\/\w+)?$/;

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

  /* LAS PESTANAS (2026-10-05): Home, Map, Battle y Help. HOME ES TU CASA (`home_buildings.js`): las
     piezas del piso se MUEVEN a su panel y la casa las reparte en sus edificios. El aviso «solo
     ingles» va PRIMERO en la pestana de entrada. Map y Battle los pinta la Arena (`ui-arena.js`). */
  var PESTANAS = [
    ['casa', '\u2302', '#atlas-juego > .no-data:first-child|.atlas-alerta|.atlas-cab|.atlas-recursos|#atlas-piso > .atlas-vivo|.atlas-dormias|.atlas-lema|.atlas-mapa|.atlas-izq|.atlas-nucleo|.atlas-hud > .panel'],
    ['mapa', '\u25C8', ''],
    ['arena', '\u2694\uFE0E', ''],
    ['partida', '\u2139\uFE0E', '.atlas-guardado|.thegame-exporta|.thegame-opina|.atlas-hud-farmeo|#atlas-juego > .no-data|.atlas-pie']];
  /* LA CASA, a demanda y detras del Army (usa la gacha para tu emblema). */
  var CASA = [['/game/canon.js'], ['/game/wave_render.js'], ['/game/escena.js'], ['/game/gdpr-art25-ephemeral-crab.js'], ['/game/aiact-art50-crab-terminal.js'], ['/game/nodos-cedulas.js'], ['/game/gdpr-art7-entry-choice.js'], ['/game/home_base_scene.js'], ['/game/home_buildings.js'], ['/game/summon_reveal.js']];
  /* LO TECNICO, SIEMPRE PLEGADO (Soberano: «son textos que asustan a usuarios no tecnicos»): el
     JSON de la carta, las leyes medidas, la semilla que no es VRF, los valores provisionales y el
     pie. No se borran, porque son la prueba: se ven al abrir «Technical details». */
  var TECNICO = '.atlas-carta-json, .atlas-nucleo > .atlas-nota, .atlas-nucleo > .atlas-medido, ' +
    '.atlas-incubadora > .atlas-medido, .atlas-incubadora > .atlas-casa, .atlas-pie';
  var PANEL = {}, BOTON = {}, actual = 'casa', army = null, arena = null, casa = null, ARMYZ = null;

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
  /* LA PAGINA SE REORDENA, NO CARGA (J10, plan de ronda firmado): cambiar de pestana va dentro de
     document.startViewTransition, que fotografia el antes y el despues y los morfea. Donde no existe,
     o con movimiento reducido, el cambio es el de siempre, inmediato. El DOM final es EL MISMO. */
  function muestra(id, foco) {
    var d = document, rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (id !== actual && d.startViewTransition && !rm && capa && capa.isConnected) { d.startViewTransition(function () { muestraYa(id, foco); }); }
    else { muestraYa(id, foco); }
  }
  function muestraYa(id, foco) {
    if (id !== actual) { capa.scrollTop = 0; }
    actual = id;
    Object.keys(PANEL).forEach(function (k) {
      PANEL[k].hidden = k !== id;
      BOTON[k].setAttribute('aria-selected', String(k === id));
      BOTON[k].tabIndex = k === id ? 0 : -1;
    });
    if (foco) { BOTON[id].focus(); }
    if (id === 'arena') { cargaArena(); }
    if (id === 'mapa') { cargaArena(); }
    if (id === 'casa') { cargaCasa(); }
    /* J7: el terminal del cangrejo vive en Help; se monta al abrirla (una vez). */
    if (id === 'partida' && window.AtlasTerminal) { window.AtlasTerminal.monta(PANEL.partida, function (k, r) { var t = T(k); return t === k ? r : t; }); }
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
    ARMYZ = el('div', 'casa-army'); PANEL.casa.appendChild(ARMYZ);
    var ay = el('ol', 'thegame-ayuda');
    for (var nq = 1; nq < 8; nq++) { ay.appendChild(el('li', null, T('ayuda_' + nq))); }
    PANEL.partida.insertBefore(ay, PANEL.partida.firstChild);
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
      var marca = function () { BOTON.casa.classList.toggle('con-aviso', !a.classList.contains('sellada')); };
      new MutationObserver(marca).observe(a, { attributes: true, attributeFilter: ['class'] });
      marca();
    }
    muestra('casa');
  }

  /* El Army se pide una vez; si falla, NO_DATA en su panel y el siguiente intento vuelve a pedir. */
  function cargaArmy() {
    if (army) { return army; }
    var p = ARMYZ;
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

  function cargaCasa() {
    if (casa) { return casa; }
    casa = cargaArmy().then(function () { return pide(CASA); }).then(function () {
      if (window.AtlasCasa) { return window.AtlasCasa.monta(PANEL.casa); }
    }).then(function () {
      /* J8: la entrada (zona o nodo, con sus reglas a la vista) va encima de la casa. */
      if (window.AtlasEntrada) { window.AtlasEntrada.monta(PANEL.casa); }
      setTimeout(cargaArena, 0);
    }).catch(function (e) { casa = null; PANEL.casa.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); });
    return casa;
  }

  /* La Arena se pide una vez, detras del Army; al volver a ella se refresca la escuadra. */
  function cargaArena() {
    if (arena) { if (window.AtlasArenaUI) { window.AtlasArenaUI.refresca(); } return arena; }
    var p = PANEL.arena;
    if (p && !p.firstChild) { p.appendChild(el('p', 'atlas-nota', T('arena_carga'))); }
    arena = cargaCasa().then(function () { return pide(ARENA); }).then(function () {
      if (window.AtlasArenaUI) { window.AtlasArenaUI.monta(capa, p, PANEL.mapa); }
    }).catch(function (e) {
      arena = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); }
    });
    return arena;
  }

  /* EN LA PORTADA (mudanza 2026-10-11) el juego ES la pagina: se monta en `#juego-panel`, sin X ni
     About. FUERA de ella, un <dialog> con showModal(): la trampa de foco la pone el navegador. */
  function construye() {
    var P = document.getElementById('juego-panel');
    capa = el(P ? 'section' : 'dialog', 'thegame-capa'); capa.id = 'thegame';
    /* La capa habla la lengua del juego, no la de la portada: sin esto, una pagina arabe
       voltearia un juego escrito en ingles. */
    capa.lang = lengua; capa.dir = RTL.indexOf(lengua) >= 0 ? 'rtl' : 'ltr';
    capa.setAttribute('aria-labelledby', 'thegame-t');
    var barra = el('div', 'thegame-barra');
    barra.appendChild(el('h2', 'thegame-t', 'theGame')).id = 'thegame-t';
    var x = el('button', 'thegame-cerrar', '×'); x.type = 'button';
    x.setAttribute('aria-label', 'theGame ×');
    x.addEventListener('click', cierra);
    var ab = el('a', 'thegame-about', 'About'); ab.href = '#about'; ab.addEventListener('click', cierra);
    if (!P) { barra.appendChild(ab); barra.appendChild(x); }
    capa.appendChild(barra);
    var juego = el('div', 'thegame-juego'); juego.id = 'atlas-juego';
    capa.appendChild(juego);
    capa.addEventListener('cancel', cancela);
    if (P) { P.textContent = ''; }
    (P || document.body).appendChild(capa);
  }

  /* Escape llega como `cancel` del <dialog>. Si hay un dialogo del juego
     abierto encima, se cierra ese (con su propio Escape) y la capa se queda. */
  function cancela(e) {
    e.preventDefault();
    if (!document.querySelector('.atlas-dlg-capa')) { cierra(); }
  }

  /* Al cerrar se dice, un momento y sin tapar nada, que la partida queda en el aparato. */
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

  function abre(desde, pes) {
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
          if (pes && PANEL[pes]) { muestra(pes); }
        });
      } else if (pes && PANEL[pes]) { muestra(pes); }
      if (capa.showModal && !capa.open) { capa.showModal(); document.body.classList.add('en-thegame'); }
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
    if (RUTA.test(location.hash) && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (origen && origen.focus) { origen.focus(); }
    avisa();
  }

  window.TheGame = { abre: abre, cierra: cierra, army: cargaArmy, ve: function (id) { if (PANEL[id]) { muestra(id); } } };
})();
