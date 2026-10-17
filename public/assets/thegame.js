/* preceptoros.org · theGame · la capa del juego y su cargador.

   EL JUEGO SOLO VIVE AQUI (2026-09-26) y ES la portada (`#juego-panel`). A DEMANDA: hojas y guiones en
   orden; Army, Casa y Arena al abrir, fuera de la puerta (`gzip_juego_b`). «Un juego COMPACTO» (2026-10-05):
   cada escena al centro, los mandos en los bordes. Cerrar la PESTANA del navegador borra la partida. */
(function () {
  'use strict';
  if (window.TheGame) { return; }

  /* El piloto va detras del piso (la partida envuelve al motor; su capa usa los textos del piso). El
     juez (`/game/`, v1.5) va en la puerta: da voz al Preceptor desde el primer ciclo. */
  var GUIONES = [['atlas-arte.js'], ['atlas-coord.js'], ['atlas-carta.js'], ['atlas-ondas.js'], ['atlas-obra.js'], ['atlas-gesto.js'], ['atlas-mapa.js'],
    ['atlas-dialogo.js', '/assets/'], ['atlas-motor.js'], ['atlas-piso.js', '/'],
    ['atlas-piloto.js'], ['atlas-partida.js'], ['atlas-piloto-capa.js'],
    ['/game/juez.js'], ['atlas-guardado.js'], ['radio_message_log.js'], ['terminal_menu_shell.js'], ['terminal_window_frame.js'], ['worm_transition.js']];
  /* EL ARMY, A DEMANDA (v1.5): al abrir su pestana o al importar una partida firmada. */
  var ARMY = [['/game/valores.js'], ['/game/gacha.js'], ['/game/db.js'], ['/game/core.js'], ['/game/killswitch_dot.js'], ['/game/ui-ficha.js'], ['/game/ui-invoca.js'], ['/game/ui.js']];
  /* LA ARENA, A DEMANDA (2026-09-28): el mar, los lugares NPC, el combate en vivo y los duelos por
     paquetes firmados. Detras del Army, cuyas tropas y verificador usa. */
  var ARENA = [['/game/sobres.js'], ['/game/rating.js'], ['/game/arena.js'], ['/game/duelo.js'],
    ['/game/mar-anclas.js'], ['/game/crab_render_hd.js'], ['/game/audio_feedback_manager.js'], ['/game/crab_free_move.js'], ['/game/genesis_tutorial.js'], ['/game/buildings_toon.js'], ['/game/reef_place_cards.js'], ['/game/shell_schematics.js'], ['/game/reef_buildings_paint.js'], ['/game/latency_crystal.js'], ['/game/hexelion_bench.js'], ['/game/reef_corals.js'], ['/game/reef_buildings_layer.js'], ['/game/mar-cangrejos.js'], ['/game/map_pointer_input.js'], ['/game/semiotic_glyph.js'], ['/game/hexelion_dictionary.js'], ['/game/piece_inspector.js'], ['/game/vector_contract.js'], ['/game/state_vector.js'], ['/game/place_telemetry.js'], ['/game/npc_territory_map.js'], ['/game/map_nodes_layer.js'], ['/game/map_zoom.js'], ['/game/mar.js'], ['/game/nodos-pesos.js'], ['/game/node_reception_contract.js'], ['/game/node_trust_anchor.js'], ['/game/node_trust_manifest.js'], ['/game/node_signature_messages.js'], ['/game/node_signature_verify.js'], ['/game/node_bindings_messages.js'], ['/game/node_bindings.js'], ['/game/nodos.js'], ['/game/cuenta.js'], ['/game/node_projection.js'],
    ['/game/ui-nodos.js'], ['/game/ui-rack.js'], ['/game/node_preview.js'], ['/game/node_file_receiver.js'], ['/game/escuadron.js'], ['/game/battle_choreography.js'], ['/game/battle_replay.js'], ['/game/npc_occupancy.js'], ['/game/npc_walls.js'], ['/game/ui-arena-comun.js'], ['/game/ui-arena.js'], ['/game/ui-duelo.js']];
  /* LAS LENGUAS DEL JUEGO (2026-09-28: «hoy, solo inglés; un mismo enlace»): la UNICA lista de las
     COMPLETAS. La portada abre la suya si esta aqui; si no, la primera. Anadir una = traducir su
     `atlas-<l>.json` hasta que el gate la de completa y escribirla aqui. Las demas son borradores. */
  var LENGUAS = ['en'], RTL = ['ar'];
  var pagina = (document.documentElement.lang || 'en').slice(0, 2);
  var lengua = LENGUAS.indexOf(pagina) >= 0 ? pagina : LENGUAS[0];
  window.AtlasLengua = { lenguas: LENGUAS, actual: lengua, pagina: pagina };
  var capa = null, cargado = null;

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
    ['atlas.css', 'atlas-mapa.css', 'thegame.css', 'terminal_menu_shell.css', 'tubo.css'].forEach(function (n) {
      var h = document.createElement('link');
      h.rel = 'stylesheet'; h.href = '/assets/' + n;
      document.head.appendChild(h);
    });
    cargado = pide(GUIONES);
    return cargado;
  }

  /* EL MAPA UNICO (U1, contrato FIRMADO 2026-10-11): una sola pantalla, el MAPA GLOBAL, siempre detras. Encima,
     TUBOS del arrecife: la TERMINAL (`casa`: Estado con tu cangrejo, Lugares, Terminal J7 y la radio), la hoja del
     TALLER (el unico boton de la barra) y la hoja de BATALLA (se abre al pulsar Fight). HOME muere como lugar. Cada
     zona recibe las piezas del piso por sus selectores (el aviso «solo ingles» va PRIMERO, en la terminal). */
  var PESTANAS = [
    ['casa', '\u2302', '#atlas-juego > .no-data:first-child|.atlas-alerta|.atlas-cab|.atlas-recursos|#atlas-piso > .atlas-vivo|.atlas-dormias|.atlas-lema|.atlas-mapa|.atlas-izq'],
    ['mapa', '\u25C8', '.thegame-exporta|.thegame-opina|.atlas-hud-farmeo|#atlas-juego > .no-data|.atlas-pie'],
    ['taller', '\u2692\uFE0E', '.atlas-nucleo|.atlas-hud > .panel']];
  /* LA CASA, a demanda y detras del Army (usa la gacha para tu emblema). */
  var CASA = [['/game/tabla_semantica.js'], ['/game/comic_tokens.js'], ['/game/comic_atoms.js'], ['/game/canon.js'], ['/game/wave_render.js'], ['/game/escena.js'], ['/game/gdpr-art25-ephemeral-crab.js'], ['/game/aiact-art50-crab-terminal.js'], ['/game/nodos-cedulas.js'], ['/game/fog_of_war.js'], ['/game/isometric_floor_projection.js'], ['/game/world_camera.js'], ['/game/mar-fondo.js'], ['/game/gdpr-art7-entry-choice.js'], ['/game/aiact-art50-state-radio.js'], ['/game/casa-medidas.js'], ['/game/casa-personaliza.js'], ['/game/casa-lateral.js'], ['/game/crab_state_screen.js'], ['/game/reef_building_lifecycle.js'], ['/game/home_buildings.js'], ['/game/summon-wave-card.js'], ['/game/summon_reveal.js'], ['/game/taller.js'], ['/game/army-wave-panel.js'], ['/game/ui-taller.js'], ['/game/primer_eco.js'], ['/game/summon-access.js'], ['/game/deep_links.js'], ['/game/hitl_firma.js'], ['/game/onda_profunda.js'], ['/game/tarjeta_cantada.js'], ['/game/cable_llamar.js'], ['/game/cable_terminal.js']];
  /* LO TECNICO, SIEMPRE PLEGADO («textos que asustan a usuarios no tecnicos»): no se borran, son la
     prueba; se ven al abrir «Technical details». */
  var TECNICO = '.atlas-carta-json, .atlas-nucleo > .atlas-nota, .atlas-nucleo > .atlas-medido, ' +
    '.atlas-incubadora > .atlas-medido, .atlas-incubadora > .atlas-casa, .atlas-pie';
  var PANEL = {}, HOJA = {}, army = null, arena = null, casa = null, ARMYZ = null, ZM = null, ZB = null, PARTIDA = null, MAPA = null;
  var muestra = function () {}, pliego = null;  /* los pone la terminal (`terminal_menu_shell.js`) */

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

  /* LA TERMINAL (FIRMO 2026-10-12): menu a la izquierda + cajon de paneles + hojas + el chat de la Radio abajo viven en
     `terminal_menu_shell.js` (y `radio_message_log.js`); aqui solo se recogen los paneles que monta para los modulos. */
  function ordena() {
    var S = window.AtlasChatTerminal && window.AtlasChatTerminal.monta({ capa: capa, T: T, el: el, cada: cada, tecnico: tecnico, PESTANAS: PESTANAS, alTaller: cargaArmy });
    if (!S) { return; }
    PANEL = S.PANEL; HOJA = S.HOJA; ARMYZ = S.ARMYZ; ZM = S.ZM; ZB = S.ZB; PARTIDA = S.PARTIDA; MAPA = S.MAPA; muestra = S.muestra; pliego = S.pliego;
    cargaCasa();
  }

  /* El Army se pide una vez; si falla, NO_DATA y el siguiente intento vuelve a pedir. */
  function cargaArmy() {
    if (army) { return army; }
    var p = ARMYZ;
    if (p && !p.firstChild) { p.appendChild(el('p', 'atlas-nota', T('army_carga'))); }
    army = pide(ARMY).then(function () {
      if (window.AtlasIncubadora) { window.AtlasIncubadora.monta(capa); }
      var s = capa.querySelector('.atlas-incubadora');
      if (p && s) { p.textContent = ''; p.appendChild(s); tecnico(p); }
    }).catch(function () {
      army = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · the Army could not be loaded')); }
    });
    return army;
  }

  function cargaCasa() {
    if (casa) { return casa; }
    casa = cargaArmy().then(function () { return pide(CASA); }).then(function () {
      if (window.AtlasCasa) { return window.AtlasCasa.monta(document.getElementById('thegame-estado')); }
    }).then(function () {
      /* J8: la entrada (zona o nodo, con sus reglas): una eleccion que se hace una vez; su pliego, cerrado. */
      if (window.AtlasEntrada) { var pe = pliego(T('pl_entrada'), 'pliego-entrada', false, []); PANEL.casa.appendChild(pe); window.AtlasEntrada.monta(pe); }
      /* J7 (el terminal del cangrejo, con la partida plegada dentro) y J2+J9 (la radio): UNA vez, en la terminal. */
      if (window.AtlasTerminal) { window.AtlasTerminal.monta(PANEL.casa, function (k, r) { var t = T(k); return t === k ? r : t; }, PARTIDA); }
      if (window.AtlasRadio) { window.AtlasRadio.monta(PANEL.casa); }
      /* P9: el Polvo de Taller, en el TALLER, debajo del Army. */
      if (window.AtlasTallerUI) { window.AtlasTallerUI.monta(PANEL.taller); }
      /* P11: el capitulo 1.5, «El Primer Eco», arriba del TALLER hasta que tengas Insignia. */
      if (window.AtlasPrimerEco) { window.AtlasPrimerEco.monta(PANEL.taller); }
      setTimeout(cargaArena, 0);
    }).catch(function () { casa = null; PANEL.casa.appendChild(el('p', 'no-data', 'NO_DATA · the game terminal could not be loaded')); });
    return casa;
  }

  /* La Arena se pide una vez, detras del Army; al volver a ella se refresca la escuadra. */
  function cargaArena() {
    if (arena) { if (window.AtlasArenaUI) { window.AtlasArenaUI.refresca(); } return arena; }
    var p = ZB;
    if (p && !p.firstChild) { p.appendChild(el('p', 'atlas-nota', T('arena_carga'))); }
    arena = cargaCasa().then(function () { return pide(ARENA); }).then(function () {
      if (window.AtlasArenaUI) { return window.AtlasArenaUI.monta(capa, p, ZM); }
    }).then(function () {
      /* El lienzo del mapa y sus mandos salen de los Lugares a su capa fija, detras de todo. */
      cada(ZM.querySelectorAll('.atlas-arena-mapa,.mapa-mandos,.mapa-aviso'), function (n) { MAPA.appendChild(n); });
    }).catch(function () {
      arena = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · the arena could not be loaded')); }
    });
    return arena;
  }

  /* EL JUEGO ES LA PAGINA (`#juego-panel`, mudanza 2026-10-11). U0 («el mapa unico», 2026-10-11): el camino del
     <dialog> (X, About, Escape, showModal, aviso de cierre) se RETIRA: todas las paginas son portadas y nunca
     corria (medido: la capa siempre es una <section>). */
  function construye() {
    var P = document.getElementById('juego-panel');
    capa = el('section', 'thegame-capa'); capa.id = 'thegame';
    /* La lengua del juego, no la de la portada (una pagina arabe no voltea un juego en ingles). */
    capa.lang = lengua; capa.dir = RTL.indexOf(lengua) >= 0 ? 'rtl' : 'ltr';
    capa.setAttribute('aria-labelledby', 'thegame-t');
    var barra = el('div', 'thegame-barra');
    barra.appendChild(el('h2', 'thegame-t', 'theGame')).id = 'thegame-t';
    capa.appendChild(barra);
    var juego = el('div', 'thegame-juego'); juego.id = 'atlas-juego';
    capa.appendChild(juego);
    P.textContent = ''; P.appendChild(capa);
  }

  function abre(desde, pes) {
    if (!document.getElementById('juego-panel')) { return; }
    carga().then(function () {
      if (!capa) {
        construye();
        window.AtlasJuego.monta(document.getElementById('atlas-juego'), capa).then(function () {
          if (window.AtlasPilotoCapa) { window.AtlasPilotoCapa.monta(capa); }
          if (window.AtlasGuardado) { window.AtlasGuardado.monta(capa); }
          ordena();
          if (pes && HOJA[pes]) { muestra(pes); }
        });
      } else if (pes && HOJA[pes]) { muestra(pes); }
      window.AtlasJuego.sigue();
    }).catch(function () {
      /* Sin juego no hay capa a medias: causa estable, sin exponer detalles internos. */
      console.warn('NO_DATA · theGame could not be loaded');
      cargado = null;
    });
  }

  /* `ve`: abre una hoja (taller, batalla) o vuelve al mapa (cualquier otra cosa). */
  window.TheGame = { abre: abre, army: cargaArmy, ve: function (id) { muestra(HOJA[id] ? id : null); } };
})();
