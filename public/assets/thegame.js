(function () {
  'use strict';
  if (window.TheGame) { return; }

  var GUIONES = [['atlas-arte.js'], ['atlas-coord.js'], ['atlas-carta.js'], ['atlas-ondas.js'], ['atlas-obra.js'], ['atlas-gesto.js'],
    ['atlas-dialogo.js', '/assets/'], ['atlas-motor.js'], ['atlas-piso.js', '/'],
    ['atlas-piloto.js'], ['atlas-partida.js'], ['atlas-piloto-capa.js'],
    ['/game/juez.js'], ['atlas-guardado.js'], ['radio_message_log.js'], ['/game/z_cutoff.js'], ['terminal_menu_shell.js'], ['terminal_window_frame.js'], ['worm_transition.js']];

  var ARMY = [['/game/valores.js'], ['/game/gacha.js'], ['/game/db.js'], ['/game/core.js'], ['/game/killswitch_dot.js'], ['/game/ui-ficha.js'], ['/game/ui-invoca.js'], ['/game/ui.js']];

  var ARENA = [['/game/sobres.js'], ['/game/rating.js'], ['/game/combate_ticks.js'], ['/game/arena.js'], ['/game/duelo.js'],
    ['/game/mar-anclas.js'], ['/game/crab_render_hd.js'], ['/game/audio_feedback_manager.js'], ['/game/crab_free_move.js'], ['/game/genesis_tutorial.js'], ['/game/buildings_toon.js'], ['/game/reef_place_cards.js'], ['/game/shell_schematics.js'], ['/game/reef_buildings_paint.js'], ['/game/latency_crystal.js'], ['/game/hexelion_bench.js'], ['/game/bubble_bestiary.js'], ['/game/map_bubble_figures.js'], ['/game/reef_corals.js'], ['/game/reef_buildings_layer.js'], ['/game/mar-cangrejos.js'], ['/game/map_pointer_input.js'], ['/game/semiotic_glyph.js'], ['/game/hexelion_dictionary.js'], ['/game/piece_inspector.js'], ['/game/vector_contract.js'], ['/game/state_vector.js'], ['/game/place_reading.js'], ['/game/npc_territory_map.js'], ['/game/map_nodes_layer.js'], ['/game/map_zoom.js'], ['/game/mar.js'], ['/game/nodos-pesos.js'], ['/game/node_reception_contract.js'], ['/game/node_trust_anchor.js'], ['/game/node_trust_manifest.js'], ['/game/node_signature_messages.js'], ['/game/node_signature_verify.js'], ['/game/node_bindings_messages.js'], ['/game/node_bindings.js'], ['/game/nodos.js'], ['/game/cuenta.js'], ['/game/node_projection.js'],
    ['/game/ui-nodos.js'], ['/game/ui-rack.js'], ['/game/node_preview.js'], ['/game/node_file_receiver.js'], ['/game/escuadron.js'], ['/game/battle_choreography.js'], ['/game/battle_replay.js'], ['/game/npc_occupancy.js'], ['/game/npc_walls.js'], ['/game/ui-arena-comun.js'], ['/game/ui-arena.js'], ['/game/ui-duelo.js']];

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

  function pide(todas) {
    var lista = todas.filter(function (g) { var u = g[0].charAt(0) === '/' ? g[0] : '/assets/' + g[0]; return !document.querySelector('script[src="' + u + '"]'); });
    return new Promise(function (listo, falla) {
      if (!lista.length) { listo(); return; }
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
    ['atlas.css', 'thegame.css', 'terminal_menu_shell.css', 'tubo.css'].forEach(function (n) {
      var h = document.createElement('link');
      h.rel = 'stylesheet'; h.href = '/assets/' + n;
      document.head.appendChild(h);
    });
    cargado = pide(GUIONES);
    return cargado;
  }

  var PESTANAS = [
    ['casa', '\u2302', '#atlas-juego > .no-data:first-child|.atlas-alerta|.atlas-cab|.atlas-recursos|#atlas-piso > .atlas-vivo|.atlas-dormias|.atlas-lema|.atlas-izq'],
    ['mapa', '\u25C8', '.thegame-exporta|.thegame-opina|.atlas-hud-farmeo|#atlas-juego > .no-data|.atlas-pie'],
    ['taller', '\u2692\uFE0E', '.atlas-nucleo|.atlas-hud > .panel']];

  var CASA = [['/game/tabla_semantica.js'], ['/game/comic_tokens.js'], ['/game/comic_atoms.js'], ['/game/canon.js'], ['/game/wave_render.js'], ['/game/escena.js'], ['/game/gdpr-art25-ephemeral-crab.js'], ['/game/aiact-art50-crab-terminal.js'], ['/game/nodos-cedulas.js'], ['/game/fog_of_war.js'], ['/game/isometric_floor_projection.js'], ['/game/world_camera.js'], ['/game/mar-fondo.js'], ['/game/mar_rift.js'], ['/game/bubble_language.js'], ['/game/bubble_editor.js'], ['/game/bubble_paint.js'], ['/game/bubble_icons.js'], ['/game/gdpr-art7-entry-choice.js'], ['/game/aiact-art50-state-radio.js'], ['/game/casa-medidas.js'], ['/game/casa-personaliza.js'], ['/game/casa-lateral.js'], ['/game/crab_state_screen.js'], ['/game/reef_building_lifecycle.js'], ['/game/home_buildings.js'], ['/game/summon-wave-card.js'], ['/game/summon_reveal.js'], ['/game/taller.js'], ['/game/army-wave-panel.js'], ['/game/ui-taller.js'], ['/game/primer_eco.js'], ['/game/summon-access.js'], ['/game/deep_links.js'], ['/game/hitl_firma.js'], ['/game/onda_profunda.js'], ['/game/tarjeta_cantada.js'], ['/game/cable_llamar.js'], ['/game/cable_terminal.js']];

  var TECNICO = '.atlas-carta-json, .atlas-nucleo > .atlas-nota, .atlas-nucleo > .atlas-medido, ' +
    '.atlas-incubadora > .atlas-medido, .atlas-incubadora > .atlas-casa, .atlas-pie';
  var PANEL = {}, HOJA = {}, army = null, arena = null, casa = null, ARMYZ = null, ZM = null, ZB = null, PARTIDA = null, MAPA = null;
  var muestra = function () {}, pliego = null;

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

  function ordena() {
    var S = window.AtlasChatTerminal && window.AtlasChatTerminal.monta({ capa: capa, T: T, el: el, cada: cada, tecnico: tecnico, PESTANAS: PESTANAS, alTaller: cargaArmy });
    if (!S) { return; }
    PANEL = S.PANEL; HOJA = S.HOJA; ARMYZ = S.ARMYZ; ZM = S.ZM; ZB = S.ZB; PARTIDA = S.PARTIDA; MAPA = S.MAPA; muestra = S.muestra; pliego = S.pliego;
    cargaCasa();
  }

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

      if (window.AtlasEntrada) { var pe = pliego(T('pl_entrada'), 'pliego-entrada', false, []); PANEL.casa.appendChild(pe); window.AtlasEntrada.monta(pe); }

      if (window.AtlasTerminal) { window.AtlasTerminal.monta(PANEL.casa, function (k, r) { var t = T(k); return t === k ? r : t; }, PARTIDA); }
      if (window.AtlasRadio) { window.AtlasRadio.monta(PANEL.casa); }

      if (window.AtlasTallerUI) { window.AtlasTallerUI.monta(PANEL.taller); }

      if (window.AtlasPrimerEco) { window.AtlasPrimerEco.monta(PANEL.taller); }
      setTimeout(cargaArena, 0);
    }).catch(function () { casa = null; PANEL.casa.appendChild(el('p', 'no-data', 'NO_DATA · the game terminal could not be loaded')); });
    return casa;
  }

  function cargaArena() {
    if (arena) { if (window.AtlasArenaUI) { window.AtlasArenaUI.refresca(); } return arena; }
    var p = ZB;
    if (p && !p.firstChild) { p.appendChild(el('p', 'atlas-nota', T('arena_carga'))); }
    arena = cargaCasa().then(function () { return pide(ARENA); }).then(function () {
      if (window.AtlasArenaUI) { return window.AtlasArenaUI.monta(capa, p, ZM); }
    }).then(function () {

      cada(ZM.querySelectorAll('.atlas-arena-mapa,.mapa-mandos,.mapa-aviso'), function (n) { MAPA.appendChild(n); });
    }).catch(function () {
      arena = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · the arena could not be loaded')); }
    });
    return arena;
  }

  function construye() {
    var P = document.getElementById('juego-panel');
    capa = el('section', 'thegame-capa'); capa.id = 'thegame';

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

      console.warn('NO_DATA · theGame could not be loaded');
      cargado = null;
    });
  }

  var BASE = [['/game/tabla_semantica.js'], ['/game/comic_tokens.js'], ['/game/comic_accents.js'],
    ['/game/comic_atoms.js'], ['/game/valores.js'], ['/game/gacha.js'], ['/game/bubble_language.js'], ['/game/bubble_light.js'],
    ['/game/bubble_bestiary.js'], ['/game/bubble_world.js'], ['/game/bubble_letters.js'], ['/game/aiact-art50-state-radio.js'], ['/game/descent_sound.js'], ['/game/audio_feedback_manager.js'], ['/game/world_creator.js'], ['/game/tutorial_fases.js'], ['/game/reef_building_lifecycle.js'], ['/game/deploy_building.js'], ['/game/etiqueta.js'], ['/game/en301_tutorial_building.js'], ['/game/ui-tutorial-fases.js'], ['descent_view.js']];

  var VISTAS = {
    codex: [['/game/bubble_game.js'], ['codex_scene.js'], 'AtlasCodexScene'],
    bout: [['/game/canon.js'], ['/game/sobres.js'], ['/game/rating.js'], ['/game/taller.js'], ['/game/combate_ticks.js'], ['/game/arena.js'], ['/game/bubble_game.js'], ['bout_scene.js'], 'AtlasBoutScene']
  };
  function nuevos(lista) {
    return lista.filter(function (g) { var s = g[0].charAt(0) === '/' ? g[0] : '/assets/' + g[0]; return !document.querySelector('script[src="' + s + '"]'); });
  }
  function codex(nombre) {
    var P = document.getElementById('juego-panel'), V = VISTAS[nombre] || VISTAS.codex, piel = /[?&]skin=(\w+)/.exec(location.search);
    if (!P || capa) { return false; }
    if (!document.querySelector('link[href="/assets/descent.css"]')) {
      var h = document.createElement('link'); h.rel = 'stylesheet'; h.href = '/assets/descent.css'; document.head.appendChild(h);
    }
    var falta = nuevos(BASE.concat(V.slice(0, -1)));
    (falta.length ? pide(falta) : Promise.resolve()).then(function () {
      if (window.AtlasBubbleGame) { window.AtlasBubbleGame.useSkin(piel ? piel[1] : (nombre === 'bout' ? 'apocalypse' : 'atlantis')); }
      window.AtlasDescentView.monta(P, function () { abre(null, 'casa'); }, window[V[V.length - 1]]);
      window.scrollTo(0, 0);
    }).catch(function () { console.warn('NO_DATA · the codex could not be loaded'); abre(null, 'casa'); });
    return true;
  }

  function frontDoor() {
    var panel = document.getElementById('juego-panel');
    if (!panel || capa) { return false; }
    pide(nuevos([['front_door_view.js']])).then(function () {
      return window.AtlasFrontDoorView.load(pide, nuevos, panel, { explore: function () { abre(null, 'casa'); }, tutorial: tutorial });
    }).catch(function () { console.warn('NO_DATA · the front door could not load'); abre(null, 'casa'); });
    return true;
  }

  var tutorialView = null;
  function tutorial() {
    var panel = document.getElementById('juego-panel');
    if (!panel) { return false; }
    var scripts = [['/game/tabla_semantica.js'], ['/game/comic_tokens.js'], ['/game/comic_accents.js'], ['/game/valores.js'], ['/game/gacha.js'], ['/game/core.js'], ['/assets/atlas-coord.js'], ['/game/canon.js'], ['/game/aiact-art50-state-radio.js'], ['/game/combate_ticks.js'], ['/game/silueta.js'], ['/game/wave_render.js'], ['/game/reef_building_lifecycle.js'], ['/game/deploy_building.js'], ['/game/etiqueta.js'], ['/game/en301_tutorial_building.js'], ['/game/audio_feedback_manager.js'], ['/game/tutorial_fases.js'], ['/game/en301_practice_model.js'], ['/game/en301_practice_arena.js'], ['/game/en301_tutorial_model.js'], ['/game/en301_tutorial_audio.js'], ['/game/en301_tutorial.js']];
    ['/assets/en301_tutorial.css', '/assets/en301_practice.css'].forEach(function (href) {
      if (!document.querySelector('link[href="' + href + '"]')) { var sheet = document.createElement('link'); sheet.rel = 'stylesheet'; sheet.href = href; document.head.appendChild(sheet); }
    });
    return pide(nuevos(scripts)).then(function () {
      if (tutorialView) { tutorialView.destroy(); }
      var palette = window.AtlasComicTokens.NEUTRAL;
      ['ink', 'paper', 'ocean', 'cyan'].forEach(function (key) { panel.style.setProperty('--d-' + key, palette[key]); });
      panel.style.setProperty('--d-yellow', window.AtlasComicAccents.ACCENTS['comic yellow'].bands.base);
      var measures = window.En301TutorialBuilding.measure('radio');
      tutorialView = window.AtlasTutorialGuide.mount(document, panel, {
        label: measures.etiqueta ? { ok: true, texto: measures.etiqueta, bytes: measures.bytes } : null,
        openPractice: function (host, done, context) {
          return window.AtlasPracticeArena.mount(document, host, { seed: window.AtlasCanon.sha(context.seed), onFinish: done,
            onNarrate: function (text) { if (tutorialView) { tutorialView.narrate(text); } } });
        },
        verifyPractice: function (packet, context) {
          if (!packet || packet.s !== window.AtlasCanon.sha(context.seed)) { return { ok: false, reason: 'Practice seed differs from this step.' }; }
          return window.AtlasPracticeModel.verify(packet);
        },
        onExit: function () { if (tutorialView) { tutorialView.destroy(); tutorialView = null; } }
      });
      return true;
    }).catch(function () { console.warn('Guided practice unavailable: required local modules could not load.'); return false; });
  }

  window.TheGame = { frontDoor: frontDoor, abre: abre, army: cargaArmy, codex: codex, tutorial: tutorial, ve: function (id) { muestra(HOJA[id] ? id : null); } };
})();
