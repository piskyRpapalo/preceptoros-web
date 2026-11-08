// The visitor view: a non-technical visitor sees only what they can enjoy. Panels marked data-depth="tech" (map
// counts, floor loading, walkers, zoom readout) stay in the page for builders and tests, but are veiled until the
// visitor asks for them with one button. A technical panel that carries something to press (a HITL «Needs you») is never
// veiled: the CSS rule skips it, and the button counts only the panels it really hides. The choice is kept on this device only (localStorage), never sent.
(function (root) {
  'use strict';
  var KEY = 'preceptoros.view.depth';

  // depth(stored) → 'visitor' | 'builder'. Anything unknown is the visitor view.
  function depth(stored) { return stored === 'builder' ? 'builder' : 'visitor'; }
  function label(d, n) { return d === 'builder' ? 'Hide the ' + n + ' technical panels' : 'Show the ' + n + ' technical panels'; }

  // The four panels a visitor gains nothing from; the page keeps them, this piece marks them and adds its button.
  var TECH = ['Map', 'Floor', 'Walkers', 'Zoom'];
  function mount(doc, store) {
    var list = doc.getElementById('voices');
    if (!list) { return null; }
    TECH.forEach(function (s) { var e = list.querySelector('[data-speaker="' + s + '"]'); if (e) { e.setAttribute('data-depth', 'tech'); } });
    var li = doc.createElement('li'), btn = doc.createElement('button');
    li.className = 'voice depth'; li.setAttribute('data-speaker', 'Builders'); li.setAttribute('data-cat', 'Welcome'); // the panel's category for Builders
    btn.type = 'button'; btn.id = 'depth-toggle'; btn.setAttribute('aria-controls', 'voices');
    li.appendChild(btn); list.appendChild(li);
    var d = 'visitor';
    function veiled() { return [].filter.call(list.querySelectorAll('[data-depth="tech"]'), function (e) { return !e.querySelector('button'); }).length; }
    try { d = depth(store && store.getItem(KEY)); } catch (e) { d = 'visitor'; }
    function apply() {
      list.classList.toggle('visitor', d === 'visitor');
      btn.setAttribute('aria-pressed', d === 'builder' ? 'true' : 'false');
      var text = label(d, veiled()); if (btn.textContent !== text) { btn.textContent = text; }
    }
    btn.addEventListener('click', function () {
      d = d === 'builder' ? 'visitor' : 'builder';
      try { if (store) { store.setItem(KEY, d); } } catch (e) { /* private window: the choice lasts this visit */ }
      apply();
    });
    apply();
    // panels draw their buttons later (HITL «Needs you»): recount when the list changes; writes only on a real change
    var MO = doc.defaultView && doc.defaultView.MutationObserver;
    if (MO) { new MO(apply).observe(list, { childList: true, subtree: true }); }
    return { depth: function () { return d; }, count: veiled };
  }

  // Tools · the app on this phone (2026-11-08). No APK is published (INSTALL_ANDROID.md §4), so the honest Android
  // format is the installed web app: the browser's own install offer, kept by /assets/pwa.js, made in one press.
  function install(pwa) {
    if (pwa && pwa.instalada && pwa.instalada()) { return { mode: 'installed', text: 'The app is installed on this phone.' }; }
    if (pwa && pwa.instalable && pwa.instalable()) { return { mode: 'offer', text: 'Install the app on this phone' }; }
    return { mode: 'menu', text: 'Your browser has not offered to install yet: open its ⋮ menu and choose Install app or Add to Home screen.' };
  }
  function installCard(doc, list, win) {
    var li = doc.createElement('li'), p = doc.createElement('p'), btn = doc.createElement('button'), a = doc.createElement('a');
    li.className = 'voice'; li.setAttribute('data-speaker', 'App'); li.setAttribute('data-cat', 'Tools');
    btn.type = 'button'; btn.id = 'app-install'; a.href = '/get-the-app/'; a.textContent = 'Other systems and the Termux path';
    li.appendChild(btn); li.appendChild(p); li.appendChild(a); list.appendChild(li);
    function draw() {
      var r = install(win && win.PreceptorPwa);
      btn.hidden = r.mode !== 'offer'; if (r.mode === 'offer') { btn.textContent = r.text; }
      p.hidden = r.mode === 'offer'; if (p.textContent !== r.text && r.mode !== 'offer') { p.textContent = r.text; }
    }
    btn.addEventListener('click', function () { win.PreceptorPwa.instala().then(draw); });
    if (win && win.addEventListener) { win.addEventListener('pwa-oferta', draw); }
    draw();
    return li;
  }

  var api = { KEY: KEY, TECH: TECH, depth: depth, label: label, mount: mount, install: install, installCard: installCard };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasVisitorView = api;
  if (root.document) {
    var go = function () { var s = null; try { s = root.localStorage; } catch (e) { s = null; } mount(root.document, s); var l = root.document.getElementById('voices'); if (l) { installCard(root.document, l, root); } };
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', go); } else { go(); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
