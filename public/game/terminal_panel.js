// The compact terminal of /openworld/ (the Sovereign p0, buzon#30, 2026-11-02): ONE map, ONE panel. Everything the page
// says to the visitor lives in the chat panel as a voice with its speaker's name: Guide, Tutorial, Map, Floor, Walkers,
// Zoom, House, Army, Radio. Each voice is a Acho frame whose header names who speaks (under 1,024 UTF-8 bytes); the
// header is real text, so the line read by a screen reader starts with its speaker, never colour alone. Lines of the
// conversation log (#log) carry their speaker as data-speaker. It replaces the tab sheets (retirados/terminal/).
// Pure core: no clock, no randomness, no network.
(function (root) {
  'use strict';
  var BYTES = 1024;
  function bytes(s) { return typeof TextEncoder === 'function' ? new TextEncoder().encode(s).length : unescape(encodeURIComponent(s)).length; }
  // Every chatbot line is stored in the same language as the map. The DOM text is its accessible rendering.
  function speechFrame(id, speaker, text) {
    var body = String(text), sentence = String(speaker) + ' · ' + body;
    var frame = { v: 'preceptoros.acho/1', id: 'chat.' + id, t: 0, cv: [412, 96],
      atoms: [{ k: 'voice.' + id, r: sentence, i: [] }], bands: ['paper', 'ink', 'cyan'], change: ['speech'],
      sound: 'NO_DATA: this line declares no sound wave', soundCause: 'speech frame has no measured harmonic table' };
    if (/^NO_DATA(?:\b| ·)/.test(body)) { frame.seal = 'NO_DATA'; }
    if (bytes(JSON.stringify(frame)) < BYTES) { return frame; }
    var cause = 'NO_DATA · speech exceeds the 1,024-byte Acho frame limit';
    return { v: 'preceptoros.acho/1', id: 'chat.' + id, t: 0, cv: [412, 96], seal: 'NO_DATA',
      atoms: [{ k: 'voice.' + id, r: String(speaker) + ' · ' + cause, i: [] }], bands: ['paper', 'ink', 'cyan'], change: ['speech'],
      sound: 'NO_DATA: this line declares no sound wave', soundCause: 'speech frame has no measured harmonic table' };
  }
  // frame(speaker, title) → the header text of a voice. A voice with no speaker, or a header of 1,024 bytes or more, is refused.
  function frame(speaker, title) {
    var who = String(speaker || '').trim();
    if (!who) { throw new Error('a voice without a speaker is refused'); }
    var head = title ? who + ' · ' + String(title).trim() : who;
    if (bytes(head) >= BYTES) { throw new Error('voice header of ' + bytes(head) + ' UTF-8 bytes (limit < ' + BYTES + ')'); }
    return head;
  }
  // speakerOf(text, mine) → who says a line of the conversation log: You, the named model or bot («Name · text»), or the Guide.
  function speakerOf(text, mine) {
    if (mine) { return 'You'; }
    var m = /^([^·:]{1,60}?) · /.exec(String(text || ''));
    return m && !/^NO_DATA/.test(m[1]) ? m[1] : 'Guide';
  }
  // LAS VOCES (the Sovereign, 2026-11-03): every line of the conversation names who speaks, shaped by the piece that speaks
  // it — from the chunk model on this device to the contributors' models on GitHub. The panel is immutable: this table is
  // pinned by sha256 in atlas/voices_cases.mjs, so a new voice is a new signed version, never a silent edit. It lives on
  // GitHub and on the web; it is what an ephemeral visit acts through. Row: id, title, what it is, where it runs.
  var VOCES = Object.freeze([
    ['you', 'You', 'the visitor', 'this device'],
    ['script', '', 'the building\'s script (its title is the building)', 'this browser'],
    ['chunk', 'Guide · SmolLM2 135M', 'chunk model: 5 same-origin chunks, each checked by SHA-256', 'this device'],
    ['hexelion', 'Hexelion', 'the rack\'s model, behind the edge door', 'the rack, through api.preceptoros.org'],
    ['rack', 'Rack · study', 'the rack\'s canonical ideas (ai-index.json)', 'the study repository'],
    ['jewels', 'Rack · jewels', 'the system\'s jewels (odd/JOYAS.md)', 'the web repository'],
    ['claude', 'Contributor · Claude', 'contributor model', 'GitHub: pull requests and receipts'],
    ['codex', 'Contributor · Codex', 'contributor model', 'GitHub: pull requests and receipts'],
    ['mistral', 'Contributor · Mistral', 'contributor model', 'GitHub: pull requests and receipts'],
    ['glm', 'Contributor · GLM', 'contributor model (the Mesa)', 'GitHub: pull requests and receipts']
  ].map(Object.freeze));
  function voz(id) { for (var i = 0; i < VOCES.length; i++) { if (VOCES[i][0] === id) { return VOCES[i]; } } return null; }
  // decir(doc, log, id, text, title) → appends one line «Title · text» with its voice; an unknown voice is refused.
  function decir(doc, log, id, text, title) {
    var v = voz(id); if (!v) { throw new Error('unknown voice: ' + id); }
    var li = doc.createElement('li'), who = frame(title || v[1]), acho = speechFrame(id, who, text);
    li.dataset.voice = id; li.dataset.speaker = who; li.title = v[2] + ' · ' + v[3];
    li.dataset.acho = JSON.stringify(acho);
    li.className = 'turn ' + (id === 'you' ? 'me' : acho.seal === 'NO_DATA' ? 'nodata' : 'them');
    li.textContent = acho.atoms[0].r; log.appendChild(li); return li;
  }
  // TF-2 (buzon#30, 2026-11-02): the voices go in four category buttons; one category is visible, the rest are buttons.
  // The brain (#map-brain), the log and the form stay fixed under the panel: they are the single chatbot's surface.
  var CATS = [['Start', ['Tutorial', 'Welcome', 'Guide']], ['Explore', ['Map', 'Floor', 'Walkers', 'Zoom']], ['Play', ['House', 'Army']], ['About', ['Radio']]];
  // categoryOf(speaker) → its category; a speaker no category names goes to About, never lost.
  function categoryOf(speaker) {
    for (var i = 0; i < CATS.length; i++) { if (CATS[i][1].indexOf(speaker) >= 0) { return CATS[i][0]; } }
    return 'About';
  }
  function categories(doc, voices) {
    if (voices.parentNode.querySelector(':scope > .cats')) { return null; }
    var bar = doc.createElement('div'), buttons = {}, current = null;
    bar.className = 'cats'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Voices by category');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px';
    function show(cat) {
      current = cat;
      Array.prototype.forEach.call(voices.querySelectorAll('[data-speaker]'), function (li) { li.style.display = li.dataset.cat === cat ? '' : 'none'; });
      CATS.forEach(function (c) { var b = buttons[c[0]]; b.setAttribute('aria-pressed', String(c[0] === cat)); if (c[0] === cat) { b.textContent = c[0]; } });
    }
    CATS.forEach(function (c) {
      var b = doc.createElement('button'); b.type = 'button'; b.textContent = c[0]; b.dataset.cat = c[0];
      b.style.cssText = 'min-height:44px;min-width:44px;padding:8px 14px;border:2px solid currentColor;border-radius:var(--radius);background:var(--bg);color:var(--fg);font:inherit';
      b.addEventListener('click', function () { show(c[0]); });
      buttons[c[0]] = b; bar.appendChild(b);
    });
    // Under the voices, like a phone's bottom tabs: the door's «Play now» stays above the fold (measured 390×844).
    voices.parentNode.insertBefore(bar, voices.nextSibling);
    // A voice that speaks while its category is hidden marks its button («•»), so nothing said is lost from sight.
    new root.MutationObserver(function (ch) {
      ch.forEach(function (c) {
        var n = c.target.nodeType === 1 ? c.target : c.target.parentNode, li = n && n.closest && n.closest('[data-cat]');
        if (li && li.dataset.cat !== current && buttons[li.dataset.cat]) { buttons[li.dataset.cat].textContent = li.dataset.cat + ' •'; }
      });
    }).observe(voices, { subtree: true, childList: true, characterData: true });
    show('Start');
    return show;
  }
  // mount(doc): give every voice its header, tag the log lines, and paint the Army voice from the visit.
  function mount(doc) {
    var voices = doc.getElementById('voices'), log = doc.getElementById('log');
    if (!voices) { return null; }
    Array.prototype.forEach.call(voices.querySelectorAll('[data-speaker]'), function (li) {
      li.dataset.cat = categoryOf(li.dataset.speaker);
      if (li.querySelector(':scope > .who')) { return; }
      var h = doc.createElement('p'); h.className = 'who'; h.textContent = frame(li.dataset.speaker, li.dataset.title);
      li.setAttribute('aria-label', li.dataset.speaker);
      li.insertBefore(h, li.firstChild);
    });
    var show = categories(doc, voices);
    function tag(li) {
      if (li.nodeType !== 1 || li.dataset.speaker) { return; }
      var who = speakerOf(li.textContent, li.classList.contains('me'));
      li.dataset.speaker = who;
      if (!li.dataset.acho) { li.dataset.acho = JSON.stringify(speechFrame(who.toLowerCase().replace(/[^a-z0-9]+/g, '-'), who, li.textContent.replace(new RegExp('^' + who.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' · '), ''))); }
      // The speaker is shown before the text unless the line already starts with it (CSS ::before, see the page).
      if (li.textContent.indexOf(who + ' · ') !== 0) { li.classList.add('who-before'); }
    }
    if (log) {
      Array.prototype.forEach.call(log.children, tag);
      new root.MutationObserver(function (ch) { ch.forEach(function (c) { Array.prototype.forEach.call(c.addedNodes, tag); }); }).observe(log, { childList: true });
    }
    // Army voice: the troops adopted in this visit (from visitor_play's render), or NO_DATA with its cause; the link stays.
    var army = doc.getElementById('army-visit'), play = doc.getElementById('visitor-play');
    function paintArmy(troops) {
      if (!army) { return; }
      army.textContent = !troops || !troops.length ? 'NO_DATA: no troops adopted in this visit yet.' : 'Troops of this visit: ' + troops.length + '.';
    }
    paintArmy(null);
    if (play) {
      play.addEventListener('visitor:render', function (e) { paintArmy(e.detail && e.detail.state && e.detail.state.troops); });
      play.addEventListener('visitor:end', function () { paintArmy(null); });
    }
    return { voices: voices.querySelectorAll('[data-speaker]').length, show: show };
  }
  var P = { BYTES: BYTES, CATS: CATS, VOCES: VOCES, voz: voz, decir: decir, speechFrame: speechFrame, categoryOf: categoryOf, frame: frame, speakerOf: speakerOf, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = P; }
  else { root.AtlasTerminalPanel = P; if (root.document) { P.mounted = mount(root.document); } }
})(typeof globalThis === 'object' ? globalThis : this);
