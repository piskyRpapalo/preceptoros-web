/* WEB · Shell Schematics: imports a building manifest as a local preview. */
(function (root) {
  'use strict';
  var MOD = typeof module === 'object' && module.exports;
  var LIFE = MOD ? require('./reef_building_lifecycle.js') : root.ReefBuildingLifecycle;
  var REQUIRED = ['esquema', 'id', 'tipo', 'col', 'fila', 'huella', 'nace_tic', 'madura_tics', 'desgaste_por_tic'];
  var OPTIONAL = ['cuidado_tic', 'caduca_tic', 'carga', 'escudo', 'emboscable'];
  var ORDER = REQUIRED.concat(OPTIONAL);
  function falla(causa) { return { ok: false, causa: 'NO_DATA (' + causa + ')' }; }
  function forma(v, tipo) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) { return 'manifest is not an object'; }
    var keys = Object.keys(v);
    if (keys.some(function (k) { return ORDER.indexOf(k) < 0; })) { return 'manifest contains an unknown field'; }
    if (REQUIRED.some(function (k) { return !Object.prototype.hasOwnProperty.call(v, k); })) { return 'manifest is missing a required field'; }
    if (v.tipo !== tipo) { return 'manifest type does not match this building'; }
    if (v.emboscable != null && typeof v.emboscable !== 'boolean') { return 'manifest field emboscable is invalid'; }
    if (!LIFE) { return 'building lifecycle validator is not loaded'; }
    return LIFE.valida(v) || '';
  }
  function bytes(s) { return new TextEncoder().encode(s).length; }
  function ordena(v) {
    var o = {};
    ORDER.forEach(function (k) { if (Object.prototype.hasOwnProperty.call(v, k)) { o[k] = v[k]; } });
    return o;
  }
  function exporta(v) {
    var causa = forma(v, v && v.tipo);
    if (causa) { return falla(causa); }
    var texto = JSON.stringify(ordena(v));
    return bytes(texto) <= 16384 ? { ok: true, texto: texto } : falla('manifest exceeds 16 KiB');
  }
  function importa(texto, tipo) {
    if (typeof texto !== 'string') { return falla('file content is not text'); }
    if (bytes(texto) > 16384) { return falla('file exceeds 16 KiB'); }
    var v;
    try { v = JSON.parse(texto); } catch (e) { return falla('invalid JSON'); }
    var causa = forma(v, tipo);
    return causa ? falla(causa) : { ok: true, valor: ordena(v) };
  }
  function monta(parent, manifest) {
    if (!parent || !root.document) { return; }
    var D = root.document, section = D.createElement('section'); section.className = 'shell-schematics'; section.setAttribute('aria-label', 'Shell Schematics');
    var h = D.createElement('h3'); h.textContent = 'Shell Schematics'; section.appendChild(h);
    var status = D.createElement('p'); status.className = 'shell-schematics-status'; status.setAttribute('role', 'status');
    var b = D.createElement('button'); b.type = 'button'; b.className = 'boton-sec'; b.textContent = 'Export buoy structure'; b.title = 'Export the measured buoy structure'; b.setAttribute('aria-label', b.textContent); b.style.minHeight = '44px';
    b.addEventListener('click', function () {
      var e = exporta(manifest);
      if (!e.ok) { status.textContent = e.causa; return; }
      var u = root.URL.createObjectURL(new Blob([e.texto], { type: 'application/json' })), a = D.createElement('a');
      a.href = u; a.download = 'shell-structure.json'; a.click(); root.setTimeout(function () { root.URL.revokeObjectURL(u); }, 0);
      status.textContent = 'Exported measured structure · ' + manifest.tipo + ' · preview only';
    });
    section.appendChild(b);
    var label = D.createElement('button'); label.type = 'button'; label.className = 'boton-sec'; label.textContent = 'Import shell structure'; label.title = 'Import a measured building structure for preview'; label.style.minHeight = '44px';
    var input = D.createElement('input'); input.type = 'file'; input.accept = '.json,application/json'; input.setAttribute('aria-label', 'Import shell structure');
    input.style.position = 'absolute'; input.style.width = '1px'; input.style.height = '1px'; input.style.clip = 'rect(0 0 0 0)'; input.tabIndex = -1;
    label.addEventListener('click', function () { input.click(); }); section.appendChild(label); section.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0]; if (!file) { return; }
      if (file.size > 16384) { status.textContent = falla('file exceeds 16 KiB').causa; return; }
      file.text().then(function (text) {
        var r = importa(text, manifest.tipo);
        if (!r.ok) { status.textContent = r.causa; return; }
        status.textContent = 'Imported structure preview · ' + r.valor.tipo + ' · world (' + r.valor.col + ', ' + r.valor.fila + ') · cycle ' + r.valor.nace_tic + ' · not applied or saved';
      }).catch(function () { status.textContent = falla('file could not be read').causa; });
    });
    var note = D.createElement('p'); note.textContent = 'Imports are previews; the game state is not changed.'; section.appendChild(note);
    section.appendChild(status); parent.appendChild(section);
  }
  var API = { exporta: exporta, importa: importa, monta: monta, ESQUEMA: 'preceptoros.edificio/1', TOPE: 16384 };
  if (MOD) { module.exports = API; } else { root.AtlasShellSchematics = API; }
})(this);
