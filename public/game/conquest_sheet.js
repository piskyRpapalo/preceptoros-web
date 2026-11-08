// The Conquest sheet (Sovereign, 2026-11-08; odd/tasks/fog-and-conquest.md C3): a conquest page with a flag on every
// building held, and an expandable list of the building types and their customisation level, and Build leaves the web.
// Its card sits first in the Node sheet: this file puts it there itself (building_sheet.js is at its byte ceiling), watching
// the Node list and adding the card whenever the nine doors show. Loaded by visitor_battle_ui.js. Three parts:
//   Flags: every building this player controls: the node's own (one of each kind), the ones built on this device, and
//     this visit's conquests (map_fog_layer.js won). A tap closes the sheet and opens that building's card on the map.
//   Building types (expandable): the nine kinds and the model tower, each with its roof, its colour token and the
//     customisation level reached (none, name, skin, speech). What is not built yet says NO_DATA with its cause.
// Build is not here: an ephemeral account can only conquer; only nodes build, and that belongs to the app (Sovereign,
// 2026-11-08; task «originate buildings in the app»). Buildings already kept on this device still show their flag.
// Nothing is sent. 44 px targets, an aria-live line, Escape closes.
(function (root) {
  'use strict';
  var KEY = 'preceptoros.built'; // read only: what an earlier version built on this device keeps its flag
  var NAMES = { hostel: 'Hostel', coliseum: 'Coliseum', choir: 'Choir', workshop: 'Workshop', tower: 'Model tower', agora: 'Agora',
    customs: 'Customs', lottery: 'Honest lottery', 'visitor-house': 'Visitor house', doctor: 'Doctor on duty' };
  // a family-friendly line for each building (Sovereign, 2026-11-08: a title and a description, the technical part folded)
  var ABOUT = { hostel: 'Where new visitors are welcomed and can rest.', coliseum: 'Where waves meet in friendly duels.',
    choir: 'Where voices and messages sing together.', workshop: 'A bench to build and tinker with your own things.',
    tower: 'A small model of the tower, to look at and learn from.', agora: 'The public square where everyone meets.',
    customs: 'The gate at the edge of town, with three keys.', lottery: 'An honest draw: anyone can check the luck.',
    'visitor-house': 'Your own house: your profile lives here.', doctor: 'Keeps the town easy to use for everyone.' };
  var LEVELS = ['none', 'name', 'skin', 'speech'];
  var LATER = { name: 'naming a building is not built yet', skin: 'building skins are not built yet',
    speech: 'C5 waits until two live ephemeral accounts are measured at once' };

  function read(win) { try { var a = JSON.parse(win.localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  // Pure: flags(markList) → the buildings this player controls, each with how it came to be held.
  function flags(list) {
    return (list || []).filter(function (m) { return !m.fog || m.won; }).map(function (m) {
      return { id: m.id, q: m.q, r: m.r, name: NAMES[m.id] || m.id, how: m.won ? 'conquered this visit' : m.own ? 'built on this device' : "the node's own" };
    });
  }
  // Pure: types(mapKinds, built) → one row per kind: roof, tone, how many stand on this device, the level reached and why
  // the next level is not there yet. Today no kind reaches «name»: the level is honestly «none» for all.
  function types(mapKinds, built) {
    return (mapKinds || []).map(function (k) {
      var placed = (built || []).filter(function (b) { return b.id === k[0]; }).length;
      return { id: k[0], name: NAMES[k[0]] || k[0], about: ABOUT[k[0]] || 'NO_DATA · no description yet', roof: k[1], tone: k[2], placed: placed, level: LEVELS[0], next: LEVELS[1], cause: LATER[LEVELS[1]] };
    });
  }

  var sheet = null, line = null, win = null, opener = null, flagList = null, typeList = null, sum = null;
  function say(t) { line.textContent = t; }
  function view() { var MP = root.AtlasMapPainter; return MP && MP.view && MP.view(); }
  function card(doc, text, id) {
    var b = doc.createElement('button'), G = root.AtlasGamepad; b.type = 'button'; b.className = 'bs-card'; b.textContent = text; if (id) { b.id = id; }
    if (G && G.paint) { G.paint(b, text); }
    return b;
  }
  function fill() {
    var doc = sheet.ownerDocument, V = view(), list = V && V.world && V.world.markList, F = flags(list);
    var MC = root.AtlasMapChunks, CT = root.AtlasComicTokens, T = types(MC && MC.KINDS, read(win));
    flagList.textContent = ''; typeList.textContent = '';
    if (!list) { var no = doc.createElement('li'); no.textContent = 'NO_DATA · the map is not drawn yet'; flagList.appendChild(no); }
    F.forEach(function (f) {
      var li = doc.createElement('li'), b = card(doc, '⚑ ' + f.name + ' · ' + f.q + ', ' + f.r + ' · ' + f.how);
      b.addEventListener('click', function () {
        close(); var s = doc.getElementById('surface'); if (s) { s.dataset.sel = f.q + ',' + f.r; }
        if (root.AtlasBuildingSheet) { root.AtlasBuildingSheet.open(f.id); }
      });
      li.appendChild(b); flagList.appendChild(li);
    });
    T.forEach(function (t) {
      // each building is a plain cream panel that folds, like the terminal's (Sovereign, 2026-11-08; no bubble tail): closed it shows the building's map colour
      // and its title; open it says what the building does, and folds the technical part once more under «Technical»
      var li = doc.createElement('li'), bub = doc.createElement('details'), top = doc.createElement('summary'), sw = doc.createElement('span'), ti = doc.createElement('strong'), ab = doc.createElement('p');
      li.className = 'cq-type'; bub.className = 'cq-bubble'; bub.id = 'cq-' + t.id; sw.className = 'cq-swatch'; sw.setAttribute('aria-hidden', 'true');
      var tone = CT && CT.FRONT_DOOR && CT.FRONT_DOOR[t.tone]; if (tone) { sw.style.background = tone; }
      ti.textContent = t.name; ab.textContent = t.about; top.appendChild(sw); top.appendChild(ti);
      var tech = doc.createElement('details'), ts = doc.createElement('summary'), tt = doc.createElement('p');
      tech.className = 'cq-tech'; ts.textContent = 'Technical';
      tt.textContent = 'Roof ' + t.roof + ' · colour token ' + t.tone + ' · customisation ' + t.level + ' · next ' + t.next + ': NO_DATA (' + t.cause + ')';
      tech.appendChild(ts); tech.appendChild(tt); bub.appendChild(top); bub.appendChild(ab); bub.appendChild(tech);
      li.appendChild(bub); typeList.appendChild(li);
    });
    sum.textContent = 'Building types (' + T.length + ')';
    return F.length;
  }
  function close() { sheet.hidden = true; if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); } }
  function make(doc) {
    sheet = doc.createElement('section'); sheet.id = 'conquest-sheet'; sheet.className = 'bs-sheet'; sheet.hidden = true; sheet.setAttribute('aria-labelledby', 'cq-h');
    var bar = doc.createElement('div'), h = doc.createElement('h2'); bar.className = 'bs-bar'; h.id = 'cq-h'; h.textContent = '⚑ Conquest';
    var shut = card(doc, 'Close'); shut.className = 'bs-tool'; shut.addEventListener('click', close);
    bar.appendChild(h); bar.appendChild(shut); sheet.appendChild(bar);
    var h1 = doc.createElement('h3'); h1.textContent = 'Flags · the buildings you hold'; sheet.appendChild(h1);
    flagList = doc.createElement('ul'); flagList.className = 'bs-list'; flagList.id = 'cq-flags'; sheet.appendChild(flagList);
    var det = doc.createElement('details'); det.id = 'cq-types'; sum = doc.createElement('summary'); sum.className = 'bs-card'; det.appendChild(sum);
    typeList = doc.createElement('ul'); typeList.className = 'cq-types'; det.appendChild(typeList); sheet.appendChild(det);
    line = doc.createElement('p'); line.className = 'bs-line'; line.setAttribute('role', 'status'); line.setAttribute('aria-live', 'polite'); sheet.appendChild(line);
    sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
    var pad = doc.getElementById('gamepad'); pad.parentNode.insertBefore(sheet, pad);
  }
  // toggle(doc, w, from): opens or closes the sheet; «from» is the button that opened it (focus returns there).
  function toggle(doc, w, from) {
    win = w; opener = from || null; if (!sheet) { make(doc); }
    if (!sheet.hidden) { close(); return; }
    ['building-sheet', 'settings-sheet'].forEach(function (id) { var o = doc.getElementById(id); if (o) { o.hidden = true; } });
    sheet.hidden = false; if (opener) { opener.setAttribute('aria-expanded', 'true'); }
    var n = fill(); say('Conquest · ' + n + ' flag' + (n === 1 ? '' : 's') + ' · conquer a grey building to raise one more');
    var f = sheet.querySelector('#cq-flags button, summary'); if (f) { f.focus(); }
  }
  // mount(doc, w): the «⚑ Conquest» card, first in the Node list whenever it shows the nine doors (not inside a building).
  function mount(doc, w, tries) {
    var town = doc.getElementById('building-sheet'), list = town && town.querySelector('.bs-list'), h = town && town.querySelector('#bs-h');
    if (!list || !h) { if ((tries || 0) < 40) { w.setTimeout(function () { mount(doc, w, (tries || 0) + 1); }, 250); } return; }
    var put = function () {
      if (!/^Node/.test(h.textContent) || !list.firstElementChild || doc.getElementById('bs-conquest')) { return; }
      var li = doc.createElement('li'), b = card(doc, '\u2691 Conquest · flags and building types', 'bs-conquest');
      b.addEventListener('click', function () { toggle(doc, w, doc.getElementById('gp-town')); });
      li.appendChild(b); list.insertBefore(li, list.firstElementChild);
    };
    new w.MutationObserver(put).observe(list, { childList: true }); put();
  }
  if (root.document && root.MutationObserver) { mount(root.document, root); }
  var api = { KEY: KEY, LEVELS: LEVELS, read: read, flags: flags, types: types, toggle: toggle, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasConquest = api;
})(typeof window !== 'undefined' ? window : globalThis);
