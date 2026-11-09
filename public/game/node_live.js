// Y7 (odd/tasks/chat-9nov-tanda.md): the Node sheet says which nodes are live. The names are the LIVE seals the page
// already counts for «Nodes online» (openworld_page.js puts them in #state data-live); nothing new leaves the page.
// Without a measured heartbeat the line says NO_DATA, never zero. Each live node is a button: Y9 will walk the crab there.
(function (root) {
  'use strict';
  // line(live) → the sentence for a data-live value: '' unknown, '-' none live, else names separated by spaces.
  function names(live) { return live && live !== '-' ? live.split(' ') : []; }
  function line(live) {
    if (!live) { return 'Live nodes: NO_DATA (the heartbeat is not measured yet).'; }
    var n = names(live);
    return n.length ? 'Live nodes: ' + n.length + ' · ' + n.join(', ') + '.' : 'Live nodes: none right now.';
  }
  function paint(doc) {
    var sheet = doc.getElementById('building-sheet'), state = doc.getElementById('state');
    if (!sheet || sheet.hidden) { return; }
    var box = doc.getElementById('bs-live');
    if (!box) { box = doc.createElement('div'); box.id = 'bs-live'; box.className = 'bs-live'; sheet.insertBefore(box, sheet.querySelector('.bs-list')); } // on top, no scroll
    var live = state ? state.dataset.live || '' : '', p = doc.createElement('p');
    p.textContent = line(live); box.replaceChildren(p);
    names(live).forEach(function (id) {
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'bs-tool'; b.textContent = id; b.dataset.node = id;
      b.setAttribute('aria-label', 'Live node ' + id); box.appendChild(b);
    });
  }
  function mount(doc) {
    var sheet = doc.getElementById('building-sheet'), state = doc.getElementById('state');
    if (!sheet || sheet.dataset.liveMounted) { return false; }
    sheet.dataset.liveMounted = '1';
    var again = function () { paint(doc); };
    new root.MutationObserver(again).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
    if (state) { new root.MutationObserver(again).observe(state, { attributes: true, attributeFilter: ['data-live'] }); }
    again(); return true;
  }
  var api = { line: line, names: names, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasNodeLive = api;
  if (root.document && root.document.getElementById) { mount(root.document); }
})(typeof window !== 'undefined' ? window : globalThis);
