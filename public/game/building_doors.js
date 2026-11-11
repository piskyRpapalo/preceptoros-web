// Building doors (missions D1, D12, I3; docs/reparto-paneles-20261108.md §2: «buildings are panels»). A LIVE option
// whose piece is a panel already on this page opens that panel, through the same category button the gamepad presses;
// the sheet closes and focus lands on the first control the visitor can press there. Without a visit, a door into the
// visit says NO_DATA with its cause and opens nothing. An option without a door keeps its verdict: nothing is invented.
// Loaded by building_sheet.js on the first press of a LIVE option that has no action.
(function (root) {
  'use strict';
  // option id → the category (terminal_panel.js CATS) that holds its piece. Checked against the interiors contract.
  var DOORS = { 'play-without-account': 'Welcome', 'welcome-again': 'Welcome', 'land-tutorial': 'Welcome', voices: 'Communication', roll: 'Profile', pet: 'Profile', summons: 'Profile' };

  // Pure: verdict(id, button) → null (no door) or { open, line }. button is { hidden, label } or null when absent.
  function verdict(id, button) {
    var cat = DOORS[id];
    if (!cat) { return null; }
    if (!button) { return { open: false, line: 'NO_DATA · panel_not_on_this_page' }; }
    if (button.hidden) { return { open: false, line: 'NO_DATA · no_visit_yet · press Play now first' }; }
    return { open: true, cat: cat, line: 'opened · ' + (button.label || cat) };
  }

  // go(it, sheet, say) → true when a panel was opened. it = { id, say } is the sheet's option; say writes its live line.
  function go(it, sheet, say) {
    var doc = sheet.ownerDocument, win = doc.defaultView, id = it.id, head = it.say, cat = DOORS[id];
    var b = cat ? doc.querySelector('.cats [data-cat="' + cat + '"]') : null;
    var v = verdict(id, b ? { hidden: b.hidden, label: b.getAttribute('aria-label') } : null);
    if (!v) { return false; }
    say(head + ' · ' + v.line);
    if (!v.open) { return false; }
    if (b.getAttribute('aria-pressed') !== 'true') { b.click(); }
    var town = doc.getElementById('gp-town'); sheet.hidden = true; if (town) { town.setAttribute('aria-expanded', 'false'); } // as settings_sheet.js does
    var first = null;
    Array.prototype.forEach.call(doc.querySelectorAll('#voices [data-speaker] button'), function (x) {
      var li = x.closest('[data-speaker]');
      if (!first && li.dataset.cat === cat && !x.disabled && !x.hidden && x.getClientRects().length) { first = x; }
    });
    (first || b).focus();
    if (win && win.CustomEvent) { doc.dispatchEvent(new win.CustomEvent('building:act', { detail: { name: 'door:' + id } })); }
    return true;
  }

  var api = { DOORS: DOORS, verdict: verdict, go: go };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasBuildingDoors = api;
})(typeof window !== 'undefined' ? window : globalThis);
