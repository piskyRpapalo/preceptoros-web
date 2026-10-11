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
    ['/game/juez.js'], ['atlas-guardado.js']];
  /* EL ARMY, A DEMANDA (v1.5): al abrir su pestana o al importar una partida firmada. */
  var ARMY = [['/game/valores.js'], ['/game/gacha.js'], ['/game/db.js'], ['/game/core.js'], ['/game/ui.js']];
  /* LA ARENA, A DEMANDA (2026-09-28): el mar, los lugares NPC, el combate en vivo y los duelos por
     paquetes firmados. Detras del Army, cuyas tropas y verificador usa. */
  var ARENA = [['/game/sobres.js'], ['/game/rating.js'], ['/game/arena.js'], ['/game/duelo.js'],
    ['/game/mar-anclas.js'], ['/game/mar.js'], ['/game/nodos-pesos.js'], ['/game/nodos.js'], ['/game/cuenta.js'],
    ['/game/ui-nodos.js'], ['/game/ui-rack.js'], ['/game/escuadron.js'], ['/game/battle_choreography.js'], ['/game/battle_replay.js'], ['/game/ui-arena-comun.js'], ['/game/ui-arena.js'], ['/game/ui-duelo.js']];
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
    ['atlas.css', 'atlas-mapa.css', 'thegame.css', 'tubo.css'].forEach(function (n) {
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
    ['mapa', '\u25C8', '.atlas-guardado|.thegame-exporta|.thegame-opina|.atlas-hud-farmeo|#atlas-juego > .no-data|.atlas-pie'],
    ['taller', '\u2692\uFE0E', '.atlas-nucleo|.atlas-hud > .panel']];
  /* LA CASA, a demanda y detras del Army (usa la gacha para tu emblema). */
  var CASA = [['/game/canon.js'], ['/game/wave_render.js'], ['/game/escena.js'], ['/game/gdpr-art25-ephemeral-crab.js'], ['/game/aiact-art50-crab-terminal.js'], ['/game/nodos-cedulas.js'], ['/game/fog_of_war.js'], ['/game/world_camera.js'], ['/game/mar-fondo.js'], ['/game/gdpr-art7-entry-choice.js'], ['/game/aiact-art50-state-radio.js'], ['/game/casa-medidas.js'], ['/game/casa-personaliza.js'], ['/game/casa-lateral.js'], ['/game/home_buildings.js'], ['/game/summon_reveal.js'], ['/game/taller.js'], ['/game/ui-taller.js'], ['/game/primer_eco.js']];
  /* LO TECNICO, SIEMPRE PLEGADO («textos que asustan a usuarios no tecnicos»): no se borran, son la
     prueba; se ven al abrir «Technical details». */
  var TECNICO = '.atlas-carta-json, .atlas-nucleo > .atlas-nota, .atlas-nucleo > .atlas-medido, ' +
    '.atlas-incubadora > .atlas-medido, .atlas-incubadora > .atlas-casa, .atlas-pie';
  var PANEL = {}, HOJA = {}, actual = null, destino = null, army = null, arena = null, casa = null, ARMYZ = null, ZM = null, ZB = null, PARTIDA = null, BT = null, MAPA = null;

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

  /* LAS HOJAS (Taller, Batalla) se abren sobre el mapa y se cierran con su boton o Escape; abierta una, el mapa se
     PAUSA (`con-hoja`). J10: el cambio va dentro de document.startViewTransition; sin ella o con movimiento
     reducido, inmediato. El DOM final es EL MISMO. `id` null = ninguna hoja: solo el mapa y la terminal. */
  function muestra(id, foco) {
    if (HOJA[id] ? id === destino : destino === null) { return; }  /* ya pedida: una segunda transicion abortaria la primera */
    destino = HOJA[id] ? id : null;
    var d = document, rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (id !== actual && d.startViewTransition && !rm && capa && capa.isConnected) { d.startViewTransition(function () { muestraYa(id, foco); }); }
    else { muestraYa(id, foco); }
  }
  function muestraYa(id, foco) {
    actual = destino = HOJA[id] ? id : null;
    Object.keys(HOJA).forEach(function (k) { HOJA[k].hidden = k !== actual; });
    BT.setAttribute('aria-expanded', String(actual === 'taller'));
    document.documentElement.classList.toggle('con-hoja', !!actual);
    if (actual === 'taller') { cargaArmy(); }
    if (actual && foco !== false) { var c = HOJA[actual].querySelector('.thegame-hoja-cierra'); if (c) { c.focus(); } } else if (foco) { BT.focus(); }
  }
  /* Una hoja: su cabecera fija (volver al mapa y titulo) y su cuerpo, que es donde montan los modulos. */
  function hoja(id, titulo) {
    var d = el('section', 'thegame-hoja'), cab = el('div', 'thegame-hoja-cab'), cu = el('div', 'thegame-hoja-cuerpo');
    d.id = 'thegame-' + id; d.hidden = true; d.setAttribute('role', 'region'); d.setAttribute('aria-label', titulo);
    var c = el('button', 'boton-sec thegame-hoja-cierra', '\u2190 ' + T('hoja_mapa')); c.type = 'button'; c.id = 'thegame-' + id + '-cierra';
    c.addEventListener('click', function () { muestra(null, true); });
    cab.appendChild(c); cab.appendChild(el('h3', null, titulo)); d.appendChild(cab); d.appendChild(cu); HOJA[id] = d;
    return cu;
  }
  function pliego(titulo, id, abierto, hijos) {
    var d = el('details', 'thegame-pliego'); d.id = id; d.open = !!abierto;
    d.appendChild(el('summary', null, titulo)); hijos.forEach(function (n) { d.appendChild(n); });
    return d;
  }

  function ordena() {
    var piso = capa.querySelector('#atlas-piso'), barra = capa.querySelector('.thegame-barra');
    if (!piso || !barra || barra.querySelector('#thegame-b-taller')) { return; }
    PESTANAS.forEach(function (p) {
      var d = el('section'); p[2].split('|').forEach(function (q) { if (q) { cada(capa.querySelectorAll(q), function (n) { d.appendChild(n); }); } });
      tecnico(d); PANEL[p[0]] = d;
    });
    /* La TERMINAL: el Estado (lo monta la casa), los Lugares (el mapa en el DOM: lista, ficha y Fight) y lo de la
       partida, que va plegado dentro del Terminal J7. */
    var term = el('aside', 'thegame-terminal'); term.id = 'thegame-terminal'; term.setAttribute('aria-label', T('terminal_aria'));
    var est = PANEL.casa; est.className = 'thegame-estado'; est.id = 'thegame-estado';
    ZM = el('div', 'thegame-mundo'); PARTIDA = el('div', 'thegame-partida');
    cada([].slice.call(PANEL.mapa.children), function (n) { PARTIDA.appendChild(n); });
    var ay = el('ol', 'thegame-ayuda');
    for (var nq = 1; nq < 8; nq++) { ay.appendChild(el('li', null, T('ayuda_' + nq))); }
    PARTIDA.insertBefore(ay, PARTIDA.firstChild);
    term.appendChild(pliego(T('pl_estado'), 'pliego-estado', true, [est]));
    term.appendChild(pliego(T('pl_lugares'), 'pliego-lugares', false, [ZM]));
    PANEL.casa = term; PANEL.mapa = term;
    /* El MAPA: su lienzo vive en su capa fija, detras de todo (nunca dentro de un pliego cerrado). */
    MAPA = el('div', 'thegame-mapa'); MAPA.id = 'thegame-mapa';
    var tal = hoja('taller', T('pes_taller')); tal.appendChild(PANEL.taller); PANEL.taller = tal;
    ARMYZ = el('div', 'casa-army'); tal.appendChild(ARMYZ);
    ZB = hoja('batalla', T('hoja_batalla'));
    [MAPA, term, HOJA.taller, HOJA.batalla].forEach(function (n) { piso.appendChild(n); });
    cada(piso.querySelectorAll(':scope > .atlas-rejilla'), function (n) { n.remove(); });
    /* La barra: UN boton, el Taller. */
    BT = el('button', 'thegame-b-taller'); BT.type = 'button'; BT.id = 'thegame-b-taller'; BT.setAttribute('aria-controls', 'thegame-taller');
    var ico = el('span', 'thegame-ico', '\u2692\uFE0E'); ico.setAttribute('aria-hidden', 'true');
    BT.appendChild(ico); BT.appendChild(el('span', null, T('pes_taller')));
    BT.addEventListener('click', function () { muestra(actual === 'taller' ? null : 'taller'); });
    var nav = el('nav', 'thegame-pestanas'); nav.setAttribute('aria-label', T('pes_aria')); nav.appendChild(BT); barra.appendChild(nav);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && actual && !document.querySelector('.atlas-dlg-capa,dialog[open]')) { muestra(null, true); } });
    /* Con la grieta abierta, el Estado lleva un punto: el aviso llega aunque haya una hoja encima. */
    var a = est.querySelector('.atlas-alerta');
    if (a) {
      var marca = function () { term.classList.toggle('con-aviso', !a.classList.contains('sellada')); };
      new MutationObserver(marca).observe(a, { attributes: true, attributeFilter: ['class'] });
      marca();
    }
    muestraYa(null); cargaCasa();
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
    }).catch(function (e) {
      army = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); }
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
    }).catch(function (e) { casa = null; PANEL.casa.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); });
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
    }).catch(function (e) {
      arena = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); }
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
    }).catch(function (err) {
      /* Sin juego no hay capa a medias: se dice en la consola y la pagina sigue tal cual. */
      console.warn('NO_DATA · theGame no cargo: ' + (err && err.message));
      cargado = null;
    });
  }

  /* `ve`: abre una hoja (taller, batalla) o vuelve al mapa (cualquier otra cosa). */
  window.TheGame = { abre: abre, army: cargaArmy, ve: function (id) { muestra(HOJA[id] ? id : null); } };
})();
