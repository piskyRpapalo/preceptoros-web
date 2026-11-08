// Building interiors · the nine web buildings and their options (docs/reparto-paneles-20261108.md §2).
// Pure: no clock, no randomness, no I/O. valida(doc, existe) returns a list of failures ([] = valid).
// The law of the number: 3 to 7 options per building; an exception must be declared by id.
// Every option names its missions and either a real piece of the served game or a NO_DATA cause.
(function (root) {
  'use strict';
  var ID = /^[a-z][a-z0-9-]{1,31}$/;
  function valida(doc, existe) {
    var f = [];
    if (!doc || doc.$id !== 'preceptoros:building-interiors/1') return ['schema'];
    var excep = doc.exceptions || {}, vistos = {};
    (doc.buildings || []).forEach(function (b) {
      if (!ID.test(b.id || '') || vistos[b.id]) f.push('building_id:' + b.id); vistos[b.id] = 1;
      var n = (b.options || []).length;
      if ((n < 3 || n > 7) && !excep[b.id]) f.push('law_of_number:' + b.id + ':' + n);
      var ops = {};
      (b.options || []).forEach(function (o) {
        var k = b.id + '/' + o.id;
        if (!ID.test(o.id || '') || ops[o.id]) f.push('option_id:' + k); ops[o.id] = 1;
        if (typeof o.label !== 'string' || !o.label || o.label.length > 48) f.push('label:' + k);
        if (!Array.isArray(o.missions) || !o.missions.length) f.push('missions:' + k);
        if (o.action != null && !(doc.actions && Object.prototype.hasOwnProperty.call(doc.actions, o.action) && o.piece)) f.push('action_unknown:' + k);
        if (o.piece === null) { if (!/^[a-z0-9_]+$/.test(o.cause || '')) f.push('no_data_cause:' + k); }
        else if (typeof o.piece !== 'string' || (existe && !existe(o.piece))) f.push('piece_missing:' + k);
      });
    });
    if ((doc.buildings || []).length !== 9) f.push('nine_buildings');
    return f;
  }
  function cuenta(doc) {
    var vivas = 0, nd = 0;
    (doc.buildings || []).forEach(function (b) { (b.options || []).forEach(function (o) { if (o.piece) vivas++; else nd++; }); });
    return { live: vivas, no_data: nd };
  }
  var API = { valida: valida, cuenta: cuenta };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.AtlasBuildingInteriors = API;
})(this);
