/* preceptoros.org · theGame · EL TUTORIAL ES EL CONTRATO DE GENESIS (E, FIRMO 2026-10-12).

   Rosetta unificada: no hay tutorial aparte del codigo. PASOS (abajo) ES el esquema de acciones del juego que la
   persona puede tomar HOY, renderizado: cada paso nombra su accion, la CONDICION que la da por hecha (medida en los
   eventos reales del juego, nunca un boton «siguiente»), el canon que la habilita o la limita, su sonido y su coordenada.
   La maquina lee `esquema()`; el humano ve el panel. Una accion por pantalla (patron A Dark Room). Todo en ingles.

   Bajo el TEACHING KERNEL del rack (~/p0x/config/teaching_kernel.yaml, canon 2026-07-19):
   1. dry_run_obligatorio: el paso de una accion IRREVERSIBLE ensena antes que pasara, con las cifras medidas.
   2. fallo_como_ramificacion: si la accion no puede salir, el paso dice POR QUE (con cifras) y que hacer: nunca «failed».
   3. ancla_objetivo_macro: el objetivo (el lema del juego) queda SIEMPRE a la vista, toda la sesion.
   4. scaffolding_fading: la ayuda DECAE con la competencia DEMOSTRADA (pasos hechos de verdad), no declarada.
   Se abre solo con la primera accion de alcance (B3, skill REACH); siempre esta en el menu; siempre se puede saltar.
   Sin red, sin azar, sin reloj de pared; no persiste nada (el avance vive en esta pestana). */
(function (raiz) {
  'use strict';
  function J() { var j = raiz.AtlasJuego; return j && j.instantanea ? j.instantanea() : null; }
  function hazPaso(p) {
    var V = raiz.AtlasValores, n = V && V.combate && Number.isSafeInteger(V.combate.tropas_max) ? V.combate.tropas_max : null;
    return p ? String(p.haz).replace('{n}', n === null ? 'NO_DATA (team limit not measured)' : n) : '';
  }
  function skill(id) { var L = raiz.AtlasCangrejoLibre, k = L ? L.skills().filter(function (s) { return s.id === id; })[0] : null; return k ? k.eventos : 0; }
  function army() { var I = raiz.AtlasIncubadora, l = null; try { l = I && I.army ? I.army() : null; } catch (e) { l = null; } return Array.isArray(l) ? l.length : null; }
  function combates() { var A = raiz.AtlasArenaUI, r = A && A.record ? A.record() : null; return r ? r.g + r.p : null; }
  function cobre() { var i = J(); return i && i.recursos && typeof i.recursos.cobre === 'number' ? i.recursos.cobre : null; }
  function costeTc1() { var V = raiz.AtlasValores; return V && V.tcs && V.tcs.tc1 ? V.tcs.tc1.coste.cobre : null; }
  function lapidasDeTropa() { var A = raiz.AtlasArrecife; return A && A.lapidas ? A.lapidas().filter(function (r) { return /^troop-/.test(r.id); }).length : 0; }
  function nd(v, c) { return v === null || v === undefined ? 'NO_DATA (' + c + ')' : String(v); }

  /* EL ESQUEMA. `hecho(base)` compara con lo medido al abrir el paso (base): solo cuenta lo que pasa DESPUES. */
  var PASOS = [
    { id: 'reach', accion: 'reach', titulo: 'You touched something within reach',
      haz: 'Tap any piece next to your crab: its sheet opens (what it is, state, coordinate, sound).',
      porque: 'Reach is a real action of your crab: touching what it can reach. Every sheet says NO_DATA where data is missing.',
      canon: 'FIRMO 2026-10-12 · B3 (interaction opens the tutorial) · lote 0d (the honest inspector)',
      sonido: 'NO_DATA (silent by design)', coord: 'any piece within 160 world units of your crab',
      mide: function () { return skill('reach'); }, hecho: function (b, v) { return v >= 1; } },
    { id: 'swim', accion: 'swim', titulo: 'Swim',
      haz: 'Tap empty sea. Your crab swims there (W A S D work too).',
      porque: 'Free movement sits on top of the automatic walk. Fog is unmeasured: the crab will not swim into it.',
      canon: 'FIRMO 2026-10-12 · B (free movement over the J1 walk)', sonido: 'NO_DATA (silent by design)', coord: 'empty sea, outside the fog',
      mide: function () { return skill('swim'); }, hecho: function (b, v) { return v > b; } },
    { id: 'fight', accion: 'fight', titulo: 'Fight a place',
      haz: 'Open the menu ⌖ (Places), choose up to {n} waves for one squad, then press Fight.',
      porque: 'The fight replays from the law, the seed and the actions: nobody picks the result. After it, the place shows its colour from your record.',
      canon: 'Determinism (CLAUDE.md of the web) · ∇C option A, FIRMO 2026-10-12', sonido: 'FM voices of both armies (the battle)', coord: 'menu ⌖ · Places',
      mide: combates, hecho: function (b, v) { return v !== null && v > (b || 0); },
      fallo: function () { return combates() === null ? 'The arena has not loaded yet: open the map once (it loads with it), then come back.' : ''; } },
    { id: 'summon', accion: 'invocar', titulo: 'Summon a wave', irreversible: true,
      haz: 'Open the menu ⚒ (Workshop) and summon with copper.',
      porque: 'Summoning spends copper and cannot be undone. The odds are on the button before you press it. Current measured pace: about one copper per 1.26 game cycles.',
      canon: 'IronClaw: the silicon proposes, the carbon signs · teaching_kernel: dry_run_obligatorio',
      sonido: 'the egg hatches with its own voice', coord: 'menu ⚒ · Workshop',
      ensayo: function () {
        var c = cobre(), k = costeTc1();
        if (c === null || k === null) { return 'Dry run: NO_DATA (copper or cost not measured yet: open the Workshop once).'; }
        return 'Dry run: the cheapest summon costs ' + k + ' copper. You have ' + c + (c >= k ? '. After it: ' + (c - k) + '.' : ': not enough yet.');
      },
      mide: army, hecho: function (b, v) { return v !== null && v > (b || 0); },
      fallo: function () {
        var c = cobre(), k = costeTc1();
        /* Q4 medido: la produccion duplicada da +16 cobre en 20 ciclos en una partida nueva. */
        if (c !== null && k !== null && c < k) { return 'Not enough copper yet (' + c + ' of ' + k + '). Next: keep playing: biomass turns into copper as cycles pass. This step waits for you.'; }
        return '';
      } },
    { id: 'dissolve', accion: 'desintegra', titulo: 'Dissolve a wave', irreversible: true,
      haz: 'In the Workshop, press Dissolve on a wave you no longer want.',
      porque: 'Dissolving is final: the wave leaves your Army and its tombstone stays in the Reef, with its signed receipt.',
      canon: 'BIBLIA_THEGAME:57,60 (the tombstone with its receipt) · teaching_kernel: dry_run_obligatorio',
      sonido: 'NO_DATA (silent by design)', coord: 'menu ⚒ · Workshop · each wave',
      ensayo: function () { return 'Dry run: the Dissolve button already shows the exact grams you will get (+N g) before you press it.'; },
      mide: lapidasDeTropa, hecho: function (b, v) { return v > b; },
      fallo: function () { var a = army(); return a === 0 ? 'Your Army is empty: summon a wave first (previous step).' : ''; } },
    { id: 'radio', accion: 'radio', titulo: 'Read the Radio',
      haz: 'Tap the line at the bottom: the Radio opens. Tap it again to fold it.',
      porque: 'Every bubble says who, its seal (LIVE, STALE, SIMULATED, NO_DATA), its source and its age in cycles. The state is the signal.',
      canon: 'Honest sensors (CLAUDE.md of the web) · the Radio is instrumental', sonido: 'NO_DATA (silent by design)', coord: 'bottom line of the screen',
      mide: function () { var r = raiz.document && raiz.document.getElementById('radio-chat'); return r && !r.classList.contains('plegado') ? 1 : 0; },
      hecho: function (b, v) { return v === 1; } }
  ];

  var i = 0, base = null, hechos = [], saltado = false, panel = null, cuerpo = null, meta = null, ultimo = '';

  /* El objetivo macro: una linea fija, toda la sesion (ancla_objetivo_macro). El lema del juego, sin texto nuevo. */
  function ancla() {
    var D = raiz.document, mapa = D && D.querySelector('.thegame-mapa');
    if (!mapa || (meta && meta.isConnected)) { return; }
    var T = raiz.AtlasJuego && raiz.AtlasJuego.texto ? raiz.AtlasJuego.texto : function () { return ''; };
    meta = D.createElement('p'); meta.className = 'tutorial-meta'; meta.id = 'tutorial-meta'; meta.dataset.lema = T('lema') || 'NO_DATA (motto not loaded)';
    mapa.appendChild(meta); rotulaMeta();
  }
  /* La linea del objetivo lleva tambien la ACCION del paso en curso: se lee con el panel cerrado, sobre el mapa. */
  function rotulaMeta() {
    if (!meta) { return; }
    var p = paso(), t = 'Goal · ' + meta.dataset.lema + (p ? ' · Now: ' + hazPaso(p) : '');
    if (meta.dataset.t === t) { return; }
    meta.dataset.t = t; meta.textContent = '';
    /* Dos lineas: el objetivo (una linea) y la accion en curso. Medido en 360 px: en una sola tira ocupaba 4 lineas. */
    var a = raiz.document.createElement('span'), b = raiz.document.createElement('span');
    a.className = 'meta-objetivo'; a.textContent = 'Goal · ' + meta.dataset.lema; meta.appendChild(a);
    if (p) { b.className = 'meta-ahora'; b.textContent = 'Now: ' + hazPaso(p); meta.appendChild(b); }
    /* El aviso del mapa (role=status) va DEBAJO, en el mismo bloque: medido, sueltos se pisaban. mar.js conserva su nodo. */
    var av = raiz.document.querySelector('.mapa-aviso');
    if (av) { meta.appendChild(av); }
  }
  function competencia() { return hechos.length; }
  /* Fading: 0-1 pasos demostrados, todo; 2-3, sin el porque; 4 o mas, solo la accion. */
  function verbosidad() { var c = competencia(); return c <= 1 ? 2 : (c <= 3 ? 1 : 0); }
  function paso() { return saltado || i >= PASOS.length ? null : PASOS[i]; }
  /* Lo que el paso ensena, en lineas (la ficha legible: el lab lee lo mismo que la persona). */
  function lineas() {
    var p = paso();
    if (!p) { return [['Tutorial', saltado ? 'skipped · open it again from the menu' : 'done: ' + competencia() + ' actions demonstrated. The help steps back.']]; }
    var v = verbosidad(), l = [['Step ' + (i + 1) + ' of ' + PASOS.length, p.titulo], ['Do', hazPaso(p)]];
    if (v >= 2) { l.push(['Why', p.porque]); }
    if (p.ensayo) { l.push(['Before you do it', p.ensayo()]); }
    var f = p.fallo ? p.fallo() : '';
    if (f) { l.push(['Not yet, and why', f]); }
    if (v >= 1) { l.push(['Canon', p.canon]); }
    l.push(['Sound', p.sonido], ['Where', p.coord]);
    return l;
  }
  function pinta() {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja) { return; }
    if (!panel || !panel.isConnected) {
      panel = D.createElement('details'); panel.className = 'thegame-pliego'; panel.id = 'pliego-tutorial'; panel.open = true;
      var s = D.createElement('summary'); s.textContent = 'Tutorial'; panel.appendChild(s);
      cuerpo = D.createElement('dl'); panel.appendChild(cuerpo);
      var sk = D.createElement('button'); sk.type = 'button'; sk.className = 'boton-sec'; sk.id = 'tutorial-salta'; sk.textContent = 'Skip tutorial';
      sk.dataset.sonido = 'NO_DATA (silent by design)';
      sk.addEventListener('click', function () { saltado = true; ultimo = ''; pinta(); rotulaMeta(); });
      /* «← Map»: cierra el cajon para hacer la accion (el paso sigue escrito en la linea del objetivo). */
      var vu = D.createElement('button'); vu.type = 'button'; vu.className = 'boton'; vu.id = 'tutorial-al-mapa'; vu.textContent = '← Map';
      vu.dataset.sonido = 'NO_DATA (silent by design)';
      vu.addEventListener('click', function () { var b = D.getElementById('menu-pliego-tutorial'); if (b && !panel.hidden) { b.click(); } });
      panel.appendChild(vu); panel.appendChild(sk); caja.appendChild(panel); ultimo = '';
    }
    var l = lineas(), txt = JSON.stringify(l);
    if (txt === ultimo) { return; }
    ultimo = txt; cuerpo.textContent = '';
    l.forEach(function (x) { var dt = D.createElement('dt'), dd = D.createElement('dd'); dt.textContent = x[0]; dd.textContent = x[1]; cuerpo.appendChild(dt); cuerpo.appendChild(dd); });
    var p = paso(); panel.dataset.paso = p ? p.id : (saltado ? 'saltado' : 'hecho');
  }
  /* Cada tic: ¿se demostro el paso? (medido); si si, al siguiente, con su propia linea base. */
  function tic() {
    ancla();
    var p = paso();
    if (p) {
      var v = p.mide();
      if (base === null) { base = v; }
      if (p.hecho(base, v)) {
        var instantanea = J(), ciclo = instantanea && instantanea.ciclo;
        hechos.push({ paso: p.id, ciclo: Number.isSafeInteger(ciclo) && ciclo >= 0 && ciclo <= 1e9 ? ciclo : null });
        var R = raiz.AtlasRadioChat; if (R && R.dice) { R.dice({ quien: 'Tutorial', fuente: 'tutorial', texto: 'done · ' + p.titulo, sello: 'LIVE' }); }
        i++; base = null;
      }
    }
    rotulaMeta();
    if (panel) { pinta(); }
  }
  /* Abrir: desde la primera accion de alcance (B3) o desde el menu. Abre el panel en el cajon. */
  function abre(motivo) {
    saltado = false; pinta();
    raiz.Promise.resolve().then(function () { var b = raiz.document.getElementById('menu-pliego-tutorial'); if (b && panel.hidden) { b.click(); } });
    return motivo || 'menu';
  }
  function esquema() { return PASOS.map(function (p) { return { id: p.id, accion: p.accion, irreversible: !!p.irreversible, canon: p.canon, sonido: p.sonido, coord: p.coord }; }); }
  function ficha() { return { paso: paso() ? paso().id : null, competencia: competencia(), verbosidad: verbosidad(), lineas: lineas() }; }

  if (raiz.setInterval) { raiz.setInterval(tic, 1000); }
  var AtlasTutorial = { abre: abre, tic: tic, esquema: esquema, ficha: ficha, PASOS: PASOS, nd: nd, hazPaso: hazPaso };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasTutorial; } else { raiz.AtlasTutorial = AtlasTutorial; }
})(this);
