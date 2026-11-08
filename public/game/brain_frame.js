// Static model-catalogue projection. It reports only declared fields; live residency and
// undeclared model structure stay NO_DATA. The shape and frame law come from state_frames.js.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var F = common ? require('./state_frames.js') : root.AtlasStateFrames;
  // N4: the frame carries its own sha256 (canon.js loads after this file in the page, so look it up when called).
  function K() { return common ? require('./canon.js') : root.AtlasCanon; }
  // The same cause the app console declares (consola.CAUSA_RESIDENTE), in ASCII so the canon stays small.
  var CAUSA_RESIDENTE = 'knowing it needs the Ollama socket API and D68 forbids that in the product';

  function refuse(cause) { return { ok: false, cause: cause }; }
  function project(catalog) {
    if (!catalog || catalog.esquema !== 1 || !Array.isArray(catalog.cerebros)) {
      return refuse('catalogue schema or model list is unavailable');
    }
    var seen = Object.create(null), frames = [];
    for (var i = 0; i < catalog.cerebros.length; i++) {
      var model = catalog.cerebros[i];
      if (!model || typeof model.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(model.id) || seen[model.id]) {
        return refuse('model id is missing, invalid or repeated');
      }
      seen[model.id] = true;
      var door = typeof model.puerta === 'boolean' ? (model.puerta ? 'yes' : 'no') : 'NO_DATA (field absent)';
      var signature = typeof model.firmado === 'boolean' ? (model.firmado ? 'signed' : 'unsigned') : 'NO_DATA (field absent)';
      var sentence = 'model ' + model.id + ' · door ' + door + ' · signature ' + signature +
        ' · base NO_DATA (not separately declared) · adapter NO_DATA (not declared) · permissions NO_DATA (not declared)' +
        ' · requires signature NO_DATA (not declared) · residency NO_DATA (CAUSA_RESIDENTE)';
      var frame = F.stateFrame({ id: 'brain-' + model.id, sentence: sentence });
      frame.seal = 'NO_DATA';
      frame.atoms[0].k = 'NO_DATA';
      frame.change = ['residency'];
      frame.bands = ['NO_DATA.base', 'NO_DATA.contorno'];
      frame.atoms[0].i[0].f = 'NO_DATA.base';
      frame.atoms[0].i[0].s = 'NO_DATA.contorno';
      frame.sound = 'NO_DATA: model frames declare no measured harmonic table';
      frame.soundCause = 'no harmonic table in this catalogue';
      frame.residencia = 'NO_DATA';
      frame.causa = { CAUSA_RESIDENTE: CAUSA_RESIDENTE };
      frame.sha256 = K().sha(K().canon(frame));   // sha256 of the canon of every field above; same hex in the app
      if (F.valida(frame).length) { return refuse('model frame breaks the Acho frame law'); }
      frames.push(frame);
    }
    frames.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    return { ok: true, frames: frames };
  }
  var api = Object.freeze({ project: project, CAUSA_RESIDENTE: CAUSA_RESIDENTE });
  if (common) { module.exports = api; } else { root.AtlasCerebroFrame = api; }
})(typeof globalThis === 'object' ? globalThis : this);
