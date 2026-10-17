/* preceptoros.org · theGame · la ARENA: el mar multijugador, los lugares NPC y el combate en vivo.

   El MAPA global (`mar.js`, lugares y boton grande) y debajo la BATALLA (rival, escena, escuadra; duelos y
   casas plegados), en MAP (R2). Lugares NPC = `arena.lugares`; personas = defensas firmadas importadas.

   LUCHAR: eliges escuadra (tu Army; si aun no tienes tropas, una escuadra de PRACTICA sintetica que se
   dice) y un lugar. `arena.combate` decide con enteros y una semilla; `escena.js` lo reproduce en vivo.
   Contra NPCs es PRACTICA: sintetica, sin rating y sin botin (el botin es NO_DATA hasta firmar su
   regla). Ganarle CONQUISTA el lugar en este aparato (db.js). Se pulsa DOM; el lienzo es el mar. */
(function () {
  'use strict';

  var K = window.AtlasCanon, A = window.AtlasArena, E = window.AtlasEscena, G = window.AtlasGacha, V = window.AtlasValores;
  var CQ = null, R = {}, lugares = [], jugadores = [], sel = null, pub = null, emblema = null, record = {}, intentos = {};
  var escuadraSel = null, actual = null, mar = null;

  /* Shared Arena labels and rendering live in ui-arena-comun.js. */
  var AC = window.AtlasArenaComun, T = AC.T, textos = AC.textos, el = AC.el, boton = AC.boton, rellena = AC.rellena, quieto = AC.quieto;
  var colores = AC.colores, nombre = AC.nombre, miniLienzo = AC.miniLienzo, nombreLugar = AC.nombreLugar;

  /* --- la escuadra */
  function propias() {
    var inc = window.AtlasIncubadora, l = null;
    try { l = inc && inc.army ? inc.army() : null; } catch (x) { l = null; }
    var L = window.AtlasTallerUI ? window.AtlasTallerUI.lijas() : {};  /* P9: lo lijado, solo en practica */
    /* Una tropa sin lijar NO lleva `lija` (antes iba `lija: undefined`, el canon lo rechaza y la batalla con tropas
       propias no arrancaba: medido en el Doogee, 2026-10-11). El combate ya lee la ausencia como «sin lijar». */
    return (l || []).map(function (u) { var s = u.adopcion.tropa.semilla, t = { tc: u.adopcion.tropa.tc, semilla: s }; if (L[s]) { t.lija = L[s]; } return t; });
  }
  function practica() {
    return [0, 1, 2].map(function (i) { return { tc: 'tc1', semilla: K.sha('atlas.practica/1:' + (pub || 'anon') + ':' + i) }; });
  }
  function disponibles() { var p = propias(); return { tropas: p.length ? p : practica(), practica: !p.length }; }
  function escuadra() {
    var d = disponibles();
    return d.tropas.filter(function (t, i) { return escuadraSel ? escuadraSel[t.semilla] : i < 3; });
  }
  function pintaEscuadra() {
    var d = disponibles(), max = V.combate.tropas_max;
    if (!escuadraSel || !d.tropas.some(function (t) { return escuadraSel[t.semilla]; })) {
      escuadraSel = {}; d.tropas.slice(0, 3).forEach(function (t) { escuadraSel[t.semilla] = true; });
    }
    R.escuadra.textContent = '';
    d.tropas.forEach(function (x) {
      var t = G.tirada(x.semilla, x.tc), b = boton('', 'boton-sec atlas-arena-ficha-tropa');
      b.setAttribute('aria-pressed', String(!!escuadraSel[x.semilla]));
      b.appendChild(miniLienzo(t, 40)); b.appendChild(el('span', null, nombre(t)));
      b.addEventListener('click', function () {
        var n = Object.keys(escuadraSel).filter(function (k) { return escuadraSel[k]; }).length;
        if (!escuadraSel[x.semilla] && n >= max) { R.aviso.textContent = rellena(T('arena_tope'), { n: max }); return; }
        escuadraSel[x.semilla] = !escuadraSel[x.semilla];
        b.setAttribute('aria-pressed', String(escuadraSel[x.semilla]));
        R.aviso.textContent = '';
      });
      R.escuadra.appendChild(b);
    });
    R.practica.hidden = !d.practica;
  }

  /* Locations: map buttons and the selected rival. */
  function todosLugares() { return lugares.concat(jugadores); }
  function cicloJuego() { var j = window.AtlasJuego, s = j && j.instantanea ? j.instantanea() : null; return s && s.ciclo; }
  function pintaLista() {
    R.lista.textContent = '';
    todosLugares().forEach(function (l) {
      var li = el('li'), rc = record[l.clave] || { g: 0, p: 0 };
      var b = boton((rc.g ? '⚑ ' : '') + nombreLugar(l) + (rc.g + rc.p ? ' · ✓' + rc.g + ' ✗' + rc.p : ''), 'boton-sec atlas-arena-lugar');
      b.setAttribute('aria-label', nombreLugar(l) + ' · ' + (l.npc ? rellena(T('arena_tier'), { n: l.tc.slice(2), k: l.n }) :
                     rellena(T('arena_jugador'), { k: l.defensa.tropas.length })));
      b.setAttribute('aria-pressed', String(sel === l));
      b.addEventListener('click', function () { elige(l); });
      li.appendChild(b); R.lista.appendChild(li);
    });
    pintaRival();
  }
  /* Elegir un lugar (en el mapa o en la lista) deja a la vista su ficha con el UNICO «Fight»: si el pliego de
     Lugares estaba cerrado, se abre (medido en el Doogee: el Fight vivia en un pliego cerrado y el dedo no lo veia). */
  function elige(l) {
    sel = l; pintaLista();
    var p = document.getElementById('pliego-lugares');
    if (p && !p.open) { p.open = true; }
    if (R.ficha && R.ficha.scrollIntoView) { R.ficha.scrollIntoView({ block: 'nearest' }); }
  }
  /* Una accion por pantalla: el boton grande. En el mapa lleva a la Batalla y lucha. */
  function pintaRival() {
    [R.ficha, R.rival].forEach(function (z, i) {
      z.textContent = '';
      if (!sel) { return; }
      z.appendChild(el('h5', null, i ? rellena(T('arena_vs'), { n: nombreLugar(sel) }) : nombreLugar(sel)));
      var fila = el('div', 'atlas-arena-fila');
      sel.defensa.tropas.forEach(function (x) { fila.appendChild(miniLienzo(G.tirada(x.semilla, x.tc), 40)); });
      var rc = record[sel.clave];
      if (rc) { fila.appendChild(el('span', 'atlas-nota', rellena(T('arena_record'), { g: rc.g, p: rc.p }) + (rc.g ? ' ' + T('arena_conquistado') : ''))); }
      z.appendChild(fila);
      /* U1: UN solo «Fight» (antes estaba tambien en la ficha del rival): en la ficha del lugar; abre la hoja. */
      if (i) { return; }
      var b = boton('\u2694\uFE0E ' + (sel.npc ? T('arena_luchar') : T('duelo_reta')), 'boton atlas-gran');
      b.id = 'arena-lucha';
      b.addEventListener('click', function () { if (window.TheGame && window.TheGame.ve) { window.TheGame.ve('batalla'); } pelea(); });
      z.appendChild(b);
    });
  }
  function pelea() {
    var sq = escuadra();
    if (!sq.length) { R.aviso.textContent = T('arena_vacia'); return; }
    if (sel.npc) { lucha(sel, sq); } else if (window.AtlasDueloUI) { window.AtlasDueloUI.reta(sel.huella, sq); }
  }

  /* --- el combate */
  function lucha(l, sq) {
    var n = intentos[l.id] = (intentos[l.id] || 0) + 1;
    var semilla = K.sha(['atlas.pve/1', l.id, K.huella(sq), n].join(':'));
    var c = A.combate(l.defensa.tropas, sq, semilla);
    juega(l.defensa.tropas, sq, c, { titulo: nombreLugar(l), yo: 1, semilla: semilla, pve: true,
      alFin: function (x) {
        var rc = record[l.clave] = record[l.clave] || { g: 0, p: 0 };
        if (x.gana === 'asalto') {
          rc.g++;
          if (window.AtlasNpcWalls) { window.AtlasNpcWalls.captura(l.id, cicloJuego()).then(function (r) {
            if (!r.ok) { R.aviso.textContent = r.causa || 'NO_DATA (local occupation was not signed)'; }
          }); }
        } else if (x.gana === 'defensa') { rc.p++; }
        if (CQ) { CQ.pon(record); }
        pintaLista();
      } });
  }
  function sonido(tipo) {
    var S = window.AtlasSintesis;
    if (!S) { return; }
    S.suena({ golpe: 'pop', cae: 'eclosion', gana: 'adopcion', pierde: 'huevo' }[tipo], tipo === 'pierde' ? 0.8 : 0);
  }
  /* Reproduce un combate ya resuelto. `info.yo`: el lado de quien mira (1 asalta, 0 defiende). */
  function juega(def, asa, c, info) {
    if (actual) { actual.para(); }
    if (window.TheGame && window.TheGame.ve) { window.TheGame.ve('batalla'); }  /* U1: toda batalla, en su hoja */
    R.escena.hidden = false; R.res.textContent = ''; R.resNota.textContent = ''; R.tec.hidden = true;
    R.titulo.textContent = info.titulo || ''; R.titulo.hidden = !info.titulo || info.pve;
    var vel = 1;
    R.vel.textContent = rellena(T('arena_x'), { v: 1 });
    /* La repeticion tipo RTS (battle_replay.js) si esta; si no, la escena de siempre. Misma firma. */
    R.vel.hidden = !!window.AtlasReplay;
    actual = (window.AtlasReplay || E).escena(R.lienzo, def, asa, c, { semilla: info.semilla, texto: T,
      quieto: quieto(), colores: colores(), yo: info.yo, fallo: T('arena_fallo'), ronda: T('arena_ronda'), sonido: sonido,
      letrero: function (x) {
        var mia = info.yo ? x.gana === 'asalto' : x.gana === 'defensa', c = colores();
        return x.gana === 'empate' ? { texto: T('arena_empate').toUpperCase(), color: c.texto }
          : { texto: (mia ? T('arena_gana') : T('arena_pierde')).toUpperCase(), color: mia ? c.dano : c.suya };
      },
      alFin: function (x) {
        var mia = info.yo ? x.gana === 'asalto' : x.gana === 'defensa';
        var res = x.gana === 'empate' ? T('arena_empate') : mia ? T('arena_gana') : T('arena_pierde');
        var v = info.yo ? [x.vida_por_mil[1], x.vida_por_mil[0]] : x.vida_por_mil;
        R.res.textContent = rellena(T('arena_final'), { res: res, r: x.rondas, a: Math.round(v[0] / 10), b: Math.round(v[1] / 10) });
        R.resNota.textContent = info.pve ? T('arena_pve_nota') : '';
        R.tec.hidden = false;
        R.semilla.textContent = rellena(T('arena_semilla'), { s: info.semilla.slice(0, 16), h: K.huella(x.registro).slice(0, 16) });
        R.log.textContent = x.registro.slice(0, 120).map(function (e) {
          var suyo = (e[1] === info.yo) ? T('arena_log_tu') : T('arena_log_ellos');
          return 'R' + e[0] + ' · ' + suyo + '#' + (e[2] + 1) + ' → #' + (e[3] + 1) + ' · ' + (e[4] < 0 ? T('arena_fallo') : '-' + e[4]);
        }).join('\n');
        if (info.alFin) { info.alFin(x); }
      }
    });
    R.vel.onclick = function () { vel = vel >= 4 ? 1 : vel * 2; actual.velocidad(vel); R.vel.textContent = rellena(T('arena_x'), { v: vel }); };
    R.salta.onclick = function () { actual.salta(); };
    R.otra.onclick = function () { R.res.textContent = ''; actual.otra(); };
    R.escena.scrollIntoView({ block: 'nearest' });
  }

  /* --- montar: el MAPA en su pestana (`zona`), la BATALLA en la suya */
  function monta(capa, panel, zona) {
    if (!panel || panel.querySelector('.atlas-arena')) { return Promise.resolve(); }
    return textos().then(function () { construye(panel, zona); }, function (e) {
      panel.textContent = ''; panel.appendChild(el('p', 'no-data', 'NO_DATA · ' + e.message));
    });
  }
  function pliego(titulo, z) {
    var d = el('details', 'thegame-pliego');
    d.name = 'atlas-pliego';
    d.appendChild(el('summary', null, titulo)); d.appendChild(z);
    return d;
  }
  function construye(panel, zona) {
    lugares = A.lugares().map(function (l, i) {
      return { npc: true, id: l.id, clave: 'npc:' + l.id, orden: i, tc: l.tc, n: l.n, defensa: l.defensa,
               lider: G.tirada(l.defensa.tropas[0].semilla, l.defensa.tropas[0].tc) };
    });
    sel = lugares[0];
    var m = el('section', 'atlas-mundo');
    R.mapa = el('canvas', 'atlas-arena-mapa');
    R.mapa.setAttribute('role', 'img'); R.mapa.setAttribute('aria-label', T('arena_mapa_aria'));
    m.appendChild(R.mapa);
    m.appendChild(el('p', 'atlas-mundo-leyenda', T('mapa_leyenda')));
    R.ficha = el('div', 'atlas-arena-lugar-ficha'); m.appendChild(R.ficha);
    R.lista = el('ul', 'atlas-arena-lugares'); m.appendChild(R.lista);
    R.rack = el('div');
    var nodosCasa = pliego('Node roster', R.rack); nodosCasa.id = 'pliego-nodos'; nodosCasa.open = true;
    var terminal = document.getElementById('thegame-terminal');
    if (terminal) { terminal.appendChild(nodosCasa); } else { m.appendChild(nodosCasa); }
    if (window.AtlasRackUI) { window.AtlasRackUI.monta(R.rack, T); }
    var s = el('section', 'panel atlas-arena');
    R.rival = el('div', 'atlas-arena-lugar-ficha'); s.appendChild(R.rival);
    R.aviso = el('p', 'atlas-vivo'); R.aviso.setAttribute('role', 'status'); s.appendChild(R.aviso);
    R.escena = el('div', 'atlas-arena-escena'); R.escena.hidden = true;
    R.titulo = el('h5'); R.titulo.hidden = true; R.escena.appendChild(R.titulo);
    R.lienzo = el('canvas', 'atlas-arena-lienzo');
    R.lienzo.setAttribute('role', 'img'); R.lienzo.setAttribute('aria-label', T('arena_escena_aria'));
    R.escena.appendChild(R.lienzo);
    var mm = el('div', 'atlas-arena-mandos');
    R.vel = boton('', 'boton-sec'); R.salta = boton(T('arena_saltar'), 'boton-sec'); R.otra = boton(T('arena_otra'), 'boton-sec');
    [R.vel, R.salta, R.otra].forEach(function (b) { mm.appendChild(b); });
    R.escena.appendChild(mm);
    R.res = el('p', 'atlas-arena-res'); R.res.setAttribute('role', 'status'); R.escena.appendChild(R.res);
    R.tec = el('details', 'thegame-tecnico'); R.tec.hidden = true;
    R.tec.appendChild(el('summary', null, T('tecnico')));
    R.resNota = el('p', 'atlas-nota'); R.tec.appendChild(R.resNota);
    R.semilla = el('p', 'atlas-medido'); R.tec.appendChild(R.semilla);
    R.log = el('pre', 'atlas-arena-log'); R.tec.appendChild(R.log);
    R.escena.appendChild(R.tec);
    s.appendChild(R.escena);
    var eq = el('div');
    eq.appendChild(el('p', 'atlas-nota', rellena(T('arena_escuadra_nota'), { n: V.combate.tropas_max })));
    R.practica = el('p', 'atlas-casa', T('arena_practica')); eq.appendChild(R.practica);
    R.escuadra = el('div', 'atlas-arena-escuadra'); eq.appendChild(R.escuadra);
    s.appendChild(pliego(T('arena_escuadra_h'), eq));
    R.duelo = el('div', 'atlas-arena-duelo'); s.appendChild(pliego(T('duelo_h'), R.duelo));
    R.nodos = el('div'); s.appendChild(pliego(T('nodos_h'), R.nodos));
    if (window.AtlasNodosUI) { window.AtlasNodosUI.monta(R.nodos, T); }
    window.AtlasNodeFileReceiver.mount(R.nodos);
    panel.textContent = ''; panel.appendChild(s);
    if (zona) { zona.appendChild(m); } else { s.insertBefore(m, s.firstChild); }
    var I = window.Identity;
    var listo = I && I.quien && I.quien() ? I.publica().then(function (k) { pub = k; }, function () { pub = null; }) : Promise.resolve();
    listo.then(function () {
      if (pub) { emblema = G.tirada(K.sha('atlas.emblema/1:' + pub), 'tc3'); }
      pintaEscuadra(); pintaLista();
      if (!CQ && window.AtlasArmy) { CQ = window.AtlasArmy.conquistasWeb(record, lugares, pintaLista); }
      if (window.AtlasNpcWalls) { window.AtlasNpcWalls.inicia(lugares, function () { return pub; }); }
      if (window.AtlasDueloUI) { window.AtlasDueloUI.monta(R.duelo, { pub: pub }); }
    });
    if (mar) { mar.para(); }
    mar = window.AtlasMar.crea(R.mapa, { lugares: todosLugares, sel: function () { return sel; }, emblema: function () { return emblema; },
                                         pub: function () { return pub; }, nombre: nombreLugar, texto: T, colores: colores, elige: elige,
                                         luchados: function () { return record; },
                                         ocupacion: function (id) { return window.AtlasNpcWalls.estado(id, cicloJuego(), pub); },
                                         mural: function (id) { return window.AtlasNpcWalls.mural(id, cicloJuego(), pub); } });
  }

  document.addEventListener('preceptor:identity', function () {
    var I = window.Identity;
    if (I && I.quien && I.quien()) { I.publica().then(function (k) { pub = k; emblema = G.tirada(K.sha('atlas.emblema/1:' + k), 'tc3'); }); }
  });
  /* Las personas del mar: las pone `ui-duelo.js` al importar defensas verificadas. */
  function ponJugadores(lista) {
    jugadores = lista.map(function (d) {
      var t = d.sobre.cuerpo.tropas[0];
      return { npc: false, id: d.huella, clave: 'p:' + d.huella, huella: d.huella, de: d.sobre.de, pseudo: d.sobre.pseudonimo,
               defensa: d.sobre.cuerpo, lider: G.tirada(t.semilla, t.tc) };
    });
    pintaLista();
  }
  /* Al volver a la pestana: el Army pudo crecer (nuevas adopciones). */
  function refresca() { if (R.escuadra) { pintaEscuadra(); } }

  /* El record de este aparato, sumado: lo lee la casa (`home_buildings.js`). */
  function recordTotal() { var t = { g: 0, p: 0 }; Object.keys(record).forEach(function (k) { t.g += record[k].g; t.p += record[k].p; }); return t; }
  window.AtlasArenaUI = { record: recordTotal, monta: monta, juega: juega, escuadra: escuadra, ponJugadores: ponJugadores, refresca: refresca, texto: T };
})();
