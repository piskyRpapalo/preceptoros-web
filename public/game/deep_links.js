
(function () {
  'use strict';
  var CONTRACTS = {
    'summon.tc1': { sheet: null, focus: '#summon-access', title: 'Summon a wave (TC1)',
      what: 'Opens the summon sheet and preselects treasure class TC1. The act itself still needs your signature; this link only lands on the card.',
      needs: 'visitor key (created on device, never leaves it)', cost: '50 copper per attempt (game resource, game cycles)' },
    'workshop.dissolve': { sheet: 'taller', focus: '.atlas-hud', title: 'Workshop · dissolve a wave into residue',
      what: 'Opens the Workshop on the dissolve step. Nothing is bought.', needs: 'visitor key',
      cost: '1 wave; gives 1 g residue per edge, three times for a Leviathan' },
    'workshop.sand': { sheet: 'taller', focus: '.atlas-hud', title: 'Workshop · sand a stat',
      what: 'Opens the Workshop on the sanding step. Raises one stat, never adds edges.', needs: 'visitor key, measured residue balance',
      cost: 'residue g, rising per level' },
    'lighthouse.move': { sheet: 'casa', focus: '#atlas-juego', title: 'Move the lighthouse (Hexelion)',
      what: 'Focuses the lighthouse destination list (camera move only).', needs: 'nothing', cost: '0' },
    'transparency.log': { sheet: null, focus: '#radio-chat-alterna', title: 'Transparency log (radio channels)',
      what: 'Opens the communication panel on the sealed log channel.', needs: 'nothing', cost: '0' },
    'identity.create': { sheet: null, focus: '#identity', title: 'Create your visitor key',
      what: 'Moves focus to the key creation control at the top of the page. The private key never leaves the device.',
      needs: 'nothing', cost: '0' }
  };
  function action() {
    try { return new URLSearchParams(window.location.search).get('action') || ''; } catch (e) { return ''; }
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }
  function monta() {
    var id = action();
    if (!id) { return; }
    var c = CONTRACTS[id];
    var prev = document.getElementById('deep-link');
    if (prev) { prev.remove(); }
    var box = el('section', 'deep-link');
    box.id = 'deep-link'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'deep-link-t');
    var prevFocus = document.activeElement;
    if (c) {
      box.appendChild(el('h2', 'deep-link-t', c.title)).id = 'deep-link-t';
      box.appendChild(el('p', 'deep-link-what', c.what));
      box.appendChild(el('p', 'deep-link-needs', 'Needs: ' + c.needs + ' · Measured cost: ' + c.cost));
    } else {
      box.appendChild(el('h2', 'deep-link-t', 'NO_DATA · unknown action')).id = 'deep-link-t';
      box.appendChild(el('p', 'deep-link-what', 'No action named "' + id + '" is measured in mcp-manifest.json. Nothing was executed.'));
    }
    var row = el('div', 'deep-link-row');
    var go = el('button', 'deep-link-go', 'Open action'); go.type = 'button';
    var no = el('button', 'deep-link-no', 'Cancel'); no.type = 'button';
    row.appendChild(go); row.appendChild(no); box.appendChild(row);
    function cierra(devuelve) {
      box.remove();
      document.removeEventListener('keydown', tecla, true);
      if (devuelve && prevFocus && prevFocus.focus) { prevFocus.focus(); }
    }
    function aterriza() {
      cierra(false);
      var tg = window.TheGame;
      if (!tg) { return; }
      if (c.sheet) { tg.abre(null, c.sheet); }
      var t = setInterval(function () {
        var n = document.querySelector(c.focus);
        if (n && !n.hidden) { clearInterval(t); n.focus(); }
      }, 100);
      setTimeout(function () { clearInterval(t); }, 5000);
    }
    function tecla(e) { if (e.key === 'Escape') { cierra(true); } }
    document.addEventListener('keydown', tecla, true);
    go.addEventListener('click', aterriza);
    no.addEventListener('click', function () { cierra(true); });
    document.body.appendChild(box);
    go.focus();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', monta); }
  else { monta(); }
  window.AtlasDeepLinks = { monta: monta, acciones: function () { return Object.keys(CONTRACTS); } };
})();
