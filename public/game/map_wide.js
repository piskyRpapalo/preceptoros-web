// G1 · LA VENTANA GRANDE (odd/tasks/mundo-grande.md, web#608): one button gives the map the whole screen and gives it
// back. Measured on the edge phone (360×716 CSS): the map had 348 px of height, half the screen, while 1,519 cells were
// already loaded. Only the frame changes (law P5): the chat section steps aside, the canvas grows, the page redraws
// through its own resize path. No state, fog or result is touched; no clock, no random numbers, no network.
// Keyboard: the button is in the map tools (Tab reaches it), Escape leaves; the change is spoken in #zoom-state.
(function (raiz) {
  'use strict';
  var CLASE = 'map-wide';
  var CSS = 'html.' + CLASE + ' #chat{display:none}' +
    'html.' + CLASE + ' main{grid-template-rows:1fr}' +
    'html.' + CLASE + ' #map{border-bottom:0;min-height:100vh;min-height:100dvh}' +
    'html.' + CLASE + ' #stage .surface{flex:1 1 0;min-height:0}' +
    '#map-wide svg{width:22px;height:22px;display:block;margin:auto}';
  // Four corner arrows, drawn: no glyph that a phone font may lack.
  var ICONO = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
    '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

  // label(abierto) → the button's words in each state (pure).
  function label(abierto) { return abierto ? 'Back to the chat' : 'Explore: the map fills the screen'; }

  function attach(doc) {
    var html = doc.documentElement, barra = doc.getElementById('zoom-controls');
    if (!barra || doc.getElementById('map-wide')) { return null; }
    var st = doc.createElement('style'); st.id = 'map-wide-css'; st.textContent = CSS; doc.head.appendChild(st);
    var b = doc.createElement('button'); b.type = 'button'; b.id = 'map-wide'; b.innerHTML = ICONO;
    b.style.minHeight = '44px'; b.style.minWidth = '44px';
    function say(t) { var s = doc.getElementById('zoom-state'); if (s) { s.textContent = t; } }
    function pon(abierto) {
      html.classList.toggle(CLASE, abierto);
      b.setAttribute('aria-pressed', abierto ? 'true' : 'false'); b.setAttribute('aria-label', label(abierto)); b.title = label(abierto);
      // The page sizes the canvas from its box on resize: ask it to measure again.
      var v = doc.defaultView; if (v && v.dispatchEvent) { v.dispatchEvent(new v.Event('resize')); }
    }
    pon(false);
    b.addEventListener('click', function () {
      var abierto = !html.classList.contains(CLASE); pon(abierto);
      say(abierto ? 'Explore · the map fills the screen. Escape or the same button brings the chat back.' : 'The map is back beside the chat.');
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && html.classList.contains(CLASE)) { pon(false); say('The map is back beside the chat.'); b.focus(); }
    });
    barra.insertBefore(b, barra.firstChild);
    return { open: function () { pon(true); }, close: function () { pon(false); } };
  }

  var api = { attach: attach, label: label, CLASE: CLASE };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  raiz.AtlasMapWide = api;
  var doc = raiz.document;
  if (doc && doc.getElementById) {
    var go = function () { attach(doc); };
    if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', go); } else { go(); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
