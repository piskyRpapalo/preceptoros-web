// Predefined links into the map (Sovereign, 2026-11-09: «enlaces predefinidos y ruteos seleccionables»). A link such as
// /openworld/?go=chat or /openworld/?go=building&id=coliseum opens that place once the map is ready; ?ask= fills the
// guide's question box and never sends it. The same routes are the Android app's shortcuts (manifest.webmanifest) and the
// collaborators' first steps (/get-the-app/). Loaded by map_aura.js only when the address asks for it. Nothing is signed,
// sent or bought by a link: a link only opens and fills; the visitor presses.
(function (root) {
  'use strict';
  var ROUTES = ['map', 'help', 'chat', 'guide', 'hexelion', 'building'];
  var BUILDINGS = ['hostel', 'coliseum', 'choir', 'workshop', 'lottery', 'customs', 'agora', 'visitor-house', 'doctor'];
  // Pure: parse(search) → { go, id, ask } with only known values; anything else is dropped, never guessed.
  function parse(search) {
    var p = new URLSearchParams(String(search || '')), go = p.get('go'), id = p.get('id'), ask = p.get('ask');
    var out = { go: ROUTES.indexOf(go) >= 0 ? go : null, id: null, ask: null };
    if (out.go === 'building') { out.id = BUILDINGS.indexOf(id) >= 0 ? id : null; if (!out.id) { out.go = null; } }
    if (typeof ask === 'string' && ask.trim() && new TextEncoder().encode(ask).length <= 600) { out.ask = ask.trim(); }
    return out;
  }
  function cat(doc, name) { var b = doc.querySelector('.cats [data-cat="' + name + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') { b.click(); } return !!b; }
  function who(doc, value) {
    var m = doc.getElementById('chat-destination'); if (!m) { return false; }
    m.value = value; m.dispatchEvent(new Event('change')); return true;
  }
  // open(doc, route) → true when the place is open (or nothing was asked); false while the map is not ready yet.
  function open(doc, r) {
    if (r.go === 'help') { if (!cat(doc, 'Welcome')) { return false; } }
    if (r.go === 'chat') { if (!cat(doc, 'Communication')) { return false; } var t = doc.getElementById('open-chat-text'); if (t) { t.focus(); } }
    if (r.go === 'guide' || r.go === 'hexelion' || (r.ask && !r.go)) {
      if (!cat(doc, 'Communication')) { return false; }
      if (root.AtlasRadioChat && root.AtlasRadioChat.canal) { root.AtlasRadioChat.canal('chat'); }
      if (!who(doc, r.go === 'hexelion' ? 'hexelion' : 'local')) { return false; }
    }
    if (r.go === 'building') {
      var BS = root.AtlasBuildingSheet; if (!BS || !BS.open || !BS.open(r.id)) { return false; }
    }
    if (r.ask) { var q = doc.getElementById('question'); if (!q) { return false; } q.value = r.ask; q.focus(); }
    return true;
  }
  function start(doc) {
    var r = parse(root.location && root.location.search), tries = 0;
    if (!r.go && !r.ask) { return; }
    (function again() { if (open(doc, r) || ++tries > 40) { return; } root.setTimeout(again, 250); })(); // the map loads its parts lazily
  }
  var api = { ROUTES: ROUTES, BUILDINGS: BUILDINGS, parse: parse, open: open };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasDeepLinks = api;
  if (root.document && root.document.querySelector) { start(root.document); }
})(globalThis);
