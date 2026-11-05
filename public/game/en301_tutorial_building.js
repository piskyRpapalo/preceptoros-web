(function (root) {
  'use strict';
  var node = typeof module === 'object' && !!module.exports;
  var D = node ? require('./deploy_building.js') : root.AtlasDeployBuilding;
  var E = node ? require('./etiqueta.js') : root.AtlasEtiqueta;
  function absent(cause) { return { dato: 'NO_DATA', causa: cause }; }
  function measure(name, source) {
    var d = arguments.length > 1 ? source : D;
    if (!d || typeof d.measurements !== 'function' || !E) { return absent('Building measurement or label module unavailable.'); }
    var m;
    try { m = d.measurements(name); } catch (e) { return absent('Building measurement failed.'); }
    if (!m || m.sello === 'NO_DATA') { return absent(m && m.causa || 'Building measures unavailable.'); }
    if (typeof m.base !== 'string' || !Array.isArray(m.tiles) || m.tiles.length !== 2 ||
        !m.tiles.every(Number.isSafeInteger) || m.tiles[0] < 1 || m.tiles[1] < m.tiles[0] ||
        !Number.isSafeInteger(m.touch_px) || m.touch_px < 44 ||
        !Number.isSafeInteger(m.piece_ceiling_b) || m.piece_ceiling_b < 1) {
      return absent('Building measures invalid.');
    }
    var result = E.etiqueta({ title: 'First ' + m.base,
      rag_base_prompt: 'Explain these building contract measures. Placement requires human approval; node memory and contrast are not measured.',
      source: 'deploy_building.measurements', building: m.base, deployment: 'PROPOSED', authority: false,
      mesuras: { tiles: m.tiles.slice(), touch_px: m.touch_px, piece_ceiling_b: m.piece_ceiling_b },
      ram: m.ram || { sello: 'NO_DATA', causa: 'Node memory not measured.' },
      contrast: m.contrast || { sello: 'NO_DATA', causa: 'Contrast not measured.' } });
    if (!result.ok || result.bytes >= 1024) { return absent('Building label must be below 1024 UTF-8 bytes.'); }
    return { dato: 'medido', etiqueta: result.texto, bytes: result.bytes };
  }
  function measured(text) {
    try {
      var label = JSON.parse(text), expected = measure(label.building);
      if (expected.dato !== 'medido') { return false; }
      var base = JSON.parse(expected.etiqueta);
      return ['source', 'building', 'deployment', 'authority', 'mesuras', 'ram', 'contrast'].every(function (key) {
        return JSON.stringify(label[key]) === JSON.stringify(base[key]);
      });
    } catch (e) { return false; }
  }
  var api = { measure: measure, measured: measured };
  if (node) { module.exports = api; } else { root.En301TutorialBuilding = api; }
})(this);
