/* preceptoros.org · theGame · EL CICLO DE VIDA DE UN EDIFICIO DEL ARRECIFE (los 9 objetos, FIRMO 2026-10-12).

   «Los 9 objetos nacen con TIEMPO y COMBATE adheridos de nacimiento». Este modulo es la parte de TIEMPO, comun a los nueve:
   el estado de un edificio es una FUNCION PURA de (su manifiesto, el tic de la partida). Nada se guarda aparte, nada usa el
   reloj de pared: el mismo tic da el mismo edificio en cualquier aparato (replay-safe).

   - EDAD en tics desde `nace_tic`. FASE: naciendo (los primeros `madura_tics`) -> vivo -> gastado -> NO_DATA.
   - DESGASTE: lo desatendido se DESPINTA. Crece con los tics desde el ultimo cuidado (`cuidado_tic`), a `desgaste_por_tic`
     por mil; al llegar a mil, el edificio es NO_DATA con su causa («desatendido N tics»). Lo caducado (`caduca_tic`) tambien:
     «caducado», nunca «0». La degradacion es el dato, no el bug.
   - COLOR ∇C (la telemetria, no la decoracion): Hue = vida/recurso (vida alta: verde; baja: rojo), Saturation = carga de
     computo (lo que el edificio esta haciendo, por mil), Lightness = escudo (su defensa declarada, por mil). El lab lee el
     VECTOR (`vector()`), no los pixeles.
   - COMBATE adherido: el manifiesto DECLARA su defensa (`escudo`) y si admite emboscada; el combate ondulatorio lo lee de aqui.

   Manifiesto (`preceptoros.edificio/1`): { esquema, id, tipo, col, fila, huella, nace_tic, madura_tics, desgaste_por_tic,
   cuidado_tic?, caduca_tic?, carga?, escudo?, emboscable? }. Enteros. Sin red, sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  var ESQUEMA = 'preceptoros.edificio/1';
  var TIPOS = ['boya', 'observatorio', 'lapidas', 'cristal', 'botella', 'monumento', 'vivero', 'baliza', 'nombres'];

  function entero(v, min, max) { return typeof v === 'number' && Math.floor(v) === v && v >= min && v <= max; }
  /* La forma del manifiesto, o la causa por la que no vale (NO_DATA con causa, nunca un edificio a medias). */
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
  /* El estado en el tic t. Devuelve { fase, edad, desgaste (por mil), vida (por mil), causa? }. */
  function estado(m, t) {
    var mal = valida(m);
    if (mal) { return { fase: 'NO_DATA', causa: 'manifiesto: ' + mal }; }
    if (!entero(t, 0, 1e9)) { return { fase: 'NO_DATA', causa: 'tic sin medir' }; }
    if (t < m.nace_tic) { return { fase: 'NO_DATA', causa: 'aun no ha nacido (tic ' + m.nace_tic + ')' }; }
    var edad = t - m.nace_tic;
    if (m.caduca_tic != null && t >= m.caduca_tic) { return { fase: 'NO_DATA', edad: edad, causa: 'caducado en el tic ' + m.caduca_tic }; }
    var sin = t - (m.cuidado_tic != null ? m.cuidado_tic : m.nace_tic), desgaste = Math.min(1000, sin * m.desgaste_por_tic);
    if (desgaste >= 1000) { return { fase: 'NO_DATA', edad: edad, desgaste: 1000, vida: 0, causa: 'desatendido ' + sin + ' tics' }; }
    var fase = edad < m.madura_tics ? 'naciendo' : (desgaste >= 600 ? 'gastado' : 'vivo');
    return { fase: fase, edad: edad, desgaste: desgaste, vida: 1000 - desgaste };
  }
  /* ∇C: el color ES la telemetria. Hue 0 (rojo) .. 130 (verde) por la vida; Saturation por la carga; Lightness por el escudo.
     Lo NO_DATA no tiene color: gris y translucido (se pinta como niebla, no como dato). */
  function color(m, t) {
    var e = estado(m, t);
    if (e.fase === 'NO_DATA') { return { h: 0, s: 0, l: 45, a: 0.45, nd: true }; }
    var carga = m.carga != null ? m.carga : 0, escudo = m.escudo != null ? m.escudo : 0;
    return { h: Math.round(e.vida * 130 / 1000), s: 25 + Math.round(carga * 60 / 1000), l: 38 + Math.round(escudo * 30 / 1000), a: e.fase === 'naciendo' ? 0.7 : 1, nd: false };
  }
  /* El VECTOR que lee el lab: compacto, entero, sin texto libre (salvo la causa de un NO_DATA). */
  function vector(m, t) {
    var e = estado(m, t), c = color(m, t);
    return { id: m && m.id, tipo: m && m.tipo, col: m && m.col, fila: m && m.fila, huella: m && m.huella, fase: e.fase, edad: e.edad == null ? null : e.edad,
             vida: e.vida == null ? null : e.vida, carga: m && m.carga != null ? m.carga : null, escudo: m && m.escudo != null ? m.escudo : null,
             hsl: c.nd ? null : [c.h, c.s, c.l], causa: e.causa || null };
  }
  /* Cuidar (una accion del jugador, que se firma fuera): devuelve un manifiesto NUEVO con el cuidado en el tic t. Puro. */
  function cuida(m, t) { var n = JSON.parse(JSON.stringify(m)); n.cuidado_tic = Math.max(t, n.nace_tic); return n; }

  var ReefBuildingLifecycle = { ESQUEMA: ESQUEMA, TIPOS: TIPOS, valida: valida, estado: estado, color: color, vector: vector, cuida: cuida };
  if (typeof module === 'object' && module.exports) { module.exports = ReefBuildingLifecycle; } else { raiz.ReefBuildingLifecycle = ReefBuildingLifecycle; }
})(this);
