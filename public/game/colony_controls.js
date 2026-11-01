// Terminal, anchor and joystick of /openworld/ (ODD colony-terminal-anchor, TA-1). Pure core: no random numbers,
// no clock reads, no network. The user's choice of terminal stays in their own browser (the store is injected).
// Colours are house bands; hex values come from comic_tokens and comic_accents at run time, never written here.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;

  // The six neighbours of an axial hex (IC1 coordinates), by English name.
  var DIRS = {
    east: [1, 0], 'north-east': [1, -1], 'north-west': [0, -1],
    west: [-1, 0], 'south-west': [-1, 1], 'south-east': [0, 1]
  };
  var LOOKS = ['basic', 'atlantis', 'zombie'];
  // D13/D14: the house bands of each terminal (names only).
  var ANCHOR = {
    basic: { bg: 'paper', fg: 'ink', accent: 'cyan' },
    atlantis: { bg: 'ocean', fg: 'paper', accent: 'comic yellow.base' },
    zombie: { bg: 'ink', fg: 'cyan', accent: 'vermilion.base' }
  };
  var KEY = 'preceptoros.terminal';

  // move(walker, direction, nodes) → { walker, ok, cause }. The walker only steps onto a hex that holds a colony node.
  function move(walker, direction, nodes) {
    var d = DIRS[direction];
    if (!d) { return { walker: walker, ok: false, cause: 'unknown direction ' + JSON.stringify(direction) }; }
    var q = walker.q + d[0], r = walker.r + d[1];
    var hit = (nodes || []).filter(function (n) { return n.q === q && n.r === r; })[0];
    if (!hit) { return { walker: walker, ok: false, cause: 'NO_DATA: no colony node on that hex' }; }
    return { walker: { node: hit.id, q: q, r: r }, ok: true, cause: '' };
  }

  // enter(walker, nodeLook, saved) → { node, look, source }. The user's saved choice wins over the node's look.
  function enter(walker, nodeLook, saved) {
    if (LOOKS.indexOf(saved) >= 0) { return { node: walker.node, look: saved, source: 'user' }; }
    var look = LOOKS.indexOf(nodeLook) >= 0 ? nodeLook : 'basic';
    return { node: walker.node, look: look, source: LOOKS.indexOf(nodeLook) >= 0 ? 'node' : 'default' };
  }

  // colours(look, bandHex) → { bg, fg, accent } as hex, resolved through bandHex(name). A name that does not resolve throws.
  function colours(look, bandHex) {
    var a = ANCHOR[look];
    if (!a) { throw new Error('unknown terminal look ' + JSON.stringify(look)); }
    var out = {};
    ['bg', 'fg', 'accent'].forEach(function (k) {
      var hex = bandHex(a[k]);
      if (typeof hex !== 'string' || hex === '') { throw new Error('band does not resolve: ' + a[k]); }
      out[k] = hex;
    });
    return out;
  }

  // bandHex(name, tokens, accents): neutral names from comic_tokens, `head.sub` from comic_accents.
  function bandHex(name, tokens, accents) {
    if (tokens && tokens.NEUTRAL && Object.prototype.hasOwnProperty.call(tokens.NEUTRAL, name)) { return tokens.NEUTRAL[name]; }
    var cut = name.lastIndexOf('.');
    var head = cut < 0 ? name : name.slice(0, cut), sub = cut < 0 ? '' : name.slice(cut + 1);
    var acc = accents && accents.ACCENTS && accents.ACCENTS[head];
    return acc && acc.bands && acc.bands[sub] ? acc.bands[sub] : undefined;
  }

  // savedChoice(store) → the look the user saved in this browser, or null. Any failure reads as no choice.
  function savedChoice(store) {
    try { var v = store.getItem(KEY); return LOOKS.indexOf(v) >= 0 ? v : null; } catch (e) { return null; }
  }
  // saveChoice(store, look) → true when saved. Invalid looks are refused, never stored.
  function saveChoice(store, look) {
    if (LOOKS.indexOf(look) < 0) { return false; }
    try { store.setItem(KEY, look); return true; } catch (e) { return false; }
  }

  // mount(doc, container, handlers): the DOM glue of the joystick and the terminal choice (TA-4). Not run by the pure cases.
  // handlers: { move(direction), enter(), choose(look | null), skip() }. Every control is a real button, at least 44 px high.
  function mount(doc, container, handlers) {
    var box = doc.createElement('div');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Terminal and tutorial');
    var status = doc.createElement('p');
    status.className = 'state';
    status.setAttribute('aria-live', 'polite');
    function button(text, onClick) {
      var b = doc.createElement('button');
      b.type = 'button'; b.textContent = text; b.style.minHeight = '44px'; b.style.minWidth = '44px';
      b.addEventListener('click', onClick);
      return b;
    }
    // W-4: the six-direction grid and «enter node» are gone. The map is walked by clicking a node (W-3), and the arrow
    // keys choose a neighbouring node; Enter walks there. Every selection is said on the status line (live region).
    var actions = doc.createElement('div');
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', 'Tutorial');
    actions.appendChild(button('Skip tutorial', function () { handlers.skip(); }));
    var sel = doc.createElement('select');
    sel.setAttribute('aria-label', 'Terminal look');
    [['', 'node default'], ['basic', 'basic'], ['atlantis', 'atlantis'], ['zombie', 'zombie']].forEach(function (o) {
      var opt = doc.createElement('option'); opt.value = o[0]; opt.textContent = o[1]; sel.appendChild(opt);
    });
    sel.style.minHeight = '44px';
    sel.addEventListener('change', function () { handlers.choose(sel.value === '' ? null : sel.value); });
    // H1: the stick. Dragging inside the pad selects the neighbour by angle (handlers.direction → handlers.select, the W-4 law);
    // letting go walks to it (handlers.enter), the same as Enter after an arrow key.
    var stickPad = doc.createElement('div');
    stickPad.setAttribute('role', 'application');
    stickPad.setAttribute('aria-label', 'Move your character: drag inside the circle, let go to walk');
    stickPad.style.cssText = 'width:168px;height:168px;touch-action:none;border:2px solid currentColor;border-radius:50%;margin:8px 0';
    var drag = null, lastName = null;
    stickPad.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY]; lastName = null; stickPad.setPointerCapture(e.pointerId); });
    stickPad.addEventListener('pointermove', function (e) {
      if (!drag) { return; }
      var name = handlers.direction ? handlers.direction(e.clientX - drag[0], e.clientY - drag[1]) : null;
      if (name && name !== lastName) { lastName = name; handlers.select(name); }
    });
    stickPad.addEventListener('pointerup', function () { var walked = drag && lastName; drag = null; if (walked) { handlers.enter(); } });
    stickPad.addEventListener('pointercancel', function () { drag = null; });
    box.appendChild(stickPad);
    box.appendChild(status); box.appendChild(actions); box.appendChild(sel);
    container.appendChild(box);
    // Arrow keys choose a neighbour (move() decides which); Enter walks to the chosen one. Form fields keep their keys.
    var keys = { ArrowRight: 'east', ArrowLeft: 'west', ArrowUp: 'north-east', ArrowDown: 'south-west' };
    doc.addEventListener('keydown', function (e) {
      var t = e.target, campo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (campo) { return; }
      if (keys[e.key]) { e.preventDefault(); handlers.select(keys[e.key]); }
      else if (e.key === 'Enter' && t === doc.body) { handlers.enter(); }
    });
    return { say: function (text) { status.textContent = text; }, select: sel };
  }

  // attach(env): the page's controller (TA-4). env = { doc, win, colony(), looks(), redraw() }. It owns the ephemeral
  // walker (memory only), the joystick, the anchor on enter and the user's choice. The page only passes its state in.
  function attach(env) {
    var walker = null;
    // W-3: a walk over the visible nodes (walk_route.js). Frames are counted, never milliseconds (W-D3).
    var walk = null, reduced = !!(env.win.matchMedia && env.win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var saved = savedChoice(storeOf(env.win));
    // W-4: the chosen neighbour (by an arrow key or the stick). It is cleared when a walk starts.
    var selected = null;
    var joy = mount(env.doc, env.doc.getElementById('joy'), { select: selectNeighbour, enter: walkSelected, choose: chooseLook, skip: skipTutorial,
      direction: function (dx, dy) { var M = env.win.AtlasMapStick; return M ? M.direction(dx, dy) : null; } });
    function storeOf(win) { try { return win.localStorage; } catch (e) { return null; } }
    function hex(name) { return bandHex(name, env.win.AtlasComicTokens, env.win.AtlasComicAccents); }
    function anchor(look) {
      var c = colours(look, hex);
      env.doc.documentElement.style.setProperty('--bg', c.bg);
      env.doc.documentElement.style.setProperty('--fg', c.fg);
      return c;
    }
    function start() {
      var c = env.colony();
      if (!c || walker) { return; }
      var home = c.nodes.filter(function (n) { return n.id === 'cabin'; })[0] || c.nodes[0];
      if (home) { walker = { node: home.id, q: home.q, r: home.r }; }
    }
    // selectNeighbour(direction): choose the visible node in that direction (move() decides). Nothing moves yet.
    function selectNeighbour(direction) {
      var c = env.colony();
      if (!c || !walker) { joy.say('NO_DATA: no colony node to walk on'); return; }
      if (walk) { return; }
      var r = move(walker, direction, c.nodes);
      if (!r.ok) { selected = null; joy.say(r.cause); return; }
      selected = r.walker.node;
      joy.say('selected ' + selected + ' · Enter walks there.');
    }
    // walkSelected(): walk to the chosen node. With no choice, say how to choose one.
    function walkSelected() {
      if (walk) { return; }
      // P6: with no choice, Enter goes into the building you stand on (the law says so first, then what was entered).
      if (!selected) { if (walker) { enterNode(true, 'No node selected: press an arrow key, or click a node on the map, then Enter. '); } else { joy.say('No node selected: press an arrow key, or click a node on the map, then Enter.'); } return; }
      var target = selected;
      selected = null;
      walkTo(target);
    }
    // enterNode(inside, prefix): anchor the terminal of the node; with inside, go into its building too (P6, env.entered).
    function enterNode(inside, prefix) {
      if (!walker || walk) { return; }
      var e = enter(walker, env.looks()[walker.node], saved);
      anchor(e.look);
      var step = tutorialStep(walker.node);
      joy.say((prefix || '') + 'terminal: ' + e.look + ' (' + (e.source === 'user' ? 'your choice' : e.source === 'node' ? 'the node' : 'default') + ')' + (step ? '. ' + step : ''));
      if (inside && env.entered) { env.entered(walker.node); }
    }
    // G4-2: the tutorial is a walk. Entering a node may complete the next step (tutorial_walk.js). Its progress is this
    // visit's memory only, like the walker: a reload starts the walk again. Only a LIVE or STALE place can be walked.
    var tutorialLog = [];
    function tutorialStep(node) {
      var TW = env.win.AtlasTutorialWalk;
      if (!TW) { return ''; }
      var r = TW.advance(tutorialLog, node, env.seals());
      tutorialLog = r.log;
      return r.said;
    }
    // Link visit → tutorial (EU-1): when the visit ends, the steps still open whose place is not alive are recorded as
    // skipped (NO_DATA). Walkable steps stay open. The status says what was played and what was skipped.
    var visitBox = env.doc.getElementById('visitor-play');
    if (visitBox) {
      visitBox.addEventListener('visitor:end', function () {
        var TW = env.win.AtlasTutorialWalk;
        if (!TW) { return; }
        tutorialLog = TW.close(tutorialLog, env.seals());
        var played = TW.progress(tutorialLog);
        var skipped = tutorialLog.filter(function (e) { return e.outcome === 'skipped'; }).map(function (e) { return e.step; });
        joy.say('visit ended. tutorial played: ' + (played.join(', ') || 'none') + ' · skipped: ' + (skipped.join(', ') || 'none'));
      });
    }
    function skipTutorial() {
      var TW = env.win.AtlasTutorialWalk;
      if (!TW) { joy.say('NO_DATA: tutorial is unavailable'); return; }
      var resolved = tutorialLog.map(function (x) { return x.step; });
      TW.STEPS.forEach(function (step) {
        if (resolved.indexOf(step.id) < 0) { tutorialLog = TW.record(tutorialLog, step.id, 'skipped'); }
      });
      joy.say('tutorial: skipped');
    }
    function chooseLook(look) {
      var st = storeOf(env.win);
      try { if (look === null) { st.removeItem(KEY); } else { saveChoice(st, look); } } catch (e) { /* the choice stays for this visit */ }
      saved = look;
      enterNode();
    }
    // walkerView(): the walker as the page draws it. While walking it carries the node it stands on, the node it walks
    // to and the fraction of that step (walk_route.js poseOf).
    function walkerView() {
      var W = env.win.AtlasWalkRoute;
      if (!walker || !walk || !W) { return walker; }
      var p = W.poseOf(walk);
      return { node: p.node, q: walker.q, r: walker.r, to: p.to, fraction: p.fraction };
    }
    function coordOf(id, c) { return (c.nodes || []).filter(function (n) { return n.id === id; })[0]; }
    // walkTo(id): walk the visible route to node id. Arrival is entering. Returns true while the walk runs.
    function walkTo(id) {
      var W = env.win.AtlasWalkRoute, c = env.colony();
      if (!W || !c || !walker) { joy.say('NO_DATA: no colony node to walk on'); return false; }
      if (walk) { return true; }
      if (id === walker.node) { enterNode(true); return false; }
      var r = W.route(c.nodes, env.seals(), walker.node, id);
      if (!r.ok) { joy.say(r.cause); return false; }
      walk = W.startWalk(r.path, reduced);
      joy.say('walking to ' + id + ' · ' + (r.path.length - 1) + ' step(s)');
      if (env.walk) { env.walk(); }
      return true;
    }
    // tickWalk(): one frame of the walk. On arrival the walker is on the last node and enters it.
    function tickWalk() {
      var W = env.win.AtlasWalkRoute, c = env.colony();
      if (!walk || !W || !c) { return false; }
      walk = W.advanceWalk(walk);
      if (!W.doneWalk(walk)) { env.redraw(); return true; }
      var last = coordOf(walk.path[walk.path.length - 1], c);
      walker = { node: last.id, q: last.q, r: last.r };
      walk = null; selected = null;
      env.redraw();
      enterNode(true);
      return false;
    }
    return { start: start, walker: walkerView, walkTo: walkTo, tick: tickWalk, walking: function () { return !!walk; }, say: function (text) { joy.say(text); } };
  }

  var AtlasColonyControls = {
    DIRS: DIRS, LOOKS: LOOKS, ANCHOR: ANCHOR, KEY: KEY,
    move: move, enter: enter, colours: colours, bandHex: bandHex, savedChoice: savedChoice, saveChoice: saveChoice, mount: mount, attach: attach
  };
  if (common) { module.exports = AtlasColonyControls; }
  else { root.AtlasColonyControls = AtlasColonyControls; }
})(typeof globalThis === 'object' ? globalThis : this);
