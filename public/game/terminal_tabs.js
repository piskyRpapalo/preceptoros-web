// The terminal tabs of /openworld/ (the layout of the first atlantis/zombie terminals, retirados/face/): Map shows the
// map; News, Summons and Army open a sheet that covers it. ARIA tabs: arrow keys, Home and End move between tabs;
// Enter, Space or a tap opens; Escape inside a sheet goes back to the map and to its tab. A starting visit opens Summons.
(function (root) {
  'use strict';
  var doc = root.document, list = doc.querySelector('#map [role="tablist"]');
  if (!list) { return; }
  var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  function sheetOf(tab) { var id = tab.getAttribute('aria-controls'); return id && id !== 'surface' ? doc.getElementById(id) : null; }
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab, sheet = sheetOf(t);
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      if (sheet) { sheet.hidden = !on; }
    });
    if (focus) { tab.focus(); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t, false); });
    t.addEventListener('keydown', function (e) {
      var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) { return; }
      e.preventDefault(); select(tabs[(to + tabs.length) % tabs.length], true);
    });
    var sheet = sheetOf(t);
    if (sheet) { sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); select(tabs[0], false); t.focus(); } }); }
  });
  var play = doc.getElementById('visitor-play');
  if (play) { play.addEventListener('visitor:changed', function () { var s = doc.getElementById('tab-summons'); if (s && s.getAttribute('aria-selected') !== 'true' && doc.getElementById('visitor-beacon')) { select(s, false); } }); }
  root.AtlasTerminalTabs = { select: function (id) { var t = doc.getElementById(id); if (t) { select(t, false); } } };
})(globalThis);
