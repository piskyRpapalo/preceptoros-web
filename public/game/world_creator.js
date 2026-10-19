(function (root) {
  'use strict';
  var V = 'preceptoros.chat/1';
  var CEILING = 1024;
  var TITLE = 'The world creator';
  var BASE_PROMPT = 'I answer only from the lore this world holds. What it does not hold is NO_DATA, with its cause. Nothing you type leaves this device.';
  var SOURCE = 'study/09-lore.md@876a713';
  var BANNED = /\b(oraculo|notario|depin|tokens?|moneda|clearing|magia|oracle|notary|currency|magic)\b/i;
  var FRONTIER = /(^|[^0-9])\/[a-z]|@|https?:|\b\d{1,3}(\.\d{1,3}){3}\b/i;
  var STOP = ['the', 'and', 'for', 'are', 'was', 'who', 'what', 'how', 'why', 'does', 'this', 'that', 'with', 'from', 'its', 'his', 'her', 'you', 'your', 'our', 'about', 'into', 'can', 'not'];

  function words(s) {
    var raw = String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) || [];
    var out = [];
    raw.forEach(function (w) {
      if (w.length >= 3 && STOP.indexOf(w) < 0 && out.indexOf(w) < 0) { out.push(w); }
    });
    return out;
  }

  function score(qw, p) {
    var tw = words(p.title), xw = words(p.text), total = 0;
    qw.forEach(function (w) {
      if (tw.indexOf(w) >= 0) { total += 2; }
      if (xw.indexOf(w) >= 0) { total += 1; }
    });
    return total;
  }

  function bytes(o) {
    return unescape(encodeURIComponent(JSON.stringify(o))).length;
  }

  function corpusId() {
    var text = JSON.stringify(CORPUS), h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function sound(state, cause, audio) {
    if (audio && typeof audio.verb === 'function') { return audio.verb('rag', state, cause); }
    return {
      verbo: 'rag', estado: state, sonido: 'NO_DATA', sonido_causa: 'audio manager not loaded', motivo: null,
      texto: 'Sources: ' + (state === 'MEASURED' ? 'measured' : 'NO_DATA') + (cause ? ' (' + cause + ')' : ''),
      causa: cause || null
    };
  }

  function event(seal, cause, passage, text, state, audio) {
    return { v: V, seal: seal, origin: 'rag', cause: cause, passage: passage, text: text, sound: sound(state, cause, audio) };
  }

  function refuse(cause, audio) {
    return event('NO_DATA', cause, null, cause, 'NO_DATA', audio);
  }

  function guard(ev, audio) {
    if (BANNED.test(JSON.stringify(ev))) { return refuse('answer refused: banned word', audio); }
    if (bytes(ev) >= CEILING) { return refuse('answer refused: over the channel ceiling', audio); }
    return ev;
  }

  function ask(q, opts) {
    var o = opts || {};
    var corpus = o.corpus || CORPUS;
    var audio = o.audio !== undefined ? o.audio : root.AudioFeedbackManager;
    var qq = typeof q === 'string' ? q.trim() : '';
    if (qq.length === 0) { return refuse('empty question', audio); }
    if (FRONTIER.test(qq)) { return refuse('the frontier keeps paths, addresses and links on this device', audio); }
    var qw = words(qq), best = null, bestScore = 0;
    corpus.forEach(function (p) {
      var s = score(qw, p);
      if (s > bestScore) { best = p; bestScore = s; }
    });
    if (best === null || bestScore < 1) {
      return event('NO_DATA', "this world's lore holds nothing on that yet", null, "this world's lore holds nothing on that yet", 'NO_DATA', audio);
    }
    var passage = { id: best.id, title: best.title, source: best.source, seal: best.seal };
    return guard(event('MEDIDO', null, passage, best.text, 'MEASURED', audio), audio);
  }

  function panel(doc) {
    var d = doc || root.document;
    var section = d.createElement('section');
    section.className = 'world-chat';
    section.setAttribute('aria-labelledby', 'world-chat-title');

    var heading = d.createElement('h3');
    heading.id = 'world-chat-title';
    heading.textContent = TITLE;

    var prompt = d.createElement('p');
    prompt.className = 'world-chat-prompt';
    prompt.textContent = BASE_PROMPT;

    var form = d.createElement('form');
    form.className = 'world-chat-form';

    var label = d.createElement('label');
    label.setAttribute('for', 'world-chat-q');
    label.textContent = 'Ask this world';

    var input = d.createElement('input');
    input.id = 'world-chat-q';
    input.setAttribute('type', 'text');
    input.setAttribute('maxlength', '200');
    input.setAttribute('autocomplete', 'off');

    var button = d.createElement('button');
    button.setAttribute('type', 'submit');
    button.className = 'world-chat-ask';
    button.textContent = 'Ask';

    var out = d.createElement('div');
    out.className = 'world-chat-out';
    out.setAttribute('role', 'status');
    out.setAttribute('aria-live', 'polite');

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(button);
    section.appendChild(heading);
    section.appendChild(prompt);
    section.appendChild(form);
    section.appendChild(out);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var e = ask(input.value);
      while (out.firstChild) { out.removeChild(out.firstChild); }

      var stamp = d.createElement('span');
      stamp.className = 'world-chat-stamp';
      stamp.setAttribute('data-stamp', e.seal);
      stamp.textContent = e.seal;
      out.appendChild(stamp);

      var text = d.createElement('p');
      text.textContent = e.text;
      out.appendChild(text);

      if (e.passage) {
        var source = d.createElement('p');
        source.className = 'world-chat-source';
        source.textContent = 'Source: ' + e.passage.source + ' · ' + e.passage.seal;
        out.appendChild(source);
      }

      var voice = d.createElement('p');
      voice.className = 'world-chat-voice';
      voice.textContent = e.sound.texto;
      out.appendChild(voice);
    });

    return section;
  }

  var CORPUS = Object.freeze([
    Object.freeze({ id: 'world-creator', title: 'the world creator', text: 'Every node serves its own world. What creates a world is the lore and the doctrine that node holds: its canon, measured and signed. Two worlds with different skins and the same card are the same measurable object; the story stays, only the teller changes.', source: 'PLAN_CLAUDE VT7-VT8@804291e', seal: 'DECLARADO' }),
    Object.freeze({ id: 'the-game', title: 'TheGame', text: 'The game itself: a world that survived its break and lives on.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'abyssal-comic', title: 'the abyssal comic', text: 'The served art style: hard shadow, ink, flat tones. The beautiful web.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'rift', title: 'the Rift', text: "The world's break and its cause (canon ch. 2).", source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'personal-crack', title: 'the personal crack', text: "Each visitor's own break in the shell, drawn as negative space: two soft edges that open, never teeth. Rift ≠ personal crack.", source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'refuge', title: 'the Refuge', text: 'Where the world survived the Rift.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'preceptor-statue', title: 'the Preceptor Statue', text: 'The statue that watches.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'radio', title: 'the Radio', text: 'The only other voice.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'hexelion', title: 'Hexelion', text: "The reader behind the switch (see the Register's Entry 24).", source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'five-storms', title: 'the Five Storms', text: 'The canonical storms.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'real-graphic-style', title: 'the real-graphic style', text: 'The drawing style signed off by the Sovereign (2026-10-18), adopted in situ across app and web; text moves to the left side (A11Y). Official name pending.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'descent', title: 'the Descent', text: 'the abyssal work of seven sections (OPEN, CLIFF, START, TREMOR, SPLIT, FALL, GATE), drawn in the bubble language; determinism measured by bitmap hash: same scroll, same image.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'state-buoy', title: 'the State Buoy', text: "Proof of Tick with a game body: the floating machine that broadcasts the last measured tick. Its face is the machine's own record: alive: measured · fading: no news · NO_DATA · unattended 132 ticks. A buoy that invents a reading is a sunken lie.", source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'observatory', title: 'the Observatory', text: 'STALE made playable: the dome where old data shows its age on screen instead of hiding it. The player sees the staleness; the game never dresses it fresh.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'reef-of-gravestones', title: 'the Reef of Gravestones', text: 'zero retention WITH a receipt: the Necropolis with a game face. Nothing is deleted; everything that retires is buried with its cause, in coral.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'latency-crystal', title: 'the Latency Crystal', text: 'latency_crystal.js, measured on the metal: the visible cost of distance. Its color classes are hardware classes — gold, silver, bronze, dithering — a property of the measured link, never a quarantine shelf.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'stone-path', title: 'the Stone Path', text: 'the ledger made game: each successful interaction lays one smooth river stone on the golden-green-violet path; progress is the path\'s length — every stone a measured close. Append-only, walkable.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'valve', title: 'the Valve', text: 'one piece with two names, now absorbed: closed = safety and fog; open = omniscience, heat and risk. Its machine face is the Wasmtime cell (64 MiB, zero I/O); its law was already written in game dialect: no payload designed to crash the other\'s client.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'latency-crystals', title: 'Latency Crystals', text: 'tok/s with machine, date and sha256: a resource that IS its evidence.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'compressed-oxygen', title: 'Compressed Oxygen', text: 'the signed question-answer-verdict triple, bottled: an exchange that carries its own proof.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'breeders-medal', title: "the Breeder's Medal", text: 'verifiable recognition, never a balance.', source: SOURCE, seal: 'DECLARADO' }),
    Object.freeze({ id: 'customs-registers', title: "customs doesn't charge, it registers", text: "Doctrine: customs doesn't charge, it registers — the A2A market runs on receipts. That is why the resources never needed the prohibited names.", source: SOURCE, seal: 'DECLARADO' })
  ]);

  var api = { V: V, CEILING: CEILING, TITLE: TITLE, BASE_PROMPT: BASE_PROMPT, CORPUS: CORPUS, BANNED: BANNED, ask: ask, panel: panel, bytes: bytes, corpusId: corpusId, words: words };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.AtlasWorldCreator = api; }
})(this);
