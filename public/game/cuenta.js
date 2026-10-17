
(function (raiz) {
  'use strict';

  var HEX64 = /^[0-9a-f]{64}$/, MAESTRO = 'nodo.0.hexelion';

  function estadoNodo(c) {
    var ms = (c && c.aparato && c.aparato.medidas) || {};
    var fechas = Object.keys(ms).filter(function (k) { return ms[k].estado === 'MEDIDO' && ms[k].fecha; })
      .map(function (k) { return ms[k].fecha; }).sort();
    return {
      nodo: c && c.nodo, medidas: fechas.length,
      activo: fechas.length ? 'DECLARADO' : 'NO_DATA',
      desde: fechas.length ? fechas[fechas.length - 1] : null,
      latido: 'NO_DATA'
    };
  }

  function cuentaMaestra(C, publica) {
    if (typeof publica !== 'string' || !HEX64.test(publica)) { throw new Error('publica: 64 hex'); }
    var cu = (C && C.cuentas || []).filter(function (x) { return x.nodo === MAESTRO; })[0];
    var ced = cu && C.nodos.filter(function (n) { return n.nodo === MAESTRO; })[0];
    if (!ced || !HEX64.test(ced.sha256 || '')) { throw new Error('sin la cedula de ' + MAESTRO); }
    return { esquema: 'preceptoros.cuenta-maestra/1', cuenta: cu.cuenta, nodo: MAESTRO, cedula_sha: ced.sha256,
             une: ['app-local', 'lab', 'web'], publica: publica, estado: 'PROPUESTA', firma: null };
  }

  var AtlasCuenta = { estadoNodo: estadoNodo, cuentaMaestra: cuentaMaestra, MAESTRO: MAESTRO };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCuenta; }
  else { raiz.AtlasCuenta = AtlasCuenta; }
})(this);
