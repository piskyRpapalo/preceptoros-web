// OpenWorld (NORTE 7 · PR 2 · global map, ODD isometric-colony). Same-origin only: the state file is the one thing read
// from the server. Default: zero nodes; the cabin is always here. A node that is not listed as alive does not exist.
// The map is one more render of the state (global_map.js). The cycle tick t advances by a fixed step, and the palette
// reads t alone: never a wall clock. With reduced motion there is no cycle: the sky stays where the state puts it.
(function (raiz) {
  'use strict';
  var doc = raiz.document, M = raiz.AtlasMapaGlobal;
  var entrada = { t: 0, cabin: {}, nodes: [] };
  var selected = 'cabin';
  var surface = doc.getElementById('surface');
  var press = doc.querySelector('#map .press');
  var state = doc.getElementById('state');
  var quieto = raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CP = raiz.AtlasColoniaPagina, colonia = null, colonia_fuente = 'NO_DATA', colonia_error = '';
  // Synthetic fixture, opt-in with ?fixture=sintetica: it is labelled SYNTHETIC on the page, never a live colony.
  var FIXTURE = { nodes: [{ id: 'cabin', q: 0, r: 0 }, { id: 'ring-e', q: 1, r: 0 }, { id: 'ring-ne', q: 1, r: -1 }, { id: 'ring-nw', q: 0, r: -1 }, { id: 'ring-w', q: -1, r: 0 }, { id: 'ring-sw', q: -1, r: 1 }, { id: 'ring-se', q: 0, r: 1 }, { id: 'doggee-a', q: 2, r: 0 }, { id: 'doggee-b', q: 2, r: -1 }], buildings: [{ id: 'b-cabin', node: 'cabin' }, { id: 'b-ring-e', node: 'ring-e' }, { id: 'b-ring-nw', node: 'ring-nw' }, { id: 'b-ring-sw', node: 'ring-sw' }, { id: 'b-doggee-a', node: 'doggee-a' }, { id: 'b-doggee-b', node: 'doggee-b' }], units: [] };
  // IC7-S4 (D11): the looks of the fixture's nodes; Doggee is the zombie look. The live state carries its own looks.
  var FIXTURE_LOOKS = { 'doggee-a': 'zombie', 'doggee-b': 'zombie' }, colony_looks = {}, colony_seals = {};
  var frases_el = doc.getElementById('frases');
  // TA-4 (D13-D16): the terminal, the anchor and the joystick live in colony_controls.js; the page passes its state in.
  var CC = raiz.AtlasColonyControls;
  var CCT = CC ? CC.attach({ doc: doc, win: raiz, colony: function () { return colonia; }, looks: function () { return colony_looks; }, seals: function () { return colony_seals; }, redraw: function () { draw(); renderFrases(); } }) : null;

  // The visible rows of the state: the cabin, and each node the state lists as alive. A node without its key is refused.
  function filas() {
    try { return M.estado(entrada); } catch (e) { return M.estado({ t: entrada.t, cabin: entrada.cabin, nodes: [] }); }
  }

  function draw() {
    var B = raiz.AtlasBubble, P = raiz.AtlasComicAtoms;
    if (!surface || !B || !P || !raiz.AtlasBubbleLetters) { return; }
    var width = surface.clientWidth || 320, height = surface.clientHeight || 200;
    var dpr = Math.min(2, raiz.devicePixelRatio || 1);
    surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr);
    if (colonia && CP) {
      try { CP.draw(surface, colonia, entrada.t, quieto, colony_looks, colony_seals, CCT ? CCT.walker() : null); return; }
      catch (e) { colonia_error = e.message || 'the colony is refused'; }
    }
    var g = surface.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var fit = Math.min(width / 480, height / 240);
    var scene = M.mapa(entrada);
    g.fillStyle = scene.paleta.cielo; g.fillRect(0, 0, width, height);
    var cx = width / 2, cy = height / 2 + 14 * fit;
    scene.terrain.concat(scene.nodes).forEach(function (nd) {
      g.save();
      g.translate(cx + nd.x * fit - M.ANCHO * M.BURBUJA * fit / 2, cy + nd.y * fit - M.ALTO * M.BURBUJA * fit / 2);
      g.scale(M.BURBUJA * fit, M.BURBUJA * fit);
      try { P.paint(g, B.compile(nd.frame)); } catch (e) { /* the frame is refused; the node stays off the map */ }
      g.restore();
    });
  }

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
    var vivos = filas().filter(function (row) { return row.id !== 'cabin'; }).length;
    var linea = 'Nodes online: ' + vivos + '.';
    if (colonia && CP && !colonia_error) {
      try { linea = CP.texto(CP.scene(colonia, entrada.t, quieto, colony_looks, colony_seals)) + (colonia_fuente === 'fixture' ? ' · SYNTHETIC fixture, not a live colony' : ''); }
      catch (e) { colonia_error = e.message || 'the colony is refused'; }
    }
    if (colonia_error) { linea += ' Colony: NO_DATA · ' + colonia_error + '.'; }
    else if (!colonia) { linea += ' Colony: NO_DATA · no live colony in the state (estado.json has no colonia).'; }
    if (CCT) { CCT.start(); }
    state.textContent = linea;
    renderFrases();
  }

  // HUECO 1 (ALL IN ·6523297468): the sentence of every frame is shown to the visitor, and it follows the tick.
  function renderFrases() {
    if (!frases_el) { return; }
    frases_el.innerHTML = '';
    if (!colonia || !CP || colonia_error) { return; }
    try {
      var sc = CP.scene(colonia, entrada.t, quieto, colony_looks, colony_seals);
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
      cabin: data && data.cabin && typeof data.cabin === 'object' ? data.cabin : {},
      nodes: nodes.filter(function (n) { return n && (n.id === 'atlantis' || n.id === 'risen'); })
    };
    if (selected !== 'cabin' && !entrada.nodes.some(function (n) { return n.id === selected; })) { selected = 'cabin'; }
    // IC7-S3 (D7): the colony comes only from openworld_state.js; a node is drawn only when it is alive and sealed LIVE or STALE.
    if (colonia_fuente !== 'fixture') try {
      var estado = raiz.AtlasOpenworldState.leer(data);
      colonia = estado.colonia && estado.colonia.nodes.length > 0 ? estado.colonia : null;
      colonia_fuente = colonia ? 'estado' : 'NO_DATA';
      colony_looks = estado.looks || {};
      colony_seals = estado.seals || {};
      if (!colonia && estado.version === 2) { colonia_error = 'no node declared alive and sealed LIVE or STALE (' + estado.ocultos + ' hidden)'; }
    } catch (e) { colonia = null; colonia_error = e.message || 'the state is refused'; }
  }
  if (new URLSearchParams(raiz.location.search).get('fixture') === 'sintetica') { colonia = FIXTURE; colonia_fuente = 'fixture'; colony_looks = FIXTURE_LOOKS; colony_seals = {}; }

  // The cycle: a fixed step of t per second, unless reduced motion is on. The palette is a function of t alone.
  function cycle() { if (quieto) { return; } entrada.t += 1; draw(); renderFrases(); }

  // The sound is the selected frame's own (docs/bubble-language.md, sound and h). An AudioContext is made only on the click.
  var listen = doc.getElementById('listen'), listenState = doc.getElementById('listen-state');
  // The sound module is on demand: it loads on the first click, never on page load.
  function loadSound(then) {
    if (raiz.AtlasSonifyBubble) { then(raiz.AtlasSonifyBubble); return; }
    var script = doc.createElement('script');
    script.src = '/game/bubble_sonify.js';
    script.onload = function () { then(raiz.AtlasSonifyBubble); };
    script.onerror = function () { listenState.textContent = 'NO_DATA: the sound module could not be loaded'; };
    doc.head.appendChild(script);
  }
  if (listen) {
    listen.addEventListener('click', function () {
      loadSound(function (S) {
        var scene = M.mapa(entrada);
        var node = scene.nodes.find(function (nd) { return nd.id === selected; }) || scene.nodes[0];
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
      loadRouter(function (R) {
        if (!R) { line('', 'NO_DATA · router_not_loaded'); return; }
        var answer = R.responde(text, null);
        line('', answer.ok ? answer.texto : answer.causa);
      });
      });
    });
  }
  render();
  raiz.addEventListener('resize', draw);
  if (!quieto) { raiz.setInterval(cycle, 1000); }
  if (raiz.fetch) {
    raiz.fetch('/openworld/estado.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { accept(d); render(); })
      .catch(function () { /* no state file: zero nodes, which is the default */ });
  }
})(window);
