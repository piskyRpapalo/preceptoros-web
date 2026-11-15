// Buildings with personality (Sovereign 2026-11-15: «the panels inside are white and dull; each building, when opened,
// must be different — the lottery, the doctor, the coliseum, each with its own unique, editable template»). The card a
// building opens wears its function: a backdrop, a frame for its options, an Acho emblem (ink strokes) and a motto.
// building_sheet.js stays as it is (it sits at its byte ceiling): it already says which building it entered
// (building:enter); this piece dresses the sheet from that, and undresses it on the Node list. Colours are the Acho
// palette tokens (building_skins.css); a visitor who conquered a building may later choose its skin, name and accent
// (choose(), held by the visit only). Presentation only: no option, seal or action changes.
(function (root) {
  'use strict';
  // kind → [motto, emblem path in a 0..48 box (ink strokes, round caps)]
  var SKINS = {
    lottery: ['Every draw shows its odds.', 'M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z'],
    doctor: ['Care first, then the rest.', 'M19 8h10v11h11v10H29v11H19V29H8V19h11z'],
    coliseum: ['Fight clean, fight repeatable.', 'M10 38L34 10M34 10l4 0 0 4M38 38L14 10M14 10l-4 0 0 4M8 34l6 6M40 34l-6 6'],
    choir: ['Every voice in its place.', 'M14 16a10 10 0 0 1 0 16M20 11a17 17 0 0 1 0 26M26 6a24 24 0 0 1 0 36M8 22v4'],
    customs: ['Three keys, one door.', 'M17 24a7 7 0 1 1 0-.1M24 24h18M36 24v6M41 24v5'],
    hostel: ['Welcome, rest, begin.', 'M6 34V16M6 26h36v8M42 34V24a6 6 0 0 0-6-6H22v8M12 20a3 3 0 1 0 0.1 0'],
    tower: ['Models, measured.', 'M24 4l6 14v24H18V18zM18 30h12M24 4v-2M14 42h20'],
    agora: ['The public square, open to all.', 'M6 16L24 6l18 10zM10 18v18M18 18v18M30 18v18M38 18v18M6 40h36'],
    workshop: ['Make, test, keep.', 'M24 14a10 10 0 1 0 .1 0M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4'],
    'visitor-house': ['Your profile lives here.', 'M8 42V20L24 8l16 12v22zM19 42V30h10v12M31 26a1 1 0 1 0 .1 0']
  };
  var NS = 'http://www.w3.org/2000/svg', chosen = {}; // chosen['q,r'] = {skin, name, accent}: a conquered building, this visit only
  var ACCENTS = [['welcome', 'Sun'], ['talk', 'Lilac'], ['you', 'Coral'], ['tools', 'Steel']];
  function titleOf(k) { return k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' '); }
  // the conquered building the sheet was opened from (map_aura.js marks the tapped hex on #surface data-sel), or null
  function wonHere(doc) {
    var s = doc.getElementById('surface'), V = root.AtlasMapPainter && root.AtlasMapPainter.view && root.AtlasMapPainter.view();
    var m = s && V && V.world && V.world.marks && V.world.marks[s.dataset.sel]; return m && m.won ? m : null;
  }
  // Pure: skinOf(kind, choice) → the skin the card wears: the visitor's choice when it names a known skin, else its own.
  function skinOf(kind, choice) { return choice && SKINS[choice.skin] ? choice.skin : SKINS[kind] ? kind : null; }
  // Pure: clean(name) → a visitor's building name: letters, digits, spaces and . - ' only, 2..24 characters, or null.
  function clean(name) { var s = String(name || '').replace(/[^A-Za-z0-9 .'\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24); return s.length >= 2 ? s : null; }
  function emblem(doc, d) {
    var s = doc.createElementNS(NS, 'svg'), p = doc.createElementNS(NS, 'path');
    s.setAttribute('viewBox', '0 0 48 48'); s.setAttribute('aria-hidden', 'true'); p.setAttribute('d', d); s.appendChild(p); return s;
  }
  function dress(sheet, kind) {
    var doc = sheet.ownerDocument, mk = kind && wonHere(doc), c = mk ? chosen[mk.q + ',' + mk.r] : null, skin = skinOf(kind, c), old = sheet.querySelector('.bs-skin'), f0 = sheet.querySelector('.bs-make');
    if (old) { old.remove(); } if (f0) { f0.remove(); }
    if (!skin) { delete sheet.dataset.skin; delete sheet.dataset.accent; return; }
    sheet.dataset.skin = skin; if (c && c.accent) { sheet.dataset.accent = c.accent; } else { delete sheet.dataset.accent; }
    var band = doc.createElement('div'), m = doc.createElement('p'); band.className = 'bs-skin';
    m.className = 'bs-motto'; m.textContent = (c && c.name ? c.name + ' · ' : '') + SKINS[skin][0];
    band.appendChild(emblem(doc, SKINS[skin][1])); band.appendChild(m);
    var bar = sheet.querySelector('.bs-bar'); if (bar && bar.nextSibling) { sheet.insertBefore(band, bar.nextSibling); } else { sheet.appendChild(band); }
    if (mk) { band.after(maker(doc, sheet, kind, mk, c)); }
  }
  // maker(): «Make it yours» — a conquered building's card lets its visitor pick the skin, a name and an accent.
  function maker(doc, sheet, kind, mk, c) {
    var box = doc.createElement('details'), sum = doc.createElement('summary'), grid = doc.createElement('div'), acc = doc.createElement('div');
    var name = doc.createElement('input'), lab = doc.createElement('label'), keep = doc.createElement('button'), pick = { skin: (c && c.skin) || kind, accent: c && c.accent };
    box.className = 'bs-make'; box.open = !c; sum.textContent = c ? '⚑ Yours · change it' : '⚑ Make it yours'; grid.className = 'mk-skins'; acc.className = 'mk-acc';
    grid.setAttribute('role', 'radiogroup'); grid.setAttribute('aria-label', 'What this building becomes');
    function mark(group, attr, val) { [].forEach.call(group.children, function (b) { b.setAttribute('aria-checked', String(b.dataset[attr] === val)); }); }
    Object.keys(SKINS).forEach(function (k) {
      var b = doc.createElement('button'); b.type = 'button'; b.dataset.skin = k; b.setAttribute('role', 'radio'); b.appendChild(emblem(doc, SKINS[k][1]));
      b.appendChild(doc.createTextNode(titleOf(k))); b.addEventListener('click', function () { pick.skin = k; mark(grid, 'skin', k); sheet.dataset.skin = k; }); grid.appendChild(b);
    });
    ACCENTS.forEach(function (a) {
      var b = doc.createElement('button'); b.type = 'button'; b.dataset.accent = a[0]; b.setAttribute('role', 'radio'); b.textContent = a[1];
      b.addEventListener('click', function () { pick.accent = a[0]; mark(acc, 'accent', a[0]); sheet.dataset.accent = a[0]; }); acc.appendChild(b);
    });
    acc.setAttribute('role', 'radiogroup'); acc.setAttribute('aria-label', 'Its colour');
    lab.textContent = 'Its name'; name.maxLength = 24; name.autocomplete = 'off'; name.value = (c && c.name) || ''; name.placeholder = titleOf(kind); lab.appendChild(name);
    keep.type = 'button'; keep.className = 'mk-keep'; keep.textContent = 'Keep it';
    keep.addEventListener('click', function () {
      var got = choose(mk, { skin: pick.skin, name: name.value, accent: pick.accent });
      var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), MP = root.AtlasMapPainter; if (MP && MP.resetCache) { MP.resetCache(); } if (ow && ow.redraw) { ow.redraw(); }
      if (root.CustomEvent) { doc.dispatchEvent(new root.CustomEvent('acho:event', { detail: { id: 'building/yours/' + mk.q + ',' + mk.r, event: { kind: 'building.yours', source: 'local' }, frame: { v: 'preceptoros.acho/1', id: 'building/yours', change: [(got.name || titleOf(got.skin)) + ' is yours: ' + titleOf(got.skin)], sound: 'rise', motion: 'pulse' }, news: [] } })); }
    });
    mark(grid, 'skin', pick.skin); mark(acc, 'accent', pick.accent || '');
    box.append(sum, grid, acc, lab, keep); return box;
  }
  // choose(mark, {skin, name, accent}): a conquering visitor makes the building theirs (accent: welcome|talk|you|tools);
  // the mark keeps the name for the map's label (map_chunks/map_aura read m.name). Held by this visit only.
  function choose(mk, pick) {
    var name = clean(pick && pick.name), accent = /^(welcome|talk|you|tools)$/.test(pick && pick.accent) ? pick.accent : null;
    var got = chosen[mk.q + ',' + mk.r] = { skin: SKINS[pick && pick.skin] ? pick.skin : mk.id, name: name, accent: accent };
    mk.name = name || undefined; mk.skin = got.skin;
    var sheet = root.document && root.document.getElementById('building-sheet'); if (sheet && !sheet.hidden && sheet.dataset.kind) { dress(sheet, sheet.dataset.kind); }
    return got;
  }
  function mount(doc) {
    var link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = '/game/building_skins.css'; doc.head.appendChild(link);
    var entered = '';
    doc.addEventListener('building:enter', function (e) {
      var sheet = doc.getElementById('building-sheet'), id = e.detail && e.detail.id; if (!sheet || !id) { return; }
      entered = (doc.getElementById('bs-h') || {}).textContent;
      if (/^Node\b/.test(entered)) { delete sheet.dataset.kind; dress(sheet, null); return; } // a kind without its own interior falls back to the Node list: no skin
      sheet.dataset.kind = id; dress(sheet, id);
    });
    (function watch(n) { // the Node list (draw(null)) sends no event: a title that is not the entered one undresses
      var h = doc.getElementById('bs-h'), sheet = doc.getElementById('building-sheet');
      if (!h) { if (n < 30) { root.setTimeout(function () { watch(n + 1); }, 400); } return; }
      new root.MutationObserver(function () { if (h.textContent !== entered) { delete sheet.dataset.kind; dress(sheet, null); } echo(doc); }).observe(h, { childList: true, characterData: true, subtree: true });
      new root.MutationObserver(function () { echo(doc); }).observe(sheet, { childList: true, subtree: true, characterData: true });
      more(doc, sheet, '.bs-card');
      var wire = function () { var set = doc.getElementById('settings-sheet'); if (set && !set.dataset.more) { set.dataset.more = '1'; more(doc, set, 'button:not(.bs-more)'); } };
      wire(); doc.addEventListener('click', function () { root.setTimeout(wire, 250); }, true); // Settings is built on first open
    })(0);
  }
  // Pure: below(boxes, fold) → how many cards [top, bottom] show less than half of themselves above the fold.
  function below(boxes, fold) { return boxes.filter(function (b) { return fold - b[0] < (b[1] - b[0]) / 2; }).length; }
  // «↓ N more»: a sheet that hides cards under its fold says so, and one tap brings them up (BEAUTY-02).
  function more(doc, sheet, cards) {
    var pill = doc.createElement('button'); pill.type = 'button'; pill.className = 'bs-more'; pill.hidden = true; sheet.appendChild(pill);
    var G = root.AtlasGamepad; if (G && G.paint) { G.paint(pill, 'More below'); } // an Acho button like every control of the sheet
    function count() {
      if (sheet.hidden) { return; }
      var r = sheet.getBoundingClientRect(), n = below([].map.call(sheet.querySelectorAll(cards), function (c) { var q = c.getBoundingClientRect(); return [q.top, q.bottom]; }), r.bottom);
      pill.hidden = !n; pill.textContent = '↓ ' + n + ' more'; pill.setAttribute('aria-label', n + ' more below: show them');
      if (pill.parentNode !== sheet || pill !== sheet.lastElementChild) { sheet.appendChild(pill); }
    }
    pill.addEventListener('click', function () {
      var calm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sheet.scrollBy({ top: sheet.clientHeight * 0.8, behavior: calm ? 'auto' : 'smooth' });
    });
    sheet.addEventListener('scroll', count, { passive: true });
    new root.MutationObserver(function () { root.requestAnimationFrame(count); }).observe(sheet, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    root.requestAnimationFrame(count);
  }
  // The status line that only repeats the title stays for the screen reader, not for the eye.
  function echo(doc) {
    var h = doc.getElementById('bs-h'), l = doc.querySelector('#building-sheet .bs-line'); if (!h || !l) { return; }
    if (l.textContent.trim() === h.textContent.trim()) { l.dataset.echo = '1'; } else { delete l.dataset.echo; }
  }
  var api = { SKINS: SKINS, skinOf: skinOf, clean: clean, choose: choose, below: below };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasBuildingSkins = api;
  if (root.document && root.document.getElementById && !(typeof module === 'object' && module.exports)) { mount(root.document); }
})(typeof window !== 'undefined' ? window : globalThis);
