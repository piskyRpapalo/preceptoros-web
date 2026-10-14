/* WEB · TOUR tras radio. Descriptores del MISMO PASOS; las pantallas aportan el guion y las acciones. */
(function (raiz) {
  'use strict';
  var TIPOS = ['boya', 'observatorio', 'lapidas', 'cristal', 'coral'];
  function extiende(pasos, leerHechos) {
    var S = raiz.AtlasScreenScript || (typeof module === 'object' && module.exports ? require('./screen-script.js') : null);
    function agrega(tipo, id) {
      var clave = 'tour-' + tipo + '-' + id;
      if (pasos.some(function (p) { return p.id === clave; })) { return; }
      pasos.push({ id: clave, tour: true, accion: tipo === 'place' ? 'inspect-place' : 'open-panel', titulo: id,
        haz: 'Use this screen\'s real action, or skip this stop.', porque: 'Read the same measured script as the screen.',
        canon: 'FIRMO 2026-10-13 · tour extends the six measured genesis actions',
        sonido: 'NO_DATA (read the sound declaration in the shared script)', coord: 'read the coordinate in the shared script',
        lee: function () { return tipo === 'place' ? S.lugar(id) : S.menu(id); },
        mide: function () { return leerHechos(clave); }, hecho: function (b, v) { return v > 0; } });
    }
    if (!S) { return pasos; }
    TIPOS.forEach(function (t) { agrega('place', t); });
    S.menuIDs().filter(function (id) { return id !== 'pliego-tutorial'; }).forEach(function (id) { agrega('menu', id); });
    return pasos;
  }
  function actua(modelo) {
    var a = modelo.actions && modelo.actions[0];
    if (!a || a.disabled) { return { cause: a && a.reason || 'NO_DATA (this screen has no available action)', next: modelo.next }; }
    if (a.id === 'menu') { return a.run(); }
    var C = raiz.AtlasPlaceCards;
    return C ? C.ejecuta(a) : { cause: 'NO_DATA (the place action reader is not loaded)', next: modelo.next };
  }
  var A = { extiende: extiende, actua: actua };
  if (typeof module === 'object' && module.exports) { module.exports = A; } else { raiz.AtlasTour = A; }
})(this);
