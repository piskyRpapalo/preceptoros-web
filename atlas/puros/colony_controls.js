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
  // handlers: { move(direction), enter(), choose(look | null) }. Every control is a real button, at least 44 px high.
  function mount(doc, container, handlers) {
    var box = doc.createElement('div');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Joystick and terminal');
    var status = doc.createElement('p');
    status.className = 'state';
    status.setAttribute('aria-live', 'polite');
    function button(text, onClick) {
      var b = doc.createElement('button');
      b.type = 'button'; b.textContent = text; b.style.minHeight = '44px'; b.style.minWidth = '44px';
      b.addEventListener('click', onClick);
      return b;
    }
    var pad = doc.createElement('div');
    Object.keys(DIRS).forEach(function (name) {
      pad.appendChild(button(name, function () { handlers.move(name); }));
    });
    pad.appendChild(button('enter node', function () { handlers.enter(); }));
    var sel = doc.createElement('select');
    sel.setAttribute('aria-label', 'Terminal look');
    [['', 'node default'], ['basic', 'basic'], ['atlantis', 'atlantis'], ['zombie', 'zombie']].forEach(function (o) {
      var opt = doc.createElement('option'); opt.value = o[0]; opt.textContent = o[1]; sel.appendChild(opt);
    });
    sel.style.minHeight = '44px';
    sel.addEventListener('change', function () { handlers.choose(sel.value === '' ? null : sel.value); });
    box.appendChild(pad); box.appendChild(sel); box.appendChild(status);
    container.appendChild(box);
    // Arrow keys: east and west move along the row; up and down take the two north and two south neighbours.
    var keys = { ArrowRight: 'east', ArrowLeft: 'west', ArrowUp: 'north-east', ArrowDown: 'south-west' };
    doc.addEventListener('keydown', function (e) {
      if (keys[e.key]) { e.preventDefault(); handlers.move(keys[e.key]); }
      else if (e.key === 'Enter' && e.target === doc.body) { handlers.enter(); }
    });
    return { say: function (text) { status.textContent = text; }, select: sel };
  }

  // attach(env): the page's controller (TA-4). env = { doc, win, colony(), looks(), redraw() }. It owns the ephemeral
  // walker (memory only), the joystick, the anchor on enter and the user's choice. The page only passes its state in.
  function attach(env) {
    var walker = null;
    var saved = savedChoice(storeOf(env.win));
    var joy = mount(env.doc, env.doc.getElementById('joy'), { move: moveWalker, enter: enterNode, choose: chooseLook });
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
    function moveWalker(direction) {
      var c = env.colony();
      if (!c || !walker) { joy.say('NO_DATA: no colony node to walk on'); return; }
      var r = move(walker, direction, c.nodes);
      if (!r.ok) { joy.say(r.cause); return; }
      walker = r.walker;
      env.redraw();
      joy.say('on node ' + walker.node + '. Enter takes its terminal.');
    }
    function enterNode() {
      if (!walker) { return; }
      var e = enter(walker, env.looks()[walker.node], saved);
      anchor(e.look);
      var step = tutorialStep(walker.node);
      joy.say('terminal: ' + e.look + ' (' + (e.source === 'user' ? 'your choice' : e.source === 'node' ? 'the node' : 'default') + ')' + (step ? '. ' + step : ''));
    }
    // G4-2: the tutorial is a walk. Entering a node may complete the next step (tutorial_walk.js). Its progress is this
    // visit's memory only, like the walker: a reload starts the walk again. Only a LIVE or STALE place can be walked.
    var tutorialLog = [];
    function tutorialStep(node) {
      var TW = env.win.AtlasTutorialWalk;
      if (!TW) { return ''; }
      var done = TW.progress(tutorialLog);
      var next = TW.STEPS.filter(function (x) { return done.indexOf(x.id) < 0; })[0];
      if (!next) { return 'tutorial: complete'; }
      if (TW.placeFor(next.id) !== node) { return 'tutorial: next step is at ' + TW.placeFor(next.id); }
      var ok = TW.canWalk(next.id, env.seals());
      if (!ok.ok) { return ok.cause; }
      tutorialLog = TW.record(tutorialLog, next.id, 'played');
      return 'tutorial: ' + next.id + ' played';
    }
    function chooseLook(look) {
      var st = storeOf(env.win);
      try { if (look === null) { st.removeItem(KEY); } else { saveChoice(st, look); } } catch (e) { /* the choice stays for this visit */ }
      saved = look;
      enterNode();
    }
    return { start: start, walker: function () { return walker; } };
  }

  var AtlasColonyControls = {
    DIRS: DIRS, LOOKS: LOOKS, ANCHOR: ANCHOR, KEY: KEY,
    move: move, enter: enter, colours: colours, bandHex: bandHex, savedChoice: savedChoice, saveChoice: saveChoice, mount: mount, attach: attach
  };
  if (common) { module.exports = AtlasColonyControls; }
  else { root.AtlasColonyControls = AtlasColonyControls; }
})(typeof globalThis === 'object' ? globalThis : this);
