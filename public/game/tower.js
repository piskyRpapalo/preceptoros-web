// K4c · the ascension tower. Every measured seal of the web is one floor (/game/tower_floors.json, written by
// bin/tower_ledger.py from the git history of public/sw.js). The tower grows only with a real seal: no chests, no odds,
// no hidden numbers. If the seal this page serves is newer than the ledger, that floor is said "under construction".
(function (root) {
  'use strict';
  var RX = /preceptoros-(\d{4})-(\d{2})-([a-z]+)/;

  function key(v) {
    var m = RX.exec(String(v || '')); if (!m) { return null; }
    var n = 0; for (var i = 0; i < m[3].length; i++) { n = n * 26 + (m[3].charCodeAt(i) - 96); }
    return [+m[1], +m[2], m[3].length, n];
  }
  function cmp(a, b) { for (var i = 0; i < 4; i++) { if (a[i] !== b[i]) { return a[i] < b[i] ? -1 : 1; } } return 0; }
  function short(v) { var m = RX.exec(String(v || '')); return m ? m[2] + '-' + m[3] : 'NO_DATA'; }
  // served(text of /sw.js) → the seal this page serves, or null.
  function served(text) { var m = RX.exec(String(text || '').split('\n')[0]); return m ? m[0] : null; }

  // model(ledger, servedVersion) → { ok, floors, first, firstDay, top, tallest:[day, n], building, line }
  function model(ledger, now) {
    var L = ledger && typeof ledger === 'object' ? ledger : null;
    if (!L || !Array.isArray(L.days) || !L.days.length || typeof L.floors !== 'number' || !key(L.top)) {
      return { ok: false, line: 'NO_DATA · tower_ledger_unreadable' };
    }
    var tallest = L.days[0];
    L.days.forEach(function (d) { if (d[1] > tallest[1]) { tallest = d; } });
    var building = !!(key(now) && cmp(key(now), key(L.top)) > 0);
    var line = 'The tower has ' + L.floors + ' floors since ' + L.days[0][0] +
      ' · tallest day ' + tallest[0] + ' with ' + tallest[1] + ' seals · top floor ' + short(L.top) +
      (building ? ' · floor ' + (L.floors + 1) + ' (' + short(now) + ') is under construction' :
        key(now) ? ' is the seal you see now' : ' · served seal NO_DATA') + ' · it grows only with a real seal';
    return { ok: true, floors: L.floors, first: L.first, firstDay: L.days[0][0], top: L.top, tallest: tallest, building: building, line: line };
  }

  var api = { served: served, model: model, key: key };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasTower = api;
})(typeof window !== 'undefined' ? window : globalThis);
