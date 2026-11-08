// Building interiors, piece 2: the Acho sheet. The map is the web menu and the nine buildings are its panels
// (docs/reparto-paneles-20261108.md §2). One «Town» button in the gamepad opens one sheet: first the nine buildings,
// then the options of the chosen one, from /game/building_interiors.json (the contract that
// atlas/puros/building_interiors.js checks). An option with a piece says LIVE and names its piece; an option without
// one says NO_DATA and its cause. Nothing is invented. One mould for all nine: 44 px targets, an aria-live line,
// Escape goes back, reduced motion stays still (gamepad.js gesture), forced-colors draws plain borders.
(function (root) {
  'use strict';
  var URL_DOC = '/game/building_interiors.json';

  // Pure: the text that the live line says for one option.
  function verdict(building, option) {
    var head = building.name + ' · ' + option.label + ' · ';
    var m = ' · missions ' + option.missions.join(', ');
    return option.piece ? head + 'LIVE · piece ' + option.piece.split('/').pop() + m : head + 'NO_DATA · ' + option.cause + m;
  }
  // Pure: the sheet model. id null → the nine doors; id of a building → its options.
  function model(doc, id) {
    if (!doc || !Array.isArray(doc.buildings)) { return { title: 'Town', cause: 'interiors_not_loaded', items: [] }; }
    if (id == null) {
      return { title: 'Town · nine buildings', items: doc.buildings.map(function (b) {
        var live = b.options.filter(function (o) { return o.piece; }).length;
        return { id: b.id, name: b.name, label: b.name + ' · ' + b.role + ' · ' + live + ' of ' + b.options.length + ' live', live: live > 0 };
      }) };
    }
    var b = doc.buildings.filter(function (x) { return x.id === id; })[0];
    if (!b) { return { title: 'Town', cause: 'building_unknown', items: [] }; }
    return { title: b.name + ' · ' + b.role, building: b, items: b.options.map(function (o) {
      return { id: o.id, name: b.name + ' ' + o.id, label: o.label, live: !!o.piece, say: verdict(b, o), action: o.action || null };
    }) };
  }

  var want = null, pad = null, sheet = null, list = null, head = null, line = null, back = null, btn = null, data = null, at = null, win = null;
  function G() { return root.AtlasGamepad; }
  function button(doc, cls, text, name) {
    var b = doc.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text;
    if (G()) { G().paint(b, name); b.addEventListener('click', function () { G().move(b, name, win); }); }
    return b;
  }
  function say(text) { line.textContent = text; }
  function draw(id) {
    var doc = sheet.ownerDocument, m = model(data, id);
    at = id; head.textContent = m.title; back.hidden = id == null; list.textContent = '';
    if (id != null && win.CustomEvent) { sheet.dispatchEvent(new win.CustomEvent('building:enter', { bubbles: true, detail: { id: id } })); } // quests count it
    if (m.cause) { say('NO_DATA · ' + m.cause); }
    m.items.forEach(function (it) {
      var li = doc.createElement('li'), b = button(doc, 'bs-card', it.label, it.name);
      b.dataset.seal = it.live ? 'LIVE' : 'NO_DATA';
      var seal = doc.createElement('span'); seal.className = 'bs-seal'; seal.textContent = it.live ? 'LIVE' : 'NO_DATA'; b.appendChild(seal);
      b.addEventListener('click', id == null ? function () { draw(it.id); say('Inside ' + it.name + ' · Escape goes back'); focusFirst(); }
        : function () { say(it.say); if (it.action) { act(it.action, it.say); } });
      li.appendChild(b); list.appendChild(li);
    });
  }

  // Actions: an option with an action runs its real piece, loaded on first use. The line says the verdict, then the result.
  function load(src, name, then) {
    if (root[name]) { then(root[name]); return; }
    var sc = sheet.ownerDocument.createElement('script'); sc.src = src;
    sc.onload = function () { then(root[name] || null); }; sc.onerror = function () { then(null); };
    sheet.ownerDocument.head.appendChild(sc);
  }
  // The actions live in /game/town_actions.js, loaded on the first press (the sheet keeps its byte ceiling).
  function act(name, head) {
    load('/game/town_actions.js', 'AtlasTownActions', function (TA) {
      if (!TA) { say(head + ' · NO_DATA · piece_not_loaded'); return; }
      if (win.CustomEvent) { sheet.dispatchEvent(new win.CustomEvent('building:act', { bubbles: true, detail: { name: name } })); }
      TA.run(name, { win: win, doc: sheet.ownerDocument, data: data, load: load }, function (text) { say(head + ' · ' + text); });
    });
  }
  function focusFirst() { var f = list.querySelector('button'); if (f) { f.focus(); } }
  function close() { sheet.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  function openSheet() {
    sheet.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (data) { draw(want); want = null; focusFirst(); return; }
    say('Loading the nine buildings…');
    var f = win.fetch ? win.fetch(URL_DOC, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }) : Promise.resolve(null);
    f.catch(function () { return null; }).then(function (d) {
      data = d; draw(want); if (d) { say(want ? head.textContent : 'Town · choose a building'); focusFirst(); } want = null;
    });
  }

  // mount(doc, w) → the Town button in the gamepad middle and its hidden sheet; null when the gamepad is not there.
  function mount(doc, w) {
    pad = doc.getElementById('gamepad'); var mid = pad && pad.querySelector('.gp-mid');
    if (!mid || doc.getElementById('gp-town')) { return null; }
    win = w;
    btn = button(doc, 'gp-b', '⌂', 'Town'); btn.id = 'gp-town';
    btn.setAttribute('aria-label', 'Town: the nine buildings'); btn.title = 'Town: the nine buildings';
    btn.setAttribute('aria-controls', 'building-sheet'); btn.setAttribute('aria-expanded', 'false');
    sheet = doc.createElement('section'); sheet.id = 'building-sheet'; sheet.hidden = true; sheet.setAttribute('aria-labelledby', 'bs-h');
    var bar = doc.createElement('div'); bar.className = 'bs-bar';
    back = button(doc, 'bs-tool', 'Back', 'Back'); back.addEventListener('click', function () { draw(null); focusFirst(); });
    head = doc.createElement('h2'); head.id = 'bs-h'; head.textContent = 'Town';
    var shut = button(doc, 'bs-tool', 'Close', 'Close'); shut.addEventListener('click', close);
    bar.appendChild(back); bar.appendChild(head); bar.appendChild(shut);
    list = doc.createElement('ul'); list.className = 'bs-list';
    line = doc.createElement('p'); line.className = 'bs-line'; line.setAttribute('role', 'status'); line.setAttribute('aria-live', 'polite');
    sheet.appendChild(bar); sheet.appendChild(list); sheet.appendChild(line);
    sheet.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') { return; }
      e.preventDefault(); e.stopPropagation();
      if (at != null) { draw(null); focusFirst(); } else { close(); }
    });
    btn.addEventListener('click', function () { if (sheet.hidden) { openSheet(); } else { close(); } });
    mid.appendChild(btn);
    pad.parentNode.insertBefore(sheet, pad);
    return sheet;
  }

  // open(id): a building tapped on the map opens its own card (null or an unknown kind: the town list).
  function open(id) {
    if (!sheet) { return false; }
    want = id && (!data || (data.buildings || []).some(function (b) { return b.id === id; })) ? id : null; openSheet(); return true;
  }
  var api = { URL: URL_DOC, verdict: verdict, model: model, mount: mount, open: open };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasBuildingSheet = api;
  if (root.document && root.document.getElementById) { mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
