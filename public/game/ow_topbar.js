// The top bar (Sovereign, 2026-11-23): three icons at the top left — Talk (Chat Live), Sound (a speaker with Radio and
// the audio-only mode for blind players) and Echoes (the world's events, the visit's Quests and the web version, «para
// no perdernos»). Players and Nodes become two quiet «text + number» chips at the top right; Share lives in Settings;
// «Walk crab» leaves the map (the crab stick walks; its directions stay for the keyboard). Every action is the real
// piece it already was: the channel select of terminal_panel, AtlasAudioOnly, the quest board of visitor_view.
// No network except reading /atlas-world.json for the version once. Escape closes a menu; 44 px targets.
(function (root) {
  'use strict';
  var doc = root.document, version = null;
  // Pure: the menu rows for each icon (id, label, what it does). Tested in ow_topbar_cases.
  var MENUS = {
    sound: [['radio', 'Radio'], ['audio', 'Audio only · for blind players']],
    echoes: [['echoes', 'Echoes · what the world said'], ['quests', 'Quests · what this visit did'], ['boss', 'Tide boss · demo event']]
  };
  function vline(v) { return v && /^preceptoros-\d{4}-\d+-[a-z]+$/.test(v) ? 'Web version ' + v.split('-').pop() + ' · ' + v : 'Web version NO_DATA · not read'; }
  function el(tag, props) { var e = doc.createElement(tag); Object.keys(props || {}).forEach(function (k) { if (k === 'text') { e.textContent = props[k]; } else { e.setAttribute(k, props[k]); } }); return e; }
  function mount() {
    var com = doc.getElementById('map-communication'); if (!com || com.dataset.tb) { return; }
    var talk = com.querySelector(':scope > button'), chan = com.querySelector('select'); if (!talk || !chan) { return; }
    com.dataset.tb = '1'; com.classList.add('tb'); talk.classList.add('tb-ic', 'tb-talk');
    var line = el('p', { id: 'tb-line', role: 'status', 'aria-live': 'polite', class: 'tb-line' });
    function say(t) { line.textContent = t; }
    function channel(v) { if (talk.getAttribute('aria-pressed') !== 'true') { talk.click(); } chan.value = v; chan.dispatchEvent(new root.Event('change')); }
    var open = null;
    function shut(back) { if (!open) { return; } open.menu.hidden = true; open.btn.setAttribute('aria-expanded', 'false'); if (back) { open.btn.focus(); } open = null; }
    function icon(id, name, label, rows, act) {
      var b = el('button', { type: 'button', id: id, class: 'tb-ic tb-' + name, 'aria-label': label, title: label, 'aria-expanded': 'false', 'aria-controls': id + '-menu', text: name === 'sound' ? 'Sound' : 'Echoes' });
      var m = el('div', { id: id + '-menu', class: 'tb-menu', role: 'group', 'aria-label': label }); m.hidden = true;
      rows.forEach(function (r) { var x = el('button', { type: 'button', id: 'tb-' + r[0], class: 'tb-row', text: r[1] }); if (root.AtlasGamepad && root.AtlasGamepad.paint) { root.AtlasGamepad.paint(x, r[1]); } x.addEventListener('click', function () { act(r[0], m); }); m.appendChild(x); });
      b.addEventListener('click', function () { var was = open && open.btn === b; shut(false); if (was) { return; } m.hidden = false; b.setAttribute('aria-expanded', 'true'); open = { btn: b, menu: m }; if (name === 'echoes') { echoes(m); } var f = m.querySelector('button'); if (f) { f.focus(); } });
      m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); shut(true); } });
      com.appendChild(b); (com.parentNode || com).appendChild(m); return b;
    }
    icon('tb-sound', 'sound', 'Sound: radio and audio only', MENUS.sound, function (id) {
      if (id === 'radio') { shut(false); channel('radio'); say('Radio · tuned in the Chat Live panel'); return; }
      var A = root.AtlasAudioOnly, r = A ? A.toggle(doc, root) : null; say(r ? r.line : 'Audio only · NO_DATA · piece_not_loaded');
    });
    icon('tb-echoes', 'echoes', 'Echoes: events, quests and the web version', MENUS.echoes, function (id, m) {
      if (id === 'echoes') { shut(false); channel('echoes'); say('Echoes · open in the Chat Live panel'); return; }
      if (id === 'quests') { quests(m); return; }
      if (id === 'boss') { var go = function () { if (root.AtlasTideBoss) { root.AtlasTideBoss.show(m); } else { say('Tide boss · NO_DATA · piece_not_loaded'); } };
        if (root.AtlasTideBoss) { go(); } else { var sc = el('script', { src: '/game/tide_boss.js' }); sc.onload = go; sc.onerror = go; doc.head.appendChild(sc); } }
    });
    com.appendChild(line);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { shut(true); } });
    doc.addEventListener('pointerdown', function (e) { if (open && !com.contains(e.target) && !open.menu.contains(e.target)) { shut(false); } });
  }
  // The visit's quest board, mirrored inside the Echoes menu: its Claim buttons press the real ones.
  function quests(m) {
    var old = m.querySelector('.tb-quests'); if (old) { old.remove(); return; }
    var src = doc.querySelector('#voices section.quests'), box = el('div', { class: 'tb-quests' });
    if (!src) { box.textContent = 'Quests · NO_DATA · start a visit first'; m.appendChild(box); return; }
    var copy = src.cloneNode(true), real = src.querySelectorAll('button');
    copy.removeAttribute('aria-labelledby'); [].forEach.call(copy.querySelectorAll('[id]'), function (x) { x.removeAttribute('id'); });
    [].forEach.call(copy.querySelectorAll('button'), function (b, i) { b.addEventListener('click', function () { if (real[i]) { real[i].click(); } box.remove(); quests(m); }); });
    box.appendChild(copy); m.appendChild(box);
  }
  function echoes(m) {
    var F = root.AtlasEchoFeed, fb = m.querySelector('.tb-feed'); if (F) { if (!fb) { fb = el('div', { class: 'tb-feed' }); m.insertBefore(fb, m.querySelector('#tb-quests')); } F.render(fb); } // the live echoes first (echo_feed.js)
    var p = m.querySelector('.tb-version') || el('p', { class: 'tb-version' }); p.textContent = vline(version); m.appendChild(p);
    if (version || !root.fetch) { return; }
    root.fetch('/atlas-world.json').then(function (r) { return r.json(); }).then(function (j) { version = j && j.version_sw; p.textContent = vline(version); }).catch(function () { p.textContent = vline(null); });
  }
  // Share moves into Settings: one more row of the Device group presses the real Share (its consent stays in its panel).
  function share() {
    var s = doc.getElementById('settings-sheet'), b = doc.getElementById('online-share'); if (!s || !b || doc.getElementById('set-share')) { return; }
    var ul = s.querySelector('.bs-list'); if (!ul) { return; }
    var li = doc.createElement('li'), x = el('button', { type: 'button', id: 'set-share', class: 'bs-card', text: 'Share my crab with nearby visitors' });
    if (root.AtlasGamepad && root.AtlasGamepad.paint) { root.AtlasGamepad.paint(x, 'Share'); }
    x.addEventListener('click', function () { b.click(); }); li.appendChild(x); ul.appendChild(li);
  }
  function pass() { mount(); share(); }
  if (doc && doc.head && !doc.getElementById('tb-css')) { var l = el('link', { id: 'tb-css', rel: 'stylesheet', href: '/game/ow_topbar.css' }); doc.head.appendChild(l); }
  if (doc && root.MutationObserver) { var q = false; new root.MutationObserver(function () { if (q) { return; } q = true; root.requestAnimationFrame(function () { q = false; pass(); }); }).observe(doc.body, { childList: true, subtree: true }); pass(); }
  var api = { MENUS: MENUS, vline: vline };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasTopBar = api;
})(typeof window !== 'undefined' ? window : globalThis);
