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
  // mount(doc): give every voice its header, tag the log lines, and paint the Army voice from the visit.
  function mount(doc) {
    var voices = doc.getElementById('voices'), log = doc.getElementById('log');
    if (!voices) { return null; }
    Array.prototype.forEach.call(voices.querySelectorAll('[data-speaker]'), function (li) {
      if (li.querySelector(':scope > .who')) { return; }
      var h = doc.createElement('p'); h.className = 'who'; h.textContent = frame(li.dataset.speaker, li.dataset.title);
      li.setAttribute('aria-label', li.dataset.speaker);
      li.insertBefore(h, li.firstChild);
    });
    function tag(li) {
      if (li.nodeType !== 1 || li.dataset.speaker) { return; }
      var who = speakerOf(li.textContent, li.classList.contains('me'));
      li.dataset.speaker = who;
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
    return { voices: voices.querySelectorAll('[data-speaker]').length };
  }
  var P = { BYTES: BYTES, frame: frame, speakerOf: speakerOf, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = P; }
  else { root.AtlasTerminalPanel = P; if (root.document) { P.mounted = mount(root.document); } }
})(typeof globalThis === 'object' ? globalThis : this);
