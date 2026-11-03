// P6 (2.5D village plan, "Buildings with a chatbot"): every building of the colony catalogue talks, in the browser,
// with no server. Pure: no random numbers, no clock reads, no I/O. A building's kind is the tutorial cabin (its node is
// "cabin") or its shape from colonia_edificios.js (dome, tower, block). Each kind has a script: a greeting, what it
// measures, what it offers, and short replies keyed by simple intents. A question with no scripted intent would need a
// model: it goes to chunk_router.js, and with no model installed the answer is its honest NO_DATA cause. Nothing is
// invented. Every line is a acho-language frame under 1,024 UTF-8 bytes (state_frames.js).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var E = common ? require('./colonia_edificios.js') : root.AtlasEdificios;

  var INTENTS = ['help', 'what', 'status', 'offer'];
  // Each intent is recognised by whole words only. The order is the priority when a question holds two.
  var WORDS = {
    help: ['help', 'how', 'hi', 'hello', 'hey'],
    what: ['what', 'who', 'measure', 'measures', 'about'],
    status: ['status', 'state', 'seal', 'live', 'alive', 'now'],
    offer: ['offer', 'offers', 'do', 'give', 'play', 'can']
  };

  var SCRIPTS = {
    cabin: {
      name: 'Tutorial cabin',
      greeting: 'Welcome to the tutorial cabin. I am its guide, and I run in your browser only.',
      measures: 'I measure your tutorial walk in this visit: the steps you played and the steps you skipped.',
      offers: 'I offer the first steps: walk with the arrow keys, Enter to go in, Escape to leave.',
      replies: {
        help: 'Ask me: what, status or offer. Escape or the Leave building button takes you out.',
        what: 'This cabin is the one place that is always here, even with zero live nodes.',
        status: 'The cabin is LIVE in this visit. Any other node says its own seal.',
        offer: 'Walk to a live node, listen to the cabin, or skip the tutorial from the status panel.'
      }
    },
    dome: {
      name: 'Dome',
      greeting: 'This is a dome. It keeps the eggs of its node.',
      measures: 'I measure the eggs this node declares. A count that is not published is NO_DATA.',
      offers: 'I offer a look at the egg count. Hatching is signed by a person, never by me.',
      replies: {
        help: 'Ask me: what, status or offer. Escape or the Leave building button takes you out.',
        what: 'A dome is a hatchery. It holds eggs; it does not make them.',
        status: 'My status is the seal of my node. Without a measure it is NO_DATA.',
        offer: 'I can tell you what is declared here. I never sign, adopt or hatch for you.'
      }
    },
    tower: {
      name: 'Tower',
      greeting: 'This is a tower. It watches the duels of its node.',
      measures: 'I measure the duels this node declares. A result that is not published is NO_DATA.',
      offers: 'I offer the rules of a duel. A challenge is signed by a person, never by me.',
      replies: {
        help: 'Ask me: what, status or offer. Escape or the Leave building button takes you out.',
        what: 'A tower is a duel hall. Every duel replays from its law, its seed and its actions.',
        status: 'My status is the seal of my node. Without a measure it is NO_DATA.',
        offer: 'I can explain a duel. I never challenge, accept or settle for you.'
      }
    },
    block: {
      name: 'Block',
      greeting: 'This is a block. It keeps the workshop of its node.',
      measures: 'I measure the parts this node declares. A part that is not published is NO_DATA.',
      offers: 'I offer a list of what is declared. Building is signed by a person, never by me.',
      replies: {
        help: 'Ask me: what, status or offer. Escape or the Leave building button takes you out.',
        what: 'A block is a workshop. It shows parts; it does not invent them.',
        status: 'My status is the seal of my node. Without a measure it is NO_DATA.',
        offer: 'I can tell you what is declared here. I never sign or trade for you.'
      }
    }
  };
  var KINDS = Object.keys(SCRIPTS);

  // kindOf(building) → 'cabin' for the building on the cabin node, else its shape from the catalogue.
  function kindOf(building) {
    if (!building || typeof building.id !== 'string') { return null; }
    if (building.node === 'cabin') { return 'cabin'; }
    return E.formaDe(building.id);
  }

  // intentOf(text) → one of INTENTS, or null. Whole words, lower case; the first intent in INTENTS order wins.
  function intentOf(text) {
    var words = String(text || '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
    for (var i = 0; i < INTENTS.length; i++) {
      var list = WORDS[INTENTS[i]];
      for (var j = 0; j < words.length; j++) { if (list.indexOf(words[j]) >= 0) { return INTENTS[i]; } }
    }
    return null;
  }

  // frame(building, t, text, seal) → a Acho frame that carries one line of the conversation as its sentence.
  function frame(building, t, text, seal) {
    var line = String(text);
    return {
      v: 'preceptoros.acho/1', id: 'chat.' + building.id, t: t, cv: [120, 110], seal: seal,
      atoms: [{ k: 'chat.' + kindOf(building), r: line, i: [] }],
      bands: ['paper', 'ink', 'cyan'],
      change: [line],
      sound: 'NO_DATA: a building conversation declares no waves; nothing is invented',
      soundCause: 'a conversation line has no measured value'
    };
  }

  function scriptOf(building) {
    var s = SCRIPTS[kindOf(building)];
    if (!s) { throw new Error('building_chat: no script for ' + JSON.stringify(building && building.id)); }
    return s;
  }

  // opening(building) → the three frames said on entry: greeting, what it measures, what it offers.
  function opening(building) {
    var s = scriptOf(building);
    return [s.greeting, s.measures, s.offers].map(function (text, i) { return frame(building, i, s.name + ' · ' + text, 'LIVE'); });
  }

  // reply(building, text, router) → one frame. A scripted intent answers from the script; anything else would need a
  // model, so it asks the chunk router with no model and returns its cause (NO_DATA · model_not_installed).
  function reply(building, text, router) {
    var s = scriptOf(building), intent = intentOf(text);
    if (intent) { return frame(building, 3 + INTENTS.indexOf(intent), s.name + ' · ' + s.replies[intent], 'LIVE'); }
    var answer = router && router.responde ? router.responde(String(text || ''), null) : null;
    var cause = answer && !answer.ok ? answer.causa : 'NO_DATA · router_not_loaded';
    return frame(building, 3 + INTENTS.length, cause, 'NO_DATA');
  }

  // LA VOZ DEL RACK (ODD decree 2026-10-28): the chat window's title names the building the visitor is in, and a typed
  // «ideas», «rack» or «study» (or the 44 px Rack ideas button) asks the rack for its ideas through rack_ideas.js.
  function titleOf(building) { return building ? scriptOf(building).name + ' · ' + building.id + ' · chat' : 'Chat'; }
  function wantsIdeas(text) { return /(^|[^a-z])(ideas?|rack|study)([^a-z]|$)/i.test(String(text || '')); }
  function wantsVoices(text) { return /(^|[^a-z])(voices|who speaks)([^a-z]|$)/i.test(String(text || '')); }
  function wantsJewels(text) { return /(^|[^a-z])(jewels?|joyas?)([^a-z]|$)/i.test(String(text || '')); }
  // A question with no script goes to the live door: Hexelion at the edge (aula_chat.js), only on the visitor's Send.
  // Its context names the building, so the answer can be about where the visitor stands.

  // open(building, page) / ask(text): the DOM glue of /openworld/ (not run by the pure cases). page = { doc, state, entry,
  // line(cls, text), router(then) }. The lines go to the chat log, which face_terminal.js copies into the radio, so the
  // screen reader hears the building as it hears the map. While a building is open, the chat input asks its bot; Escape
  // or the 44 px «Leave building» button closes it, and #state says so.
  var inside = null, page = null, leave = null, rackBtn = null, jewelBtn = null, asking = false, chain = null, visit = null;
  function title(b) { var h = page.doc.getElementById('chat-h'); if (h) { h.textContent = titleOf(b); } }
  function busy(on) { asking = on; rackBtn.disabled = on; jewelBtn.disabled = on; }
  function leaveBuilding() {
    if (!inside) { return; }
    var id = inside.id; inside = null; leave.hidden = true; rackBtn.hidden = true; jewelBtn.hidden = true; title(null);
    page.state.textContent = 'Left building ' + id;
  }
  // say(id, text, title): one line in the conversation with its voice (terminal_panel.js LAS VOCES); a script line drops
  // the building name its frame already carries, because the title says it.
  function say(id, text, title) {
    var P = root.AtlasTerminalPanel, log = page.doc.getElementById('log');
    if (P && P.decir && log) { P.decir(page.doc, log, id, text, title); return; }
    page.line('', (title || '') + (title ? ' · ' : '') + text);
  }
  function scripted(b, r) { var n = scriptOf(b).name + ' · '; say('script', r.indexOf(n) === 0 ? r.slice(n.length) : r, scriptOf(b).name); }
  // voices(): who can speak here, one by one, from the immutable table — said by the building, never put in another's mouth.
  function voices() {
    var b = inside, P = root.AtlasTerminalPanel, w = page.doc.defaultView || root, name = scriptOf(b).name;
    if (!P || !P.VOCES) { say('script', 'NO_DATA · not_loaded: the voices table did not load.', name); return; }
    var rows = P.VOCES.filter(function (v) { return v[0] !== 'script'; });
    say('script', rows.length + ' voices can speak in this panel:', name);
    var i = 0; (function next() { if (i >= rows.length || inside !== b) { return; } var v = rows[i++];
      say('script', 'Voice ' + i + '/' + rows.length + ' · ' + v[1] + ' — ' + v[2] + ', ' + v[3] + '.', name); if (i < rows.length) { w.setTimeout(next, 400); } })();
  }
  function load(src, name, then) {
    if (root[name]) { then(root[name]); return; }
    var sc = page.doc.createElement('script'); sc.src = src; sc.onload = function () { then(root[name] || null); };
    sc.onerror = function () { then(null); }; page.doc.head.appendChild(sc);
  }
  // The requests of this piece leave here, after the visitor asked; each idea or jewel is said one by one while they stay.
  function fromRack(kind) {
    if (!inside || asking) { return; }
    var b = inside, name = scriptOf(b).name, w = page.doc.defaultView || root, jw = kind === 'jewels'; busy(true);
    var vid = jw ? 'jewels' : 'rack';
    say('script', jw ? 'asking the rack for its jewels…' : 'asking the rack for its ideas…', name);
    load('/game/rack_ideas.js', 'AtlasRackIdeas', function (R) {
      if (!R) { say(vid, 'NO_DATA · not_loaded: the rack bridge did not load.'); busy(false); return; }
      var o = { fetch: w.fetch && w.fetch.bind(w), online: w.navigator ? w.navigator.onLine : undefined };
      (jw ? R.fetchJewels(o) : R.fetchIdeas(o)).then(function (r) {
        if (inside !== b) { busy(false); return; }
        if (!r.ok) { say(vid, r.causa); busy(false); return; }
        var lines = jw ? [R.jewelHeader(name, r)].concat(r.jewels.map(function (x, i) { return R.jewelLine(x, i, r.jewels.length); }))
          : [R.header(name, r)].concat(r.ideas.map(function (x, i) { return R.lineOf(x, i, r.ideas.length); }));
        var n = 0; R.stream(lines, function (t) { say(vid, t); if (++n === lines.length) { busy(false); } }, function () { return inside === b || (busy(false), false); }, function (f, ms) { w.setTimeout(f, ms); });
      });
    });
  }
  function hexelion(b, text) {
    var w = page.doc.defaultView || root;
    load('/game/aula_chat.js', 'AtlasAulaChat', function (A) {
      if (!A) { say('hexelion', 'NO_DATA · not_loaded: the door to Hexelion did not load.'); return; }
      var account = visit ? Promise.resolve(visit) : (root.AtlasVisitorAccount ? root.AtlasVisitorAccount.create(true) : Promise.reject(new Error('no visit')));
      account.then(function (v) {
        visit = v; return A.turn(w.fetch.bind(w), v.info().seed, text, chain, '/openworld/#' + b.id);
      }).then(function (r) {
        chain = r.chain; if (inside !== b) { return; }
        say('hexelion', r.ok ? r.text + (r.cut ? ' [shortened]' : '') : A.plain(r.cause) + (r.retry ? ' · wait ' + r.retry + ' s' : ''));
      }).catch(function (e) { say('hexelion', 'NO_DATA · ' + String(e && e.message || e).slice(0, 120)); });
    });
  }
  function open(building, p) {
    page = p;
    if (!leave) {
      leave = p.doc.createElement('button');
      leave.type = 'button'; leave.id = 'leave-building'; leave.textContent = 'Leave building';
      leave.style.minHeight = '44px'; leave.style.minWidth = '44px';
      leave.addEventListener('click', leaveBuilding);
      rackBtn = p.doc.createElement('button');
      rackBtn.type = 'button'; rackBtn.id = 'rack-ideas'; rackBtn.textContent = 'Rack ideas';
      rackBtn.style.minHeight = '44px'; rackBtn.style.minWidth = '44px';
      rackBtn.addEventListener('click', function () { fromRack('ideas'); });
      jewelBtn = p.doc.createElement('button');
      jewelBtn.type = 'button'; jewelBtn.id = 'rack-jewels'; jewelBtn.textContent = 'Jewels';
      jewelBtn.style.minHeight = '44px'; jewelBtn.style.minWidth = '44px';
      jewelBtn.addEventListener('click', function () { fromRack('jewels'); });
      if (p.entry) { p.entry.before(leave); p.entry.before(rackBtn); p.entry.before(jewelBtn); }
      p.doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && inside) { e.preventDefault(); leaveBuilding(); } });
    }
    if (inside && inside.id === building.id) { return; }
    inside = building; leave.hidden = false; rackBtn.hidden = false; jewelBtn.hidden = false; title(building);
    chain = { tic: 0, hash: null, sello: null };
    // Appended, never overwritten: what was just said (e.g. the HITL «Needs you» opening) stays in the state log.
    var said = p.state.textContent, here = 'Inside building ' + building.id + ' · ' + scriptOf(building).name + ' · Escape leaves';
    p.state.textContent = /Needs you: /.test(said) ? said + ' · ' + here : here;
    opening(building).forEach(function (f) { scripted(building, f.atoms[0].r); });
  }
  function ask(text) {
    if (!inside) { return false; }
    if (wantsVoices(text)) { voices(); return true; }
    if (wantsJewels(text)) { fromRack('jewels'); return true; }
    if (wantsIdeas(text)) { fromRack('ideas'); return true; }
    var b = inside;
    if (intentOf(text)) { scripted(b, reply(b, text, null).atoms[0].r); return true; }
    hexelion(b, text);
    return true;
  }

  var AtlasBuildingChat = { KINDS: KINDS, INTENTS: INTENTS, SCRIPTS: SCRIPTS, kindOf: kindOf, intentOf: intentOf, opening: opening, reply: reply, titleOf: titleOf, wantsIdeas: wantsIdeas, wantsJewels: wantsJewels, wantsVoices: wantsVoices, open: open, ask: ask };
  if (common) { module.exports = AtlasBuildingChat; }
  else { root.AtlasBuildingChat = AtlasBuildingChat; }
})(typeof globalThis === 'object' ? globalThis : this);
