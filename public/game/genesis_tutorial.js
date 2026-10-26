
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

  // [1c] (2026-10-26): the nine places of /play/, each a live link since the dead-links cure (web PR 344).
  // A place counts as visited when the player opens it: a house part by its button, a reef place by its card.
  var vistos = {};
  function visto(k) { return vistos[k] ? 1 : 0; }
  function sinCasa() { var I = raiz.Identity; return I && I.quien && I.quien() ? '' : 'Your reef appears around your house once you have a key: open Home and create it.'; }
  function lugar(id, k, titulo, haz, coord, casa) {
    return { id: id, accion: 'visit', lugar: k, titulo: titulo, haz: haz, porque: 'Every place opens something real, and its card says NO_DATA where nothing is measured.',
      canon: 'Card [1c] · the nine live places (dead-links cure, web PR 344)', sonido: 'NO_DATA (silent by design)', coord: coord,
      mide: function () { return visto(k); }, hecho: function (b, v) { return v === 1; }, fallo: casa ? sinCasa : null };
  }
  var LUGARES = [
    lugar('shell', 'parte:caparazon', 'Your house · Shell', 'In your house, tap Shell · Core: the Waves sheet opens, where the workshop lives.', 'house · side list'),
    lugar('claws', 'parte:pinzas', 'Your house · Claws', 'Tap Claws · Army: your Army, in the same Waves sheet.', 'house · side list'),
    lugar('legs', 'parte:patas', 'Your house · Legs', 'Tap Legs · Forest: the forest opens inside your house.', 'house · side list'),
    lugar('eyes', 'parte:ojos', 'Your house · Eyes', 'Tap Eyes · Lighthouse: your crab heads for the lighthouse.', 'house · side list'),
    lugar('buoy', 'boya', 'Reef · State buoy', 'On the map, tap the state buoy next to your house, then Open state radio.', 'map · next to your house', true),
    lugar('observatory', 'observatorio', 'Reef · Observatory', 'Tap the observatory, then Look: a look costs 8 cycles and then fades back into fog.', 'map · next to your house', true),
    lugar('tombstones', 'lapidas', 'Reef · Tombstones', 'Tap the reef of tombstones: Read tombstone receipts lists what dissolved, with its receipt.', 'map · next to your house', true),
    lugar('crystal', 'cristal', 'Reef · Latency crystal', 'Tap the latency crystal: Read frame measurements shows the frames measured on this device.', 'map · next to your house', true),
    lugar('coral', 'coral', 'Reef · Coral', 'Tap a coral: Open lab evidence leads to the published lab result.', 'map · the corals')];
  function anota(e) {
    var t = e && e.target, b = t && t.closest ? t.closest('.casa-lateral-parte') : null;
    if (b && b.dataset.parte) { vistos['parte:' + b.dataset.parte] = 1; }
    var f = raiz.document && raiz.document.getElementById && raiz.document.getElementById('pliego-ficha');
    if (f && !f.hidden && f.dataset.place) { vistos[f.dataset.place] = 1; }
  }


  var PASOS = [
    { id: 'reach', accion: 'reach', titulo: 'You touched something within reach',
      haz: 'Tap any piece next to your crab: its sheet opens (what it is, state, coordinate, sound).',
      porque: 'Reach is a real action of your crab: touching what it can reach. Every sheet says NO_DATA where data is missing.',
      canon: 'FIRMO 2026-10-12 · B3 (interaction opens the tutorial) · lote 0d (the honest inspector)',
      sonido: 'NO_DATA (silent by design)', coord: 'any piece within 160 world units of your crab',
      mide: function () { return skill('reach'); }, hecho: function (b, v) { return v >= 1; } },
    { id: 'swim', accion: 'swim', titulo: 'Swim',
      haz: 'Tap empty sea or use the directional buttons. Your crab swims there.',
      porque: 'Free movement sits on top of the automatic walk. Fog is unmeasured: the crab will not swim into it.',
      canon: 'FIRMO 2026-10-12 · B (free movement over the J1 walk)', sonido: 'NO_DATA (silent by design)', coord: 'empty sea, outside the fog',
      mide: function () { return skill('swim'); }, hecho: function (b, v) { return v > b; } },
  ].concat(LUGARES, [
    { id: 'fight', accion: 'fight', titulo: 'Fight a place',
      haz: 'Open the menu ⌖ (Places), choose up to {n} waves for one squad, then press Fight.',
      porque: 'The fight replays from the law, the seed and the actions: nobody picks the result. After it, the place shows its colour from your record.',
      canon: 'Determinism (CLAUDE.md of the web) · ∇C option A, FIRMO 2026-10-12', sonido: 'FM voices of both armies (the battle)', coord: 'menu ⌖ · Places',
      mide: combates, hecho: function (b, v) { return v !== null && v > (b || 0); },
      fallo: function () { return combates() === null ? 'The arena has not loaded yet: open the map once (it loads with it), then come back.' : ''; } },
    { id: 'summon', accion: 'invocar', titulo: 'Summon a wave', irreversible: true,
      haz: 'Open the menu ⚒ (Workshop) and summon with copper.',
      porque: 'Summoning spends copper and cannot be undone. The odds are on the button before you press it. Current measured pace: about one copper per 1.26 game cycles.',
      canon: 'HITL: the silicon proposes, the carbon signs · teaching_kernel: dry_run_obligatorio',
      sonido: 'the egg hatches with its own voice', coord: 'menu ⚒ · Workshop',
      ensayo: function () {
        var c = cobre(), k = costeTc1();
        if (c === null || k === null) { return 'Dry run: NO_DATA (copper or cost not measured yet: open the Workshop once).'; }
        return 'Dry run: the cheapest summon costs ' + k + ' copper. You have ' + c + (c >= k ? '. After it: ' + (c - k) + '.' : ': not enough yet.');
      },
      mide: army, hecho: function (b, v) { return v !== null && v > (b || 0); },
      fallo: function () {
        var c = cobre(), k = costeTc1();

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
      hecho: function (b, v) { return v === 1; } }]);

  var i = 0, base = null, hechos = [], saltado = false, panel = null, cuerpo = null, meta = null, ultimo = '';


  function ancla() {
    var D = raiz.document, mapa = D && D.querySelector('.thegame-mapa');
    if (!mapa || (meta && meta.isConnected)) { return; }
    var T = raiz.AtlasJuego && raiz.AtlasJuego.texto ? raiz.AtlasJuego.texto : function () { return ''; };
    meta = D.createElement('p'); meta.className = 'tutorial-meta'; meta.id = 'tutorial-meta'; meta.dataset.lema = T('lema') || 'NO_DATA (motto not loaded)';
    mapa.appendChild(meta); rotulaMeta();
  }

  function rotulaMeta() {
    if (!meta) { return; }
    var p = paso(), t = 'Goal · ' + meta.dataset.lema + (p ? ' · Now: ' + hazPaso(p) : '');
    if (meta.dataset.t === t) { return; }
    meta.dataset.t = t; meta.textContent = '';

    var a = raiz.document.createElement('span'), b = raiz.document.createElement('span');
    a.className = 'meta-objetivo'; a.textContent = 'Goal · ' + meta.dataset.lema; meta.appendChild(a);
    if (p) { b.className = 'meta-ahora'; b.textContent = 'Now: ' + hazPaso(p); meta.appendChild(b); }

    var av = raiz.document.querySelector('.mapa-aviso');
    if (av) { meta.appendChild(av); }
  }
  function competencia() { return hechos.length; }

  function verbosidad() { var c = competencia(); return c <= 1 ? 2 : (c <= 3 ? 1 : 0); }
  function paso() { return saltado || i >= PASOS.length ? null : PASOS[i]; }

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

      var vu = D.createElement('button'); vu.type = 'button'; vu.className = 'boton'; vu.id = 'tutorial-al-mapa'; vu.textContent = '← Map';
      vu.dataset.sonido = 'NO_DATA (silent by design)';
      vu.addEventListener('click', function () { var M = raiz.AtlasChatTerminal; if (M && M.cierra) { M.cierra(); } });
      panel.appendChild(vu); panel.appendChild(sk); caja.appendChild(panel); ultimo = '';
    }
    var l = lineas(), txt = JSON.stringify(l);
    if (txt === ultimo) { return; }
    ultimo = txt; cuerpo.textContent = '';
    l.forEach(function (x) { var dt = D.createElement('dt'), dd = D.createElement('dd'); dt.textContent = x[0]; dd.textContent = x[1]; cuerpo.appendChild(dt); cuerpo.appendChild(dd); });
    var p = paso(); panel.dataset.paso = p ? p.id : (saltado ? 'saltado' : 'hecho');
  }

  function tic() {
    ancla(); anota(null);
    var p = paso();
    if (p) {
      var v = p.mide();
      if (base === null) { base = v; }
      if (p.hecho(base, v)) {
        hechos.push({ paso: p.id, ciclo: (J() || {}).ciclo === undefined ? null : J().ciclo });
        var R = raiz.AtlasRadioChat; if (R && R.dice) { R.dice({ quien: 'Tutorial', fuente: 'tutorial', texto: 'done · ' + p.titulo, sello: 'LIVE' }); }
        i++; base = null;
      }
    }
    rotulaMeta();
    if (panel) { pinta(); }
  }

  function abre(motivo) {
    saltado = false; pinta();
    var M = raiz.AtlasChatTerminal; if (M && M.panel) { M.panel('pliego-tutorial'); }
    return motivo || 'menu';
  }
  function esquema() { return PASOS.map(function (p) { return { id: p.id, accion: p.accion, irreversible: !!p.irreversible, canon: p.canon, sonido: p.sonido, coord: p.coord }; }); }
  function ficha() { return { paso: paso() ? paso().id : null, competencia: competencia(), verbosidad: verbosidad(), lineas: lineas() }; }

  if (raiz.setInterval) { raiz.setInterval(tic, 1000); }
  if (raiz.document && raiz.document.addEventListener) { raiz.document.addEventListener('click', function (e) { anota(e); raiz.setTimeout(function () { anota(null); }, 450); }, true); }
  var AtlasTutorial = { LUGARES: LUGARES, visto: visto, anota: anota, abre: abre, tic: tic, esquema: esquema, ficha: ficha, PASOS: PASOS, nd: nd, hazPaso: hazPaso };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasTutorial; } else { raiz.AtlasTutorial = AtlasTutorial; }
})(this);
