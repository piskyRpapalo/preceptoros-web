(function (raiz) {
  'use strict';
  var ESQUEMA = 'preceptoros.edificio/1';
  var TIPOS = ['boya', 'observatorio', 'lapidas', 'cristal', 'botella', 'monumento', 'vivero', 'baliza', 'nombres'];

  function entero(v, min, max) { return typeof v === 'number' && Math.floor(v) === v && v >= min && v <= max; }
    function valida(m) {
    if (!m || m.esquema !== ESQUEMA) { return 'esquema'; }
    if (TIPOS.indexOf(m.tipo) < 0) { return 'tipo'; }
    if (typeof m.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(m.id)) { return 'id'; }
    if (!entero(m.col, -9999, 9999) || !entero(m.fila, -9999, 9999)) { return 'celda'; }
    if (!entero(m.huella, 1, 4)) { return 'huella'; }
    if (!entero(m.nace_tic, 0, 1e9) || !entero(m.madura_tics, 0, 1e6) || !entero(m.desgaste_por_tic, 0, 1000)) { return 'tiempo'; }
    if (m.caduca_tic != null && !entero(m.caduca_tic, m.nace_tic, 1e9)) { return 'caducidad'; }
    if (m.cuidado_tic != null && !entero(m.cuidado_tic, m.nace_tic, 1e9)) { return 'cuidado'; }
    if (m.carga != null && !entero(m.carga, 0, 1000)) { return 'carga'; }
    if (m.escudo != null && !entero(m.escudo, 0, 1000)) { return 'escudo'; }
    return '';
  }
    function estado(m, t) {
    var mal = valida(m);
    if (mal) { return { fase: 'NO_DATA', causa: 'manifest: ' + mal }; }
    if (!entero(t, 0, 1e9)) { return { fase: 'NO_DATA', causa: 'cycle not measured' }; }
    if (t < m.nace_tic) { return { fase: 'NO_DATA', causa: 'not born yet (cycle ' + m.nace_tic + ')' }; }
    var edad = t - m.nace_tic;
    if (m.caduca_tic != null && t >= m.caduca_tic) { return { fase: 'NO_DATA', edad: edad, causa: 'expired at cycle ' + m.caduca_tic }; }
    var sin = t - (m.cuidado_tic != null ? m.cuidado_tic : m.nace_tic), desgaste = Math.min(1000, sin * m.desgaste_por_tic);
    if (desgaste >= 1000) { return { fase: 'NO_DATA', edad: edad, desgaste: 1000, vida: 0, causa: 'unattended ' + sin + ' cycles' }; }
    var fase = edad < m.madura_tics ? 'naciendo' : (desgaste >= 600 ? 'gastado' : 'vivo');
    return { fase: fase, edad: edad, desgaste: desgaste, vida: 1000 - desgaste };
  }
    function color(m, t) {
    var e = estado(m, t);
    if (e.fase === 'NO_DATA') { return { h: 0, s: 0, l: 45, a: 0.45, nd: true }; }
    var carga = m.carga != null ? m.carga : 0, escudo = m.escudo != null ? m.escudo : 0;
    return { h: Math.round(e.vida * 130 / 1000), s: 25 + Math.round(carga * 60 / 1000), l: 38 + Math.round(escudo * 30 / 1000), a: e.fase === 'naciendo' ? 0.7 : 1, nd: false };
  }
    function vector(m, t) {
    var e = estado(m, t), c = color(m, t);
    return { id: m && m.id, tipo: m && m.tipo, col: m && m.col, fila: m && m.fila, huella: m && m.huella, fase: e.fase, edad: e.edad == null ? null : e.edad,
             vida: e.vida == null ? null : e.vida, carga: m && m.carga != null ? m.carga : null, escudo: m && m.escudo != null ? m.escudo : null,
             hsl: c.nd ? null : [c.h, c.s, c.l], causa: e.causa || null };
  }
    function cuida(m, t) { var n = JSON.parse(JSON.stringify(m)); n.cuidado_tic = Math.max(t, n.nace_tic); return n; }

  var ReefBuildingLifecycle = { ESQUEMA: ESQUEMA, TIPOS: TIPOS, valida: valida, estado: estado, color: color, vector: vector, cuida: cuida };
  if (typeof module === 'object' && module.exports) { module.exports = ReefBuildingLifecycle; } else { raiz.ReefBuildingLifecycle = ReefBuildingLifecycle; }
})(this);
