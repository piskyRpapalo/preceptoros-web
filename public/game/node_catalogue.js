// North N3 (2026-10-26): the public catalogue of node cards, read-only. Pure: it validates the registry's answer
// (aduana `preceptoros.catalogo-cedulas/1`) and renders it as text; it has no network of its own. A row carries exactly
// five fields, so a device key can never be shown; test nodes (91xx-93xx, "-test") are dropped as a second fence.
(function (root) {
  'use strict';
  var NODE = /^nodo\.[0-9]{1,6}\.[a-z0-9][a-z0-9-]{0,30}$/, HEX = /^[0-9a-f]{64}$/, FECHA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  var CAMPOS = ['causa', 'estado', 'nodo', 'recibido', 'recibo_sha256'], ESTADOS = ['pendiente', 'verificado'];
  var PRUEBA = /^nodo\.9[1-3][0-9]{2}\.|-test$/;
  function fila(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).sort().join() !== CAMPOS.join()) { return 'fields'; }
    if (!NODE.test(r.nodo) || ESTADOS.indexOf(r.estado) < 0 || !HEX.test(r.recibo_sha256) || !FECHA.test(r.recibido)) { return 'shape'; }
    if (r.estado === 'pendiente' ? typeof r.causa !== 'string' || !r.causa : r.causa !== null) { return 'cause'; }
    return '';
  }
  // Returns { ok, filas, descartadas } or { ok:false, code }. One bad row rejects the whole answer: a catalogue that
  // carries a key is not shown in part.
  function lee(c) {
    if (!c || typeof c !== 'object' || c.esquema !== 'preceptoros.catalogo-cedulas/1' || c.solo_lectura !== true || !Array.isArray(c.cedulas)) { return { ok: false, code: 'schema' }; }
    for (var i = 0; i < c.cedulas.length; i++) { var m = fila(c.cedulas[i]); if (m) { return { ok: false, code: m }; } }
    var filas = c.cedulas.filter(function (r) { return !PRUEBA.test(r.nodo); });
    return { ok: true, filas: filas, descartadas: c.cedulas.length - filas.length };
  }
  function pinta(tbody, filas, doc) {
    tbody.textContent = '';
    filas.forEach(function (r) {
      var tr = doc.createElement('tr');
      [r.nodo, r.estado === 'verificado' ? 'Verified' : 'Pending', r.causa === null ? '' : r.causa, r.recibido.slice(0, 10), r.recibo_sha256.slice(0, 12)].forEach(function (v) {
        var td = doc.createElement('td'); td.textContent = v; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
  var api = Object.freeze({ lee: lee, pinta: pinta, CAMPOS: CAMPOS });
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasNodeCatalogue = api; }
})(this);
