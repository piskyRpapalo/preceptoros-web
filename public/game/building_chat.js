// P6 (2.5D village plan, "Buildings with a chatbot"): every building of the colony catalogue talks, in the browser,
// with no server. Pure: no random numbers, no clock reads, no I/O. A building's kind is the tutorial cabin (its node is
// "cabin") or its shape from colonia_edificios.js (dome, tower, block). Each kind has a script: a greeting, what it
// measures, what it offers, and short replies keyed by simple intents. A question with no scripted intent would need a
// model: it goes to chunk_router.js, and with no model installed the answer is its honest NO_DATA cause. Nothing is
// invented. Every line is a bubble-language frame under 1,024 UTF-8 bytes (state_frames.js).
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

  // frame(building, t, text, seal) → a bubble frame that carries one line of the conversation as its sentence.
  function frame(building, t, text, seal) {
    var line = String(text);
    return {
      v: 'preceptoros.bubble/1', id: 'chat.' + building.id, t: t, cv: [120, 110], seal: seal,
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

  // open(building, page) / ask(text): the DOM glue of /openworld/ (not run by the pure cases). page = { doc, state, entry,
  // line(cls, text), router(then) }. The lines go to the chat log, which face_terminal.js copies into the radio, so the
  // screen reader hears the building as it hears the map. While a building is open, the chat input asks its bot; Escape
  // or the 44 px «Leave building» button closes it, and #state says so.
  var inside = null, page = null, leave = null;
  function leaveBuilding() {
    if (!inside) { return; }
    var id = inside.id; inside = null; leave.hidden = true;
    page.state.textContent = 'Left building ' + id;
  }
  function open(building, p) {
    page = p;
    if (!leave) {
      leave = p.doc.createElement('button');
      leave.type = 'button'; leave.id = 'leave-building'; leave.textContent = 'Leave building';
      leave.style.minHeight = '44px'; leave.style.minWidth = '44px';
      leave.addEventListener('click', leaveBuilding);
      if (p.entry) { p.entry.before(leave); }
      p.doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && inside) { e.preventDefault(); leaveBuilding(); } });
    }
    if (inside && inside.id === building.id) { return; }
    inside = building; leave.hidden = false;
    // Appended, never overwritten: what was just said (e.g. the HITL «Needs you» opening) stays in the state log.
    var said = p.state.textContent, inside = 'Inside building ' + building.id + ' · ' + scriptOf(building).name + ' · Escape leaves';
    p.state.textContent = /^Needs you: /.test(said) ? said + ' · ' + inside : inside;
    opening(building).forEach(function (f) { p.line('', f.atoms[0].r); });
  }
  function ask(text) {
    if (!inside) { return false; }
    var b = inside;
    page.router(function (R) { page.line('', reply(b, text, R).atoms[0].r); });
    return true;
  }

  var AtlasBuildingChat = { KINDS: KINDS, INTENTS: INTENTS, SCRIPTS: SCRIPTS, kindOf: kindOf, intentOf: intentOf, opening: opening, reply: reply, open: open, ask: ask };
  if (common) { module.exports = AtlasBuildingChat; }
  else { root.AtlasBuildingChat = AtlasBuildingChat; }
})(typeof globalThis === 'object' ? globalThis : this);
