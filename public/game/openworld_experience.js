// OpenWorld experience: readable controls and evidence-first feedback on the existing map.
// No new walker, territory authority, model, timer or network request.
// Every move is delegated to AtlasColonyControls / AtlasVisitorWalk. The before/after
// hex position (not a dispatched event alone) is the only proof of an accepted move.
(function (root) {
  'use strict';
  var DIRS = Object.freeze([
    Object.freeze({ id: 'north-west', label: 'NW', name: 'North-west' }),
    Object.freeze({ id: 'north-east', label: 'NE', name: 'North-east' }),
    Object.freeze({ id: 'west', label: 'W', name: 'West' }),
    Object.freeze({ id: 'east', label: 'E', name: 'East' }),
    Object.freeze({ id: 'south-west', label: 'SW', name: 'South-west' }),
    Object.freeze({ id: 'south-east', label: 'SE', name: 'South-east' })
  ]);
  function point(w) {
    if (!w || !Number.isSafeInteger(w.q) || !Number.isSafeInteger(w.r)) return null;
    return { q: w.q, r: w.r };
  }
  function move(controls, direction) {
    if (!DIRS.some(function (d) { return d.id === direction; })) {
      return { ok: false, cause: 'invalid_direction', before: null, after: null };
    }
    if (!controls || typeof controls.step !== 'function' || typeof controls.walker !== 'function') {
      return { ok: false, cause: 'character_controls_unavailable', before: null, after: null };
    }
    var before = point(controls.walker());
    if (!before) return { ok: false, cause: 'character_not_ready', before: null, after: null };
    try { controls.step(direction); } catch (e) {
      return { ok: false, cause: 'movement_refused', before: before, after: point(controls.walker()) };
    }
    var after = point(controls.walker());
    return { ok: !!after && (before.q !== after.q || before.r !== after.r),
      cause: after && (before.q !== after.q || before.r !== after.r) ? '' : 'hex_not_traversed',
      before: before, after: after };
  }
  function snapshot(s) {
    if (!s || !['copper', 'light', 'step'].every(function (k) { return Number.isSafeInteger(s[k]) && s[k] >= 0; })) return null;
    return { copper: s.copper, light: s.light, step: s.step,
      troops: Array.isArray(s.troops) ? s.troops.length : null };
  }
  function change(before, after) {
    if (!after) return 'NO_DATA: visit state unavailable';
    if (!before) return 'Visit started. Copper ' + after.copper + ', light ' + after.light + '.';
    var names = [['copper', 'copper'], ['light', 'light'], ['step', 'steps'], ['troops', 'troops']], parts = [];
    names.forEach(function (pair) {
      var key = pair[0];
      if (after[key] === null || before[key] === null || after[key] === before[key]) return;
      var n = after[key] - before[key];
      parts.push(pair[1] + ' ' + (n > 0 ? '+' : '') + n + ' (now ' + after[key] + ')');
    });
    return parts.length ? 'Visit updated: ' + parts.join('; ') + '.' : '';
  }
  // A building message is a report from the existing sheet, not proof of action success.
  function message(text) {
    var s = String(text || '').trim().replace(/\s+/g, ' ');
    return s.length <= 190 ? s : s.slice(0, 187) + '…';
  }
  function mount(doc, win) {
    var map = doc.getElementById('map'), stage = doc.getElementById('stage'),
      bar = map && map.querySelector('.topbar'), surface = doc.getElementById('surface');
    if (!map || !stage || !bar || !surface || doc.getElementById('ow-controls')) return null;
    var toggle = doc.createElement('button');
    toggle.type = 'button'; toggle.id = 'ow-controls'; toggle.textContent = 'Walk crab';
    toggle.setAttribute('aria-controls', 'ow-directions'); toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Walk the crab, not the camera. Show six directions.');
    bar.appendChild(toggle);
    var panel = doc.createElement('section'); panel.id = 'ow-directions'; panel.hidden = true;
    panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', 'Crab movement, one hex per press');
    var caption = doc.createElement('p'); caption.textContent = 'CRAB · one hex per press. Camera: left stick or drag the map.';
    panel.appendChild(caption);
    var grid = doc.createElement('div'); grid.className = 'ow-directions-grid';
    panel.appendChild(grid); stage.appendChild(panel);
    var brief = doc.createElement('p'); brief.id = 'ow-brief'; brief.setAttribute('role', 'status');
    brief.setAttribute('aria-live', 'polite'); brief.textContent = 'Press Play now, then Walk crab. One press = one hex.';
    stage.appendChild(brief);
    var coord = doc.createElement('span'); coord.id = 'ow-coords';
    coord.setAttribute('aria-label', 'Crab position'); bar.appendChild(coord);
    var last = '';
    function say(heading, body, guide) {
      var t = message(body);
      if (!t || heading + t === last) return;
      last = heading + t;
      brief.textContent = heading + ' · ' + t;
      if (guide) {
        var talk = win.AtlasPreceptorTalk && win.AtlasPreceptorTalk.view;
        if (talk && typeof talk.news === 'function') {
          talk.news(t, 'Preceptor · local script', true);
        }
      }
    }
    function controls() {
      var view = typeof win.AtlasOpenworldView === 'function' ? win.AtlasOpenworldView() : null;
      return view && view.controls;
    }
    function updatePosition() {
      var c = controls(), p = c && point(c.walker && c.walker());
      var text = p ? 'Hex ' + p.q + ', ' + p.r : 'Crab NO_DATA';
      if (coord.textContent !== text) coord.textContent = text;
    }
    function walk(direction) {
      var c = controls(), r = move(c, direction);
      updatePosition();
      if (r.ok) say('Crab', 'Moved ' + direction + ' to hex ' + r.after.q + ', ' + r.after.r + '.', false);
      else say('Crab', 'NO_DATA · ' + r.cause.replace(/_/g, ' ') + '; the crab did not move.', false);
      return r;
    }
    DIRS.forEach(function (d) {
      var b = doc.createElement('button'); b.type = 'button'; b.dataset.dir = d.id;
      b.textContent = d.label; b.title = 'Walk one hex ' + d.name;
      b.setAttribute('aria-label', 'Walk one hex ' + d.name);
      b.addEventListener('click', function () { walk(d.id); }); grid.appendChild(b);
    });
    function show(open) {
      panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open));
      if (open) grid.querySelector('button').focus(); else toggle.focus();
    }
    toggle.addEventListener('click', function () { show(panel.hidden); });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); show(false); }
    });
    // Result sources: a visit's actual state (copper, light, steps, troops);
    // or the already-existing building sheet text. A click/event alone is never success.
    var previous = null, visit = doc.getElementById('visitor-play');
    if (visit) {
      visit.addEventListener('visitor:render', function (event) {
        var now = snapshot(event.detail && event.detail.state), report = change(previous, now);
        previous = now;
        if (report) say('Preceptor', report, now !== null);
        updatePosition();
      });
      visit.addEventListener('visitor:end', function () { previous = null; say('Preceptor', 'This visit ended. Its crab cannot sign for a node.', true); });
    }
    surface.addEventListener('visitor:draw', updatePosition);
    function followBuilding() {
      var line = doc.querySelector('#building-sheet .bs-line');
      if (!line || !win.MutationObserver) return false;
      var said = '';
      new win.MutationObserver(function () {
        var t = message(line.textContent);
        if (t && t !== said) { said = t; say('Building reports', t, false); }
      }).observe(line, { subtree: true, childList: true, characterData: true });
      return true;
    }
    if (!followBuilding() && win.MutationObserver) {
      var waiter = new win.MutationObserver(function () { if (followBuilding()) waiter.disconnect(); });
      waiter.observe(map, { childList: true, subtree: true });
    }
    updatePosition();
    return { walk: walk, show: show, updatePosition: updatePosition };
  }
  var api = { DIRS: DIRS, point: point, move: move, snapshot: snapshot, change: change, message: message, mount: mount };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtlasOpenworldExperience = api;
  if (root.document && root.document.getElementById) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { mount(root.document, root); });
    else mount(root.document, root);
  }
})(typeof window !== 'undefined' ? window : globalThis);
