// OpenWorld: one same-origin map and state; the state file is its only server input.
// Unlisted nodes do not exist; with none alive the floor is drawn and NO_DATA is said. Fixed ticks drive the palette, never wall-clock time.
// Reduced motion keeps the sky still.
(function (raiz) {
  'use strict';
  var doc = raiz.document, M = raiz.AtlasMapaGlobal;
  var entrada = { t: 0, nodes: [] };
  var selected = '';
  var surface = doc.getElementById('surface');
  var press = doc.querySelector('#terrain-actions');
  var state = doc.getElementById('state');
  var quieto = raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CP = raiz.AtlasColoniaPagina, colonia_ocultos = 0, colonia = null, colonia_fuente = 'NO_DATA', colonia_error = '';
  var live = 'pending', live_fuente = 'NO_DATA'; // the heartbeat: pending, ok, or its cause
  // Synthetic fixture, opt-in with ?fixture=sintetica: it is labelled SYNTHETIC on the page, never a live colony.
  var FIXTURE = { nodes: [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }, { id: 'ring-ne', q: 1, r: -1 }, { id: 'ring-nw', q: 0, r: -1 }, { id: 'ring-w', q: -1, r: 0 }, { id: 'ring-sw', q: -1, r: 1 }, { id: 'ring-se', q: 0, r: 1 }, { id: 'doggee-a', q: 2, r: 0 }, { id: 'doggee-b', q: 2, r: -1 }], buildings: [{ id: 'b-cabin', node: 'cabin' }, { id: 'b-ring-e', node: 'ring-e' }, { id: 'b-ring-nw', node: 'ring-nw' }, { id: 'b-ring-sw', node: 'ring-sw' }, { id: 'b-doggee-a', node: 'doggee-a' }, { id: 'b-doggee-b', node: 'doggee-b' }], units: [] };
  // IC7-S4 (D11): the looks of the fixture's nodes; Doggee is the flat look. The live state carries its own looks.
  var FIXTURE_LOOKS = { 'doggee-a': 'flat', 'doggee-b': 'flat' }, colony_looks = {}, colony_seals = {}, colony_pending = {}, colony_mana = {};
  var frases_el = doc.getElementById('frases');
  // TA-4 (D13-D16): the terminal, the anchor and the joystick live in colony_controls.js; the page passes its state in.
  var CC = raiz.AtlasColonyControls;
  var CCT = CC ? CC.attach({ doc: doc, win: raiz, colony: function () { return colonia; }, looks: function () { return colony_looks; }, seals: function () { return colony_seals; }, redraw: function () { draw(); renderFrases(); }, stepped: function () { var vb = doc.getElementById('visitor-play'); if (vb) { vb.dispatchEvent(new CustomEvent('visitor:advance')); } }, walk: function () { walkLoop(); }, entered: function (node) { var W = raiz.AtlasInvocacionViva; if (W) { W.tunnel(function () { enterBuilding(node); }); } else { enterBuilding(node); } } }) : null;
  // P5a: the view hitl_walkers.js reads on every visitor:draw (the «?» and the walkers).
  raiz.AtlasOpenworldView = function () { return { colony: colonia_error ? null : colonia, t: entrada.t, reduced: quieto, looks: colony_looks, seals: colony_seals, mana: colony_mana, pending: colony_pending, controls: CCT, state: state, redraw: function () { draw(); } }; };
  // Zoom and orbit use the canvas state; the map picture alone changes (law P5).
  var viewSeen = '', ZOOM = raiz.AtlasMapZoom && surface ? raiz.AtlasMapZoom.create(surface, { changed: function () { onZoom(); } }) : null;
  function onZoom() {
    var d = surface.dataset, v = d.zoom + '|' + d.angle + '|' + d.panx + '|' + d.pany;
    if (v !== viewSeen) { viewSeen = v; draw(); }
  }
  if (ZOOM) { surface.style.touchAction = 'none'; }
  // A11Y: zoom and turn without floating buttons. The two map joysticks (map_view_joystick.js) and the keys + - 0 Q E drive them; the view is spoken by aria-live.
  if (ZOOM) {
    var zoomSay = doc.createElement('p');
    zoomSay.id = 'zoom-state'; zoomSay.setAttribute('aria-live', 'polite');
    var speak = function () { zoomSay.textContent = ZOOM.say(); };
    var zoomTo = function (d) { ZOOM.step(d); speak(); };
    var turnTo = function (d) { var to = ZOOM.turn(d); zoomSay.textContent = 'Map view ' + to + '\u00B0 \u00B7 zoom ' + surface.dataset.zoom + '\u00D7'; };
    var resetView = function () { ZOOM.reset(); if (raiz.AtlasMapPan) { raiz.AtlasMapPan.home(); } speak(); };
    raiz.AtlasMapView = { zoom: zoomTo, turn: turnTo, reset: resetView };
    // Speak zoom in the panel, not over the map.
    speak();
    (doc.getElementById('voice-zoom') || doc.body).appendChild(zoomSay);
    // A free turn or a pinch is spoken once the fingers lift, never on every frame.
    surface.addEventListener('pointerup', function () { if (zoomSay.textContent !== ZOOM.say()) { speak(); } });
    doc.addEventListener('keydown', function (e) {
      var t = e.target, field = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (field || e.ctrlKey || e.metaKey || e.altKey) { return; }
      var d = { '+': 1, '=': 1, '-': -1, '0': 0 }[e.key], r = { q: -1, Q: -1, e: 1, E: 1 }[e.key];
      if (d !== undefined) { e.preventDefault(); zoomTo(d); } else if (r !== undefined) { e.preventDefault(); turnTo(r); }
    });
  }

  // The visible rows of the state: each node the state lists as alive. A node without its key is refused.
  function filas() {
    try { return M.estado(entrada); } catch (e) { return M.estado({ t: entrada.t, nodes: [] }); }
  }

  function draw() {
    var B = raiz.AtlasAcho, P = raiz.AtlasComicAtoms;
    if (!surface || !B || !P || !raiz.AtlasAchoLetters) { return; }
    var position = CCT && CCT.walker(), location = doc.getElementById('map-h');
    if (location) { raiz.AtlasPlaceName.mark(location, position); }
    var width = surface.clientWidth || 320, height = surface.clientHeight || 200;
    var dpr = Math.min(2, raiz.devicePixelRatio || 1);
    surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr);
    if (colonia && CP) {
      try { CP.draw(surface, colonia, entrada.t, quieto, colony_looks, colony_seals, CCT ? CCT.walker() : null, colony_mana, true); visitorLayer(); return; }
      catch (e) { colonia_error = e.message || 'the colony is refused'; }
    }
    var g = surface.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var fit = Math.min(width / 480, height / 240);
    var scene = M.mapa(entrada);
    g.fillStyle = scene.paleta.cielo; g.fillRect(0, 0, width, height);
    var cx = width / 2, cy = height / 2 + 14 * fit;
    if (CP && raiz.AtlasMapPainter) { g.setTransform(1, 0, 0, 1, 0, 0); raiz.AtlasMapPainter.draw(g, CP.geometry({ tiles: [] }, surface), entrada.t, quieto === true); }
    visitorLayer();
  }
  function visitorLayer() {
    surface.dispatchEvent(new CustomEvent('visitor:draw'));
  }
  doc.getElementById('visitor-play').addEventListener('visitor:changed', draw);

  function buttons() {
    press.innerHTML = '';
    filas().forEach(function (row) {
      var b = doc.createElement('button');
      b.type = 'button'; b.textContent = row.nombre;
      b.setAttribute('aria-pressed', String(row.id === selected));
      b.addEventListener('click', function () { selected = row.id; buttons(); draw(); });
      press.appendChild(b);
    });
  }

  function render() {
    buttons();
    draw();
    // «Nodes online» counts the LIVE seals of the heartbeat, without it NO_DATA, never a 0.
    var nombres = Object.keys(colony_seals).filter(function (id) { return colony_seals[id] === 'LIVE'; });
    var cabeza = live === 'ok' ? 'Nodes online: ' + nombres.length + nombres.map(function (id) { return ' · ' + id + ' LIVE'; }).join('') + '.'
      : live === 'pending' ? 'Nodes online: checking…' : 'Nodes online: NO_DATA.';
    var linea = cabeza, tecnico = '';
    // TF-1: a family sentence; NO_DATA and its cause in #state-tech.
    if (colonia && CP && !colonia_error) {
      try { var v = CP.voz(CP.scene(colonia, entrada.t, quieto, colony_looks, colony_seals, colony_mana), colonia_ocultos, colonia_fuente === 'fixture'); linea = cabeza + ' ' + v[0]; tecnico = v[1] + (live === 'ok' ? ' · Live source: /api/world-state (' + live_fuente + ')' : ''); }
      catch (e) { colonia_error = e.message || 'the colony is refused'; }
    }
    if (colonia_error || !colonia) {
      linea += colonia_error && colonia_error.indexOf('no node declared') !== 0 ? ' The colony is still asleep.' : tutorial ? ' ' + M.VACIO : ' Loading the map…';
      tecnico = 'Colony: NO_DATA · ' + (colonia_error || (tutorial ? 'state.json lists no node' : 'state not loaded yet')) + '.';
    }
    if (CCT) { CCT.start(); }
    state.textContent = linea;
    doc.getElementById('state-tech').textContent = tecnico;
    renderFrases();
  }

  // HUECO 1 (ALL IN ·6523297468): the sentence of every frame is shown to the visitor, and it follows the tick.
  function renderFrases() {
    if (!frases_el) { return; }
    frases_el.innerHTML = '';
    if (!colonia || !CP || colonia_error) { return; }
    try {
      var sc = CP.scene(colonia, entrada.t, quieto, colony_looks, colony_seals, colony_mana);
      if (CCT && CCT.walker()) { sc.you = CP.youFrame(CCT.walker(), entrada.t, quieto); }
      CP.frases(sc).forEach(function (texto) {
        var li = doc.createElement('li'); li.textContent = texto; frases_el.appendChild(li);
      });
    } catch (e) { /* a refused colony is already said on the state line */ }
  }

  // Only the two named nodes can appear, and only when the state file lists them as alive.
  function accept(data) {
    var nodes = data && Array.isArray(data.nodes) ? data.nodes : [];
    entrada = {
      t: data && Number.isInteger(data.t) ? data.t : 0,
      nodes: nodes.filter(function (n) { return n && (n.id === 'hexelion' || n.id === 'second'); })
    };
    if (!entrada.nodes.some(function (n) { return n.id === selected; })) { selected = ''; }
    // IC7-S3 (D7): the colony comes only from openworld_state.js; a node is drawn only when it is alive and sealed LIVE or STALE.
    if (colonia_fuente !== 'fixture') try {
      colonia_error = '';
      var estado = raiz.AtlasOpenworldState.leer(data);
      colonia = estado.colonia && estado.colonia.nodes.length > 0 ? estado.colonia : null;
      colonia_fuente = colonia ? 'estado' : 'NO_DATA';
      colony_looks = estado.looks || {};
      colony_seals = estado.seals || {};
      colony_mana = estado.mana || {};
      colony_pending = estado.pending || {};
      colonia_ocultos = Number.isInteger(estado.hidden) ? estado.hidden : 0;
      if (!colonia && estado.version === 2) { colonia_error = 'no node declared alive and sealed LIVE or STALE (' + estado.hidden + ' hidden)'; }
    } catch (e) { colonia = null; colonia_error = e.message || 'the state is refused'; }
  }
  if (new URLSearchParams(raiz.location.search).get('fixture') === 'sintetica') { colonia = FIXTURE; colonia_fuente = 'fixture'; colony_looks = FIXTURE_LOOKS; colony_seals = {}; colony_mana = {}; }

  // W-3: a click or tap on a visible node walks the avatar there over the visible route. The walk runs one frame at a
  // time (frames are counted, never milliseconds); arrival enters the node (colony_controls.js).
  // One loop at a time: a walk started by a click or by the keyboard runs the same frames (colony_controls walkTo).
  var looping = false;
  function walkLoop() {
    if (!CCT || looping) { return; }
    looping = true;
    step();
  }
  function step() {
    var more = CCT.tick();
    draw(); renderFrases();
    if (more) { raiz.requestAnimationFrame(step); } else { looping = false; }
  }
  surface.addEventListener('click', function (e) {
    if (!CCT || !CP) { return; }
    var r = surface.getBoundingClientRect();
    var px = (e.clientX - r.left) * (surface.width / r.width), py = (e.clientY - r.top) * (surface.height / r.height);
    var id = null; // Legacy node illustrations are not visible on the floor-only surface.
    // Tap-to-step (compact terminal, 2026-11-02, the pad retired): a tap off any node, with free walk on, steps the crab
    // one cell toward the tap: the nearest of the six hex directions by screen angle, same names as the arrow keys.
    if (!id && CCT.step && surface.dataset.youx) {
      // Orbit: the tap vector is turned back to the 0° view on the ground (the inverse of geometry().turn), so the six
      // directions keep their names at any view angle and the step lands on the cell under the finger.
      var vx = px - Number(surface.dataset.youx), vy = (py - Number(surface.dataset.youy)) / (CP.SQUASH || 1);
      var th = -(Number(surface.dataset.angle) || 0) * Math.PI / 180, ux = vx * Math.cos(th) - vy * Math.sin(th), uy = (vx * Math.sin(th) + vy * Math.cos(th)) * (CP.SQUASH || 1);
      var a = (Math.atan2(-uy, ux) * 180 / Math.PI + 360) % 360;
      var dir = [['east', 0], ['north-east', 60], ['north-west', 120], ['west', 180], ['south-west', 240], ['south-east', 300], ['east', 360]]
        .reduce(function (b, d) { return Math.abs(a - d[1]) < Math.abs(a - b[1]) ? d : b; })[0];
      if (CCT.step(dir)) { draw(); renderFrases(); return; }
    }
    if (!id) { CCT.say('NO_DATA: no visible node on that hex.'); return; }
    if (CCT.walkTo(id)) { walkLoop(); }
  });

  // 3.5D: hover (pointer) or keyboard focus on the map marks one node «hot»; its building breathes higher. Render only.
  function setHot(id) { id = id || ''; if ((surface.dataset.hot || '') !== id) { surface.dataset.hot = id; draw(); } }
  if (surface) {
    surface.addEventListener('pointermove', function (e) {
      if (!colonia || !CP || colonia_error || e.pointerType === 'touch') { return; }
      var r = surface.getBoundingClientRect();
      setHot('');
    });
    surface.addEventListener('pointerleave', function () { setHot(''); });
    surface.addEventListener('focus', function () { var w = CCT && CCT.walker ? CCT.walker() : null; setHot(w && w.node ? w.node : ''); });
    surface.addEventListener('blur', function () { setHot(''); });
  }
  // The cycle: a fixed step of t per second, unless reduced motion is on. The palette is a function of t alone.
  function cycle() { if (quieto) { return; } entrada.t += 1; draw(); renderFrases(); }

  // The sound is the selected frame's own (docs/acho-language.md, sound and h). An AudioContext is made only on the click.
  var listen = doc.getElementById('listen'), listenState = doc.getElementById('listen-state');
  // The sound module is on demand: it loads on the first click, never on page load.
  function loadSound(then) {
    if (raiz.AtlasSonifyAcho) { then(raiz.AtlasSonifyAcho); return; }
    var script = doc.createElement('script');
    script.src = '/game/acho_sonify.js';
    script.onload = function () { then(raiz.AtlasSonifyAcho); };
    script.onerror = function () { listenState.textContent = 'NO_DATA: the sound module could not be loaded'; };
    doc.head.appendChild(script);
  }
  if (listen) {
    listen.addEventListener('click', function () {
      loadSound(function (S) {
        var scene = M.mapa(entrada);
        var node = scene.nodes.find(function (nd) { return nd.id === selected; }) || scene.nodes[0];
        if (!node) { listenState.textContent = scene.nodata; return; }
        var result = S.sonify(node.frame);
        if (!result.ok) { listenState.textContent = /^NO_DATA/.test(result.cause) ? result.cause : 'NO_DATA: ' + result.cause; return; }
        var Ctx = raiz.AudioContext || raiz.webkitAudioContext;
        if (!Ctx) { listenState.textContent = 'NO_DATA: this browser has no audio output'; return; }
        var context = new Ctx();
        var n = S.play(result, context);
        listenState.textContent = 'Playing ' + n + ' voices.';
      });
    });
  }
  // The chat: the question is shown as live; the answer comes from the chunk router. With no model installed, the
  // answer is NO_DATA with its cause. The router loads on the first send, never on page load.
  var entry = doc.getElementById('entry'), question = doc.getElementById('question'), logList = doc.getElementById('log');
  var chatNote = doc.getElementById('chat-note');
  function line(cls, text) {
    var li = doc.createElement('li');
    li.className = cls; li.textContent = text; logList.appendChild(li);
  }
  function loadRouter(then) {
    if (raiz.AtlasChunkRouter) { then(raiz.AtlasChunkRouter); return; }
    var script = doc.createElement('script');
    script.src = '/game/chunk_router.js';
    script.onload = function () { then(raiz.AtlasChunkRouter); };
    script.onerror = function () { then(null); };
    doc.head.appendChild(script);
  }
  if (entry) {
    entry.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = question.value.trim();
      if (!text) { return; }
      line('me', text);
      question.value = '';
      if (raiz.AtlasBuildingChat && raiz.AtlasBuildingChat.ask(text)) { return; }
      loadRouter(function (R) {
        if (!R) { line('', 'NO_DATA · router_not_loaded'); return; }
        var answer = R.responde(text, null);
        line('', answer.ok ? answer.texto : answer.causa);
      });
    });
  }
  // P6: building chat, loaded on entry.
  function enterBuilding(node) {
    var b = colonia && colonia.buildings.filter(function (x) { return x.node === node; })[0], C = 'AtlasBuildingChat';
    if (!b) { state.textContent = 'NO_DATA: no building on ' + node; return; }
    var go = function () { raiz[C].open(b, { doc: doc, state: state, entry: entry, line: line, router: loadRouter }); };
    if (raiz[C]) { go(); return; }
    var sc = doc.createElement('script'); sc.src = '/game/building_chat.js'; sc.onload = go; sc.onerror = function () { line('', 'NO_DATA · not_loaded'); }; doc.head.appendChild(sc);
  }
  render();
  // P4: the baked floor loads by neighbourhood; its text equivalent goes to #floor-state, then the map redraws on it.
  if (raiz.AtlasMapPainter) { raiz.AtlasMapPainter.start(function (s, d) { doc.getElementById('floor-state').textContent = s; doc.getElementById('floor-tech').textContent = d; draw(); }); }
  raiz.addEventListener('resize', draw);
  if (!quieto) { raiz.setInterval(cycle, 1000); }
  var tutorial = null;
  var landingMode = raiz.location.search.indexOf('landing=1') >= 0;
  if (raiz.fetch) {
    raiz.fetch('/openworld/state.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { tutorial = d; accept(d); render(); if (seguir && !landingMode) { seguir.read(); } })
      .catch(function () { state.textContent = 'NO_DATA: tutorial state unavailable.'; });
  }
  // Latido visible (odd/tasks/latido-visible.md): world_feed.js follow reads it on load, by button, every minute.
  var seguir = raiz.AtlasWorldFeed && raiz.fetch && colonia_fuente !== 'fixture' ? raiz.AtlasWorldFeed.follow({ win: raiz, button: doc.getElementById('world-refresh'),
    tutorial: function () { return tutorial; },
    live: function (merged, d) {
      raiz.AtlasOpenworldState.leer(merged);
      live = 'ok'; live_fuente = d.cobertura && d.cobertura.fuente ? String(d.cobertura.fuente).slice(0, 40) : 'NO_DATA';
      accept(merged); render();
      if (d.cobertura && d.cobertura.estado === 'NO_DATA') { state.textContent += ' · Live nodes NO_DATA: ' + d.cobertura.causa; }
    },
    fail: function (cause) { live = cause; if (tutorial) { accept(tutorial); } render(); state.textContent += ' · Live nodes NO_DATA: ' + cause; }
  }) : null;
  raiz.AtlasOpenworldFollow = seguir;
})(window);
