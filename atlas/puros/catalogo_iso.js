// Catalogue core (ODD isometric-colony, IC3). The preconfigured sprites of the colony: each row of the state becomes
// one bubble-language frame, born from the state and never from a picture. A row whose kind has no lexicon key is
// refused as orphan_visual_node. Pure: no random numbers, no clock reads, no network. A value that is not measured is NO_DATA
// with its cause; a row marked sintetico says SYNTHETIC in its sentence.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var F = common ? require('./state_frames.js') : root.AtlasStateFrames;

  var HEX = [];
  for (var i = 0; i < 6; i++) {
    HEX.push([Math.round(160 + 60 * Math.cos(i * Math.PI / 3)), Math.round(48 + 40 * Math.sin(i * Math.PI / 3))]);
  }

  // The kinds the catalogue knows. Each kind is one lexicon key and a fixed wave table (harmonic, amplitude at 100).
  var TIPOS = {
    cabin:    { clave: 'sprite.cabin',    nombre: 'Tutorial cabin', tabla: [[1, 30, 10, 0]] },
    risen:    { clave: 'sprite.risen',    nombre: 'the Risen',      tabla: [[2, 24, 8, 0]] },
    sea:      { clave: 'sprite.sea',      nombre: 'Submerged Forest creature', tabla: [[1, 40, 10, 0], [3, 20, 5, 4]] },
    fleet:    { clave: 'sprite.fleet',    nombre: 'fleet unit',     tabla: [[1, 36, 9, 0]] },
    tower:    { clave: 'sprite.tower',    nombre: 'the Tower',      tabla: [[1, 44, 12, 0]] },
    building: { clave: 'sprite.building', nombre: 'colony building', tabla: [[1, 28, 8, 0]] }
  };
  var CLAVES = Object.freeze(Object.keys(TIPOS).map(function (k) { return TIPOS[k].clave; }).sort());

  function orphan(fila, causa) {
    return new Error('orphan_visual_node: ' + (fila && fila.id ? fila.id : '?') + ' · ' + causa);
  }

  // The kind of a row, or refusal. A kind with no lexicon key is an orphan too.
  function tipoDe(fila) {
    var t = TIPOS[fila.tipo];
    if (!t) { throw orphan(fila, 'kind ' + JSON.stringify(fila.tipo) + ' is not in the catalogue'); }
    if (typeof t.clave !== 'string' || t.clave === '') { throw orphan(fila, 'kind has no lexicon key'); }
    return t;
  }

  // medida(fila) → the measured value of the row, only when it is a whole number 0-100; otherwise NO_DATA with its cause.
  function medida(fila) {
    var m = fila.medida;
    if (m && typeof m.valor === 'number' && Number.isInteger(m.valor) && m.valor >= 0 && m.valor <= 100) {
      return { estado: 'MEDIDO', valor: m.valor, frase: m.nombre + ' ' + m.valor };
    }
    var causa = typeof fila.causa === 'string' && fila.causa ? fila.causa : 'no measurement reported for this sprite yet';
    return { estado: 'NO_DATA', causa: causa, frase: 'NO_DATA (' + causa + ')' };
  }

  // The waves of a kind, scaled by the measured value. Only a measured value makes a sound.
  function ondas(tabla, valor) {
    return tabla.map(function (h) { return [h[0], Math.round(h[1] * valor / 100), h[2], h[3]]; });
  }

  // marco(fila, t) → one state frame, under 1,024 UTF-8 bytes.
  function marco(fila, tipo, t) {
    var med = medida(fila);
    var frase = tipo.nombre + (fila.sintetico ? ' · SYNTHETIC' : '') + ' · ' + med.frase;
    var items = [{ o: 'ribbon', pts: HEX, closed: true, f: 'paper', s: 'ink', lw: 3 }];
    if (med.estado === 'MEDIDO') { items.push({ o: 'wave', x: 160, y: 70, sc: 0.4, h: ondas(tipo.tabla, med.valor), f: 'paper', s: 'ink' }); }
    return {
      v: 'preceptoros.bubble/1', id: fila.id, t: t, cv: [320, 96],
      atoms: [{ k: tipo.clave, r: frase, i: items }],
      bands: ['paper', 'ink', 'cyan'],
      change: [frase],
      sound: med.estado === 'MEDIDO' ? 'ok' : 'NO_DATA: ' + med.causa,
      soundCause: med.estado === 'MEDIDO' ? '' : med.causa
    };
  }

  // catalogo(estado) → the frames of the living rows, sorted by id. estado = { t?, filas: [{ id, tipo, vivo?, sintetico?, medida?, causa? }] }.
  // A row with vivo === false is not drawn: a fallen sprite leaves, with no error panel and no placeholder.
  function catalogo(estado) {
    var e = estado || {};
    var filas = Array.isArray(e.filas) ? e.filas : [];
    var t = Number.isInteger(e.t) ? e.t : 0;
    var out = filas.filter(function (fila) { return fila && fila.vivo !== false; }).map(function (fila) {
      if (typeof fila.id !== 'string' || fila.id === '') { throw orphan(fila, 'row without id'); }
      var frame = marco(fila, tipoDe(fila), t);
      var problemas = F.valida(frame);
      if (problemas.length) { throw new Error('frame_law: ' + fila.id + ' · ' + problemas.join('; ')); }
      return frame;
    });
    out.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    return Object.freeze(out.map(Object.freeze));
  }

  var AtlasCatalogoIso = { TIPOS: TIPOS, CLAVES: CLAVES, tipoDe: tipoDe, medida: medida, catalogo: catalogo };
  if (common) { module.exports = AtlasCatalogoIso; }
  else { root.AtlasCatalogoIso = AtlasCatalogoIso; }
})(this);
