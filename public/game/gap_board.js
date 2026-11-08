// E4 / L13 · the gap board. Read the nine buildings (/game/building_interiors.json) and say, out loud, what is still
// NO_DATA: how many options, which mission each one waits for, and why. Nothing is invented: the board only counts
// what the contract already declares. Pure; the building sheet calls it from the Agora («Neighbours and the gap board»).
(function (root) {
  'use strict';
  var SHOW = 3;   // the live line names three gaps; the count says the rest

  // board(doc) → { ok, total, live, gaps: [{building, option, label, missions, cause}], line }
  function board(doc) {
    if (!doc || !Array.isArray(doc.buildings)) { return { ok: false, line: 'NO_DATA · interiors_not_loaded', gaps: [] }; }
    var gaps = [], total = 0;
    doc.buildings.forEach(function (b) {
      (b.options || []).forEach(function (o) {
        total++;
        if (!o.piece) {
          gaps.push({ building: b.name, option: o.id, label: o.label, missions: (o.missions || []).slice(), cause: o.cause || 'cause_not_declared' });
        }
      });
    });
    gaps.sort(function (a, b) {
      var x = a.missions[0] || '~', y = b.missions[0] || '~';
      return x < y ? -1 : x > y ? 1 : (a.option < b.option ? -1 : a.option > b.option ? 1 : 0);
    });
    return { ok: true, total: total, live: total - gaps.length, gaps: gaps, line: line(total, gaps) };
  }

  function line(total, gaps) {
    if (!gaps.length) { return 'all ' + total + ' options are LIVE · no gap left'; }
    var named = gaps.slice(0, SHOW).map(function (g) {
      return g.missions.join('/') + ' ' + g.label + ' (' + g.building + ', ' + g.cause + ')';
    });
    var rest = gaps.length - named.length;
    return gaps.length + ' of ' + total + ' options are NO_DATA · next: ' + named.join('; ') + (rest > 0 ? '; and ' + rest + ' more' : '');
  }

  var api = { SHOW: SHOW, board: board, line: line };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasGapBoard = api;
})(typeof window !== 'undefined' ? window : globalThis);
