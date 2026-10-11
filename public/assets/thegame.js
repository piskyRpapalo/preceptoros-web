/* preceptoros.org · theGame · la capa del juego y su cargador.

   EL JUEGO SOLO VIVE AQUI (2026-09-26): en la portada ES la pagina (`#juego-panel`); en otra, una capa
   a pantalla completa (boton o Escape). A DEMANDA: hojas y guiones en orden; Army, Casa y Arena al
   abrir, fuera de la puerta (`gzip_juego_b`). «Un juego COMPACTO» (2026-10-05): cada escena al centro,
   los mandos en los bordes.

   CERRAR NO BORRA LA PARTIDA; cerrar la PESTANA del navegador si. */
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
    ['/game/mar.js'], ['/game/nodos-pesos.js'], ['/game/nodos.js'], ['/game/cuenta.js'],
    ['/game/ui-nodos.js'], ['/game/ui-rack.js'], ['/game/battle_choreography.js'], ['/game/battle_replay.js'], ['/game/ui-arena.js'], ['/game/ui-duelo.js']];
  /* LAS LENGUAS DEL JUEGO (2026-09-28: «hoy, solo inglés; un mismo enlace»): la UNICA lista de las
     COMPLETAS. La portada abre la suya si esta aqui; si no, la primera. Anadir una = traducir su
     `atlas-<l>.json` hasta que el gate la de completa y escribirla aqui. Las demas son borradores. */
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
    ['atlas.css', 'atlas-mapa.css', 'thegame.css', 'tubo.css'].forEach(function (n) {
      var h = document.createElement('link');
      h.rel = 'stylesheet'; h.href = '/assets/' + n;
      document.head.appendChild(h);
    });
    cargado = pide(GUIONES);
    return cargado;
  }

  /* TRES PESTANAS, SIEMPRE EN ESTE ORDEN (R2, plan «el refresco»): HOME ES TU CANGREJO (`home_buildings.js`;
     el aviso «solo ingles» va PRIMERO); MAP lleva el mapa, la batalla debajo (`ui-arena.js`) y el terminal
     J7 con lo de la partida plegado dentro; TALLER junta el Nucleo, los oficios y el Army (incubadora). */
  var PESTANAS = [
    ['casa', '\u2302', '#atlas-juego > .no-data:first-child|.atlas-alerta|.atlas-cab|.atlas-recursos|#atlas-piso > .atlas-vivo|.atlas-dormias|.atlas-lema|.atlas-mapa|.atlas-izq'],
    ['mapa', '\u25C8', '.atlas-guardado|.thegame-exporta|.thegame-opina|.atlas-hud-farmeo|#atlas-juego > .no-data|.atlas-pie'],
    ['taller', '\u2692\uFE0E', '.atlas-nucleo|.atlas-hud > .panel']];
  /* LA CASA, a demanda y detras del Army (usa la gacha para tu emblema). */
  var CASA = [['/game/canon.js'], ['/game/wave_render.js'], ['/game/escena.js'], ['/game/gdpr-art25-ephemeral-crab.js'], ['/game/aiact-art50-crab-terminal.js'], ['/game/nodos-cedulas.js'], ['/game/fog_of_war.js'], ['/game/world_camera.js'], ['/game/mar-fondo.js'], ['/game/gdpr-art7-entry-choice.js'], ['/game/aiact-art50-state-radio.js'], ['/game/home_base_scene.js'], ['/game/home_buildings.js'], ['/game/summon_reveal.js']];
  /* LO TECNICO, SIEMPRE PLEGADO («textos que asustan a usuarios no tecnicos»): no se borran, son la
     prueba; se ven al abrir «Technical details». */
  var TECNICO = '.atlas-carta-json, .atlas-nucleo > .atlas-nota, .atlas-nucleo > .atlas-medido, ' +
    '.atlas-incubadora > .atlas-medido, .atlas-incubadora > .atlas-casa, .atlas-pie';
  var PANEL = {}, BOTON = {}, actual = 'casa', army = null, arena = null, casa = null, ARMYZ = null, ZM = null, ZB = null, PARTIDA = null;

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

  /* Cambiar de pestana vuelve arriba; el foco solo se mueve con las flechas. J10: el cambio va dentro
     de document.startViewTransition (morfea antes y despues); sin ella o con movimiento reducido, es
     inmediato. El DOM final es EL MISMO. */
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
    if (id === 'mapa') { cargaArena(); }
    if (id === 'casa') { cargaCasa(); }
    if (id === 'taller') { cargaArmy(); }
    /* J7: el terminal del cangrejo vive en MAP, con lo de la partida plegado dentro (una vez). */
    if (id === 'mapa' && window.AtlasTerminal) { window.AtlasTerminal.monta(PANEL.mapa, function (k, r) { var t = T(k); return t === k ? r : t; }, PARTIDA); }
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
    ARMYZ = el('div', 'casa-army'); PANEL.taller.appendChild(ARMYZ);
    ZM = el('div', 'thegame-mundo'); ZB = el('div', 'thegame-batalla'); PARTIDA = el('div', 'thegame-partida');
    cada([].slice.call(PANEL.mapa.children), function (n) { PARTIDA.appendChild(n); });
    [ZM, ZB, PARTIDA].forEach(function (n) { PANEL.mapa.appendChild(n); });
    var ay = el('ol', 'thegame-ayuda');
    for (var nq = 1; nq < 8; nq++) { ay.appendChild(el('li', null, T('ayuda_' + nq))); }
    PARTIDA.insertBefore(ay, PARTIDA.firstChild);
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
      if (window.AtlasCasa) { return window.AtlasCasa.monta(PANEL.casa); }
    }).then(function () {
      /* J8: la entrada (zona o nodo, con sus reglas a la vista) va encima de la casa. */
      if (window.AtlasEntrada) { window.AtlasEntrada.monta(PANEL.casa); }
      /* J2+J9: la radio del estado, al pie de la casa y, desde R7, tambien en el mapa (solo tras el gesto). */
      if (window.AtlasRadio) { window.AtlasRadio.monta(PANEL.casa); window.AtlasRadio.monta(PANEL.mapa); }
      /* J6: el mar de fondo, solo en la portada (mar-fondo.js). */
      if (window.AtlasMarFondo) { window.AtlasMarFondo.portada(); }
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
      if (window.AtlasArenaUI) { window.AtlasArenaUI.monta(capa, p, ZM); }
    }).catch(function (e) {
      arena = null;
      if (p) { p.textContent = ''; p.appendChild(el('p', 'no-data', 'NO_DATA · ' + (e && e.message))); }
    });
    return arena;
  }

  /* EN LA PORTADA (mudanza 2026-10-11) el juego ES la pagina (`#juego-panel`, sin X ni About); fuera,
     un <dialog> con showModal(), cuya trampa de foco pone el navegador. */
  function construye() {
    var P = document.getElementById('juego-panel');
    capa = el(P ? 'section' : 'dialog', 'thegame-capa'); capa.id = 'thegame';
    /* La lengua del juego, no la de la portada (una pagina arabe no voltea un juego en ingles). */
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

  /* Escape llega como `cancel`; si hay un dialogo del juego encima, se cierra ese y la capa se queda. */
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
          ordena();
          if (pes && PANEL[pes]) { muestra(pes); }
        });
      } else if (pes && PANEL[pes]) { muestra(pes); }
      if (capa.showModal && !capa.open) { capa.showModal(); document.body.classList.add('en-thegame'); }
      window.AtlasJuego.sigue();
    }).catch(function (err) {
      /* Sin juego no hay capa a medias: se dice en la consola y la pagina sigue tal cual. */
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
