// Both doors use the same mounted OpenWorld document for the lifetime of this page.
(function (win) {
  'use strict';
  var doc = win.document, frame = doc.getElementById('landing-world'), intro = doc.querySelector('body.landing-world > main');
  var door = doc.getElementById('start'), look = doc.getElementById('look-around'), result = doc.getElementById('landing-result');
  var film = doc.getElementById('acho-reel'), motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  var battery, active = false, pending = false, nav = win.navigator;
  function preview() {
    var link = nav.connection;
    var still = motion.matches || (link && (link.saveData || /2g/.test(link.effectiveType))) ||
      (battery && !battery.charging && battery.level < .25) || nav.deviceMemory < 3 || nav.hardwareConcurrency < 3;
    if (still) {
      if (film.hasAttribute('src')) { film.removeAttribute('src'); film.load(); }
    } else if (active || doc.hidden) { film.pause(); }
    else {
      if (!film.hasAttribute('src')) { film.src = '/assets/landing-acho.webm'; }
      film.play().catch(function () {});
    }
  }
  motion.addEventListener('change', preview);
  doc.addEventListener('visibilitychange', preview);
  if (nav.connection) { nav.connection.addEventListener('change', preview); }
  if (nav.getBattery) { nav.getBattery().then(function (b) {
    battery = b; b.addEventListener('chargingchange', preview); b.addEventListener('levelchange', preview); preview();
  }, preview); } else { preview(); }

  function showMap(push) {
    active = true; intro.inert = true; doc.body.classList.add('world-active');
    frame.setAttribute('aria-hidden', 'false'); frame.tabIndex = 0;
    if (push) { win.history.pushState({ preceptorOpenworld: true }, '', '/#openworld'); }
    frame.focus(); preview();
  }
  async function enter(event) {
    event.preventDefault();
    if (pending) { return; }
    pending = true;
    var signing = event.currentTarget === door;
    try {
      if (!frame.contentWindow.AtlasWelcome && doc.readyState !== 'complete') {
        result.textContent = 'Opening OpenWorld…';
        await new Promise(function (ready) { win.addEventListener('load', ready, { once: true }); });
      }
      var welcome = frame.contentWindow.AtlasWelcome;
      if (!welcome) { throw new Error('Map is loading. Try again.'); }
      if (signing) {
        result.textContent = 'Signing on this device…';
        await welcome.enter(true, doc.getElementById('skip-visit-tutorial').checked);
      } else { welcome.look(); }
      result.textContent = ''; showMap(true);
    } catch (error) { result.textContent = 'NO_DATA · ' + error.message; }
    finally { pending = false; }
  }
  door.addEventListener('click', enter); look.addEventListener('click', enter);
  win.addEventListener('popstate', function () {
    if (win.location.hash === '#openworld') { showMap(false); return; }
    active = false; intro.inert = false; doc.body.classList.remove('world-active');
    frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1; door.focus(); preview();
  });
  if (win.location.hash === '#openworld') { showMap(false); }
})(window);
