// The landing's Play link (#start; the old OpenWorld door is retired, 2026-11-09) reveals the one embedded map instance instead of navigating to a second renderer.
(function (win) {
  'use strict';
  var doc = win.document, frame = doc.getElementById('landing-world'), intro = doc.querySelector('body.landing-world > main');
  var door = doc.getElementById('start'), active = false;
  if (!frame || !intro || !door) { return; }

  function tellMap() {
    try { frame.contentWindow.postMessage({ type: 'preceptoros:enter-openworld' }, win.location.origin); } catch (e) {}
  }
  function reveal(push) {
    active = true;
    doc.body.classList.add('world-active');
    intro.inert = true;
    frame.setAttribute('aria-hidden', 'false');
    frame.tabIndex = 0;
    if (push) { win.history.pushState({ preceptorOpenworld: true }, '', '/#openworld'); }
    frame.focus();
    tellMap();
  }
  function restore() {
    active = false;
    doc.body.classList.remove('world-active');
    intro.inert = false;
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    door.focus();
  }
  door.addEventListener('click', function (event) { event.preventDefault(); reveal(true); });
  frame.addEventListener('load', function () { if (active) { tellMap(); } });
  win.addEventListener('popstate', function () { if (active) { restore(); } else if (win.location.hash === '#openworld') { reveal(false); } });
  if (win.location.hash === '#openworld') { reveal(false); }
})(window);
